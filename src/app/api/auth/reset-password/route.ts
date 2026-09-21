import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !user.passwordResetToken || !user.passwordResetTokenExpires) {
      return NextResponse.json({ error: 'No reset requested for this account' }, { status: 400 });
    }

    if (user.passwordResetTokenExpires.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    const token = crypto.createHash('sha256').update(parsed.data.code).digest('hex');
    if (user.passwordResetToken !== token) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
    });

    return NextResponse.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}