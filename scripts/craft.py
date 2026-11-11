#!/usr/bin/env python3
"""Hand-authored courtyard art.

One 48-colour palette. Light comes from the top-left: highlights are warm,
shadows step toward a cool plum, and outlines are dark local colour, lighter
or absent on lit edges. No blurred gradients. Dither is only the lantern pools
and the contact shadows.

Pixel groups below are drawn, not noised. A brick course or a stone joint is
the same kind of decision a 16-bit tileset makes on purpose.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

# 48 colours. Skin bronze sits on the wood/clay ramps so faces and teak match.
K = (26, 18, 20, 255)       # ink
Q = (48, 32, 42, 255)       # cool plum shadow
B1 = (86, 40, 46, 255)      # brick shade, cooler
B2 = (132, 58, 48, 255)
B3 = (176, 96, 74, 255)
B4 = (210, 140, 112, 255)
M = (90, 74, 64, 255)       # mortar
ML = (128, 108, 92, 255)
S5 = (78, 58, 44, 255)      # stone deep
S6 = (132, 102, 72, 255)
S7 = (168, 136, 100, 255)
S8 = (206, 178, 140, 255)
W = (52, 32, 22, 255)       # wood deep
O = (100, 65, 51, 255)      # skin / teak
OL = (127, 76, 49, 255)     # skin
WH = (176, 122, 78, 255)
C = (68, 39, 37, 255)       # clay / skin shadow
A = (142, 68, 48, 255)
AL = (174, 107, 63, 255)    # skin
AH = (211, 139, 89, 255)    # skin light
BR = (74, 52, 16, 255)      # brass
BD = (154, 108, 32, 255)
BL = (214, 166, 64, 255)
BH = (240, 210, 128, 255)
SP = (255, 246, 214, 255)   # specular
D = (92, 74, 56, 255)       # cloth
E = (164, 136, 104, 255)
F = (224, 202, 168, 255)
FW = (250, 244, 228, 255)
SA = (112, 48, 20, 255)
SF = (184, 80, 32, 255)
SL = (232, 140, 60, 255)
SPALE = (248, 206, 144, 255)
G = (24, 44, 24, 255)
GD = (46, 88, 36, 255)
GL = (96, 146, 58, 255)
GH = (164, 196, 104, 255)
P = (28, 34, 42, 255)       # iron / navy
R = (72, 80, 90, 255)
L = (140, 150, 160, 255)
LH = (208, 214, 220, 255)
WT = (20, 34, 42, 255)
X = (92, 24, 32, 255)       # maroon
Y = (168, 40, 44, 255)
Z = (224, 116, 104, 255)
KK = (74, 62, 36, 255)      # khaki
KX = (138, 116, 64, 255)
KZ = (198, 174, 108, 255)

PALETTE: list[tuple[int, int, int]] = [
    c[:3] for c in (
        K, Q, B1, B2, B3, B4, M, ML, S5, S6, S7, S8, W, O, OL, WH,
        C, A, AL, AH, BR, BD, BL, BH, SP, D, E, F, FW, SA, SF, SL, SPALE,
        G, GD, GL, GH, P, R, L, LH, WT, X, Y, Z, KK, KX, KZ,
    )
]
assert len(PALETTE) == 48

KEY = {
    "k": K, "q": Q,
    "1": B1, "2": B2, "3": B3, "4": B4,
    "m": M, "M": ML,
    "5": S5, "6": S6, "7": S7, "8": S8,
    "w": W, "o": O, "O": OL, "W": WH,
    "c": C, "a": A, "A": AL, "C": AH,
    "b": BR, "B": BD, "n": BL, "N": BH, "*": SP,
    "d": D, "e": E, "f": F, "F": FW,
    "s": SA, "t": SF, "u": SL, "U": SPALE,
    "g": G, "h": GD, "i": GL, "j": GH,
    "p": P, "r": R, "l": L, "L": LH,
    "~": WT,
    "x": X, "y": Y, "z": Z,
    "K": KK, "X": KX, "Z": KZ,
}


def nearest(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    best = PALETTE[0]
    best_d = 1e18
    for c in PALETTE:
        d = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2
        if d < best_d:
            best, best_d = c, d
    return best


def snap(im: Image.Image) -> Image.Image:
    """Crush AA fringes and lock every opaque pixel to the master palette."""
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
            else:
                nr, ng, nb = nearest((r, g, b))
                px[x, y] = (nr, ng, nb, 255)
    return im


def blank(w: int, h: int) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def blit(im: Image.Image, rows: list[str], ox: int = 0, oy: int = 0) -> None:
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in " .":
                continue
            c = KEY.get(ch)
            if not c:
                continue
            xx, yy = ox + x, oy + y
            if 0 <= xx < im.width and 0 <= yy < im.height:
                px[xx, yy] = c


def put(px, x: int, y: int, c, w: int, h: int) -> None:
    if 0 <= x < w and 0 <= y < h and c[3]:
        px[x, y] = c


def paste(dst: Image.Image, src: Image.Image, xy: tuple[int, int]) -> None:
    dst.alpha_composite(src, xy)


def from_rows(rows: list[str]) -> Image.Image:
    w = max(len(r) for r in rows)
    im = blank(w, len(rows))
    blit(im, rows)
    return im


# --- tiles -----------------------------------------------------------------

def _stone(px, x: int, y: int, w: int, h: int, body, lit, shade, chip: tuple[int, int] | None = None) -> None:
    for j in range(h):
        for i in range(w):
            if chip and i >= w - chip[0] and j >= h - chip[1]:
                continue
            if j == 0 or i == 0:
                c = lit
            elif j == h - 1 or i == w - 1:
                c = shade
            else:
                c = body
            px[x + i, y + j] = c


def floor_tile(kind: int, crack: bool = False) -> Image.Image:
    """Big flat slabs. Colour shifts between stones; the joint is a hairline.

    A full bevel on every block reads as brick, so the light only nicks
    the top-left corner.
    """
    im = Image.new("RGBA", (32, 32), S6)
    px = im.load()
    layouts = [
        [(0, 0, 18, 16), (19, 0, 13, 16), (0, 17, 13, 15), (14, 17, 18, 15)],
        [(0, 0, 14, 20), (15, 0, 17, 14), (15, 15, 17, 17), (0, 21, 14, 11)],
        [(0, 0, 32, 14), (0, 15, 20, 17), (21, 15, 11, 17)],
        [(0, 0, 15, 15), (16, 0, 16, 22), (0, 16, 15, 16), (16, 23, 16, 9)],
    ]
    tones = [S7, S7, S8, S6, S7, S7]
    for n, (x, y, w, h) in enumerate(layouts[kind % 4]):
        body = tones[(n + kind) % len(tones)]
        for j in range(h):
            for i in range(w):
                if i == w - 1 or j == h - 1:
                    c = S6  # hairline joint
                else:
                    c = body
                if 0 <= x + i < 32 and 0 <= y + j < 32:
                    px[x + i, y + j] = c
    if crack:
        for x, y in ((6, 20), (7, 21), (8, 21), (9, 22), (10, 23)):
            if 0 <= x < 32 and 0 <= y < 32 and px[x, y][:3] != S6[:3]:
                px[x, y] = S5
    return im


def _brick_at(px, x: int, y: int, w: int, h: int, body, lit, shade) -> None:
    for j in range(h):
        for i in range(w):
            # Top edge catches the light. The right and bottom turn away.
            if j == 0 and i < w - 1:
                c = lit
            elif j == h - 1 or i == w - 1:
                c = shade
            elif i == 0 and j == 1:
                c = lit
            else:
                c = body
            if 0 <= x + i < 32 and 0 <= y + j < 32:
                px[x + i, y + j] = c


def _courses(px, y0: int, y1: int, seed: int) -> None:
    """Running bond between y0 and y1. Mortar is the base colour."""
    bodies = [B2, B3, B2, B2, B3, B1, B2, B3]
    row = 0
    y = y0
    while y + 7 <= y1:
        offset = 0 if (row + seed) % 2 == 0 else -8
        x = offset
        bi = row * 3 + seed
        while x < 32:
            bw = 15
            bx = x
            if bx < 0:
                bw += bx
                bx = 0
            if bx + bw > 32:
                bw = 32 - bx
            if bw > 2:
                body = bodies[(bi + (x // 16)) % len(bodies)]
                lit = B4 if body != B1 else B3
                shade = B1 if body != B1 else Q
                _brick_at(px, bx, y, bw, 7, body, lit, shade)
            x += 16
            bi += 1
        y += 8
        row += 1


def _damage(px, kind: int) -> None:
    # Cracks, plaster, soot. Each list is a drawn cluster, not noise.
    if kind % 5 == 1:
        for x, y in ((14, 8), (15, 9), (15, 10), (16, 11), (16, 12), (17, 13), (18, 14), (18, 15)):
            px[x, y] = B1
            if x + 1 < 32:
                px[x + 1, y] = Q
    elif kind % 5 == 2:
        # Raised plaster: lit on the top-left, cool on the bottom-right.
        patch = [
            "      8888    ",
            "    888877    ",
            "   8877776    ",
            "   87777665   ",
            "    777665    ",
            "     7665     ",
        ]
        for j, row in enumerate(patch):
            for i, ch in enumerate(row):
                if ch in " .":
                    continue
                c = {"8": S8, "7": S7, "6": S6, "5": S5}[ch]
                xx, yy = 14 + i, 4 + j
                if 0 <= xx < 32 and 0 <= yy < 32:
                    px[xx, yy] = c
    elif kind % 5 == 3:
        for x, y in ((4, 20), (5, 20), (6, 21), (5, 21), (4, 21), (7, 22), (6, 22), (5, 22), (3, 22), (6, 23), (4, 23)):
            px[x, y] = Q
        px[5, 20] = B1
    elif kind % 5 == 4:
        # Chipped arris.
        for x, y in ((20, 10), (21, 10), (22, 10), (21, 11), (22, 11)):
            px[x, y] = M


def brick_face(kind: int) -> Image.Image:
    im = Image.new("RGBA", (32, 32), M)
    px = im.load()
    _courses(px, 0, 32, kind)
    if kind % 8 == 1:
        _damage(px, 1)
    elif kind % 8 == 5:
        _damage(px, 2)
    return im


def brick_cap(kind: int) -> Image.Image:
    """Parapet: a lit sandstone top, a cool underside, then the wall face."""
    im = Image.new("RGBA", (32, 32), M)
    px = im.load()
    for y in range(32):
        for x in range(32):
            px[x, y] = M
    # Coping slabs along the top.
    for x, w in ((0, 14), (15, 17)):
        _stone(px, x, 0, w, 5, S7, S8, S6)
    for x in range(32):
        px[x, 5] = S8
        px[x, 6] = S7
        px[x, 7] = Q  # underside, light cannot reach
        px[x, 8] = S6
        px[x, 9] = S5
    # Dentils, every fourth pixel, so the cornice is carved rather than a bar.
    for x in range(2, 32, 4):
        px[x, 8] = S8
        px[x + 1, 8] = S7
    _courses(px, 11, 32, kind)
    if kind % 8 == 2:
        _damage(px, 1)
    return im


def brick_plinth(kind: int) -> Image.Image:
    im = Image.new("RGBA", (32, 32), M)
    px = im.load()
    _courses(px, 0, 22, kind + 2)
    for x in range(32):
        px[x, 22] = Q
        px[x, 23] = S6
        px[x, 24] = S7
        px[x, 25] = S8
        px[x, 26] = S6
        px[x, 27] = S5
        px[x, 28] = S5
        px[x, 29] = Q
        px[x, 30] = S5
        px[x, 31] = K
    # Plinth blocks.
    for x in (0, 16):
        px[x, 24] = M
        px[x, 25] = M
        px[x, 26] = S5
    if kind % 8 == 4:
        _damage(px, 3)
    return im


def side_quoin(im: Image.Image, edge: str) -> Image.Image:
    """Sandstone pier on the edge that meets the court, so the wall has thickness."""
    im = im.copy()
    px = im.load()
    xs = range(0, 6) if edge == "w" else range(26, 32)
    for y in range(0, 32, 8):
        lit = (y // 8) % 2 == 0
        for yy in range(y, min(32, y + 7)):
            for x in xs:
                if edge == "w":
                    c = S8 if x == 5 or yy == y else S6 if x == 0 else S7
                else:
                    c = S8 if x == 26 or yy == y else S5 if x == 31 else S7
                if not lit:
                    c = S6 if c == S7 else S5 if c == S6 else S7
                px[x, yy] = c
            px[xs[0] if False else (5 if edge == "w" else 26), min(31, y + 7)] = M
    return im


def plank_tile(kind: int) -> Image.Image:
    im = Image.new("RGBA", (32, 32), W)
    px = im.load()
    for board in range(4):
        y0 = board * 8
        body = (O, OL, WH, O)[ (board + kind) % 4 ]
        for y in range(y0, y0 + 7):
            for x in range(32):
                if y == y0:
                    c = WH
                elif y == y0 + 6:
                    c = W
                elif x % 11 == (kind + board) % 5 and y == y0 + 3:
                    c = W  # grain break
                else:
                    c = body
                px[x, y] = c
        px[4 + kind * 3, y0 + 2] = BR
        px[4 + kind * 3, y0 + 3] = BD  # nail
    # Knot on one board.
    kx, ky = 20, 8 + (kind % 3) * 8 + 3
    px[kx, ky] = W
    px[kx + 1, ky] = O
    px[kx, ky + 1] = OL
    return im


# --- small props, drawn pixel by pixel ------------------------------------

MATKA = from_rows([
    "      CCCCCC      ",
    "    CC****CC      ",
    "   CAAAAaaaaCk    ",
    "   AAaaaaaaaAk    ",
    "    aaaaaaaAaq    ",
    "   CAAAAAAAAAaq   ",
    "  CAAAAaaaaAAAaq  ",
    " CAAAAaaaaaaaAAaq ",
    " CAAA*aaaaaaaAAaq ",
    " AAAAaaaaaaaacAaq ",
    " AAAAaaaaaaaacCaq ",
    " AAAAaaaaaaacCCqq ",
    " AAAAaaaaaaallCqq ",
    "  AAAaaaaaaacAAq  ",
    "  AAAAAAAAAAAAq   ",
    "   AAAAAAAAAaq    ",
    "    AAccccAAq     ",
    "     qqqqqq       ",
    "      WWWW        ",
    "     WWWWWW       ",
])

SACK = from_rows([
    "      kkk       ",
    "     keeek      ",
    "    keEEEek     ",
    "   kddeeeedk    ",
    "   kdedededek   ",
    "  kdeeeeeeeedk  ",
    "  kdeeedeeeedk  ",
    "  kdeeeeeeeedk  ",
    "  kdddeeeeeddk  ",
    "   kddddddddk   ",
    "   kdeeeeeedk   ",
    "    kddddddk    ",
    "   kkWWWWWWkk   ",
])

TULSI = from_rows([
    "       j        ",
    "      jij       ",
    "     jihih      ",
    "    jhiGihj     ",
    "     hiGih      ",
    "   jhiGhGihj    ",
    "    hiGGGih     ",
    "   ghiGiGihg    ",
    "    giGGGig     ",
    "     gGGGg      ",
    "      gk g      ",
    "     kAAAAk     ",
    "    kAaaaaAk    ",
    "    kaAAAAAk    ",
    "    kAAAAAAk    ",
    "     kaAAAak    ",
    "     kAAAAAk    ",
    "      kWWWk     ",
    "     kWWWWWWk   ",
])

KULHAD = from_rows([
    " kkkkkkkk ",
    "kCccccccCk",
    "kCaaaaaaCk",
    " kAAAAAAak",
    " kAAAAAAak",
    "  kAAAAak ",
    "  kaAAAak ",
    "   kWWWk  ",
])

def _kettle() -> Image.Image:
    """Side view: lid, belly, a loop handle, a spout. Drawn to a silhouette."""
    im = blank(28, 20)
    px = im.load()
    w, h = 28, 20
    # Lid.
    for x in range(10, 18):
        put(px, x, 1, BD, w, h)
        put(px, x, 2, BH, w, h)
    put(px, 13, 0, SP, w, h)
    put(px, 14, 0, BH, w, h)
    # Belly. Left side is the highlight, right side falls into brass-shadow.
    for y, x0, x1 in (
        (3, 8, 20), (4, 7, 21), (5, 6, 22), (6, 6, 22),
        (7, 6, 22), (8, 7, 21), (9, 8, 20), (10, 9, 19),
    ):
        for x in range(x0, x1):
            if x < x0 + 2:
                c = SP if y < 6 else BH
            elif x > x1 - 3:
                c = BR
            elif y < 5:
                c = BH
            elif y < 8:
                c = BL
            else:
                c = BD
            put(px, x, y, c, w, h)
    # Handle, a closed loop on the left.
    for y in range(5, 12):
        put(px, 2, y, BD, w, h)
        put(px, 3, y, BR, w, h)
    for x in range(2, 7):
        put(px, x, 5, BH, w, h)
        put(px, x, 11, BD, w, h)
    # Spout.
    for i, x in enumerate(range(20, 27)):
        put(px, x, 6, BH, w, h)
        put(px, x, 7, BD, w, h)
        put(px, x, 8 - (i > 4), BR, w, h)
    put(px, 26, 5, SP, w, h)
    return im


KETTLE = _kettle()

BELL = from_rows([
    "        bb        ",
    "        nn        ",
    "        nn        ",
    "       kbbk       ",
    "      knNNnk      ",
    "     knNNNNnk     ",
    "    knNNnnnnnk    ",
    "   kBBnnnnnnBBk   ",
    "   kBnnnnnnnnBk   ",
    "  kBBnnbbbbbbBk   ",
    "  kBbbbbbbbbbBk   ",
    " kBBbbbbbbbbbBBk  ",
    "kNNnnnnnnnnnnnNNk ",
    "kbBBBBBBBBBBBBbBk ",
    " kkkkkkkkkkkkkkk  ",
    "       bbb        ",
    "       b*b        ",
    "       kbk        ",
])

LANTERN = from_rows([
    "     bb     ",
    "     nn     ",
    "    kbbk    ",
    "   kBNNBk   ",
    "   bNuUNb   ",
    "   bNtutNb  ",
    "   bN*s*Nb  ",
    "   bNtutNb  ",
    "   kBuUBk   ",
    "    knnk    ",
    "    bBBb    ",
    "   bb  bb   ",
])

LANTERN_B = from_rows([
    "     bb     ",
    "     nn     ",
    "    kbbk    ",
    "   kBNNBk   ",
    "   bNUuNb   ",
    "   bNt*tNb  ",
    "   bNuUuNb  ",
    "   bNtsNNb  ",
    "   kBuUBk   ",
    "    knnk    ",
    "    bBBb    ",
    "   bb  bb   ",
])

DIYA = from_rows([
    "    u     ",
    "   u*u    ",
    "   tst    ",
    " kCCCCCCk ",
    "kCaaaaaaCk",
    " kaAAAAAak",
    "  kWWWWWWk",
])

DIYA_B = from_rows([
    "   u*u    ",
    "    u     ",
    "   tst    ",
    " kCCCCCCk ",
    "kCaaaaaaCk",
    " kaAAAAAak",
    "  kWWWWWWk",
])

PEBBLE = from_rows([
    "  kllk   ",
    " klLLLlk ",
    "klLLrrrrk",
    " krrrrrrk",
    "  kkkkkk ",
])

PIGEON = from_rows([
    "    kkk      ",
    "   kLLLk     ",
    "  kLLpLLk  k ",
    " kLL*rLLk ky ",
    " kLLLLLLk k  ",
    "kLLLrrLLLk   ",
    " kkkkkkkk    ",
    "  K    K     ",
])

PIGEON_B = from_rows([
    "   kkk       ",
    "  kLLLk      ",
    " kLLpLLk     ",
    "kLL*rLLkk yk ",
    "kLLLLLLk  k  ",
    " kLLrrLLk    ",
    "  kkkkkk     ",
    "   K  K      ",
])

STEAM = [
    from_rows([
        "  F   ",
        " F f  ",
        "  f   ",
        "      ",
        "   F  ",
        "  f   ",
    ]),
    from_rows([
        " F    ",
        "  fF  ",
        "      ",
        "    F ",
        "   f  ",
        "      ",
    ]),
    from_rows([
        "   F  ",
        "  f   ",
        "      ",
        " F    ",
        "  f F ",
        "   f  ",
    ]),
]


def _cloth(colors: tuple, phase: int) -> Image.Image:
    rows = [
        "kkkkkkkkkkkkkkkkkk",
        "oWWWWWWWWWWWWWWWWo",
        "kfffffffffffffk",
        "kffFeeeeffffFfk",
        "kfFeeeeeffffFefk",
        "kffFeeeeffffFfk",
        "kfFeeeddefffFefk",
        "kffFeeeeffffFfk",
        "kfFeeeeeffffFefk",
        "kffFeeeeffffFfk",
        "kfFeeeeeffffFefk",
        "kffFeeeeffffFfk",
        "kfFeeeddefffFefk",
        "kffFeeeeffffFfk",
        "kfFeeeeeffffFefk",
        "kffFeeeeffffFfk",
        "kddddddddddddddk",
        " kddddddddddddk ",
        "  kkkkkkkkkkkk  ",
    ]
    # Recolour the cloth letters into the garment ramp via a stand-in, then
    # the caller passes palette colours by swapping F/e/d before blit.
    im = blank(18, 20)
    px = im.load()
    deep, mid, lit = colors
    for y, row in enumerate(rows):
        shift = phase if y > 8 else 0
        for x, ch in enumerate(row):
            if ch in " .":
                continue
            c = {"k": K, "o": O, "W": WH, "f": mid, "F": lit, "e": mid, "d": deep}[ch]
            xx = x + (shift if y > 12 else 0)
            if 0 <= xx < 18:
                px[xx, y] = c
    return im


def trunk() -> Image.Image:
    im = blank(34, 26)
    px = im.load()
    for y in range(6, 24):
        for x in range(2, 32):
            plank = (y // 4) % 2
            if x < 4 or x > 29 or y in (6, 23):
                c = W
            elif y % 4 == 0:
                c = O
            elif x < 10:
                c = WH if plank == 0 else OL
            else:
                c = OL if plank == 0 else O
            px[x, y] = c
    # Lid plane, lit because we see the top.
    for y in range(2, 7):
        for x in range(4, 30):
            px[x, y] = WH if y < 4 else OL if y < 6 else W
    # Brass corners and a lock.
    for cx, cy in ((3, 3), (27, 3), (3, 19), (27, 19)):
        for dy in range(4):
            for dx in range(4):
                px[cx + dx, cy + dy] = BH if dx + dy < 2 else BD if dx == 3 or dy == 3 else BL
    for y in range(10, 16):
        px[15, y] = BR
        px[16, y] = BD
        px[17, y] = BH
        px[18, y] = BR
    px[16, 12] = SP
    px[17, 12] = BH
    # Straps.
    for x in range(4, 30):
        px[x, 9] = BR
        px[x, 15] = BD
    return im


def bench() -> Image.Image:
    im = blank(64, 28)
    px = im.load()
    for y in range(6, 12):
        for x in range(2, 62):
            if y == 6:
                c = WH
            elif y == 11:
                c = W
            elif (x + y) % 9 == 0:
                c = O
            else:
                c = OL
            px[x, y] = c
    for x in (6, 54):
        for y in range(12, 26):
            px[x, y] = W
            px[x + 1, y] = O
            px[x + 2, y] = OL
        px[x, 25] = K
        px[x + 2, 25] = K
    # A second stretcher so it isn't a floating plank.
    for x in range(8, 56):
        px[x, 18] = O
        px[x, 19] = W
    return im


def pillar() -> Image.Image:
    im = blank(22, 52)
    blit(im, [
        "  kkkkkkkkkkkkkkk  ",
        " k88888888888888k ",
        "k8777777777777777k",
        "k8666666666666666k",
        " kkkkkkkkkkkkkkkkk ",
        "   k8888888888k   ",
        "   k877777777k    ",
        "   k76666666k     ",
    ], 0, 0)
    px = im.load()
    for y in range(8, 44):
        for x in range(6, 16):
            if x <= 7:
                c = S8
            elif x == 8:
                c = S7
            elif x >= 14:
                c = S5
            elif x == 13:
                c = S6
            else:
                c = S7
            px[x, y] = c
        # Flute shadow.
        px[10, y] = S6
    for y, row in enumerate([
        " kkkkkkkkkkkkkkk ",
        "k888888888888888k",
        "k777777777777777k",
        "k666666666666666k",
        "k555555555555555k",
        " kkkkkkkkkkkkkkk ",
    ]):
        for x, ch in enumerate(row):
            if ch in " .":
                continue
            px[3 + x, 44 + y] = KEY[ch]
    return im


def door() -> Image.Image:
    im = blank(24, 46)
    px = im.load()
    # Pointed arch crown.
    for x in range(4, 20):
        rise = max(0, 8 - abs(x - 12))
        for t in range(3):
            px[x, 6 - rise // 2 + t] = S8 if t == 0 else S6
    for y in range(8, 44):
        for x in range(3, 21):
            if x in (3, 4, 19, 20) or y > 41:
                c = W
            elif y % 10 == 0:
                c = O
            elif x < 8:
                c = WH
            elif x > 16:
                c = O
            else:
                c = OL
            px[x, y] = c
        px[11, y] = W
        px[12, y] = O
    # Studs.
    for y in (14, 22, 30, 38):
        for x in (7, 16):
            px[x, y] = BH
            px[x + 1, y] = BD
            px[x, y + 1] = BR
    # Ring handle.
    px[15, 24] = BL
    px[16, 24] = SP
    px[17, 25] = BD
    px[16, 26] = BR
    return im


def press() -> Image.Image:
    im = blank(40, 48)
    px = im.load()
    for y in range(12, 46):
        for x in (3, 4, 34, 35):
            px[x, y] = W if x in (3, 34) else O
    for x in range(3, 37):
        px[x, 12] = WH
        px[x, 13] = OL
        px[x, 44] = O
        px[x, 45] = W
    # Screw and platen.
    for x in range(14, 26):
        px[x, 4] = L
        px[x, 5] = LH
    for y in range(6, 18):
        px[19, y] = R
        px[20, y] = LH
    px[18, 3] = LH
    px[19, 2] = L
    px[20, 2] = LH
    px[21, 3] = R
    for y in range(18, 23):
        for x in range(10, 30):
            px[x, y] = R if y in (18, 22) or x in (10, 29) else L
            if y == 19 and 12 < x < 22:
                px[x, y] = LH
    # Sheet of paper with a red line of type.
    for y in range(26, 40):
        for x in range(8, 32):
            px[x, y] = FW if x < 28 else F
    for x in range(11, 28, 3):
        px[x, 30] = Y
        px[x + 1, 30] = X
        px[x, 33] = D
        px[x + 1, 36] = E
    return im


def bars() -> Image.Image:
    im = blank(28, 36)
    px = im.load()
    for x in range(2, 26):
        px[x, 2] = P
        px[x, 3] = L
        px[x, 4] = LH
        px[x, 30] = P
        px[x, 31] = R
        px[x, 32] = L
    for bx in (4, 10, 16, 22):
        for y in range(2, 34):
            px[bx, y] = P
            px[bx + 1, y] = R
            px[bx + 2, y] = LH if y % 6 < 2 else L
    return im


def plate(floor: Image.Image) -> Image.Image:
    im = floor.copy()
    px = im.load()
    for y in range(4, 28):
        for x in range(4, 28):
            rim = x in (4, 5, 26, 27) or y in (4, 5, 26, 27)
            if rim:
                px[x, y] = LH if x < 8 or y < 8 else P if x > 23 or y > 23 else R
            else:
                px[x, y] = P if (x + y) % 7 else R
    # Saffron mark: a small hand-drawn chakra, not a diamond.
    blit(im, [
        "  uuu  ",
        " u   u ",
        "u  *  u",
        " u   u ",
        "  uuu  ",
    ], 12, 13)
    return im


def rune() -> Image.Image:
    return from_rows([
        "   uu   ",
        "  u  u  ",
        " u ** u ",
        "u  tt  u",
        " u    u ",
        "  u  u  ",
        "   uu   ",
    ])


def shadow() -> Image.Image:
    im = blank(40, 14)
    px = im.load()
    for y in range(14):
        for x in range(40):
            nx = (x - 20) / 16
            ny = (y - 7) / 5
            d = nx * nx + ny * ny
            if d > 1:
                continue
            if d < 0.25 or (d < 0.6 and (x + y) % 2 == 0) or (d <= 1 and (x * 2 + y) % 5 == 0):
                a = 150 if d < 0.3 else 90
                px[x, y] = (48, 32, 42, a)
    return im


def glow() -> Image.Image:
    im = blank(72, 48)
    px = im.load()
    for y in range(48):
        for x in range(72):
            nx = (x - 36) / 30
            ny = (y - 20) / 16
            d = nx * nx + ny * ny
            if d > 1:
                continue
            if d < 0.15 or (d < 0.45 and (x + y) % 2 == 0) or (d < 0.8 and (x + 2 * y) % 4 == 0):
                a = 70 if d < 0.2 else 40 if d < 0.5 else 22
                px[x, y] = (232, 140, 60, a)
    return im


def mote() -> Image.Image:
    return from_rows([
        " F ",
        "F*F",
        " F ",
    ])


def bicycle() -> Image.Image:
    im = blank(48, 58)
    px = im.load()
    w, h = 48, 58

    def ring(cx, cy, r, col, thick=1.3):
        for y in range(cy - r - 1, cy + r + 2):
            for x in range(cx - r - 1, cx + r + 2):
                d2 = (x - cx) ** 2 + (y - cy) ** 2
                if (r - thick) ** 2 <= d2 <= (r + 0.4) ** 2:
                    # Lit arc on the upper left of the tire.
                    c = LH if (x < cx and y < cy and d2 > (r - 0.6) ** 2) else col
                    put(px, x, y, c, w, h)

    def spoke(cx, cy, r):
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0), (-1, -1), (1, 1), (1, -1), (-1, 1)):
            for t in range(2, r - 1):
                put(px, cx + dx * t, cy + dy * (t if abs(dx) != abs(dy) else t), L, w, h)

    def wheel(cx, cy):
        ring(cx, cy, 11, P, 2.2)
        ring(cx, cy, 8, R, 1.0)
        spoke(cx, cy, 8)
        ring(cx, cy, 2, BD, 1.6)
        put(px, cx - 1, cy - 1, SP, w, h)

    wheel(14, 42)
    wheel(34, 24)
    # Frame, two pixels, highlight on the upper edge.
    def line(x0, y0, x1, y1):
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(steps + 1):
            x = round(x0 + (x1 - x0) * i / steps)
            y = round(y0 + (y1 - y0) * i / steps)
            put(px, x, y, R, w, h)
            put(px, x, y - 1, LH, w, h)

    line(14, 42, 34, 24)
    line(14, 42, 24, 30)
    line(24, 30, 34, 24)
    line(24, 30, 22, 22)
    # Leather saddle.
    for x in range(18, 28):
        put(px, x, 21, X, w, h)
        put(px, x, 22, Y if x < 22 else X, w, h)
        put(px, x, 23, W, w, h)
    put(px, 20, 21, Z, w, h)
    # Fork, bars, grip.
    line(34, 24, 40, 14)
    for x in range(36, 46):
        put(px, x, 13, O, w, h)
        put(px, x, 14, OL, w, h)
    put(px, 38, 16, BD, w, h)
    put(px, 39, 16, SP, w, h)
    # Pedal.
    put(px, 20, 36, BD, w, h)
    put(px, 21, 36, BH, w, h)
    put(px, 22, 36, BD, w, h)
    return im


def thela() -> Image.Image:
    im = blank(78, 48)
    px = im.load()
    w, h = 78, 48

    def wheel(cx, cy):
        for y in range(cy - 12, cy + 13):
            for x in range(cx - 12, cx + 13):
                d2 = (x - cx) ** 2 + (y - cy) ** 2
                if 100 <= d2 <= 144:
                    put(px, x, y, P if d2 > 121 else R, w, h)
                elif d2 < 16:
                    put(px, x, y, BD if d2 > 4 else SP, w, h)
                elif d2 < 100 and (abs(x - cx) < 1 or abs(y - cy) < 1 or abs(abs(x - cx) - abs(y - cy)) < 1):
                    put(px, x, y, L, w, h)

    wheel(18, 32)
    wheel(58, 32)
    # Bed.
    for y in range(20, 30):
        for x in range(12, 66):
            if y == 20:
                c = WH
            elif y > 27:
                c = W
            elif x % 8 == 0:
                c = O
            else:
                c = OL
            put(px, x, y, c, w, h)
    # Handle.
    for x in range(2, 16):
        put(px, x, 22, O, w, h)
        put(px, x, 23, W, w, h)
    put(px, 2, 18, OL, w, h)
    put(px, 2, 19, WH, w, h)
    put(px, 3, 18, O, w, h)
    # Produce. Each pile is a small drawn cluster.
    piles = [
        (22, 16, [(0, 0, Y), (-2, 1, X), (2, 1, Z), (0, 2, Y), (-1, 1, Y)]),  # tomatoes
        (36, 14, [(0, 0, KZ), (2, 1, KX), (-2, 1, KK), (1, 2, KZ), (3, 0, KZ), (-1, -1, KZ)]),  # bananas / mango
        (50, 15, [(0, 0, GL), (-2, 1, GD), (2, 0, GH), (0, 2, G), (3, 2, GD), (-1, -1, GL)]),
    ]
    for cx, cy, pts in piles:
        for dx, dy, c in pts:
            put(px, cx + dx, cy + dy, c, w, h)
            put(px, cx + dx + 1, cy + dy, c, w, h)
    return im


def well() -> Image.Image:
    im = blank(64, 58)
    px = im.load()
    w, h = 64, 58
    # Stone ring as blocks along an oval, each block its own shade.
    for y in range(18, 52):
        for x in range(4, 60):
            nx = (x - 32) / 26
            ny = (y - 34) / 16
            d = nx * nx + ny * ny
            if 0.72 <= d <= 1.05:
                block = (x // 7 + y // 6) % 3
                c = (S8, S7, S6)[block]
                if x < 28 and y < 32:
                    c = S8
                if x > 40 and y > 36:
                    c = S5
                put(px, x, y, c, w, h)
            elif d < 0.55:
                put(px, x, y, WT, w, h)
                if d < 0.2 and x < 30 and y < 32 and (x + y) % 3 == 0:
                    put(px, x, y, (58, 78, 86, 255), w, h)
    # Highlight flecks on the water.
    put(px, 26, 30, LH, w, h)
    put(px, 27, 31, L, w, h)
    # Beam and rope.
    for x in range(14, 50):
        put(px, x, 10, OL, w, h)
        put(px, x, 11, WH if x < 30 else O, w, h)
        put(px, x, 12, W, w, h)
    for y in range(12, 30):
        put(px, 30, y, O, w, h)
        put(px, 31, y, W, w, h)
    # Bucket.
    for y in range(28, 36):
        for x in range(34, 42):
            put(px, x, y, OL if x < 37 else O, w, h)
    put(px, 36, 28, WH, w, h)
    return im


def charpoy() -> Image.Image:
    im = blank(68, 36)
    px = im.load()
    for y in range(8, 26):
        for x in range(6, 62):
            edge = x < 9 or x > 58 or y < 11 or y > 22
            if edge:
                c = WH if x < 20 and y < 14 else O if y < 12 else W
            else:
                # Woven tape, two close colours, a real over-under.
                c = F if (x // 2 + y // 2) % 2 == 0 else E
            px[x, y] = c
    for lx in (8, 56):
        for y in range(22, 34):
            px[lx, y] = W
            px[lx + 1, y] = O
            px[lx + 2, y] = OL
        px[lx + 1, 33] = K
    for lx in (12, 52):
        for y in range(6, 12):
            px[lx, y] = O
            px[lx + 1, y] = OL
    # Folded cloth at the head.
    for y in range(12, 20):
        for x in range(14, 28):
            px[x, y] = SL if y < 15 else SF if (x + y) % 3 else SA
    return im


def jharokha() -> Image.Image:
    im = blank(92, 68)
    px = im.load()
    w, h = 92, 68
    # Cusped arch with vertical jambs. The point is only the crown.
    cusp = [14, 14, 15, 16, 18, 20, 24, 28, 34, 40]
    for x in range(10, 82):
        dx = abs(x - 46)
        top = cusp[min(dx // 4, len(cusp) - 1)]
        for y in range(2, 46):
            if y < top - 1:
                c = S8 if (y < 7 and x < 42) else S7 if x < 50 else S6
                put(px, x, y, c, w, h)
            elif y == top - 1:
                put(px, x, y, S8, w, h)
            else:
                # 1px stone bars on a 5px grid. The rest is the dark room.
                if x % 5 == 0 or y % 5 == 0:
                    put(px, x, y, S8 if x < 36 else S7 if x < 52 else S6, w, h)
                else:
                    put(px, x, y, Q, w, h)
    # Frame.
    for x in range(4, 88):
        put(px, x, 4, S8, w, h)
        put(px, x, 3, S6, w, h)
    for y in range(6, 46):
        put(px, 5, y, S8, w, h)
        put(px, 6, y, S7, w, h)
        put(px, 85, y, S5, w, h)
        put(px, 84, y, S6, w, h)
    # Rail and balusters.
    for y in range(46, 56):
        for x in range(2, 90):
            c = S8 if y == 46 else S5 if y >= 54 else S7 if x < 40 else S6
            put(px, x, y, c, w, h)
    for x in range(8, 86, 6):
        put(px, x, 48, S5, w, h)
        put(px, x, 49, Q, w, h)
        put(px, x, 50, S5, w, h)
    # Brackets, three corbels.
    for bx in (12, 42, 70):
        for i, ww in enumerate((14, 12, 10, 8, 6)):
            y = 56 + i
            for x in range(bx, bx + ww):
                put(px, x, y, S8 if i == 0 else S6 if i > 2 else S7, w, h)
            put(px, bx + ww - 1, y, S5, w, h)
    return im


def shopfront() -> Image.Image:
    im = blank(48, 44)
    px = im.load()
    # Lintel.
    for y in range(2, 8):
        for x in range(2, 46):
            px[x, y] = S8 if y < 4 else S7 if y < 6 else S5
    for x in range(6, 42, 8):
        px[x, 6] = S8
        px[x + 1, 6] = Q
    # Shutters.
    for y in range(8, 40):
        for x in range(4, 44):
            if x in (4, 5, 23, 24, 42, 43) or y in (8, 39):
                c = W
            elif y in (22, 23):
                c = O
            elif x < 24:
                c = WH if x < 10 else OL
            else:
                c = OL if x < 34 else O
            px[x, y] = c
    # Panel insets.
    for x0 in (8, 28):
        for y0 in (12, 26):
            for y in range(y0, y0 + 8):
                for x in range(x0, x0 + 12):
                    px[x, y] = O if x in (x0, x0 + 11) or y in (y0, y0 + 7) else WH if x < x0 + 4 else OL
    px[22, 24] = BH
    px[23, 24] = SP
    px[22, 25] = BR
    return im


def jaali() -> Image.Image:
    im = blank(36, 44)
    px = im.load()
    for y in range(44):
        for x in range(36):
            border = x < 3 or y < 3 or x > 32 or y > 40
            if border:
                px[x, y] = S8 if x < 8 or y < 6 else S6 if x < 30 else S5
            elif x % 5 == 0 or y % 5 == 0:
                px[x, y] = S8 if x < 14 else S7 if x < 24 else S6
            else:
                px[x, y] = Q
    return im


def notice() -> Image.Image:
    im = blank(72, 56)
    px = im.load()
    for y in range(1, 54):
        for x in range(1, 70):
            if x > 60 and y < 8 and x + y > 66:
                continue
            px[x, y] = F
    # A few age specks, and the curl of the top-right corner.
    for x, y in ((12, 40), (40, 48), (58, 20), (22, 46)):
        px[x, y] = E
    for y in range(1, 9):
        for x in range(58, 70):
            if 64 < x + y < 70:
                px[x, y] = D
            elif x + y >= 70 and x < 68 and y < 8:
                px[x, y] = Q
    _text(im, "BY ORDER", 8, 8, K, 1)
    _text(im, "OF THE", 14, 16, K, 1)
    _text(im, "GOVERNOR", 6, 24, K, 1)
    _text(im, "CURFEW", 8, 36, Y, 2)
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            if dx * dx + dy * dy <= 8:
                px[62 + dx, 44 + dy] = Y if dx < 1 else X
    px[61, 43] = Z
    return im


def poster() -> Image.Image:
    im = blank(40, 52)
    px = im.load()
    for y in range(2, 50):
        for x in range(2, 38):
            if x > 28 and y < 12 and x + y > 38:
                continue
            if y < 18:
                c = SL if x < 10 else SF
            elif y < 34:
                c = FW if x < 14 else F
            else:
                c = GL if x < 12 else GD
            # Wear.
            if (x * 3 + y) % 17 == 0:
                c = E
            px[x, y] = c
    # Curled corner, back of the sheet.
    for y in range(2, 14):
        for x in range(26, 40):
            if 36 < x + y < 44:
                px[x, y] = D
            elif x + y >= 44 and x < 38 and y < 12:
                px[x, y] = Q
    # Tiger, original silhouette, stripes in the saffron band's neighbour.
    tiger = [
        "..kkkk......",
        ".ktttukk....",
        "ktktttttuk..",
        "kttttttttuk.",
        ".kttktttukk.",
        "..ukkk.kk.k.",
        "...k..k..k..",
        "....k...k...",
    ]
    for y, row in enumerate(tiger):
        for x, ch in enumerate(row):
            if ch == ".":
                continue
            px[8 + x, 20 + y] = {"k": K, "t": SF, "u": SL}[ch]
    _text(im, "AZAD", 8, 6, K, 1)
    _text(im, "HIND", 8, 40, FW, 1)
    return im


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
    "W": ["10101", "10101", "10101", "10101", "01010"],
    "Y": ["101", "101", "010", "010", "010"],
    "Z": ["111", "001", "010", "100", "111"],
}


def _text(im: Image.Image, text: str, x: int, y: int, color, scale: int = 1) -> None:
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


def stall() -> Image.Image:
    im = blank(172, 82)
    px = im.load()
    w, h = 172, 82
    # Sag of the awning, one step per stripe. Authored, not a curve.
    sag = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0]
    for x in range(4, 168):
        stripe = (x // 8) % 2
        col = x % 8
        drop = sag[min(len(sag) - 1, x // 8)]
        deep, mid, lit = (SA, SF, SL) if stripe == 0 else (D, F, FW)
        hem = 16 + drop + (2 if 2 <= col <= 5 else 0)
        for y in range(4, hem):
            if col < 2:
                c = lit
            elif col > 5:
                c = deep
            else:
                c = mid
            if y < 6:
                c = lit
            if y > hem - 3:
                c = deep
            put(px, x, y, c, w, h)
        put(px, x, hem, Q, w, h)
    for x in range(172):
        put(px, x, 2, W, w, h)
        put(px, x, 3, OL, w, h)
    # Posts.
    for x0 in (8, 160):
        for y in range(10, 78):
            put(px, x0, y, WH if y % 8 < 2 else OL, w, h)
            put(px, x0 + 1, y, O, w, h)
            put(px, x0 + 2, y, W, w, h)
    # Counter: top plane, then a front with three planks.
    for y in range(48, 78):
        for x in range(16, 156):
            if y < 53:
                c = WH if x < 70 else OL
            elif y in (53, 62, 70, 77):
                c = W
            elif x < 40:
                c = WH
            else:
                c = OL if ((y // 8) + (x // 14)) % 2 == 0 else O
            put(px, x, y, c, w, h)
    # Grain nicks.
    for x in (30, 48, 70, 96, 120, 140):
        put(px, x, 58, W, w, h)
        put(px, x + 1, 66, O, w, h)
    # Brass brackets.
    for cx, cy in ((18, 50), (146, 50), (18, 70), (146, 70)):
        for dy in range(5):
            for dx in range(5):
                put(px, cx + dx, cy + dy, BH if dx + dy < 2 else BD, w, h)
    # Clay chulha: a low stove with a mouth, coals in the mouth, pot-rests.
    for y in range(36, 52):
        for x in range(34, 74):
            rim = y < 39 or x < 37 or x > 70
            put(px, x, y, AH if rim and x < 50 else A if rim else C, w, h)
    for y in range(42, 50):
        for x in range(42, 66):
            put(px, x, y, SA, w, h)
    for x, y, c in (
        (46, 43, SL), (48, 44, SP), (50, 43, SF), (53, 45, Y),
        (56, 43, SP), (58, 44, SL), (61, 45, SF), (47, 47, X), (55, 47, SA),
    ):
        put(px, x, y, c, w, h)
    paste(im, KETTLE, (42, 18))
    paste(im, KULHAD, (82, 40))
    paste(im, KULHAD, (98, 40))
    paste(im, KULHAD, (114, 40))
    # Chai surface in the middle cup: a lighter ellipse of two pixels.
    put(px, 102, 42, SPALE, w, h)
    put(px, 103, 42, SL, w, h)
    # Stack of spare cups.
    paste(im, KULHAD, (132, 38))
    paste(im, KULHAD, (134, 34))
    return im


def kolam(px, cx: int, cy: int, mw: int, mh: int) -> None:
    """A pulli kolam: rice-flour loops around a grid of dots, lotus at the centre."""
    rows = [
        ".............F.............",
        "............FFF............",
        "..F.....................F..",
        ".F.F...................F.F.",
        "F...F........uuu......F...F",
        ".F.F.......uF...Fu.....F.F.",
        "..F.......u..F.F..u.....F..",
        ".........u....F....u.......",
        "........u...uuuuu...u......",
        "...FFFFFu..u..j..u..uFFFFF.",
        "........u.u...jjj...u.u....",
        ".......u.u....j.j....u.u...",
        "......u..u...j...j...u..u..",
        ".......u.u....j.j....u.u...",
        "........u.u...jjj...u.u....",
        "...FFFFFu..u..j..u..uFFFFF.",
        "........u...uuuuu...u......",
        ".........u....F....u.......",
        "..F.......u..F.F..u.....F..",
        ".F.F.......uF...Fu.....F.F.",
        "F...F........uuu......F...F",
        ".F.F...................F.F.",
        "..F.....................F..",
        "............FFF............",
        ".............F.............",
    ]
    blit_at = from_rows(rows)
    paste_px = blit_at.load()
    ox, oy = cx - blit_at.width // 2, cy - blit_at.height // 2
    for y in range(blit_at.height):
        for x in range(blit_at.width):
            c = paste_px[x, y]
            if c[3]:
                put(px, ox + x, oy + y, c, mw, mh)


def dhurrie(px, x0: int, y0: int, w: int, h: int, mw: int, mh: int) -> None:
    motif = [
        (0, 0, Y), (1, 0, SF), (-1, 0, SF),
        (0, -1, SL), (0, 1, SA),
        (2, 0, F), (-2, 0, F),
    ]
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            border = x < x0 + 2 or x >= x0 + w - 2 or y < y0 + 2 or y >= y0 + h - 2
            if border:
                c = X if (x + y) % 2 == 0 else Y
            else:
                band = ((y - y0) // 4) % 2 == 0
                c = SA if band else F
            put(px, x, y, c, mw, mh)
    # Fringe.
    for x in range(x0 + 2, x0 + w - 2, 2):
        put(px, x, y0 + h, E, mw, mh)
        put(px, x, y0 - 1, E, mw, mh)
    # Field motifs.
    for mx in range(x0 + 8, x0 + w - 8, 10):
        my = y0 + h // 2
        for dx, dy, c in motif:
            put(px, mx + dx, my + dy, c, mw, mh)


def paint_map(rows: list[str]) -> Image.Image:
    tile = 32
    mw, mh = len(rows[0]), len(rows)
    world = Image.new("RGBA", (mw * tile, mh * tile), S5)
    floorish = set(".@+=LSgKWPC&")

    def ch(x: int, y: int) -> str:
        if x < 0 or y < 0 or x >= mw or y >= mh:
            return "#"
        return rows[y][x]

    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            if cell == "T" or cell in "gK" or x >= 34 and cell in floorish:
                world.paste(plank_tile((x + y) % 4), (x * tile, y * tile))
            elif cell in floorish:
                world.paste(floor_tile((x + y) % 4, crack=(x, y) in {(5, 7), (11, 9), (18, 6), (27, 10)}), (x * tile, y * tile))
            else:
                south = ch(x, y + 1) in floorish
                north = ch(x, y - 1) in floorish
                if y == 0 or (north and not south):
                    im = brick_cap((x + y) % 8)
                elif south:
                    im = brick_plinth((x * 2 + y) % 8)
                else:
                    im = brick_face((x + 3 * y) % 8)
                if ch(x + 1, y) in floorish:
                    im = side_quoin(im, "e")
                elif ch(x - 1, y) in floorish:
                    im = side_quoin(im, "w")
                world.paste(im, (x * tile, y * tile))

    wp = world.load()
    # Contact shadow where a wall meets the court. A short solid band, cool.
    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            if cell not in floorish or ch(x, y - 1) in floorish:
                continue
            for yy in range(4):
                for xx in range(tile):
                    px_x, px_y = x * tile + xx, y * tile + yy
                    r, g, b, a = wp[px_x, px_y]
                    shift = 36 - yy * 8
                    wp[px_x, px_y] = nearest((max(0, r - shift), max(0, g - shift + 6), max(0, b - 4))) + (a,)

    def arch(tx: int, ty: int, blind: bool) -> None:
        left, top = tx * tile, ty * tile
        # Jambs.
        for y in range(top - 18, top + tile):
            for t in range(6):
                c = S8 if t > 3 else S7 if t else S6
                put(wp, left + t, y, c, world.width, world.height)
                put(wp, left + 31 - t, y, S5 if t == 0 else S6, world.width, world.height)
        # Voussoirs across a pointed arch.
        for x in range(left + 6, left + 26):
            ad = abs(x - (left + 16))
            rise = [18, 17, 16, 14, 12, 10, 8, 6, 5, 4][min(9, ad)]
            for t in range(5):
                c = S8 if t == 0 else S5 if t == 4 else S7 if (x // 3) % 2 == 0 else S6
                put(wp, x, top - rise + t, c, world.width, world.height)
            if blind:
                for y in range(top - rise + 5, top + 26):
                    put(wp, x, y, Q if (x + y) % 5 == 0 else B1, world.width, world.height)

    arch(33, 5, False)
    arch(33, 9, False)
    for tx in (6, 19, 30):
        arch(tx, 3, True)

    paste(world, jharokha(), (2 * tile, 2 * tile - 6))
    paste(world, jharokha(), (28 * tile - 8, 2 * tile - 6))
    paste(world, jaali(), (22 * tile - 2, 2 * tile + 6))
    paste(world, notice(), (7 * tile, 2 * tile + 2))
    paste(world, notice(), (38 * tile, 8 * tile + 4))
    paste(world, poster(), (16 * tile - 4, 2 * tile + 4))
    paste(world, shopfront(), (26 * tile - 8, 2 * tile + 4))
    paste(world, shopfront(), (31 * tile - 6, 2 * tile + 4))

    # Plaster behind the graffiti so the words sit on a wall, not on raw brick.
    for y in range(3 * tile + 4, 3 * tile + 22):
        for x in range(12 * tile, 12 * tile + 78):
            if (x + y) % 9 == 0:
                wp[x, y] = S6
            else:
                wp[x, y] = S7 if x < 12 * tile + 50 else S6
    _text(world, "CHALO DILLI", 12 * tile + 4, 3 * tile + 8, X, 2)

    kolam(wp, 6 * tile + 16, 6 * tile + 12, world.width, world.height)
    kolam(wp, 12 * tile + 16, 7 * tile + 18, world.width, world.height)
    dhurrie(wp, 4 * tile + 8, 8 * tile + 8, 72, 26, world.width, world.height)
    dhurrie(wp, 28 * tile + 4, 7 * tile + 10, 52, 24, world.width, world.height)

    # North room: a rug and two curled letters. South room stays plank and prop.
    dhurrie(wp, 35 * tile + 2, 4 * tile + 16, 40, 22, world.width, world.height)
    for i, x0 in enumerate((36 * tile + 4, 37 * tile)):
        for y in range(5 * tile + 6, 5 * tile + 18):
            for x in range(x0, x0 + 12):
                wp[x, y] = FW if (y + i) % 5 else F
        wp[x0 + 10, 5 * tile + 6] = D  # curl
        wp[x0 + 2, 5 * tile + 10] = Y

    # Plate replaces the flagstone it sits on.
    floor = floor_tile(0)
    world.paste(plate(floor), (22 * tile, 8 * tile))

    # A few tufts, placed by hand so the joints stay quiet.
    for tx, ty in ((4, 11), (15, 6), (24, 9), (30, 11)):
        gx, gy = tx * tile + 18, ty * tile + 14
        for dx, dy, c in ((0, 0, GD), (1, -1, GL), (1, 0, G), (2, -2, GH), (-1, 0, GD)):
            put(wp, gx + dx, gy + dy, c, world.width, world.height)
    return world


def _light(world: Image.Image, rows: list[str]) -> None:
    px = world.load()
    pools = [
        (6 * 32 + 16, 3 * 32 + 4, 34),
        (19 * 32 + 16, 3 * 32 + 4, 34),
        (22 * 32 + 16, 3 * 32 + 4, 30),
        (30 * 32 + 16, 3 * 32 + 4, 34),
        (8 * 32 + 16, 4 * 32 + 18, 26),
        (27 * 32 + 16, 4 * 32 + 18, 26),
        (36 * 32 + 16, 4 * 32 + 18, 26),
        (36 * 32 + 16, 9 * 32 + 16, 24),
        (11 * 32 + 16, 2 * 32 + 20, 22),  # bell, a small warm pool
    ]
    warm = (232, 150, 70)
    for cx, cy, rad in pools:
        for y in range(cy - rad, cy + rad):
            for x in range(cx - rad, cx + rad):
                if not (0 <= x < world.width and 0 <= y < world.height):
                    continue
                d = ((x - cx) / rad) ** 2 + ((y - cy) / (rad * 0.7)) ** 2
                if d > 1:
                    continue
                gate = 0.85 if d < 0.25 else 0.45 if d < 0.55 else 0.2
                if (x + y * 2) % 3 == 0:
                    gate *= 0.5
                if gate < 0.2 and (x + y) % 2:
                    continue
                r, g, b, a = px[x, y]
                if a < 200:
                    continue
                t = 0.22 if d < 0.3 else 0.12 if d < 0.6 else 0.06
                mixed = (
                    int(r * (1 - t) + warm[0] * t),
                    int(g * (1 - t) + warm[1] * t),
                    int(b * (1 - t) + warm[2] * t),
                )
                px[x, y] = nearest(mixed) + (255,)


def save_props(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    MATKA.save(out / "matka.png")
    SACK.save(out / "sack.png")
    TULSI.save(out / "tulsi.png")
    KETTLE.save(out / "kettle.png")
    KULHAD.save(out / "kulhad.png")
    BELL.save(out / "bell.png")
    LANTERN.save(out / "lantern.png")
    LANTERN_B.save(out / "lantern-b.png")
    DIYA.save(out / "diya.png")
    DIYA_B.save(out / "diya-b.png")
    PEBBLE.save(out / "pebble.png")
    PIGEON.save(out / "pigeon.png")
    PIGEON_B.save(out / "pigeon-b.png")
    for i, fr in enumerate(STEAM):
        fr.save(out / f"steam{i}.png")
    _cloth((D, F, FW), 0).save(out / "laundry.png")
    _cloth((D, F, FW), 1).save(out / "laundry-b.png")
    _cloth((SA, SF, SL), 0).save(out / "laundry-s.png")
    _cloth((SA, SF, SL), 1).save(out / "laundry-s2.png")
    _cloth((G, GD, GL), 0).save(out / "laundry-g.png")
    _cloth((G, GD, GL), 1).save(out / "laundry-g2.png")
    trunk().save(out / "crate.png")
    bench().save(out / "bench.png")
    pillar().save(out / "pillar.png")
    door().save(out / "door.png")
    press().save(out / "press.png")
    bars().save(out / "grate.png")
    rune().save(out / "rune.png")
    shadow().save(out / "shadow.png")
    glow().save(out / "glow.png")
    mote().save(out / "mote.png")
    bicycle().save(out / "bicycle.png")
    thela().save(out / "tonga.png")
    well().save(out / "well.png")
    charpoy().save(out / "charpoy.png")
    jharokha().save(out / "jharokha.png")
    shopfront().save(out / "stall-front.png")  # shop is baked; this is for review
    jaali().save(out / "jaali.png")
    notice().save(out / "notice.png")
    poster().save(out / "poster.png")
    stall().save(out / "stall.png")
    floor_tile(0)
    plate(floor_tile(0)).save(out / "plate.png")


def _zoom(im: Image.Image, n: int) -> Image.Image:
    return im.resize((im.width * n, im.height * n), Image.NEAREST)


if __name__ == "__main__":
    dest = Path("/tmp/craft")
    dest.mkdir(exist_ok=True)
    save_props(dest)
    _zoom(stall(), 3).save(dest / "stall-x3.png")
    _zoom(MATKA, 6).save(dest / "matka-x6.png")
    _zoom(bicycle(), 4).save(dest / "bike-x4.png")
    _zoom(jharokha(), 3).save(dest / "jharokha-x3.png")
    sheet = Image.new("RGBA", (32 * 8, 32 * 2), (40, 28, 32, 255))
    for i in range(4):
        sheet.paste(floor_tile(i), (i * 32, 0))
    sheet.paste(brick_cap(0), (0, 32))
    sheet.paste(brick_face(1), (32, 32))
    sheet.paste(brick_face(2), (64, 32))
    sheet.paste(brick_plinth(3), (96, 32))
    _zoom(sheet, 4).save(dest / "tiles-x4.png")
    print("preview", dest)
