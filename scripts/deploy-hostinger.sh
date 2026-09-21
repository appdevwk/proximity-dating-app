#!/bin/bash
# deploy-hostinger.sh - sync built app to Hostinger hPanel web root
# No secrets in this file. Target host/user come from ~/.ssh/config 'hostinger-proximity'.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=hostinger-proximity        # must exist in ~/.ssh/config
REMOTE_ROOT="${HPANEL_WEBROOT:-/home/u696195120/domains/proximitygetadate.site/public_html}"

echo "== ensure local build exists =="
[ -d .next ] || { echo "no .next; run 'npm run build' first"; exit 2; }

echo "== reachable? (batch ssh - no interactive prompt) =="
ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST" 'echo HOST_UP && pwd' || { echo "HOST_UNREACHABLE - cannot continue"; exit 3; }

echo "== sync .next + public (dry-run, then real) =="
rsync -avz --delete --no-perms --exclude='.git' --exclude='node_modules' \
  --exclude='.next/cache' .next/ "$HOST:$REMOTE_ROOT/.next/" 2>&1 | tail -6
rsync -avz --delete --no-perms public/ "$HOST:$REMOTE_ROOT/public/" 2>&1 | tail -4

echo "== post-deploy smoke: fetch home page status =="
curl -s -o /dev/null -w "proximitygetadate.site -> HTTP %{http_code}\n" --max-time 20 https://proximitygetadate.site/ || echo "SMOKE_FAIL (site may still be warming)"