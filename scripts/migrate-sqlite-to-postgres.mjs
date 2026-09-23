/**
 * One-off migration: SQLite (Docker deploy) -> managed Postgres (Vercel).
 *
 * Reads JSON exports from /tmp/opencode/sqlite-export/ and inserts into the
 * Postgres database pointed to by DATABASE_URL, using the app's Prisma schema.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/migrate-sqlite-to-postgres.mjs
 *
 * Idempotent: uses createMany with skipDuplicates, so re-running is safe.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();

const toBool = (v) => v === 1 || v === true || v === 'true';
const toDate = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') {
    // SQLite "YYYY-MM-DD HH:MM:SS" is UTC; ISO strings pass through.
    const s = v.includes('T') ? v : v.replace(' ', 'T') + 'Z';
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return v;
};

const load = (name) =>
  JSON.parse(readFileSync(`/tmp/opencode/sqlite-export/${name}.json`, 'utf8'));

async function main() {
  // 1. users
  const users = load('users');
  const r1 = await prisma.user.createMany({
    data: users.map((u) => ({
      id: u.id,
      email: u.email,
      emailVerified: toBool(u.emailVerified),
      name: u.name,
      password: u.password,
      role: u.role,
      ageVerified: toBool(u.ageVerified),
      ageDeclarationConfirmed: toBool(u.ageDeclarationConfirmed),
      termsAccepted: toBool(u.termsAccepted),
      termsAcceptedAt: toDate(u.termsAcceptedAt),
      termsVersion: u.termsVersion,
      consentIp: u.consentIp,
      privacyAccepted: toBool(u.privacyAccepted),
      privacyAcceptedAt: toDate(u.privacyAcceptedAt),
      privacyVersion: u.privacyVersion,
      guidelinesAccepted: toBool(u.guidelinesAccepted),
      guidelinesAcceptedAt: toDate(u.guidelinesAcceptedAt),
      guidelinesVersion: u.guidelinesVersion,
      photoVerified: toBool(u.photoVerified),
      photoSubmittedAt: toDate(u.photoSubmittedAt),
      faceFingerprint: u.faceFingerprint,
      faceFingerprintVersion: u.faceFingerprintVersion,
      idVerified: toBool(u.idVerified),
      idVerifiedAt: toDate(u.idVerifiedAt),
      idDocumentHash: u.idDocumentHash,
      idFaceMatchScore: u.idFaceMatchScore,
      livenessVerified: toBool(u.livenessVerified),
      livenessVerifiedAt: toDate(u.livenessVerifiedAt),
      siteMode: u.siteMode,
      emailVerifyToken: u.emailVerifyToken,
      emailVerifyTokenExpires: toDate(u.emailVerifyTokenExpires),
      emailVerifiedAt: toDate(u.emailVerifiedAt),
      passwordResetToken: u.passwordResetToken,
      passwordResetTokenExpires: toDate(u.passwordResetTokenExpires),
      isActive: toBool(u.isActive),
      isBanned: toBool(u.isBanned),
      lastLogin: toDate(u.lastLogin),
      createdAt: toDate(u.createdAt),
      updatedAt: toDate(u.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`users: ${r1.count} inserted`);

  // Valid user IDs (for FK filtering — SQLite had orphaned rows)
  const validUserIds = new Set(users.map((u) => u.id));

  // 2. profiles
  const profiles = load('profiles').filter((p) => validUserIds.has(p.userId));
  const skippedProfiles = 505 - profiles.length;
  const r2 = await prisma.profile.createMany({
    data: profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      externalId: p.externalId,
      displayName: p.displayName,
      bio: p.bio,
      dateOfBirth: toDate(p.dateOfBirth),
      gender: p.gender,
      interestedIn: p.interestedIn,
      location: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      profilePicture: p.profilePicture,
      isProfilePublic: toBool(p.isProfilePublic),
      showDistance: toBool(p.showDistance),
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`profiles: ${r2.count} inserted (${skippedProfiles} orphaned skipped)`);

  // 3. preferences
  const prefs = load('preferences').filter((p) => validUserIds.has(p.userId));
  const skippedPrefs = 503 - prefs.length;
  const r3 = await prisma.preferences.createMany({
    data: prefs.map((p) => ({
      id: p.id,
      userId: p.userId,
      minAge: p.minAge,
      maxAge: p.maxAge,
      maxDistance: p.maxDistance,
      interestedIn: p.interestedIn,
      relationshipType: p.relationshipType,
      lookingFor: p.lookingFor,
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`preferences: ${r3.count} inserted (${skippedPrefs} orphaned skipped)`);

  // 4. media
  const media = load('media').filter((m) => validUserIds.has(m.userId));
  const skippedMedia = 6 - media.length;
  const r4 = await prisma.media.createMany({
    data: media.map((m) => ({
      id: m.id,
      userId: m.userId,
      url: m.url,
      type: m.type,
      isPublic: toBool(m.isPublic),
      isApproved: toBool(m.isApproved),
      createdAt: toDate(m.createdAt),
      updatedAt: toDate(m.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`media: ${r4.count} inserted (${skippedMedia} orphaned skipped)`);

  // 5. verifications
  const verifs = load('verifications').filter((v) => validUserIds.has(v.userId));
  const skippedVerifs = 1 - verifs.length;
  const r5 = await prisma.verification.createMany({
    data: verifs.map((v) => ({
      id: v.id,
      userId: v.userId,
      documentType: v.documentType,
      documentUrl: v.documentUrl,
      facialData: v.facialData,
      biometricData: v.biometricData,
      faceVerified: toBool(v.faceVerified),
      biometricVerified: toBool(v.biometricVerified),
      faceFingerprint: v.faceFingerprint,
      matchScore: v.matchScore,
      matchUserId: v.matchUserId,
      idSource: v.idSource,
      idDocumentHash: v.idDocumentHash,
      dob: v.dob,
      documentCountry: v.documentCountry,
      idFaceMatchScore: v.idFaceMatchScore,
      livenessVerified: toBool(v.livenessVerified),
      livenessScore: v.livenessScore,
      status: v.status,
      verifiedAt: toDate(v.verifiedAt),
      createdAt: toDate(v.createdAt),
      updatedAt: toDate(v.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`verifications: ${r5.count} inserted (${skippedVerifs} orphaned skipped)`);

  // 6. matches
  const matches = load('matches').filter(
    (m) => validUserIds.has(m.user1Id) && validUserIds.has(m.user2Id)
  );
  const skippedMatches = 33 - matches.length;
  const r6 = await prisma.match.createMany({
    data: matches.map((m) => ({
      id: m.id,
      user1Id: m.user1Id,
      user2Id: m.user2Id,
      status: m.status,
      user1Action: m.user1Action,
      user2Action: m.user2Action,
      createdAt: toDate(m.createdAt),
      updatedAt: toDate(m.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`matches: ${r6.count} inserted (${skippedMatches} orphaned skipped)`);

  console.log('\nMigration complete.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());