import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adService } from '@/lib/services/ad-service';
import { z } from 'zod';

const completeLoginSchema = z.object({
  sessionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = completeLoginSchema.parse(body);

    // Get session status
    const sessionResult = await adService.getSessionStatus(validatedData.sessionId);
    
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 400 }
      );
    }

    const session = sessionResult.session;

    // Check if session is for login purpose
    if (session.purpose !== 'LOGIN') {
      return NextResponse.json(
        { error: 'Session is not for login' },
        { status: 400 }
      );
    }

    // Check if session is completed (all ads watched)
    if (!session.completed) {
      return NextResponse.json(
        { error: 'Please complete watching all required ads' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: session.sessionId.split('_')[1] }, // Extract userId from sessionId
      include: {
        profile: true,
        verification: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mark session as completed (already done by ad service)
    await db.adSession.update({
      where: { sessionId: validatedData.sessionId },
      data: { status: 'COMPLETED' }
    });

    // In a real implementation, you would:
    // 1. Generate and return a JWT token
    // 2. Set secure HTTP-only cookies
    // 3. Implement proper session management

    // For demo purposes, we'll return user data
    // In production, never return sensitive data like password hash
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login completed successfully! Welcome to Proximity.',
      loginCompleted: true,
      user: {
        ...userWithoutPassword,
        profile: user.profile ? {
          ...user.profile,
          // Don't return sensitive profile data if needed
        } : null,
      },
      // In production, return JWT token here
      token: 'demo-token-' + user.id, // Replace with real JWT
      sessionStats: {
        adsWatched: session.adsWatched,
        creditsEarned: session.adsWatched * 0.50, // Example calculation
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Complete login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}