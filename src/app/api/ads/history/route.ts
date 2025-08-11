import { NextRequest, NextResponse } from 'next/server';
import { adService } from '@/lib/services/ad-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await adService.getUserAdHistory(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      history: {
        totalSessions: result.totalSessions,
        totalAdsWatched: result.totalAdsWatched,
        totalEarnings: result.totalEarnings,
        recentSessions: result.recentSessions
      }
    });

  } catch (error) {
    console.error('Get user ad history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}