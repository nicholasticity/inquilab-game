import { DELTA, dirBetween, opposite, passable, pathDist, pathNext, turnRight } from "./board";
import type { Dir, GuardDef, GuardMove, GuardRuntime, GuardState, Pos, RoomState } from "./types";

const HEAR = 3;

export function makeGuard(def: GuardDef): GuardRuntime {
  const route = def.route;
  const first = route[0];
  const next = route[1] ?? first;
  let face: Dir = "down";
  if (first.face) face = first.face;
  else if (next.x === first.x && next.y === first.y && next.face) face = next.face;
  else face = dirBetween(first, next) ?? "down";
  return {
    id: def.id,
    kind: def.kind,
    coneLength: def.coneLength ?? 2,
    x: first.x,
    y: first.y,
    face,
    state: "patrol",
    route,
    routeIndex: route.length > 1 ? 1 : 0,
    targetX: first.x,
    targetY: first.y,
    scanned: false,
    searchTurns: 0,
    returnX: next.x,
    returnY: next.y,
  };
}

/**
 * Nodes a guard can see this turn. The painter must use this list and no other.
 * Hide spots are included; detection decides whether a hidden player is caught.
 */
export function seenNodes(state: RoomState, guard: GuardRuntime): Pos[] {
  if (guard.state === "down") return [];
  const step = DELTA[guard.face];
  const nodes: Pos[] = [];
  for (let i = 1; i <= guard.coneLength; i += 1) {
    const x = guard.x + step.x * i;
    const y = guard.y + step.y * i;
    if (!passable(state, x, y)) break;
    nodes.push({ x, y });
  }
  return nodes;
}

export function paintedNodes(state: RoomState, guard: GuardRuntime): Pos[] {
  return seenNodes(state, guard);
}

export type ConeTone = "gold" | "amber" | "red";

export function coneTone(state: GuardState): ConeTone {
  if (state === "sus" || state === "search") return "amber";
  if (state === "alert") return "red";
  return "gold";
}

export interface ConeDraw {
  id: string;
  nodes: Pos[];
  tone: ConeTone;
}

export function coneDrawList(state: RoomState): ConeDraw[] {
  return state.guards.map((guard) => ({
    id: guard.id,
    nodes: seenNodes(state, guard),
    tone: coneTone(guard.state),
  }));
}

function facingCell(guard: GuardRuntime, x: number, y: number): boolean {
  const step = DELTA[guard.face];
  return guard.x + step.x === x && guard.y + step.y === y;
}

function adjacentTo(guard: GuardRuntime, x: number, y: number): boolean {
  return Math.abs(guard.x - x) + Math.abs(guard.y - y) === 1;
}

export function detectsPlayer(state: RoomState, guard: GuardRuntime): boolean {
  if (guard.state === "down") return false;
  const same = guard.x === state.playerX && guard.y === state.playerY;
  const hiding = state.room.cells.some(
    (cell) => cell.x === state.playerX && cell.y === state.playerY && cell.kind === "hide",
  );

  if (state.disguised && (guard.state === "patrol" || guard.state === "return")) {
    return guard.kind === "officer" && same;
  }

  if (hiding) {
    return (
      (guard.state === "sus" || guard.state === "search") &&
      adjacentTo(guard, state.playerX, state.playerY) &&
      facingCell(guard, state.playerX, state.playerY)
    );
  }

  if (same) return true;
  return seenNodes(state, guard).some((node) => node.x === state.playerX && node.y === state.playerY);
}

export function catcher(state: RoomState): GuardRuntime | null {
  for (const guard of state.guards) {
    if (detectsPlayer(state, guard)) return guard;
  }
  return null;
}

function moveGuard(guard: GuardRuntime, x: number, y: number): void {
  const face = dirBetween(guard, { x, y });
  if (face) guard.face = face;
  guard.x = x;
  guard.y = y;
}

function divert(guard: GuardRuntime, x: number, y: number): void {
  if (guard.state === "patrol") {
    const step = guard.route[guard.routeIndex] ?? guard.route[0];
    guard.returnX = step.x;
    guard.returnY = step.y;
  }
  guard.state = "sus";
  guard.targetX = x;
  guard.targetY = y;
  guard.scanned = false;
  guard.searchTurns = 0;
}

export function hearNoise(state: RoomState, x: number, y: number): void {
  for (const guard of state.guards) {
    if (guard.state !== "patrol" && guard.state !== "return") continue;
    if (pathDist(state, guard.x, guard.y, x, y) <= HEAR) divert(guard, x, y);
  }
}

function noticeBody(state: RoomState, guard: GuardRuntime): void {
  if (guard.state !== "patrol" && guard.state !== "return") return;
  let best: Pos | null = null;
  let bestD = Infinity;
  const seen = seenNodes(state, guard);
  for (const other of state.guards) {
    if (other.state !== "down") continue;
    if (!seen.some((node) => node.x === other.x && node.y === other.y)) continue;
    const dist = Math.abs(other.x - guard.x) + Math.abs(other.y - guard.y);
    if (dist < bestD) {
      best = { x: other.x, y: other.y };
      bestD = dist;
    }
  }
  if (best) divert(guard, best.x, best.y);
}

function patrol(state: RoomState, guard: GuardRuntime): void {
  const step = guard.route[guard.routeIndex];
  if (!step) {
    guard.routeIndex = 0;
    return;
  }
  if (step.x === guard.x && step.y === guard.y) {
    guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
    if (step.face) guard.face = step.face;
    return;
  }
  const next = pathNext(state, guard.x, guard.y, step.x, step.y);
  if (!next) {
    guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
    return;
  }
  moveGuard(guard, next.x, next.y);
  if (guard.x === step.x && guard.y === step.y) {
    guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
    if (step.face) guard.face = step.face;
  }
}

function stepGuard(state: RoomState, guard: GuardRuntime): void {
  if (guard.state === "sus") {
    if (guard.x !== guard.targetX || guard.y !== guard.targetY) {
      const next = pathNext(state, guard.x, guard.y, guard.targetX, guard.targetY);
      if (next) moveGuard(guard, next.x, next.y);
      else guard.scanned = true;
      return;
    }
    if (!guard.scanned) {
      guard.scanned = true;
      return;
    }
    guard.state = "search";
    guard.searchTurns = 0;
  }
  if (guard.state === "search") {
    guard.face = turnRight(guard.face);
    guard.searchTurns += 1;
    if (guard.searchTurns >= 2) guard.state = "return";
    return;
  }
  if (guard.state === "return") {
    if (guard.x === guard.returnX && guard.y === guard.returnY) {
      guard.state = "patrol";
    } else {
      const next = pathNext(state, guard.x, guard.y, guard.returnX, guard.returnY);
      if (!next) guard.state = "patrol";
      else {
        moveGuard(guard, next.x, next.y);
        return;
      }
    }
  }
  if (guard.state === "patrol") patrol(state, guard);
}

function poseOf(state: GuardState, moved: boolean): "walk" | "scan" | "down" {
  if (state === "down") return "down";
  return moved ? "walk" : "scan";
}

export function resolveGuards(state: RoomState): { moves: GuardMove[]; ghosts: Pos[] } {
  const moves: GuardMove[] = [];
  const ghosts: Pos[] = [];
  for (const guard of state.guards) {
    const fromX = guard.x;
    const fromY = guard.y;
    const fromFace = guard.face;
    const fromState = guard.state;
    if (guard.state === "down") {
      moves.push({
        id: guard.id,
        fromX,
        fromY,
        toX: guard.x,
        toY: guard.y,
        fromFace,
        face: guard.face,
        fromState,
        state: guard.state,
        pose: "down",
      });
      continue;
    }
    noticeBody(state, guard);
    stepGuard(state, guard);
    if (fromState !== "sus" && guard.state === "sus") ghosts.push({ x: guard.targetX, y: guard.targetY });
    const moved = guard.x !== fromX || guard.y !== fromY;
    moves.push({
      id: guard.id,
      fromX,
      fromY,
      toX: guard.x,
      toY: guard.y,
      fromFace,
      face: guard.face,
      fromState,
      state: guard.state,
      pose: poseOf(guard.state, moved),
    });
  }
  return { moves, ghosts };
}

/** Where cones will be next turn if the player waits. Does not mutate. */
export function predict(state: RoomState): RoomState {
  const next = cloneRoom(state);
  resolveGuards(next);
  return next;
}

export function cloneRoom(state: RoomState): RoomState {
  return {
    ...state,
    guards: state.guards.map((guard) => ({ ...guard, route: guard.route })),
    taken: { ...state.taken },
    teachDismissed: [...state.teachDismissed],
    room: state.room,
  };
}

export function bodyLeftInCone(state: RoomState): boolean {
  const bodies = state.guards.filter((guard) => guard.state === "down");
  if (bodies.length === 0) return false;
  for (const guard of state.guards) {
    if (guard.state === "down") continue;
    const seen = seenNodes(state, guard);
    if (bodies.some((body) => seen.some((node) => node.x === body.x && node.y === body.y))) return true;
  }
  return false;
}

export function fromFront(dir: Dir, face: Dir): boolean {
  return dir === opposite(face);
}
