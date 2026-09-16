import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ageFromDateOfBirth } from '@/lib/geo';
import { z } from 'zod';
import type {
  GenderValue,
  ProfileOut,
  UserMe,
  UserPreferencesOut,
} from '@/lib/types';

const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] as const;
const GENDER_ENUM = z.enum(GENDERS);

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  gender: GENDER_ENUM.optional(),
  interestedIn: z.array(GENDER_ENUM).min(1).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  profilePicture: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => /^(\/(?!\/)|https?:\/\/)/.test(value),
      { message: 'Profile picture must be a relative path or http(s) URL' }
    )
    .nullable()
    .optional(),
});

const updatePreferencesSchema = z.object({
  minAge: z.number().int().min(18).max(100).optional(),
  maxAge: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  relationshipType: z.array(z.string().min(1)).optional(),
  lookingFor: z.string().trim().max(200).nullable().optional(),
});

const updateSchema = z.object({
  profile: updateProfileSchema.optional(),
  preferences: updatePreferencesSchema.optional(),
});

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { profile: true, preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [acceptedMatches, allMessages, unreadMessages, likesReceived] = await Promise.all([
      db.match.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
        },
      }),
      db.message.count({
        where: {
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      }),
      db.message.count({
        where: { receiverId: user.id, isRead: false },
      }),
      db.match.count({
        where: {
          OR: [
            { user1Id: user.id, user1Action: null, user2Action: { in: ['LIKED', 'SUPER_LIKED'] } },
            { user2Id: user.id, user2Action: null, user1Action: { in: ['LIKED', 'SUPER_LIKED'] } },
          ],
        },
      }),
    ]);

    const me: UserMe = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        ageVerified: user.ageVerified,
        isBanned: user.isBanned,
        createdAt: user.createdAt.toISOString(),
      },
      profile: user.profile ? toProfileOut(user.profile) : null,
      preferences: user.preferences ? toPreferencesOut(user.preferences) : null,
      stats: {
        matches: acceptedMatches,
        acceptedMatches,
        messages: allMessages,
        unreadMessages,
        likesReceived,
      },
    };

    return NextResponse.json(me);
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = updateSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { profile: true, preferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (validated.profile) {
      const interestValue = validated.profile.interestedIn?.join(',') ?? user.profile?.interestedIn;
      await db.profile.upsert({
        where: { userId: user.id },
        update: {
          displayName: validated.profile.displayName ?? user.profile?.displayName ?? user.name ?? user.email,
          bio: validated.profile.bio !== undefined ? validated.profile.bio : user.profile?.bio,
          gender: validated.profile.gender ?? user.profile?.gender ?? 'OTHER',
          interestedIn: interestValue ?? 'MALE,FEMALE,NON_BINARY,OTHER',
          location:
            validated.profile.location !== undefined
              ? validated.profile.location
              : user.profile?.location,
          profilePicture:
            validated.profile.profilePicture !== undefined
              ? validated.profile.profilePicture
              : user.profile?.profilePicture,
        },
        create: {
          userId: user.id,
          displayName: validated.profile.displayName ?? user.name ?? user.email,
          dateOfBirth: user.profile?.dateOfBirth ?? new Date('1990-01-01'),
          gender: validated.profile.gender ?? 'OTHER',
          interestedIn: validated.profile.interestedIn?.join(',') ?? 'MALE,FEMALE,NON_BINARY,OTHER',
          bio: validated.profile.bio ?? null,
          location: validated.profile.location ?? null,
          profilePicture: validated.profile.profilePicture ?? null,
        },
      });

      if (validated.profile.displayName && validated.profile.displayName !== user.name) {
        await db.user.update({
          where: { id: user.id },
          data: { name: validated.profile.displayName },
        });
      }
    }

    if (validated.preferences) {
      await db.preferences.upsert({
        where: { userId: user.id },
        update: {
          minAge: validated.preferences.minAge ?? user.preferences?.minAge ?? 18,
          maxAge: validated.preferences.maxAge ?? user.preferences?.maxAge ?? 100,
          maxDistance: validated.preferences.maxDistance ?? user.preferences?.maxDistance ?? 50,
          interestedIn:
            user.profile?.interestedIn ?? 'MALE,FEMALE,NON_BINARY,OTHER',
          relationshipType:
            validated.preferences.relationshipType?.join(',') ??
            user.preferences?.relationshipType ??
            'CASUAL,SERIOUS,FRIENDSHIP,NSFW',
          lookingFor:
            validated.preferences.lookingFor !== undefined
              ? validated.preferences.lookingFor
              : user.preferences?.lookingFor,
        },
        create: {
          userId: user.id,
          minAge: validated.preferences.minAge ?? 18,
          maxAge: validated.preferences.maxAge ?? 100,
          maxDistance: validated.preferences.maxDistance ?? 50,
          interestedIn: user.profile?.interestedIn ?? 'MALE,FEMALE,NON_BINARY,OTHER',
          relationshipType: validated.preferences.relationshipType?.join(',') ?? 'CASUAL,SERIOUS,FRIENDSHIP,NSFW',
          lookingFor: validated.preferences.lookingFor ?? null,
        },
      });
    }

    const refreshed = await db.user.findUnique({
      where: { id: user.id },
      include: { profile: true, preferences: true },
    });

    const [acceptedMatches, allMessages, unreadMessages, likesReceived] = await Promise.all([
      db.match.count({
        where: { status: 'ACCEPTED', OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      }),
      db.message.count({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } }),
      db.message.count({ where: { receiverId: user.id, isRead: false } }),
      db.match.count({
        where: {
          OR: [
            { user1Id: user.id, user1Action: null, user2Action: { in: ['LIKED', 'SUPER_LIKED'] } },
            { user2Id: user.id, user2Action: null, user1Action: { in: ['LIKED', 'SUPER_LIKED'] } },
          ],
        },
      }),
    ]);

    const me: UserMe = {
      user: {
        id: refreshed!.id,
        email: refreshed!.email,
        name: refreshed!.name,
        ageVerified: refreshed!.ageVerified,
        isBanned: refreshed!.isBanned,
        createdAt: refreshed!.createdAt.toISOString(),
      },
      profile: refreshed!.profile ? toProfileOut(refreshed!.profile) : null,
      preferences: refreshed!.preferences ? toPreferencesOut(refreshed!.preferences) : null,
      stats: {
        matches: acceptedMatches,
        acceptedMatches,
        messages: allMessages,
        unreadMessages,
        likesReceived,
      },
    };

    return NextResponse.json({ message: 'Profile updated', me });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function toProfileOut(profile: {
  id: string;
  displayName: string;
  bio: string | null;
  dateOfBirth: Date;
  gender: string;
  interestedIn: string;
  location: string | null;
  profilePicture: string | null;
  isProfilePublic: boolean;
  showDistance: boolean;
}): ProfileOut {
  return {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    age: ageFromDateOfBirth(profile.dateOfBirth),
    gender: profile.gender as GenderValue,
    interestedIn: profile.interestedIn
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is GenderValue => GENDERS.includes(value as GenderValue)),
    location: profile.location,
    profilePicture: profile.profilePicture,
    isProfilePublic: profile.isProfilePublic,
    showDistance: profile.showDistance,
    ageVerified: true,
  };
}

function toPreferencesOut(preferences: {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interestedIn: string;
  relationshipType: string;
  lookingFor: string | null;
}): UserPreferencesOut {
  return {
    minAge: preferences.minAge,
    maxAge: preferences.maxAge,
    maxDistance: preferences.maxDistance,
    interestedIn: preferences.interestedIn
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is GenderValue => GENDERS.includes(value as GenderValue)),
    relationshipType: preferences.relationshipType
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0),
    lookingFor: preferences.lookingFor,
  };
}