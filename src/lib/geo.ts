export function ageFromDateOfBirth(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export type IpLocation = { latitude: number; longitude: number };

// Approximate IP-derived location: fallback anchor only, never persisted.
const ipLocationCache = new Map<string, { at: number; lat: number; lon: number }>();
const IP_LOCATION_TTL_MS = 60 * 60 * 1000; // stays under BigDataCloud's free rate limit

export async function ipLatLng(ip: string | null): Promise<IpLocation | null> {
  if (!ip) return null;

  const cached = ipLocationCache.get(ip);
  if (cached && Date.now() - cached.at < IP_LOCATION_TTL_MS) {
    return { latitude: cached.lat, longitude: cached.lon };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const url = `https://api.bigdatacloud.net/data/ip-geolocation-with-confidence?localityLanguage=en&ip=${encodeURIComponent(ip)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'proximitygetadate-app/1.0 (contact: support@proximitygetadate.site)',
        },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { latitude?: number; longitude?: number };
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;
      ipLocationCache.set(ip, { at: Date.now(), lat: data.latitude, lon: data.longitude });
      return { latitude: data.latitude, longitude: data.longitude };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

export function clientIp(request: Request): string | null {
  const forwarded = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')[0]
    ?.trim();
  if (forwarded) return forwarded;
  return request.headers.get('x-real-ip')?.trim() ?? null;
}