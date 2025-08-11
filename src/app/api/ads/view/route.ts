import { NextRequest, NextResponse } from 'next/server';
import { adService } from '@/lib/services/ad-service';
import { z } from 'zod';

const recordViewSchema = z.object({
  sessionId: z.string(),
  adId: z.string(),
  adProvider: z.string(),
  adType: z.enum(['VIDEO', 'INTERSTITIAL', 'BANNER', 'REWARDED', 'PLAYABLE']),
  duration: z.number().min(1),
  reward: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = recordViewSchema.parse(body);

    const result = await adService.recordAdView(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Ad view recorded successfully',
      view: {
        sessionCompleted: result.sessionCompleted,
        creditsEarned: result.creditsEarned,
        totalAdsWatched: result.totalAdsWatched
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Record ad view error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}