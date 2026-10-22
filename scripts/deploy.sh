#!/usr/bin/env bash
# Deploy to Vercel production from committed files only; uncommitted work never ships.
#
#   scripts/deploy.sh                 full deploy of HEAD (coding sessions). Records HEAD as the
#                                     last deployed code.
#   scripts/deploy.sh --content-only  newsroom runs: the last deployed code plus content/ from HEAD,
#                                     so a story can't ship someone's untested code commits with it.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAST="$ROOT/newsroom/desk/last-deploy-sha"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ "${1:-}" = "--content-only" ]; then
  if [ ! -f "$LAST" ]; then echo "deploy FAILED: no record of the last full deploy ($LAST). A coding session must run scripts/deploy.sh once."; exit 1; fi
  BASE="$(cat "$LAST")"
  git -C "$ROOT" archive "$BASE" | tar -x -C "$TMP"
  rm -rf "$TMP/content"
  git -C "$ROOT" archive HEAD content | tar -x -C "$TMP"
  echo "content-only: code from ${BASE:0:7}, content from $(git -C "$ROOT" rev-parse --short HEAD)"
else
  git -C "$ROOT" archive HEAD | tar -x -C "$TMP"
fi

cp -r "$ROOT/.vercel" "$TMP/.vercel"
cd "$TMP"
URL="$(npx --yes vercel@latest deploy --prod --yes 2>/dev/null | grep -Eo "https://[a-z0-9-]+\.vercel\.app" | tail -n 1)" || true
if [ -z "$URL" ]; then echo "deploy FAILED (run: npx vercel@latest ls rockleak)"; exit 1; fi
if [ "${1:-}" != "--content-only" ]; then
  mkdir -p "$(dirname "$LAST")"
  git -C "$ROOT" rev-parse HEAD > "$LAST"
fi
echo "deployed to production: $URL"
