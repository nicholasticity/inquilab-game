import {
  CAPTION,
  LNAME,
  NAMES,
  TS,
  VH,
  VW,
  epilogue,
  type Guard,
  type World,
} from "./game";

export interface ArtBook {
  bg: Record<string, HTMLImageElement>;
  portrait: Record<string, HTMLImageElement>;
  tile: Record<string, HTMLImageElement>;
  sheet: Record<string, HTMLImageElement>;
}

interface Palette {
  floor: string;
  dark: string;
  lit: string;
  wall: string;
  top: string;
  grass: string;
  wood: string;
}

const PALETTE: Palette[] = [
  { floor: "#3a342c", dark: "#241e22", lit: "#4a4034", wall: "#6a5344", top: "#8d6e56", grass: "#3e5a3a", wood: "#8a6244" },
  { floor: "#3a342c", dark: "#241c20", lit: "#5a4636", wall: "#6e5646", top: "#907058", grass: "#3f5a38", wood: "#8a6244" },
  { floor: "#2c3438", dark: "#1a2226", lit: "#3e4a46", wall: "#59645e", top: "#748078", grass: "#3a5244", wood: "#7a6248" },
  { floor: "#3a2c26", dark: "#241814", lit: "#5a3a2c", wall: "#6a4538", top: "#8a5c48", grass: "#4a4030", wood: "#9a6844" },
  { floor: "#3a3834", dark: "#262420", lit: "#524c44", wall: "#6e6a60", top: "#8e8878", grass: "#4a5240", wood: "#8a704c" },
  { floor: "#2a3034", dark: "#181c20", lit: "#3a4448", wall: "#4e585c", top: "#6a7478", grass: "#3a4840", wood: "#6a5844" },
  { floor: "#34282a", dark: "#1e1618", lit: "#4a3834", wall: "#5c403c", top: "#7a584c", grass: "#3e4834", wood: "#8a6848" },
];

const AGENT_COLOR: Record<string, string> = {
  kite: "#c4a06a",
  veil: "#2f6d54",
  key: "#8a5a32",
};

/** Draws the world larger than the sim, so the painted figures read on a phone. */
const ZOOM = 1.8;
const SPRITE_H = 78;

const BODY: Record<string, string> = {
  kite: "scout",
  veil: "sari",
  key: "lockpick",
  constable: "constable",
  officer: "officer",
  soldier: "soldier",
};

const lastSpot = new Map<string, { x: number; y: number }>();

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function tileChar(w: World, tx: number, ty: number): string {
  if (tx < 0 || ty < 0 || tx >= w.cols || ty >= w.rows) return "#";
  return w.tiles[ty]?.[tx] ?? "#";
}

function sightBlocked(w: World, x: number, y: number): boolean {
  const tx = Math.floor(x / TS);
  const ty = Math.floor(y / TS);
  const ch = tileChar(w, tx, ty);
  if (ch === "#" || ch === "c") return true;
  if (ch === "=") return !w.locks.some((l) => l.x === tx && l.y === ty && l.open);
  return false;
}

function coneRange(g: Guard): number {
  return g.ai === "alert" ? g.range * 1.05 : g.range;
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  ctx.fillStyle = "#100c0e";
  ctx.fillRect(0, 0, VW, VH);
  if (w.mode === "title" || w.mode === "select") {
    drawTitle(ctx, w, art);
    return;
  }
  if (w.mode === "finale") {
    drawFinale(ctx, w, art);
    return;
  }
  drawMap(ctx, w, art);
  drawChrome(ctx, w, art);
}

function drawTitle(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const pic = art.bg.title;
  if (pic) ctx.drawImage(pic, 0, 0, VW, VH);
  else {
    ctx.fillStyle = "#1a1214";
    ctx.fillRect(0, 0, VW, VH);
  }
  for (const q of w.rain) {
    ctx.strokeStyle = "rgba(210, 220, 232, 0.35)";
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(q.x - 2, q.y + 10);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(8, 6, 8, 0.42)";
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "#f3ddb0";
  ctx.font = "700 64px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillText("INQUILAB", 64, 168);
  ctx.font = "24px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillStyle = "#e7c98a";
  ctx.fillText("Shadow Raj", 68, 206);
  ctx.font = "16px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillStyle = "#d7c4a0";
  ctx.fillText("A covert uprising. Three spies. One column.", 68, 242);
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillStyle = "#c8b090";
  ctx.fillText(w.mode === "select" ? "Choose a mission" : "Press Enter to begin     P for missions", 68, 300);
  ctx.fillText("Sneak the cones. Hide. Choose. If they see you, break the line.", 68, 430);
}

function drawFinale(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const pic = art.bg.finale;
  if (pic) ctx.drawImage(pic, 0, 0, VW, VH);
  ctx.fillStyle = "rgba(6, 4, 6, " + String(clamp(w.t / 2.4, 0.2, 0.72)) + ")";
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "#f6e6c0";
  ctx.font = "700 28px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillText("The gate is open.", 64, 64);
  ctx.font = "16px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillStyle = "#e6d7b4";
  let y = 104;
  for (const line of epilogue(w)) {
    y = wrap(ctx, line, 64, y, 820, 22) + 8;
  }
  if (w.t > 8) {
    ctx.fillStyle = "#c8b490";
    ctx.font = "15px system-ui, sans-serif";
    ctx.fillText("Press Enter to return", 64, 512);
  }
}

function drawMap(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const pal = PALETTE[w.level] ?? PALETTE[1] ?? PALETTE[0];
  if (!pal) return;
  ctx.save();
  ctx.translate(VW / 2, VH / 2);
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-VW / 2, -VH / 2);
  const x0 = Math.max(0, Math.floor(w.camX / TS) - 1);
  const y0 = Math.max(0, Math.floor(w.camY / TS) - 1);
  const x1 = Math.min(w.cols - 1, Math.ceil((w.camX + VW) / TS) + 1);
  const y1 = Math.min(w.rows - 1, Math.ceil((w.camY + VH) / TS) + 1);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = tileChar(w, tx, ty);
      if (ch === "#") continue;
      drawFloor(ctx, w, art, pal, tx, ty, ch);
    }
  }
  drawFog(ctx, w);
  drawLamps(ctx, w);
  drawCones(ctx, w);
  const actors: { y: number; draw: () => void }[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = tileChar(w, tx, ty);
      const sx = tx * TS - w.camX;
      const sy = ty * TS - w.camY;
      if (ch === "=") actors.push({ y: (ty + 1) * TS, draw: () => drawDoor(ctx, w, pal, sx, sy, tx, ty) });
      else if (ch === "n") actors.push({ y: (ty + 1) * TS, draw: () => drawCrowd(ctx, sx, sy) });
      else if (ch === "v") actors.push({ y: (ty + 1) * TS, draw: () => drawVent(ctx, pal, sx, sy) });
      const prop = propOn(w, ch, tx, ty);
      if (prop) actors.push({ y: (ty + 1) * TS, draw: () => drawProp(ctx, art, w, prop, (tx + 0.5) * TS, (ty + 1) * TS) });
    }
  }
  for (const extra of dressing(w.level)) {
    actors.push({ y: (extra.ty + 1) * TS, draw: () => drawProp(ctx, art, w, extra.key, (extra.tx + 0.5) * TS, (extra.ty + 1) * TS) });
  }
  for (const lamp of w.lamps) {
    actors.push({ y: lamp.y, draw: () => drawProp(ctx, art, w, "lamp", lamp.x, lamp.y + 6) });
  }
  for (const g of w.guards) {
    if (g.stashed) continue;
    actors.push({ y: g.y, draw: () => drawGuard(ctx, w, art, g) });
  }
  actors.push({ y: w.player.y, draw: () => drawPlayer(ctx, w, art) });
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) actor.draw();
  if (w.pebble) {
    ctx.fillStyle = "#d7c4a0";
    ctx.beginPath();
    ctx.arc(w.pebble.x - w.camX, w.pebble.y - w.camY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (tileChar(w, tx, ty) !== "#") continue;
      const sx = tx * TS - w.camX;
      const sy = ty * TS - w.camY;
      drawWall(ctx, art, pal, sx, sy, tx, ty);
      if (w.level === 5 && ty === 9 && tx >= 5 && tx <= 16 && tx !== 8) {
        drawProp(ctx, art, w, "bars", (tx + 0.5) * TS, (ty + 1) * TS - 2);
      }
    }
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(VW * 0.5, VH * 0.42, 180, VW * 0.5, VH * 0.5, 560);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VW, VH);
}

function floorName(level: number, ch: string): string {
  if (ch === "g") return "garden";
  if (ch === ".") {
    if (level === 1) return "bazaar";
    if (level === 2) return "railyard";
    if (level === 3) return "workshop";
    if (level === 4) return "assembly";
    if (level === 5) return "prison";
    return "palace";
  }
  if (level === 2) return "railyard";
  if (level === 3) return "workshop";
  if (level === 4) return "assembly";
  if (level === 5) return "prison";
  if (level === 6 && ch !== "v") return "palace";
  return "rooftop";
}

function propOn(w: World, ch: string, tx: number, ty: number): string {
  if (ch === "c") return "crate";
  if (ch === "h") return w.level === 1 || w.level === 6 ? "haycart" : "laundry";
  if (ch === "g") return "tree";
  void tx;
  void ty;
  return "";
}

function dressing(level: number): { tx: number; ty: number; key: string }[] {
  if (level === 1) return [{ tx: 12, ty: 7, key: "stall" }, { tx: 22, ty: 13, key: "stall" }];
  if (level === 2) return [{ tx: 16, ty: 5, key: "carriage" }];
  if (level === 3) return [{ tx: 30, ty: 7, key: "press" }, { tx: 32, ty: 12, key: "desk" }];
  if (level === 4) return [{ tx: 7, ty: 10, key: "desk" }];
  if (level === 5) return [{ tx: 26, ty: 4, key: "guardpost" }, { tx: 20, ty: 7, key: "sandbags" }];
  if (level === 6) return [{ tx: 11, ty: 8, key: "sandbags" }, { tx: 24, ty: 8, key: "guardpost" }];
  return [];
}

function blitWrapped(ctx: CanvasRenderingContext2D, im: HTMLImageElement, sx: number, sy: number, u: number, v: number): void {
  const span = im.naturalWidth || 512;
  const u0 = ((u % span) + span) % span;
  const v0 = ((v % span) + span) % span;
  const w1 = Math.min(TS, span - u0);
  const h1 = Math.min(TS, span - v0);
  ctx.drawImage(im, u0, v0, w1, h1, sx, sy, w1, h1);
  if (w1 < TS) ctx.drawImage(im, 0, v0, TS - w1, h1, sx + w1, sy, TS - w1, h1);
  if (h1 < TS) ctx.drawImage(im, u0, 0, w1, TS - h1, sx, sy + h1, w1, TS - h1);
  if (w1 < TS && h1 < TS) ctx.drawImage(im, 0, 0, TS - w1, TS - h1, sx + w1, sy + h1, TS - w1, TS - h1);
}

function drawFloor(
  ctx: CanvasRenderingContext2D,
  w: World,
  art: ArtBook,
  pal: Palette,
  tx: number,
  ty: number,
  ch: string,
): void {
  const sx = tx * TS - w.camX;
  const sy = ty * TS - w.camY;
  const painted = art.tile[floorName(w.level, ch)];
  if (painted) {
    const span = painted.naturalWidth || 512;
    blitWrapped(ctx, painted, sx, sy, Math.floor((tx * TS) % span), Math.floor((ty * TS) % span));
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.globalCompositeOperation = "multiply";
    blitWrapped(ctx, painted, sx, sy, Math.floor((tx * TS + 230) % span), Math.floor((ty * TS + 170) % span));
    ctx.restore();
    const n = hash(Math.floor(tx / 3) * 11 + Math.floor(ty / 3) * 7 + w.level);
    if (n > 0.78) {
      ctx.fillStyle = "rgba(48, 28, 16, 0.16)";
      ctx.beginPath();
      ctx.ellipse(sx + 8 + (n - 0.78) * 40, sy + 6 + hash(tx * 5 + ty) * 16, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const dark = ch === "," || ch === "v" || ch === "h" || ch === "n";
    ctx.fillStyle = ch === "." ? pal.lit : ch === "g" ? pal.grass : dark ? pal.dark : pal.floor;
    ctx.fillRect(sx, sy, TS, TS);
  }
}

function drawFog(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.save();
  ctx.fillStyle = "rgba(14, 10, 16, 0.55)";
  ctx.fillRect(0, 0, VW, VH);
  ctx.globalCompositeOperation = "destination-out";
  const punch = (x: number, y: number, inner: number, outer: number, strength: number) => {
    const g = ctx.createRadialGradient(x, y, inner, x, y, outer);
    g.addColorStop(0, "rgba(0,0,0," + String(strength) + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, outer, 0, Math.PI * 2);
    ctx.fill();
  };
  punch(w.player.x - w.camX, w.player.y - w.camY, 36, 200, 1);
  for (const lamp of w.lamps) {
    if (!lamp.on) continue;
    punch(lamp.x - w.camX, lamp.y - w.camY, 10, lamp.r, 0.92);
  }
  ctx.restore();
}

function drawWall(ctx: CanvasRenderingContext2D, art: ArtBook, pal: Palette, sx: number, sy: number, tx: number, ty: number): void {
  const sheet = art.tile.wall;
  if (sheet) {
    ctx.drawImage(sheet, sx, sy - 12, TS, TS + 12);
    return;
  }
  ctx.fillStyle = pal.wall;
  ctx.fillRect(sx, sy, TS, TS);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(sx, sy + TS - 6, TS, 6);
  ctx.fillStyle = pal.top;
  ctx.fillRect(sx, sy - 12, TS, 14);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(sx, sy - 12, TS, 3);
  const crack = hash(tx * 3 + ty * 11);
  if (crack > 0.72) {
    ctx.strokeStyle = "rgba(40, 24, 16, 0.35)";
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 6);
    ctx.lineTo(sx + 14, sy + 16);
    ctx.stroke();
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, w: World, pal: Palette, sx: number, sy: number, tx: number, ty: number): void {
  const open = w.locks.some((l) => l.x === tx && l.y === ty && l.open);
  if (open) {
    ctx.fillStyle = pal.dark;
    ctx.fillRect(sx, sy, TS, TS);
    ctx.fillStyle = pal.top;
    ctx.fillRect(sx, sy, 4, TS);
    ctx.fillRect(sx + TS - 4, sy, 4, TS);
    return;
  }
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(sx + 4, sy + 2, TS - 8, TS - 4);
  ctx.fillStyle = "#8a6844";
  ctx.fillRect(sx + 6, sy + 4, TS - 12, TS - 8);
  ctx.fillStyle = "#e6c878";
  ctx.beginPath();
  ctx.arc(sx + 22, sy + 16, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrowd(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  const colors = ["#6a5348", "#c4b49a", "#3e4a44"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i] ?? "#666";
    ctx.beginPath();
    ctx.arc(sx + 8 + i * 8, sy + 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVent(ctx: CanvasRenderingContext2D, pal: Palette, sx: number, sy: number): void {
  ctx.fillStyle = pal.dark;
  ctx.fillRect(sx, sy, TS, TS);
  ctx.strokeStyle = "rgba(180, 160, 120, 0.35)";
  ctx.strokeRect(sx + 6, sy + 10, 20, 12);
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 10);
  ctx.lineTo(sx + 10, sy + 22);
  ctx.moveTo(sx + 16, sy + 10);
  ctx.lineTo(sx + 16, sy + 22);
  ctx.moveTo(sx + 22, sy + 10);
  ctx.lineTo(sx + 22, sy + 22);
  ctx.stroke();
}

function drawLamps(ctx: CanvasRenderingContext2D, w: World): void {
  for (const lamp of w.lamps) {
    if (!lamp.on) continue;
    const x = lamp.x - w.camX;
    const y = lamp.y - w.camY;
    const glow = ctx.createRadialGradient(x, y, 4, x, y, lamp.r);
    glow.addColorStop(0, "rgba(255, 214, 140, 0.38)");
    glow.addColorStop(1, "rgba(255, 180, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCones(ctx: CanvasRenderingContext2D, w: World): void {
  for (const g of w.guards) {
    if (g.ai === "down" || g.stashed) continue;
    const reach = coneRange(g);
    const spread = g.fov;
    const rays = 14;
    ctx.beginPath();
    ctx.moveTo(g.x - w.camX, g.y - w.camY);
    for (let i = 0; i <= rays; i++) {
      const ang = g.face - spread + (spread * 2 * i) / rays;
      let dist = reach;
      for (let s = 8; s <= reach; s += 8) {
        const x = g.x + Math.cos(ang) * s;
        const y = g.y + Math.sin(ang) * s;
        if (sightBlocked(w, x, y)) { dist = s; break; }
      }
      ctx.lineTo(g.x + Math.cos(ang) * dist - w.camX, g.y + Math.sin(ang) * dist - w.camY);
    }
    ctx.closePath();
    const hot = g.ai === "alert" || g.see;
    ctx.fillStyle = hot ? "rgba(226, 70, 50, 0.28)" : g.ai === "sus" || g.ai === "search" ? "rgba(230, 190, 70, 0.24)" : "rgba(240, 220, 140, 0.16)";
    ctx.fill();
  }
}

const PROP_SIZE: Record<string, { w: number; h: number }> = {
  crate: { w: 46, h: 42 },
  haycart: { w: 58, h: 52 },
  laundry: { w: 40, h: 42 },
  stall: { w: 64, h: 72 },
  lamp: { w: 18, h: 84 },
  desk: { w: 54, h: 42 },
  press: { w: 50, h: 58 },
  carriage: { w: 96, h: 28 },
  bars: { w: 44, h: 40 },
  tree: { w: 72, h: 70 },
  sandbags: { w: 54, h: 36 },
  guardpost: { w: 40, h: 64 },
};

function drawProp(ctx: CanvasRenderingContext2D, art: ArtBook, w: World, key: string, wx: number, wy: number): void {
  const im = art.tile[key];
  if (!im) return;
  const size = PROP_SIZE[key] ?? { w: 48, h: 48 };
  const sx = wx - w.camX - size.w / 2;
  const sy = wy - w.camY - size.h;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(sx + size.w / 2, wy - w.camY - 2, size.w * 0.28, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(im, sx, sy, size.w, size.h);
}

function facing(face: number, body: string): "down" | "up" | "left" | "right" {
  const c = Math.cos(face);
  const s = Math.sin(face);
  void body;
  if (Math.abs(s) >= Math.abs(c)) return s >= 0 ? "down" : "up";
  return c >= 0 ? "right" : "left";
}

function isMoving(id: string, x: number, y: number): boolean {
  const prev = lastSpot.get(id);
  lastSpot.set(id, { x, y });
  if (!prev) return false;
  return Math.hypot(x - prev.x, y - prev.y) > 0.2;
}

function drawFigure(
  ctx: CanvasRenderingContext2D,
  art: ArtBook,
  w: World,
  id: string,
  body: string,
  x: number,
  y: number,
  face: number,
  crouch: boolean,
  down: boolean,
): boolean {
  const dir = facing(face, body);
  const moving = isMoving(id, x, y);
  let frame = art.sheet[body + "-idle-" + dir] ?? art.sheet[body + "-idle-down"];
  let bob = 0;
  let squash = 1;
  let sway = 0;
  if (moving && dir === "down") {
    const step = Math.floor(w.time * 6) % 2 === 0 ? "a" : "b";
    frame = art.sheet[body + "-walk-down-" + step] ?? frame;
  } else if (moving) {
    bob = Math.sin(w.time * 10) * 2.4;
    squash = 1 + Math.sin(w.time * 10) * 0.045;
    sway = Math.sin(w.time * 5) * 1.8;
  }
  if (crouch) {
    squash *= 0.78;
    bob += 8;
  }
  const sx = x - w.camX;
  const sy = y - w.camY;
  if (!frame) return false;
  const h = SPRITE_H * squash;
  const dw = frame.naturalWidth / Math.max(1, frame.naturalHeight) * h;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 4, dw * 0.28, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (down) {
    ctx.save();
    ctx.translate(sx, sy + 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(frame, -h * 0.35, -dw * 0.35, h * 0.7, dw * 0.55);
    ctx.restore();
    return true;
  }
  ctx.drawImage(frame, sx - dw / 2 + sway, sy - h + 10 + bob, dw, h);
  return true;
}

function drawPlayer(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const p = w.player;
  if (p.hidden) return;
  const body = p.disguise ? "constable" : (BODY[w.agent] ?? "scout");
  const x = p.x;
  const y = p.y;
  const painted = drawFigure(ctx, art, w, "player", body, x, y, p.face, p.crouch, false);
  if (!painted) {
    drawBody(ctx, x - w.camX, y - w.camY, p.face, p.disguise ? "#8a7a52" : (AGENT_COLOR[w.agent] ?? "#c4a06a"), p.crouch, w.agent === "veil" && !p.disguise);
  }
  if (p.channel > 0) {
    ctx.strokeStyle = "#f0d090";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - w.camX, y - w.camY, 18, -Math.PI / 2, -Math.PI / 2 + (p.channel / 0.85) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx: CanvasRenderingContext2D, w: World, art: ArtBook, g: Guard): void {
  const body = BODY[g.kind] ?? "constable";
  const down = g.ai === "down";
  const gid = g.kind + ":" + String(Math.round(g.homeX)) + ":" + String(Math.round(g.homeY));
  const painted = drawFigure(ctx, art, w, gid, body, g.x, g.y, g.face, false, down);
  if (!painted) {
    const color = g.kind === "officer" ? "#7a3030" : g.kind === "soldier" ? "#5a6840" : "#8a7a52";
    drawBody(ctx, g.x - w.camX, g.y - w.camY, g.face, color, false, false);
  }
  if (g.ai === "sus" || g.ai === "search" || g.ai === "alert") {
    ctx.fillStyle = g.ai === "alert" ? "#e24b3a" : "#f0d090";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(g.ai === "alert" ? "!" : "?", g.x - w.camX, g.y - w.camY - SPRITE_H - 4);
    ctx.textAlign = "left";
  }
}

function drawBody(ctx: CanvasRenderingContext2D, x: number, y: number, face: number, color: string, crouch: boolean, shawl: boolean): void {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + 8, crouch ? 11 : 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = crouch ? 4 : 0;
  ctx.fillStyle = "#f6e6c0";
  ctx.beginPath();
  ctx.arc(x, y - 2 + bob, crouch ? 11 : 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + bob, crouch ? 8 : 7.5, crouch ? 6 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a120c";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = shawl ? "#1d4a38" : "#f0d2b0";
  ctx.beginPath();
  ctx.arc(x + Math.cos(face) * 3, y - 11 + bob, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(20, 12, 8, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + bob);
  ctx.lineTo(x + Math.cos(face) * 11, y + Math.sin(face) * 11 + bob);
  ctx.stroke();
}

function drawChrome(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  if (w.mode === "play" || w.mode === "dead" || w.mode === "done" || w.mode === "pause") drawHud(ctx, w, art);
  if (w.prompt && w.mode === "play") {
    ctx.fillStyle = "rgba(6, 4, 6, 0.45)";
    ctx.fillRect(0, 0, VW, VH);
  }
  if (w.bannerT > 0 && w.banner && w.mode !== "done" && w.mode !== "talk") {
    const intro = w.banner === (LNAME[w.level] ?? "");
    const alpha = w.bannerT > 1.6 ? clamp((2.1 - w.bannerT) / 0.35, 0, 1) : clamp(w.bannerT / 0.5, 0, 1);
    if (intro) drawIntro(ctx, w, alpha);
    else drawToast(ctx, w.banner, alpha);
  }
  if (w.mode === "talk") drawTalk(ctx, w, art);
  if (w.mode === "done") drawDone(ctx, w);
}

function drawHud(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const portrait = art.portrait[w.agent];
  ctx.save();
  ctx.beginPath();
  ctx.arc(40, 40, 22, 0, Math.PI * 2);
  ctx.clip();
  if (portrait) drawCover(ctx, portrait, 18, 18, 44, 44, 0.18);
  else {
    ctx.fillStyle = "#3a2a22";
    ctx.fillRect(18, 18, 44, 44);
  }
  ctx.restore();
  ctx.strokeStyle = w.phaseT > 0 ? "#e24b3a" : "rgba(243, 230, 192, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(40, 40, 23, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(w.phaseT / 4.2, 0, 1));
  ctx.stroke();

  const barX = 72;
  ctx.fillStyle = "rgba(20, 12, 12, 0.72)";
  roundRect(ctx, barX, 22, 130, 8, 4);
  ctx.fill();
  const det = clamp(w.detect, 0, 1);
  ctx.fillStyle = det > 0.72 ? "#e24b3a" : det > 0.28 ? "#e7c56a" : "#9aaf78";
  if (det > 0) {
    roundRect(ctx, barX, 22, Math.max(6, 130 * det), 8, 4);
    ctx.fill();
  }
  ctx.font = "700 11px system-ui, sans-serif";
  const eye = w.player.hidden ? "HIDDEN" : w.phaseT > 0 ? "ALERT" : w.chase ? "RUN" : w.player.disguise ? "DISGUISED" : w.lit ? "LIT" : det > 0.2 ? "WATCHED" : "UNSEEN";
  ctx.fillStyle = w.player.hidden ? "#d7ecc0" : w.phaseT > 0 ? "#f0a090" : "#f6e6c0";
  ctx.fillText(eye, barX, 48);
  ctx.fillStyle = "#c8b090";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText(w.actLabel, barX, 64);

  drawRadar(ctx, w);

  const obj = w.obj || "";
  let objSize = 13;
  ctx.font = "600 " + String(objSize) + "px system-ui, sans-serif";
  while (objSize > 11 && ctx.measureText(obj).width > 420) {
    objSize -= 1;
    ctx.font = "600 " + String(objSize) + "px system-ui, sans-serif";
  }
  const pillW = Math.min(460, Math.max(120, ctx.measureText(obj).width + 28));
  const pillX = (VW - pillW) / 2;
  ctx.fillStyle = "rgba(12, 8, 8, 0.72)";
  roundRect(ctx, pillX, 10, pillW, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(226, 188, 122, 0.45)";
  ctx.stroke();
  ctx.fillStyle = "#f6e6c0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(obj, VW / 2, 23);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "right";
  ctx.fillStyle = "#f3e6c0";
  ctx.font = "700 16px system-ui, sans-serif";
  ctx.fillText(w.rank || clock(w.time), VW - 200, 22);
  ctx.textAlign = "left";
}

function drawRadar(ctx: CanvasRenderingContext2D, w: World): void {
  const cx = VW - 78;
  const cy = 78;
  const r = 46;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(8, 14, 12, 0.72)";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.strokeStyle = "rgba(180, 200, 160, 0.25)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  const scale = r / 220;
  for (const g of w.guards) {
    if (g.stashed) continue;
    const dx = (g.x - w.player.x) * scale;
    const dy = (g.y - w.player.y) * scale;
    if (dx * dx + dy * dy > r * r) continue;
    ctx.fillStyle = g.ai === "down" ? "#6a6048" : g.ai === "alert" ? "#e24b3a" : "#e6d090";
    ctx.fillRect(cx + dx - 1.5, cy + dy - 1.5, 3, 3);
    if (g.ai !== "down") {
      ctx.strokeStyle = "rgba(230, 208, 144, 0.45)";
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy);
      ctx.lineTo(cx + dx + Math.cos(g.face) * 10, cy + dy + Math.sin(g.face) * 10);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#f6e6c0";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(226, 188, 122, 0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIntro(ctx: CanvasRenderingContext2D, w: World, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(8, 6, 8, 0.62)";
  roundRect(ctx, 170, 150, VW - 340, 150, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(226, 188, 122, 0.55)";
  ctx.stroke();
  ctx.fillStyle = "#f6e6c0";
  ctx.font = "700 28px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.textAlign = "center";
  ctx.fillText(w.banner, VW / 2, 188);
  ctx.textAlign = "left";
  ctx.font = "15px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillStyle = "#d7c4a0";
  const cap = w.caption || (CAPTION[w.level] ?? "");
  if (cap) wrap(ctx, cap, VW / 2 - 210, 224, 420, 20);
  ctx.restore();
}

function drawToast(ctx: CanvasRenderingContext2D, text: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "700 16px system-ui, sans-serif";
  const width = Math.min(520, ctx.measureText(text).width + 36);
  const x = (VW - width) / 2;
  ctx.fillStyle = "rgba(8, 6, 8, 0.72)";
  roundRect(ctx, x, 78, width, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#f6e6c0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, VW / 2, 94);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawTalk(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const line = w.talk[w.talkI];
  if (!line) return;
  ctx.fillStyle = "rgba(10, 8, 10, 0.82)";
  ctx.fillRect(36, VH - 168, VW - 72, 136);
  ctx.strokeStyle = "rgba(226, 188, 122, 0.65)";
  ctx.strokeRect(36, VH - 168, VW - 72, 136);
  const portrait = line.port ? art.portrait[line.port] : undefined;
  if (portrait) drawCover(ctx, portrait, 52, VH - 152, 88, 108, 0.12);
  ctx.fillStyle = "#e8c878";
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.fillText(NAMES[line.who] ?? "", portrait ? 156 : 56, VH - 146);
  ctx.fillStyle = "#f2ead8";
  ctx.font = "17px Georgia, 'Iowan Old Style', Palatino, serif";
  const shown = line.text.slice(0, Math.floor(w.talkShown));
  wrap(ctx, shown, portrait ? 156 : 56, VH - 120, portrait ? VW - 230 : VW - 130, 22);
}

function drawDone(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.fillStyle = "rgba(8, 6, 8, 0.62)";
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "#f6e6c0";
  ctx.font = "700 28px Georgia, 'Iowan Old Style', Palatino, serif";
  ctx.fillText(w.headline || "MISSION CLEAR", 64, 120);
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("Rank  " + w.rank + "     Time  " + w.time.toFixed(1) + "s", 64, 168);
  ctx.fillText((w.spotted ? "Seen" : "Unseen") + "     Subdued  " + String(w.heat) + "     Papers  " + String(w.notes), 64, 198);
  ctx.fillText("Caught  " + String(w.hitsTaken) + "     Netaji's trust  " + String(w.trust), 64, 228);
  ctx.fillStyle = "rgba(20, 12, 12, 0.7)";
  roundRect(ctx, 64, 252, 280, 12, 6);
  ctx.fill();
  ctx.fillStyle = "#c45a32";
  roundRect(ctx, 64, 252, Math.max(8, 280 * clamp(w.revolt / 100, 0, 1)), 12, 6);
  ctx.fill();
  ctx.fillStyle = "#d7c4a0";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("Rebellion  " + String(w.revolt), 64, 284);
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "#f6e6c0";
  ctx.fillText("Press Enter to continue", 64, 340);
}

function drawCover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, dx: number, dy: number, dw: number, dh: number, focusY: number): void {
  const ir = im.naturalWidth / Math.max(1, im.naturalHeight);
  const r = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = im.naturalWidth;
  let sh = im.naturalHeight;
  if (ir > r) {
    sw = sh * r;
    sx = (im.naturalWidth - sw) / 2;
  } else {
    sh = sw / r;
    sy = Math.max(0, Math.min(im.naturalHeight - sh, (im.naturalHeight - sh) * focusY));
  }
  ctx.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number): number {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
}

function clock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return String(Math.floor(s / 60)) + ":" + String(s % 60).padStart(2, "0");
}
