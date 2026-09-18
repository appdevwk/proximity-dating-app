#!/usr/bin/env node
/**
 * Remove obsolete deployment artifacts from the Git index.
 *
 * Run from the repository root:
 *   node scripts/clean-repo-artifacts.mjs --dry-run
 *   node scripts/clean-repo-artifacts.mjs --apply
 *
 * This deliberately removes files from Git tracking only; it does not delete
 * local database or upload data unless --apply is explicitly supplied.
 */
import { execFileSync } from 'node:child_process';

const candidates = [
  'backup-final-install-20250809-230750',
  'usr',
  'cloudflared.deb',
  'control.tar.gz',
  'data.tar.gz',
  'debian-binary',
  'cloudflared.yml',
  'cloudflare-block-page.html',
  'db',
  'cloudflared.log',
  'cloudflared-custom.log',
];

const apply = process.argv.includes('--apply');
const existing = candidates.filter((path) => {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', path], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});

if (existing.length === 0) {
  console.log('No tracked deployment artifacts found.');
  process.exit(0);
}

console.log(`${apply ? 'Removing' : 'Would remove'} tracked artifacts:`);
for (const path of existing) console.log(`- ${path}`);

if (apply) {
  execFileSync('git', ['rm', '-r', '--ignore-unmatch', ...existing], { stdio: 'inherit' });
  console.log('Cleanup complete. Review the staged deletions, then commit them.');
} else {
  console.log('Run again with --apply to stage these deletions.');
}
