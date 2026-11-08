#!/usr/bin/env bash
# Pack current BLAGO into artifacts/apk-pack so live Beta Preuzmi serves it
# without putting 90 MB binaries in the Publish upload.
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
APK_OUT="$ROOT/artifacts/apk-pack/BLAGO.apk"
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
PACK="$ROOT/artifacts/apk-pack"
mkdir -p "$HOLD" "$PACK" "$HOLD/apk"
for f in BLAGO.apk BLAGO-android.zip BLAGO-github.zip; do
  dest="$HOLD/$f"
  for src in "$ROOT/public/$f" "$PACK/$f"; do
    [ -f "$src" ] || continue
    if [ -e "$dest" ] && [ "$src" -ef "$dest" ]; then
      continue
    fi
    mv -f "$src" "$dest"
  done
done
if [ -d "$ROOT/public/apk" ]; then
  find "$ROOT/public/apk" -type f -name '*.apk' -exec mv -f {} "$HOLD/apk/" \;
fi

python3 - "$META" "$VER" "$CODE" << 'PY'
import json, sys
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "version": sys.argv[2],
    "versionCode": int(sys.argv[3]),
    "bytes": 0,
    "builtAt": "",
}, indent=2) + "\n")
print("meta-prije", sys.argv[2], sys.argv[3])
PY

npx vite build --config vite.apk.config.ts
# public/apk/*.apk must not be copied into the WebView assets or the next
# APK nests the previous one (0.9.144 ballooned 35 MB -> 69 MB that way).
rm -f apk-www/BLAGO.apk apk-www/BLAGO-android.zip apk-www/BLAGO-github.zip apk-www/preuzmi.html
rm -rf apk-www/apk
find apk-www -type f \( -name '*.apk' -o -name '*.zip' \) -delete
npx cap copy android
rm -rf "$ROOT/android/app/build"
(cd android && ./gradlew assembleDebug --offline --quiet)

SRC_APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
cp -f "$SRC_APK" "$ROOT/artifacts/BLAGO.apk"
cp -f "$SRC_APK" "$APK_OUT"
python3 - << PY
import hashlib, json, time, zipfile
from pathlib import Path
apk = Path("$APK_OUT")
with zipfile.ZipFile(Path("$ROOT/artifacts/apk-pack/BLAGO-android.zip"), "w", zipfile.ZIP_STORED) as z:
    z.write(apk, "BLAGO.apk")
podaci = apk.read_bytes()
meta = {
    "version": "$VER",
    "versionCode": int("$CODE"),
    "bytes": apk.stat().st_size,
    "size": apk.stat().st_size,
    "builtAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "sha256": hashlib.sha256(podaci).hexdigest(),
    "url": "/apk/BLAGO-$VER.apk" if apk.stat().st_size <= 40 * 1024 * 1024 else None,
}
tekst = json.dumps(meta, indent=2) + "\n"
Path("$ROOT/public/apk-meta.json").write_text(tekst)
Path("$ROOT/apk/apk-meta.json").write_text(tekst)
vercel = Path("$ROOT/vercel.json")
if vercel.exists():
    v = json.loads(vercel.read_text())
    for r in v.get("redirects", []):
        if r.get("source") == "/BLAGO.apk":
            r["destination"] = "/apk/BLAGO-$VER.apk"
    vercel.write_text(json.dumps(v, indent=2) + "\n")
print("packed", meta)
PY

python3 "$ROOT/scripts/pack-github-zip.py"
# One versioned APK in the site tree. /BLAGO.apk is a redirect (vercel.json),
# not a second copy. The stored zip stays in artifacts only — public/ zip
# was another ~69 MB that Vite would ship.
rm -f "$ROOT/public/BLAGO.apk" "$ROOT/public/BLAGO-android.zip" "$ROOT/public/BLAGO-github.zip"
find "$ROOT/public/apk" -type f -name '*.apk' -delete 2>/dev/null || true
mkdir -p "$ROOT/apk" "$ROOT/public/apk"
cp -f "$APK_OUT" "$ROOT/apk/BLAGO-${VER}.apk"
find "$ROOT/apk" -maxdepth 1 -type f -name 'BLAGO-*.apk' ! -name "BLAGO-${VER}.apk" -delete
APK_BYTES="$(stat -c %s "$APK_OUT")"
if [ "$APK_BYTES" -le 41943040 ]; then
  cp -f "$APK_OUT" "$ROOT/public/apk/BLAGO-${VER}.apk"
else
  echo "pack-apk: $APK_BYTES bytes over 40MB, not copied into public/"
fi
rm -rf "$HOLD"
echo "pack-apk: $VER ready"
