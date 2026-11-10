import type { Dir } from "../sim/types";

export interface StrideFrame {
  bodyT: number;
  hop: number;
  squash: number;
  leadT: number;
  trailT: number;
  leadLift: number;
  trailLift: number;
}

/**
 * One tile step. Feet stay planted at the start, leave the ground together,
 * stride in the air, then plant at the destination. A foot with lift 0 does not slide.
 */
export function strideFrame(t: number): StrideFrame {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0.16) {
    const u = clamped / 0.16;
    return {
      bodyT: 0,
      hop: 0,
      squash: 1 - 0.08 * Math.sin(u * Math.PI),
      leadT: 0,
      trailT: 0,
      leadLift: 0,
      trailLift: 0,
    };
  }
  if (clamped >= 0.86) {
    const u = (clamped - 0.86) / 0.14;
    return {
      bodyT: 1,
      hop: 0,
      squash: 1 - 0.1 * Math.sin(Math.min(1, u) * Math.PI),
      leadT: 1,
      trailT: 1,
      leadLift: 0,
      trailLift: 0,
    };
  }
  const u = (clamped - 0.16) / 0.7;
  const smooth = u * u * (3 - 2 * u);
  const split = Math.sin(u * Math.PI) * 0.26;
  return {
    bodyT: smooth,
    hop: Math.sin(u * Math.PI),
    squash: 1,
    leadT: Math.min(1, smooth + split),
    trailT: Math.max(0, smooth - split),
    leadLift: Math.sin(u * Math.PI) * 0.62,
    trailLift: Math.sin(u * Math.PI),
  };
}

export function along(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function stepVector(face: Dir, cell: number): { x: number; y: number } {
  if (face === "right") return { x: cell, y: 0 };
  if (face === "left") return { x: -cell, y: 0 };
  if (face === "down") return { x: 0, y: cell * 0.42 };
  return { x: 0, y: -cell * 0.42 };
}
