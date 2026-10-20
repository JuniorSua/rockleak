#!/usr/bin/env bash
# Deploy exactly what is committed (HEAD) to Vercel production. Uncommitted work in the
# checkout never ships, so a newsroom run can't deploy someone's half-finished edit.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git -C "$ROOT" archive HEAD | tar -x -C "$TMP"
cp -r "$ROOT/.vercel" "$TMP/.vercel"
cd "$TMP"
URL="$(npx --yes vercel@latest deploy --prod --yes 2>/dev/null | grep -Eo "https://[a-z0-9-]+\.vercel\.app" | tail -n 1)"
if [ -z "$URL" ]; then echo "deploy FAILED (run: npx vercel@latest ls rockleak)"; exit 1; fi
echo "deployed to production: $URL"
