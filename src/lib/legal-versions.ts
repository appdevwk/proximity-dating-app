/**
 * Legal Document Version Registry
 * Single source of truth for Terms, Privacy Policy, and Community Guidelines.
 *
 * HOW TO BUMP A VERSION
 * 1. Update version + effectiveDate below.
 * 2. Update the public page content under src/app/terms, privacy, community-guidelines.
 * 3. Deploy. Users on an older accepted version are gated on next authenticated request.
 */

export type LegalDocumentKey = "terms" | "privacy" | "guidelines";

export interface LegalDocumentVersion {
  version: string;
  effectiveDate: string;
  title: string;
  path: string;
  summary: string;
}

export const LEGAL_VERSIONS: Record<LegalDocumentKey, LegalDocumentVersion> = {
  terms: {
    version: "2.0",
    effectiveDate: "2026-09-18",
    title: "Terms of Service",
    path: "/terms",
    summary:
      "Updated eligibility, age-verification requirements, explicit bans on commercial sex and trafficking (FOSTA-SESTA), location consent, and stronger limitation of liability.",
  },
  privacy: {
    version: "2.0",
    effectiveDate: "2026-09-18",
    title: "Privacy Policy",
    path: "/privacy",
    summary:
      "Expanded description of age-verification and biometric data, retention rules for ID images, third-party verification vendors, and state privacy rights.",
  },
  guidelines: {
    version: "1.0",
    effectiveDate: "2026-09-18",
    title: "Community Guidelines & Safety Standards",
    path: "/community-guidelines",
    summary:
      "Zero-tolerance CSAM policy, bans on prostitution/trafficking/sugar-for-sex, consent rules, reporting process, and child-safety contact.",
  },
};

export const CURRENT_LEGAL_VERSIONS = {
  terms: LEGAL_VERSIONS.terms.version,
  privacy: LEGAL_VERSIONS.privacy.version,
  guidelines: LEGAL_VERSIONS.guidelines.version,
} as const;

export type AcceptedLegalVersions = {
  termsVersion: string | null;
  privacyVersion: string | null;
  guidelinesVersion: string | null;
};

export function hasAcceptedCurrentLegalVersions(
  accepted: AcceptedLegalVersions
): boolean {
  return (
    accepted.termsVersion === CURRENT_LEGAL_VERSIONS.terms &&
    accepted.privacyVersion === CURRENT_LEGAL_VERSIONS.privacy &&
    accepted.guidelinesVersion === CURRENT_LEGAL_VERSIONS.guidelines
  );
}

export function getPendingLegalDocuments(
  accepted: AcceptedLegalVersions
): LegalDocumentKey[] {
  const pending: LegalDocumentKey[] = [];
  if (accepted.termsVersion !== CURRENT_LEGAL_VERSIONS.terms) pending.push("terms");
  if (accepted.privacyVersion !== CURRENT_LEGAL_VERSIONS.privacy) pending.push("privacy");
  if (accepted.guidelinesVersion !== CURRENT_LEGAL_VERSIONS.guidelines)
    pending.push("guidelines");
  return pending;
}
