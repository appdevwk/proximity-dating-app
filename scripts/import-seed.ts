#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const db = new PrismaClient();

interface SeedUser {
  id: string;
  email: string;
  emailVerified: number;
  name: string | null;
  password: string;
  ageVerified: number;
  isActive: number;
  isBanned: number;
  lastLogin: null | string | number;
  createdAt: number;
  updatedAt: number;
}
interface SeedProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  dateOfBirth: number;
  gender: string;
  interestedIn: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  profilePicture: string | null;
  isProfilePublic: number;
  showDistance: number;
  createdAt: number;
  updatedAt: number;
}
interface SeedPrefs {
  id: string;
  userId: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interestedIn: string;
  relationshipType: string;
  lookingFor: string | null;
  createdAt: number;
  updatedAt: number;
}
interface SeedFile {
  User: SeedUser[];
  Profile: SeedProfile[];
  Preferences: SeedPrefs[];
}

async function main() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
  const seed: SeedFile = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  const existingUsers = new Set((await db.user.findMany({ select: { id: true } })).map((u) => u.id));
  const existingProfiles = new Set((await db.profile.findMany({ select: { id: true } })).map((p) => p.id));

  const pwHash = await bcrypt.hash('imported_user', 12);

  let users = 0;
  for (const u of seed.User) {
    if (existingUsers.has(u.id)) continue;
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        emailVerified: u.emailVerified === 1,
        name: u.name,
        password: pwHash,
        ageVerified: u.ageVerified === 1,
        isActive: u.isActive === 1,
        isBanned: u.isBanned === 1,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
    existingUsers.add(u.id);
    users++;
  }
  console.log(`users added: ${users}`);

  let profiles = 0;
  for (const p of seed.Profile) {
    if (existingProfiles.has(p.id)) continue;
    if (!existingUsers.has(p.userId)) continue;
    const gender = p.gender?.toUpperCase();
    await db.profile.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        userId: p.userId,
        externalId: null,
        displayName: p.displayName,
        bio: p.bio,
        dateOfBirth: new Date(p.dateOfBirth),
        gender: gender as any,
        interestedIn: p.interestedIn as any,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        profilePicture: p.profilePicture,
        isProfilePublic: p.isProfilePublic === 1,
        showDistance: p.showDistance === 1,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    profiles++;
  }
  console.log(`profiles added: ${profiles}`);

  let prefs = 0;
  for (const pr of seed.Preferences) {
    if (!existingUsers.has(pr.userId)) continue;
    await db.preferences.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        id: pr.id,
        userId: pr.userId,
        minAge: pr.minAge,
        maxAge: pr.maxAge,
        maxDistance: pr.maxDistance,
        interestedIn: pr.interestedIn,
        relationshipType: pr.relationshipType,
        lookingFor: pr.lookingFor,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt),
      },
    });
    prefs++;
  }
  console.log(`preferences added: ${prefs}`);

  const totals = {
    users: await db.user.count(),
    profiles: await db.profile.count(),
  };
  console.log('new totals:', totals);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());