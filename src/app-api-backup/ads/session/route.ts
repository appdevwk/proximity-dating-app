import { NextRequest, NextResponse } from 'next/server';
import { adService } from '@/lib/services/ad-service';
import { z } from 'zod';

const createSessionSchema = z.object({
  userId: z.string(),
  purpose: z.enum(['LOGIN', 'PREMIUM_FEATURE', 'EXTRA_SWIPES', 'BOOST_PROFILE', 'SUPER_LIKE']),
  adsRequired: z.number().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const result = await adService.createAdSession(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Ad session created successfully',
      session: {
        sessionId: result.sessionId,
        adsRequired: result.adsRequired,
        adsWatched: result.adsWatched,
        completed: result.completed
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues || [] },
        { status: 400 }
      );
    }

    console.error('Create ad session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}