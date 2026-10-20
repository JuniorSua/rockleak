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
npx --yes vercel@latest deploy --prod --yes 2>&1 | tail -n 5
