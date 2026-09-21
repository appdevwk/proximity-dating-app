import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { SessionUser, SiteModeValue, UserRoleValue } from '@/lib/types';

export const SESSION_COOKIE = 'proximity_session';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const FALLBACK_SECRET = 'proximity-local-dev-secret';

function adminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || FALLBACK_SECRET
  );
}

export async function signSessionToken(user: {
  id: string;
  email: string;
  name?: string | null;
  role?: UserRoleValue;
  siteMode?: SiteModeValue;
  emailVerified?: boolean;
}): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name ?? null,
    role: user.role ?? 'USER',
    siteMode: user.siteMode ?? 'both',
    emailVerified: user.emailVerified ?? false,
  })
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
    const role = payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const siteMode = payload.siteMode === 'adult' || payload.siteMode === 'mainstream' || payload.siteMode === 'both'
      ? payload.siteMode
      : 'both';
    return {
      id: subject,
      email,
      name: typeof payload.name === 'string' ? payload.name : null,
      role,
      siteMode,
      emailVerified: payload.emailVerified === true,
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

export type AdminAuthorization =
  | { allowed: true; user: SessionUser }
  | { allowed: false; reason: 'UNAUTHENTICATED' | 'FORBIDDEN' };

/**
 * Authorize the current request as an admin. Grants access when the session
 * user's DB role is ADMIN, or their email is in the ADMIN_EMAILS allowlist.
 * Distinguishes "not logged in" (UNAUTHENTICATED) from "logged in but not
 * an admin" (FORBIDDEN) so callers can return the correct HTTP status.
 */
export async function authorizeAdmin(): Promise<AdminAuthorization> {
  const session = await getSessionUser();
  if (!session) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  if (adminEmails().includes(session.email.toLowerCase())) {
    return { allowed: true, user: { ...session, role: 'ADMIN' } };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { role: true, isBanned: true },
    });
    if (!user || user.isBanned || user.role !== 'ADMIN') {
      return { allowed: false, reason: 'FORBIDDEN' };
    }
    return { allowed: true, user: { ...session, role: 'ADMIN' } };
  } catch {
    return { allowed: false, reason: 'FORBIDDEN' };
  }
}

/** Convenience helper: true when the current request is authorized as admin. */
export async function requireAdmin(): Promise<boolean> {
  return (await authorizeAdmin()).allowed;
}