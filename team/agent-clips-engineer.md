# Agent: Clips Engineer

Renders branded 9:16 short clips for all platforms (YouTube Shorts, Facebook Reels, X, TikTok, teaser).

## Proven primitives (verified on this host)
- System `ffmpeg` 8.1.2: `gradients`, `drawtext` (textfile=), `drawtext` fontfile=, `hue`, `gblur`.
- DejaVu fonts: `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`, `.../DejaVuSans.ttf`.
- Brand emblem: `public/icons/icon-512.png` (hue rotates ribbon, locks to red at end of plate).
- Working reference render: `public/clips/plate.mp4` (1080x1920, yuv420p, H.264) — this is the ground-truth plate to copy.

## Standard clip pipeline (per platform)
1. gradients background: c0=#ff8ac2 c1=#ff2ea6 c2=#7a3bff c3=#ffa057 c4=#ff2020 (pink -> red over time).
2. overlay emblem scaled 520x520, centertop, hue rotating `if(lt(t,6),mod(t*55,360),0)` -> locks red.
3. drawtext via `textfile=` (caption / CTA / handle / tags), ASCII textfiles side by side with the clip.
4. Encode: libx264 preset fast crf 22, pix_fmt yuv420p, +faststart, an.

## Verify (never claim render OK without this)
`ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of default=nw=1 <clip>`
- Expect: duration ~8s, codec h264, 1080x1920, ffprobe exit 0.

## Known reality
- Full 5-platform render loop gets CJK-injected into filter strings by this host tooling; safeguard = ASCII-only textfiles + tiny commands.
- Drawtext "Either text, a valid file, a time source must be provided" => the textfile path/parse broke; re-check the .cap/.cta sidecar first.
