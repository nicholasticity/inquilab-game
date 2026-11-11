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


def recolor(im: Image.Image, shadow, mid, light) -> Image.Image:
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
    # Chai stall, west.
    carve(1, 9, 7, 3, "T")
    # Well inside the patrol square, off the push row and off the loop edges.
    carve(24, 6, 2, 2, "W")
    # Charpoy, barrels, pots, pillar. Kept off the guard loop and the push row.
    g[10][10] = "C"
    g[10][11] = "C"
    g[5][8] = "&"
    g[5][9] = "&"
    g[10][8] = "&"
    g[10][28] = "&"
    g[6][12] = "P"
    g[7][29] = "P"
    g[4][6] = "&"
    g[11][20] = "C"
    g[11][21] = "C"
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
    pants_khaki = recolor(fetch("legs/pants/male/walk.png"), (78, 62, 32), (138, 112, 58), (196, 168, 96))
    sandals = fetch("feet/sandals/male/walk.png")
    shoes = fetch("feet/shoes/male/walk.png") or sandals
    shirt = fetch("torso/clothes/longsleeve/longsleeve/male/walk.png")
    shirt_f = fetch("torso/clothes/longsleeve/longsleeve/female/walk.png") or shirt
    kurta = recolor(shirt, (92, 24, 32), (156, 42, 52), (214, 110, 96))
    cream = recolor(shirt, (120, 96, 62), (214, 190, 142), (246, 232, 204))
    khaki = recolor(shirt, (78, 62, 32), (148, 120, 62), (206, 176, 104))
    vest_m = fetch("torso/clothes/vest/male/walk/maroon.png")
    vest_b = fetch("torso/clothes/vest/male/walk/brown.png")
    vest_n = fetch("torso/clothes/vest/male/walk/navy.png")
    tunic = fetch("torso/clothes/tunic_sara/female/walk/maroon.png")
    tunic_tan = fetch("torso/clothes/tunic_sara/female/walk/tan.png")
    scarf = recolor(fetch("neck/scarf/walk.png"), (150, 78, 28), (210, 130, 48), (240, 190, 110))
    scarf_cream = recolor(fetch("neck/scarf/walk.png"), (150, 120, 78), (220, 196, 150), (246, 232, 204))
    cap = fetch("hat/cloth/leather_cap/adult/walk/brown.png")
    hijab = recolor(fetch("hat/cloth/hijab/male/walk.png"), (186, 170, 130), (226, 214, 176), (246, 240, 220))
    hood = recolor(fetch("hat/cloth/hood/adult/walk.png"), (170, 150, 100), (214, 196, 140), (240, 228, 190))
    cane = fetch("weapon/polearm/cane/male/walk/cane.png")

    kite = sheet([male, pants, sandals, kurta, vest_b, head_m, eyes, hair_messy, cap, scarf])
    veil = sheet([female, tunic or recolor(shirt_f, (92, 24, 32), (156, 42, 52), (214, 110, 96)), head_f, eyes, hair_long, scarf_cream])
    veil2 = sheet([female, tunic_tan or cream, head_f, eyes, hair_long])
    key = sheet([male, pants, shoes, cream, vest_n or vest_m, head_m, eyes, hair_parted])
    guard = sheet([male, pants_khaki, shoes, khaki, vest_b, head_m, eyes, hijab or hood, cane])

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

    # Tiles.
    walls = Image.open(SRC / "tiles/lpc-walls/walls.png").convert("RGBA")
    floors = Image.open(SRC / "tiles/lpc-floors/floors.png").convert("RGBA")
    windows = Image.open(SRC / "tiles/lpc-windows-doors-v2/windows-doors.png").convert("RGBA")
    # Hand-checked cells. Flat courses only — not a quarter of a larger motif,
    # and not the repeating window wallpaper.
    bricks = [(5, 27), (7, 27), (9, 27), (6, 28), (8, 28), (10, 28)]
    plaster = [(9, 24), (10, 24), (8, 25), (1, 27), (2, 27), (2, 28)]
    stones = [(8, 30), (9, 30), (10, 30), (5, 30), (6, 30)]
    ground = [(13, 58), (14, 58), (15, 58), (16, 58), (13, 59), (14, 59), (15, 59), (16, 59), (24, 58), (25, 58), (24, 59), (25, 59)]
    print("bricks", bricks)
    print("stones", stones)
    print("plaster", plaster)
    print("ground", ground)

    def wall_tile(tx, ty):
        return walls.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32))

    def floor_tile(tx, ty):
        return floors.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32))

    # Props from windows, house, chests, barrels, buckets, kitchen, rugs.
    comps = components(windows, 180, 6000)
    comps.sort(key=lambda b: (b[2] - b[0]) * (b[3] - b[1]), reverse=True)
    print("window components", len(comps))
    contact = Image.new("RGBA", (900, 1400), (24, 18, 16, 255))
    cd = ImageDraw.Draw(contact)
    shown = 0
    chosen = {"flower": None, "lattice": None, "arch": None, "door": None, "iron": None, "bench": None, "pillar": None}
    for i, (x0, y0, x1, y1, green) in enumerate(comps[:80]):
        crop = windows.crop((x0, y0, x1, y1))
        bw, bh = crop.size
        col, row = i % 6, i // 6
        ox, oy = 8 + col * 148, 8 + row * 130
        scale = min(120 / max(1, bw), 90 / max(1, bh), 2)
        thumb = crop.resize((max(1, int(bw * scale)), max(1, int(bh * scale))), Image.NEAREST)
        contact.paste(thumb, (ox, oy), thumb)
        cd.text((ox, oy + 96), f"{i} {bw}x{bh} g{green}", fill=(240, 220, 180, 255))
        area_green = green / max(1, bw * bh)
        if chosen["flower"] is None and area_green > 0.08 and bw >= 24:
            chosen["flower"] = crop
        if chosen["bench"] is None and bw > bh * 2.2 and 16 < bh < 40 and green < 30:
            chosen["bench"] = crop
        if chosen["pillar"] is None and bh > bw * 2.2 and bw < 36 and green < 20:
            chosen["pillar"] = crop
        if chosen["door"] is None and bh > bw and bw >= 28 and bh >= 48 and green < 15:
            # Prefer a warm wooden door over a pale one.
            st = stats(crop.resize((32, 32)))
            if st and st[0] > st[2] + 10 and st[0] > 80:
                chosen["door"] = crop
        if chosen["iron"] is None and bh > 40 and bw > 24 and green < 8:
            st = stats(crop.resize((32, 32)))
            if st and st[0] < 90 and st[1] < 90 and st[3] > 20:
                chosen["iron"] = crop
        if chosen["arch"] is None and bw > 36 and bh > 40 and green < 20:
            chosen["arch"] = crop
        if chosen["lattice"] is None and 20 <= bw <= 48 and 24 <= bh <= 56 and green < 12:
            st = stats(crop.resize((32, 32)))
            if st and 70 < st[0] < 160 and st[3] > 22:
                chosen["lattice"] = crop
        shown += 1
    contact.save("/tmp/lpc/windows-index.png")
    for name, im in chosen.items():
        if im is not None:
            im.save(OUT / f"prop-{name}.png")
            print("prop", name, im.size)
        else:
            print("prop missing", name)
    if chosen["iron"] is not None:
        chosen["iron"].save(OUT / "grate.png")

    house = Image.open(SRC / "base/house.png").convert("RGBA")
    # The striped chai awning sits between the two upper doors.
    awning = house.crop((136, 18, 174, 42))
    awning.save(OUT / "awning.png")
    print("awning", awning.size)
    # One wooden leaf, hinge on the left edge.
    door = house.crop((100, 14, 130, 58))
    door.save(OUT / "door.png")
    print("door", door.size)

    chests = Image.open(SRC / "base/chests.png").convert("RGBA")
    # Iron-banded chest is the upper-left 32x32-ish cell. Take the tighter of the two top chests.
    # The wide iron-banded chest. Scaled to sit inside one tile with the plate rim showing.
    crate = chests.crop((0, 0, 32, 32))
    crate.save(OUT / "crate.png")

    barrel = Image.open(SRC / "base/barrel.png").convert("RGBA")
    one = barrel.crop((0, 0, 40, 48))
    bb = one.getbbox()
    if bb:
        one = one.crop(bb)
    one.save(OUT / "barrel.png")

    buckets = Image.open(SRC / "base/buckets.png").convert("RGBA")
    buck = buckets.crop((0, 0, 32, 32))
    bb = buck.getbbox()
    if bb:
        buck = buck.crop(bb)
    buck.save(OUT / "bucket.png")

    lights = Image.open(SRC / "base/castle_lightsources.png").convert("RGBA")
    lamp = lights.crop((64, 0, 96, 68))
    bb = lamp.getbbox()
    if bb:
        lamp = lamp.crop(bb)
    lamp.save(OUT / "lantern.png")

    kitchen = Image.open(SRC / "base/kitchen.png").convert("RGBA")
    bowl = kitchen.crop((32, 16, 64, 48))
    bb = bowl.getbbox()
    if bb:
        bowl = bowl.crop(bb)
    bowl.save(OUT / "bowl.png")

    cabinets = Image.open(SRC / "base/cabinets.png").convert("RGBA")
    # Orange rug near the top right of the cabinet sheet.
    rug = None
    for ty in range(cabinets.height // 16):
        for tx in range(cabinets.width // 16):
            cell = cabinets.crop((tx * 16, ty * 16, tx * 16 + 32, ty * 16 + 24))
            st = stats(cell)
            if st and st[0] > 140 and st[0] > st[1] + 30 and st[0] > st[2] + 40 and st[3] > 12:
                rug = cell
                break
        if rug:
            break
    if rug:
        bb = rug.getbbox()
        rug = rug.crop(bb) if bb else rug
        rug.save(OUT / "rug.png")
        print("rug", rug.size)

    # Laundry strips cut from the rug, and a sack from the barrel's lower half recolored jute.
    if rug:
        cloth = rug.resize((18, 22), Image.NEAREST)
        cloth.save(OUT / "laundry.png")

    sack = recolor(one, (92, 64, 32), (150, 110, 54), (196, 156, 86))
    sack.save(OUT / "sack.png")
    if not (OUT / "rug.png").exists():
        rug = recolor(floor_tile(14, 62), (110, 42, 28), (176, 78, 40), (214, 130, 64))
        rug.resize((48, 28), Image.NEAREST).save(OUT / "rug.png")
    if not (OUT / "laundry.png").exists() and (OUT / "awning.png").exists():
        cloth = Image.open(OUT / "awning.png").convert("RGBA")
        cloth.crop((0, 0, min(14, cloth.width), cloth.height)).resize((14, 22), Image.NEAREST).save(OUT / "laundry.png")

    # Plate inlay: a floor tile pushed to brass, with a bright center.
    plate_src = floor_tile(*ground[0]).convert("RGBA")
    plate = recolor(plate_src, (120, 78, 24), (196, 140, 40), (240, 200, 90))
    pp = plate.load()
    for y in range(8, 24):
        for x in range(8, 24):
            if 6 < ((x - 16) ** 2 + (y - 16) ** 2) ** 0.5 < 9:
                pp[x, y] = (255, 220, 110, 255)
    plate.save(OUT / "plate.png")

    # Pebble from a warm floor crumb, else a tight crop of the sack highlight.
    pebble = Image.new("RGBA", (8, 6), (0, 0, 0, 0))
    pd = pebble.load()
    rock = [(1, 2), (2, 1), (3, 1), (4, 1), (5, 2), (6, 2), (2, 2), (3, 2), (4, 2), (5, 3), (3, 3), (4, 3), (2, 3), (3, 4), (4, 4)]
    for x, y in rock:
        pd[x, y] = (168, 140, 96, 255) if (x + y) % 2 == 0 else (120, 92, 58, 255)
    pd[3, 2] = (214, 186, 140, 255)
    pebble.save(OUT / "pebble.png")

    shadow = Image.new("RGBA", (36, 14), (0, 0, 0, 0))
    sd = shadow.load()
    for y in range(14):
        for x in range(36):
            nx = (x - 18) / 16
            ny = (y - 7) / 5
            if nx * nx + ny * ny <= 1:
                sd[x, y] = (12, 8, 10, 110)
    shadow.save(OUT / "shadow.png")

    rows = build_grid()
    world = Image.new("RGBA", (MAP_W * TILE, MAP_H * TILE), (42, 32, 28, 255))

    # Stall tiles are a solid counter. Props (well, cot, pots) sit on painted floor.
    OPEN = set(".@+=LSgKWPC&")

    def at(x, y) -> str:
        if x < 0 or y < 0 or x >= MAP_W or y >= len(rows):
            return "#"
        return rows[y][x]

    def touches_open(x, y) -> bool:
        return any(at(x + dx, y + dy) in OPEN for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)))

    def lay_floor(x, y) -> None:
        # 2×2 clumps, with a cobble patch on a slower rhythm so the court is not one tile.
        cobble = ground[8:]
        pavers = ground[:8]
        # Mostly one family of stone pavers, with a cobble patch here and there.
        if (x // 5 + y // 4) % 6 == 0:
            cell = cobble[(x // 2 + y) % len(cobble)]
        else:
            cell = pavers[((x // 2) + (y // 2) * 3) % len(pavers)]
        world.paste(floor_tile(*cell), (x * TILE, y * TILE))

    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in OPEN or ch == "T":
                lay_floor(x, y)
                if ch == "T":
                    world.paste(wall_tile(*plaster[(x // 2) % len(plaster)]), (x * TILE, y * TILE))
                if ch == "=":
                    world.paste(plate, (x * TILE, y * TILE), plate)
                continue
            if touches_open(x, y):
                brick_run = (x // 6) % 2 == 0
                face = bricks[(x // 2) % len(bricks)] if brick_run else plaster[(x // 2) % len(plaster)]
                world.paste(wall_tile(*face), (x * TILE, y * TILE))
            else:
                roof = stones[(x // 3) % len(stones)] if y <= 1 or y >= 12 else bricks[(x // 6) % len(bricks)]
                world.paste(wall_tile(*roof), (x * TILE, y * TILE))

    jharokha = walls.crop((12 * 32, 30 * 32, 14 * 32, 31 * 32))
    jharokha.save(OUT / "jharokha.png")
    flower = Image.open(OUT / "prop-flower.png").convert("RGBA") if (OUT / "prop-flower.png").exists() else None
    for x in range(2, 32, 5):
        # North facade is the wall row sitting on the courtyard.
        thumb = jharokha.copy()
        thumb.thumbnail((36, 30), Image.NEAREST)
        world.paste(thumb, (x * TILE - 2, 2 * TILE + 8), thumb)
        if flower is not None and x % 10 == 2:
            pot = flower.copy()
            pot.thumbnail((32, 22), Image.NEAREST)
            world.paste(pot, (x * TILE, 3 * TILE + 14), pot)

    # Rugs in the open court so the floor is not one texture.
    rug_im = Image.open(OUT / "rug.png").convert("RGBA") if (OUT / "rug.png").exists() else None
    if rug_im:
        for rx, ry in ((10, 7), (18, 6), (27, 10)):
            thumb = rug_im.copy()
            thumb.thumbnail((48, 28), Image.NEAREST)
            world.alpha_composite(thumb, (rx * TILE, ry * TILE + 4))

    world.save(OUT / "map.png")
    world.resize((world.width // 2, world.height // 2), Image.NEAREST).save("/tmp/lpc/map-half.png")

    # Depth-sorted prop sprites already saved. A 2x2 well assembled from stone + bowl.
    well = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    ring = wall_tile(*stones[0]) if stones else wall_tile(*bricks[0])
    for dx, dy in ((0, 0), (32, 0), (0, 32), (32, 32)):
        well.paste(ring, (dx, dy))
    bowl_im = Image.open(OUT / "bowl.png").convert("RGBA")
    bowl_im = bowl_im.resize((28, 20), Image.NEAREST)
    well.paste(bowl_im, (18, 22), bowl_im)
    well.save(OUT / "well.png")

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
        "guard": [[17, 5], [30, 5], [30, 9], [17, 9]],
    }
    (ROOT / "src" / "grid.json").write_text(json.dumps(meta, indent=2))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
