import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { SessionUser } from '@/lib/types';

export const SESSION_COOKIE = 'proximity_session';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const FALLBACK_SECRET = 'proximity-local-dev-secret';

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || FALLBACK_SECRET
  );
}

export async function signSessionToken(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const subject = payload.sub;
    if (!subject) return null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (!email) return null;
    return {
      id: subject,
      email,
      name: typeof payload.name === 'string' ? payload.name : null,
    };
  } catch {
    return null;
  }
}

/** Resolve the currently authenticated user from the session cookie. Null when not logged in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Attach the session cookie to a response. */
export function applySessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

/** Attach a cookie deletion to a response. */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/** Extract normalized match pair ids (sorted so the unique constraint holds). */
export function normalizeMatchPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}