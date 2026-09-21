import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid 6-digit code is required' }, { status: 400 });
    }

    if (session.emailVerified) {
      return NextResponse.json({ message: 'Email already verified', verified: true });
    }

    const token = crypto.createHash('sha256').update(parsed.data.code).digest('hex');

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerifyToken || !user.emailVerifyTokenExpires) {
      return NextResponse.json({ error: 'No verification pending' }, { status: 400 });
    }

    if (user.emailVerifyTokenExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Code expired. Register again or contact support.' }, { status: 400 });
    }

    if (user.emailVerifyToken !== token) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyTokenExpires: null,
      },
      select: { id: true, email: true, emailVerified: true, emailVerifiedAt: true },
    });

    return NextResponse.json({ message: 'Email verified', verified: true, user: updated });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}