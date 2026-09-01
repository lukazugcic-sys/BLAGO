#!/usr/bin/env python3
"""Pack CC0 Kenney / KenneyNL GitHub assets into public/art and public/sfx."""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path("/workspace")
KENNEY = Path("/tmp/kenney")
TOWN = KENNEY / "tiny-town"
DUNG = KENNEY / "tiny-dungeon"
ICONS = KENNEY / "board-icons" / "PNG" / "Default (64px)"
GH = KENNEY / "github"
ART = ROOT / "public" / "art"
SFX = ROOT / "public" / "sfx"
SYM = ART / "symbols"
VENDOR = ROOT / "vendor" / "oss"

PALETTE = {
    "skull": ((232, 93, 93), (76, 5, 25)),
    "wood": ((212, 165, 116), (63, 42, 20)),
    "stone": ((183, 176, 164), (30, 41, 59)),
    "iron": ((207, 198, 184), (51, 65, 85)),
    "gold": ((232, 176, 74), (69, 26, 3)),
    "energy": ((198, 224, 90), (26, 46, 5)),
    "gem": ((212, 140, 255), (74, 4, 78)),
    "shield": ((94, 228, 216), (30, 58, 95)),
    "wild": ((246, 239, 228), (51, 65, 85)),
}


def nn(im: Image.Image, scale: int) -> Image.Image:
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST)


def grade(im: Image.Image, color: tuple[int, int, int], alpha: float) -> Image.Image:
    rgb = im.convert("RGB")
    overlay = Image.new("RGB", rgb.size, color)
    return Image.blend(rgb, overlay, alpha)


def vignette(im: Image.Image, strength: float = 0.72) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.15, -h * 0.2, w * 1.15, h * 1.15), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(w, h) // 8))
    dark = Image.new("RGB", (w, h), (7, 6, 12))
    return Image.composite(rgb, Image.blend(rgb, dark, strength), mask)


def recolor_icon(im: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    r, g, b = rgb
    w, h = im.size
    for y in range(h):
        for x in range(w):
            pr, pg, pb, pa = px[x, y]
            if pa < 8:
                px[x, y] = (0, 0, 0, 0)
                continue
            lum = (pr + pg + pb) / (3 * 255)
            strength = max(0.15, 1 - lum)
            px[x, y] = (r, g, b, int(pa * min(1, strength + 0.2)))
    return im


def token(icon: Image.Image, fg: tuple[int, int, int], bg: tuple[int, int, int], size: int = 128) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    m = 6
    d.rounded_rectangle((m, m, size - m - 1, size - m - 1), radius=18, fill=bg + (255,))
    d.rounded_rectangle((m, m, size - m - 1, size - m - 1), radius=18, outline=fg + (220,), width=3)
    inner = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    di = ImageDraw.Draw(inner)
    di.rounded_rectangle((m + 5, m + 5, size - m - 6, size // 2), radius=12, fill=(255, 255, 255, 28))
    canvas = Image.alpha_composite(canvas, inner)
    icon = icon.convert("RGBA")
    box = int(size * 0.72)
    icon = icon.resize((box, box), Image.NEAREST)
    x = (size - box) // 2
    y = (size - box) // 2 + 2
    canvas.alpha_composite(icon, (x, y))
    return canvas


def ffmpeg_mp3(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(dest),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def draw_title(im: Image.Image, title: str, tag: str, font_path: Path, left: bool = False) -> Image.Image:
    im = im.convert("RGBA")
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = im.size
    title_size = 92 if not left else 64
    tag_size = 22 if not left else 18
    font = ImageFont.truetype(str(font_path), title_size)
    tag_font = ImageFont.truetype(str(font_path), tag_size)
    tb = d.textbbox((0, 0), title, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    if left:
        x = 48
        y = 36
    else:
        x = (w - tw) // 2
        y = int(h * 0.38)
    # gold fill + dark stroke
    for dx, dy in ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2)):
        d.text((x + dx, y + dy), title, font=font, fill=(40, 24, 8, 255))
    d.text((x, y), title, font=font, fill=(232, 176, 74, 255))
    gb = d.textbbox((0, 0), tag, font=tag_font)
    gw = gb[2] - gb[0]
    gx = x if left else (w - gw) // 2
    gy = y + th + (10 if left else 16)
    d.text((gx, gy), tag, font=tag_font, fill=(246, 239, 228, 230))
    return Image.alpha_composite(im, overlay).convert("RGB")


def crop_cover(im: Image.Image, w: int, h: int) -> Image.Image:
    im = im.convert("RGB")
    scale = max(w / im.width, h / im.height)
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.NEAREST)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return im.crop((left, top, left + w, top + h))


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    SYM.mkdir(parents=True, exist_ok=True)
    SFX.mkdir(parents=True, exist_ok=True)
    VENDOR.mkdir(parents=True, exist_ok=True)

    sample = Image.open(TOWN / "Sample.png").convert("RGB")
    dungeon = Image.open(DUNG / "Sample.png").convert("RGB")
    tiles = {i: Image.open(TOWN / "Tiles" / f"tile_{i:04d}.png").convert("RGBA") for i in (0, 1, 2, 3, 9, 10, 11, 72, 73, 84, 85)}

    splash = vignette(grade(nn(sample, 2), (48, 22, 12), 0.28))
    splash.save(ART / "splash.png")

    hall = grade(sample, (20, 14, 10), 0.35)
    hall.save(ART / "hall.png")

    snow = ImageOps.colorize(ImageOps.grayscale(sample), black="#1a2433", white="#e8f0ff")
    snow = Image.blend(sample.convert("RGB"), snow.convert("RGB"), 0.7)
    snow.save(ART / "snow.png")

    aurora = vignette(grade(nn(sample, 2), (48, 16, 72), 0.42))
    aurora.save(ART / "aurora.png")

    cabin = sample.crop((int(sample.width * 0.28), int(sample.height * 0.22), int(sample.width * 0.72), int(sample.height * 0.78)))
    cabin = nn(cabin, 3)
    cabin.save(ART / "cabin.png")

    raid = vignette(grade(nn(dungeon, 2), (90, 12, 18), 0.38))
    raid.save(ART / "raid.png")

    # Building chips from Tiny Town tiles (mill / rocks / workshop / house / tower)
    def stamp(ids: list[list[int]], scale: int = 10) -> Image.Image:
        rows, cols = len(ids), len(ids[0])
        canvas = Image.new("RGBA", (cols * 16, rows * 16), (0, 0, 0, 0))
        for r, row in enumerate(ids):
            for c, tid in enumerate(row):
                canvas.alpha_composite(tiles[tid], (c * 16, r * 16))
        return nn(canvas, scale)

    stamp([[0, 1], [72, 73]]).save(ART / "iso-mill.png")
    stamp([[3, 9], [10, 11]]).save(ART / "iso-quarry.png")
    stamp([[0, 2], [84, 85]]).save(ART / "iso-forge.png")

    # Slot tokens
    icon_map = {
        "skull": ICONS / "skull.png",
        "wood": ICONS / "resource_wood.png",
        "stone": ICONS / "structure_wall.png",
        "iron": ICONS / "resource_iron.png",
        "gold": GH / "coin.png",
        "energy": ICONS / "flask_full.png",
        "gem": GH / "tile-gem.png",
        "shield": ICONS / "shield.png",
        "wild": ICONS / "crown_a.png",
    }
    precolored = {"gold", "gem"}
    for key, path in icon_map.items():
        fg, bg = PALETTE[key]
        src = Image.open(path).convert("RGBA")
        if key not in precolored:
            src = recolor_icon(src, fg)
        token(src, fg, bg).save(SYM / f"{key}.png")

    # Audio
    audio = {
        "spin": KENNEY / "digital-audio" / "Audio" / "pepSound2.ogg",
        "spin2": KENNEY / "digital-audio" / "Audio" / "pepSound3.ogg",
        "win": KENNEY / "jingles" / "Audio" / "Steel jingles" / "jingles_STEEL03.ogg",
        "win2": KENNEY / "jingles" / "Audio" / "Steel jingles" / "jingles_STEEL07.ogg",
        "jackpot": KENNEY / "jingles" / "Audio" / "Steel jingles" / "jingles_STEEL10.ogg",
        "jackpot2": KENNEY / "jingles" / "Audio" / "Steel jingles" / "jingles_STEEL14.ogg",
        "attack": KENNEY / "impact" / "Audio" / "impactPunch_medium_000.ogg",
        "collect": KENNEY / "rpg-audio" / "Audio" / "handleCoins.ogg",
        "collect2": KENNEY / "rpg-audio" / "Audio" / "handleCoins2.ogg",
        "button": KENNEY / "ui-sounds" / "Audio" / "click_001.ogg",
        "build": GH / "placement-a.ogg",
        "build2": KENNEY / "rpg-audio" / "Audio" / "chop.ogg",
        "skull": KENNEY / "digital-audio" / "Audio" / "lowDown.ogg",
        "skull2": KENNEY / "digital-audio" / "Audio" / "zapThreeToneDown.ogg",
    }
    for name, src in audio.items():
        ffmpeg_mp3(src, SFX / f"{name}.mp3")

    font = GH / "lilita.ttf"
    og_base = vignette(grade(crop_cover(sample, 1200, 630), (28, 14, 8), 0.32), 0.55)
    og = draw_title(og_base, "BLAGO", "VRTI  ·  GRADI  ·  PLJACKAJ", font, left=False)
    og.save(ROOT / "public" / "og.jpg", quality=86, optimize=True)

    banner_base = vignette(grade(crop_cover(sample, 1200, 264), (28, 14, 8), 0.34), 0.5)
    banner = draw_title(banner_base, "BLAGO", "pustinjski automat", font, left=True)
    banner.save(ROOT / "public" / "x-banner.jpg", quality=86, optimize=True)

    # Licenses
    for src, name in [
        (TOWN / "License.txt", "LICENSE-tiny-town.txt"),
        (DUNG / "License.txt", "LICENSE-tiny-dungeon.txt"),
        (KENNEY / "board-icons" / "License.txt", "LICENSE-board-icons.txt"),
        (KENNEY / "rpg-audio" / "License.txt", "LICENSE-rpg-audio.txt"),
    ]:
        if src.exists():
            (VENDOR / name).write_text(src.read_text(encoding="utf-8", errors="ignore"), encoding="utf-8")

    (VENDOR / "CREDITS.md").write_text(
        "\n".join(
            [
                "# Open-source art & audio",
                "",
                "All game art and sound in this build is CC0 from other GitHub / Kenney authors:",
                "",
                "- [KenneyNL/Starter-Kit-City-Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder) — coin sprite, Lilita One, placement SFX (CC0)",
                "- [KenneyNL/Starter-Kit-Match-3](https://github.com/KenneyNL/Starter-Kit-Match-3) — gem tile (CC0)",
                "- [Kenney Tiny Town](https://kenney.nl/assets/tiny-town) — village tiles (CC0)",
                "- [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) — raid scene (CC0)",
                "- [Kenney Board Game Icons](https://kenney.nl/assets/board-game-icons) — slot symbols (CC0)",
                "- Kenney RPG Audio, Interface Sounds, Digital Audio, Impact Sounds, Music Jingles (CC0)",
                "",
                "Kenney assets are public-domain (CC0 1.0). Attribution is not required; given with thanks.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print("packed ok")


if __name__ == "__main__":
    main()
