#!/usr/bin/env node

/**
 * Promote a user to ADMIN (or demote back to USER).
 *
 * Usage:
 *   npm run db:admin -- user@example.com
 *   npm run db:admin -- user@example.com --demote
 */

import { db } from '../src/lib/db';

async function main() {
  const rawEmail = process.argv[2];
  const demote = process.argv.includes('--demote');
  const promote = process.argv.includes('--promote');

  if (!rawEmail) {
    console.error('Usage: npm run db:admin -- <email> [--promote|--demote]');
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email "${email}".`);
    process.exit(1);
  }

  const target: 'ADMIN' | 'USER' =
    demote || (!promote && user.role === 'ADMIN') ? 'USER' : 'ADMIN';

  const updated = await db.user.update({
    where: { id: user.id },
    data: { role: target },
    select: { email: true, name: true, role: true },
  });

  console.log(
    `${updated.email} (${updated.name ?? 'no display name'}) is now ${target}.`
  );
}

main()
  .catch((error) => {
    console.error('Failed to update role:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });