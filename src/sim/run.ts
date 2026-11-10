import { bodyLeftInCone, cloneRoom } from "./ai";
import { cellDef } from "./board";
import { applyAction, startRoom } from "./rules";
import type { Action, Mission, Rank, RoomState, Story, TurnResult } from "./types";

export interface RunState {
  mission: Mission;
  roomIndex: number;
  room: RoomState;
  story: Story;
  caughtCount: number;
  noteCount: number;
}

export function emptyStory(): Story {
  return { courier: "", train: "", papers: "", assembly: "", warder: "", signal: "", downs: 0 };
}

export function startMission(mission: Mission, story: Story): RunState {
  return {
    mission,
    roomIndex: 0,
    room: startRoom(mission, mission.rooms[0], null),
    story: { ...story },
    caughtCount: 0,
    noteCount: 0,
  };
}

export function enterRoom(mission: Mission, roomId: string, story: Story = emptyStory()): RunState {
  const run = startMission(mission, story);
  const idx = mission.rooms.findIndex((room) => room.id === roomId);
  if (idx < 0) return run;
  run.roomIndex = idx;
  run.room = startRoom(mission, mission.rooms[idx], null);
  return run;
}

export function cloneRun(run: RunState): RunState {
  return {
    mission: run.mission,
    roomIndex: run.roomIndex,
    room: cloneRoom(run.room),
    story: { ...run.story },
    caughtCount: run.caughtCount,
    noteCount: run.noteCount,
  };
}

export type StepOutcome =
  | { type: "deny"; reason: string }
  | { type: "continue"; result: TurnResult; state: RoomState }
  | { type: "room"; result: TurnResult; roomId: string; state: RoomState }
  | { type: "extract"; result: TurnResult; story: Story; rank: Rank; turns: number; note: boolean; caught: number; bodyLeft: boolean }
  | { type: "caught"; result: TurnResult; state: RoomState };

function applyChoice(run: RunState): void {
  const cell = cellDef(run.room.room, run.room.playerX, run.room.playerY);
  const roomId = run.room.room.id;
  if (roomId === "courier") run.story.courier = "save";
  else if (roomId === "stairs" && run.story.courier !== "save") run.story.courier = "plans";
  if (cell?.choice && !(cell.choice.key === "courier" && run.story.courier === "save" && cell.choice.value === "plans")) {
    const key = cell.choice.key;
    if (key === "courier") run.story.courier = cell.choice.value === "save" ? "save" : "plans";
    else if (key === "train") run.story.train = cell.choice.value === "hijack" ? "hijack" : "sabotage";
    else if (key === "papers") {
      const value = cell.choice.value;
      run.story.papers = value === "passes" || value === "both" ? value : "press";
    } else if (key === "assembly") run.story.assembly = cell.choice.value === "broadcast" ? "broadcast" : "swap";
    else if (key === "warder") run.story.warder = cell.choice.value === "lock" ? "lock" : "spare";
    else if (key === "signal") run.story.signal = cell.choice.value === "early" ? "early" : "wait";
  }
}

export function rankOf(input: { caught: number; turns: number; par: number; note: boolean; bodyLeft: boolean }): Rank {
  let grade = 0;
  if (input.caught >= 2) grade += 2;
  else if (input.caught === 1) grade += 1;
  if (input.turns > input.par) grade += 1;
  if (!input.note) grade += 1;
  if (input.bodyLeft) grade += 1;
  return (["S", "A", "B", "C"] as const)[Math.min(3, grade)];
}

export function stepRun(run: RunState, action: Action): StepOutcome {
  const applied = applyAction(run.room, action);
  if (!applied.result.ok) return { type: "deny", reason: applied.result.reason ?? "no" };
  if (applied.result.caught) {
    run.caughtCount += 1;
    return { type: "caught", result: applied.result, state: applied.state };
  }
  if (applied.result.subdued) run.story.downs += 1;
  run.room = applied.state;
  if (applied.result.pickup === "note") run.noteCount += 1;
  if (applied.result.exitTo === "extract") {
    const bodyLeft = bodyLeftInCone(run.room);
    applyChoice(run);
    const rank = rankOf({
      caught: run.caughtCount,
      turns: run.room.turns,
      par: run.mission.parTurns,
      note: run.noteCount > 0 || run.room.hasNote,
      bodyLeft,
    });
    return {
      type: "extract",
      result: applied.result,
      story: run.story,
      rank,
      turns: run.room.turns,
      note: run.noteCount > 0 || run.room.hasNote,
      caught: run.caughtCount,
      bodyLeft,
    };
  }
  if (applied.result.exitTo) {
    const idx = run.mission.rooms.findIndex((room) => room.id === applied.result.exitTo);
    if (idx >= 0) {
      run.roomIndex = idx;
      run.room = startRoom(run.mission, run.mission.rooms[idx], applied.state);
      return { type: "room", result: applied.result, roomId: run.room.room.id, state: run.room };
    }
  }
  return { type: "continue", result: applied.result, state: run.room };
}

export interface SolveOpts {
  goal?: "any" | "save" | "plans" | "sabotage" | "hijack";
  quiet?: boolean;
  limit?: number;
  /** Stone multiplies the search. Levels are authored so a clear exists without it. */
  stone?: boolean;
}

function goalMet(outcome: StepOutcome, goal: SolveOpts["goal"]): boolean {
  if (outcome.type !== "extract") return false;
  if (!goal || goal === "any") return true;
  if (goal === "save") return outcome.story.courier === "save";
  if (goal === "plans") return outcome.story.courier === "plans";
  if (goal === "sabotage") return outcome.story.train === "sabotage";
  if (goal === "hijack") return outcome.story.train === "hijack";
  return false;
}

function actionsFor(run: RunState, stone: boolean): Action[] {
  const actions: Action[] = [
    { type: "move", dir: "right" },
    { type: "move", dir: "down" },
    { type: "move", dir: "left" },
    { type: "move", dir: "up" },
    { type: "wait" },
  ];
  if (run.mission.agent === "veil") actions.push({ type: "ability" });
  else if (stone && run.room.room.id === "courier" && run.room.stoneCd === 0) {
    for (const cell of run.room.room.cells) {
      if (cell.kind === "ability") actions.push({ type: "ability", x: cell.x, y: cell.y });
    }
  }
  return actions;
}

function keyOf(run: RunState): string {
  const room = run.room;
  const guards = room.guards
    .map((guard) =>
      [
        guard.id,
        guard.x,
        guard.y,
        guard.face,
        guard.state,
        guard.routeIndex,
        guard.targetX,
        guard.targetY,
        guard.scanned ? 1 : 0,
        guard.searchTurns,
      ].join(","),
    )
    .join(";");
  const taken = Object.keys(room.taken).sort().join(".");
  return [
    run.roomIndex,
    room.playerX,
    room.playerY,
    room.disguised ? 1 : 0,
    room.stoneCd,
    room.hasPlans ? 1 : 0,
    room.hasNote ? 1 : 0,
    room.savedCourier ? 1 : 0,
    taken,
    guards,
  ].join("|");
}

/** Deterministic breadth-first clear. Used to record a fixed solution. */
export function solve(mission: Mission, story: Story, opts: SolveOpts = {}): Action[] | null {
  const limit = opts.limit ?? 250_000;
  const start = startMission(mission, story);
  const queue: { run: RunState; actions: Action[] }[] = [{ run: start, actions: [] }];
  const seen = new Set<string>([keyOf(start)]);
  let visited = 0;
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    visited += 1;
    if (visited > limit) return null;
    for (const action of actionsFor(item.run, opts.stone === true)) {
      const next = cloneRun(item.run);
      const outcome = stepRun(next, action);
      if (outcome.type === "deny") continue;
      if (opts.quiet && outcome.type !== "caught" && outcome.result.subdued) continue;
      if (outcome.type === "caught") continue;
      if (goalMet(outcome, opts.goal)) return [...item.actions, action];
      if (outcome.type === "extract") continue;
      const stamp = keyOf(next);
      if (seen.has(stamp)) continue;
      seen.add(stamp);
      queue.push({ run: next, actions: [...item.actions, action] });
    }
  }
  return null;
}

export function playActions(mission: Mission, actions: Action[], story: Story = emptyStory()): StepOutcome {
  const run = startMission(mission, story);
  let last: StepOutcome = { type: "deny", reason: "empty" };
  for (const action of actions) {
    last = stepRun(run, action);
    if (last.type === "deny" || last.type === "caught" || last.type === "extract") return last;
  }
  return last;
}
