#!/usr/bin/env python3
"""Bake Liberated Pixel Cup sheets into the courtyard assets.

Sources (see CREDITS.md):
- Universal LPC Spritesheet Character Generator (CC-BY-SA 3.0 / GPL 3.0)
- OpenGameArt LPC walls and floors. Props on the court are original drawings.
"""

from __future__ import annotations

import json
import urllib.request
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "lpc"
SRC = Path("/tmp/lpc")
RAW = "https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/"

LIGHT = [(0x27, 0x19, 0x20), (0x99, 0x42, 0x3C), (0xCC, 0x86, 0x65), (0xE4, 0xA4, 0x7C), (0xF9, 0xD5, 0xBA), (0xFA, 0xEC, 0xE7)]
# Skin stops are colours in scripts/craft.py, so faces sit on the same ramp as teak and clay.
BRONZE = [(26, 18, 20), (68, 39, 37), (100, 65, 51), (127, 76, 49), (174, 107, 63), (211, 139, 89)]
HAIR = ((52, 32, 22), (100, 65, 51), (127, 76, 49))
CREAM = ((92, 74, 56), (164, 136, 104), (224, 202, 168), (250, 244, 228))
KHAKI = ((74, 62, 36), (138, 116, 64), (198, 174, 108))
SAFFRON = ((112, 48, 20), (184, 80, 32), (232, 140, 60), (248, 206, 144))
MAROON = ((92, 24, 32), (168, 40, 44), (224, 116, 104))
NAVY = ((28, 34, 42), (72, 80, 90), (140, 150, 160))
TEAK = ((52, 32, 22), (100, 65, 51), (127, 76, 49), (176, 122, 78))

TILE = 32
MAP_W = 40
MAP_H = 14


def fetch(rel: str) -> Image.Image | None:
    dest = SRC / "parts" / rel.replace("/", "__")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_size < 80:
        url = RAW + rel
        try:
            urllib.request.urlretrieve(url, dest)
        except Exception as err:
            print("miss", rel, err)
            return None
    try:
        im = Image.open(dest).convert("RGBA")
    except Exception as err:
        print("bad", rel, err)
        return None
    print(f"got {rel} {im.size}")
    return im


def dist(a, b) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def recolor_skin(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            best_i, best_d = 0, 1e9
            for i, c in enumerate(LIGHT):
                d = dist((r, g, b), c)
                if d < best_d:
                    best_i, best_d = i, d
            if best_d <= 30:
                br, bg, bb = BRONZE[best_i]
                px[x, y] = (br, bg, bb, a)
    return im


def lum(c) -> float:
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def recolor(im: Image.Image | None, *stops) -> Image.Image | None:
    """Map a layer's luminance onto an authored ramp from the master palette."""
    if im is None:
        return None
    if len(stops) == 1 and not isinstance(stops[0][0], int):
        stops = tuple(stops[0])
    im = im.convert("RGBA")
    px = im.load()
    colors: dict[tuple, int] = {}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            colors[(r, g, b)] = colors.get((r, g, b), 0) + 1
    ramp = sorted(colors, key=lum)
    n = len(ramp)
    if n == 0:
        return im

    targets = []
    last = len(stops) - 1
    for i in range(n):
        t = i / max(1, n - 1)
        targets.append(stops[min(last, round(t * last))])
    mapping = {ramp[i]: targets[i] for i in range(n)}
    out = im.copy()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = op[x, y]
            if a < 20:
                continue
            nr, ng, nb = mapping[(r, g, b)]
            op[x, y] = (nr, ng, nb, a)
    return out


def paste(dst: Image.Image, src: Image.Image | None) -> None:
    if src is None:
        return
    if src.size != dst.size:
        canvas = Image.new("RGBA", dst.size, (0, 0, 0, 0))
        canvas.paste(src, (0, 0), src)
        src = canvas
    dst.alpha_composite(src)


def sheet(layers: list[Image.Image | None]) -> Image.Image:
    base = Image.new("RGBA", (576, 256), (0, 0, 0, 0))
    for layer in layers:
        paste(base, layer)
    return base


def crop_head(walk: Image.Image) -> Image.Image:
    # Down-facing idle is row 2, column 0 on a standard LPC walk sheet.
    frame = walk.crop((0, 128, 64, 192))
    bbox = frame.getbbox()
    if not bbox:
        return frame.crop((12, 4, 52, 44))
    # Head sits in the upper half of the body.
    return frame.crop((14, 2, 50, 40))


def stats(tile: Image.Image):
    px = [p for p in tile.getdata() if p[3] > 220]
    if len(px) < 700:
        return None
    n = len(px)
    r = sum(p[0] for p in px) / n
    g = sum(p[1] for p in px) / n
    b = sum(p[2] for p in px) / n
    var = sum((p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2 for p in px) / n
    return r, g, b, var ** 0.5


def pick_tiles(sheet_im: Image.Image, pred, limit: int) -> list[tuple[int, int]]:
    w, h = sheet_im.size
    found = []
    for ty in range(h // 32):
        for tx in range(w // 32):
            tile = sheet_im.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32))
            st = stats(tile)
            if st and pred(tx, ty, st):
                found.append((st[3], tx, ty))
    found.sort(reverse=True)
    # Spread picks so we don't take eight adjacent mortar variants of one cell.
    chosen = []
    for _std, tx, ty in found:
        if any(abs(tx - cx) <= 1 and abs(ty - cy) <= 1 for cx, cy in chosen):
            continue
        chosen.append((tx, ty))
        if len(chosen) >= limit:
            break
    return chosen


def components(im: Image.Image, min_px: int, max_px: int) -> list[tuple[int, int, int, int, int]]:
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y][3] < 40:
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            minx = maxx = x
            miny = maxy = y
            count = 0
            green = 0
            while q:
                cx, cy = q.popleft()
                count += 1
                r, g, b, _a = px[cx, cy]
                if g > r + 15 and g > b + 10 and g > 70:
                    green += 1
                minx, maxx = min(minx, cx), max(maxx, cx)
                miny, maxy = min(miny, cy), max(maxy, cy)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or seen[ny][nx]:
                        continue
                    if px[nx, ny][3] < 40:
                        continue
                    seen[ny][nx] = True
                    q.append((nx, ny))
            bw, bh = maxx - minx + 1, maxy - miny + 1
            if min_px <= count <= max_px and bw < 220 and bh < 160:
                out.append((minx, miny, maxx + 1, maxy + 1, green))
    return out


def stamp_cap(sheet_im: Image.Image) -> Image.Image:
    """Small cream Gandhi cap, drawn on the hair of every walk frame."""
    out = sheet_im.copy()
    px = out.load()
    fill, shade, line = (236, 226, 200, 255), (186, 164, 124, 255), (74, 52, 36, 255)
    for row in range(4):
        for col in range(9):
            ox, oy = col * 64, row * 64
            top = None
            xs: list[int] = []
            for y in range(oy + 4, oy + 40):
                hit = [x for x in range(ox + 24, ox + 42) if px[x, y][3] > 80]
                if hit and top is None:
                    top = y
                    xs = hit
                    break
            if top is None or not xs:
                continue
            cx = (min(xs) + max(xs)) // 2
            for dy in range(6):
                half = 5 if dy > 0 else 4
                for dx in range(-half, half + 1):
                    x, y = cx + dx, top - 1 + dy
                    if not (0 <= x < out.width and 0 <= y < out.height):
                        continue
                    edge = dy == 0 or dy == 5 or abs(dx) == half
                    crease = dx == 0 and 1 <= dy <= 4
                    px[x, y] = line if edge else shade if crease else fill
    return out


def stamp_plume(sheet_im: Image.Image) -> Image.Image:
    """Short red fan on the constable's pagri."""
    out = sheet_im.copy()
    px = out.load()
    red, dark, light = (176, 36, 40, 255), (110, 16, 20, 255), (214, 78, 72, 255)
    for row in range(4):
        for col in range(9):
            ox, oy = col * 64, row * 64
            top = None
            cx = ox + 32
            for y in range(oy + 2, oy + 36):
                hit = [x for x in range(ox + 22, ox + 44) if px[x, y][3] > 80]
                if hit:
                    top = y
                    cx = (min(hit) + max(hit)) // 2
                    break
            if top is None:
                continue
            for i, dx in enumerate((-2, -1, 0, 1, 2)):
                for dy in range(4):
                    x, y = cx + dx, top - 4 + dy
                    if 0 <= x < out.width and 0 <= y < out.height:
                        px[x, y] = dark if dy == 0 or abs(dx) == 2 else light if dx == 0 else red
    return out


def pith_frame(frame: Image.Image) -> Image.Image:
    """Khaki pith helmet and a red collar on one down-facing frame."""
    out = frame.copy()
    px = out.load()
    top = None
    xs: list[int] = []
    for y in range(4, 40):
        hit = [x for x in range(22, 44) if px[x, y][3] > 80]
        if hit and top is None:
            top = y
            xs = hit
            break
    if top is None:
        return out
    cx = (min(xs) + max(xs)) // 2
    khaki, dark, light = (176, 148, 86, 255), (96, 74, 40, 255), (220, 196, 130, 255)
    red = (160, 36, 36, 255)
    # Dome sits on the hair. The brim is one row at the hairline so the face stays visible.
    for dy in range(-7, 3):
        half = 10 if dy >= 2 else 6 if dy >= -2 else 4
        for dx in range(-half, half + 1):
            x, y = cx + dx, top + dy
            if not (0 <= x < out.width and 0 <= y < out.height):
                continue
            if dy >= 2 and abs(dx) < 5:
                continue
            edge = abs(dx) >= half - 1 or dy == -7
            px[x, y] = dark if edge else light if dx < -1 and dy < 0 else khaki
    for y in range(top + 24, top + 27):
        for x in range(cx - 7, cx + 8):
            if not (0 <= x < out.width and 0 <= y < out.height):
                continue
            r, g, b, a = px[x, y]
            if a > 80 and r > 90 and g > 70 and r - b > 20:
                px[x, y] = red
    return out


GLYPH = {
    "A": ["010", "101", "111", "101", "101"],
    "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"],
    "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"],
    "F": ["111", "100", "110", "100", "100"],
    "G": ["011", "100", "101", "101", "011"],
    "H": ["101", "101", "111", "101", "101"],
    "I": ["111", "010", "010", "010", "111"],
    "L": ["100", "100", "100", "100", "111"],
    "N": ["101", "111", "111", "101", "101"],
    "O": ["010", "101", "101", "101", "010"],
    "R": ["110", "101", "110", "101", "101"],
    "T": ["111", "010", "010", "010", "010"],
    "U": ["101", "101", "101", "101", "010"],
    "V": ["101", "101", "101", "101", "010"],
    "W": ["10001", "10001", "10101", "10101", "01010"],
    "Y": ["101", "101", "010", "010", "010"],
    "Z": ["111", "001", "010", "100", "111"],
}


def blit_text(im: Image.Image, text: str, x: int, y: int, color, scale: int = 1) -> None:
    px = im.load()
    cx = x
    for ch in text:
        if ch == " ":
            cx += 3 * scale
            continue
        glyph = GLYPH.get(ch)
        if not glyph:
            cx += 4 * scale
            continue
        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit != "1":
                    continue
                for sy in range(scale):
                    for sx in range(scale):
                        xx, yy = cx + gx * scale + sx, y + gy * scale + sy
                        if 0 <= xx < im.width and 0 <= yy < im.height:
                            px[xx, yy] = color
        cx += (len(glyph[0]) + 1) * scale


def build_grid() -> list[str]:
    g = [["#" for _ in range(MAP_W)] for _ in range(MAP_H)]

    def carve(x, y, w, h, ch):
        for j in range(h):
            for i in range(w):
                if 0 <= x + i < MAP_W and 0 <= y + j < MAP_H:
                    g[y + j][x + i] = ch

    carve(1, 4, 32, 8, ".")
    # East alcoves, separated by a wall course.
    carve(34, 4, 4, 3, ".")
    carve(34, 8, 4, 3, ".")
    g[5][33] = "g"
    g[9][33] = "K"
    g[5][36] = "L"
    g[9][36] = "S"
    g[2][11] = "B"
    g[6][3] = "@"
    g[8][15] = "+"
    g[8][22] = "="
    # Bottom-left stays open for the thumbstick. The stall sits to its right,
    # inside the opening view, off the push row (y=8) and the guard's south line.
    # The bench is the two tiles just east of the counter, not on the walkway above it.
    carve(8, 10, 5, 1, "T")
    g[10][14] = "C"
    g[10][15] = "C"
    g[10][16] = "C"
    g[10][17] = "C"
    g[7][18] = "C"
    g[7][19] = "C"
    carve(26, 10, 2, 2, "W")
    # Clay pots off the guard loop and the push row. The officer patrols, so he is not a wall.
    g[5][8] = "&"
    g[5][9] = "&"
    g[4][6] = "&"
    g[4][10] = "&"
    g[4][14] = "&"
    g[6][12] = "P"
    return ["".join(row) for row in g]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "credits").mkdir(exist_ok=True)

    male = recolor_skin(fetch("body/bodies/male/walk.png"))
    female = recolor_skin(fetch("body/bodies/female/walk.png"))
    head_m = recolor_skin(fetch("head/heads/human/male/walk.png"))
    head_f = recolor_skin(fetch("head/heads/human/female/walk.png"))
    eyes = fetch("eyes/human/adult/default/walk.png")
    hair_messy = recolor(fetch("hair/messy1/adult/walk.png"), HAIR)
    hair_long = recolor(fetch("hair/long/adult/walk.png"), HAIR)
    hair_parted = recolor(fetch("hair/parted/adult/walk.png"), HAIR)
    pants = recolor(fetch("legs/pants/male/walk.png"), TEAK)
    pants_pyjama = recolor(fetch("legs/pants/male/walk.png"), CREAM)
    pants_khaki = recolor(fetch("legs/pants/male/walk.png"), KHAKI)
    sandals = recolor(fetch("feet/sandals/male/walk.png"), TEAK)
    shoes = recolor(fetch("feet/shoes/basic/male/walk.png"), NAVY) or sandals
    shirt = fetch("torso/clothes/longsleeve/longsleeve/male/walk.png")
    shirt_f = fetch("torso/clothes/longsleeve/longsleeve/female/walk.png") or shirt
    kurta = recolor(shirt, CREAM)
    cream = recolor(shirt, CREAM)
    khaki = recolor(shirt, KHAKI)
    vest_m = recolor(fetch("torso/clothes/vest/male/walk/maroon.png"), MAROON)
    vest_b = recolor(fetch("torso/clothes/vest/male/walk/brown.png"), TEAK)
    vest_n = recolor(fetch("torso/clothes/vest/male/walk/navy.png"), NAVY)
    tunic = recolor(fetch("torso/clothes/tunic_sara/female/walk/maroon.png"), MAROON)
    tunic_tan = recolor(fetch("torso/clothes/tunic_sara/female/walk/tan.png"), CREAM)
    dupatta = recolor(fetch("neck/scarf/walk.png"), SAFFRON)
    hijab_f = recolor(fetch("hat/cloth/hijab/thin/walk.png"), SAFFRON)
    pagri = recolor(fetch("hat/cloth/hijab/male/walk.png"), MAROON)
    cane = recolor(fetch("weapon/polearm/cane/male/walk/cane.png"), TEAK)

    kite = stamp_cap(sheet([male, pants_pyjama, sandals, kurta, vest_b, head_m, eyes, hair_messy]))
    veil_layers = [female, tunic or recolor(shirt_f, MAROON), head_f, eyes, hair_long, hijab_f, dupatta]
    veil = sheet(veil_layers)
    veil2 = sheet([female, tunic_tan or cream, head_f, eyes, hair_long])
    key = sheet([male, pants, shoes, cream, vest_n or vest_m, head_m, eyes, hair_parted])
    guard = stamp_plume(sheet([male, pants_khaki, shoes, khaki, head_m, eyes, pagri, cane]))
    officer_sheet = sheet([male, pants_khaki, shoes, khaki, head_m, eyes, hair_parted])
    officer_walk = officer_sheet.copy()
    for row in range(4):
        for col in range(9):
            frame = officer_walk.crop((col * 64, row * 64, col * 64 + 64, row * 64 + 64))
            officer_walk.paste(pith_frame(frame), (col * 64, row * 64))
    from craft import paint_map, save_props, snap

    officer_walk = snap(officer_walk)
    officer_walk.save(OUT / "officer.png")

    for name, im in (("kite", kite), ("veil", veil), ("veil2", veil2), ("key", key), ("guard", guard)):
        im = snap(im)
        im.save(OUT / f"{name}.png")
        crop_head(im).save(OUT / f"port-{name}.png")

    # Walk strip: four directions, nine frames, every actor.
    labels = [("KITE", kite), ("VEIL", veil), ("KEY", key), ("GUARD", guard)]
    strip = Image.new("RGBA", (64 * 9 + 70, 64 * 4 * len(labels) + 8), (18, 12, 14, 255))
    draw = ImageDraw.Draw(strip)
    for i, (label, im) in enumerate(labels):
        draw.text((4, i * 256 + 4), label, fill=(240, 220, 180, 255))
        for row in range(4):
            for col in range(9):
                fr = im.crop((col * 64, row * 64, col * 64 + 64, row * 64 + 64))
                strip.paste(fr, (70 + col * 64, 8 + i * 256 + row * 64), fr)
    strip.save(OUT / "walk-strip.png")
    strip.resize((strip.width // 2, strip.height // 2), Image.NEAREST).save("/tmp/lpc/walk-strip-half.png")


    save_props(OUT)
    rows = build_grid()
    world = paint_map(rows)
    world.save(OUT / "map.png")
    world.resize((world.width // 2, world.height // 2), Image.NEAREST).save("/tmp/lpc/map-half.png")

    meta = {
        "tile": TILE,
        "w": MAP_W,
        "h": MAP_H,
        "rows": rows,
        "spawn": [3, 6],
        "crate": [15, 8],
        "plate": [22, 8],
        "bell": [11, 2],
        "grate": [33, 5],
        "gate": [33, 9],
        "leaf": [36, 5],
        "sign": [36, 9],
        "well": [26, 10],
        "bicycle": [1, 5],
        "tonga": [18, 7],
        "officer": [20, 4],
        "guard": [[17, 5], [30, 5], [30, 9], [17, 9]],
    }
    (ROOT / "src" / "grid.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
