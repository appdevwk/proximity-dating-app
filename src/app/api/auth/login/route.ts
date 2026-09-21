import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  applySessionCookie,
  signSessionToken,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      include: {
        profile: true,
        verification: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Account has been banned' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Registration already guarantees an 18+ date of birth. Upgrade legacy
    // accounts so everyone with valid credentials can get in.
    if (!user.ageVerified && user.profile) {
      await db.user.update({
        where: { id: user.id },
        data: { ageVerified: true }
      });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Issue a signed session cookie
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteMode: (user as { siteMode?: 'mainstream' | 'adult' | 'both' }).siteMode ?? 'both',
      emailVerified: user.emailVerified,
    });

    const { password, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Login successful. Welcome back to Proximity!',
      session: 'created',
      user: userWithoutPassword,
    });

    return applySessionCookie(response, token);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}