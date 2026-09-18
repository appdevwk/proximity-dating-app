import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import {
  analyzeFace,
  prepareAnalysisBuffer,
  serializeFingerprint,
  deserializeFingerprint,
  fingerprintDistance,
  FINGERPRINT_VERSION,
  DEDUPE_DISTANCE_THRESHOLD,
} from '@/lib/services/face-fingerprint';

export const runtime = 'nodejs';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

/**
 * Verification photo upload (selfie / face photo). Submitting a verification
 * photo is part of the profile verification flow: it gives the community a
 * face to match the profile, is recorded with a timestamp, and — since the
 * face-recognition upgrade — is actively analyzed to:
 *   1. prove the photo contains exactly one, sharp, frontal face;
 *   2. extract a unique FaceNet 128-d facial fingerprint; and
 *   3. block the same face from creating duplicate accounts (dedupe).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sizeBytes = fileBuffer.byteLength;
    if (sizeBytes === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large (max 5 MB)' },
        { status: 400 }
      );
    }

    const mime = file.type?.toLowerCase() ?? '';
    const extension = ALLOWED_TYPES.get(mime);
    if (!extension) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPG, PNG or WebP.' },
        { status: 400 }
      );
    }

    // Real face-recognition check: single, frontal, sharp face + 128-d fingerprint.
    const prepared = await prepareAnalysisBuffer(fileBuffer);
    const analysis = await analyzeFace(prepared);
    if (!analysis.ok) {
      return NextResponse.json(
        { error: analysis.message, code: analysis.code },
        { status: 400 }
      );
    }

    const fingerprint = serializeFingerprint(analysis.descriptor, {
      confidence: analysis.confidence,
      faceSize: analysis.faceSize,
      sharpness: analysis.sharpness,
    });

    // Duplicate-account detection: compare against every other verified
    // fingerprint. Cosine distance <= threshold => same person.
    const existing = await db.user.findMany({
      where: {
        AND: [
          { faceFingerprint: { not: null } },
          { id: { not: session.id } },
        ],
      },
      select: { id: true, faceFingerprint: true },
    });

    let closestDistance = 1;
    let matchUserId: string | null = null;
    for (const candidate of existing) {
      const other = deserializeFingerprint(candidate.faceFingerprint);
      if (!other) continue;
      const distance = fingerprintDistance(analysis.descriptor, other);
      if (distance < closestDistance) {
        closestDistance = distance;
        matchUserId = candidate.id;
      }
    }

    const duplicate = closestDistance <= DEDUPE_DISTANCE_THRESHOLD;

    const filename = `verification-${Date.now()}-${randomUUID()}.${extension}`;
    const uploadRoot = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    const folder = path.join(uploadRoot, session.id);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, filename), fileBuffer);

    const url = `/api/uploads/profiles/${session.id}/${filename}`;
    const now = new Date();

    if (duplicate) {
      // Audit the attempt as REJECTED; never flip photoVerified.
      await db.verification.upsert({
        where: { userId: session.id },
        update: {
          documentType: 'SELFIE',
          documentUrl: url,
          faceVerified: false,
          biometricVerified: false,
          faceFingerprint: fingerprint,
          matchScore: closestDistance,
          matchUserId,
          status: 'REJECTED',
          verifiedAt: null,
        },
        create: {
          userId: session.id,
          documentType: 'SELFIE',
          documentUrl: url,
          faceVerified: false,
          biometricVerified: false,
          faceFingerprint: fingerprint,
          matchScore: closestDistance,
          matchUserId,
          status: 'REJECTED',
        },
      });
      await db.media.create({
        data: {
          userId: session.id,
          url,
          type: 'GALLERY_IMAGE',
          isPublic: false,
          isApproved: false,
        },
      });
      return NextResponse.json(
        {
          error:
            'This face is already associated with another profile. Only one account per person is allowed.',
          code: 'duplicateFingerprint',
          matchScore: Number(closestDistance.toFixed(3)),
        },
        { status: 409 }
      );
    }

    const [updatedUser] = await db.$transaction([
      db.user.update({
        where: { id: session.id },
        data: {
          photoVerified: true,
          photoSubmittedAt: now,
          faceFingerprint: fingerprint,
          faceFingerprintVersion: FINGERPRINT_VERSION,
        },
      }),
      db.media.create({
        data: {
          userId: session.id,
          url,
          type: 'GALLERY_IMAGE',
          isPublic: false,
          isApproved: false,
        },
      }),
    ]);

    await db.verification.upsert({
      where: { userId: session.id },
      update: {
        documentType: 'SELFIE',
        documentUrl: url,
        faceVerified: true,
        biometricVerified: false,
        faceFingerprint: fingerprint,
        matchScore: closestDistance,
        matchUserId: null,
        status: 'APPROVED',
        verifiedAt: now,
      },
      create: {
        userId: session.id,
        documentType: 'SELFIE',
        documentUrl: url,
        faceVerified: true,
        biometricVerified: false,
        faceFingerprint: fingerprint,
        matchScore: closestDistance,
        matchUserId: null,
        status: 'APPROVED',
        verifiedAt: now,
      },
    });

    return NextResponse.json({
      url,
      message:
        'Verification photo submitted. Your face fingerprint was recorded and your profile is now photo-verified.',
      photoVerified: updatedUser.photoVerified,
      fingerprint: {
        version: FINGERPRINT_VERSION,
        closestDistance: Number(closestDistance.toFixed(3)),
      },
    });
  } catch (error) {
    console.error('Verification photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Status of the current member's verification photo. */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        photoVerified: true,
        photoSubmittedAt: true,
        faceFingerprintVersion: true,
        media: { where: { type: 'GALLERY_IMAGE' }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      photoVerified: user.photoVerified,
      photoSubmittedAt: user.photoSubmittedAt?.toISOString() ?? null,
      photoUrl: user.media[0]?.url ?? null,
      faceFingerprintVersion: user.faceFingerprintVersion ?? null,
    });
  } catch (error) {
    console.error('Verification photo status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}