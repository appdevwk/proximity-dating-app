import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ageFromDateOfBirth } from '@/lib/geo';
import type { MatchSummary } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '10') || 10, 50);

    const matches = await db.match.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ user1Id: session.id }, { user2Id: session.id }],
      },
      include: {
        user1: { select: { id: true, ageVerified: true, profile: true } },
        user2: { select: { id: true, ageVerified: true, profile: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const summaries: MatchSummary[] = matches.map((match) => {
      const other = match.user1.id === session.id ? match.user2 : match.user1;
      const name = other.profile?.displayName ?? other.id;
      return {
        id: match.id,
        matchedAt: match.createdAt.toISOString(),
        user: {
          userId: other.id,
          displayName: name,
          profilePicture: other.profile?.profilePicture ?? null,
          userVerified: other.ageVerified,
        },
      };
    });

    return NextResponse.json({ matches: summaries });
  } catch (error) {
    console.error('Matches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}