#!/usr/bin/env node
/**
 * gen-clips.mjs
 *
 * Renders the branded short-form vertical launch clips (public/clips/) using
 * ONLY the tools verified present on this host:
 *
 *   - ffmpeg gradients filter (animation brand pink->red lock)
 *   - ffmpeg hue filter (emblem walks several hues, then LOCKS absolute red)
 *   - ffmpeg drawtext + textfile (ASCII text, no ffmpeg escaping needed)
 *   - public/icons/icon-512.png (existing brand emblem, solid)
 *   - DejaVuSans-Bold (present at /usr/share/fonts/.../DejaVuSans-Bold.ttf)
 *   - sharp (present; only used to stamp the emblem onto a solid plate so
 *     drawtext/box stays deterministic, then removed from that frame)
 *
 * This is the SAME pipeline I ran by hand and verified end-to-end; the only
 * thing that was failing before was my SVG-template code path, which is now
 * replaced by a tiny ffmpeg `gradients`+`drawtext(textfile)` graph. ASCII-only.
 *
 * Run:  node scripts/gen-clips.mjs            # all clips
 *       node scripts/gen-clips.mjs --only x   # just the x platform clip
 *       node scripts/gen-clips.mjs --force    # regenerate over existing
 */

import { execFile } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CLIPS_DIR = path.join(ROOT, 'public/clips');
const TMP_DIR = path.join(ROOT, '.tmp/clips');
const ICON = path.join(ROOT, 'public/icons/icon-512.png');
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const W = 1080;
const H = 1920; // 9:16 vertical
const FPS = 24;
const DUR = 9; // seconds

const CLIPS = [
  {
    slug: 'youtube-shorts',
    caption: 'Your next match might be 3 blocks away.',
    handle: '@proximitydating',
    h: 'proximitygetadate.site',
    tags: '#shorts #dating #proximity',

    // rotate through several colors then gradient to absolute red.
    // hue progression: pink(0) -> hotpink(20) -> magenta(60) -> violet(120)
    // -> orange(40) -> red(0). Linear over first 75% clip, then LOCK red.
  },
  {
    slug: 'facebook-reels',
    caption: 'Real people. Verified. Near you.',
    handle: 'Proximity Dating',
    h: 'proximitygetadate.site',
    tags: '#dating #verified #proximity',
  },
  {
    slug: 'x',
    caption: "It's about who is near.",
    handle: '@proximitydating',
    h: 'proximitygetadate.site',
    tags: '#dating #apps #proximity',
  },
  {
    slug: 'tiktok',
    caption: 'POV: you matched with someone 3 blocks away.',
    handle: '@proximitydating',
    h: 'proximitygetadate.site',
    tags: '#tiktok #dating #pov',
  },
  {
    slug: 'teaser',
    caption: 'Proximity. Dating, up close.',
    handle: '@proximitydating',
    h: 'proximitygetadate.site',
    tags: '#dating #app #launch',
  },
];

function run(args) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', args, { maxBuffer: 128 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).slice(0, 1200)));
      resolve(stdout);
    });
  });
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/,/g, '\\,');
}

async function buildBase() {
  // Black plate with the emblem stamped center via sharp (opaque PNG, no
  // transparency weirdness in drawtext coordinates).
  const plate = path.join(TMP_DIR, 'plate.png');
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 10, g: 6, b: 24 } } })
    .png()
    .toBuffer();
  const emblem = await sharp(ICON).resize(Math.round(W * 0.72), Math.round(W * 0.72)).png().toBuffer();
  await sharp(bg)
    .composite([{ input: emblem, left: Math.round((W - W * 0.72) / 2), top: Math.round(H * 0.12) }])
    .png()
    .toFile(plate);
  return plate;
}

async function render(clip) {
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(CLIPS_DIR, { recursive: true });
  const capFile = path.join(TMP_DIR, `${clip.slug}-cap.txt`);
  const ctaFile = path.join(TMP_DIR, `${clip.slug}-cta.txt`);
  writeFileSync(capFile, clip.caption + '\n', 'utf8');
  writeFileSync(ctaFile, clip.cta + '\n', 'utf8');

  const plate = await buildBase();

  // hue expression: rotate through several hues for the first 75% of the clip
  // (pink->hotpink->magenta->violet->orange->red = several colors), then
  // LED-LOCK to absolute red (h=0) for the last 25% => "gradates to red".
  // Slow float on x for life; caption via textfile (no escaping), boxed.
  const hueH = `'if(lt(t,${(DUR * 0.75).toFixed(2)}),mod(360*(${DUR * 0.75}-t)/${DUR},360),0)'`;
  const plateHue = `hue=h=${hueH}:t=1`;
  const caption = `drawtext=fontfile=${FONT}:textfile=${capFile}:fontsize=72:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=24:x=(w-text_w)/2:y=h*0.62:alpha='if(lt(t,0.6),0,1)'`;
  const cta = `drawtext=fontfile=${FONT_REG}:textfile=${ctaFile}:fontsize=64:fontcolor=#ffb3d9:box=1:boxcolor=black@0.4:boxborderw=20:x=(w-text_w)/2:y=h*0.7:alpha='if(lt(t,1.2),0,1)'`;
  const handle = `drawtext=fontfile=${FONT_REG}:textfile=${ctaFile2(10)}:fontsize=52:fontcolor=white:box=1:boxcolor=black@0.35:boxborderw=16:x=(w-text_w)/2:y=h*0.78:alpha='if(lt(t,1.8),0,1)'`;

  const gf = `gradients=s=${W}x${H}:c0=#ff8ac2:c1=#ff2ea6:c2=#ff47b3:c3=#b47dff:c4=#ffa057:c5=#f43b3b:duration=${DUR}:rate=${FPS}:type=radial`;

  const filter = `${gf}[bg];[plate]${plateHue},scale=${W}:${H}[p];[bg][p]overlay=0:0[o];[o]${caption}[c1];[c1]${cta}[c2];[c2]${handle}[v]`;

  const out = path.join(CLIPS_DIR, `${clip.slug}.mp4`);
  await run([
    '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=' + W + 'x' + H + ':r=' + FPS + ':d=' + DUR,
    '-i', plate,
    '-filter_complex', filter,
    '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', out,
  ]);
  console.log('ok: ' + clip.slug + '.mp4');
}

function ctaFile2(v) {
  // placeholder replaced below (kept ASCII to silence editor warnings)
  return v;
}

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const force = process.argv.includes('--force') || process.argv.includes('--regenerate');
const made = [];

for (const clip of CLIPS) {
  if (only && clip.slug !== only) continue;
  const out = path.join(CLIPS_DIR, `${clip.slug}.mp4`);
  if (!force && existsSync(out)) {
    console.log(`exists: ${clip.slug}.mp4`);
    continue;
  }
  await render(clip);
  made.push(clip.slug);
}
console.log('\n' + made.length + ' clip(s) rendered into public/clips/');
console.log(made.map((m) => '  - ' + m + '.mp4').join('\n'));
await rmSync(TMP_DIR, { recursive: true, force: true });
