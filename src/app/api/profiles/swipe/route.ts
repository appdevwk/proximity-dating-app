import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, normalizeMatchPair } from '@/lib/auth';
import { z } from 'zod';

const VALID_ACTIONS = ['like', 'dislike', 'super_like'] as const;

const swipeSchema = z.object({
  targetProfileId: z.string().min(1),
  action: z.enum(VALID_ACTIONS),
});

type SwipeAction = (typeof VALID_ACTIONS)[number];

const ACTION_TO_ENUM: Record<SwipeAction, 'LIKED' | 'DISLIKED' | 'SUPER_LIKED'> = {
  like: 'LIKED',
  dislike: 'DISLIKED',
  super_like: 'SUPER_LIKED',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Accept the canonical shape { targetProfileId, action } and the
    // shorthand map shape { targetProfileId: "action" }.
    let parsed: { targetProfileId: string; action: SwipeAction };
    if (body.targetProfileId && body.action) {
      parsed = swipeSchema.parse(body);
    } else {
      const entries = Object.entries(body as Record<string, unknown>);
      const [targetProfileId, action] = entries[0] ?? [];
      parsed = swipeSchema.parse({ targetProfileId, action });
    }

    const targetProfile = await db.profile.findUnique({
      where: { id: parsed.targetProfileId },
      include: { user: true },
    });

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (targetProfile.userId === session.id) {
      return NextResponse.json({ error: 'You cannot swipe on yourself' }, { status: 400 });
    }

    if (targetProfile.user.isBanned) {
      return NextResponse.json({ error: 'This profile is unavailable' }, { status: 403 });
    }

    const pairAction = ACTION_TO_ENUM[parsed.action];
    const [user1Id, user2Id] = normalizeMatchPair(session.id, targetProfile.userId);

    const existingMatch = await db.match.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
    });

    let match;
    if (!existingMatch) {
      match = await db.match.create({
        data: {
          user1Id,
          user2Id,
          user1Action: user1Id === session.id ? pairAction : null,
          user2Action: user2Id === session.id ? pairAction : null,
          status: 'PENDING',
        },
      });
      return NextResponse.json({ match: formatMatch(match), isNewMatch: false });
    }

    const myActionField = existingMatch.user1Id === session.id ? 'user1Action' : 'user2Action';
    const otherAction = existingMatch.user1Id === session.id ? existingMatch.user2Action : existingMatch.user1Action;

    const isLike = pairAction === 'LIKED' || pairAction === 'SUPER_LIKED';
    const wasMutual = isLike && (otherAction === 'LIKED' || otherAction === 'SUPER_LIKED');

    match = await db.match.update({
      where: { id: existingMatch.id },
      data: {
        [myActionField]: pairAction,
        status: wasMutual ? 'ACCEPTED' : pairAction === 'DISLIKED' ? 'REJECTED' : existingMatch.status,
      },
    });

    return NextResponse.json({ match: formatMatch(match), isNewMatch: wasMutual });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Swipe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatMatch(match: {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
  user1Action: string | null;
  user2Action: string | null;
  createdAt: Date;
}) {
  return {
    id: match.id,
    user1Id: match.user1Id,
    user2Id: match.user2Id,
    status: match.status,
    user1Action: match.user1Action,
    user2Action: match.user2Action,
    createdAt: match.createdAt.toISOString(),
  };
}