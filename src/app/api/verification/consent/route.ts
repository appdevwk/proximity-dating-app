import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import {
  TERMS_VERSION,
  clientIpFromRequest,
  toProfileVerificationStatus,
} from '@/lib/verification';
import { z } from 'zod';

export const runtime = 'nodejs';

const consentSchema = z.object({
  ageDeclaration: z.boolean().refine((val) => val === true, {
    message: 'You must confirm you are 18 or older',
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  }),
});

/**
 * Industry-standard consent endpoint: a member explicitly (re)confirms they
 * are 18+ and accepts the Terms of Service / Privacy Policy. The acceptance is
 * timestamped and the consenting IP is stored so the platform keeps an
 * auditable consent trail.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = consentSchema.parse(body);

    const consentIp = clientIpFromRequest(request);

    const user = await db.user.update({
      where: { id: session.id },
      data: {
        ageDeclarationConfirmed: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        consentIp,
      },
    });

    return NextResponse.json({
      message: 'Thank you. Your 18+ confirmation and Terms & Privacy acceptance have been recorded.',
      verification: toProfileVerificationStatus(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}