#!/usr/bin/env python3
"""Pack current BLAGO source into public/BLAGO-github.zip (no node_modules / APK)."""
from __future__ import annotations

import json
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "BLAGO-github.zip"
META = ROOT / "public" / "github-meta.json"

SKIP_DIR = {
    ".git",
    ".grok",
    ".jdk",
    ".android-sdk",
    ".vercel",
    ".output",
    ".gradle",
    "node_modules",
    "dist",
    "artifacts",
    "apk-www",
    "screenshots",
    "attachments",
    "__pycache__",
    "build",
}
SKIP_FILE = {
    "BLAGO.apk",
    "BLAGO-android.zip",
    "BLAGO-github.zip",
    "local.properties",
    ".DS_Store",
}
SKIP_SUFFIX = {".apk", ".aab", ".log"}


def skip_path(rel: Path) -> bool:
    parts = rel.parts
    if any(p in SKIP_DIR for p in parts):
        return True
    if rel.name in SKIP_FILE:
        return True
    if rel.suffix in SKIP_SUFFIX:
        return True
    if parts[:4] == ("android", "app", "src", "main") and len(parts) > 4 and parts[4] == "assets":
        return True
    return False


def version() -> str:
    text = (ROOT / "src" / "lib" / "game" / "version.ts").read_text()
    for line in text.splitlines():
        if "APP_VERSION" in line and '"' in line:
            return line.split('"')[1]
    return "unknown"


def main() -> None:
    ver = version()
    files: list[Path] = []
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT)
        if skip_path(rel):
            continue
        files.append(rel)
    files.sort()
    tmp = OUT.with_suffix(".zip.tmp")
    if tmp.exists():
        tmp.unlink()
    with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.comment = f"BLAGO {ver}".encode()
        for rel in files:
            z.write(ROOT / rel, rel.as_posix())
    tmp.replace(OUT)
    meta = {
        "version": ver,
        "files": len(files),
        "bytes": OUT.stat().st_size,
        "builtAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    META.write_text(json.dumps(meta, indent=2) + "\n")
    print("github-zip", meta)


if __name__ == "__main__":
    main()
