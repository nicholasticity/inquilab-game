/** One lacquer diorama. Light comes from the upper left. Every gameplay mark uses these inks. */

export const INK = "#16110f";
export const OUTLINE = "#241814";
export const PAPER = "#efe6d2";
export const GOLD = "#f3e6c0";
export const GOLD_LINE = "#e2bc7a";
export const SAND = "#e0c79a";
export const SAND_DEEP = "#b08960";
export const SHADOW = "#4e3d34";
export const SHADOW_DEEP = "#322820";
export const HIDE = "#3a332c";
export const BRICK = "#7a4038";
export const BRICK_HI = "#a85a4c";
export const BRICK_LO = "#4e2824";
export const BRASS = "#e0b15a";
export const BRASS_LO = "#8a6230";
export const CLOTH = "#6e2e3a";
export const INDIGO = "#1f4d4a";
export const KHAKI = "#c6a36a";
export const KHAKI_LO = "#7d623c";
export const OLIVE = "#5c6b45";
export const CONE_GOLD = "#e4b15a";
export const CONE_AMBER = "#e08a3c";
export const CONE_RED = "#d64545";
export const GLEAM = "#7ee0d6";
export const SKIN = "#c68658";
export const SKIN_HI = "#e0b07a";
export const SKIN_LO = "#8d5a3c";

export function rgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

export function hexOf(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

/** Nudge a colour toward the upper-left lamp (positive) or the lower-right shade (negative). */
export function tone(hex: string, amount: number): string {
  const [r, g, b] = rgb(hex);
  return hexOf(r + amount, g + amount * 0.92, b + amount * 0.75);
}

export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return hexOf(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export function hash(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
