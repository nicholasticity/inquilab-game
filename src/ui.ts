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
  const p = new Pix(20, 26);
  p.fillRect(1, 1, 16, 23, CREAM);
  p.fillRect(2, 2, 14, 21, PAPER);
  for (const y of [6, 9, 12, 15, 18]) p.fillRect(4, y, y === 18 ? 8 : 11, 1, UMBER);
  p.force(14, 1, BRASS);
  p.force(15, 1, BRASS);
  p.force(15, 2, BRASS);
  p.force(16, 2, UMBER);
  p.force(16, 3, UMBER);
  return p;
}

export function makeArrow(): Pix {
  // A filled arrow pointing down. Shaft, then a solid head.
  const p = new Pix(16, 24);
  for (let y = 0; y < 11; y++) {
    p.force(6, y, YELLOW);
    p.force(7, y, YELLOW);
    p.force(8, y, BRASS);
    p.force(9, y, BRASS);
  }
  for (let i = 0; i < 8; i++) {
    for (let x = 7 - i; x <= 8 + i; x++) {
      if (x < 0 || x > 15) continue;
      p.force(x, 11 + i, x <= 7 ? YELLOW : BRASS);
    }
  }
  return p;
}

export function makeStickBase(): Pix {
  const s = 136;
  const p = new Pix(s, s);
  const c = (s - 1) / 2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d <= 66 && d >= 54) p.force(x, y, d > 64 || d < 56 ? UMBER : BRASS);
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    p.force(Math.round(c + Math.cos(a) * 60), Math.round(c + Math.sin(a) * 60), CREAM);
  }
  return p;
}

export function makeKnob(): Pix {
  const s = 28;
  const p = new Pix(s, s);
  const c = (s - 1) / 2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > 12) continue;
      const hi = d < 5 && x < c && y < c;
      p.force(x, y, d > 10.5 ? UMBER : hi ? 15 : BRASS);
    }
  }
  return p;
}

export function makeEye(): Pix {
  const p = new Pix(32, 24);
  for (let x = 4; x <= 27; x++) {
    p.force(x, 4, INK);
    p.force(x, 19, INK);
  }
  for (let y = 5; y <= 18; y++) {
    p.force(4, y, INK);
    p.force(27, y, INK);
    for (let x = 5; x <= 26; x++) p.force(x, y, CREAM);
  }
  for (let y = 8; y <= 15; y++) for (let x = 12; x <= 19; x++) p.force(x, y, INK);
  p.force(14, 10, YELLOW);
  p.force(15, 10, YELLOW);
  return p;
}

export function makeDigit(ch: string): Pix {
  const p = new Pix(8, 9);
  drawText(p, ch, 1, 1, CREAM);
  return p;
}

export function makeCaption(text: string): Pix {
  const p = new Pix(measure(text) + 1, 8);
  drawText(p, text, 0, 0, CREAM);
  return p;
}

export function makeItemCard(width = 300): Pix {
  const h = 92;
  const p = new Pix(width, h);
  p.fillRect(0, 0, width, h, INK);
  p.fillRect(3, 3, width - 6, h - 6, RED);
  p.fillRect(6, 6, width - 12, h - 12, 1);
  drawBig(p, "ITEM GET", 72, 16, YELLOW);
  drawBig(p, "Coded leaflet", 72, 48, CREAM);
  return p;
}

export function makeBox(lines: string[], title?: string, width = 328): Pix {
  const lineH = 16;
  const height = 16 + lines.length * lineH + (title ? 20 : 0) + 12;
  const p = new Pix(width, Math.max(52, height));
  p.fillRect(0, 0, width, p.h, INK);
  p.fillRect(3, 3, width - 6, p.h - 6, 3);
  p.fillRect(5, 5, width - 10, p.h - 10, PAPER);
  let ty = 12;
  if (title) {
    drawBig(p, title, 12, ty, 16);
    ty += 20;
  }
  for (const line of lines) {
    drawBig(p, line, 12, ty, INK);
    ty += lineH;
  }
  return p;
}

export { CREAM };
