import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { adService } from '@/lib/services/ad-service';
import { z } from 'zod';

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

    // Check age verification
    if (!user.ageVerified) {
      return NextResponse.json({
        error: 'Age verification required',
        requiresAgeVerification: true,
        userId: user.id,
      }, { status: 403 });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Create ad session for login (requires 2 ads to watch)
    const adSessionResult = await adService.createAdSession({
      userId: user.id,
      purpose: 'LOGIN',
      adsRequired: 2
    });

    if (!adSessionResult.success) {
      return NextResponse.json(
        { error: 'Failed to create ad session' },
        { status: 500 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate and return a JWT token
    // 2. Set secure HTTP-only cookies
    // 3. Implement proper session management

    // For demo purposes, we'll return user data
    // In production, never return sensitive data like password hash
    const { password, ...userWithoutPassword } = user;

    // Return response indicating ad session is required for login
    return NextResponse.json({
      message: 'Credentials verified. Please watch 2 ads to complete login.',
      requiresAds: true,
      adSession: {
        sessionId: adSessionResult.sessionId,
        adsRequired: adSessionResult.adsRequired,
        adsWatched: adSessionResult.adsWatched,
        completed: adSessionResult.completed
      },
      user: {
        ...userWithoutPassword,
        profile: user.profile ? {
          ...user.profile,
          // Don't return sensitive profile data if needed
        } : null,
      },
      // In production, return JWT token here after ad completion
      // token: 'demo-token-' + user.id, // Replace with real JWT
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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