import { db } from "@/lib/db";
import {
  CURRENT_LEGAL_VERSIONS,
  hasAcceptedCurrentLegalVersions,
  getPendingLegalDocuments,
  type AcceptedLegalVersions,
  type LegalDocumentKey,
} from "@/lib/legal-versions";

export type UserLegalState = AcceptedLegalVersions & {
  userId: string;
  ageDeclarationConfirmed: boolean;
};

export async function getUserLegalState(
  userId: string
): Promise<UserLegalState | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      ageDeclarationConfirmed: true,
      termsVersion: true,
      privacyVersion: true,
      guidelinesVersion: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    ageDeclarationConfirmed: user.ageDeclarationConfirmed,
    termsVersion: user.termsVersion,
    privacyVersion: user.privacyVersion,
    guidelinesVersion: user.guidelinesVersion,
  };
}

export async function userHasValidLegalAcceptance(
  userId: string
): Promise<boolean> {
  const state = await getUserLegalState(userId);
  if (!state) return false;
  if (!state.ageDeclarationConfirmed) return false;
  return hasAcceptedCurrentLegalVersions(state);
}

export async function recordLegalAcceptance(opts: {
  userId: string;
  documents: LegalDocumentKey[];
  ipAddress?: string | null;
  userAgent?: string | null;
  confirmAge?: boolean;
}): Promise<void> {
  const { userId, documents, ipAddress, userAgent, confirmAge } = opts;
  const now = new Date();

  const userUpdate: Record<string, unknown> = {};

  if (confirmAge) {
    userUpdate.ageDeclarationConfirmed = true;
  }

  for (const doc of documents) {
    const version = CURRENT_LEGAL_VERSIONS[doc];
    if (doc === "terms") {
      userUpdate.termsAccepted = true;
      userUpdate.termsAcceptedAt = now;
      userUpdate.termsVersion = version;
      userUpdate.consentIp = ipAddress ?? undefined;
    }
    if (doc === "privacy") {
      userUpdate.privacyAccepted = true;
      userUpdate.privacyAcceptedAt = now;
      userUpdate.privacyVersion = version;
    }
    if (doc === "guidelines") {
      userUpdate.guidelinesAccepted = true;
      userUpdate.guidelinesAcceptedAt = now;
      userUpdate.guidelinesVersion = version;
    }
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: userUpdate,
    }),
    ...documents.map((doc) =>
      db.legalAcceptance.create({
        data: {
          userId,
          document: doc,
          version: CURRENT_LEGAL_VERSIONS[doc],
          acceptedAt: now,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      })
    ),
  ]);
}

export async function acceptAllPendingLegalDocuments(opts: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  confirmAge?: boolean;
}): Promise<{ accepted: LegalDocumentKey[] }> {
  const state = await getUserLegalState(opts.userId);
  if (!state) throw new Error("User not found");

  const pending = getPendingLegalDocuments(state);
  const toAccept: LegalDocumentKey[] =
    pending.length > 0
      ? pending
      : ["terms", "privacy", "guidelines"];

  await recordLegalAcceptance({
    userId: opts.userId,
    documents: toAccept,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    confirmAge: opts.confirmAge ?? true,
  });

  return { accepted: toAccept };
}

export {
  hasAcceptedCurrentLegalVersions,
  getPendingLegalDocuments,
  CURRENT_LEGAL_VERSIONS,
};
