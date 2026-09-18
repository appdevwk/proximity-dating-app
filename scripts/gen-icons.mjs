import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const OUT = fileURLToPath(new URL('../public/icons/', import.meta.url));
const path = (name) => `${OUT}${name}`;

// Brand mark: the geometric emblem from public/logo.svg, redrawn flat in warm
// brand tones on a dark rounded square. Maskable variant keeps the emblem
// inside the 80% safe circle (crops applied by Android launchers).
const emblem = (scale, yOffset) => `
<g transform="translate(0 ${yOffset}) scale(${scale})">
  <polygon fill="url(#e1)"  points="1008.73 0 827.29 251.03 54.43 251.03 235.74 0 1008.73 0"/>
  <polygon fill="url(#e2)"  points="1937.79 1449.1 1756.47 1700 986.3 1700 1167.48 1449.1 1937.79 1449.1"/>
  <polygon fill="url(#e3)"  points="2000 0 771.98 1700 0 1700 1228.02 0 2000 0"/>
</g>
<defs>
  <linearGradient id="e1" x1="500" y1="0" x2="500" y2="1700" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ff5a52"/><stop offset="1" stop-color="#d6372f"/>
  </linearGradient>
  <linearGradient id="e2" x1="1450" y1="0" x2="1450" y2="1700" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffb24d"/><stop offset="1" stop-color="#e0813a"/>
  </linearGradient>
  <linearGradient id="e3" x1="1000" y1="0" x2="1000" y2="1700" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#f04a3a"/>
  </linearGradient>
</defs>`;

function svg(inner, bg = 'linear') {
  const stops = bg === 'flat'
    ? '<stop offset="0" stop-color="#171023"/><stop offset="1" stop-color="#171023"/>'
    : '<stop offset="0" stop-color="#241233"/><stop offset="1" stop-color="#100a1a"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${inner}
</svg>`;
}

await mkdir(OUT, { recursive: true });

// Legacy (rounded-rect, full-bleed artwork, emblem ~78% of canvas).
const legacy = svg(`<clipPath id="rn"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath>
<g clip-path="url(#rn)">${emblem(0.256, 46)}</g>`);
await sharp(Buffer.from(legacy)).png().toFile(path('icon-512.png'));
await sharp(Buffer.from(legacy)).resize(192, 192).png().toFile(path('icon-192.png'));

// Maskable (full square; emblem scaled to ~60% = inside the 80% safe zone).
const maskable = svg(`${emblem(0.196, 0)}`, 'flat');
await sharp(Buffer.from(maskable)).png().toFile(path('maskable-512.png'));

// Adaptive-icon foreground: emblem only, transparent, on a 432px (=108dp@xxxhdpi) canvas.
const adaptiveFg = `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
  ${emblem(0.5, 26)}
</svg>`;
await sharp(Buffer.from(adaptiveFg)).png().toFile(path('adaptive-fg.png'));

// Legacy launcher mipmaps (pre-Android-8 launchers).
const tile = await sharp(Buffer.from(legacy)).png().toBuffer().catch(() => null);
if (tile) {
  for (const [dp, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
    await sharp(tile).resize(px, px).png().toFile(path(`ic_launcher_${dp}.png`));
  }
}

console.log('icons written to', OUT);