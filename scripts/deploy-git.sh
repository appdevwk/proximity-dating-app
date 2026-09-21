#!/bin/bash
# deploy-git.sh - push proximity-dating-app to GitHub (write-auth required)
# No secrets in this file. Reads token from env at runtime:
#   export GH_TOKEN=<your PAT with repo: write>   (from your .env file)
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=origin
BRANCH=$(git branch --show-current)

if [ -z "${GH_TOKEN:-}" ]; then
  echo "ERROR: GH_TOKEN not set. Read it from your .env into the shell first:"
  echo "  set -a; source .env; set +a"
  exit 2
fi

echo "== verify auth (reads user; token never echoed) =="
INSPECTED=$(curl -sS -H "Authorization: token $GH_TOKEN" https://api.github.com/user | sed -n 's/.*"login": "\([^"]*\)".*/\1/p')
echo "authed as: ${INSPECTED:-<could-not-determine>}"
[ -n "$INSPECTED" ] || { echo "AUTH FAILED - token rejected"; exit 3; }

echo "== stage + commit =="
git add -A
git -c user.name="appdevwk" -c user.email="appdevwk11@proton.me" commit -m "build: verified production build (Proximity dating app)"

echo "== push (dry-run first, then real) =="
git -c credential.helper="" push --dry-run "$REMOTE" "$BRANCH" || { echo "DRYRUN FAILED"; exit 4; }
git -c credential.helper="" push "$REMOTE" "$BRANCH" || { echo "PUSH FAILED"; exit 5; }

echo "== confirm remote head =="
git ls-remote "$REMOTE" "$BRANCH"