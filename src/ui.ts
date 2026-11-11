import { drawText, measure, wrap } from "./font";
import { Pix } from "./pix";

const INK = 0;
const CREAM = 7;
const PAPER = 8;
const BRASS = 13;
const YELLOW = 14;
const RED = 17;
const UMBER = 2;

function drawBig(pix: Pix, text: string, x: number, y: number, color: number): void {
  const tmp = new Pix(measure(text) + 2, 9);
  drawText(tmp, text, 0, 0, color);
  for (let j = 0; j < tmp.h; j++) {
    for (let i = 0; i < tmp.w; i++) {
      if (tmp.px[j * tmp.w + i] === color) {
        pix.force(x + i * 2, y + j * 2, color);
        pix.force(x + i * 2 + 1, y + j * 2, color);
        pix.force(x + i * 2, y + j * 2 + 1, color);
        pix.force(x + i * 2 + 1, y + j * 2 + 1, color);
      }
    }
  }
}

export function wrapBox(text: string, maxW: number): string[] {
  return wrap(text, maxW);
}

export function makeHeart(full: boolean): Pix {
  const p = new Pix(16, 14);
  const rows = ["..rr.rr..", ".rrrrrrr.", "rrrrrrrrr", "rrrrrrrrr", ".rrrrrrr.", "..rrrrr..", "...rrr...", "....r...."];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== "r") continue;
      const c = full ? RED : UMBER;
      p.force(x, y + 1, c);
      if (full && (x + y) % 5 === 0) p.force(x, y + 1, 18);
    }
  }
  return p;
}

export function makeMark(kind: "?" | "!"): Pix {
  const p = new Pix(16, 18);
  p.fillRect(1, 1, 14, 16, 1);
  const glyph = kind === "?"
    ? ["..yyy..", ".y...y.", "....yy.", "...y...", "...y...", ".......", "...y..."]
    : ["..yyy..", "..yyy..", "..yyy..", "..yyy..", "..yyy..", ".......", "..yyy.."];
  const color = kind === "?" ? YELLOW : RED;
  for (let y = 0; y < glyph.length; y++) {
    for (let x = 0; x < glyph[y].length; x++) {
      if (glyph[y][x] !== "y") continue;
      p.force(2 + x, 3 + y, color);
      p.force(3 + x, 3 + y, color);
      p.force(2 + x, 4 + y, color);
    }
  }
  return p;
}

export function makeDust(): Pix {
  const p = new Pix(8, 6);
  p.force(1, 2, 6);
  p.force(2, 1, 7);
  p.force(3, 2, 5);
  p.force(4, 1, 7);
  p.force(5, 3, 6);
  p.force(3, 3, 8);
  return p;
}

export function makeSpark(): Pix {
  const p = new Pix(5, 5);
  p.force(2, 0, 15);
  p.force(2, 1, YELLOW);
  p.force(1, 2, YELLOW);
  p.force(2, 2, 15);
  p.force(3, 2, YELLOW);
  p.force(2, 3, YELLOW);
  p.force(2, 4, BRASS);
  return p;
}

export function makeLeaflet(): Pix {
  const p = new Pix(14, 16);
  p.fillRect(1, 1, 12, 14, 7);
  p.fillRect(2, 3, 8, 1, 2);
  p.fillRect(2, 6, 9, 1, 3);
  p.fillRect(2, 8, 7, 1, 3);
  p.fillRect(2, 10, 8, 1, 3);
  p.force(11, 1, 6);
  p.force(12, 2, 6);
  return p;
}

export function makeArrow(): Pix {
  const p = new Pix(16, 20);
  for (let y = 0; y < 8; y++) {
    p.force(7, y, YELLOW);
    p.force(8, y, BRASS);
  }
  for (let i = 0; i < 8; i++) {
    p.force(7 - i, 8 + i, YELLOW);
    p.force(8 + i, 8 + i, YELLOW);
    if (8 + i + 1 < 20) {
      p.force(7 - i, 9 + i, BRASS);
      p.force(8 + i, 9 + i, BRASS);
    }
  }
  return p;
}

export function makeStickBase(): Pix {
  const s = 68;
  const p = new Pix(s, s);
  const c = (s - 1) / 2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d <= 30 && d >= 22) p.force(x, y, d > 28.5 || d < 23.5 ? UMBER : BRASS);
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    p.force(Math.round(c + Math.cos(a) * 26), Math.round(c + Math.sin(a) * 26), CREAM);
  }
  return p;
}

export function makeKnob(): Pix {
  const s = 26;
  const p = new Pix(s, s);
  const c = (s - 1) / 2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > 11) continue;
      const hi = d < 5 && x < c && y < c;
      p.force(x, y, d > 9.5 ? UMBER : hi ? 15 : BRASS);
    }
  }
  return p;
}

export function makeItemCard(): Pix {
  const w = 460;
  const h = 108;
  const p = new Pix(w, h);
  p.fillRect(0, 0, w, h, INK);
  p.fillRect(4, 4, w - 8, h - 8, RED);
  p.fillRect(8, 8, w - 16, h - 16, 1);
  drawBig(p, "ITEM GET", 118, 22, YELLOW);
  drawBig(p, "Coded leaflet", 118, 58, CREAM);
  return p;
}

export function makeBox(lines: string[], title?: string): Pix {
  const width = 560;
  const lineH = 16;
  const height = 16 + lines.length * lineH + (title ? 20 : 0) + 12;
  const p = new Pix(width, Math.max(52, height));
  p.fillRect(0, 0, width, p.h, INK);
  p.fillRect(3, 3, width - 6, p.h - 6, 3);
  p.fillRect(5, 5, width - 10, p.h - 10, PAPER);
  let ty = 12;
  if (title) {
    drawBig(p, title, 16, ty, 16);
    ty += 20;
  }
  for (const line of lines) {
    drawBig(p, line, title ? 16 : 56, ty, INK);
    ty += lineH;
  }
  return p;
}

export { CREAM };
