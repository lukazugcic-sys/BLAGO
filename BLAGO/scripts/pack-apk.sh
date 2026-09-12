#!/usr/bin/env bash
# Pack current BLAGO into public/BLAGO.apk so the beta menu always serves the latest game.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOCK="$ROOT/artifacts/.pack-apk.lock"
mkdir -p "$ROOT/artifacts"
exec 9>"$LOCK"
if ! flock -n 9; then
  echo "pack-apk: already running"
  exit 0
fi

export JAVA_HOME="${JAVA_HOME:-/workspace/.jdk/jdk-21.0.12.1+1}"
export ANDROID_HOME="${ANDROID_HOME:-/workspace/.android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$PATH"

VER="$(grep -oE 'APP_VERSION = "[^"]+"' src/lib/game/version.ts | head -1 | cut -d'"' -f2)"
if [ -z "$VER" ]; then
  echo "pack-apk: no APP_VERSION" >&2
  exit 1
fi

GRADLE="$ROOT/android/app/build.gradle"
CODE="$(grep -oE 'versionCode [0-9]+' "$GRADLE" | head -1 | awk '{print $2}')"
APK_OUT="$ROOT/public/BLAGO.apk"
META="$ROOT/public/apk-meta.json"

if [ "${FORCE:-0}" != "1" ] && [ -f "$META" ] && [ -f "$APK_OUT" ]; then
  META_VER="$(python3 -c "import json;print(json.load(open('$META')).get('version',''))" 2>/dev/null || true)"
  NEWEST_SRC="$(find src public/art -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1)"
  APK_T="$(stat -c %Y "$APK_OUT" 2>/dev/null || echo 0)"
  NEWEST_I="${NEWEST_SRC%.*}"
  if [ "$META_VER" = "$VER" ] && [ "${NEWEST_I:-0}" -le "${APK_T:-0}" ]; then
    echo "pack-apk: already latest $VER"
    exit 0
  fi
fi

CODE=$((CODE + 1))
python3 - "$GRADLE" "$CODE" "$VER" << 'PY'
from pathlib import Path
import re, sys
p = Path(sys.argv[1])
t = p.read_text()
t = re.sub(r"versionCode \d+", f"versionCode {sys.argv[2]}", t, count=1)
t = re.sub(r'versionName "[^"]+"', f'versionName "{sys.argv[3]}"', t, count=1)
p.write_text(t)
print("gradle", sys.argv[2], sys.argv[3])
PY

HOLD="$ROOT/artifacts/.apk-hold"
mkdir -p "$HOLD"
for f in BLAGO.apk BLAGO-android.zip BLAGO-github.zip; do
  if [ -f "$ROOT/public/$f" ]; then mv "$ROOT/public/$f" "$HOLD/$f"; fi
done

npx vite build --config vite.apk.config.ts
rm -f apk-www/BLAGO.apk apk-www/BLAGO-android.zip apk-www/BLAGO-github.zip apk-www/preuzmi.html
npx cap copy android
(cd android && ./gradlew assembleDebug --offline --quiet)

SRC_APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
cp -f "$SRC_APK" "$ROOT/artifacts/BLAGO.apk"
cp -f "$SRC_APK" "$ROOT/public/BLAGO.apk"
python3 - << PY
import json, time, zipfile
from pathlib import Path
apk = Path("$ROOT/public/BLAGO.apk")
with zipfile.ZipFile(Path("$ROOT/public/BLAGO-android.zip"), "w", zipfile.ZIP_STORED) as z:
    z.write(apk, "BLAGO.apk")
meta = {
    "version": "$VER",
    "versionCode": int("$CODE"),
    "bytes": apk.stat().st_size,
    "builtAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
Path("$ROOT/public/apk-meta.json").write_text(json.dumps(meta, indent=2) + "\n")
print("packed", meta)
PY

python3 "$ROOT/scripts/pack-github-zip.py"
rm -rf "$HOLD"
echo "pack-apk: $VER ready"
