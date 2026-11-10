export interface InqGuard {
  id: string;
  x: number;
  y: number;
  face: string;
  state: string;
  px: number;
  py: number;
}

export interface InqSnapshot {
  scene: string;
  room: string | null;
  player: { x: number; y: number; face: string; hidden: boolean; px: number; py: number } | null;
  guards: InqGuard[];
  cones: { tone: string; cells: { x: number; y: number }[] }[];
  teach: string | null;
  pill: string;
  phase: string;
  muted: boolean;
  cues: string[];
  result: { rank: string; headline: string } | null;
  notice: "q" | "bang" | null;
  fps: number;
  playable: boolean;
  noticeAt: number | null;
  playableAt: number | null;
  nodes: { x: number; y: number; px: number; py: number }[];
  queue: number;
  text: string;
  walkT: number | null;
}

declare global {
  interface Window {
    __inq: InqSnapshot;
  }
}

export function publish(snapshot: InqSnapshot): void {
  window.__inq = snapshot;
}
