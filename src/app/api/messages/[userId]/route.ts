import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { requiresVerification, verificationRequiredResponse } from '@/lib/verification';
import type { ConversationUser, MessageOut } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;

    const other = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!other) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the match exists before exposing any message history.
    const pair = session.id < userId ? [session.id, userId] : [userId, session.id];
    const [u1, u2] = pair as [string, string];

    const match = await db.match.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!match || match.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'You can only view conversations with your matches' },
        { status: 403 }
      );
    }

    // Mark messages from the other user as read.
    await db.message.updateMany({
      where: { senderId: userId, receiverId: session.id, isRead: false },
      data: { isRead: true },
    });

    const history = await db.message.findMany({
      where: {
        OR: [
          { senderId: session.id, receiverId: userId },
          { senderId: userId, receiverId: session.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const messages: MessageOut[] = history.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    }));

    const user: ConversationUser = {
      userId: other.id,
      displayName: other.profile?.displayName ?? other.email,
      profilePicture: other.profile?.profilePicture ?? null,
      userVerified: other.ageVerified,
    };

    return NextResponse.json({ user, messages });
  } catch (error) {
    console.error('Message history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}