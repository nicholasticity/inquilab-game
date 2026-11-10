import type { Dir, PropKind } from "../sim/types";

export type Archetype = "kite" | "veil" | "veil-coat" | "constable" | "officer" | "courier";

export interface PaintTile {
  x: number;
  y: number;
  lit: boolean;
  hide: boolean;
  prop?: PropKind;
  gleam: "gold" | "cyan" | null;
  label?: string;
  locked: boolean;
  pit: boolean;
}

export interface PaintActor {
  archetype: Archetype;
  face: Dir;
  pose: "idle" | "walk" | "alert" | "down";
  walkT: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  hidden: boolean;
  mark: "none" | "q" | "bang";
  /** Which foot reaches first. Swaps each step so the stride doesn't repeat on one leg. */
  lead: "L" | "R";
}

export interface PaintModel {
  cols: number;
  rows: number;
  time: number;
  fade: number;
  flash: number;
  tiles: PaintTile[];
  cones: { cells: { x: number; y: number }[]; tone: "gold" | "amber" | "red"; alpha: number }[];
  ghosts: { x: number; y: number; alpha: number }[];
  rings: { x: number; y: number; alpha: number }[];
  actors: PaintActor[];
  particles: { x: number; y: number; r: number; color: string; a: number }[];
  highlights: { x: number; y: number }[];
  pebble?: { x: number; y: number };
}
