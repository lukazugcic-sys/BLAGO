"""Magenta/ružičasta pozadina -> WebP s alfom, najduža stranica 512.

JPEG iz generatora nije čisti #FF00FF (kompresija gura boju).
Ključ je 'magenta' = min(R,B)-G na rubu slike.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

MAX_PX = 512


def kljuc(src: Path, dest: Path, max_px: int = MAX_PX) -> tuple[int, int]:
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    mag = np.minimum(r, b) - g
    rub = np.concatenate([mag[0], mag[-1], mag[:, 0], mag[:, -1]])
    poz = float(np.median(rub))
    if poz < 40:
        raise SystemExit(f"nije magenta pozadina: {src} ({poz:.0f})")
    rez = poz - 18
    pero = 20
    alpha = np.clip((rez - mag.astype(np.float32)) / pero, 0, 1)
    rf = r.astype(np.float32)
    gf = g.astype(np.float32)
    bf = b.astype(np.float32)
    visak = np.clip(np.minimum(rf, bf) - gf - 6, 0, None)
    zbroj = np.maximum(rf + bf, 1)
    rf = np.clip(rf - visak * (rf / zbroj), 0, 255)
    bf = np.clip(bf - visak * (bf / zbroj), 0, 255)
    alpha = np.where(mag > 14, 0, alpha)
    out = np.dstack([rf, gf, bf, alpha * 255]).astype(np.uint8)
    pic = Image.fromarray(out, "RGBA")
    bbox = pic.getbbox()
    if bbox:
        pic = pic.crop(bbox)
    w, h = pic.size
    m = max(w, h)
    if m > max_px:
        s = max_px / m
        pic = pic.resize((max(1, round(w * s)), max(1, round(h * s))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    pic.save(dest, "WEBP", quality=82, method=6)
    return pic.size


def sjena(dest: Path) -> None:
    w, h = 512, 200
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx - w / 2) / (w * 0.46)
    ny = (yy - h / 2) / (h * 0.40)
    d = np.sqrt(nx**2 + ny**2)
    a = np.clip(1 - d, 0, 1) ** 1.7
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[:, :, 0] = 36
    rgba[:, :, 1] = 22
    rgba[:, :, 2] = 12
    rgba[:, :, 3] = (a * 160).astype(np.uint8)
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(dest, "WEBP", quality=80, method=6)


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--sjena":
        sjena(Path(sys.argv[2] if len(sys.argv) > 2 else "public/art/zgrade/izo/sjena.webp"))
        raise SystemExit(0)
    if len(sys.argv) != 3:
        raise SystemExit("python3 scripts/izo-kljuc.py ulaz.jpg izlaz.webp")
    print(kljuc(Path(sys.argv[1]), Path(sys.argv[2])))
