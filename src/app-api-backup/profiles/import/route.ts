import { NextRequest, NextResponse } from 'next/server';
import { profileImportService } from '@/lib/services/profile-import-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, limit = 100 } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }

    const result = await profileImportService.importProfilesFromSource(source, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Successfully imported ${result.data?.length || 0} profiles from ${source}`,
    });

  } catch (error) {
    console.error('Error in profile import API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await profileImportService.getImportStats();
      return NextResponse.json(stats);
    }

    if (action === 'import-all') {
      const result = await profileImportService.importFromAllSources();
      return NextResponse.json(result);
    }

    if (action === 'scrape-web') {
      const result = await profileImportService.importFromPublicWeb();
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in profile import API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}