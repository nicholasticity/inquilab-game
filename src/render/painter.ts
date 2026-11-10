import { cellRect, groundPoint, layoutBoard } from "./layout";
import type { PaintActor, PaintModel, PaintTile } from "./model";
import {
  BRASS,
  BRASS_LO,
  BRICK,
  BRICK_HI,
  BRICK_LO,
  CLOTH,
  CONE_AMBER,
  CONE_GOLD,
  CONE_RED,
  GLEAM,
  GOLD_LINE,
  hash,
  HIDE,
  mix,
  INDIGO,
  INK,
  KHAKI,
  OLIVE,
  OUTLINE,
  PAPER,
  SAND,
  SAND_DEEP,
  SHADOW,
  SHADOW_DEEP,
  SKIN,
  SKIN_HI,
  SKIN_LO,
  tone,
} from "./palette";
import { strideFrame } from "./stride";
import type { Archetype } from "./model";

interface Look {
  cloth: string;
  clothHi: string;
  pants: string;
  shoe: string;
  accent: string;
  hat: "turban" | "red" | "cap" | "pallu" | "none";
  mask: boolean;
  rifle: boolean;
  skirt: boolean;
}

const LOOK: Record<Archetype, Look> = {
  kite: { cloth: "#3e4a38", clothHi: "#6d7c5c", pants: "#2c2824", shoe: "#241c18", accent: OLIVE, hat: "turban", mask: true, rifle: false, skirt: false },
  veil: { cloth: "#7a3048", clothHi: "#c46a80", pants: "#4a2030", shoe: "#3a241c", accent: "#e0b15a", hat: "pallu", mask: false, rifle: false, skirt: true },
  "veil-coat": { cloth: KHAKI, clothHi: "#e2c48a", pants: "#5c4630", shoe: "#2a211c", accent: "#7a3048", hat: "cap", mask: false, rifle: false, skirt: false },
  constable: { cloth: KHAKI, clothHi: "#e4c89a", pants: "#6a5038", shoe: "#2e241c", accent: "#9d3030", hat: "red", mask: false, rifle: true, skirt: false },
  officer: { cloth: "#8d6b45", clothHi: "#c49a68", pants: "#3e342c", shoe: "#241c18", accent: "#d4c4a0", hat: "cap", mask: false, rifle: false, skirt: false },
  courier: { cloth: "#efe6d2", clothHi: "#fff8ea", pants: "#6b4a32", shoe: "#3a2a22", accent: "#6b4a32", hat: "none", mask: false, rifle: false, skirt: false },
};

interface Pt { x: number; y: number }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function capsule(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, r: number, fill: string, hi: string): void {
  const outline = Math.max(2, r * 0.38);
  ctx.lineCap = "round";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 2 + outline;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = r * 2;
  ctx.stroke();
  ctx.strokeStyle = hi;
  ctx.lineWidth = Math.max(1.25, r * 0.42);
  ctx.beginPath();
  ctx.moveTo(a.x - r * 0.22, a.y - r * 0.3);
  ctx.lineTo(b.x - r * 0.22, b.y - r * 0.3);
  ctx.stroke();
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, hi: string, radius: number): void {
  roundRect(ctx, x - w / 2, y - h / 2, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.07);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = hi;
  ctx.lineWidth = Math.max(1.4, w * 0.07);
  ctx.arc(x - w * 0.16, y - h * 0.2, Math.min(w, h) * 0.26, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
}

function ik(hip: Pt, foot: Pt, thigh: number, shin: number, prefer: (knee: Pt) => number): Pt {
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  let dist = Math.hypot(dx, dy) || 0.001;
  const max = thigh + shin - 0.8;
  const min = Math.abs(thigh - shin) + 1;
  const scale = dist > max ? max / dist : dist < min ? min / dist : 1;
  const fx = hip.x + dx * scale;
  const fy = hip.y + dy * scale;
  dist = Math.hypot(fx - hip.x, fy - hip.y);
  const ang = Math.atan2(fy - hip.y, fx - hip.x);
  const cos = (thigh * thigh + dist * dist - shin * shin) / (2 * thigh * dist);
  const off = Math.acos(Math.max(-1, Math.min(1, cos)));
  const kneeAt = (sign: number): Pt => ({
    x: hip.x + Math.cos(ang + sign * off) * thigh,
    y: hip.y + Math.sin(ang + sign * off) * thigh,
  });
  const left = kneeAt(1);
  const right = kneeAt(-1);
  return prefer(left) >= prefer(right) ? left : right;
}

function drawFloor(ctx: CanvasRenderingContext2D, rectX: number, rectY: number, size: number, tile: PaintTile): void {
  const jitter = (hash(tile.x, tile.y) - 0.5) * 18;
  const base = tile.hide ? tone(HIDE, jitter * 0.4) : tile.lit ? tone(SAND, jitter) : tone(SHADOW, jitter * 0.7);
  const lip = tile.lit ? SAND_DEEP : SHADOW_DEEP;
  const inset = size * 0.07;
  const x = rectX + inset;
  const y = rectY + inset;
  const w = size - inset * 2;
  const h = size - inset * 2;
  const lipH = Math.max(4, size * 0.09);
  roundRect(ctx, x, y + 3, w, h, size * 0.12);
  ctx.fillStyle = lip;
  ctx.fill();
  roundRect(ctx, x, y, w, h - lipH * 0.3, size * 0.12);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, size * 0.035);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = tone(base, 28);
  ctx.lineWidth = Math.max(1.2, size * 0.03);
  ctx.moveTo(x + size * 0.16, y + size * 0.14);
  ctx.lineTo(x + w - size * 0.18, y + size * 0.14);
  ctx.stroke();
  if (tile.hide) {
    ctx.fillStyle = tone(HIDE, -10);
    roundRect(ctx, x + w * 0.18, y + h * 0.2, w * 0.64, h * 0.5, 8);
    ctx.fill();
  }
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 4);
  ctx.fillStyle = BRICK;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const courses = 4;
  for (let row = 0; row < courses; row += 1) {
    const fy = y + 6 + row * ((size - 12) / courses);
    ctx.strokeStyle = BRICK_LO;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 6, fy);
    ctx.lineTo(x + size - 6, fy);
    ctx.stroke();
    const shift = row % 2 === 0 ? 0 : size * 0.22;
    for (let col = 0; col < 3; col += 1) {
      const fx = x + 8 + shift + col * (size * 0.3);
      if (fx > x + size - 10) continue;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + (size - 12) / courses - 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = tone(BRICK_HI, (seed - 0.5) * 20);
  ctx.fillRect(x + 6, y + 5, size - 12, Math.max(4, size * 0.08));
}

function drawPit(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  roundRect(ctx, x + 3, y + 3, size - 6, size - 6, 8);
  ctx.fillStyle = "#120e0c";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = BRICK_LO;
  ctx.stroke();
  roundRect(ctx, x + size * 0.22, y + size * 0.34, size * 0.56, size * 0.36, 4);
  ctx.fillStyle = tone(SHADOW_DEEP, -8);
  ctx.fill();
  ctx.strokeStyle = tone(BRICK, 10);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 8);
  ctx.lineTo(x + size - 8, y + 8);
  ctx.stroke();
}

function drawProp(ctx: CanvasRenderingContext2D, prop: PaintTile["prop"], cx: number, cy: number, size: number, time: number): void {
  const s = size / 64;
  if (prop === "lamp") {
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.55);
    glow.addColorStop(0, "rgba(224,177,90,0.45)");
    glow.addColorStop(1, "rgba(224,177,90,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    capsule(ctx, { x: cx, y: cy + 8 * s }, { x: cx, y: cy - 16 * s }, 3.2 * s, BRASS_LO, BRASS);
    blob(ctx, cx, cy - 26 * s, 16 * s, 18 * s, BRASS, tone(BRASS, 40), 4 * s);
    ctx.fillStyle = "rgba(255, 214, 140, 0.85)";
    ctx.fillRect(cx - 4 * s, cy - 30 * s, 8 * s, 8 * s);
  } else if (prop === "pot" || prop === "bell") {
    blob(ctx, cx, cy - 4 * s, 22 * s, 16 * s, BRASS, tone(BRASS, 50), 8 * s);
    capsule(ctx, { x: cx - 8 * s, y: cy - 12 * s }, { x: cx + 8 * s, y: cy - 12 * s }, 2.4 * s, BRASS_LO, BRASS);
    if (prop === "bell") {
      capsule(ctx, { x: cx, y: cy - 16 * s }, { x: cx, y: cy - 26 * s }, 1.8 * s, BRASS_LO, BRASS);
    }
  } else if (prop === "basket") {
    blob(ctx, cx, cy - 2 * s, 30 * s, 16 * s, "#6b4a32", "#a87848", 6 * s);
    ctx.strokeStyle = tone("#6b4a32", -20);
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5 * s, cy - 8 * s);
      ctx.lineTo(cx + i * 5 * s, cy + 4 * s);
      ctx.stroke();
    }
    blob(ctx, cx, cy - 8 * s, 18 * s, 8 * s, CLOTH, tone(CLOTH, 30), 4);
  } else if (prop === "plans" || prop === "desk") {
    if (prop === "desk") blob(ctx, cx, cy + 2 * s, 34 * s, 16 * s, "#6b4a32", "#a87848", 3);
    blob(ctx, cx, cy - 8 * s, 18 * s, 14 * s, PAPER, "#fff8ea", 2);
    ctx.fillStyle = CLOTH;
    ctx.beginPath();
    ctx.arc(cx + 4 * s, cy - 8 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop === "note") {
    blob(ctx, cx, cy - 4 * s, 14 * s, 16 * s, PAPER, "#fff8ea", 2);
    ctx.strokeStyle = BRASS_LO;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4 * s, cy - 6 * s);
    ctx.lineTo(cx + 4 * s, cy - 6 * s);
    ctx.moveTo(cx - 4 * s, cy - 2 * s);
    ctx.lineTo(cx + 3 * s, cy - 2 * s);
    ctx.stroke();
  } else if (prop === "vent") {
    roundRect(ctx, cx - 12 * s, cy - 14 * s, 24 * s, 20 * s, 3);
    ctx.fillStyle = SHADOW_DEEP;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.strokeStyle = tone(SHADOW, 30);
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 8 * s, cy + i * 4 * s);
      ctx.lineTo(cx + 8 * s, cy + i * 4 * s);
      ctx.stroke();
    }
  } else if (prop === "stairs") {
    ctx.strokeStyle = tone(SAND, -30);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 10 * s, cy - 6 * s + i * 6 * s);
      ctx.lineTo(cx + 10 * s, cy - 2 * s + i * 6 * s);
      ctx.stroke();
    }
  } else if (prop === "awning") {
    const sway = Math.sin(time * 1.4 + cx * 0.01) * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 18 * s, cy - 16 * s);
    ctx.lineTo(cx + 18 * s, cy - 16 * s);
    ctx.lineTo(cx + 14 * s, cy + sway);
    ctx.lineTo(cx - 14 * s, cy + sway + 2);
    ctx.closePath();
    ctx.fillStyle = CLOTH;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = INDIGO;
    ctx.fillRect(cx - 8 * s, cy - 16 * s, 6 * s, 14 * s);
    ctx.fillStyle = BRASS;
    ctx.fillRect(cx + 2 * s, cy - 16 * s, 5 * s, 14 * s);
  }
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, look: number, wide: number, shut: boolean): void {
  if (shut) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1.4, s);
    ctx.beginPath();
    ctx.arc(x, y, 2.2 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(x, y, 2.4 * s * wide, 2.7 * s * wide, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(x + look, y + 0.4 * s, 1.15 * s, 0, Math.PI * 2);
  ctx.fill();
}

function hat(ctx: CanvasRenderingContext2D, look: Look, x: number, y: number, s: number, face: PaintActor["face"]): void {
  if (look.hat === "turban" || look.hat === "red" || look.hat === "pallu") {
    const color = look.hat === "red" ? "#9d3030" : look.hat === "pallu" ? look.cloth : OLIVE;
    blob(ctx, x, y - 6 * s, 24 * s, 12 * s, color, tone(color, 28), 6 * s);
    blob(ctx, x, y - 12 * s, 18 * s, 8 * s, tone(color, -8), tone(color, 20), 5 * s);
  } else if (look.hat === "cap") {
    blob(ctx, x, y - 8 * s, 22 * s, 10 * s, "#3a2e28", "#6a5648", 4 * s);
    const visor = face === "left" ? -8 * s : 8 * s;
    if (face !== "up") blob(ctx, x + visor * 0.6, y - 4 * s, 12 * s, 4 * s, "#241814", "#4a3c34", 2);
  }
}

function faceOn(ctx: CanvasRenderingContext2D, look: Look, x: number, y: number, s: number, actor: PaintActor, time: number): void {
  const lookX = Math.sin(time * 0.7) * s * 1.3;
  const wide = actor.pose === "alert" ? 1.25 : 1;
  const shut = actor.pose === "down";
  if (actor.face === "up") return;
  if (actor.face === "left" || actor.face === "right") {
    const sign = actor.face === "right" ? 1 : -1;
    eye(ctx, x + sign * 4 * s, y - 1 * s, s, lookX * 0.4, wide, shut);
    ctx.fillStyle = SKIN_LO;
    ctx.beginPath();
    ctx.ellipse(x + sign * 9 * s, y + 1 * s, 2.4 * s, 1.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    eye(ctx, x - 4.5 * s, y - 1 * s, s, lookX, wide, shut);
    eye(ctx, x + 4.5 * s, y - 1 * s, s, lookX, wide, shut);
  }
  if (look.mask) {
    roundRect(ctx, x - 9 * s, y + 1 * s, 18 * s, 10 * s, 4 * s);
    ctx.fillStyle = "#3a4034";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  } else if (!shut && actor.face === "down") {
    ctx.strokeStyle = SKIN_LO;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(x, y + 5 * s, 2.2 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function drawLimbs(
  ctx: CanvasRenderingContext2D,
  hip: Pt,
  footA: Pt,
  footB: Pt,
  s: number,
  look: Look,
  side: boolean,
): void {
  const thigh = 18 * s;
  const shin = 17 * s;
  const preferA = side
    ? (knee: Pt) => -knee.y
    : (knee: Pt) => -knee.x;
  const preferB = side
    ? (knee: Pt) => -knee.y
    : (knee: Pt) => knee.x;
  const kneeA = ik(hip, footA, thigh, shin, preferA);
  const kneeB = ik(hip, footB, thigh, shin, preferB);
  const pants = look.pants;
  const hi = tone(pants, 28);
  capsule(ctx, hip, kneeA, 6.4 * s, pants, hi);
  capsule(ctx, kneeA, { x: footA.x, y: footA.y - 3 * s }, 5.1 * s, tone(pants, 8), hi);
  capsule(ctx, hip, kneeB, 6.4 * s, pants, hi);
  capsule(ctx, kneeB, { x: footB.x, y: footB.y - 3 * s }, 5.1 * s, tone(pants, 8), hi);
  shoe(ctx, footA, s, look.shoe);
  shoe(ctx, footB, s, look.shoe);
}

function shoe(ctx: CanvasRenderingContext2D, foot: Pt, s: number, color: string): void {
  roundRect(ctx, foot.x - 7 * s, foot.y - 3.5 * s, 14 * s, 7 * s, 3 * s);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = tone(color, 24);
  ctx.fillRect(foot.x - 5 * s, foot.y - 3 * s, 6 * s, 2 * s);
}

function drawStanding(ctx: CanvasRenderingContext2D, actor: PaintActor, layout: ReturnType<typeof layoutBoard>, time: number): void {
  const look = LOOK[actor.archetype];
  const cell = layout.cell;
  const s = (cell / 64) * 1.12;
  const start = groundPoint(layout, actor.fromX, actor.fromY);
  const end = groundPoint(layout, actor.toX, actor.toY);
  const frame = actor.pose === "walk" ? strideFrame(actor.walkT) : null;
  const bodyT = frame ? frame.bodyT : 0;
  const shadow = { x: start.x + (end.x - start.x) * bodyT, y: start.y + (end.y - start.y) * bodyT };
  const hop = frame ? frame.hop * cell * 0.34 : 0;
  const breathe = actor.pose === "idle" ? Math.sin(time * 2.2) * s * 1.3 : 0;
  const hip: Pt = { x: shadow.x, y: shadow.y - 30 * s - hop - breathe };
  const aheadT = frame ? frame.leadT : 0;
  const backT = frame ? frame.trailT : 0;
  const ahead: Pt = {
    x: start.x + (end.x - start.x) * aheadT,
    y: start.y + (end.y - start.y) * aheadT - (frame ? frame.leadLift * cell * 0.24 : 0),
  };
  const behind: Pt = {
    x: start.x + (end.x - start.x) * backT,
    y: start.y + (end.y - start.y) * backT - (frame ? frame.trailLift * cell * 0.3 : 0),
  };
  const side = actor.face === "left" || actor.face === "right";
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const lateral = (actor.pose === "walk" ? 13 : 8) * s;
  if (actor.pose !== "walk") {
    ahead.x = shadow.x - lateral;
    behind.x = shadow.x + lateral;
    ahead.y = shadow.y;
    behind.y = shadow.y;
    if (side) {
      const sign = actor.face === "right" ? 1 : -1;
      ahead.x = shadow.x + sign * 6 * s;
      behind.x = shadow.x - sign * 3 * s;
    }
  } else if (horiz) {
    ahead.y -= 4 * s;
    behind.y += 4 * s;
  } else {
    ahead.x -= lateral;
    behind.x += lateral;
  }
  if (actor.lead === "R") {
    const swapX = ahead.x;
    const swapY = ahead.y;
    ahead.x = behind.x;
    ahead.y = behind.y;
    behind.x = swapX;
    behind.y = swapY;
  }

  ctx.save();
  const liftScale = 1 - (frame ? frame.hop * 0.25 : 0);
  ctx.fillStyle = "rgba(20, 12, 10, 0.38)";
  ctx.beginPath();
  ctx.ellipse(shadow.x, shadow.y + 2, 14 * s * liftScale, 6 * s * liftScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const squash = frame ? frame.squash : 1;
  const cloth = actor.hidden ? mix(look.cloth, INK, 0.45) : look.cloth;
  const pants = actor.hidden ? mix(look.pants, INK, 0.45) : look.pants;
  const painted = { ...look, cloth, pants };
  drawLimbs(ctx, hip, ahead, behind, s, painted, side);

  if (look.skirt) {
    ctx.beginPath();
    ctx.moveTo(hip.x - 12 * s, hip.y);
    ctx.lineTo(hip.x + 12 * s, hip.y);
    ctx.lineTo(hip.x + 15 * s, hip.y + 16 * s);
    ctx.lineTo(hip.x - 15 * s, hip.y + 16 * s);
    ctx.closePath();
    ctx.fillStyle = cloth;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.strokeStyle = look.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hip.x - 14 * s, hip.y + 14 * s);
    ctx.lineTo(hip.x + 14 * s, hip.y + 14 * s);
    ctx.stroke();
  }

  const torsoY = hip.y - 14 * s * squash;
  blob(ctx, hip.x, torsoY, 24 * s, 24 * s * squash, cloth, tone(cloth, 32), 8 * s);
  if (look.skirt || actor.archetype === "veil-coat") {
    ctx.fillStyle = look.accent;
    ctx.fillRect(hip.x - 8 * s, torsoY + 4 * s, 16 * s, 3 * s);
  }

  const armSwing = frame ? Math.sin(actor.walkT * Math.PI) * 8 * s : 0;
  const shoulderY = torsoY - 4 * s;
  if (actor.pose === "alert") {
    capsule(ctx, { x: hip.x - 10 * s, y: shoulderY }, { x: hip.x - 14 * s, y: shoulderY - 16 * s }, 4.2 * s, cloth, tone(cloth, 24));
    capsule(ctx, { x: hip.x + 10 * s, y: shoulderY }, { x: hip.x + 14 * s, y: shoulderY - 16 * s }, 4.2 * s, cloth, tone(cloth, 24));
  } else {
    capsule(ctx, { x: hip.x - 11 * s, y: shoulderY }, { x: hip.x - 14 * s, y: shoulderY + 12 * s + armSwing }, 4.3 * s, cloth, tone(cloth, 24));
    capsule(ctx, { x: hip.x + 11 * s, y: shoulderY }, { x: hip.x + 14 * s, y: shoulderY + 12 * s - armSwing }, 4.3 * s, cloth, tone(cloth, 24));
  }

  if (look.rifle) {
    capsule(ctx, { x: hip.x + 8 * s, y: shoulderY + 2 * s }, { x: hip.x + 16 * s, y: hip.y + 8 * s }, 2.6 * s, "#5a4030", "#8a6848");
    capsule(ctx, { x: hip.x + 14 * s, y: hip.y + 6 * s }, { x: hip.x + 18 * s, y: hip.y + 20 * s }, 1.8 * s, "#2c2824", "#4a4440");
  }

  const head: Pt = { x: hip.x + (actor.pose === "alert" ? -2 * s : 0), y: torsoY - 18 * s };
  ctx.beginPath();
  ctx.arc(head.x, head.y, 13.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = actor.hidden ? mix(SKIN, INK, 0.45) : SKIN;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = actor.hidden ? mix(SKIN_HI, INK, 0.45) : SKIN_HI;
  ctx.lineWidth = 2;
  ctx.arc(head.x - 4 * s, head.y - 4 * s, 5 * s, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
  hat(ctx, look, head.x, head.y, s, actor.face);
  faceOn(ctx, look, head.x, head.y, s, actor, time);

  if (actor.mark !== "none") {
    const badge = actor.mark === "bang" ? CONE_RED : CONE_AMBER;
    ctx.beginPath();
    ctx.arc(head.x + 16 * s, head.y - 22 * s, 9 * s, 0, Math.PI * 2);
    ctx.fillStyle = badge;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `700 ${Math.round(12 * s)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(actor.mark === "bang" ? "!" : "?", head.x + 16 * s, head.y - 21 * s);
  }
  ctx.restore();
}

function drawDown(ctx: CanvasRenderingContext2D, actor: PaintActor, layout: ReturnType<typeof layoutBoard>): void {
  const look = LOOK[actor.archetype];
  const s = (layout.cell / 64) * 1.12;
  const g = groundPoint(layout, actor.toX, actor.toY);
  ctx.fillStyle = "rgba(20, 12, 10, 0.35)";
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, 20 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, g.x + 4 * s, g.y - 8 * s, 36 * s, 14 * s, look.cloth, tone(look.cloth, 24), 7 * s);
  ctx.beginPath();
  ctx.arc(g.x - 16 * s, g.y - 12 * s, 10 * s, 0, Math.PI * 2);
  ctx.fillStyle = SKIN_LO;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  eye(ctx, g.x - 18 * s, g.y - 13 * s, s, 0, 1, true);
  capsule(ctx, { x: g.x + 10 * s, y: g.y - 6 * s }, { x: g.x + 22 * s, y: g.y - 2 * s }, 4 * s, look.pants, tone(look.pants, 16));
  shoe(ctx, { x: g.x + 26 * s, y: g.y }, s, look.shoe);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(g.x + 8 * s, g.y - 20 * s, 4 * s, Math.PI, Math.PI * 1.7);
  ctx.stroke();
}

function tileIndex(tiles: PaintTile[]): Map<string, PaintTile> {
  const map = new Map<string, PaintTile>();
  for (const tile of tiles) map.set(tile.x + "," + tile.y, tile);
  return map;
}

/** Head and shoulders for the play HUD. Same inks as the board figurines. */
export function paintBust(ctx: CanvasRenderingContext2D, archetype: Archetype, x: number, y: number): void {
  const look = LOOK[archetype];
  const s = 1.15;
  blob(ctx, x, y + 16, 36 * s, 22 * s, look.cloth, tone(look.cloth, 28), 8);
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  hat(ctx, look, x, y, s, "down");
  faceOn(ctx, look, x, y, s, {
    archetype,
    face: "down",
    pose: "idle",
    walkT: 0,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    hidden: false,
    mark: "none",
    lead: "L",
  }, 1.2);
}

/** The whole room: floors, walls, props, people, and effects, one light and one outline. */
export function paintBoard(ctx: CanvasRenderingContext2D, model: PaintModel): void {
  const layout = layoutBoard(model.cols, model.rows);
  const known = tileIndex(model.tiles.filter((tile) => !tile.pit));
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 960, 540);

  for (let y = 0; y < model.rows; y += 1) {
    for (let x = 0; x < model.cols; x += 1) {
      if (known.has(x + "," + y)) continue;
      const left = known.has(x - 1 + "," + y) || known.has(x - 2 + "," + y);
      const right = known.has(x + 1 + "," + y) || known.has(x + 2 + "," + y);
      const near = known.has(x - 1 + "," + y) || known.has(x + 1 + "," + y) || known.has(x + "," + (y - 1)) || known.has(x + "," + (y + 1));
      if (!near) continue;
      const rect = cellRect(layout, x, y);
      if (left && right) drawPit(ctx, rect.x, rect.y, layout.cell);
      else drawWall(ctx, rect.x, rect.y, layout.cell, hash(x, y));
    }
  }

  for (const tile of model.tiles) {
    if (tile.pit) continue;
    const rect = cellRect(layout, tile.x, tile.y);
    drawFloor(ctx, rect.x, rect.y, layout.cell, tile);
  }

  for (const cone of model.cones) {
    const color = cone.tone === "red" ? CONE_RED : cone.tone === "amber" ? CONE_AMBER : CONE_GOLD;
    const ghost = cone.alpha < 0.25;
    for (const cell of cone.cells) {
      const rect = cellRect(layout, cell.x, cell.y);
      roundRect(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, 8);
      if (!ghost) {
        ctx.globalAlpha = cone.alpha;
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = ghost ? 0.55 : 0.95;
      ctx.lineWidth = ghost ? 2 : 3;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  for (const mark of model.highlights) {
    const rect = cellRect(layout, mark.x, mark.y);
    ctx.strokeStyle = GOLD_LINE;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const tile of model.tiles) {
    if (tile.pit || !tile.prop) continue;
    const g = groundPoint(layout, tile.x, tile.y);
    drawProp(ctx, tile.prop, g.x, g.y - layout.cell * 0.28, layout.cell, model.time);
    if (tile.gleam) {
      const rect = cellRect(layout, tile.x, tile.y);
      const pulse = 0.45 + Math.sin(model.time * 3) * 0.35;
      ctx.strokeStyle = tile.gleam === "cyan" ? GLEAM : GOLD_LINE;
      ctx.globalAlpha = pulse;
      ctx.lineWidth = 3;
      roundRect(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (tile.label && !tile.locked) {
      const rect = cellRect(layout, tile.x, tile.y);
      ctx.fillStyle = PAPER;
      roundRect(ctx, rect.x + 2, rect.y + rect.h - 16, rect.w - 4, 14, 3);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = "600 9px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tile.label, rect.x + rect.w / 2, rect.y + rect.h - 9, rect.w - 8);
    }
    if (tile.locked) {
      const g2 = groundPoint(layout, tile.x, tile.y);
      capsule(ctx, { x: g2.x - 12, y: g2.y - 16 }, { x: g2.x + 12, y: g2.y - 16 }, 3, BRASS_LO, BRASS);
    }
  }

  for (const ghost of model.ghosts) {
    const g = groundPoint(layout, ghost.x, ghost.y);
    ctx.globalAlpha = ghost.alpha;
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(g.x, g.y - 4, 10, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const ring of model.rings) {
    const rect = cellRect(layout, ring.x, ring.y);
    ctx.globalAlpha = ring.alpha;
    ctx.strokeStyle = CONE_AMBER;
    ctx.lineWidth = 3;
    roundRect(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const sorted = [...model.actors].sort((a, b) => groundPoint(layout, a.toX, a.toY).y - groundPoint(layout, b.toX, b.toY).y);
  for (const actor of sorted) {
    if (actor.pose === "down") drawDown(ctx, actor, layout);
    else drawStanding(ctx, actor, layout, model.time);
  }

  if (model.pebble) {
    blob(ctx, model.pebble.x, model.pebble.y, 8, 6, SHADOW_DEEP, tone(SHADOW, 20), 3);
  }
  for (const bit of model.particles) {
    ctx.globalAlpha = bit.a;
    ctx.fillStyle = bit.color;
    ctx.beginPath();
    ctx.arc(bit.x, bit.y, bit.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (model.flash > 0) {
    ctx.globalAlpha = model.flash * 0.45;
    ctx.fillStyle = "#fff4e0";
    ctx.fillRect(0, 0, 960, 540);
    ctx.globalAlpha = 1;
  }
  if (model.fade > 0) {
    ctx.globalAlpha = model.fade;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, 960, 540);
    ctx.globalAlpha = 1;
  }
}
