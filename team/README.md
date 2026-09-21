# WhiteKnight Studios — Operator Team

Parent studio: **WhiteKnight Studios** (backing brand, per USB drive: `/mnt/usb4tb/whiteknight`, `whiteknightai-computer`).
Launch property in this repo: **Proximity** — the proximity dating platform (`proximitygetadate.site`).

## Team roster (loadable agent specs)

| Agent | File | Role |
|---|---|---|
| LexiPullman CEO Agent | `team/agent-lexipullman-ceo.md` | Founder persona — brand voice, approvals, final sign-off |
| Operations Lead (lexii) | `team/agent-ops-lead.md` | Build + run pipelines, verify, report truthfully |
| Social Writer | `team/agent-social-writer.md` | Per-platform copy for posts + ads |
| Clips Engineer | `team/agent-clips-engineer.md` | 9:16 short-video renders (ffmpeg) |
| Data/Analyst | `team/agent-analyst.md` | Metrics, RSS/feed integrity, runbook checks |
| Integration Agent | `team/agent-integration.md` | Bridges WhiteKnight AI / Pullman AI platforms where safe |

## Integration boundary (decided 2026-09-21)
- **IN scope:** WhiteKnight Studios as parent-studio attribution on media + docs; platform cross-links; brand hooks.
- **NOT in scope (hold):** estate/probate/litigation/financial material found on the USB (`pullman-openclaw`, `lexipullman-probate`, death certs, will-contest evidence, asset tracking). Private and legally sensitive — do not copy into the repo, do not post, do not summarize contents.

## Tomorrow's task queue (after user quality check)
1. Confirm today's 7 auto-generated posts in `content/posts/` render on `/news` + RSS.
2. Wire npm scripts `gen:social` / `gen:clips`.
3. Verify clip render pipeline end-to-end (plate.mp4 works; full 5-platform render needs the drawtext textfile fix).
4. Add `docs/social/ads/*` per-platform ad copy.
5. Resolve cron timezone (UTC vs Florida ET) with user.
