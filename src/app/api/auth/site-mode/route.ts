import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser, applySessionCookie, signSessionToken } from '@/lib/auth';

const siteModeSchema = z.object({
  siteMode: z.enum(['mainstream', 'adult', 'both']),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = siteModeSchema.parse(body);

    const user = await db.user.update({
      where: { id: session.id },
      data: { siteMode: validated.siteMode },
      select: { id: true, email: true, name: true, role: true, siteMode: true },
    });

    // Re-issue the session so the JWT carries the new mode.
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteMode: user.siteMode as 'mainstream' | 'adult' | 'both',
    });

    const response = NextResponse.json({
      message: 'Site mode updated',
      siteMode: user.siteMode,
    });

    return applySessionCookie(response, token);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update site mode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}