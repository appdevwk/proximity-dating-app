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
  ['image/gif', 'gif'],
]);

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
        { error: 'Unsupported file type. Use JPG, PNG, WebP or GIF.' },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const uploadRoot = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    const folder = path.join(uploadRoot, session.id);
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, filename), fileBuffer);

    const url = `/api/uploads/profiles/${session.id}/${filename}`;

    await db.$transaction([
      db.profile.upsert({
        where: { userId: session.id },
        update: { profilePicture: url },
        create: {
          userId: session.id,
          displayName: session.name ?? session.email.split('@')[0] ?? 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          interestedIn: 'MALE,FEMALE,NON_BINARY,OTHER',
          profilePicture: url,
        },
      }),
      db.media.create({
        data: {
          userId: session.id,
          url,
          type: 'PROFILE_PICTURE',
          isPublic: true,
          isApproved: true,
        },
      }),
    ]);

    return NextResponse.json({ url, message: 'Profile photo updated' });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}