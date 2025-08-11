import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BiometricService } from '@/lib/services/biometric-service';
import { z } from 'zod';

const ageVerificationSchema = z.object({
  userId: z.string(),
  documentType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'ID_CARD', 'SELFIE']),
  documentData: z.object({
    frontImage: z.string(), // base64
    backImage: z.string().optional(), // base64
    selfieImage: z.string().optional(), // base64
  }),
  idNumber: z.string(),
  issuedDate: z.string(),
  expirationDate: z.string(),
  // Facial recognition data
  facialData: z.object({
    selfieImage: z.string(), // base64
    faceScan: z.string().optional(), // base64 encoded facial recognition data
    livenessCheck: z.boolean().optional(),
  }).optional(),
  // Biometric data
  biometricData: z.object({
    fingerprint: z.string().optional(), // base64 encoded fingerprint data
    fingerprintTemplate: z.string().optional(), // base64 encoded fingerprint template
    biometricType: z.enum(['FINGERPRINT', 'FACE_ID', 'IRIS_SCAN', 'VOICE']).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ageVerificationSchema.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.ageVerified) {
      return NextResponse.json(
        { error: 'User already age verified' },
        { status: 400 }
      );
    }

    // Check if there's a pending verification
    const existingVerification = await db.verification.findUnique({
      where: { userId: validatedData.userId }
    });

    if (existingVerification && existingVerification.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Verification already in progress' },
        { status: 400 }
      );
    }

    // Initialize biometric service
    const biometricService = BiometricService.getInstance();

    // Perform complete verification process
    const verificationResult = await biometricService.completeVerificationProcess(
      validatedData.userId,
      validatedData.documentData,
      validatedData.documentType,
      validatedData.facialData,
      validatedData.biometricData
    );

    // Simulate document upload URLs (in production, these would be real URLs)
    const documentUrl = `https://storage.proximity.com/verification/${validatedData.userId}_${Date.now()}`;
    
    // Create verification record
    const verification = await db.verification.create({
      data: {
        userId: validatedData.userId,
        documentType: validatedData.documentType,
        documentUrl: documentUrl,
        facialData: validatedData.facialData?.selfieImage || null,
        biometricData: validatedData.biometricData?.fingerprint || null,
        faceVerified: verificationResult.faceVerified,
        biometricVerified: verificationResult.biometricVerified,
        status: verificationResult.overallSuccess ? 'APPROVED' : 'PENDING',
        verifiedAt: verificationResult.overallSuccess ? new Date() : null,
      }
    });

    // Update user age verification status if verification is successful
    if (verificationResult.overallSuccess) {
      await db.user.update({
        where: { id: validatedData.userId },
        data: { ageVerified: true }
      });
    }

    return NextResponse.json({
      message: verificationResult.overallSuccess 
        ? 'Age verification completed successfully with advanced biometric authentication' 
        : 'Verification process initiated. Additional verification may be required.',
      verification: {
        id: verification.id,
        status: verification.status,
        documentVerified: verificationResult.documentVerified,
        faceVerified: verificationResult.faceVerified,
        biometricVerified: verificationResult.biometricVerified,
        confidence: verificationResult.confidence,
        verificationId: verificationResult.verificationId,
        verifiedAt: verificationResult.overallSuccess ? new Date() : null,
        details: verificationResult.details,
      },
      requiresAdditionalVerification: !verificationResult.overallSuccess
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Age verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const verification = await db.verification.findUnique({
      where: { userId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verification: {
        id: verification.id,
        status: verification.status,
        documentType: verification.documentType,
        faceVerified: verification.faceVerified,
        biometricVerified: verification.biometricVerified,
        verifiedAt: verification.verifiedAt,
        createdAt: verification.createdAt,
      }
    });

  } catch (error) {
    console.error('Get verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}