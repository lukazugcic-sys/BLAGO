#!/usr/bin/env bash
# Rebuild the beta APK whenever the game is newer than the packed file.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/artifacts/apk-watch.log"
mkdir -p "$ROOT/artifacts"
echo "$(date -u +%FT%TZ) watch start" >> "$LOG"
while true; do
  if "$ROOT/scripts/pack-apk.sh" >> "$LOG" 2>&1; then
    :
  else
    echo "$(date -u +%FT%TZ) pack failed $?" >> "$LOG"
  fi
  sleep 90
done
