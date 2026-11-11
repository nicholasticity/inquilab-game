export type Insets = { top: number; right: number; bottom: number; left: number };

export type Frame = {
  canvasW: number;
  canvasH: number;
  topH: number;
  viewX: number;
  viewY: number;
  viewW: number;
  viewH: number;
  stickX: number;
  stickY: number;
  stickThrow: number;
  stickGrab: number;
  port: number;
  ports: { x: number; y: number }[];
  captionX: number;
  captionY: number;
};

const TILE = 32;
const MAP_H = 14;
const RING = 132;
const PORT = 52;
const GAP = 8;

export function readSafe(): Insets {
  const s = getComputedStyle(document.documentElement);
  const n = (name: string) => {
    const raw = s.getPropertyValue(name).trim();
    const v = parseFloat(raw);
    return Number.isFinite(v) ? v : 0;
  };
  return { top: n("--sat"), right: n("--sar"), bottom: n("--sab"), left: n("--sal") };
}

/** 1 CSS pixel = 1 game pixel. The yard's full height stays on screen; width is about 12 tiles. */
export function layoutFrame(canvasW: number, canvasH: number, safe: Insets): Frame {
  const topH = 26;
  const innerW = Math.max(160, canvasW - safe.left - safe.right);
  const innerH = Math.max(240, canvasH - safe.top - safe.bottom);
  const mapH = MAP_H * TILE;
  const minPanel = RING + 56;
  const room = innerH - topH - minPanel;
  const viewH = Math.min(mapH, Math.max(8 * TILE, room));
  const tiles = Math.max(8, Math.min(14, Math.floor(innerW / TILE)));
  const viewW = Math.min(innerW, tiles * TILE);
  const viewX = safe.left + Math.floor((innerW - viewW) / 2);
  const viewY = safe.top + topH;
  const panelBottom = canvasH - safe.bottom;
  const stickX = safe.left + 14 + RING / 2;
  const stickY = panelBottom - 16 - RING / 2;
  const portsW = PORT * 3 + GAP * 2;
  const portX0 = canvasW - safe.right - 14 - portsW;
  const portY = stickY - PORT / 2;
  const ports = [0, 1, 2].map((i) => ({ x: portX0 + i * (PORT + GAP), y: portY }));
  return {
    canvasW,
    canvasH,
    topH,
    viewX,
    viewY,
    viewW,
    viewH,
    stickX,
    stickY,
    stickThrow: 42,
    stickGrab: 74,
    port: PORT,
    ports,
    captionX: portX0 + Math.floor(portsW / 2),
    captionY: Math.min(portY + PORT + 6, panelBottom - 14),
  };
}
