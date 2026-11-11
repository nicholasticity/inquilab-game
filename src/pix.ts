import { CLEAR, RGB } from "./palette";

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly px: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h).fill(CLEAR);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return CLEAR;
    return this.px[y * this.w + x];
  }

  set(x: number, y: number, c: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (c === CLEAR) return;
    this.px[y * this.w + x] = c;
  }

  force(x: number, y: number, c: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }

  fill(c: number): void {
    this.px.fill(c);
  }

  fillRect(x: number, y: number, w: number, h: number, c: number): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  blit(src: Pix, dx: number, dy: number, flipX = false): void {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.px[y * src.w + x];
        if (c === CLEAR) continue;
        const sx = flipX ? src.w - 1 - x : x;
        this.set(dx + sx, dy + y, c);
      }
    }
  }

  /** Paint rows of region letters. `.` is empty. */
  rows(lines: string[], x: number, y: number, color: (ch: string) => number): void {
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === "." || ch === " ") continue;
        const c = color(ch);
        if (c !== CLEAR) this.set(x + i, y + j, c);
      }
    }
  }

  /** 1px ink contour on the outside of opaque pixels. Does not cascade. */
  outline(ink = 0): void {
    const src = this.px.slice();
    const w = this.w;
    const h = this.h;
    const at = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return CLEAR;
      return src[y * w + x];
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (at(x, y) !== CLEAR) continue;
        if (at(x - 1, y) !== CLEAR || at(x + 1, y) !== CLEAR || at(x, y - 1) !== CLEAR || at(x, y + 1) !== CLEAR) {
          this.px[y * w + x] = ink;
        }
      }
    }
  }

  toRGBA(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      const o = i * 4;
      if (c === CLEAR) continue;
      const rgb = RGB[c] ?? RGB[0];
      out[o] = rgb[0];
      out[o + 1] = rgb[1];
      out[o + 2] = rgb[2];
      out[o + 3] = 255;
    }
    return out;
  }
}

export function paintCanvas(pix: Pix, ctx: CanvasRenderingContext2D): void {
  const img = ctx.createImageData(pix.w, pix.h);
  img.data.set(pix.toRGBA());
  ctx.putImageData(img, 0, 0);
}
