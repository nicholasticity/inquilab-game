#!/usr/bin/env python3
"""Bake Liberated Pixel Cup sheets into the courtyard assets.

Sources (see CREDITS.md):
- Universal LPC Spritesheet Character Generator (CC-BY-SA 3.0 / GPL 3.0)
- OpenGameArt LPC walls, floors, windows & doors, and the LPC base tiles
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
BRONZE = [(0x1A, 0x12, 0x13), (0x44, 0x27, 0x25), (0x64, 0x41, 0x33), (0x7F, 0x4C, 0x31), (0xAE, 0x6B, 0x3F), (0xD3, 0x8B, 0x59)]

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


def recolor(im: Image.Image | None, shadow, mid, light) -> Image.Image | None:
    if im is None:
        return None
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

    def mix(a, b, t):
        return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))

    targets = []
    for i in range(n):
        t = i / max(1, n - 1)
        targets.append(mix(shadow, mid, t * 2) if t < 0.5 else mix(mid, light, (t - 0.5) * 2))
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
    g[2][24] = "B"
    g[6][3] = "@"
    g[8][15] = "+"
    g[8][22] = "="
    # Chai stall, west. Wooden counter, not a plaster slab.
    carve(1, 9, 7, 3, "T")
    # Well in the south-east, clear of the plate at (22, 8) and of the push row.
    carve(26, 10, 2, 2, "W")
    # Charpoys, tonga, pots. Kept off the guard loop and the push row.
    g[10][10] = "C"
    g[10][11] = "C"
    g[11][16] = "C"
    g[11][17] = "C"
    g[11][20] = "C"
    g[11][21] = "C"
    g[5][8] = "&"
    g[5][9] = "&"
    g[10][8] = "&"
    g[10][28] = "&"
    g[4][6] = "&"
    g[4][31] = "&"  # officer, off the graffiti and the push row
    g[8][5] = "&"  # bicycle
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
    hair_messy = recolor(fetch("hair/messy1/adult/walk.png"), (22, 14, 12), (48, 28, 20), (92, 58, 36))
    hair_long = recolor(fetch("hair/long/adult/walk.png"), (22, 14, 12), (48, 28, 20), (92, 58, 36))
    hair_parted = recolor(fetch("hair/parted/adult/walk.png"), (22, 14, 12), (48, 28, 20), (92, 58, 36))
    pants = recolor(fetch("legs/pants/male/walk.png"), (28, 20, 16), (52, 36, 28), (86, 64, 46))
    pants_pyjama = recolor(fetch("legs/pants/male/walk.png"), (118, 96, 68), (198, 176, 138), (236, 222, 192))
    pants_khaki = recolor(fetch("legs/pants/male/walk.png"), (78, 62, 32), (138, 112, 58), (196, 168, 96))
    sandals = fetch("feet/sandals/male/walk.png")
    shoes = fetch("feet/shoes/basic/male/walk.png") or sandals
    shirt = fetch("torso/clothes/longsleeve/longsleeve/male/walk.png")
    shirt_f = fetch("torso/clothes/longsleeve/longsleeve/female/walk.png") or shirt
    kurta = recolor(shirt, (128, 96, 62), (214, 184, 138), (244, 226, 190))
    cream = recolor(shirt, (120, 96, 62), (214, 190, 142), (246, 232, 204))
    khaki = recolor(shirt, (78, 62, 32), (148, 120, 62), (206, 176, 104))
    vest_m = fetch("torso/clothes/vest/male/walk/maroon.png")
    vest_b = fetch("torso/clothes/vest/male/walk/brown.png")
    vest_n = fetch("torso/clothes/vest/male/walk/navy.png")
    tunic = fetch("torso/clothes/tunic_sara/female/walk/maroon.png")
    tunic_tan = fetch("torso/clothes/tunic_sara/female/walk/tan.png")
    dupatta = recolor(fetch("neck/scarf/walk.png"), (150, 72, 24), (214, 118, 42), (242, 186, 108))
    hijab_f = recolor(fetch("hat/cloth/hijab/thin/walk.png"), (150, 72, 24), (214, 118, 42), (242, 186, 108))
    pagri = recolor(fetch("hat/cloth/hijab/male/walk.png"), (110, 18, 22), (176, 36, 40), (214, 78, 72))
    cane = fetch("weapon/polearm/cane/male/walk/cane.png")

    kite = stamp_cap(sheet([male, pants_pyjama, sandals, kurta, vest_b, head_m, eyes, hair_messy]))
    veil_layers = [female, tunic or recolor(shirt_f, (92, 24, 32), (156, 42, 52), (214, 110, 96)), head_f, eyes, hair_long, hijab_f, dupatta]
    veil = sheet(veil_layers)
    veil2 = sheet([female, tunic_tan or cream, head_f, eyes, hair_long])
    key = sheet([male, pants, shoes, cream, vest_n or vest_m, head_m, eyes, hair_parted])
    guard = stamp_plume(sheet([male, pants_khaki, shoes, khaki, head_m, eyes, pagri, cane]))
    officer_sheet = sheet([male, pants_khaki, shoes, khaki, head_m, eyes, hair_parted])
    pith_frame(officer_sheet.crop((0, 128, 64, 192))).save(OUT / "officer.png")

    for name, im in (("kite", kite), ("veil", veil), ("veil2", veil2), ("key", key), ("guard", guard)):
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


    walls = Image.open(SRC / "tiles/lpc-walls/walls.png").convert("RGBA")
    floors = Image.open(SRC / "tiles/lpc-floors/floors.png").convert("RGBA")
    windows = Image.open(SRC / "tiles/lpc-windows-doors-v2/windows-doors.png").convert("RGBA")

    def cell(im: Image.Image, tx: int, ty: int) -> Image.Image:
        return im.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32)).convert("RGBA")

    def dust(im: Image.Image) -> Image.Image:
        im = im.copy()
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if a < 8:
                    continue
                px[x, y] = (
                    min(255, int(r * 1.04 + 16)),
                    min(255, int(g * 0.90 + 6)),
                    min(255, int(b * 0.70)),
                    a,
                )
        return im

    # One running-bond family (LPC floors row 53). Variation is the mortar, not a new texture.
    pavers = [dust(cell(floors, tx, 53)) for tx in (12, 13, 14, 15, 16, 17)]
    bricks = [cell(walls, tx, 27) for tx in (12, 13, 14, 15)] + [cell(walls, tx, 28) for tx in (12, 14)]
    stone = [cell(walls, tx, 27) for tx in (0, 1, 2)]

    def plank(seed: int) -> Image.Image:
        im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        px = im.load()
        for y in range(32):
            for x in range(32):
                stripe = (y // 8) % 2
                base = (132, 82, 44) if stripe == 0 else (112, 68, 36)
                if y % 8 == 0 or x in (0, 31):
                    base = (58, 36, 22)
                elif (x * 3 + seed + y) % 11 == 0:
                    base = (base[0] - 18, base[1] - 12, base[2] - 8)
                px[x, y] = base + (255,)
        return im

    planks = [plank(i) for i in range(4)]

    def with_coping(brick: Image.Image, sand: Image.Image, side: str | None) -> Image.Image:
        if side is None:
            return brick
        out = brick.copy()
        if side == "s":
            out.paste(sand.crop((0, 22, 32, 32)), (0, 22))
        elif side == "n":
            out.paste(sand.crop((0, 0, 32, 10)), (0, 0))
        elif side == "e":
            out.paste(sand.crop((22, 0, 32, 32)), (22, 0))
        elif side == "w":
            out.paste(sand.crop((0, 0, 10, 32)), (0, 0))
        return out

    def dot(px, x, y, color, w, h):
        if 0 <= x < w and 0 <= y < h:
            px[x, y] = color

    def ellipse(px, cx, cy, rx, ry, color, w, h, ring=None):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                nx = 0 if rx == 0 else (x - cx) / rx
                ny = 0 if ry == 0 else (y - cy) / ry
                d = nx * nx + ny * ny
                if ring is None and d <= 1:
                    dot(px, x, y, color, w, h)
                elif ring is not None and ring <= d <= 1:
                    dot(px, x, y, color, w, h)

    INK = (36, 24, 20, 255)
    SAND = (206, 170, 116, 255)
    SAND_D = (96, 68, 40, 255)
    IRON = (62, 58, 54, 255)
    IRON_L = (176, 172, 164, 255)
    SAFF = (214, 112, 36, 255)
    SAFF_L = (240, 176, 72, 255)
    CLAY = (158, 84, 48, 255)
    GREEN = (46, 104, 48, 255)
    GREEN_D = (24, 64, 32, 255)
    CREAM = (236, 224, 196, 255)
    WATER = (24, 40, 48, 255)

    def make_plate(floor: Image.Image) -> Image.Image:
        im = floor.copy()
        px = im.load()
        for y in range(5, 27):
            for x in range(5, 27):
                rim = x in (5, 6, 25, 26) or y in (5, 6, 25, 26)
                core = 11 <= x <= 20 and 11 <= y <= 20
                if rim:
                    px[x, y] = IRON_L if (x + y) % 2 == 0 else INK
                elif core:
                    px[x, y] = (28, 26, 24, 255)
                else:
                    px[x, y] = IRON
        for i in range(-5, 6):
            px[16 + i, 16 - (5 - abs(i))] = SAFF
            px[16 + i, 16 + (5 - abs(i))] = SAFF_L
        px[16, 16] = (255, 220, 140, 255)
        return im

    def make_rune() -> Image.Image:
        im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        px = im.load()
        for i in range(-5, 6):
            px[16 + i, 16 - (5 - abs(i))] = SAFF_L
            px[16 + i, 16 + (5 - abs(i))] = SAFF
        px[16, 16] = (255, 228, 160, 255)
        px[16, 10] = SAFF_L
        px[16, 22] = SAFF
        return im

    def make_bars() -> Image.Image:
        im = Image.new("RGBA", (32, 40), (0, 0, 0, 0))
        px = im.load()
        for x in range(3, 29):
            for t, c in ((0, INK), (1, IRON), (2, IRON_L)):
                px[x, 2 + t] = c
                px[x, 34 + t] = c
        for bx in (5, 11, 17, 23):
            for y in range(2, 38):
                px[bx, y] = INK
                px[bx + 1, y] = IRON
                px[bx + 2, y] = IRON_L
        return im

    def make_pebble() -> Image.Image:
        im = Image.new("RGBA", (16, 12), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 8, 6, 7, 5, INK, 16, 12)
        ellipse(px, 8, 6, 5, 3, (54, 48, 44, 255), 16, 12)
        ellipse(px, 6, 5, 2, 1, (210, 196, 170, 255), 16, 12)
        return im

    def make_well() -> Image.Image:
        im = Image.new("RGBA", (64, 52), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 32, 28, 28, 18, SAND_D, 64, 52)
        ellipse(px, 32, 26, 24, 15, SAND, 64, 52)
        ellipse(px, 32, 26, 16, 10, SAND_D, 64, 52)
        ellipse(px, 32, 26, 13, 8, WATER, 64, 52)
        ellipse(px, 28, 24, 4, 2, (48, 70, 78, 255), 64, 52)
        for x in range(16, 48):
            px[x, 6] = (92, 58, 32, 255)
            px[x, 7] = INK
        for y in range(6, 26):
            px[31, y] = (150, 108, 58, 255)
            px[32, y] = (92, 64, 36, 255)
        return im

    def make_charpoy() -> Image.Image:
        im = Image.new("RGBA", (56, 32), (0, 0, 0, 0))
        px = im.load()
        wood, rope = (112, 70, 38, 255), (186, 150, 96, 255)
        for y in range(6, 26):
            for x in range(4, 52):
                edge = x < 7 or x > 48 or y < 9 or y > 22
                px[x, y] = wood if edge else rope if (x + y) % 2 == 0 else (150, 116, 70, 255)
        for lx, ly in ((6, 24), (46, 24), (8, 8), (44, 8)):
            for dy in range(6):
                px[lx, ly + dy] = INK
                px[lx + 1, ly + dy] = wood
        return im

    def make_bicycle() -> Image.Image:
        im = Image.new("RGBA", (40, 28), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 10, 16, 7, 7, INK, 40, 28)
        ellipse(px, 10, 16, 5, 5, (0, 0, 0, 0), 40, 28)
        ellipse(px, 29, 16, 7, 7, INK, 40, 28)
        ellipse(px, 29, 16, 5, 5, (0, 0, 0, 0), 40, 28)
        for t in range(16):
            x = 10 + t
            y = 16 - t // 3
            px[x, y] = IRON
            px[x, y + 1] = INK
        for y in range(8, 17):
            px[20, y] = IRON
        for x in range(16, 26):
            px[x, 8] = INK
        return im

    def make_tonga() -> Image.Image:
        im = Image.new("RGBA", (72, 40), (0, 0, 0, 0))
        px = im.load()
        for y in range(8, 20):
            for x in range(14, 58):
                px[x, y] = SAFF if y < 14 else (160, 48, 40, 255)
        for x in range(18, 54):
            px[x, 20] = (112, 70, 38, 255)
            px[x, 21] = (84, 52, 30, 255)
        ellipse(px, 22, 28, 8, 8, INK, 72, 40)
        ellipse(px, 22, 28, 5, 5, SAND, 72, 40)
        ellipse(px, 50, 28, 8, 8, INK, 72, 40)
        ellipse(px, 50, 28, 5, 5, SAND, 72, 40)
        for y in range(18, 30):
            px[8, y] = (92, 58, 32, 255)
        return im

    def make_kettle() -> Image.Image:
        im = Image.new("RGBA", (18, 16), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 8, 9, 6, 5, (168, 124, 48, 255), 18, 16)
        ellipse(px, 8, 8, 4, 3, (214, 176, 84, 255), 18, 16)
        for y in range(3, 8):
            px[8, y] = (120, 84, 32, 255)
        for x in range(12, 17):
            px[x, 8] = (120, 84, 32, 255)
            px[x, 9] = SAFF_L
        return im

    def make_kulhad() -> Image.Image:
        im = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 5, 4, 4, 2, CLAY, 10, 10)
        for y in range(4, 9):
            half = 3 if y < 7 else 2
            for x in range(5 - half, 5 + half):
                px[x, y] = CLAY if x not in (5 - half, 4 + half) else INK
        return im

    def make_tulsi() -> Image.Image:
        im = Image.new("RGBA", (18, 26), (0, 0, 0, 0))
        px = im.load()
        ellipse(px, 9, 18, 6, 4, CLAY, 18, 26)
        ellipse(px, 9, 16, 5, 2, (120, 64, 36, 255), 18, 26)
        for dx, dy, c in ((0, 4, GREEN_D), (-3, 6, GREEN), (3, 6, GREEN), (0, 8, GREEN), (-2, 2, GREEN_D), (2, 3, GREEN)):
            ellipse(px, 9 + dx, dy, 3, 3, c, 18, 26)
        return im

    def make_laundry(colors) -> Image.Image:
        im = Image.new("RGBA", (16, 22), (0, 0, 0, 0))
        px = im.load()
        for x in range(16):
            px[x, 0] = INK
            px[x, 1] = (90, 70, 48, 255)
        for y in range(2, 21):
            for x in range(2, 14):
                sag = 0 if y < 16 else (x % 3)
                if y + sag < 21 and 2 <= x < 14:
                    px[x, min(20, y)] = colors[(x // 4 + y // 5) % len(colors)]
        return im

    def make_notice() -> Image.Image:
        im = Image.new("RGBA", (56, 48), (0, 0, 0, 0))
        px = im.load()
        for y in range(2, 46):
            for x in range(2, 54):
                if x > 46 and y < 8 and x + y < 56:
                    continue
                if y > 40 and x < 8 and x + (46 - y) < 8:
                    continue
                px[x, y] = (232, 214, 176, 255) if (x + y) % 9 else (214, 196, 156, 255)
        blit_text(im, "BY ORDER", 6, 6, INK, 1)
        blit_text(im, "OF THE", 8, 14, INK, 1)
        blit_text(im, "GOVERNOR", 4, 22, INK, 1)
        blit_text(im, "CURFEW", 4, 32, (150, 32, 32, 255), 2)
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx * dx + dy * dy <= 4:
                    px[8 + dx, 6 + dy] = (150, 28, 28, 255)
        return im

    def make_poster() -> Image.Image:
        im = Image.new("RGBA", (34, 46), (0, 0, 0, 0))
        px = im.load()
        for y in range(2, 44):
            for x in range(2, 32):
                if y < 16:
                    c = SAFF
                elif y < 30:
                    c = CREAM
                else:
                    c = GREEN
                px[x, y] = c
        tiger = [
            "..1111....",
            ".1111111..",
            "111011111.",
            "1111111111",
            ".11111111.",
            "..11.11.11",
            "...1..1..1",
        ]
        for y, row in enumerate(tiger):
            for x, bit in enumerate(row):
                if bit == "1":
                    px[10 + x, 17 + y] = CREAM if x % 3 == 0 else INK
                elif bit == "0":
                    px[10 + x, 17 + y] = CREAM
        blit_text(im, "AZAD", 7, 5, INK, 1)
        blit_text(im, "HIND", 7, 34, CREAM, 1)
        for y in range(0, 18):
            for x in range(20, 34):
                if x + y > 30 and (x + y) % 2 == 0:
                    px[x, y] = (148, 62, 44, 255) if y % 3 else (120, 48, 36, 255)
        return im

    def make_jaali() -> Image.Image:
        im = Image.new("RGBA", (22, 30), (0, 0, 0, 0))
        px = im.load()
        for y in range(30):
            for x in range(22):
                border = x < 2 or y < 2 or x > 19 or y > 27
                hole = (x % 5 in (2, 3)) and (y % 5 in (2, 3))
                if border:
                    px[x, y] = SAND_D
                elif not hole:
                    px[x, y] = SAND
        return im

    def make_pillar() -> Image.Image:
        im = Image.new("RGBA", (18, 40), (0, 0, 0, 0))
        px = im.load()
        for y in range(6, 38):
            for x in range(4, 14):
                px[x, y] = SAND if x not in (4, 13) else SAND_D
        for y in range(2, 8):
            for x in range(2, 16):
                px[x, y] = SAND_D if y == 2 else SAND
        for x in range(3, 15):
            px[x, 36] = SAND_D
            px[x, 37] = INK
        return im

    plate = make_plate(pavers[0])
    plate.save(OUT / "plate.png")
    make_rune().save(OUT / "rune.png")
    make_bars().save(OUT / "grate.png")
    make_pebble().save(OUT / "pebble.png")
    make_well().save(OUT / "well.png")
    make_charpoy().save(OUT / "charpoy.png")
    make_bicycle().save(OUT / "bicycle.png")
    make_tonga().save(OUT / "tonga.png")
    make_kettle().save(OUT / "kettle.png")
    make_kulhad().save(OUT / "kulhad.png")
    make_tulsi().save(OUT / "tulsi.png")
    make_laundry([(236, 228, 210, 255), (214, 206, 188, 255)]).save(OUT / "laundry.png")
    make_laundry([(214, 112, 36, 255), (186, 86, 28, 255)]).save(OUT / "laundry-s.png")
    make_laundry([(46, 104, 48, 255), (28, 72, 40, 255)]).save(OUT / "laundry-g.png")
    make_notice().save(OUT / "notice.png")
    make_poster().save(OUT / "poster.png")
    make_jaali().save(OUT / "jaali.png")
    make_pillar().save(OUT / "pillar.png")

    shadow = Image.new("RGBA", (36, 14), (0, 0, 0, 0))
    sd = shadow.load()
    ellipse(sd, 18, 7, 16, 5, (12, 8, 10, 120), 36, 14)
    shadow.save(OUT / "shadow.png")

    house = Image.open(SRC / "base/house.png").convert("RGBA")
    house.crop((136, 18, 174, 42)).save(OUT / "awning.png")
    door = house.crop((100, 14, 130, 58))
    door.save(OUT / "door.png")

    chests = Image.open(SRC / "base/chests.png").convert("RGBA")
    crate = chests.crop((0, 0, 32, 32)).convert("RGBA")
    cp = crate.load()
    for y in range(crate.height):
        for x in range(crate.width):
            r, g, b, a = cp[x, y]
            if a < 20:
                continue
            if abs(r - g) < 22 and abs(g - b) < 22:
                cp[x, y] = (min(255, r + 48), min(255, g + 48), min(255, b + 40), a)
            else:
                cp[x, y] = (max(0, int(r * 0.62)), max(0, int(g * 0.5)), max(0, int(b * 0.4)), a)
    crate.save(OUT / "crate.png")

    barrel = Image.open(SRC / "base/barrel.png").convert("RGBA").crop((0, 0, 40, 48))
    bb = barrel.getbbox()
    if bb:
        barrel = barrel.crop(bb)
    barrel.save(OUT / "barrel.png")
    sack = recolor(barrel, (92, 64, 32), (150, 110, 54), (196, 156, 86))
    if sack is not None:
        sack.save(OUT / "sack.png")

    lights = Image.open(SRC / "base/castle_lightsources.png").convert("RGBA")
    lamp = lights.crop((64, 0, 96, 68))
    bb = lamp.getbbox()
    if bb:
        lamp = lamp.crop(bb)
    lamp.save(OUT / "lantern.png")

    jharokha = Image.new("RGBA", (26, 24), (0, 0, 0, 0))
    jp = jharokha.load()
    for y in range(24):
        for x in range(26):
            arch_y = 6 + abs(x - 13) // 2
            frame = y < 3 or x < 2 or x > 23 or (y < arch_y + 3 and y >= arch_y)
            recess = y >= arch_y + 3 and 3 <= x <= 22 and y < 21
            if frame:
                jp[x, y] = SAND_D if x in (0, 25) or y == 0 else SAND
            elif recess and (x % 4 == 0 or y % 4 == 0):
                jp[x, y] = SAND_D
            elif recess:
                jp[x, y] = (42, 28, 32, 255)
            elif y >= 21:
                jp[x, y] = SAND_D
    jharokha.save(OUT / "jharokha.png")

    rows = build_grid()
    world = Image.new("RGBA", (MAP_W * TILE, MAP_H * TILE), (92, 58, 40, 255))
    floorish = set(".@+=LSgKWPC&K")

    def ch_at(x: int, y: int) -> str:
        if x < 0 or y < 0 or x >= MAP_W or y >= MAP_H:
            return "#"
        return rows[y][x]

    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == "T":
                world.paste(planks[(x + y) % len(planks)], (x * TILE, y * TILE))
                continue
            if ch in floorish:
                tile = pavers[(x * 3 + y * 5) % len(pavers)]
                if x >= 34:
                    tile = tile.copy()
                    px = tile.load()
                    for yy in range(TILE):
                        for xx in range(TILE):
                            r, g, b, a = px[xx, yy]
                            px[xx, yy] = (r * 45 // 100, g * 40 // 100, b * 38 // 100, a)
                world.paste(tile, (x * TILE, y * TILE))
                if ch == "=":
                    world.paste(plate, (x * TILE, y * TILE))
                continue
            side = None
            if ch_at(x, y + 1) in floorish:
                side = "s"
            elif ch_at(x, y - 1) in floorish:
                side = "n"
            elif ch_at(x + 1, y) in floorish:
                side = "e"
            elif ch_at(x - 1, y) in floorish:
                side = "w"
            world.paste(with_coping(bricks[(x + y) % len(bricks)], stone[x % len(stone)], side), (x * TILE, y * TILE))

    wp = world.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch not in floorish or ch_at(x, y - 1) in floorish:
                continue
            for yy in range(3):
                for xx in range(TILE):
                    r, g, b, a = wp[x * TILE + xx, y * TILE + yy]
                    wp[x * TILE + xx, y * TILE + yy] = (max(0, r - 28), max(0, g - 22), max(0, b - 16), a)

    def draw_arch(tx: int, ty: int) -> None:
        left = tx * TILE
        top = ty * TILE
        brick, brick_d = (158, 64, 46, 255), (96, 36, 30, 255)
        for y in range(top - 16, top + 32):
            for t in range(6):
                dot(wp, left + t, y, brick_d if t == 0 else brick, world.width, world.height)
                dot(wp, left + 31 - t, y, brick_d if t == 0 else brick, world.width, world.height)
        cx = left + 16
        for y in range(top - 14, top + 32):
            for x in range(left + 6, left + 26):
                ad = abs(x - cx)
                rise = 18 if ad < 3 else max(6, 16 - (ad - 3))
                if y < top - rise + 4:
                    continue
                shade = (36, 22, 18, 255) if (x + y) % 2 == 0 else (22, 14, 12, 255)
                dot(wp, x, y, shade, world.width, world.height)
        for x in range(left + 6, left + 26):
            ad = abs(x - cx)
            rise = 18 if ad < 3 else max(6, 16 - (ad - 3))
            for t in range(4):
                dot(wp, x, top - rise + t, SAND if t == 0 else brick_d, world.width, world.height)

    def blind_arch(tx: int, ty: int) -> None:
        left = tx * TILE
        top = ty * TILE
        cx = left + 16
        for x in range(left + 4, left + 28):
            ad = abs(x - cx)
            rise = 12 if ad < 3 else max(2, 10 - (ad - 3) // 2)
            y_arch = top + 18 - rise
            for t in range(3):
                dot(wp, x, y_arch + t, SAND if t < 2 else SAND_D, world.width, world.height)
            for y in range(y_arch + 3, top + 26):
                dot(wp, x, y, (120, 46, 38, 255) if (x + y) % 2 == 0 else (96, 36, 32, 255), world.width, world.height)

    draw_arch(33, 5)
    draw_arch(33, 9)
    for tx in (6, 19, 30):
        blind_arch(tx, 3)

    def paste_prop(im: Image.Image, x: int, y: int) -> None:
        world.alpha_composite(im, (x, y))

    for tx in (4, 11, 21, 29):
        paste_prop(jharokha, tx * TILE + 3, 2 * TILE + 6)
    paste_prop(Image.open(OUT / "jaali.png"), 23 * TILE + 5, 2 * TILE + 18)
    paste_prop(Image.open(OUT / "notice.png"), 7 * TILE, 2 * TILE + 4)
    paste_prop(Image.open(OUT / "notice.png"), 38 * TILE + 2, 8 * TILE + 2)
    paste_prop(Image.open(OUT / "poster.png"), 16 * TILE, 2 * TILE + 6)
    blit_text(world, "CHALO DILLI", 12 * TILE + 2, 3 * TILE + 8, CREAM, 2)

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
        "bell": [24, 2],
        "grate": [33, 5],
        "gate": [33, 9],
        "leaf": [36, 5],
        "sign": [36, 9],
        "well": [26, 10],
        "bicycle": [5, 8],
        "tonga": [16, 11],
        "officer": [31, 4],
        "guard": [[17, 5], [30, 5], [30, 9], [17, 9]],
    }
    (ROOT / "src" / "grid.json").write_text(json.dumps(meta, indent=2) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
