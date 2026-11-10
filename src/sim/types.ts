export type Dir = "up" | "down" | "left" | "right";

export type CellKind =
  | "void"
  | "floor"
  | "shadow"
  | "light"
  | "hide"
  | "start"
  | "exit"
  | "item"
  | "note"
  | "courier"
  | "ability";

export type GuardKind = "constable" | "officer" | "soldier";
export type GuardState = "patrol" | "sus" | "search" | "return" | "alert" | "down";
export type AgentId = "kite" | "veil" | "key";
export type Speaker = "netaji" | "wire" | "kite" | "veil" | "key";
export type PropKind =
  | "lamp"
  | "pot"
  | "bell"
  | "basket"
  | "plans"
  | "note"
  | "vent"
  | "stairs"
  | "awning"
  | "desk"
  | "pit";

export type BlockFlag = "hasPlans" | "savedCourier";
export type ChoiceKey = "courier" | "train" | "papers" | "assembly" | "warder" | "signal";

export interface Cell {
  x: number;
  y: number;
  kind: CellKind;
  /** Floor colour after a pickup, and for ability / exit tiles that sit on pavement or roof. */
  ground?: "light" | "shadow";
  exitId?: string;
  itemId?: "plans" | "note";
  label?: string;
  blockedUntil?: BlockFlag;
  choice?: { key: ChoiceKey; value: string };
  prop?: PropKind;
}

export interface RouteStep {
  x: number;
  y: number;
  face?: Dir;
}

export interface GuardDef {
  id: string;
  kind: GuardKind;
  route: RouteStep[];
  coneLength?: number;
}

export interface Teach {
  when: string;
  text: string;
}

export interface Room {
  id: string;
  title: string;
  caption?: string;
  cols: number;
  rows: number;
  cells: Cell[];
  guards: GuardDef[];
  teach?: Teach[];
  spawn: { x: number; y: number };
}

export interface BriefLine {
  who: Speaker;
  text: string;
}

export interface Mission {
  id: number;
  name: string;
  agent: AgentId;
  brief: BriefLine[];
  rooms: Room[];
  parTurns: number;
  objective: string;
}

export interface Story {
  courier: "" | "save" | "plans";
  train: "" | "sabotage" | "hijack";
  papers: "" | "press" | "passes" | "both";
  assembly: "" | "swap" | "broadcast";
  warder: "" | "spare" | "lock";
  signal: "" | "wait" | "early";
  downs: number;
}

export interface GuardRuntime {
  id: string;
  kind: GuardKind;
  coneLength: number;
  x: number;
  y: number;
  face: Dir;
  state: GuardState;
  route: RouteStep[];
  routeIndex: number;
  targetX: number;
  targetY: number;
  scanned: boolean;
  searchTurns: number;
  returnX: number;
  returnY: number;
}

export interface RoomState {
  room: Room;
  agent: AgentId;
  playerX: number;
  playerY: number;
  playerFace: Dir;
  disguised: boolean;
  hasUniform: boolean;
  hasPlans: boolean;
  hasNote: boolean;
  savedCourier: boolean;
  stoneCd: number;
  turns: number;
  guards: GuardRuntime[];
  taken: Record<string, true>;
  teachDismissed: string[];
}

export interface Pos {
  x: number;
  y: number;
}

export type Action =
  | { type: "move"; dir: Dir }
  | { type: "wait" }
  | { type: "ability"; x?: number; y?: number };

export interface GuardMove {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromFace: Dir;
  face: Dir;
  fromState: GuardState;
  state: GuardState;
  pose: "walk" | "scan" | "down";
}

export interface TurnResult {
  ok: boolean;
  reason?: string;
  playerFrom: Pos;
  playerTo: Pos;
  face: Dir;
  subdued?: string;
  caught?: { guardId: string };
  guardMoves: GuardMove[];
  ghosts: Pos[];
  sound?: Pos;
  pickup?: "plans" | "note";
  courier?: boolean;
  exitTo?: string;
  banner?: string;
  toggledCoat?: boolean;
}

export type Rank = "S" | "A" | "B" | "C";
