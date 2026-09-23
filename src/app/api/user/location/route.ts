import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ipLatLng, clientIp } from '@/lib/geo';
import { z } from 'zod';

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const ipLocationSchema = z.object({
  useIpApproximate: z.literal(true),
});

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
};

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'proximitygetadate-app/1.0 (contact: support@proximitygetadate.site)',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { address?: NominatimAddress };
      const address = data.address;
      if (!address) return null;

      const cityPart =
        address.city ?? address.town ?? address.village ?? address.hamlet ?? address.county ?? null;
      const statePart = address.state ?? null;

      if (cityPart && statePart) return `${cityPart}, ${statePart}`;
      if (cityPart) return cityPart;
      if (statePart) return statePart;
      return null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Geocoding is best-effort: coordinates still get saved even if this fails.
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const coords = locationSchema.safeParse(body);
    let latitude: number;
    let longitude: number;
    if (coords.success) {
      latitude = coords.data.latitude;
      longitude = coords.data.longitude;
    } else if (ipLocationSchema.safeParse(body).success) {
      const ipLocation = await ipLatLng(clientIp(request));
      if (!ipLocation) {
        return NextResponse.json(
          { error: 'Could not approximate your location from your connection.' },
          { status: 422 }
        );
      }
      latitude = ipLocation.latitude;
      longitude = ipLocation.longitude;
    } else {
      return NextResponse.json(
        { error: 'Validation failed', details: coords.error.issues },
        { status: 400 }
      );
    }

    const me = await db.user.findUnique({
      where: { id: session.id },
      include: { profile: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [geocodedLocation] = await Promise.all([
      reverseGeocode(latitude, longitude),
    ]);

    const resolvedLocation = geocodedLocation ?? me.profile?.location ?? null;

    await db.profile.upsert({
      where: { userId: me.id },
      update: {
        latitude,
        longitude,
        location: resolvedLocation,
      },
      create: {
        userId: me.id,
        displayName: me.name ?? me.email,
        dateOfBirth: me.profile?.dateOfBirth ?? new Date('1990-01-01'),
        gender: me.profile?.gender ?? 'OTHER',
        interestedIn: me.profile?.interestedIn ?? 'MALE,FEMALE,NON_BINARY,OTHER',
        latitude,
        longitude,
        location: resolvedLocation,
      },
    });

    return NextResponse.json({
      latitude,
      longitude,
      location: resolvedLocation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Save location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}