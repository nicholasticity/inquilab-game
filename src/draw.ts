import {
  CAPTION,
  LNAME,
  NAMES,
  VH,
  VW,
  allyFrame,
  foeFrame,
  playerFrame,
  type Ent,
  type World,
} from "./game";

/** Sheet cells were 96px tall and drawn at 1.42. Every painted frame uses that height. */
const DRAW_H = 96 * 1.42;

export interface ArtBook {
  bg: Record<string, HTMLImageElement>;
  portrait: Record<string, HTMLImageElement>;
  frame: Record<string, HTMLImageElement>;
  /** Tileable ground strips. Top of the image is the walk surface, the rest is the front face. */
  ground: Record<string, HTMLImageElement>;
  /** Period props, drawn only when a painting is loaded. */
  prop: Record<string, HTMLImageElement>;
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  footY: number,
  face: number,
  squash: number,
  flash: boolean,
): void {
  if (!img || img.naturalWidth <= 0) return;
  const scale = DRAW_H / img.naturalHeight;
  const dw = img.naturalWidth * scale * (1 + squash * 0.14);
  const dh = img.naturalHeight * scale * (1 - squash * 0.18);
  ctx.save();
  ctx.translate(x, footY);
  ctx.scale(face < 0 ? -1 : 1, 1);
  ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  if (flash) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  }
  ctx.restore();
}

function drawLayers(ctx: CanvasRenderingContext2D, art: ArtBook, key: string, cam: number, travel: number): void {
  const far = art.bg[key + "_far"];
  const mid = art.bg[key + "_mid"];
  ctx.fillStyle = "#100c10";
  ctx.fillRect(0, 0, VW, VH);
  if (far || mid) {
    if (far) {
      const slow = key === "station";
      drawScene(ctx, far, cam, travel, slow ? 0.22 : 0.5, slow ? 0.46 : 1);
    }
    if (mid) {
      const sky = key === "lahore" ? 0.48 : key === "press" ? 0.24 : key === "assembly" ? 0.16 : key === "cell" ? 0.2 : 0;
      if (sky > 0) drawSceneKeyed(ctx, mid, cam, travel, 0.94, sky);
      else drawScene(ctx, mid, cam, travel, 0.94, 1);
    }
    return;
  }
  drawBG(ctx, art.bg[key], cam * 0.28);
}

const LIP: Record<string, [string, string, string]> = {
  brick: ["#6b4a36", "#3d2a22", "#8a6248"],
  scaffold: ["#7a5a3a", "#4a3424", "#c4a074"],
  stone: ["#6a675f", "#3a3834", "#b7b1a6"],
  iron: ["#5c656e", "#2c333a", "#9aa6b0"],
  wood: ["#7a5340", "#3e281c", "#c4926a"],
  marble: ["#8a8478", "#4e4a44", "#e6dfd2"],
  cell: ["#5a5a58", "#2a2a28", "#8e8c86"],
};

function matName(level: number, t: number, k?: string): string {
  if (k) return k;
  if (t === 1 || t === 2) return "scaffold";
  if (level === 2) return t === 3 ? "iron" : "stone";
  if (level === 3) return "wood";
  if (level === 4) return "marble";
  if (level === 5) return "cell";
  return "brick";
}

function drawGround(ctx: CanvasRenderingContext2D, art: ArtBook, level: number, bg: string, pl: PlatLike): void {
  if (pl.t === 4) {
    ctx.fillStyle = "rgba(18,14,12,0.92)";
    for (let x = pl.x; x < pl.x + pl.w; x += 10) ctx.fillRect(x, pl.y, 4, pl.h);
    return;
  }
  const img = art.ground[bg];
  const ceiling = pl.t === 2 || pl.t === 5;
  if (img && img.naturalWidth > 0) {
    const scale = img.naturalHeight < 400 ? 0.24 : 0.175;
    const worldH = ceiling ? Math.max(pl.h, 28) : Math.round(img.naturalHeight * scale);
    const srcY = ceiling ? Math.round(img.naturalHeight * 0.42) : 0;
    const srcH = ceiling ? img.naturalHeight - srcY : img.naturalHeight;
    tileStrip(ctx, img, pl, worldH, srcY, srcH, worldH, bg === "station" || bg === "assembly");
    if (!ceiling) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(pl.x + 2, pl.y + worldH - 3, pl.w - 4, 8);
    }
    return;
  }
  const name = matName(level, pl.t, pl.k);
  const face = ceiling ? Math.max(pl.h, 24) : 78;
  const tone = LIP[name] ?? LIP.brick;
  const grd = ctx.createLinearGradient(0, pl.y, 0, pl.y + face);
  grd.addColorStop(0, tone[2] ?? "#c4a074");
  grd.addColorStop(0.14, tone[0] ?? "#6b4a36");
  grd.addColorStop(1, tone[1] ?? "#3d2a22");
  ctx.fillStyle = grd;
  ctx.fillRect(pl.x, pl.y, pl.w, face);
}

interface PlatLike { x: number; y: number; w: number; h: number; t: number; k?: string }

function drawSheet(ctx: CanvasRenderingContext2D, pap: { x: number; y: number; got: boolean } | undefined, t: number, i: number, color: string): void {
  if (!pap || pap.got) return;
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(pap.x, pap.y + Math.sin(t * 4 + i) * 4);
  ctx.rotate(-0.2);
  ctx.fillRect(0, 0, 16, 20);
  ctx.restore();
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function tileStrip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  pl: PlatLike,
  worldH: number,
  srcY: number,
  srcH: number,
  destH: number,
  varied: boolean,
): void {
  const seam = Math.round(img.naturalWidth * 0.05);
  const half = Math.floor(img.naturalWidth / 2) - seam;
  if (half < 8 || srcH < 2) return;
  const tileW = Math.max(88, Math.round(half * (worldH / img.naturalHeight)));
  const scramble = varied ? 1.67 : 1;
  const phase = ((pl.x * scramble) % tileW + tileW) % tileW;
  let x = pl.x - phase;
  let n = 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pl.x, pl.y - 1, pl.w, destH + 3);
  ctx.clip();
  while (x < pl.x + pl.w + 1 && n < 80) {
    const right = (Math.floor(pl.x * scramble / tileW) + n) % 2 === 1;
    const sx = right ? Math.ceil(img.naturalWidth / 2) + seam : 0;
    const dw = Math.min(tileW, pl.x + pl.w - x);
    if (dw <= 1) break;
    ctx.drawImage(img, sx, srcY, half * (dw / tileW), srcH, x, pl.y, dw, destH);
    if (varied) {
      const stain = hash(pl.x * 0.013 + n * 2.7);
      if (stain > 0.7) {
        ctx.fillStyle = "rgba(0,0,0," + (0.06 + (stain - 0.7) * 0.28).toFixed(3) + ")";
        ctx.beginPath();
        ctx.ellipse(x + dw * 0.5, pl.y + destH * 0.22, dw * 0.28, destH * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    x += tileW;
    n += 1;
  }
  ctx.restore();
}

function sceneBox(im: HTMLImageElement, cam: number, travel: number, amount: number): { ox: number; y: number; dw: number; dh: number } {
  const cover = Math.max(VH / im.naturalHeight, VW / im.naturalWidth);
  const scale = cover * 1.28;
  const dw = im.naturalWidth * scale;
  const dh = im.naturalHeight * scale;
  const slack = Math.max(0, dw - VW);
  const u = travel <= 1 ? 0 : Math.min(1, Math.max(0, cam) / travel);
  return { ox: -u * slack * amount, y: (VH - dh) * 0.42, dw, dh };
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  im: HTMLImageElement,
  cam: number,
  travel: number,
  amount: number,
  alpha: number,
): void {
  if (im.naturalWidth <= 0) return;
  const box = sceneBox(im, cam, travel, amount);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(im, box.ox, box.y, box.dw, box.dh);
  ctx.restore();
}

let scratch: HTMLCanvasElement | null = null;

function drawSceneKeyed(
  ctx: CanvasRenderingContext2D,
  im: HTMLImageElement,
  cam: number,
  travel: number,
  amount: number,
  sky: number,
): void {
  if (typeof document === "undefined") {
    drawScene(ctx, im, cam, travel, amount, 1);
    return;
  }
  if (!scratch) {
    scratch = document.createElement("canvas");
    scratch.width = VW;
    scratch.height = VH;
  }
  const g = scratch.getContext("2d");
  if (!g) {
    drawScene(ctx, im, cam, travel, amount, 1);
    return;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, VW, VH);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "medium";
  const box = sceneBox(im, cam, travel, amount);
  g.drawImage(im, box.ox, box.y, box.dw, box.dh);
  g.globalCompositeOperation = "destination-in";
  const fade = g.createLinearGradient(0, 0, 0, VH);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(Math.max(0.05, sky * 0.72), "rgba(0,0,0,0.05)");
  fade.addColorStop(Math.min(0.92, sky + 0.08), "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = fade;
  g.fillRect(0, 0, VW, VH);
  g.globalCompositeOperation = "source-over";
  ctx.drawImage(scratch, 0, 0);
}

function drawBG(ctx: CanvasRenderingContext2D, im: HTMLImageElement | undefined, cam: number): void {
  if (im && im.naturalWidth > 0) {
    const scale = Math.max(VH / im.naturalHeight, (VW + 80) / im.naturalWidth) * 1.12;
    const dw = im.naturalWidth * scale;
    const dh = im.naturalHeight * scale;
    const ox = -cam;
    const y = (VH - dh) * 0.35;
    ctx.drawImage(im, ox - 30, y, dw + 80, dh);
    if (ox + dw < VW + 40) ctx.drawImage(im, ox + dw * 0.55, y, dw + 80, dh);
    return;
  }
  ctx.fillStyle = "#140e12";
  ctx.fillRect(0, 0, VW, VH);
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  im: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const ir = im.naturalWidth / im.naturalHeight;
  const r = w / h;
  let sx = 0;
  let sy = 0;
  let sw = im.naturalWidth;
  let sh = im.naturalHeight;
  if (ir > r) {
    sw = sh * r;
    sx = (im.naturalWidth - sw) / 2;
  } else {
    sh = sw / r;
    sy = (im.naturalHeight - sh) * 0.15;
  }
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  const sx = w.shakeT > 0 ? (Math.random() - 0.5) * w.shake : 0;
  const sy = w.shakeT > 0 ? (Math.random() - 0.5) * w.shake : 0;
  ctx.save();
  ctx.translate(sx, sy);
  const bgKey = w.mode === "title" || w.mode === "select" ? "title" : w.mode === "finale" ? "finale" : w.bg;
  const scrolling = w.mode !== "title" && w.mode !== "select" && w.mode !== "finale";
  drawLayers(ctx, art, bgKey, scrolling ? w.camX : w.t * 12, scrolling ? Math.max(VW, w.width - VW) : VW);
  if (w.mode === "title" || w.mode === "select" || w.mode === "finale") {
    ctx.restore();
    drawFX(ctx, w);
    drawChrome(ctx, w, art);
    return;
  }
  ctx.save();
  ctx.translate(-Math.floor(w.camX), 0);
  for (let i = 0; i < w.plats.length; i++) {
    const pl = w.plats[i];
    if (!pl || pl.x + pl.w < w.camX - 40 || pl.x > w.camX + VW + 40) continue;
    drawGround(ctx, art, w.level, w.bg, pl);
  }
  for (let i = 0; i < w.plats.length; i++) {
    const pl = w.plats[i];
    if (!pl || pl.t === 2 || pl.t === 4 || pl.t === 5) continue;
    if (pl.x + pl.w < w.camX - 40 || pl.x > w.camX + VW + 40) continue;
    drawLip(ctx, art, w.bg, pl);
  }
  drawDressing(ctx, w);
  for (let i = 0; i < w.extras.length; i++) {
    const ex = w.extras[i];
    if (!ex || ex.x < w.camX - 80 || ex.x > w.camX + VW + 80) continue;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(ex.x, ex.y);
    ctx.scale(ex.sc, ex.sc);
    ctx.translate(-ex.x, -ex.y);
    drawSprite(ctx, art.frame[ex.frame], ex.x, ex.y, ex.face, 0, false);
    ctx.restore();
  }
  for (let i = 0; i < w.props.length; i++) {
    const prop = w.props[i];
    if (!prop) continue;
    const im = art.prop[prop.k];
    if (im && im.naturalWidth > 0) {
      const dh = 54;
      const dw = dh * (im.naturalWidth / im.naturalHeight);
      ctx.drawImage(im, prop.x, prop.y - dh + 16, dw, dh);
    } else drawProp(ctx, prop.x, prop.y, prop.k, w.t);
  }
  for (let i = 0; i < w.checks.length; i++) {
    const c = w.checks[i];
    if (!c) continue;
    ctx.fillStyle = c.used ? "rgba(220,190,110,0.95)" : "rgba(240,220,150,0.55)";
    ctx.fillRect(c.x, c.y - 70, 5, 70);
    ctx.fillRect(c.x, c.y - 70, 22, 14);
  }
  for (let i = 0; i < w.papers.length; i++) drawSheet(ctx, w.papers[i], w.t, i, "#f3e6bf");
  for (let i = 0; i < w.gems.length; i++) drawSheet(ctx, w.gems[i], w.t, i + 3, "#e7c56a");
  for (let i = 0; i < w.hazards.length; i++) {
    const h = w.hazards[i];
    if (!h) continue;
    const beam = Math.max(22, h.h);
    const grd = ctx.createLinearGradient(0, h.y, 0, h.y + beam);
    grd.addColorStop(0, "rgba(88,62,40,0.95)");
    grd.addColorStop(1, "rgba(28,18,12,0.95)");
    ctx.fillStyle = grd;
    ctx.fillRect(h.x, h.y, h.w, beam);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(h.x, h.y + beam - 4, h.w, 4);
  }
  if (w.level === 3 && w.fireX > -100) {
    const grd = ctx.createLinearGradient(w.fireX - 220, 0, w.fireX + 40, 0);
    grd.addColorStop(0, "rgba(180,40,10,0)");
    grd.addColorStop(0.6, "rgba(220,70,16,0.35)");
    grd.addColorStop(1, "rgba(255,160,40,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(w.fireX - 220, 0, 280, VH);
  }
  for (let i = 0; i < w.ghosts.length; i++) {
    const g = w.ghosts[i];
    if (!g) continue;
    ctx.globalAlpha = g.life * 0.45;
    drawSprite(ctx, art.frame[g.frame], g.x, g.y, g.face, 0, false);
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e || e.ai === "wait") continue;
    drawTell(ctx, e, w);
    const flash = (e.ai === "telegraph" && Math.floor(w.t * 14) % 2 === 0) || (e.inv > 0 && e.st === "hit");
    const scale = e.kind === "inspector" ? 1.12 : 1;
    drawActor(ctx, art, e, foeFrame(e), flash, scale);
  }
  for (let i = 0; i < w.bolts.length; i++) {
    const b = w.bolts[i];
    if (!b) continue;
    ctx.fillStyle = "#e7c56a";
    ctx.fillRect(b.x, b.y, 14, 4);
  }
  if (w.ally && w.ally.hp > 0) {
    drawActor(ctx, art, w.ally, allyFrame(w.ally), w.ally.inv > 0 && w.ally.st === "hit");
  }
  const p = w.player;
  const blink = p.inv > 0 && p.st !== "down" && Math.floor(w.t * 18) % 2 === 0;
  if (!blink || p.st === "dodge") {
    if (w.focus > 0) {
      ctx.strokeStyle = "rgba(255, 220, 140, 0.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 4, p.y - 6, p.w + 8, p.h + 8);
    }
    drawActor(ctx, art, p, playerFrame(p, w.t), p.st === "hit" || w.focus > 0.2);
  }
  if (w.level === 4 && w.gallery && w.leaflets >= 8 && w.markX > 0) {
    ctx.strokeStyle = "rgba(240,210,140,0.7)";
    ctx.strokeRect(w.markX - 70, 442, 140, 12);
  }
  if (w.fast && w.breadOn && w.days >= 90 && w.days < 112 && !w.broke) {
    ctx.fillStyle = "#e6d2a4";
    ctx.fillRect(w.breadX, 452, 18, 10);
  }
  if (p.x > w.exitX - 160 && w.level !== 4 && w.level !== 5) {
    ctx.fillStyle = "rgba(240,210,140,0.12)";
    ctx.fillRect(w.exitX - 10, 0, 80, VH);
  }
  ctx.restore();
  ctx.restore();
  drawFX(ctx, w);
  drawChrome(ctx, w, art);
}

function drawActor(
  ctx: CanvasRenderingContext2D,
  art: ArtBook,
  e: Ent,
  frame: string,
  flash: boolean,
  scale = 1,
): void {
  const foot = e.y + e.h + 1;
  if (e.onG && e.st !== "jump") {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w * 0.5, foot + 1, 16 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (scale === 1) {
    drawSprite(ctx, art.frame[frame], e.x + e.w * 0.5, foot, e.face, e.squash, flash);
    return;
  }
  ctx.save();
  ctx.translate(e.x + e.w * 0.5, foot);
  ctx.scale(scale, scale);
  ctx.translate(-(e.x + e.w * 0.5), -foot);
  drawSprite(ctx, art.frame[frame], e.x + e.w * 0.5, foot, e.face, e.squash, flash);
  ctx.restore();
}

function drawTell(ctx: CanvasRenderingContext2D, e: Ent, w: World): void {
  if (e.hp <= 0) return;
  if (e.kind === "shield" || (e.kind === "inspector" && e.ai === "guard")) {
    ctx.strokeStyle = "rgba(210, 190, 150, 0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const cx = e.x + e.w * 0.5 + e.face * 18;
    ctx.arc(cx, e.y + 36, 22, e.face > 0 ? -0.8 : Math.PI - 0.8, e.face > 0 ? 0.8 : Math.PI + 0.8);
    ctx.stroke();
  }
  if (e.ai === "aim") {
    ctx.strokeStyle = "rgba(226, 80, 50, 0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.5, e.y + 28);
    ctx.lineTo(w.player.x + w.player.w * 0.5, w.player.y + 24);
    ctx.stroke();
  }
  if (e.tag === "watch" && e.ai === "watch") {
    ctx.fillStyle = "rgba(226, 188, 122, 0.08)";
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.5, e.y + 24);
    ctx.lineTo(e.x + e.face * 180, e.y - 20);
    ctx.lineTo(e.x + e.face * 180, e.y + 70);
    ctx.fill();
  }
  if ((e.ai === "telegraph" || e.ai === "aim") && e.telMax > 0) {
    const u = clamp(e.stT / e.telMax, 0, 1);
    ctx.fillStyle = "rgba(20,12,12,0.7)";
    ctx.fillRect(e.x, e.y - 12, e.w, 4);
    ctx.fillStyle = u > 0.72 ? "#e24b3a" : "#e8c56a";
    ctx.fillRect(e.x, e.y - 12, e.w * u, 4);
  }
}

function drawLip(ctx: CanvasRenderingContext2D, art: ArtBook, bg: string, pl: PlatLike): void {
  const img = art.ground[bg];
  if (!img || img.naturalWidth <= 0) return;
  const scale = img.naturalHeight < 400 ? 0.24 : 0.175;
  const worldH = Math.round(img.naturalHeight * scale);
  const capSrc = Math.max(8, Math.round(img.naturalHeight * 0.2));
  const capH = Math.max(14, Math.round(worldH * 0.22));
  tileStrip(ctx, img, pl, worldH, 0, capSrc, capH, false);
}

function drawDressing(ctx: CanvasRenderingContext2D, w: World): void {
  if (w.bg !== "station" && w.bg !== "assembly") return;
  for (let i = 0; i < w.plats.length; i++) {
    const pl = w.plats[i];
    if (!pl || pl.t === 2 || pl.t === 4 || pl.t === 5 || pl.w < 280) continue;
    if (pl.x + pl.w < w.camX - 80 || pl.x > w.camX + VW + 80) continue;
    const step = w.bg === "station" ? 460 : 520;
    for (let x = pl.x + 90; x < pl.x + pl.w - 70; x += step) {
      const pick = hash(x * 0.17 + pl.y);
      if (pick < 0.45) drawProp(ctx, x, pl.y, "crate", w.t);
      else if (pick < 0.75) drawProp(ctx, x, pl.y, w.bg === "station" ? "bench" : "lamp", w.t);
      else {
        ctx.save();
        ctx.fillStyle = w.bg === "station" ? "rgba(210, 190, 120, 0.16)" : "rgba(90, 50, 20, 0.18)";
        ctx.beginPath();
        ctx.ellipse(x, pl.y + 6, 28 + pick * 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

function drawProp(ctx: CanvasRenderingContext2D, x: number, y: number, k: string, t: number): void {
  ctx.save();
  const flick = 0.82 + Math.sin(t * 7 + x) * 0.18;
  if (k === "lantern" || k === "lamp") {
    const glow = ctx.createRadialGradient(x + 8, y - 28, 2, x + 8, y - 28, 36);
    glow.addColorStop(0, "rgba(255, 196, 90, " + (0.45 * flick).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(255, 160, 40, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + 8, y - 28, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(x + 6, y - 46, 4, 10);
    ctx.fillStyle = "#e7c56a";
    ctx.beginPath();
    ctx.moveTo(x, y - 36);
    ctx.lineTo(x + 16, y - 36);
    ctx.lineTo(x + 13, y - 16);
    ctx.lineTo(x + 3, y - 16);
    ctx.fill();
    ctx.strokeStyle = "#6a4a28";
    ctx.stroke();
  } else if (k === "pot") {
    ctx.fillStyle = "#6a3a28";
    ctx.beginPath();
    ctx.ellipse(x + 12, y - 10, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a5040";
    ctx.fillRect(x + 4, y - 28, 16, 6);
  } else if (k === "crate") {
    ctx.fillStyle = "#6b4328";
    ctx.fillRect(x, y - 22, 28, 22);
    ctx.strokeStyle = "#3a2416";
    ctx.strokeRect(x, y - 22, 28, 22);
    ctx.beginPath();
    ctx.moveTo(x, y - 11);
    ctx.lineTo(x + 28, y - 11);
    ctx.moveTo(x + 14, y - 22);
    ctx.lineTo(x + 14, y);
    ctx.stroke();
  } else if (k === "bench") {
    ctx.fillStyle = "#5c4030";
    ctx.fillRect(x, y - 16, 46, 6);
    ctx.fillRect(x + 4, y - 10, 4, 10);
    ctx.fillRect(x + 38, y - 10, 4, 10);
    ctx.fillStyle = "#7a5840";
    ctx.fillRect(x + 6, y - 30, 4, 14);
    ctx.fillRect(x + 36, y - 30, 4, 14);
    ctx.fillRect(x + 4, y - 30, 36, 4);
  } else if (k === "press") {
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(x, y - 36, 40, 28);
    ctx.fillStyle = "#4a4038";
    ctx.beginPath();
    ctx.ellipse(x + 20, y - 22, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1614";
    ctx.fillRect(x + 6, y - 8, 6, 8);
    ctx.fillRect(x + 28, y - 8, 6, 8);
  } else if (k === "bars") {
    ctx.strokeStyle = "#2c3034";
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 8, y - 70);
      ctx.lineTo(x + i * 8, y);
      ctx.stroke();
    }
  } else if (k === "bucket") {
    ctx.fillStyle = "#5a534c";
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x + 18, y - 16);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x + 3, y);
    ctx.fill();
    ctx.strokeStyle = "#2a2622";
    ctx.beginPath();
    ctx.arc(x + 9, y - 16, 8, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, w: World): void {
  const t = w.t;
  const bg = w.bg;
  if (bg === "lahore") {
    for (let i = 0; i < 3; i++) {
      const speed = 16 + i * 6;
      const x = ((i * 280 + t * speed) % (VW + 120)) - 60;
      const y = 28 + i * 22 + Math.sin(t * 0.8 + i) * 6;
      const colors = ["#e25b2a", "#f2e2a0", "#2f6b4f"];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t + i) * 0.2);
      ctx.fillStyle = colors[i] ?? "#e25b2a";
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-9, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,20,16,0.45)";
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(10, 22, 4, 36);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "rgba(80, 30, 40, 0.08)";
    ctx.fillRect(0, VH * 0.55, VW, VH * 0.45);
  } else if (bg === "station") {
    for (let i = 0; i < 3; i++) {
      const x = ((t * (12 + i * 4) + i * 280) % (VW + 400)) - 200;
      const fog = ctx.createRadialGradient(x, 250 + i * 40, 20, x, 250 + i * 40, 220);
      fog.addColorStop(0, "rgba(180, 190, 210, 0.16)");
      fog.addColorStop(1, "rgba(180, 190, 210, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, VW, VH);
    }
  } else if (bg === "press") {
    for (let i = 0; i < 28; i++) {
      const life = (t * (0.15 + (i % 5) * 0.04) + i * 0.17) % 1;
      const x = (i * 37 + Math.sin(t + i) * 12) % VW;
      const y = VH - life * (VH + 20);
      ctx.fillStyle = i % 4 === 0 ? "rgba(255, 220, 140, 0.9)" : "rgba(255, 120, 30, 0.75)";
      ctx.globalAlpha = 1 - life;
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 2.2 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const x = ((t * 22 + i * 160) % (VW + 80)) - 40;
      const y = 80 + (i * 70) % 360 + Math.sin(t * 1.4 + i) * 16;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.4 + Math.sin(t + i) * 0.3);
      ctx.fillStyle = "rgba(244, 230, 200, 0.72)";
      ctx.fillRect(0, 0, 16, 11);
      ctx.restore();
    }
  } else if (bg === "assembly" || bg === "cell") {
    const shafts = bg === "cell" ? 1 : 3;
    for (let i = 0; i < shafts; i++) {
      ctx.save();
      ctx.translate(bg === "cell" ? 760 : 280 + i * 220, -30);
      ctx.rotate(0.55 + i * 0.04);
      const g = ctx.createLinearGradient(0, 0, 70, 620);
      g.addColorStop(0, bg === "cell" ? "rgba(210, 220, 235, 0.16)" : "rgba(255, 214, 150, 0.1)");
      g.addColorStop(1, "rgba(255, 220, 160, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(48, 0);
      ctx.lineTo(96, 640);
      ctx.lineTo(52, 640);
      ctx.fill();
      ctx.restore();
    }
    const pages = bg === "assembly" ? 8 : 0;
    for (let i = 0; i < pages; i++) {
      const x = ((t * 16 + i * 140) % (VW + 100)) - 50;
      const y = 70 + (i * 48) % 280 + Math.sin(t * 0.9 + i) * 18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5 + Math.sin(t * 1.2 + i) * 0.4);
      ctx.fillStyle = "rgba(248, 240, 220, 0.78)";
      ctx.fillRect(0, 0, 18, 12);
      ctx.restore();
    }
    if (bg === "cell") {
      const fog = ctx.createRadialGradient(VW * 0.5, VH * 0.7, 40, VW * 0.5, VH * 0.75, 420);
      fog.addColorStop(0, "rgba(180, 190, 200, 0.12)");
      fog.addColorStop(1, "rgba(180, 190, 200, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, VW, VH);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFX(ctx: CanvasRenderingContext2D, w: World): void {
  if (w.level > 0 && w.mode !== "title" && w.mode !== "select") drawAtmosphere(ctx, w);
  if (w.rainOn || w.mode === "title" || w.mode === "select") {
    for (let i = 0; i < w.rain.length; i++) {
      const q = w.rain[i];
      if (!q) continue;
      ctx.strokeStyle = "rgba(210, 220, 232, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x - 2, q.y + Math.max(8, q.size * 2));
      ctx.stroke();
    }
  }
  for (let i = 0; i < w.parts.length; i++) {
    const q = w.parts[i];
    if (!q) continue;
    ctx.globalAlpha = Math.max(0, q.life / 0.55);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x - w.camX, q.y, q.size, q.size);
  }
  ctx.globalAlpha = 1;
  const vg = ctx.createRadialGradient(VW * 0.5, VH * 0.45, 180, VW * 0.5, VH * 0.5, 520);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VW, VH);
}

function drawChrome(ctx: CanvasRenderingContext2D, w: World, art: ArtBook): void {
  ctx.textBaseline = "top";
  if (w.mode === "title" || w.mode === "select") {
    ctx.fillStyle = "rgba(8,6,8,0.38)";
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#f3ddb0";
    ctx.font = "700 64px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText("INQUILAB", 64, 150);
    ctx.font = "22px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillStyle = "#d7c4a0";
    ctx.fillText("A non-lethal action chronicle of Bhagat Singh", 68, 228);
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillStyle = "#c8b090";
    ctx.fillText(w.mode === "select" ? "Choose a chapter" : "Press Space or Enter to begin    P for chapters", 68, 280);
    ctx.fillText("Move   Jump   Tap attack, release a hold for heavy   Dodge   Flick to dash", 68, 418);
    return;
  }
  if (w.mode === "finale") {
    ctx.fillStyle = "rgba(6,4,6," + String(clamp(w.t / 3, 0, 0.45)) + ")";
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#f6e6c0";
    ctx.font = "22px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText("23 March 1931.  Dawn.", 70, 150);
    ctx.font = "20px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText("It is easy to kill individuals but you cannot kill the ideas.", 70, 230);
    ctx.fillText("Great empires crumbled while the ideas survived.", 70, 262);
    ctx.font = "16px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillStyle = "#c8b490";
    ctx.fillText("— Leaflet thrown in the Central Legislative Assembly, 8 April 1929", 70, 310);
    ctx.fillText("Inquilab Zindabad.", 70, 380);
    if (w.t > 6) ctx.fillText("Press Space to return", 70, 470);
    return;
  }
  if (w.mode === "play" || w.mode === "dead" || w.mode === "done" || w.mode === "pause") {
    const p = w.player;
    for (let i = 0; i < p.maxHp; i++) {
      ctx.fillStyle = i < p.hp ? "#e24b3a" : "rgba(40,20,20,0.6)";
      ctx.fillRect(24 + i * 22, 18, 18, 10);
    }
    ctx.fillStyle = "#f0e0c0";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(w.obj, 24, 38);
    ctx.fillStyle = "#c8b090";
    ctx.fillText((LNAME[w.level] ?? "") + "   " + w.time.toFixed(1) + "s", 24, 56);
    if (w.combo > 1) {
      ctx.fillStyle = "#ffe08a";
      ctx.font = "700 22px system-ui, sans-serif";
      ctx.fillText(String(w.combo) + " HIT", VW - 160, 20);
    }
    if (p.dcd <= 0) {
      ctx.fillStyle = "#9ad0e8";
      ctx.fillRect(24, 76, 28, 4);
    }
    if (w.ally && w.level === 2) {
      ctx.fillStyle = "#d7b4e0";
      ctx.fillRect(24, 88, 80 * (w.ally.hp / w.ally.maxHp), 5);
    }
    if (w.focus > 0) {
      ctx.fillStyle = "#ffe08a";
      ctx.fillRect(24, 98, 70 * clamp(w.focus / 1.7, 0, 1), 4);
    }
    if (w.level === 4 && w.gallery) {
      ctx.fillStyle = w.alarm >= 100 ? "#e24b3a" : "#c8b090";
      ctx.fillRect(VW - 180, 52, 140 * clamp(w.alarm / 100, 0, 1), 4);
    }
    if (w.fast) {
      ctx.fillStyle = "#f3e6c0";
      ctx.font = "16px Georgia, 'Iowan Old Style', Palatino, serif";
      ctx.fillText("Day " + String(w.days), VW - 140, 20);
    }
    if (w.hint && w.mode === "play") {
      ctx.fillStyle = "rgba(10,8,8,0.55)";
      ctx.fillRect(24, 112, 520, 22);
      ctx.fillStyle = "#f6e6c0";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText(w.hint, 32, 116);
    }
  }
  if (w.bannerT > 0 && w.banner) {
    ctx.fillStyle = "rgba(8,6,8,0.45)";
    ctx.fillRect(0, VH * 0.38, VW, 56);
    ctx.fillStyle = "#f6e6c0";
    ctx.font = "700 26px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText(w.banner, 48, VH * 0.4);
  }
  if (w.mode === "talk") {
    const line = w.talk[w.talkI];
    if (line) {
      ctx.fillStyle = "rgba(10,8,10,0.78)";
      ctx.fillRect(40, VH - 168, VW - 80, 140);
      ctx.strokeStyle = "rgba(226,188,122,0.6)";
      ctx.strokeRect(40, VH - 168, VW - 80, 140);
      const portrait = line.port ? art.portrait[line.port] : undefined;
      if (portrait) drawPortrait(ctx, portrait, 56, VH - 152, 88, 108);
      ctx.fillStyle = "#e8c878";
      ctx.font = "700 14px system-ui, sans-serif";
      ctx.fillText(NAMES[line.who] ?? "", portrait ? 164 : 64, VH - 150);
      ctx.fillStyle = "#f2ead8";
      ctx.font = "18px Georgia, 'Iowan Old Style', Palatino, serif";
      const shown = line.text.slice(0, Math.floor(w.talkShown));
      wrapText(ctx, shown, portrait ? 164 : 64, VH - 124, portrait ? VW - 250 : VW - 150, 24);
    }
  }
  if (w.mode === "done") {
    ctx.fillStyle = "rgba(8,6,8,0.55)";
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = "#f6e6c0";
    ctx.font = "700 36px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText("CHAPTER CLEAR", 70, 160);
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText("Rank  " + w.rank + "     Time  " + w.time.toFixed(1) + "s", 74, 220);
    ctx.fillText("Score  " + String(w.score) + "     Perfect reads  " + String(w.perfects), 74, 248);
    ctx.fillText("Disarmed  " + String(w.disarmed) + "    Best combo  " + String(w.maxCombo), 74, 276);
    ctx.fillText("Hits taken  " + String(w.hitsTaken), 74, 304);
    ctx.fillText("Press Space to continue", 74, 360);
  }
  if (w.caption && w.mode === "play" && w.level > 0) {
    ctx.fillStyle = "rgba(232,210,170,0.72)";
    ctx.font = "12px Georgia, 'Iowan Old Style', Palatino, serif";
    const cap = w.caption || (CAPTION[w.level] ?? "");
    if (cap) ctx.fillText(cap, 24, VH - 118);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number): void {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const word = words[i] ?? "";
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > max) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
