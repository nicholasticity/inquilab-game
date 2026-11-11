#!/usr/bin/env python3
"""Kit-bash LPC tiles into the Lahore courtyard.

Every sprite is cropped from a CC-BY-SA LPC sheet at its native pixels, then
locked to the 48-colour palette. Nothing is scaled. Hand-pixelled gaps
(bell, bicycle, plate, diya flame, tulsi leaves, steam, pebble, leaflet)
are drawn at the same size and shade count as the sheets they sit beside.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from craft import (
    A, AH, AL, B1, B2, B3, B4, BD, BH, BL, BR, C, D, E, F, FW,
    G, GD, GH, GL, K, L, LH, M, ML, O, OL, P, Q, R, S5, S6, S7, S8,
    SA, SF, SL, SP, W, WH, WT, X, Y,
    blank, blit, nearest, paste, put, snap,
)

OGA = Path("/tmp/oga")
WALLS_PNG = Path("/tmp/lpc/tiles/lpc-walls/walls.png")
WINDOWS_PNG = Path("/tmp/lpc/tiles/lpc-windows-doors-v2/windows-doors.png")
DECO_PNG = OGA / "deco" / "decoration_medieval" / "decorations-medieval.png"
CONT_PNG = OGA / "containers" / "container-v4_2" / "container.png"
COOK_PNG = OGA / "tavern" / "lpc-tavern" / "tavern-cooking.png"
BIRD_PNG = OGA / "bird.png"
FOOD_PNG = OGA / "food" / "lpc-food-v2" / "fruits-veggies.png"

GREEN = {
    (129, 161, 0), (73, 146, 49), (47, 129, 54), (93, 150, 107),
    (57, 126, 0), (100, 164, 44), (0, 107, 70),
}

BRICK_RAMP = [B1, B1, B2, B2, B3, B3, B4, ML]
SAND_RAMP = [S5, S6, S6, S7, S7, S8, S8]
IRON_RAMP = [P, P, R, L, LH]
BRASS_RAMP = [BR, BD, BD, BL, BH, SP]
CLAY_RAMP = [C, A, A, AL, AH]


def _lum(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def recolor(im: Image.Image, ramp: list[tuple]) -> Image.Image:
    """Keep the drawn light and dark, and move the hue onto a palette ramp."""
    im = im.convert("RGBA")
    px = im.load()
    vals: list[tuple[int, int, float]] = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
            else:
                vals.append((x, y, _lum(r, g, b)))
    if not vals:
        return im
    lo = min(v[2] for v in vals)
    hi = max(v[2] for v in vals)
    span = hi - lo or 1.0
    n = len(ramp)
    for x, y, lum in vals:
        t = (lum - lo) / span
        i = n - 1 if t > 0.86 else min(n - 1, int(t * n))
        c = ramp[i]
        px[x, y] = (c[0], c[1], c[2], 255)
    return im


def key_green(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0 or (r, g, b) in GREEN:
                px[x, y] = (0, 0, 0, 0)
    return im


def trim(im: Image.Image, pad: int = 0) -> Image.Image:
    box = im.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def crop(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return trim(im.crop(box))


_CACHE: dict[str, Image.Image] = {}


def _load_walls() -> Image.Image:
    im = _CACHE.get("walls")
    if im is None:
        im = Image.open(WALLS_PNG).convert("RGBA")
        _CACHE["walls"] = im
    return im


def _stone(tx: int, ty: int) -> Image.Image:
    w = _load_walls()
    return w.crop((tx * 32, ty * 32, tx * 32 + 32, ty * 32 + 32))


def brick_face(phase: int) -> Image.Image:
    # ty 30 is the repeating running-bond course. tx 0 and 1 continue the bond.
    return recolor(_stone(phase % 2, 30), BRICK_RAMP)


def parapet(phase: int) -> Image.Image:
    # ty 29 is the cap course of the same wall, with a finished top edge.
    return recolor(_stone(phase % 2, 29), SAND_RAMP)


def cornice(phase: int) -> Image.Image:
    """A sandstone parapet lip with a dark soffit, so the band reads as a cornice."""
    im = brick_face(phase).copy()
    sand = parapet(phase)
    px = im.load()
    sp = sand.load()
    for y in range(6):
        for x in range(32):
            px[x, y] = sp[x, y + 10]
    # Lit nose, then a three-pixel soffit. The shadow is what makes it project.
    bands = [S8, S8, S7, S6, Q, Q, S5]
    for i, c in enumerate(bands):
        for x in range(32):
            px[x, 6 + i] = c
    return im


def plinth(phase: int) -> Image.Image:
    """Brick above a sandstone foundation course."""
    im = brick_face(phase).copy()
    px = im.load()
    for y in range(22, 32):
        for x in range(32):
            local = x % 10
            if y < 24:
                px[x, y] = S8 if y == 22 else S7
            elif local in (0, 9):
                px[x, y] = S5
            elif y > 29:
                px[x, y] = Q
            else:
                px[x, y] = S7 if local < 5 else S6
            if y == 24 and local not in (0, 9):
                px[x, y] = S8
    return im


def quoin(im: Image.Image, edge: str) -> Image.Image:
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for t in range(4):
            x = t if edge == "w" else 31 - t
            c = S8 if t == 3 and y % 8 < 4 else S6 if t else S5
            if y % 8 == 0:
                c = S5
            px[x, y] = c
    return im


def _deco() -> Image.Image:
    im = _CACHE.get("deco")
    if im is None:
        im = key_green(Image.open(DECO_PNG).convert("RGBA"))
        _CACHE["deco"] = im
    return im


def _windows() -> Image.Image:
    im = _CACHE.get("windows")
    if im is None:
        im = Image.open(WINDOWS_PNG).convert("RGBA")
        _CACHE["windows"] = im
    return im


def _containers() -> Image.Image:
    return Image.open(CONT_PNG).convert("RGBA")


def _cooking() -> Image.Image:
    return Image.open(COOK_PNG).convert("RGBA")


def _blue_to_brass(im: Image.Image) -> Image.Image:
    """The LPC ewer is glazed blue. A chai kettle is brass."""
    im = im.convert("RGBA")
    px = im.load()
    vals = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            if b > r + 12 and b > g:
                vals.append((x, y, _lum(r, g, b)))
    if not vals:
        return snap(im)
    lo = min(v[2] for v in vals)
    hi = max(v[2] for v in vals)
    span = hi - lo or 1
    n = len(BRASS_RAMP)
    for x, y, lum in vals:
        t = (lum - lo) / span
        c = BRASS_RAMP[min(n - 1, int(t * n))]
        px[x, y] = (c[0], c[1], c[2], 255)
    return snap(im)


def _pigeon_grey(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    vals = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a >= 128:
                vals.append((x, y, _lum(r, g, b), r, g, b))
    if not vals:
        return im
    lo = min(v[2] for v in vals)
    hi = max(v[2] for v in vals)
    span = hi - lo or 1
    for x, y, lum, r, g, b in vals:
        t = (lum - lo) / span
        # The pale breast stays cream. The body goes to iron grey.
        if r > 170 and g > 140 and b > 120:
            c = FW if t > 0.7 else F
        elif g > r and g > b:
            c = GD
        else:
            i = len(IRON_RAMP) - 1 if t > 0.85 else min(len(IRON_RAMP) - 1, int(t * len(IRON_RAMP)))
            c = IRON_RAMP[i]
        px[x, y] = (c[0], c[1], c[2], 255)
    return im


def _peck(im: Image.Image) -> Image.Image:
    """Drop the head so the bird reads as pecking, not as a texture swap."""
    im = im.copy()
    px = im.load()
    # Head is the top third of the opaque pixels.
    ys = [y for y in range(im.height) for x in range(im.width) if px[x, y][3] > 0]
    if not ys:
        return im
    top = min(ys)
    cut = top + max(6, (max(ys) - top) // 3)
    out = blank(im.width, im.height)
    op = out.load()
    for y in range(im.height):
        for x in range(im.width):
            c = px[x, y]
            if c[3] == 0:
                continue
            ny = y + 3 if y <= cut else y
            if ny < im.height:
                op[x, ny] = c
    return out


def _sway(im: Image.Image, dx: int) -> Image.Image:
    """Shift the cloth below the rope. The line and pegs stay put."""
    im = im.copy()
    px = im.load()
    # Rope is the first opaque row that spans most of the width.
    rope = 4
    for y in range(im.height):
        n = sum(1 for x in range(im.width) if px[x, y][3] > 0)
        if n > im.width * 0.4:
            rope = y
            break
    out = blank(im.width + abs(dx) * 2 + 4, im.height + 4)
    op = out.load()
    ox = abs(dx) + 1
    for y in range(im.height):
        for x in range(im.width):
            c = px[x, y]
            if c[3] == 0:
                continue
            shift = dx if y > rope + 2 else 0
            op[x + ox + shift, y] = c
    return trim(out)


def _flame(px, x: int, y: int, hot: bool, w: int, h: int) -> None:
    col = [
        (0, -6, SP), (0, -5, BH), (0, -4, BL), (-1, -4, SL), (1, -3, BH),
        (0, -3, SP), (-1, -2, BL), (0, -2, BH), (1, -2, SL),
        (0, -1, BD), (-1, -1, SA), (1, -1, BD), (0, 0, SA),
    ]
    if hot:
        col = [(a, b - 1, c) for a, b, c in col] + [(0, -7, FW), (-1, -5, SP)]
    for dx, dy, c in col:
        put(px, x + dx, y + dy, c, w, h)


def _draw_bell() -> Image.Image:
    """Flared temple bell: wood yoke, narrow crown, widening waist, sound bow, clapper."""
    w, h = 26, 34
    im = blank(w, h)
    px = im.load()
    cx = 13
    for x in range(8, 19):
        put(px, x, 0, W, w, h)
        put(px, x, 1, OL, w, h)
        put(px, x, 2, WH, w, h)
    put(px, cx, 4, BD, w, h)
    put(px, cx, 5, BL, w, h)
    for i, y in enumerate(range(6, 26)):
        t = i / 19
        # Stay narrow, then the lip below does the flare. A cone reads as a mushroom.
        half = 4 + int(t * t * 2)
        for x in range(cx - half, cx + half + 1):
            edge = x == cx - half or x == cx + half
            if edge:
                c = BR if x < cx else Q
            elif x < cx - 1 and i % 5 == 0:
                c = BH
            elif x < cx:
                c = BL
            elif x == cx:
                c = BD
            else:
                c = BR
            put(px, x, y, c, w, h)
    # Sound bow: a lip wider than the waist, with the mouth in shadow.
    for y, half in ((26, 8), (27, 11), (28, 12), (29, 12)):
        for x in range(cx - half, cx + half + 1):
            edge = x <= cx - half + 1 or x >= cx + half - 1
            if edge:
                c = BH if x < cx else BR
            elif y == 29:
                c = P
            elif x < cx:
                c = BL
            else:
                c = BD
            put(px, x, y, c, w, h)
    # Clapper hanging under the lip.
    for x in range(cx - 1, cx + 2):
        put(px, x, 31, R, w, h)
        put(px, x, 32, P, w, h)
    put(px, cx, 33, Q, w, h)
    return im


def _draw_kettle() -> Image.Image:
    """Brass chai kettle: lid, belly, spout, handle. Drawn at the degchi's shade count."""
    w, h = 32, 28
    im = blank(w, h)
    px = im.load()
    cx, cy = 14, 16

    def body(x, y) -> None:
        dx = (x - cx) / 8
        dy = (y - cy) / 7
        d = dx * dx + dy * dy
        if d > 1:
            return
        if d > 0.82:
            c = BR if x < cx else Q
        elif x < cx - 2 and y < cy:
            c = BH if y < cy - 2 else BL
        elif x < cx:
            c = BL
        elif y < cy - 1:
            c = BD
        else:
            c = BR
        put(px, x, y, c, w, h)

    for y in range(h):
        for x in range(w):
            body(x, y)
    # Lid sits on the belly. A small knob, not a floating bar.
    for x in range(cx - 5, cx + 6):
        put(px, x, 10, BH if x < cx else BD, w, h)
        put(px, x, 11, BL, w, h)
    put(px, cx, 8, SP, w, h)
    put(px, cx, 9, BH, w, h)
    put(px, cx - 1, 9, BD, w, h)
    # Spout, to the right, pouring lip.
    for i, (x, y) in enumerate(((20, 14), (22, 13), (24, 12), (26, 11), (27, 10), (28, 10))):
        put(px, x, y, BH if i > 3 else BL, w, h)
        put(px, x, y + 1, BD, w, h)
        put(px, x, y + 2, BR, w, h)
    put(px, 28, 9, SP, w, h)
    # Handle, left, a loop.
    for y in range(10, 22):
        put(px, 4, y, BD, w, h)
        put(px, 3, y, BR, w, h)
    for x in range(4, 8):
        put(px, x, 10, BL, w, h)
        put(px, x, 21, BR, w, h)
    return im


def _draw_sack() -> Image.Image:
    """Jute sack with a tied neck and vertical folds. The container sheet had barrels, not sacks."""
    w, h = 30, 38
    im = blank(w, h)
    px = im.load()
    # Slumped jute body. Vertical folds, no hoop lines, so it is not a barrel.
    for y in range(8, 37):
        t = (y - 8) / 28
        half = int(6 + t * 8)
        if y > 33:
            half -= 2
        for x in range(15 - half, 16 + half):
            edge = x <= 15 - half + 1 or x >= 15 + half - 1
            seam = (x - 15) % 6 == 0
            if edge or y > 34:
                c = W
            elif seam:
                c = C
            elif x < 12 and y < 18:
                c = E
            elif x < 14:
                c = OL
            else:
                c = O
            put(px, x, y, c, w, h)
    # Two ears and a knot, the thing that makes a sack a sack.
    for y in range(2, 8):
        put(px, 10, y, OL, w, h)
        put(px, 11, y, E, w, h)
        put(px, 19, y, E, w, h)
        put(px, 20, y, OL, w, h)
    for x in range(12, 19):
        put(px, x, 6, C, w, h)
        put(px, x, 7, OL, w, h)
    put(px, 14, 4, W, w, h)
    put(px, 15, 3, O, w, h)
    put(px, 15, 4, WH, w, h)
    put(px, 16, 4, W, w, h)
    return im


def _draw_bicycle() -> Image.Image:
    """Upright, both tyres on the ground, kickstand down. Wheels are circles, not ovals."""
    w, h = 46, 50
    im = blank(w, h)
    px = im.load()

    def ring(cx: int, cy: int, radius: int, color) -> None:
        for y in range(cy - radius - 1, cy + radius + 2):
            for x in range(cx - radius - 1, cx + radius + 2):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if radius - 1.2 <= d <= radius + 0.3:
                    # Dark tyre. One cool glint, so the wheel does not read as blue.
                    shade = LH if x < cx - 6 and y < cy - 6 else R if d < radius else P
                    put(px, x, y, shade if color is None else color, w, h)

    def spoke(cx: int, cy: int, radius: int) -> None:
        for i in range(radius - 1):
            for dx, dy in ((i, 0), (-i, 0), (0, i), (0, -i), (i, i), (-i, i), (i, -i), (-i, -i)):
                if dx * dx + dy * dy < (radius - 1) ** 2 and (abs(dx) == abs(dy) or dx == 0 or dy == 0):
                    if abs(dx) == abs(dy) or dx == 0 or dy == 0:
                        put(px, cx + dx, cy + dy, R if (dx + dy) % 2 == 0 else L, w, h)

    ground = 44
    r = 10
    back, front = 12, 34
    cy = ground - r
    for cx in (back, front):
        ring(cx, cy, r, None)
        spoke(cx, cy, r)
        put(px, cx, cy, P, w, h)
        put(px, cx - 1, cy - 1, LH, w, h)
    # Diamond frame.
    def line(x0, y0, x1, y1, color) -> None:
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(steps + 1):
            x = round(x0 + (x1 - x0) * i / steps)
            y = round(y0 + (y1 - y0) * i / steps)
            put(px, x, y, color, w, h)
            put(px, x, y + 1, Q if color == P else W, w, h)

    seat_y, bar_y = 16, 22
    line(back, cy, 22, bar_y, P)
    line(22, bar_y, front, cy, P)
    line(22, bar_y, 20, seat_y, P)
    line(20, seat_y, 26, seat_y, W)
    line(16, seat_y, 26, seat_y, OL)
    put(px, 17, seat_y - 1, WH, w, h)
    # Handlebar.
    line(front, cy, 36, 18, P)
    line(34, 16, 40, 16, OL)
    put(px, 40, 15, WH, w, h)
    put(px, 34, 15, W, w, h)
    # Pedal crank.
    put(px, 22, bar_y + 6, BD, w, h)
    put(px, 23, bar_y + 7, BL, w, h)
    # Kickstand, from the crank to the ground, out to the side.
    line(22, bar_y + 4, 18, ground, R)
    put(px, 17, ground, P, w, h)
    put(px, 18, ground, P, w, h)
    put(px, 19, ground, L, w, h)
    return im


def _draw_plate(floor: Image.Image) -> Image.Image:
    """A round iron plate with a brass rim, sitting on the flagstone."""
    im = floor.copy()
    px = im.load()
    cx, cy = 16, 17
    for y in range(32):
        for x in range(32):
            dx = x - cx
            dy = (y - cy) * 1.15
            d = (dx * dx + dy * dy) ** 0.5
            if d > 11:
                continue
            if d > 9.2:
                px[x, y] = BH if x < cx and y < cy else BD if d > 10.2 else BL
            elif d > 8.2:
                px[x, y] = BR
            else:
                px[x, y] = R if (x + y) % 5 == 0 else P
                if x < cx - 2 and y < cy:
                    px[x, y] = L
    blit(im, ["  uu  ", " u**u ", "u*tt*u", " u**u ", "  uu  "], 12, 14)
    return im


def _draw_steam() -> list[Image.Image]:
    frames = []
    shapes = [
        ["  f ", " f F", "f   ", " F f", "  f "],
        [" F  ", "f F ", "  f ", " F  ", "f   "],
        ["   f", " f  ", "F f ", "  F ", " f  "],
    ]
    for rows in shapes:
        im = blank(16, 22)
        blit(im, rows, 4, 2)
        blit(im, rows, 6, 8)
        frames.append(im)
    return frames


def _draw_pebble() -> Image.Image:
    im = blank(14, 10)
    blit(im, [
        "  778887  ",
        " 75555557 ",
        "7556666557",
        "7566666657",
        " 55655557 ",
        "  555557  ",
    ], 1, 2)
    return im


def _draw_leaflet() -> Image.Image:
    im = blank(18, 24)
    px = im.load()
    for y in range(2, 22):
        for x in range(2, 16):
            px[x, y] = FW if y < 6 or x < 5 else F
    for y in range(2, 8):
        px[12, y] = E
        px[13, y] = D
    for y, x0, x1 in ((6, 4, 13), (9, 4, 12), (12, 4, 13), (15, 4, 10)):
        for x in range(x0, x1):
            px[x, y] = D if x % 3 else Q
    px[14, 2] = E
    px[15, 3] = D
    return im


def _tulsi(pot: Image.Image) -> Image.Image:
    """A real clay pot, with basil drawn at the pot's own outline weight."""
    im = blank(pot.width + 8, pot.height + 16)
    paste(im, pot, (4, 16))
    px = im.load()
    cx = im.width // 2
    leaves = [
        (0, 0, GH), (-3, 2, GL), (3, 2, GD), (-6, 5, G), (5, 4, GL),
        (-2, 5, GH), (1, 6, GD), (0, -3, GH), (-4, -1, GL), (4, 0, G),
        (-1, 3, GH), (2, -2, GL), (-5, 1, GD), (6, 2, G), (0, 4, GL),
    ]
    for dx, dy, c in leaves:
        put(px, cx + dx, 12 + dy, c, im.width, im.height)
        put(px, cx + dx, 13 + dy, G, im.width, im.height)
    put(px, cx, 8, OL, im.width, im.height)
    return im


def _diyas(bowl: Image.Image) -> tuple[Image.Image, Image.Image]:
    def one(hot: bool) -> Image.Image:
        im = blank(max(20, bowl.width + 4), bowl.height + 12)
        paste(im, bowl, ((im.width - bowl.width) // 2, 10))
        _flame(im.load(), im.width // 2, 12, hot, im.width, im.height)
        return trim(im)

    return one(False), one(True)


def _glow() -> Image.Image:
    im = blank(56, 36)
    px = im.load()
    for y in range(36):
        for x in range(56):
            dx = (x - 28) / 28
            dy = (y - 14) / 16
            d = dx * dx + dy * dy
            if d > 1:
                continue
            if d < 0.15:
                c = SP
            elif d < 0.4:
                c = BH if (x + y) % 2 == 0 else BL
            elif d < 0.7:
                c = SL if (x * 2 + y) % 3 else BD
            else:
                c = SA if (x + y) % 2 == 0 else (0, 0, 0, 0)
            if c[0]:
                px[x, y] = c if len(c) == 4 else (*c, 255)
    return im


def _shadow(w: int, h: int) -> Image.Image:
    im = blank(w, h)
    px = im.load()
    for y in range(h):
        for x in range(w):
            dx = (x - w / 2) / (w / 2)
            dy = (y - h / 2) / (h / 2)
            if dx * dx + dy * dy <= 1 and (x + y) % 2 == 0:
                px[x, y] = (*Q[:3], 180)
    return im


def _components(im: Image.Image, min_area: int = 80):
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    out = []
    from collections import deque
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] or px[x, y][3] < 20:
                seen[i] = 1
                continue
            q = deque([(x, y)])
            seen[i] = 1
            minx = maxx = x
            miny = maxy = y
            area = 0
            reds = 0
            while q:
                cx, cy = q.popleft()
                area += 1
                r, g, b, _a = px[cx, cy]
                if r > g + 15 and r > b:
                    reds += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        if px[nx, ny][3] >= 20:
                            q.append((nx, ny))
                            minx = min(minx, nx)
                            maxx = max(maxx, nx)
                            miny = min(miny, ny)
                            maxy = max(maxy, ny)
            bw, bh = maxx - minx + 1, maxy - miny + 1
            if area >= min_area:
                out.append((area, bw, bh, minx, miny, maxx + 1, maxy + 1, reds / area))
    return out


def _matka_and_bowl():
    cont = _containers()
    # A tall clay water pot, and a shallow bowl for the diya and the kulhad.
    band = cont.crop((0, 1120, 280, 1280))
    clay = [c for c in _components(band, 120) if c[7] > 0.35 and c[2] >= 28]
    clay.sort(key=lambda c: c[2], reverse=True)
    if not clay:
        raise RuntimeError("no clay pot")
    big = clay[0]
    pot = snap(band.crop((big[3], big[4], big[5], big[6])))
    bowls = cont.crop((180, 1168, 340, 1255))
    small = [c for c in _components(bowls, 60) if 14 <= c[1] <= 28 and 8 <= c[2] <= 18]
    small.sort(key=lambda c: c[0])
    if small:
        b = small[0]
        bowl = recolor(bowls.crop((b[3], b[4], b[5], b[6])), CLAY_RAMP)
    else:
        bowl = pot.crop((2, pot.height // 2, pot.width - 2, pot.height))
    return pot, bowl


def _kettle() -> Image.Image:
    # The container sheet's ewers are round jars with no spout. The kettle is the gap.
    return _draw_kettle()


def _degchi() -> Image.Image:
    cook = _cooking()
    # A cauldron with a pale stew. Crop the known row and take the yellow one.
    band = cook.crop((300, 400, 512, 490))
    px = band.load()
    best = None
    for area, bw, bh, x0, y0, x1, y1, _red in _components(band, 200):
        if bh < 24 or bw < 24:
            continue
        yellow = 0
        for y in range(y0, min(y1, y0 + 16)):
            for x in range(x0, x1):
                r, g, b, a = px[x, y]
                if a > 128 and r > 160 and g > 120 and b < 120:
                    yellow += 1
        if best is None or yellow > best[0]:
            best = (yellow, x0, y0, x1, y1)
    if best is None:
        raise RuntimeError("no degchi")
    return snap(band.crop(best[1:]))


def _sack() -> Image.Image:
    return _draw_sack()


def _lanterns() -> tuple[Image.Image, Image.Image]:
    deco = _deco()
    a = snap(crop(deco, (416, 0, 442, 34)))
    b = snap(crop(deco, (448, 0, 474, 34)))
    # If the second is a different housing, nudge its flame by using the first and a hot flame.
    if a.size != b.size or a.getbbox() != b.getbbox():
        b = a.copy()
        _flame(b.load(), b.width // 2, 8, True, b.width, b.height)
        b = trim(b)
    return a, b


def _laundry() -> tuple[Image.Image, Image.Image]:
    deco = _deco()
    # Rope, pegs, a white sheet, a red cloth, and a tan cloth.
    line = snap(crop(deco, (258, 188, 385, 220)))
    return line, _sway(line, 3)


def _pigeons() -> tuple[Image.Image, Image.Image, Image.Image]:
    bird = Image.open(BIRD_PNG).convert("RGBA")
    frames = []
    for col in range(3):
        fr = bird.crop((col * 32, 7 * 32, col * 32 + 32, 8 * 32))
        frames.append(_pigeon_grey(fr))
    # Union trim so the feet stay aligned.
    boxes = [f.getbbox() for f in frames]
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    trimmed = [f.crop((x0, y0, x1, y1)) for f in frames]
    peck = _peck(trimmed[0])
    return trimmed[1], trimmed[2], peck


def _lattice() -> Image.Image:
    # One diamond-jaali casement, frame included, from LPC windows.
    win = _windows()
    return snap(trim(win.crop((413, 446, 451, 506))))


def _door() -> Image.Image:
    # Six-panel wooden door. The gate sprite. Stop above the next door down.
    win = _windows()
    return snap(trim(win.crop((321, 513, 367, 566))))


def _jharokha(lattice: Image.Image) -> Image.Image:
    """Cusped arch, sandstone frame, the real jaali, and brackets that hang below the sill."""
    lw, lh = lattice.size
    w = max(lw + 18, 52)
    h = lh + 36
    im = blank(w, h)
    px = im.load()
    ox = (w - lw) // 2
    oy = 14
    # Cusped arch: a curve that comes to a point, not a triangular pediment.
    crown = oy + 2
    half = lw / 2 + 4
    for x in range(ox - 4, ox + lw + 4):
        dx = abs(x - w // 2) / half
        dx = min(1.0, dx)
        rise = int(dx * dx * 16)
        for t in range(6):
            c = S8 if t == 0 else S5 if t >= 5 else S7 if (x // 4) % 2 == 0 else S6
            put(px, x, crown - 16 + rise + t, c, w, h)
    # Jambs.
    for y in range(crown, oy + lh):
        for t in range(4):
            put(px, ox - 4 + t, y, S8 if t == 3 else S6, w, h)
            put(px, ox + lw + t, y, S5 if t == 0 else S6, w, h)
    paste(im, lattice, (ox, oy))
    # Projecting sill.
    sill = oy + lh
    for y in range(4):
        for x in range(ox - 8, ox + lw + 8):
            c = S8 if y == 0 else S5 if y == 3 else S7 if x < w // 2 else S6
            put(px, x, sill + y, c, w, h)
    # Two timber brackets under the sill, splayed, so the balcony projects.
    for side in (ox + 2, ox + lw - 8):
        outward = 1 if side < w // 2 else -1
        for i in range(12):
            x0 = side + outward * (i // 2)
            for t in range(5):
                c = WH if t == 1 and i < 3 else OL if t in (1, 2) else W
                put(px, x0 + t, sill + 4 + i, c, w, h)
    return im


def _stall(kettle: Image.Image, degchi: Image.Image) -> Image.Image:
    deco = _deco()
    # Front awning: saffron and cream stripes, scalloped valance.
    awning = snap(crop(deco, (266, 888, 320, 972)))
    # Plank counter only. The row under it is a different prop.
    counter = snap(crop(deco, (292, 1002, 400, 1034)))
    width = max(awning.width * 3 - 6, counter.width, 128)
    im = blank(width + 4, awning.height + counter.height + 8)
    for i in range(3):
        paste(im, awning, (2 + i * (awning.width - 2), 0))
    counter_y = awning.height - 4
    paste(im, counter, ((im.width - counter.width) // 2, counter_y))
    foot = counter_y + counter.height
    paste(im, degchi, (8, foot - degchi.height))
    paste(im, kettle, (im.width - kettle.width - 6, foot - kettle.height))
    im = trim(im)
    # A scrap from the next sheet row hangs under the counter. Clear it.
    px = im.load()
    for y in range(im.height - 8, im.height):
        for x in range(im.width // 2 - 6, im.width // 2 + 16):
            if px[x, y][3]:
                px[x, y] = (0, 0, 0, 0)
    return trim(im)


def _cart() -> Image.Image:
    deco = _deco()
    # Both spoked wheels and the shafts. Keep every pixel in the crop.
    # Shafts plus both spoked wheels. Stop before the next cart and the awning row.
    cart = snap(trim(deco.crop((7, 758, 152, 799))))
    food = Image.open(FOOD_PNG).convert("RGBA")
    produce = []
    for col, row in ((2, 0), (4, 0), (1, 1), (5, 1)):
        cell = food.crop((col * 32, row * 32, col * 32 + 32, row * 32 + 32))
        if cell.getbbox():
            item = snap(trim(cell))
            if item.width <= 20 and item.height <= 20:
                produce.append(item)
    x = 8
    bed = max(0, cart.height // 2 - 8)
    for item in produce[:4]:
        if x + item.width > cart.width - 16:
            break
        paste(cart, item, (x, bed))
        x += item.width + 1
    # A pitchfork from the next object on the sheet sits past a clear gap.
    px = cart.load()
    cut = cart.width
    for x in range(cart.width - 1, cart.width // 2, -1):
        empty = all(px[x, y][3] < 128 for y in range(cart.height))
        if empty:
            cut = x
        elif cut < cart.width:
            break
    if cut < cart.width - 4:
        cart = trim(cart.crop((0, 0, cut, cart.height)))
    return cart


def _crate() -> Image.Image:
    cont = _containers()
    band = cont.crop((0, 180, 512, 520))
    comps = [c for c in _components(band, 250) if 24 <= c[1] <= 48 and 20 <= c[2] <= 40]
    comps.sort(key=lambda c: abs(c[1] - 36) + abs(c[2] - 28))
    if not comps:
        raise RuntimeError("no crate")
    c = comps[0]
    return snap(band.crop((c[3], c[4], c[5], c[6])))


def _bench() -> Image.Image:
    deco = _deco()
    band = deco.crop((0, 1000, 400, 1250))
    comps = [c for c in _components(band, 200) if c[1] > 40 and 10 <= c[2] <= 36]
    comps.sort(key=lambda c: c[1], reverse=True)
    if not comps:
        return snap(crop(deco, (140, 1040, 240, 1120)))
    c = comps[0]
    im = snap(band.crop((c[3], c[4], c[5], c[6])))
    if im.width > 120:
        im = trim(im.crop((0, 0, 104, im.height)))
    return im


def _well() -> Image.Image:
    """Top-down baoli: a thick sandstone ring, dark water, a brass bucket on the lip."""
    w, h = 64, 48
    im = blank(w, h)
    px = im.load()
    for y in range(h):
        for x in range(w):
            dx = (x - 31) / 26
            dy = (y - 24) / 16
            d = dx * dx + dy * dy
            if d > 1:
                continue
            ang = int((x / 8) + (y / 10))
            if d > 0.72:
                if d > 0.94:
                    c = S5 if x > 34 or y > 28 else S6
                elif x < 28 and y < 22:
                    c = S8 if ang % 2 == 0 else S7
                else:
                    c = S6 if ang % 2 == 0 else S5
                # Block joints in the coping.
                if int(x / 7) != int((x - 1) / 7) or int(y / 6) != int((y - 1) / 6):
                    c = S5 if d < 0.9 else Q
                px[x, y] = c
            elif d > 0.58:
                px[x, y] = Q if y > 24 else S5
            else:
                px[x, y] = WT if (x + y) % 3 else P
                if x < 26 and y < 20 and (x * 3 + y) % 7 == 0:
                    px[x, y] = LH
    blit(im, [" nN ", "nB*n", " nN "], 40, 8)
    return im


def _pillar() -> Image.Image:
    stone = parapet(0)
    im = blank(28, 58)
    px = im.load()
    for y in range(8, 48):
        for x in range(6, 22):
            src = stone.getpixel((x + 4, (y * 2) % 32))
            px[x, y] = src if src[3] else S6
            if x == 6:
                px[x, y] = S8
            if x == 21:
                px[x, y] = S5
    for y in range(0, 8):
        for x in range(2, 26):
            px[x, y] = S8 if y < 2 else S6 if y > 5 else S7
    for y in range(48, 58):
        for x in range(2, 26):
            px[x, y] = S5 if y > 54 else S7
    return im


def _ledge() -> Image.Image:
    im = blank(52, 12)
    px = im.load()
    for y in range(12):
        for x in range(52):
            if y < 3:
                px[x, y] = S8 if y == 0 else S7
            elif y > 9:
                px[x, y] = Q
            else:
                px[x, y] = S6 if (x // 8) % 2 else S7
                if x % 8 == 0:
                    px[x, y] = S5
    return im


def _food_bits() -> list[Image.Image]:
    return []


def build() -> dict[str, Image.Image]:
    pot, bowl = _matka_and_bowl()
    kettle = _kettle()
    degchi = _degchi()
    lattice = _lattice()
    a, b = _lanterns()
    wash, wash_b = _laundry()
    p0, p1, peck = _pigeons()
    d0, d1 = _diyas(bowl)
    steam = _draw_steam()
    props: dict[str, Image.Image] = {
        "matka": pot,
        "sack": _sack(),
        "tulsi": _tulsi(pot),
        "kettle": kettle,
        "kulhad": bowl,
        "bell": _draw_bell(),
        "lantern": a,
        "lantern-b": b,
        "diya": d0,
        "diya-b": d1,
        "pebble": _draw_pebble(),
        "leaflet": _draw_leaflet(),
        "pigeon": p0,
        "pigeon-b": p1,
        "pigeon-c": peck,
        "laundry": wash,
        "laundry-b": wash_b,
        "crate": _crate(),
        "bench": _bench(),
        "bicycle": _draw_bicycle(),
        "tonga": _cart(),
        "well": _well(),
        "pillar": _pillar(),
        "door": _door(),
        "jharokha": _jharokha(lattice),
        "jaali": lattice,
        "ledge": _ledge(),
        "stall": _stall(kettle, degchi),
        "glow": _glow(),
        "shadow": _shadow(36, 12),
        "steam0": steam[0],
        "steam1": steam[1],
        "steam2": steam[2],
    }
    return props


def wall(role: str, phase: int) -> Image.Image:
    if role == "parapet":
        return parapet(phase)
    if role == "cornice":
        return cornice(phase)
    if role == "plinth":
        return plinth(phase)
    return brick_face(phase)


if __name__ == "__main__":
    dest = Path("/tmp/craft")
    dest.mkdir(exist_ok=True)
    props = build()
    for name, im in props.items():
        im.save(dest / f"{name}.png")
        print(f"{name:12} {im.size}")
    sample = Image.new("RGBA", (32 * 8, 32 * 4), (40, 32, 28, 255))
    for x in range(8):
        sample.paste(parapet(x), (x * 32, 0))
        sample.paste(cornice(x), (x * 32, 32))
        sample.paste(brick_face(x), (x * 32, 64))
        sample.paste(plinth(x), (x * 32, 96))
    sample.resize((sample.width * 3, sample.height * 3), Image.NEAREST).save(dest / "wall-x3.png")
    for name in ("stall", "matka", "tulsi", "kettle", "bicycle", "jharokha", "tonga", "bell", "lantern", "laundry", "pigeon", "well", "door", "jaali"):
        im = props[name]
        im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(dest / f"{name}-x3.png")
    print("preview", dest)
