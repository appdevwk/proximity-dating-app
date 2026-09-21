import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TOTAL_FRAMES_BYTES = 12 * 1024 * 1024;

let verifyLivenessFn: ((frames: Buffer[], nonce: string, userId: string) => Promise<any>) | null = null;
let createChallengeFn: ((userId: string) => any) | null = null;

async function getVerifyLiveness() {
  if (!verifyLivenessFn) {
    const { verifyLiveness } = await import('@/lib/services/liveness');
    verifyLivenessFn = verifyLiveness;
  }
  return verifyLivenessFn!;
}

async function getCreateChallenge() {
  if (!createChallengeFn) {
    const { createLivenessChallenge } = await import('@/lib/services/liveness');
    createChallengeFn = createLivenessChallenge;
  }
  return createChallengeFn!;
}

/**
 * Liveness check (anti-photo-spoof). GET issues a single-use challenge with a
 * webcam hint (blink twice); POST returns the captured frame burst. The server
 * verifies a live person was in front of the camera from the blink pattern,
 * temporal variance, and face continuity — a static photo cannot pass.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const createChallenge = await getCreateChallenge();
    const challenge = createChallenge(session.id);
    return NextResponse.json({
      ...challenge,
      instructions:
        'Look directly at the camera and blink twice clearly. Keep your face centered for the duration of the check.',
    });
  } catch (error) {
    console.error('Liveness challenge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    const nonceValue = formData?.get('nonce');
    const nonce = typeof nonceValue === 'string' ? nonceValue : '';
    const framesFiles = formData?.getAll('frames') ?? [];

    if (!nonce || framesFiles.length === 0) {
      return NextResponse.json(
        { error: 'Missing liveness challenge or frames.' },
        { status: 400 }
      );
    }

    const frames: Buffer[] = [];
    let totalBytes = 0;
    for (const entry of framesFiles) {
      if (entry instanceof File) {
        const buffer = Buffer.from(await entry.arrayBuffer());
        totalBytes += buffer.byteLength;
        if (totalBytes > MAX_TOTAL_FRAMES_BYTES) {
          return NextResponse.json(
            { error: 'Liveness capture is too large. Restart the check.' },
            { status: 400 }
          );
        }
        frames.push(buffer);
      }
    }
    if (frames.length === 0) {
      return NextResponse.json(
        { error: 'No camera frames were captured. Allow camera access and try again.' },
        { status: 400 }
      );
    }

    const verifyLiveness = await getVerifyLiveness();
    const result = await verifyLiveness(frames, nonce, session.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code, blinks: result.blinks },
        { status: 400 }
      );
    }

    const now = new Date();
    await db.$transaction([
      db.user.update({
        where: { id: session.id },
        data: { livenessVerified: true, livenessVerifiedAt: now },
      }),
      db.verification.upsert({
        where: { userId: session.id },
        update: { livenessVerified: true, livenessScore: result.score, status: 'APPROVED', verifiedAt: now },
        create: {
          userId: session.id,
          documentType: 'SELFIE',
          faceVerified: false,
          biometricVerified: true,
          livenessVerified: true,
          livenessScore: result.score,
          status: 'APPROVED',
          verifiedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      livenessVerified: true,
      blinks: result.blinks,
      frames: result.frames,
      score: result.score,
      message:
        'Liveness check passed. Your profile is now fully verified (photo, government ID, and live selfie).',
    });
  } catch (error) {
    console.error('Liveness verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}