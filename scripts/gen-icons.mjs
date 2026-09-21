import sharp from 'sharp';
import { mkdir, copyFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const OUT = fileURLToPath(new URL('../public/icons/', import.meta.url));
const path = (name) => `${OUT}${name}`;

// Brand mark: a capital "P" — a ring bowl joined by a vertical stem — filled
// with a pink -> red gradient (rotating through several colors) on pure black.
const P_LETTER = `
<g stroke="url(#pg)" fill="none" stroke-linecap="round">
  <path stroke-width="60" d="M 166 133.5 A 97 97 0 1 1 166 230.5"/>
  <path stroke-width="66" d="M 170 112 L 170 427"/>
</g>`;

// Static gradient for PNG renders: pink -> hot pink -> magenta -> rose -> red.
const P_GRADIENT = `
<linearGradient id="pg" x1="0" y1="0" x2="0.4" y2="1" gradientUnits="objectBoundingBox">
  <stop offset="0"    stop-color="#ff8ac2"/>
  <stop offset="0.3"  stop-color="#ff2ea6"/>
  <stop offset="0.55" stop-color="#e6007c"/>
  <stop offset="0.8"  stop-color="#f43b3b"/>
  <stop offset="1"    stop-color="#d92a2a"/>
</linearGradient>`;

function svg(inner, bg = 'linear') {
  const stops = bg === 'flat'
    ? '<stop offset="0" stop-color="#000000"/><stop offset="1" stop-color="#000000"/>'
    : '<stop offset="0" stop-color="#050505"/><stop offset="1" stop-color="#000000"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    ${P_GRADIENT}
    <linearGradient id="sb" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      ${stops}
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#sb)"/>
  <g filter="url(#glow)">${inner}</g>
</svg>`;
}

await mkdir(OUT, { recursive: true });

// Legacy (rounded-rect, full-bleed P ~78% of canvas).
const legacy = svg(`<clipPath id="rn"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath>
<g clip-path="url(#rn)">${P_LETTER}</g>`);
await sharp(Buffer.from(legacy)).png().toFile(path('icon-512.png'));
await sharp(Buffer.from(legacy)).resize(192, 192).png().toFile(path('icon-192.png'));

// Maskable (full square; P kept inside the 80% safe zone).
const maskable = svg(`${P_LETTER}`, 'flat');
await sharp(Buffer.from(maskable)).png().toFile(path('maskable-512.png'));

// Adaptive-icon foreground: P only, transparent, on a 432px (=108dp@xxxhdpi) canvas.
const adaptiveFg = `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
  <defs>${P_GRADIENT}</defs>
  <g stroke="url(#pg)" fill="none" stroke-linecap="round" transform="translate(36 28) scale(0.875)">
    <path stroke-width="60" d="M 166 133.5 A 97 97 0 1 1 166 230.5"/>
    <path stroke-width="66" d="M 170 112 L 170 410"/>
  </g>
</svg>`;
await sharp(Buffer.from(adaptiveFg)).png().toFile(path('adaptive-fg.png'));

// Legacy launcher mipmaps (pre-Android-8 launchers).
const tile = await sharp(Buffer.from(legacy)).png().toBuffer().catch(() => null);
if (tile) {
  for (const [dp, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
    await sharp(tile).resize(px, px).png().toFile(path(`ic_launcher_${dp}.png`));
  }
}

// Root non-webmanifest icon + favicon source.
await copyFile(path('icon-512.png'), fileURLToPath(new URL('../public/icon.png', import.meta.url)));

console.log('icons written to', OUT);