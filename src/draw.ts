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
  if (flash) ctx.filter = "brightness(1.8)";
  ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  ctx.filter = "none";
  ctx.restore();
}

function drawBG(ctx: CanvasRenderingContext2D, im: HTMLImageElement | undefined, cam: number): void {
  if (im && im.naturalWidth > 0) {
    const scale = Math.max(VH / im.naturalHeight, (VW + 80) / im.naturalWidth) * 1.12;
    const dw = im.naturalWidth * scale;
    const dh = im.naturalHeight * scale;
    const ox = -cam * 0.28;
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
  drawBG(ctx, art.bg[bgKey], w.mode === "title" || w.mode === "finale" ? w.t * 12 : w.camX);
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
    if (!pl || pl.x + pl.w < w.camX - 20 || pl.x > w.camX + VW + 20) continue;
    ctx.fillStyle = pl.t === 1 ? "rgba(18,14,16,0.42)" : "rgba(12,10,12,0.62)";
    ctx.fillRect(pl.x, pl.y, pl.w, Math.min(pl.h, 90));
    ctx.fillStyle = "rgba(226,188,122,0.8)";
    ctx.fillRect(pl.x, pl.y, pl.w, 3);
    if (pl.t === 2) {
      ctx.fillStyle = "rgba(80,56,40,0.7)";
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = "rgba(226,188,122,0.8)";
      ctx.fillRect(pl.x, pl.y, pl.w, 3);
    }
  }
  for (let i = 0; i < w.checks.length; i++) {
    const c = w.checks[i];
    if (!c) continue;
    ctx.fillStyle = c.used ? "rgba(220,190,110,0.95)" : "rgba(240,220,150,0.55)";
    ctx.fillRect(c.x, c.y - 70, 5, 70);
    ctx.fillRect(c.x, c.y - 70, 22, 14);
  }
  for (let i = 0; i < w.papers.length; i++) {
    const pap = w.papers[i];
    if (!pap || pap.got) continue;
    ctx.fillStyle = "#f3e6bf";
    ctx.save();
    ctx.translate(pap.x, pap.y + Math.sin(w.t * 4 + i) * 4);
    ctx.rotate(-0.2);
    ctx.fillRect(0, 0, 16, 20);
    ctx.restore();
  }
  for (let i = 0; i < w.hazards.length; i++) {
    const h = w.hazards[i];
    if (!h) continue;
    ctx.fillStyle = "rgba(20,16,18,0.72)";
    ctx.fillRect(h.x, h.y, h.w, h.h);
    ctx.fillStyle = "rgba(226,188,122,0.35)";
    ctx.fillRect(h.x, h.y + h.h - 3, h.w, 3);
  }
  if (w.level === 3 && w.fireX > -100) {
    const grd = ctx.createLinearGradient(w.fireX - 220, 0, w.fireX + 40, 0);
    grd.addColorStop(0, "rgba(180,40,10,0)");
    grd.addColorStop(0.6, "rgba(220,70,16,0.35)");
    grd.addColorStop(1, "rgba(255,160,40,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(w.fireX - 220, 0, 280, VH);
  }
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e) continue;
    const flash = (e.ai === "telegraph" && Math.floor(w.t * 14) % 2 === 0) || (e.inv > 0 && e.st === "hit");
    drawActor(ctx, art, e, foeFrame(e), flash);
  }
  if (w.ally && w.ally.hp > 0) {
    drawActor(ctx, art, w.ally, allyFrame(w.ally), w.ally.inv > 0 && w.ally.st === "hit");
  }
  const p = w.player;
  const blink = p.inv > 0 && p.st !== "down" && Math.floor(w.t * 18) % 2 === 0;
  if (!blink || p.st === "dodge") {
    drawActor(ctx, art, p, playerFrame(p, w.t), p.st === "hit");
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
): void {
  drawSprite(ctx, art.frame[frame], e.x + e.w * 0.5, e.y + e.h + 1, e.face, e.squash, flash);
}

function drawFX(ctx: CanvasRenderingContext2D, w: World): void {
  for (let i = 0; i < w.rain.length; i++) {
    const q = w.rain[i];
    if (!q) continue;
    ctx.strokeStyle = "rgba(190,210,230,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(q.x + q.vx * 0.03, q.y + q.size);
    ctx.stroke();
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
    ctx.fillText("WASD / Arrows move    Space jump    J/X attack    K/C dash    L/Shift dodge", 68, 418);
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
  if (w.mode === "endure" || (w.mode === "talk" && w.level === 5)) {
    ctx.fillStyle = "rgba(8,6,8,0.28)";
    ctx.fillRect(0, 0, VW, VH);
  }
  if (w.mode === "play" || w.mode === "dead" || w.mode === "done" || w.mode === "pause" || w.mode === "endure") {
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
  }
  if (w.mode === "endure") {
    ctx.fillStyle = "rgba(12,10,12,0.55)";
    ctx.fillRect(VW * 0.2, 150, VW * 0.6, 18);
    ctx.fillStyle = "#e8c56a";
    ctx.fillRect(VW * 0.2, 150, VW * 0.6 * (w.resolve / 100), 18);
    ctx.fillStyle = "#f3e6c0";
    ctx.font = "18px Georgia, 'Iowan Old Style', Palatino, serif";
    ctx.fillText("RESOLVE", VW * 0.2, 122);
    ctx.fillText("Day " + String(w.days), VW * 0.68, 122);
    if (w.qte) {
      ctx.fillStyle = w.qteHit ? "#b6e39a" : "#f3ddb0";
      ctx.font = "700 48px system-ui, sans-serif";
      ctx.fillText(w.qte, VW * 0.5 - 60, 230);
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#c8b090";
      ctx.fillText(qteHint(w.qte), VW * 0.5 - 90, 292);
      ctx.fillStyle = "rgba(240,220,170,0.35)";
      ctx.fillRect(VW * 0.3, 320, VW * 0.4 * clamp(w.qteT / 1.15, 0, 1), 8);
    } else {
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillStyle = "#c8b090";
      ctx.fillText("Attack J/X   Dash K/C   Dodge L   Jump Space   Left / Right", VW * 0.2, 188);
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
    ctx.fillText("Time  " + w.time.toFixed(1) + "s", 74, 220);
    ctx.fillText("Score  " + String(w.score), 74, 248);
    ctx.fillText("Disarmed  " + String(w.disarmed) + "    Best combo  " + String(w.maxCombo), 74, 276);
    ctx.fillText("Hits taken  " + String(w.hitsTaken), 74, 304);
    ctx.fillText("Press Space to continue", 74, 360);
  }
  if (w.caption && (w.mode === "play" || w.mode === "talk" || w.mode === "endure") && w.level > 0) {
    ctx.fillStyle = "rgba(232,210,170,0.72)";
    ctx.font = "12px Georgia, 'Iowan Old Style', Palatino, serif";
    const cap = w.caption || (CAPTION[w.level] ?? "");
    if (cap) ctx.fillText(cap, 24, VH - 72);
  }
}

function qteHint(tag: string): string {
  if (tag === "J" || tag === "X") return "Attack";
  if (tag === "K" || tag === "C") return "Dash";
  if (tag === "L") return "Dodge";
  if (tag === "SPACE") return "Jump";
  if (tag === "LEFT") return "Left";
  if (tag === "RIGHT") return "Right";
  return tag;
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
