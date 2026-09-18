import type { NextRequest } from 'next/server';

/**
 * Profile verification helpers for the 18+ adult dating platform.
 *
 * Industry-accepted verification for adult dating sites combines:
 *  1. an explicit 18+ age declaration,
 *  2. recorded consent to the Terms of Service / Privacy Policy (timestamped),
 *  3. a verification photo / selfie submitted to the profile,
 *  4. a government-issued ID whose date of birth proves 18+ (evidence-based age),
 *  5. a liveness check (anti-photo-spoof) performed by the member live.
 *
 * Consent is never backfilled silently — each member must accept on their own
 * account so the platform keeps an auditable consent trail.
 */

/** Bump whenever the Terms of Service / Privacy Policy text changes meaningfully. */
export const TERMS_VERSION = '1.1.0';

export type ProfileVerificationStatus = {
  ageDeclarationConfirmed: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  consentIp: string | null;
  photoVerified: boolean;
  photoSubmittedAt: string | null;
  idVerified: boolean;
  idVerifiedAt: string | null;
  idVerifiedDocumentType: 'DRIVERS_LICENSE' | 'PASSPORT' | 'ID_CARD' | null;
  livenessVerified: boolean;
  verified: boolean;
  fullyVerified: boolean;
};

/** True when the core verification steps are complete (gate for the app). */
export function isProfileVerified(user: {
  ageVerified: boolean;
  ageDeclarationConfirmed: boolean;
  termsAccepted: boolean;
  photoVerified: boolean;
}): boolean {
  return (
    user.ageVerified &&
    user.ageDeclarationConfirmed &&
    user.termsAccepted &&
    user.photoVerified
  );
}

/** True when every verification tier — including ID document + liveness — is done. */
export function isFullyVerified(user: {
  ageVerified: boolean;
  ageDeclarationConfirmed: boolean;
  termsAccepted: boolean;
  photoVerified: boolean;
  idVerified?: boolean;
  livenessVerified?: boolean;
}): boolean {
  return (
    isProfileVerified(user) &&
    user.idVerified === true &&
    user.livenessVerified === true
  );
}

export function toProfileVerificationStatus(user: {
  ageVerified: boolean;
  ageDeclarationConfirmed: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
  consentIp: string | null;
  photoVerified: boolean;
  photoSubmittedAt: Date | null;
  idVerified?: boolean;
  idVerifiedAt?: Date | null;
  livenessVerified?: boolean;
  verification?: { documentType?: string | null } | null;
}): ProfileVerificationStatus {
  return {
    ageDeclarationConfirmed: user.ageDeclarationConfirmed,
    termsAccepted: user.termsAccepted,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    termsVersion: user.termsVersion,
    consentIp: user.consentIp,
    photoVerified: user.photoVerified,
    photoSubmittedAt: user.photoSubmittedAt?.toISOString() ?? null,
    idVerified: user.idVerified === true,
    idVerifiedAt: user.idVerifiedAt?.toISOString() ?? null,
    idVerifiedDocumentType:
      (user.verification?.documentType as
        | 'DRIVERS_LICENSE'
        | 'PASSPORT'
        | 'ID_CARD'
        | null) ?? null,
    livenessVerified: user.livenessVerified === true,
    verified: isProfileVerified(user),
    fullyVerified: isFullyVerified(user),
  };
}

/** Best-effort client IP from common proxy headers (Vercel, Caddy, nginx). */
export function clientIpFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return null;
}

/** True when a member must complete profile verification before interacting. */
export function requiresVerification(user: {
  ageDeclarationConfirmed: boolean;
  termsAccepted: boolean;
  photoVerified: boolean;
}): boolean {
  return !user.ageDeclarationConfirmed || !user.termsAccepted || !user.photoVerified;
}

/** HTTP 403 payload when a member has not completed profile verification. */
export function verificationRequiredResponse() {
  return new Response(
    JSON.stringify({
      error: 'Profile verification required. Confirm you are 18+, accept our Terms & Privacy Policy, and add a verification photo.',
      verificationRequired: true,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}