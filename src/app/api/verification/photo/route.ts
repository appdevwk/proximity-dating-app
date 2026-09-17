import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

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
 * face to match the profile and is recorded with a timestamp.
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

    const filename = `verification-${Date.now()}-${randomUUID()}.${extension}`;
    const uploadRoot = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    const folder = path.join(uploadRoot, session.id);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, filename), fileBuffer);

    const url = `/api/uploads/profiles/${session.id}/${filename}`;

    const [updatedUser] = await db.$transaction([
      db.user.update({
        where: { id: session.id },
        data: { photoVerified: true, photoSubmittedAt: new Date() },
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

    return NextResponse.json({
      url,
      message: 'Verification photo submitted. Your profile is now photo-verified.',
      photoVerified: updatedUser.photoVerified,
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
    });
  } catch (error) {
    console.error('Verification photo status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}