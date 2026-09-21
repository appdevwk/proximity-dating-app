import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import type { VerificationType } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let idFns: any = null;
let faceFns: any = null;

async function getIdFns() {
  if (!idFns) {
    const mod = await import('@/lib/services/id-verify');
    idFns = mod;
  }
  return idFns;
}

async function getFaceFns() {
  if (!faceFns) {
    const mod = await import('@/lib/services/face-fingerprint');
    faceFns = mod;
  }
  return faceFns;
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const DOCUMENT_TYPES = ['DRIVERS_LICENSE', 'PASSPORT', 'ID_CARD'];

/**
 * Government-ID verification (evidence-based age + identity).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        photoVerified: true,
        faceFingerprint: true,
        faceFingerprintVersion: true,
        idVerified: true,
        idDocumentHash: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.photoVerified || !user.faceFingerprint) {
      return NextResponse.json(
        {
          error: 'Submit your verification photo (selfie) before uploading an ID document.',
          code: 'photoRequired',
        },
        { status: 400 }
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    const rawType = formData?.get('documentType');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const documentType = typeof rawType === 'string' ? rawType : '';
    if (!DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: 'Choose a document type: driver\'s license, passport, or national ID.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (fileBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
    }
    const mime = file.type?.toLowerCase() ?? '';
    const extension = ALLOWED_TYPES.get(mime);
    if (!extension) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPG, PNG or WebP.' },
        { status: 400 }
      );
    }

    const face = await getFaceFns();
    const id = await getIdFns();

    const normalized = await id.normalizeDocumentImage(fileBuffer);
    const documentHash = sha256(normalized);

    if (user.idDocumentHash !== documentHash) {
      const other = await db.user.findFirst({
        where: { idDocumentHash: documentHash, id: { not: session.id } },
        select: { id: true },
      });
      if (other) {
        return NextResponse.json(
          {
            error: 'This exact ID document has already been used on another account. Only one account per person is allowed.',
            code: 'duplicateDocument',
          },
          { status: 409 }
        );
      }
    }

    const evidence = await id.extractIdEvidence(normalized, documentType);
    if (!evidence.ok) {
      if (evidence.code === 'underage' || evidence.code === 'impossibleDate') {
        await db.verification.upsert({
          where: { userId: session.id },
          update: { status: 'REJECTED', verifiedAt: null },
          create: {
            userId: session.id,
            documentType: documentType as VerificationType,
            documentUrl: null,
            idSource: null,
            status: 'REJECTED',
          },
        });
      }
      return NextResponse.json(
        { error: evidence.message, code: evidence.code },
        { status: 400 }
      );
    }

    const idFace = await face.analyzeFaceInDocument(normalized);
    if (!idFace.ok) {
      return NextResponse.json(
        {
          error: idFace.message,
          code: 'idPortraitUnreadable',
          detailCode: idFace.code,
        },
        { status: 400 }
      );
    }
    const selfie = face.deserializeFingerprint(user.faceFingerprint);
    const idFaceMatchScore = selfie
      ? face.fingerprintDistance(idFace.descriptor, selfie)
      : 1;
    if (selfie && idFaceMatchScore > face.ID_FACE_MATCH_THRESHOLD) {
      return NextResponse.json(
        {
          error:
            'The portrait on this document does not match your verification photo. The ID must belong to you.',
          code: 'idFaceMismatch',
          matchScore: Number(idFaceMatchScore.toFixed(3)),
          threshold: face.ID_FACE_MATCH_THRESHOLD,
        },
        { status: 400 }
      );
    }

    const storageDir = path.join(process.cwd(), 'data', 'verification-ids', session.id);
    await mkdir(storageDir, { recursive: true });
    const filename = `${documentType}-${Date.now()}-${randomUUID()}.${extension}`;
    await writeFile(path.join(storageDir, filename), fileBuffer);

    const storageRef = path.join('verification-ids', session.id, filename);
    const now = new Date();

    await db.$transaction([
      db.user.update({
        where: { id: session.id },
        data: {
          ageVerified: true,
          idVerified: true,
          idVerifiedAt: now,
          idDocumentHash: documentHash,
          idFaceMatchScore,
        },
      }),
      db.verification.upsert({
        where: { userId: session.id },
        update: {
          documentType: documentType as VerificationType,
          documentUrl: storageRef,
          idSource: evidence.source,
          idDocumentHash: documentHash,
          dob: evidence.dob,
          documentCountry: evidence.country,
          idFaceMatchScore,
          status: 'APPROVED',
          verifiedAt: now,
        },
        create: {
          userId: session.id,
          documentType: documentType as VerificationType,
          documentUrl: storageRef,
          idSource: evidence.source,
          idDocumentHash: documentHash,
          dob: evidence.dob,
          documentCountry: evidence.country,
          idFaceMatchScore,
          status: 'APPROVED',
          verifiedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      idVerified: true,
      age: evidence.age,
      dobMasked: id.maskDateOfBirth(evidence.dob),
      source: evidence.source,
      country: evidence.country,
      idFaceMatchScore: Number(idFaceMatchScore.toFixed(3)),
      documentType,
      message:
        'Your government ID was verified. Your age (18+) is confirmed from the document and the ID portrait matches your verification photo.',
    });
  } catch (error) {
    console.error('ID verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Status of the current member's government-ID verification. */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = await getIdFns();
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        idVerified: true,
        idVerifiedAt: true,
        idDocumentHash: true,
        idFaceMatchScore: true,
        verification: { select: { documentType: true, idSource: true, dob: true, documentCountry: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      idVerified: user.idVerified,
      idVerifiedAt: user.idVerifiedAt?.toISOString() ?? null,
      documentType: user.verification?.documentType ?? null,
      source: user.verification?.idSource ?? null,
      country: user.verification?.documentCountry ?? null,
      dobMasked: user.verification?.dob ? id.maskDateOfBirth(user.verification.dob) : null,
      idFaceMatchScore: user.idFaceMatchScore
        ? Number(user.idFaceMatchScore.toFixed(3))
        : null,
    });
  } catch (error) {
    console.error('ID verification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}