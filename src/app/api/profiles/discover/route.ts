import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ageFromDateOfBirth, haversineMiles } from '@/lib/geo';
import { requiresVerification, verificationRequiredResponse } from '@/lib/verification';
import type { DiscoverProfile } from '@/lib/types';

const ALL_GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'];

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get('limit') ?? '20');
    const offsetRaw = Number(searchParams.get('offset') ?? '0');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const me = await db.user.findUnique({
      where: { id: session.id },
      include: { profile: true, preferences: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Industry-standard gate: members must complete profile verification
    // (18+ declaration, Terms & Privacy consent, verification photo) before
    // they can browse or interact with other members.
    if (requiresVerification(me)) {
      return verificationRequiredResponse();
    }

    if (!me.profile) {
      return NextResponse.json({ profiles: [], message: 'Finish setting up your profile to start browsing.' });
    }

    const prefs = me.preferences;
    const myGender = me.profile.gender;
    const prefsInterested = prefs?.interestedIn
      ? prefs.interestedIn.split(',').map((value) => value.trim().toUpperCase())
      : ALL_GENDERS;
    const prefMinAge = prefs?.minAge ?? 18;
    const prefMaxAge = prefs?.maxAge ?? 100;
    const prefMaxDistance = prefs?.maxDistance ?? 50;

    // Users this user has already swiped on.
    const swipedMatches = await db.match.findMany({
      where: { OR: [{ user1Id: session.id }, { user2Id: session.id }] },
      select: { user1Id: true, user2Id: true },
    });
    const swipedIds = new Set<string>();
    for (const match of swipedMatches) {
      swipedIds.add(match.user1Id === session.id ? match.user2Id : match.user1Id);
    }

    // Users this user blocked, or who blocked this user.
    const blocks = await db.block.findMany({
      where: {
        OR: [{ blockerId: session.id }, { blockedId: session.id }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set<string>();
    for (const block of blocks) {
      blockedIds.add(block.blockerId === session.id ? block.blockedId : block.blockerId);
    }

    const candidates = await db.profile.findMany({
      where: {
        userId: { not: session.id },
        isProfilePublic: true,
        user: { isBanned: false },
      },
      include: { user: { select: { id: true, ageVerified: true } } },
    });

    const filtered = candidates.filter((profile) => {
      if (swipedIds.has(profile.userId)) return false;
      if (blockedIds.has(profile.userId)) return false;

      const age = ageFromDateOfBirth(profile.dateOfBirth);
      if (age < prefMinAge || age > prefMaxAge) return false;

      // Mutual gender preference matching.
      const candidateInterested = profile.interestedIn
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      if (!prefsInterested.includes(profile.gender)) return false;
      if (!candidateInterested.includes(myGender)) return false;

      if (profile.latitude != null && profile.longitude != null && me.profile?.latitude != null && me.profile?.longitude != null) {
        const distance = haversineMiles(
          me.profile.latitude,
          me.profile.longitude,
          profile.latitude,
          profile.longitude
        );
        if (distance > prefMaxDistance) return false;
      }

      return true;
    });

    // Random shuffle so every request surfaces different people.
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    const slice = filtered.slice(offset, offset + limit);

    const profiles: DiscoverProfile[] = slice.map((profile) => {
      let distanceMiles: number | null = null;
      if (
        profile.showDistance !== false &&
        profile.latitude != null &&
        profile.longitude != null &&
        me.profile?.latitude != null &&
        me.profile?.longitude != null
      ) {
        distanceMiles = haversineMiles(
          me.profile.latitude,
          me.profile.longitude,
          profile.latitude,
          profile.longitude
        );
      }

      return {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        age: ageFromDateOfBirth(profile.dateOfBirth),
        gender: profile.gender,
        interestedIn: profile.interestedIn
          .split(',')
          .map((value) => value.trim().toUpperCase())
          .filter((value) => value.length > 0) as DiscoverProfile['interestedIn'],
        location: profile.location,
        bio: profile.bio,
        profilePicture: profile.profilePicture,
        distanceMiles,
        userVerified: profile.user.ageVerified,
      };
    });

    return NextResponse.json({
      profiles,
      total: filtered.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Discover profiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}