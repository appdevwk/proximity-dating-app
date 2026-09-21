import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { z } from 'zod';
import { sendEmail, passwordResetEmail, generateCode } from '@/lib/email';

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    // Always return the same message — don't leak which emails exist.
    if (user) {
      const resetCode = generateCode();
      const resetToken = crypto.createHash('sha256').update(resetCode).digest('hex');
      const expires = new Date(Date.now() + 30 * 60 * 1000);

      await db.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetTokenExpires: expires },
      });

      void sendEmail({
        to: user.email,
        subject: 'Reset your Proximity password',
        html: passwordResetEmail(user.name ?? 'friend', resetCode),
      }).catch(() => {});
    }

    return NextResponse.json({
      message: 'If that email is registered, a password reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}