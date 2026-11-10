import { abilityCells, cellDef, cellKey, DELTA, isLit, passable } from "./board";
import { catcher, cloneRoom, fromFront, hearNoise, makeGuard, resolveGuards } from "./ai";
import type { Action, AgentId, Mission, Pos, Room, RoomState, TurnResult } from "./types";

export function startRoom(mission: Mission, room: Room, prev: RoomState | null): RoomState {
  return {
    room,
    agent: mission.agent,
    playerX: room.spawn.x,
    playerY: room.spawn.y,
    playerFace: prev?.playerFace ?? "right",
    disguised: prev?.disguised ?? false,
    hasUniform: mission.agent === "veil" || (prev?.hasUniform ?? false),
    hasPlans: prev?.hasPlans ?? false,
    hasNote: prev?.hasNote ?? false,
    savedCourier: prev?.savedCourier ?? false,
    stoneCd: prev?.stoneCd ?? 0,
    turns: prev?.turns ?? 0,
    guards: room.guards.map(makeGuard),
    taken: {},
    teachDismissed: [],
  };
}

function blank(from: Pos, face: RoomState["playerFace"], reason: string): TurnResult {
  return {
    ok: false,
    reason,
    playerFrom: from,
    playerTo: from,
    face,
    guardMoves: [],
    ghosts: [],
  };
}

function spend(state: RoomState): void {
  if (state.stoneCd > 0) state.stoneCd -= 1;
  state.turns += 1;
}

function teachMatches(state: RoomState, when: string): boolean {
  if (when === "room-start") return true;
  if (when === "ability-visible") return state.agent === "kite" && state.stoneCd === 0 && abilityCells(state).length > 0;
  if (when === "adjacent-to-hide") {
    return state.room.cells.some(
      (cell) => cell.kind === "hide" && Math.abs(cell.x - state.playerX) + Math.abs(cell.y - state.playerY) === 1,
    );
  }
  if (when.startsWith("adjacent-to:")) {
    const [x, y] = when.slice("adjacent-to:".length).split(",").map(Number);
    return Math.abs(state.playerX - x) + Math.abs(state.playerY - y) === 1;
  }
  if (when.startsWith("entered:")) {
    const [x, y] = when.slice("entered:".length).split(",").map(Number);
    return state.playerX === x && state.playerY === y;
  }
  return false;
}

export function activeTeach(state: RoomState): { when: string; text: string } | null {
  for (const teach of state.room.teach ?? []) {
    if (state.teachDismissed.includes(teach.when)) continue;
    if (teachMatches(state, teach.when)) return teach;
  }
  return null;
}

function dismissTeach(before: RoomState, after: RoomState, action: Action): void {
  for (const teach of after.room.teach ?? []) {
    if (after.teachDismissed.includes(teach.when)) continue;
    const when = teach.when;
    let dismiss = false;
    if (when === "room-start") {
      dismiss = teach.text.startsWith("Tap Coat") ? action.type === "ability" : true;
    }
    else if (when === "ability-visible") dismiss = action.type === "ability";
    else if (when === "adjacent-to-hide") {
      const cell = cellDef(after.room, after.playerX, after.playerY);
      dismiss = cell?.kind === "hide";
    } else if (when.startsWith("adjacent-to:")) {
      const [x, y] = when.slice("adjacent-to:".length).split(",").map(Number);
      dismiss = action.type === "wait" || (after.playerX === x && after.playerY === y);
    } else if (when.startsWith("entered:")) {
      const [x, y] = when.slice("entered:".length).split(",").map(Number);
      dismiss = before.playerX === x && before.playerY === y;
    }
    if (dismiss) after.teachDismissed.push(when);
  }
}

function standingAt(state: RoomState, x: number, y: number) {
  return state.guards.find((guard) => guard.x === x && guard.y === y && guard.state !== "down");
}

function bodyAt(state: RoomState, x: number, y: number): boolean {
  return state.guards.some((guard) => guard.x === x && guard.y === y && guard.state === "down");
}

function brushesPast(state: RoomState, kind: "constable" | "officer" | "soldier", guardState: string): boolean {
  return state.disguised && kind !== "officer" && (guardState === "patrol" || guardState === "return");
}

/** Same-node trouble that is already true before the guards take their step. */
function alreadyCaught(state: RoomState): string | null {
  for (const guard of state.guards) {
    if (guard.state === "down") continue;
    if (guard.x !== state.playerX || guard.y !== state.playerY) continue;
    if (brushesPast(state, guard.kind, guard.state)) continue;
    return guard.id;
  }
  return null;
}

function finish(state: RoomState, partial: TurnResult): TurnResult {
  const early = alreadyCaught(state);
  if (early) {
    partial.caught = { guardId: early };
    partial.exitTo = undefined;
    return partial;
  }
  const heard = resolveGuards(state);
  partial.guardMoves = heard.moves;
  partial.ghosts = heard.ghosts;
  const caught = catcher(state);
  if (caught) {
    partial.caught = { guardId: caught.id };
    partial.exitTo = undefined;
  } else {
    const cell = cellDef(state.room, state.playerX, state.playerY);
    if (cell?.kind === "exit" && cell.exitId) partial.exitTo = cell.exitId;
  }
  return partial;
}

function mutate(state: RoomState, action: Action): TurnResult {
  const from: Pos = { x: state.playerX, y: state.playerY };
  const before = cloneRoom(state);

  if (action.type === "wait") {
    spend(state);
    dismissTeach(before, state, action);
    return finish(state, {
      ok: true,
      playerFrom: from,
      playerTo: from,
      face: state.playerFace,
      guardMoves: [],
      ghosts: [],
    });
  }

  if (action.type === "ability") {
    if (state.agent === "veil") {
      if (!state.hasUniform) return blank(from, state.playerFace, "no-coat");
      spend(state);
      state.disguised = !state.disguised;
      dismissTeach(before, state, action);
      return finish(state, {
        ok: true,
        playerFrom: from,
        playerTo: from,
        face: state.playerFace,
        guardMoves: [],
        ghosts: [],
        toggledCoat: true,
      });
    }
    if (state.agent !== "kite") return blank(from, state.playerFace, "no-ability");
    if (state.stoneCd > 0) return blank(from, state.playerFace, "cooldown");
    const cells = abilityCells(state);
    let target = cells.find((cell) => cell.x === action.x && cell.y === action.y);
    if (!target && cells.length === 1) target = cells[0];
    if (!target) return blank(from, state.playerFace, "no-target");
    spend(state);
    state.stoneCd = 3;
    hearNoise(state, target.x, target.y);
    dismissTeach(before, state, action);
    return finish(state, {
      ok: true,
      playerFrom: from,
      playerTo: from,
      face: state.playerFace,
      guardMoves: [],
      ghosts: [],
      sound: { x: target.x, y: target.y },
    });
  }

  const step = DELTA[action.dir];
  const x = state.playerX + step.x;
  const y = state.playerY + step.y;
  const cell = cellDef(state.room, x, y);
  if (!cell || !passable(state, x, y)) return blank(from, state.playerFace, "blocked");
  if (bodyAt(state, x, y)) return blank(from, state.playerFace, "body");

  const guard = standingAt(state, x, y);
  let subdued: string | undefined;
  if (guard && !brushesPast(state, guard.kind, guard.state)) {
    const officerSquare = state.disguised && guard.kind === "officer";
    if (officerSquare || fromFront(action.dir, guard.face)) {
      spend(state);
      state.playerX = x;
      state.playerY = y;
      state.playerFace = action.dir;
      dismissTeach(before, state, action);
      return {
        ok: true,
        playerFrom: from,
        playerTo: { x, y },
        face: action.dir,
        caught: { guardId: guard.id },
        guardMoves: [],
        ghosts: [],
      };
    }
    guard.state = "down";
    subdued = guard.id;
  }

  spend(state);
  state.playerX = x;
  state.playerY = y;
  state.playerFace = action.dir;

  let pickup: TurnResult["pickup"];
  let courier = false;
  let banner: string | undefined;
  const key = cellKey(x, y);
  if (!state.taken[key]) {
    if (cell.kind === "item") {
      state.taken[key] = true;
      state.hasPlans = true;
      pickup = "plans";
      banner = "The courier is still under the lamps. Your call.";
    } else if (cell.kind === "note") {
      state.taken[key] = true;
      state.hasNote = true;
      pickup = "note";
      banner = "A note for Wire.";
    } else if (cell.kind === "courier") {
      state.taken[key] = true;
      state.savedCourier = true;
      courier = true;
      banner = "He is on his feet.";
    }
  }
  dismissTeach(before, state, action);
  const result = finish(state, {
    ok: true,
    playerFrom: from,
    playerTo: { x, y },
    face: action.dir,
    subdued,
    guardMoves: [],
    ghosts: [],
    pickup,
    courier,
    banner,
  });
  if (result.caught) result.exitTo = undefined;
  return result;
}

export function applyAction(state: RoomState, action: Action): { state: RoomState; result: TurnResult } {
  const next = cloneRoom(state);
  const result = mutate(next, action);
  if (!result.ok) return { state, result };
  return { state: next, result };
}

export function legalDirs(state: RoomState): Action["type"] extends string ? ("up" | "down" | "left" | "right")[] : never {
  const dirs: ("up" | "down" | "left" | "right")[] = [];
  for (const dir of ["up", "down", "left", "right"] as const) {
    const step = DELTA[dir];
    const x = state.playerX + step.x;
    const y = state.playerY + step.y;
    if (!passable(state, x, y) || bodyAt(state, x, y)) continue;
    dirs.push(dir);
  }
  return dirs;
}

export function isLoudStep(state: RoomState, x: number, y: number): boolean {
  return isLit(state, x, y);
}

export function agentOf(state: RoomState): AgentId {
  return state.agent;
}
