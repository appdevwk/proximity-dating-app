import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { requiresVerification, verificationRequiredResponse } from '@/lib/verification';
import { z } from 'zod';
import type { Conversation, ConversationUser, MessageOut } from '@/lib/types';

const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

export async function GET() {
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
    });

    const otherIds = matches.map((match) =>
      match.user1.id === session.id ? match.user2.id : match.user1.id
    );

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: session.id, receiverId: { in: otherIds } },
          { receiverId: session.id, senderId: { in: otherIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const lastByOther = new Map<string, MessageOut>();
    const unreadByOther = new Map<string, number>();
    for (const message of messages) {
      const otherId = message.senderId === session.id ? message.receiverId : message.senderId;
      if (!lastByOther.has(otherId)) {
        lastByOther.set(otherId, {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          isRead: message.isRead,
          createdAt: message.createdAt.toISOString(),
        });
      }
      if (message.receiverId === session.id && !message.isRead) {
        unreadByOther.set(otherId, (unreadByOther.get(otherId) ?? 0) + 1);
      }
    }

    const conversations: Conversation[] = matches.map((match) => {
      const other = match.user1.id === session.id ? match.user2 : match.user1;
      const user: ConversationUser = {
        userId: other.id,
        displayName: other.profile?.displayName ?? other.id,
        profilePicture: other.profile?.profilePicture ?? null,
        userVerified: other.ageVerified,
      };
      return {
        user,
        matchedAt: match.createdAt.toISOString(),
        lastMessage: lastByOther.get(other.id) ?? null,
        unreadCount: unreadByOther.get(other.id) ?? 0,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const validated = sendMessageSchema.parse(body);

    if (validated.receiverId === session.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });
    }

    const receiver = await db.user.findUnique({
      where: { id: validated.receiverId },
      include: { profile: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (receiver.isBanned) {
      return NextResponse.json({ error: 'This user is unavailable' }, { status: 403 });
    }

    // You can only message someone you matched with.
    const pair = session.id < validated.receiverId
      ? [session.id, validated.receiverId]
      : [validated.receiverId, session.id];
    const [u1, u2] = pair as [string, string];

    const match = await db.match.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!match || match.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'You can only message users you have matched with' },
        { status: 403 }
      );
    }

    const message = await db.message.create({
      data: {
        content: validated.content,
        senderId: session.id,
        receiverId: validated.receiverId,
      },
    });

    const messageOut: MessageOut = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    };

    const user: ConversationUser = {
      userId: receiver.id,
      displayName: receiver.profile?.displayName ?? receiver.email,
      profilePicture: receiver.profile?.profilePicture ?? null,
      userVerified: receiver.ageVerified,
    };

    return NextResponse.json({ message: messageOut, user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}