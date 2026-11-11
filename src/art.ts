import { drawText, measure } from "./font";
import { CLEAR, INK } from "./palette";
import { Pix } from "./pix";

export const FRAME_W = 16;
export const FRAME_H = 24;
export const SHEET_COLS = 12;

export type Dir = "down" | "up" | "right";
export type Kind = "kite" | "veil" | "veil2" | "key" | "guard";
export type Facing = "down" | "up" | "left" | "right";

interface Look {
  hair: number;
  hairHi: number;
  skin: number;
  skinHi: number;
  skinSh: number;
  cloth: number;
  clothHi: number;
  clothSh: number;
  accent: number;
  accentSh: number;
  pants: number;
  pantsSh: number;
  boot: number;
  short: boolean;
  wide: boolean;
  hairLong: boolean;
  helm: boolean;
  scarf: boolean;
  pallu: boolean;
  keys: boolean;
  brow: boolean;
}

const LOOK: Record<Kind, Look> = {
  kite: {
    hair: 1, hairHi: 25, skin: 20, skinHi: 19, skinSh: 21,
    cloth: 3, clothHi: 5, clothSh: 2,
    accent: 17, accentSh: 16,
    pants: 9, pantsSh: 10, boot: 28,
    short: true, wide: false, hairLong: false, helm: false,
    scarf: true, pallu: false, keys: false, brow: false,
  },
  veil: {
    hair: 1, hairHi: 2, skin: 20, skinHi: 19, skinSh: 21,
    cloth: 16, clothHi: 18, clothSh: 1,
    accent: 18, accentSh: 16,
    pants: 9, pantsSh: 1, boot: 28,
    short: false, wide: false, hairLong: true, helm: false,
    scarf: false, pallu: true, keys: false, brow: false,
  },
  veil2: {
    hair: 1, hairHi: 2, skin: 20, skinHi: 19, skinSh: 21,
    cloth: 27, clothHi: 8, clothSh: 26,
    accent: 6, accentSh: 5,
    pants: 25, pantsSh: 26, boot: 28,
    short: false, wide: false, hairLong: true, helm: false,
    scarf: false, pallu: true, keys: false, brow: false,
  },
  key: {
    hair: 1, hairHi: 25, skin: 20, skinHi: 19, skinSh: 21,
    cloth: 10, clothHi: 11, clothSh: 9,
    accent: 13, accentSh: 12,
    pants: 25, pantsSh: 1, boot: 28,
    short: false, wide: true, hairLong: false, helm: false,
    scarf: false, pallu: false, keys: true, brow: true,
  },
  guard: {
    hair: 25, hairHi: 27, skin: 20, skinHi: 19, skinSh: 21,
    cloth: 26, clothHi: 27, clothSh: 25,
    accent: 13, accentSh: 12,
    pants: 2, pantsSh: 1, boot: 28,
    short: false, wide: false, hairLong: false, helm: true,
    scarf: false, pallu: false, keys: false, brow: true,
  },
};

function dye(ch: string, L: Look): number {
  switch (ch) {
    case "h": return L.hair;
    case "H": return L.hairHi;
    case "s": return L.skin;
    case "S": return L.skinHi;
    case "a": return L.skinSh;
    case "e": return INK;
    case "w": return 8;
    case "m": return L.skinSh;
    case "c": return L.cloth;
    case "C": return L.clothHi;
    case "d": return L.clothSh;
    case "r": return L.accent;
    case "R": return L.accentSh;
    case "p": return L.pants;
    case "q": return L.pantsSh;
    case "b": return L.boot;
    case "n": return 13;
    case "u": return 8;
    case "k": return 26;
    case "K": return 27;
    case "y": return 14;
    case "o": return INK;
    default: return CLEAR;
  }
}

const HEAD_D = [
  "..hhhhhh..",
  ".hhHHHHhh.",
  "hhsssssshh",
  "hssewsewsh",
  "hssssssssh",
  "hssaassssh",
  "hsssmssssh",
  ".hssssssh.",
  "..ssssss..",
];

const HEAD_U = [
  "..hhhhhh..",
  ".hhHHHHhh.",
  "hhHHHHHHhh",
  "hHHHhHHHHh",
  "hsHHHHHHsh",
  "hHHHHHHHHh",
  ".hhHHHHhh.",
  "..hhhhhh..",
  "...ssss...",
];

const HEAD_S = [
  "..hhhhh...",
  ".hhHHHh...",
  "hsssssh...",
  "hswessssh.",
  "hssssssh..",
  "hsaassh...",
  ".hssssh...",
  "..sss.....",
  "..........",
];

const TORSO = [
  ".rrrrrr.",
  "crrrrrrc",
  "dCccccCd",
  "dCccccCd",
  "dccccccd",
  ".cccccc.",
];

const TORSO_W = [
  "rrrrrrrr",
  "crrrrrrrc",
  "dCccccccCd",
  "dCccccccCd",
  "dcccccccd",
  ".ccccccc.",
];

const TORSO_S = [
  ".rrrrr.",
  "crrrrrc",
  "dCcccCd",
  "dCcccCd",
  ".ccccc.",
  "..ccc..",
];

const ARM = ["dd", "CC", "cc", "ss"];
const LEG = ["ppp", "ppp", "qqq", "bbb", "bbb"];

interface Pose {
  bob: number;
  breath: number;
  lX: number;
  lY: number;
  rX: number;
  rY: number;
  aLx: number;
  aLy: number;
  aRx: number;
  aRy: number;
  action: "none" | "throw" | "kneel" | "cloak" | "alert" | "sit" | "jab";
  af: number;
  stride: number;
}

function poseWalk(frame: number): Pose {
  const base = { action: "none" as const, af: 0, breath: 0 };
  // Contact frames drop the body 1px. The trailing foot stays up, so it reads as a 1px lift.
  // Pass frames pull the feet together. Arm swing is vertical so the shoulder stays attached.
  if (frame === 0) {
    return { ...base, bob: 1, lX: -1, lY: 0, rX: 2, rY: -1, aLx: 0, aLy: -1, aRx: 0, aRy: 1, stride: -1 };
  }
  if (frame === 1) {
    return { ...base, bob: 0, lX: 1, lY: 0, rX: -1, rY: -1, aLx: 0, aLy: 0, aRx: 0, aRy: 0, stride: 0 };
  }
  if (frame === 2) {
    return { ...base, bob: 1, lX: 2, lY: -1, rX: -1, rY: 0, aLx: 0, aLy: 1, aRx: 0, aRy: -1, stride: 1 };
  }
  return { ...base, bob: 0, lX: 1, lY: -1, rX: -1, rY: 0, aLx: 0, aLy: 0, aRx: 0, aRy: 1, stride: 0 };
}

function poseIdle(frame: number): Pose {
  return {
    bob: 0, breath: frame === 1 ? -1 : 0,
    lX: 0, lY: 0, rX: 0, rY: 0, aLx: 0, aLy: 0, aRx: 0, aRy: 0,
    action: "none", af: 0, stride: 0,
  };
}

function actionKind(kind: Kind): Pose["action"] {
  if (kind === "kite") return "throw";
  if (kind === "veil" || kind === "veil2") return "cloak";
  if (kind === "key") return "kneel";
  return "alert";
}

function poseAction(kind: Kind, frame: number): Pose {
  const p = poseIdle(0);
  p.action = actionKind(kind);
  p.af = frame;
  if (p.action === "throw") {
    const arms = [
      { aRy: -2, aRx: 1 },
      { aRy: -4, aRx: 0 },
      { aRy: -1, aRx: 2 },
      { aRy: 2, aRx: 2 },
    ][frame];
    p.aRy = arms.aRy;
    p.aRx = arms.aRx;
    p.aLy = frame === 1 ? 1 : 0;
  } else if (p.action === "kneel") {
    p.bob = frame === 0 ? 2 : 4;
    p.lX = -1;
    p.rX = 1;
    p.lY = 1;
    p.rY = 1;
    p.aRx = 2;
    p.aRy = 1;
  } else if (p.action === "alert") {
    p.aRy = frame === 0 ? -1 : -4;
    p.aRx = 1;
    p.bob = frame >= 2 ? 0 : 0;
    p.aLx = frame >= 2 ? -1 : 0;
  } else if (p.action === "jab") {
    p.aRx = 2;
    p.aRy = 1;
  }
  return p;
}

function poseSit(): Pose {
  const p = poseIdle(0);
  p.action = "sit";
  p.bob = 4;
  p.lX = -2;
  p.rX = 2;
  p.lY = 2;
  p.rY = 2;
  return p;
}

function poseFor(kind: Kind, col: number): Pose {
  if (col < 4) return poseWalk(col);
  if (col < 6) return poseIdle(col - 4);
  if (col < 10) return poseAction(kind, col - 6);
  if (col === 10) return { ...poseIdle(0), action: "jab", af: 0, aRx: 2, aRy: 1 };
  return poseSit();
}

function drawArm(pix: Pix, x: number, y: number, L: Look, long = false): void {
  const rows = long ? ["dd", "dd", "CC", "cc", "ss"] : ARM;
  pix.rows(rows, x, y, (ch) => dye(ch, L));
}

function drawKneel(dir: Dir, frame: number, L: Look): Pix {
  const pix = new Pix(FRAME_W, FRAME_H);
  if (dir === "right") {
    const low = frame === 0;
    const body = low
      ? [
          "....hhhhh.",
          "...hhHHHh.",
          "..hsssssh.",
          "..hswesssh",
          "...hssssh.",
          "....csss..",
          "...cccccc.",
          "..dcccccC.",
          "..dcccccc.",
          "...bbbbbb.",
          "...qqqq...",
          "..bbbb....",
        ]
      : [
          "....hhhhh...",
          "...hhHHHh...",
          "..hsssssh...",
          "..hswesssh..",
          "...hssssh...",
          "....csss....",
          "...ccccccss.",
          "..dcccccCCss",
          "..dcccccc..b",
          "...bbbb.bbbb",
          "...qqq...bb.",
          "..bbbb......",
        ];
    pix.rows(body, 0, low ? 8 : 10, (ch) => dye(ch, L));
    if (frame >= 2) {
      pix.set(14, 16, frame === 3 ? 31 : 13);
      pix.set(15, 17, frame === 3 ? 15 : 14);
      pix.set(14, 18, 13);
      pix.set(13, 17, frame === 3 ? 15 : 12);
    }
  } else if (dir === "up") {
    pix.rows(
      [
        "..hhhhhh..",
        ".hhHHHHhh.",
        "hhHHHHHHhh",
        ".hhHHHHhh.",
        "..cccccc..",
        ".cccccccc.",
        "dccccccccd",
        ".bbbbbbbb.",
        "..qqqqqq..",
      ],
      2,
      12,
      (ch) => dye(ch, L),
    );
  } else {
    pix.rows(
      [
        "..hhhhhh..",
        ".hhHHHHhh.",
        "hhssewsseh",
        "hssssssssh",
        ".hssssssh.",
        "..cccccc..",
        ".cccccccc.",
        "dccccccccd",
        ".bbbbbbss.",
        "..qqqq.bb.",
        "...bbbb...",
      ],
      2,
      frame === 0 ? 9 : 11,
      (ch) => dye(ch, L),
    );
    if (frame >= 2) {
      pix.set(13, 17, frame === 3 ? 31 : 13);
      pix.set(14, 18, frame === 3 ? 15 : 14);
    }
  }
  pix.outline(INK);
  return pix;
}

export function drawFrame(kind: Kind, dir: Dir, col: number): Pix {
  const L0 = LOOK[kind];
  const pose = poseFor(kind, col);
  if (pose.action === "kneel") return drawKneel(dir, pose.af, L0);
  // Cloak frames 2–3 are the civilian recolour, so the swap lands on the last frame.
  const L = pose.action === "cloak" && pose.af >= 2 ? LOOK.veil2 : L0;
  const pix = new Pix(FRAME_W, FRAME_H);
  const upper = pose.bob + pose.breath;
  const headY = (L.short ? 4 : 3) + upper;
  const torsoY = 12 + upper;
  const armY = 13 + upper;
  const legY = 16 + pose.bob;
  const side = dir === "right";

  const skipLegs = pose.action === "sit";
  if (!skipLegs && !side) {
    // Feet apart on contact, together on the pass. Bases stay inside the 16px frame.
    pix.rows(LEG, 2 + pose.lX, legY + pose.lY, (ch) => dye(ch, L));
    pix.rows(LEG, 8 + pose.rX, legY + pose.rY, (ch) => dye(ch, L));
  } else if (!skipLegs) {
    const apart = pose.stride !== 0;
    const backX = apart ? 1 : 4;
    const frontX = apart ? 9 : 6;
    const backLift = pose.stride < 0 || (pose.stride === 0 && pose.lY < 0) ? -1 : 0;
    const frontLift = pose.stride > 0 || (pose.stride === 0 && pose.rY < 0) ? -1 : 0;
    pix.rows(LEG, backX, legY + backLift, (ch) => dye(ch, L));
    pix.rows(LEG, frontX, legY + frontLift + (apart ? 0 : 0), (ch) => dye(ch, L));
  } else {
    const fy = 18 + Math.min(pose.bob, 3);
    pix.rows(["bbbbbb"], 4, fy, (ch) => dye(ch, L));
    pix.rows(["qqqq"], 5, fy - 1, (ch) => dye(ch, L));
  }

  const hideR = pose.action === "throw" || pose.action === "jab" || pose.action === "alert";
  if (!side) {
    // Shoulders overlap the torso so the outline joins them.
    drawArm(pix, 2, armY + pose.aLy, L);
    if (!hideR) drawArm(pix, 11, armY + pose.aRy, L);
  } else {
    drawArm(pix, 2, armY + (pose.stride > 0 ? 1 : -1), L);
    if (!hideR) drawArm(pix, 10, armY + (pose.stride < 0 ? 1 : 0), L);
  }

  if (pose.action === "throw" || pose.action === "jab") {
    const reach = pose.action === "throw" ? pose.af : 2;
    if (dir === "down") {
      const spots = [
        [12, armY - 2],
        [11, headY - 1],
        [13, armY - 1],
        [14, armY + 2],
      ][Math.min(3, reach)];
      drawArm(pix, spots[0], spots[1], L, reach === 1 || reach === 2);
    } else if (dir === "up") {
      const spots = [
        [12, armY - 1],
        [8, headY - 2],
        [13, headY + 2],
        [14, armY + 1],
      ][Math.min(3, reach)];
      drawArm(pix, spots[0], spots[1], L, true);
    } else {
      const spots = [
        [3, armY],
        [8, headY - 1],
        [12, armY],
        [13, armY + 2],
      ][Math.min(3, reach)];
      drawArm(pix, spots[0], spots[1], L, true);
    }
  } else if (pose.action === "alert") {
    drawArm(pix, dir === "right" ? 11 : 12, headY + 2, L, true);
  }

  const torso = dir === "right" ? TORSO_S : L.wide ? TORSO_W : TORSO;
  const torsoX = dir === "right" ? 4 : L.wide ? 3 : 4;
  pix.rows(torso, torsoX + (pose.action === "alert" && dir === "right" ? 1 : 0), torsoY, (ch) => dye(ch, L));

  if (L.wide && dir !== "right") {
    // Brass buttons down the coat.
    pix.set(7, torsoY + 2, 13);
    pix.set(7, torsoY + 4, 13);
  }
  if (L.helm && dir !== "up") {
    pix.set(7, torsoY + 3, 1);
    pix.set(8, torsoY + 3, 13);
  }

  const head = dir === "down" ? HEAD_D : dir === "up" ? HEAD_U : HEAD_S;
  const hx = dir === "right" ? 3 : 3;
  if (L.short) pix.rows(head.slice(1), hx, headY, (ch) => dye(ch, L));
  else pix.rows(head, hx, headY, (ch) => dye(ch, L));

  if (L.brow && dir === "down") {
    pix.set(5, headY + 3, L.skinSh);
    pix.set(9, headY + 3, L.skinSh);
  }
  if (L.keys && dir === "down") {
    pix.set(6, headY + 6, L.hair);
    pix.set(8, headY + 6, L.hair);
  }

  if (L.scarf) {
    const tx = (dir === "right" ? 10 : 11) + pose.stride;
    pix.rows(["rr", "Rr", "r."], tx, torsoY, (ch) => dye(ch, L));
  }
  if (L.hairLong) {
    pix.rows(["h", "h", "H", "h", "h"], dir === "right" ? 3 : 2, headY + 2, (ch) => dye(ch, L));
    if (dir !== "right") pix.rows(["h", "h", "h", "H"], 12, headY + 2, (ch) => dye(ch, L));
    else pix.rows(["h", "h", "h", "h", "H", "h"], 4, headY + 6, (ch) => dye(ch, L));
  }
  if (L.pallu && dir !== "up") {
    const px = dir === "right" ? 3 : 1;
    pix.rows(["rr", "Rr", "rr", "Rr", "rr", "R"], px, torsoY, (ch) => dye(ch, L));
  }
  if (L.helm) {
    const hy = headY - 3;
    if (dir === "right") {
      pix.rows(
        ["..uuu..", ".ukKKu.", "ukKKKKu", ".kkkkk.", "kkkkkkk"],
        2,
        hy,
        (ch) => dye(ch, L),
      );
    } else {
      pix.rows(
        ["...uuuu...", "..ukKKKku..", ".ukKKKKKku.", "..kkkkkk..", ".kkkkkkkk."],
        2,
        hy,
        (ch) => dye(ch, L),
      );
    }
  }
  if (L.keys) {
    const kx = (dir === "right" ? 10 : 12) + (pose.stride < 0 ? -1 : pose.stride > 0 ? 1 : 0);
    pix.rows([".n.", "n.n", ".n."], kx, torsoY + 3, (ch) => dye(ch, L));
  }

  if (pose.action === "cloak") {
    const span = [2, 5, 8, 4][pose.af];
    for (let i = 0; i < span; i++) {
      const y = torsoY - 1 + i;
      for (let x = 3; x < 13; x++) {
        if ((x + i + pose.af) % 2 === 0) pix.set(x, y, pose.af >= 2 ? 8 : 18);
      }
    }
  }

  if (pose.action === "sit") {
    pix.rows(["bbbbbb"], 4, 20, (ch) => dye(ch, L));
  }

  pix.outline(INK);
  return pix;
}

export function actorSheet(kind: Kind): Pix {
  const sheet = new Pix(FRAME_W * SHEET_COLS, FRAME_H * 3);
  const dirs: Dir[] = ["down", "up", "right"];
  for (let r = 0; r < dirs.length; r++) {
    for (let c = 0; c < SHEET_COLS; c++) {
      const frame = drawFrame(kind, dirs[r], c);
      sheet.blit(frame, c * FRAME_W, r * FRAME_H);
    }
  }
  return sheet;
}

export function frameName(facing: Facing, col: number): { name: string; flip: boolean } {
  if (facing === "left") return { name: `2-${col}`, flip: true };
  const row = facing === "down" ? 0 : facing === "up" ? 1 : 2;
  return { name: `${row}-${col}`, flip: false };
}

const PORTRAIT: Record<string, string[]> = {
  kite: [
    "..hhhhhhhhhh..",
    ".hhHHHHhhhHh..",
    ".hSSSSSSSSSSh.",
    ".hSSeWSWeSSSh.",
    ".hSSSSSSSSSSh.",
    ".hSSaSSSSaSSh.",
    ".hSSSSSmSSSSh.",
    "..hSSSSSSSh...",
    "...rrrrrrrr...",
    "..rrRRRRRRrr..",
    "..ccCcccCCcc..",
    "..cccccccccc..",
    "...cccccccc...",
    "....cccccc....",
    "..............",
    "..............",
  ],
  veil: [
    "hhhhhhhhhhhhhh",
    "hhHHHHhhhHHHhh",
    "hSSSSSSSSSSSSh",
    "hSSeWSWeSSSSSh",
    "hSSSSSSSSSSSSh",
    "hSSaSSSSSaSSSh",
    "hhSSSSSmSSSShh",
    "h.hSSSSSSSh.h.",
    "h..rrrrrrrr..h",
    "rr.rRRRRRRr.rr",
    "r..cccccccc..r",
    "r..ccCccCcc..r",
    ".r.cccccccc.r.",
    "..rrrrrrrrrr..",
    "....rrrrrr....",
    "..............",
  ],
  key: [
    "..hhhhhhhhhh..",
    ".hhHHHHhhhHh..",
    ".hSSSSSSSSSSh.",
    ".haSeWSWeSSah.",
    ".hSSSSSSSSSSh.",
    ".hSSaSSSaSSSh.",
    ".hSSShhhSSSSh.",
    "..hSSSSSSSh...",
    "...nnnccnnn...",
    "..cccccccccc..",
    "..ccCcccCCcc..",
    "..ncccccccn...",
    "...cccccccc...",
    "....cccc.cc...",
    ".....n.n.n....",
    "..............",
  ],
  guard: [
    "...uuuuuuuu...",
    "..ukKKKKKKku..",
    ".ukKKKKKKKKku.",
    "..kkkkkkkkkk..",
    ".kkSSSSSSSSkk.",
    ".hSSeWSWeSSSh.",
    ".hSSSSSSSSSSh.",
    ".haSSSSSSaSSh.",
    "..hSSSmSSSh...",
    "...kkkkkkkk...",
    "..kKkkkkkkKk..",
    "..kkkkkkkkkk..",
    "...kknnnkkk...",
    "....kkkkkk....",
    "..............",
    "..............",
  ],
  wire: [
    "..hhhhhhhhhh..",
    ".hhHHHHHHHHh..",
    ".hSSSSSSSSSSh.",
    ".hSSoSSoSSSSh.",
    ".hSSSSSSSSSSh.",
    ".hoSSaSSSaSoh.",
    ".hSSSSSmSSSSh.",
    "..hSSSSSSSh...",
    "...hhhhhhh....",
    "..nnncccnnn...",
    "..cccccccccc..",
    "..ccckkkccc...",
    "...cccccccc...",
    "....cccccc....",
    "..............",
    "..............",
  ],
};

export function portrait(id: string): Pix {
  const pix = new Pix(16, 16);
  const lines = PORTRAIT[id] ?? PORTRAIT.kite;
  const L = LOOK[id === "wire" ? "key" : (id as Kind)] ?? LOOK.kite;
  const wire: Look = {
    ...LOOK.key,
    hair: 25, hairHi: 27,
    cloth: 2, clothHi: 3, clothSh: 1,
    accent: 13, accentSh: 12,
  };
  const look = id === "wire" ? wire : id === "veil" ? LOOK.veil : L;
  pix.rows(lines, 0, 0, (ch) => dye(ch, look));
  pix.outline(INK);
  return pix;
}

export function makeShadow(): Pix {
  const p = new Pix(8, 4);
  p.rows(["..oooo..", ".oooooo.", ".oooooo.", "..oooo.."], 0, 0, () => INK);
  return p;
}

export function makeDust(): Pix {
  const p = new Pix(2, 2);
  p.set(0, 0, 4);
  p.set(1, 1, 3);
  return p;
}

export function makePebble(): Pix {
  const p = new Pix(5, 5);
  // Light stone with a hot highlight so the arc reads on brick and on water.
  p.rows([".ccc.", "cCCCc", "cC8Cc", "cCCCc", ".ccc."], 0, 0, (ch) => (ch === "c" ? 6 : ch === "C" ? 8 : 15));
  p.outline(INK);
  return p;
}

export function makeSpark(): Pix {
  const p = new Pix(3, 3);
  p.set(1, 0, 14);
  p.set(0, 1, 15);
  p.set(1, 1, 14);
  p.set(2, 1, 15);
  p.set(1, 2, 14);
  return p;
}

export function makeHeart(full: boolean): Pix {
  const p = new Pix(8, 8);
  if (full) {
    p.rows(
      ["..r.r...", ".rrrrr..", "rrrrrrr.", "rrrrrrr.", ".rrrrr..", "..rrr...", "...r....", "........"],
      0, 0, () => 17,
    );
    p.set(2, 1, 18);
    p.set(5, 1, 18);
  } else {
    p.rows(
      ["..o.o...", ".o...o..", "o.....o.", "o.....o.", ".o...o..", "..o.o...", "...o....", "........"],
      0, 0, () => 2,
    );
  }
  return p;
}

export function makeMark(kind: "?" | "!"): Pix {
  const p = new Pix(11, 13);
  p.fillRect(1, 1, 9, 11, 1);
  const glyph = kind === "?"
    ? ["..yyy..", ".y...y.", "....yy.", "...y...", "...y...", ".......", "...y..."]
    : ["..yyy..", "..yyy..", "..yyy..", "..yyy..", "..yyy..", ".......", "..yyy.."];
  p.rows(glyph, 2, 2, () => (kind === "?" ? 14 : 17));
  p.outline(INK);
  return p;
}

export function makeCrate(): Pix {
  const p = new Pix(16, 16);
  // Inset so the brass plate stays visible around the box once it lands.
  p.fillRect(4, 5, 8, 2, 6);
  p.fillRect(4, 7, 8, 6, 3);
  for (let y = 7; y <= 11; y++) {
    p.set(6, y, 2);
    p.set(9, y, 2);
  }
  p.set(5, 6, 13);
  p.set(10, 6, 13);
  p.set(5, 11, 13);
  p.set(10, 11, 13);
  p.set(6, 5, 8);
  p.outline(INK);
  return p;
}

export function makePlate(): Pix {
  const p = new Pix(16, 16);
  // Brass rim sits outside the crate, so the box reads as resting on the plate.
  p.fillRect(0, 0, 16, 16, 12);
  p.fillRect(1, 1, 14, 14, 13);
  p.fillRect(3, 3, 10, 10, 4);
  p.fillRect(6, 6, 4, 4, 14);
  p.set(7, 7, 15);
  return p;
}

export function makeGrate(open: boolean): Pix {
  const p = new Pix(16, 16);
  p.fillRect(1, 1, 14, 14, 9);
  p.fillRect(0, 0, 16, 2, 4);
  p.fillRect(0, 14, 16, 2, 3);
  p.fillRect(0, 0, 2, 16, 4);
  p.fillRect(14, 0, 2, 16, 3);
  if (!open) {
    for (let i = 3; i <= 12; i += 3) {
      for (let y = 2; y <= 13; y++) p.set(i, y, 30);
      for (let x = 2; x <= 13; x++) p.set(x, i, 29);
    }
  }
  return p;
}

export function makeGate(): Pix {
  const p = new Pix(16, 24);
  p.fillRect(1, 4, 14, 20, 28);
  for (let y = 6; y <= 20; y += 4) p.fillRect(2, y, 12, 1, 30);
  for (let x = 3; x <= 12; x += 3) p.fillRect(x, 5, 1, 16, 29);
  for (let x = 3; x <= 12; x += 3) {
    p.set(x, 2, 30);
    p.set(x, 1, 13);
    p.set(x, 3, 30);
  }
  p.fillRect(6, 12, 4, 4, 12);
  p.set(7, 13, 14);
  p.set(8, 14, 13);
  p.outline(INK);
  return p;
}

export function makeBell(frame: number): Pix {
  const p = new Pix(12, 16);
  const ox = frame === 0 ? 0 : 1;
  p.fillRect(5, 0, 2, 3, 1);
  p.rows(
    ["..nnn..", ".nKKKn.", "nKKKKKn", "nKyyyKn", ".nKKKn.", "..nnn..", "...n..."],
    2 + ox,
    3,
    (ch) => dye(ch, LOOK.guard),
  );
  p.set(5 + ox, 12, 14);
  p.outline(INK);
  return p;
}

export function makeLeaflet(frame: number): Pix {
  const p = new Pix(16, 16);
  p.fillRect(3, 2, 10, 12, 8);
  p.fillRect(4, 3, 8, 10, 7);
  p.fillRect(5, 4, 3, 8, frame === 0 ? 8 : 6);
  for (let y = 5; y <= 10; y += 2) p.fillRect(9, y, 3, 1, 11);
  p.set(6, 8, 17);
  p.set(7, 8, 17);
  p.set(6, 9, 16);
  p.outline(INK);
  return p;
}

export function makeLantern(frame: number): Pix {
  const p = new Pix(8, 14);
  p.fillRect(3, 0, 2, 2, 1);
  p.fillRect(2, 2, 4, 2, 12);
  p.fillRect(1, 4, 6, 7, 13);
  p.fillRect(2, 5, 4, 5, frame === 0 ? 14 : 15);
  p.set(3, 7, 8);
  p.fillRect(2, 11, 4, 2, 12);
  p.outline(INK);
  return p;
}

export function makeFlag(frame: number): Pix {
  const p = new Pix(14, 16);
  p.fillRect(1, 0, 2, 16, 2);
  const ox = frame === 0 ? 0 : 1;
  for (let y = 2; y <= 8; y++) {
    const wave = y % 2 === 0 ? ox : 0;
    for (let x = 3; x <= 10 - wave; x++) p.set(x + wave, y, y < 5 ? 17 : 8);
  }
  p.outline(INK);
  return p;
}

export function makePot(): Pix {
  const p = new Pix(16, 20);
  p.rows(
    [
      "....llll....",
      "...llLLll...",
      "..lLLLLLLl..",
      "..lLLllLLl..",
      "...ll..ll...",
      "....l..l....",
      "....cccc....",
      "...cCCCCc...",
      "..cCCCCCCc..",
      "..cCCCCCCc..",
      "...cCCCCc...",
      "....cccc....",
    ],
    1,
    2,
    (ch) => (ch === "l" ? 23 : ch === "L" ? 24 : ch === "c" ? 3 : 5),
  );
  p.set(6, 4, 22);
  p.set(9, 5, 22);
  p.outline(INK);
  return p;
}

export function makePillar(): Pix {
  const p = new Pix(16, 24);
  p.fillRect(4, 2, 8, 3, 6);
  p.fillRect(3, 5, 10, 2, 4);
  p.fillRect(5, 7, 6, 12, 7);
  for (let y = 8; y <= 17; y++) p.set(9, y, 6);
  p.fillRect(3, 19, 10, 2, 4);
  p.fillRect(2, 21, 12, 2, 3);
  p.set(6, 10, 8);
  p.outline(INK);
  return p;
}

export function makeStall(): Pix {
  const p = new Pix(112, 64);
  for (let y = 2; y <= 16; y++) {
    for (let x = 6; x <= 104; x++) {
      const scallop = y > 13 && ((x + 4) % 10) < (y - 13);
      if (scallop) continue;
      const stripe = Math.floor(x / 6) % 2 === 0;
      p.set(x, y, stripe ? 17 : 7);
    }
  }
  for (const x of [10, 54, 98]) p.fillRect(x, 16, 4, 40, 3);
  p.fillRect(8, 34, 96, 4, 6);
  p.fillRect(8, 38, 96, 16, 3);
  for (let x = 20; x < 96; x += 16) p.fillRect(x, 40, 1, 12, 2);
  // kettle
  p.fillRect(22, 26, 8, 6, 13);
  p.fillRect(24, 24, 4, 2, 12);
  p.set(30, 28, 12);
  p.set(31, 29, 12);
  p.set(23, 28, 15);
  // cups
  for (const x of [40, 48, 56]) {
    p.fillRect(x, 30, 5, 4, 7);
    p.fillRect(x, 29, 5, 1, 18);
    p.set(x + 1, 31, 6);
  }
  // sweets
  p.fillRect(70, 30, 12, 4, 4);
  p.set(72, 31, 17);
  p.set(75, 31, 14);
  p.set(78, 31, 17);
  p.outline(INK);
  return p;
}

export function makeWater(frame: number): Pix {
  const p = new Pix(16, 16);
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 16; x++) {
      const band = (y + (x > 8 ? 1 : 0)) % 4;
      p.set(x, y, band === 0 ? 9 : band === 1 ? 10 : 11);
    }
  }
  p.fillRect(0, 13, 16, 1, 4);
  p.fillRect(0, 14, 16, 2, 5);
  const sx = frame === 0 ? 3 : 11;
  p.set(sx, 4, 15);
  p.set(sx + 1, 5, 8);
  p.set((sx + 7) % 14, 8, 11);
  return p;
}

function roofPixel(x: number, y: number): number {
  const row = y % 4;
  const shift = (Math.floor(y / 4) % 2) * 4;
  const bx = (x + shift) % 8;
  if (bx === 0) return 2;
  if (row === 0) return 16;
  if (row === 1) return 3;
  if (row === 2) return bx === 5 ? 5 : 4;
  return 3;
}

function paintRoof(dest: Pix, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) dest.set(ox + x, oy + y, roofPixel(x, y));
}

function paintFacade(dest: Pix, ox: number, oy: number, kind: "plain" | "window" | "doorL" | "doorR"): void {
  for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) dest.set(ox + x, oy + y, roofPixel(x, y));
  dest.fillRect(ox, oy + 3, 16, 1, 1);
  dest.fillRect(ox, oy + 4, 16, 11, 7);
  dest.fillRect(ox, oy + 8, 16, 1, 6);
  dest.fillRect(ox, oy + 15, 16, 1, 4);
  // a hair of shade so the wall isn't a flat stamp, aligned so neighbours match
  if (kind === "window") {
    dest.fillRect(ox + 4, oy + 5, 8, 7, 3);
    dest.fillRect(ox + 5, oy + 6, 6, 5, 9);
    for (let y = 6; y <= 10; y++) for (let x = 5; x <= 10; x++) {
      if ((x + y) % 2 === 0) dest.set(ox + x, oy + y, 7);
    }
  } else if (kind === "doorL") {
    dest.fillRect(ox + 8, oy + 5, 8, 10, 2);
    dest.fillRect(ox + 9, oy + 6, 7, 9, 9);
    dest.fillRect(ox + 10, oy + 8, 6, 7, 3);
    dest.set(ox + 14, oy + 11, 13);
    for (let y = 5; y <= 8; y++) dest.set(ox + 8, oy + y, 1);
  } else if (kind === "doorR") {
    dest.fillRect(ox, oy + 5, 8, 10, 2);
    dest.fillRect(ox, oy + 6, 7, 9, 9);
    dest.fillRect(ox + 1, oy + 8, 6, 7, 3);
    dest.set(ox + 2, oy + 11, 13);
  }
}

/** Irregular sandstone slabs on a 48px repeat. Mortar, a top-left highlight, a bottom-right shade. */
function floorColor(wx: number, wy: number): number {
  const sx = ((wx % 48) + 48) % 48;
  const sy = ((wy % 48) + 48) % 48;
  const stones: ReadonlyArray<readonly [number, number, number, number]> = [
    [1, 1, 22, 16],
    [24, 1, 22, 20],
    [1, 18, 16, 14],
    [18, 22, 28, 12],
    [1, 33, 20, 14],
    [22, 35, 24, 12],
  ];
  for (const [x, y, w, h] of stones) {
    if (sx >= x && sy >= y && sx < x + w && sy < y + h) {
      if (sx === x || sy === y) return 6;
      if (sx === x + w - 1 || sy === y + h - 1) return 4;
      if (sx === x + 4 && sy > y + 3 && sy < y + 6) return 4;
      return 5;
    }
  }
  return 3;
}

function paintFloor(dest: Pix, ox: number, oy: number, tx: number, ty: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) dest.force(ox + x, oy + y, floorColor(tx * 16 + x, ty * 16 + y));
  }
}

export function makeMedallion(): Pix {
  const p = new Pix(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = Math.abs(x - 15.5);
    const dy = Math.abs(y - 15.5);
    if (dx + dy < 14 && dx + dy > 11) p.set(x, y, 13);
    else if (dx < 4 && dy < 4) p.set(x, y, 14);
    else if (dx + dy < 8) p.set(x, y, 12);
    else if (Math.max(dx, dy) > 13 && Math.max(dx, dy) < 15) p.set(x, y, 4);
  }
  p.outline(INK);
  return p;
}

export function makeSign(): Pix {
  const label = "LANE ENDS";
  const tw = measure(label);
  const p = new Pix(tw + 8, 16);
  p.fillRect(0, 2, p.w, 12, 3);
  p.fillRect(1, 3, p.w - 2, 10, 6);
  drawText(p, label, 4, 5, INK);
  p.outline(INK);
  return p;
}

export function makeArrow(): Pix {
  const p = new Pix(6, 4);
  p.rows(["..y...", ".yyy..", "yyyyy.", ".yyy.."], 0, 0, () => 14);
  return p;
}

export interface BoxSpec {
  title?: string;
  lines: string[];
  portrait?: Pix;
  icon?: Pix;
}

export function makeBox(spec: BoxSpec): Pix {
  const width = 312;
  const textX = spec.portrait || spec.icon ? 40 : 8;
  const lineH = 8;
  const height = 10 + spec.lines.length * lineH + (spec.title ? 10 : 0) + 8;
  const p = new Pix(width, Math.max(36, height));
  p.fillRect(0, 0, width, p.h, INK);
  p.fillRect(2, 2, width - 4, p.h - 4, 7);
  p.fillRect(3, 3, width - 6, p.h - 6, 8);
  // corner studs
  for (const [x, y] of [[4, 4], [width - 6, 4], [4, p.h - 6], [width - 6, p.h - 6]]) p.set(x, y, 13);
  let ty = 8;
  if (spec.portrait) {
    // 2× nearest
    for (let y = 0; y < spec.portrait.h; y++) for (let x = 0; x < spec.portrait.w; x++) {
      const c = spec.portrait.get(x, y);
      if (c === CLEAR) continue;
      p.force(6 + x * 2, 6 + y * 2, c);
      p.force(7 + x * 2, 6 + y * 2, c);
      p.force(6 + x * 2, 7 + y * 2, c);
      p.force(7 + x * 2, 7 + y * 2, c);
    }
  }
  if (spec.icon) p.blit(spec.icon, 8, 8);
  if (spec.title) {
    drawText(p, spec.title, textX, ty, 16);
    ty += 10;
  }
  for (const line of spec.lines) {
    drawText(p, line, textX, ty, INK);
    ty += lineH;
  }
  return p;
}

/** Static courtyard. Animated props are sprites, not baked. */
export function bakeMap(grid: string[]): Pix {
  const h = grid.length;
  const w = grid[0].length;
  const dest = new Pix(w * 16, h * 16);
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = grid[ty][tx];
      const ox = tx * 16;
      const oy = ty * 16;
      const south = grid[ty + 1]?.[tx] ?? "#";
      const north = grid[ty - 1]?.[tx] ?? "#";
      const solidish = (c: string) => c === "#" || c === "H" || c === "B" || c === "T";
      if (ch === "~") {
        dest.blit(makeWater(0), ox, oy);
        continue;
      }
      if (ch === "=") {
        dest.blit(makePlate(), ox, oy);
        continue;
      }
      if (ch === "T") {
        paintFloor(dest, ox, oy, tx, ty);
        continue;
      }
      if (solidish(ch)) {
        if (!solidish(south) && south !== "T") {
          const kind = ch === "H" && grid[ty][tx + 1] === "H" ? "doorL"
            : ch === "H" && grid[ty][tx - 1] === "H" ? "doorR"
            : (tx * 3 + ty) % 6 === 0 && ch !== "B" ? "window"
            : "plain";
          paintFacade(dest, ox, oy, kind);
        } else if (!solidish(north) && north !== "T") {
          paintRoof(dest, ox, oy);
          dest.fillRect(ox, oy, 16, 3, 1);
          dest.fillRect(ox, oy + 3, 16, 1, 2);
        } else paintRoof(dest, ox, oy);
        continue;
      }
      paintFloor(dest, ox, oy, tx, ty);
    }
  }
  // Courtyard star, flat on the stones.
  const med = makeMedallion();
  for (let y = 0; y < med.h; y++) for (let x = 0; x < med.w; x++) {
    const c = med.get(x, y);
    if (c === CLEAR) continue;
    dest.force(24 * 16 + x, 6 * 16 + y, c);
  }
  return dest;
}
