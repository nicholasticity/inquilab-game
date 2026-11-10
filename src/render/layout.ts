export const GAME_W = 960;
export const GAME_H = 540;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardLayout {
  cell: number;
  ox: number;
  oy: number;
}

/** Top band for the objective, bottom corners for Wait and Ability. */
export function hudRects(): { id: string; r: Rect }[] {
  return [
    { id: "portrait", r: { x: 12, y: 8, w: 176, h: 40 } },
    { id: "objective", r: { x: 196, y: 8, w: 700, h: 40 } },
    { id: "pause", r: { x: 908, y: 8, w: 40, h: 40 } },
    { id: "wait", r: { x: 14, y: 482, w: 92, h: 46 } },
    { id: "ability", r: { x: 854, y: 482, w: 92, h: 46 } },
  ];
}

export function layoutBoard(cols: number, rows: number): BoardLayout {
  const top = 56;
  const bottom = 64;
  const side = 12;
  const availW = GAME_W - side * 2;
  const availH = GAME_H - top - bottom;
  const cell = Math.floor(Math.min(availW / cols, availH / rows));
  const boardW = cell * cols;
  const boardH = cell * rows;
  const ox = Math.floor((GAME_W - boardW) / 2);
  const oy = top + Math.floor((availH - boardH) / 2);
  return { cell, ox, oy };
}

export function cellRect(layout: BoardLayout, x: number, y: number): Rect {
  return { x: layout.ox + x * layout.cell, y: layout.oy + y * layout.cell, w: layout.cell, h: layout.cell };
}

export function overlaps(a: Rect, b: Rect, pad = 0): boolean {
  return a.x + pad < b.x + b.w && a.x + a.w - pad > b.x && a.y + pad < b.y + b.h && a.y + a.h - pad > b.y;
}

/** Feet sit low in the tile so the head can rise into the cell above without entering the HUD. */
export function groundPoint(layout: BoardLayout, x: number, y: number): { x: number; y: number } {
  return {
    x: layout.ox + (x + 0.5) * layout.cell,
    y: layout.oy + (y + 0.78) * layout.cell,
  };
}
