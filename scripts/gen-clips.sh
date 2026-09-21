#!/bin/bash
# ---------------------------------------------------------------------------
# scripts/gen-clips.sh  — brand vertical clips via ffmpeg ONLY.
#
# Reuses the platform-verified primitives from THIS host's earlier successful
# runs:
#   * public/icons/icon-512.png   (brand emblem, sharp-rendered, 54KB ✓)
#   * ffmpeg 8.1 gradients fill   (animated pink→violet→orange→red bg) ✓
#   * ffmpeg drawtext via textfile= for captions (NO escaping, ASCII-only) ✓
#   * ffmpeg hue for the emblem rotation (T-driven) then LOCK at red ✓
#   * /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf (present ✓)
#   * ffprobe verification ✓
#
# Emits public/clips/<platform>.mp4 (1080x1920, ~7s, H.264, 24fps, 9:16).
#
# Usages:
#   ./scripts/gen-clips.sh            # all 5
#   ./scripts/gen-clips.sh facebook   # one platform
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

CLIPS=public/clips
TMP=.tmp/frames
mkdir -p "$CLIPS" "$TMP"

FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FONT_R=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
EMB=public/icons/icon-512.png
W=1080; H=1920; FPS=24; DUR=7

run_ff() {
  local slug="$1"; shift
  local cap="$1"; shift
  local cta="$1"; shift
  local handle="$1"; shift
  local hash="$1"; shift

  printf '%s' "$cap"    > "$TMP/$slug.cap"
  printf '%s' "$cta"    > "$TMP/$slug.cta"
  printf '%s' "$handle" > "$TMP/$slug.handle"
  printf '%s' "$hash"   > "$TMP/$slug.hash"

  local size=1080x1920
  local gfb="gradients=s=$size:x0=0:y0=0:x1=$W:y1=$H:c0=#ff8ac2:c1=#ff2ea6:c2=#ff9ad9:c3=#ff5f5f:c4=#d92a2a:duration=$DUR:speed=0.08:rate=$FPS"
  local vf="$gfb[g];"
  vf+="[g]hue=h='if(lt(t,$((DUR-1))),mod(($((DUR-1))*40 - t*40)/1,360),0)':t=1[b];"
  vf+="[1:v]format=rgba,scale=-1:${H}*0.56,hue=h='if(lt(t,1),mod(60*t,360),if(lt(t,$((DUR-1))),mod(240*t,360),0))':t=1[c];"
  vf+="[b][c]overlay=(W-w)/2:(H-h)*0.10[o];"
  vf+="[o]drawtext=fontfile=$FONT:textfile=$TMP/$slug.cap:fontsize=78:fontcolor=white:line_spacing=10:box=1:boxcolor=black@0.6:boxborderw=22:x=(w-text_w)/2:y=h*0.62[t];"
  vf+="[t]drawtext=fontfile=$FONT_R:textfile=$TMP/$slug.cta:fontsize=60:fontcolor=#ffb3c2:box=1:boxcolor=black@0.6:boxborderw=18:x=(w-text_w)/2:y=h*0.70[u];"
  vf+="[u]drawtext=fontfile=$FONT_R:textfile=$TMP/$slug.handle:fontsize=50:fontcolor=white@0.9:box=1:boxcolor=black@0.5:boxborderw=16:x=(w-text_w)/2:y=h*0.76[v];"
  vf+="[v]drawtext=fontfile=$FONT_R:textfile=$TMP/$slug.hash:fontsize=58:fontcolor=#ff4d9e@0.9:x=(w-text_w)/2:y=h*0.84,format=yuv420p[v]"

  ffmpeg -y -f lavfi -i "color=c=black:s=$size:r=$FPS:d=$DUR" -i "$EMB" \
    -filter_complex "$vf" -map "[v]" -c:v libx264 -preset fast -crf 22 \
    -pix_fmt yuv420p -movflags +faststart -an "$CLIPS/$slug.mp4"

  ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,duration -of csv=p=0 "$CLIPS/$slug.mp4"
}

run_ff youtube-shorts  \
  "Your next match might be" "3 blocks away." "proximitygetadate.site" "@proximitydating" "#shorts" &
run_ff facebook-reels \
  "Real people." "Verified. Near you." "proximitygetadate.site" "@proximitydating" "#reels" &
run_ff x \
  "Dating starts at" "proximitygetadate.site" "Verified. Real." "@proximitydating" "#dating" &
run_ff tiktok \
  "POV: you matched with" "someone 3 blocks away." "proximitygetadate.site" "@proximitydating" "#tiktok" &
run_ff teaser \
  "Proximity" "Dating. Up close." "proximitygetadate.site" "@proximitydating" "#teaser" &
wait

echo
echo "complete:"
ls -1 "$CLIPS" | sed 's/^/  - /'
