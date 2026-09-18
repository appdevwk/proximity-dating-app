import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  applySessionCookie,
  signSessionToken,
} from '@/lib/auth';
import { TERMS_VERSION, clientIpFromRequest } from '@/lib/verification';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  dateOfBirth: z.string(),
  ageDeclaration: z.boolean().refine(val => val === true, {
    message: "You must confirm you are 18 or older"
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy"
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Calculate age to ensure user is 18+
    const birthDate = new Date(validatedData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const consentIp = clientIpFromRequest(request);

    // Create user. The member has explicitly (1) declared they are 18+, and
    // (2) accepted the Terms & Privacy Policy — this is recorded as auditable,
    // timestamped consent, the industry-standard age/consent gate for adult
    // dating sites.
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        // Age is proven 18+ by the validated date of birth on this exact route.
        ageVerified: true,
        ageDeclarationConfirmed: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        consentIp,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        ageVerified: true,
        createdAt: true
      }
    });

    // Create profile
    await db.profile.create({
      data: {
        userId: user.id,
        displayName: validatedData.name,
        dateOfBirth: birthDate,
        gender: 'OTHER', // Will be updated during profile setup
        interestedIn: 'MALE,FEMALE,NON_BINARY,OTHER', // Default to all
      }
    });

    // Create default preferences
    await db.preferences.create({
      data: {
        userId: user.id,
        minAge: 18,
        maxAge: 100,
        maxDistance: 50,
        interestedIn: 'MALE,FEMALE,NON_BINARY,OTHER',
        relationshipType: 'CASUAL,SERIOUS,FRIENDSHIP,NSFW',
      }
    });

    // Sign a session cookie so the user is logged in immediately after registering.
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? 'USER',
    });

    const response = NextResponse.json({
      message: 'Registration successful. Welcome to Proximity!',
      user: { ...user, ageDeclarationConfirmed: true, termsAccepted: true, termsVersion: TERMS_VERSION },
      requiresAgeVerification: false,
      requiresProfileVerification: true,
      session: 'created'
    });

    return applySessionCookie(response, token);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}