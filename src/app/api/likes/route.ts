import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ageFromDateOfBirth } from '@/lib/geo';
import { requiresVerification, verificationRequiredResponse } from '@/lib/verification';
import { Prisma } from '@prisma/client';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await db.user.findUnique({
      where: { id: session.id },
      select: { ageDeclarationConfirmed: true, termsAccepted: true, photoVerified: true },
    });
    if (!me || requiresVerification(me)) {
      return verificationRequiredResponse();
    }

    // "See who liked you" is a paid tier perk. Premium = any ACTIVE or
    // PAST_DUE cross-post subscription (consistent with /api/crosspost/status).
    const activeSub = await db.crossPostSubscription.findFirst({
      where: { userId: session.id, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      select: { id: true },
    });
    const premium = Boolean(activeSub);

    // Incoming likes: matches where the OTHER user liked/super-liked me and
    // I have not acted yet — mirrors the likesReceived stat in /api/user/me.
    const incomingLikeFilter: Prisma.MatchWhereInput = {
      OR: [
        { user1Id: session.id, user1Action: null, user2Action: { in: ['LIKED', 'SUPER_LIKED'] } },
        { user2Id: session.id, user2Action: null, user1Action: { in: ['LIKED', 'SUPER_LIKED'] } },
      ],
    };

    const count = await db.match.count({ where: incomingLikeFilter });

    if (!premium) {
      return NextResponse.json({ premium: false, count });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '20') || 20, 50);

    const matches = await db.match.findMany({
      where: incomingLikeFilter,
      include: {
        user1: { select: { id: true, ageVerified: true, profile: true } },
        user2: { select: { id: true, ageVerified: true, profile: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const likes = matches.map((match) => {
      const other = match.user1Id === session.id ? match.user2 : match.user1;
      const theirAction = match.user1Id === session.id ? match.user2Action : match.user1Action;
      const dob = other.profile?.dateOfBirth;
      return {
        userId: other.id,
        displayName: other.profile?.displayName ?? other.id,
        profilePicture: other.profile?.profilePicture ?? null,
        age: dob ? ageFromDateOfBirth(dob) : null,
        userVerified: other.ageVerified,
        superLike: theirAction === 'SUPER_LIKED',
        likedAt: match.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ premium: true, count, likes });
  } catch (error) {
    console.error('Likes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}