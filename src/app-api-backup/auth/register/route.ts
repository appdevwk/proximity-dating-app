import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  dateOfBirth: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Terms must be accepted"
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

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        ageVerified: false, // Will be verified through additional process
      },
      select: {
        id: true,
        email: true,
        name: true,
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

    return NextResponse.json({
      message: 'Registration successful. Please complete age verification.',
      user,
      requiresAgeVerification: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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