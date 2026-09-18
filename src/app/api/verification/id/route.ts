import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import {
  extractIdEvidence,
  normalizeDocumentImage,
  maskDateOfBirth,
  type IdDocumentType,
} from '@/lib/services/id-verify';
import {
  analyzeFaceInDocument,
  deserializeFingerprint,
  fingerprintDistance,
  ID_FACE_MATCH_THRESHOLD,
} from '@/lib/services/face-fingerprint';

export const runtime = 'nodejs';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const DOCUMENT_TYPES: IdDocumentType[] = ['DRIVERS_LICENSE', 'PASSPORT', 'ID_CARD'];

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Government-ID verification (evidence-based age + identity).
 *
 * Upload a photo of a government-issued ID (driver's license, passport, or
 * national ID card). The platform:
 *   1. OCRs the document (MRZ preferred) to read an actual date of birth and
 *      confirms the holder is 18+ from that date;
 *   2. fingerprints the portrait on the document and matches it against the
 *      member's verification selfie (the ID must belong to the same person);
 *   3. records the document hash so the same document cannot be used on two
 *      accounts.
 *
 * The document image is stored privately on the server (outside public/), is
 * never served through any URL, and is only used to produce this evidence.
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
    if (!DOCUMENT_TYPES.includes(documentType as IdDocumentType)) {
      return NextResponse.json(
        { error: 'Choose a document type: driver’s license, passport, or national ID.' },
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

    const normalized = await normalizeDocumentImage(fileBuffer);
    const documentHash = sha256(normalized);

    // A government-issued ID is unique: block reuse across accounts.
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

    // Evidence-based age: read an actual date of birth from the document.
    const evidence = await extractIdEvidence(normalized, documentType as IdDocumentType);
    if (!evidence.ok) {
      if (evidence.code === 'underage' || evidence.code === 'impossibleDate') {
        await db.verification.upsert({
          where: { userId: session.id },
          update: { status: 'REJECTED', verifiedAt: null },
          create: {
            userId: session.id,
            documentType: documentType as IdDocumentType,
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

    // The ID portrait must be the same person as the verification selfie.
    const idFace = await analyzeFaceInDocument(normalized);
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
    const selfie = deserializeFingerprint(user.faceFingerprint);
    const idFaceMatchScore = selfie
      ? fingerprintDistance(idFace.descriptor, selfie)
      : 1;
    if (selfie && idFaceMatchScore > ID_FACE_MATCH_THRESHOLD) {
      return NextResponse.json(
        {
          error:
            'The portrait on this document does not match your verification photo. The ID must belong to you.',
          code: 'idFaceMismatch',
          matchScore: Number(idFaceMatchScore.toFixed(3)),
          threshold: ID_FACE_MATCH_THRESHOLD,
        },
        { status: 400 }
      );
    }

    // Persist privately (outside public/) and record the evidence.
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
          documentType: documentType as IdDocumentType,
          documentUrl: storageRef, // private; never served through a public URL
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
          documentType: documentType as IdDocumentType,
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
      dobMasked: maskDateOfBirth(evidence.dob),
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
      dobMasked: user.verification?.dob ? maskDateOfBirth(user.verification.dob) : null,
      idFaceMatchScore: user.idFaceMatchScore
        ? Number(user.idFaceMatchScore.toFixed(3))
        : null,
    });
  } catch (error) {
    console.error('ID verification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}