import { GOLD, GOLD_LINE, INK, OUTLINE, PAPER } from "../render/palette";

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function plaque(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; gleam?: boolean; dim?: boolean } = {},
): void {
  ctx.globalAlpha = opts.dim ? 0.45 : 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = opts.fill ?? "rgba(22, 17, 15, 0.88)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = opts.gleam ? "#7ee0d6" : GOLD_LINE;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  opts: { color?: string; align?: CanvasTextAlign; max?: number; weight?: number } = {},
): void {
  ctx.fillStyle = opts.color ?? GOLD;
  ctx.font = `${opts.weight ?? 600} ${size}px Georgia, "Liberation Serif", "Nimbus Roman", serif`;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y, opts.max);
}

export function inkWash(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 960, 540);
}

export function buttonFace(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, dim = false): void {
  plaque(ctx, x, y, w, h, { dim, fill: dim ? "rgba(22,17,15,0.55)" : "rgba(36, 24, 20, 0.92)" });
  label(ctx, text, x + w / 2, y + h / 2, 18, { align: "center", color: dim ? "#8a7050" : PAPER, max: w - 16 });
}

export function contains(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
  return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
}

export { OUTLINE };
