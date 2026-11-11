import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { actorSheet, bakeMap, drawFrame, makeCrate, makeStall, portrait, type Dir } from "../src/art";
import { drawText } from "../src/font";
import { GRID, validateMap } from "../src/map";
import { Pix } from "../src/pix";

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w: number, h: number, rgba: Buffer): Buffer {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function scale(pix: Pix, n: number): Buffer {
  const rgba = Buffer.alloc(pix.w * n * pix.h * n * 4);
  const src = pix.toRGBA();
  for (let y = 0; y < pix.h; y++) {
    for (let x = 0; x < pix.w; x++) {
      const o = (y * pix.w + x) * 4;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const d = ((y * n + j) * pix.w * n + (x * n + i)) * 4;
        rgba[d] = src[o];
        rgba[d + 1] = src[o + 1];
        rgba[d + 2] = src[o + 2];
        rgba[d + 3] = src[o + 3] || 0;
      }
    }
  }
  return rgba;
}

const errors = validateMap();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
console.log("map ok");
mkdirSync("/tmp/art", { recursive: true });

const sheet = actorSheet("kite");
writeFileSync("/tmp/art/kite.png", encodePNG(sheet.w * 4, sheet.h * 4, scale(sheet, 4)));
for (const kind of ["veil", "key", "guard"] as const) {
  const s = actorSheet(kind);
  writeFileSync(`/tmp/art/${kind}.png`, encodePNG(s.w * 4, s.h * 4, scale(s, 4)));
}
const map = bakeMap(GRID);
writeFileSync("/tmp/art/map.png", encodePNG(map.w * 2, map.h * 2, scale(map, 2)));
const stall = makeStall();
writeFileSync("/tmp/art/stall.png", encodePNG(stall.w * 3, stall.h * 3, scale(stall, 3)));
const crate = makeCrate();
writeFileSync("/tmp/art/crate.png", encodePNG(crate.w * 8, crate.h * 8, scale(crate, 8)));

const row = new Pix(16 * 4, 24);
for (let i = 0; i < 4; i++) row.blit(drawFrame("kite", "down", i), i * 16, 0);
writeFileSync("/tmp/art/walk-down.png", encodePNG(row.w * 6, row.h * 6, scale(row, 6)));

const ports = new Pix(16 * 5, 16);
for (const [i, id] of ["kite", "veil", "key", "guard", "wire"].entries()) ports.blit(portrait(id), i * 16, 0);
writeFileSync("/tmp/art/ports.png", encodePNG(ports.w * 6, ports.h * 6, scale(ports, 6)));

const facings: Dir[] = ["down", "up", "right"];
const names = ["KITE", "VEIL", "KEY", "GUARD"] as const;
const kinds = ["kite", "veil", "key", "guard"] as const;
const gap = 4;
const labelW = 36;
const strip = new Pix(labelW + 16 * 4 + 8, names.length * (24 * 4 + gap) + 4);
strip.fill(0);
names.forEach((name, ki) => {
  const top = 2 + ki * (24 * 4 + gap);
  drawText(strip, name, 2, top + 8, 7);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const dir: Dir = r === 3 ? "right" : facings[r];
      const frame = drawFrame(kinds[ki], dir, c);
      strip.blit(frame, labelW + c * 16, top + r * 24, r === 3);
    }
  }
});
writeFileSync("/tmp/art/walk-strip.png", encodePNG(strip.w * 3, strip.h * 3, scale(strip, 3)));
console.log("wrote /tmp/art");
