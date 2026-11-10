import { missionById, type GuardSpawn, type Mission, type XY } from "./missions";

export const TS = 32;
export const VW = 960;
export const VH = 540;
export const LEVELS = 6;

export type Mode = "title" | "select" | "talk" | "play" | "pause" | "done" | "finale" | "dead";

export interface Inp {
  x: number;
  y: number;
  mag: number;
  run: boolean;
  crouchP: boolean;
  act: boolean;
  actP: boolean;
  throwP: boolean;
  aimX: number;
  aimY: number;
  abilityP: boolean;
  startP: boolean;
  pauseP: boolean;
  pick: number;
}

export interface Line {
  who: string;
  text: string;
  port: string;
}

interface Opt {
  label: string;
  value: string;
}

interface Prompt {
  id: string;
  q: string;
  options: Opt[];
}

export interface Story {
  courier: string;
  train: string;
  papers: string;
  assembly: string;
  warder: string;
  signal: string;
  downs: number;
}

export interface Guard {
  x: number;
  y: number;
  face: number;
  kind: string;
  ai: "patrol" | "sus" | "alert" | "search" | "return" | "down";
  tag: string;
  range: number;
  fov: number;
  wx: number[];
  wy: number[];
  wi: number;
  tx: number;
  ty: number;
  tel: number;
  see: boolean;
  stashed: boolean;
  whistle: boolean;
  homeX: number;
  homeY: number;
}

interface Lamp {
  x: number;
  y: number;
  r: number;
  on: boolean;
}

interface Paper {
  x: number;
  y: number;
  req: boolean;
  got: boolean;
}

interface Lock {
  x: number;
  y: number;
  open: boolean;
}

interface Noise {
  x: number;
  y: number;
  r: number;
  life: number;
}

interface Pebble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export interface Player {
  x: number;
  y: number;
  face: number;
  crouch: boolean;
  hidden: boolean;
  disguise: boolean;
  channel: number;
  drag: number;
  step: number;
}

interface Save {
  guards: Guard[];
  papers: boolean[];
  locks: boolean[];
  lamps: boolean[];
  downs: number;
  notes: number;
  disguise: boolean;
  uniform: boolean;
  spotted: boolean;
  chase: boolean;
  x: number;
  y: number;
}

export interface World {
  mode: Mode;
  level: number;
  unlocked: number;
  t: number;
  time: number;
  camX: number;
  camY: number;
  cols: number;
  rows: number;
  tiles: string[];
  player: Player;
  guards: Guard[];
  lamps: Lamp[];
  papers: Paper[];
  locks: Lock[];
  noises: Noise[];
  pebble: Pebble | null;
  checks: { x: number; y: number; used: boolean }[];
  uniforms: { x: number; y: number; got: boolean }[];
  choice: XY;
  choiceId: string;
  exit: XY;
  guide: XY[];
  story: Story;
  prompt: Prompt | null;
  asked: string;
  agent: string;
  talk: Line[];
  talkI: number;
  talkShown: number;
  banner: string;
  bannerT: number;
  hint: string;
  obj: string;
  caption: string;
  actLabel: string;
  detect: number;
  lit: boolean;
  phaseT: number;
  spotted: boolean;
  chase: boolean;
  sprinting: boolean;
  hugging: boolean;
  peek: boolean;
  uniformHeld: boolean;
  notes: number;
  heat: number;
  hitsTaken: number;
  downs0: number;
  lesson: number;
  rank: string;
  score: number;
  revolt: number;
  trust: number;
  headline: string;
  chkX: number;
  chkY: number;
  save: Save | null;
  deadT: number;
  rain: Spark[];
  rainOn: boolean;
  width: number;
  height: number;
}

export const NAMES: Record<string, string> = {
  netaji: "NETAJI",
  wire: "WIRE",
  kite: "KITE",
  veil: "VEIL",
  key: "KEY",
};

export const LNAME = [
  "",
  "THE LAHORE ROOFS",
  "THE ARMS TRAIN",
  "THE PRESS",
  "THE ASSEMBLY",
  "THE LOCK",
  "THE VICEROY'S HOUSE",
];

export const CAPTION = [
  "",
  "Lahore. Kite takes the roofs above a watched bazaar.",
  "A night yard. Veil walks in someone else's coat.",
  "The workshop is lit. Key is here for the press.",
  "The Imperial Assembly. Veil is inside the marble.",
  "The jail. Key opens a wing, and a question.",
  "The Viceroy's house. The signal, then the gate.",
];

const AGENT = ["", "kite", "veil", "key", "veil", "key", "kite"];

const OBJ = [
  "",
  "Cross the roofs. Take the troop plans. The courier is still below.",
  "Reach the train. Sabotage it, or take it for the cells.",
  "The hall is lit. Bring the press out.",
  "The declaration is in the side room. Swap it, or read it aloud.",
  "Open the cell. The leaders, then the yard.",
  "Light the way. The column is waiting on your signal.",
];

const HINTS = [
  "The stick sneaks on a light push. A full push runs.",
  "Crouch. Grass, a basket, and the dark hide a low step.",
  "Action subdues from behind, hides you, or turns a lock.",
  "Throw a pebble. Ability is this spy's own trick.",
  "",
];

const PROMPTS: Record<string, Prompt> = {
  courier: {
    id: "courier",
    q: "The courier is pinned under the bazaar lamps. The plans are already in your hand.",
    options: [
      { label: "Save the courier", value: "save" },
      { label: "Take the plans and go", value: "plans" },
    ],
  },
  train: {
    id: "train",
    q: "The arms train is coupled and quiet. Wire is waiting on your word.",
    options: [
      { label: "Sabotage the train", value: "sabotage" },
      { label: "Hijack it for the cells", value: "hijack" },
    ],
  },
  papers: {
    id: "papers",
    q: "The police are in the hall. You cannot carry the whole room.",
    options: [
      { label: "Take the press", value: "press" },
      { label: "Take the forged passes", value: "passes" },
      { label: "Both, if the lamps stay dead", value: "both" },
    ],
  },
  assembly: {
    id: "assembly",
    q: "The House is in session. The file can be swapped, or the declaration can be read.",
    options: [
      { label: "Swap the documents", value: "swap" },
      { label: "Broadcast the declaration", value: "broadcast" },
    ],
  },
  warder: {
    id: "warder",
    q: "The turncoat warder offers the east door. He wants to walk out with the leaders.",
    options: [
      { label: "Spare him and use the door", value: "spare" },
      { label: "Lock him in", value: "lock" },
    ],
  },
  signal: {
    id: "signal",
    q: "The lamp room is yours. Netaji's column is on the road.",
    options: [
      { label: "Wait for the column", value: "wait" },
      { label: "Light the signal now", value: "early" },
    ],
  },
};

export function blankInp(): Inp {
  return {
    x: 0, y: 0, mag: 0, run: false, crouchP: false,
    act: false, actP: false, throwP: false, aimX: 0, aimY: 0, abilityP: false,
    startP: false, pauseP: false, pick: 0,
  };
}

function emptyStory(): Story {
  return { courier: "", train: "", papers: "", assembly: "", warder: "", signal: "", downs: 0 };
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}

function say(who: string, text: string, port = who): Line {
  return { who, text, port };
}

function brief(id: number, s: Story): Line[] {
  if (id === 1) {
    return [
      say("netaji", "Arun Menon. Kite. Kozhikode taught you roofs. Tonight Lahore is the map, and the Raj has its troop plans over the bazaar."),
      say("netaji", "Give me blood, and I will give you freedom. I am asking for your nerve, not a body on the stones. The old Lahore names are whispered here. They are not the ones I sent."),
      say("wire", "Vents run the length of the market. The street is lit, and the street is theirs. I have the radio.", "wire"),
      say("kite", "Then I take the high stone. If the courier is still under those lamps, I am not leaving him to the cordon."),
    ];
  }
  if (id === 2) {
    const react = s.courier === "save"
      ? "You brought the courier off the roofs. I do not forget a life kept. The yard is a little blinder for it."
      : s.courier === "plans"
        ? "The plans are on my table, and so is the price. The yard knows a thief was on the roofs."
        : "The arms train is in the yard. I need it ruined, or I need it ours.";
    return [
      say("netaji", react),
      say("netaji", "Leela Sen. Veil. Dhaka. A coat, a walk, a face that belongs on the platform. That is your door."),
      say("veil", "Put me beside the clerks. I will be one of them until I choose not to be."),
      say("wire", "Sabotage keeps the rifles out of the cantonment. Hijack arms the cells. Both will be heard.", "wire"),
    ];
  }
  if (id === 3) {
    const react = s.train === "hijack"
      ? "The train is ours. The workshop will be angry, and brighter."
      : s.train === "sabotage"
        ? "The train will not reach the cantonment. You bought the press a quieter hour."
        : "The press is the voice that travels after we leave the room.";
    return [
      say("netaji", react),
      say("netaji", "Rajan Pillai. Key. Travancore. The workshop door is a lock, and the hall is a lamp. Bring me a press, or passes, and leave the police in the dark."),
      say("key", "The hall is theirs until the lamps go. I will not carry more than I can run with."),
      say("wire", "The dark passage is yours. The hall is theirs. Cut the light if a sentry turns.", "wire"),
    ];
  }
  if (id === 4) {
    const react = s.papers === "both"
      ? "You carried the press and the passes. Bold. They will search the marble twice."
      : s.papers === "passes"
        ? "The passes are clean. The Assembly doors will believe you."
        : "The press is moving. Now the House itself.";
    return [
      say("netaji", react),
      say("netaji", "Leela Sen. Veil. Dhaka. The House is in session. A borrowed face crosses the marble. Swap their file, or let the House hear the declaration."),
      say("veil", "Put me in the gallery. I will look as if I belong, until I choose not to."),
    ];
  }
  if (id === 5) {
    const react = s.assembly === "broadcast"
      ? "They heard you in the House. The jails will be awake. Good. Let them look at the wrong doors."
      : "The file is swapped. The House will argue with itself while you open a cell.";
    return [
      say("netaji", react),
      say("netaji", "Rajan Pillai. Key. Travancore. Locks are a dialect you already speak. The leaders of the northern cell are in the west wing. Bring them out."),
      say("key", "There is a warder who wants to live in the next India. I will hear him before I decide which door he walks through."),
      say("wire", "East door is his offer. I do not trust a man who bargains from a bunch of keys.", "wire"),
    ];
  }
  const react = s.warder === "spare"
    ? "You let the warder walk. He left his post. I can use a man who has already changed sides."
    : s.warder === "lock"
      ? "You locked him in. The court will have heard the bolt. So be it."
      : "This is the last door.";
  return [
    say("netaji", react),
    say("netaji", "Kite, again. The Viceroy's house. You open the roof, you take the lamp room, and you tell me when the gate is mine. Dilli Chalo."),
    say("kite", "The others are already in the walls. I will put the signal where you can see it from the road."),
    say("wire", "Wait for the column if you can. Light it early only if the court wakes.", "wire"),
  ];
}

export function epilogue(w: World): string[] {
  const s = w.story;
  const lines: string[] = [];
  if (s.courier === "save") lines.push("Kite went back for the courier. The man carried the next night's map.");
  else if (s.courier === "plans") lines.push("Kite kept the plans and left the courier in the lamps. The yard was waiting.");
  if (s.train === "sabotage") lines.push("Veil ruined the arms train. The cantonment woke to empty wagons.");
  else if (s.train === "hijack") lines.push("Veil took the train. The cells met it down the line, rifles and all.");
  if (s.papers === "press") lines.push("Key carried the press out of the firelight.");
  else if (s.papers === "passes") lines.push("Key carried the forged passes, and the real press burned.");
  else if (s.papers === "both") lines.push("Key carried both, and the raid dogged the cell for a day.");
  if (s.assembly === "swap") lines.push("Veil swapped the file. The House condemned a policy it had just signed.");
  else if (s.assembly === "broadcast") lines.push("Veil read the declaration into the House. The city heard it before the clerks did.");
  if (s.warder === "spare") lines.push("Key let the warder walk out with the leaders.");
  else if (s.warder === "lock") lines.push("Key turned the warder's own lock and left him in the wing.");
  if (s.signal === "wait") lines.push("Kite held the signal until the column was on the avenue.");
  else if (s.signal === "early") lines.push("Kite lit the signal early. The column came at a run.");
  if (s.downs > 0) lines.push("Along the way, " + String(s.downs) + (s.downs === 1 ? " sentry was laid down quietly." : " sentries were laid down quietly."));
  else lines.push("No sentry was put on the floor. The route stayed a rumor.");
  const trust = trustOf(s);
  if (trust >= 5 && s.downs <= 1) {
    lines.push("Netaji's column entered a city that had already opened its gates. By morning the Raj was a closed office, and the first argument of a free India was who would speak, not who would rule them.");
  } else if (s.downs >= 4 || (s.assembly === "broadcast" && s.train === "hijack")) {
    lines.push("The column came in hard, on roads the cell had already broken. The Raj fell before noon. Freedom arrived with a long list of sleeping sentries and a louder argument about the morning after.");
  } else if (s.signal === "early") {
    lines.push("The lamp over the Viceroy's house burned, and the column answered. The Raj did not survive the night. The republic that followed was impatient, and it was theirs.");
  } else {
    lines.push("The gate opened. The column walked through it. The Raj ended there, not in a courtroom, and the cell kept the keys it had cut.");
  }
  lines.push("Dilli Chalo. The road was already theirs.");
  return lines;
}

export function trustOf(s: Story): number {
  let n = 0;
  if (s.courier === "save") n += 1;
  if (s.train === "sabotage") n += 1;
  if (s.papers === "press" || s.papers === "passes") n += 1;
  if (s.assembly === "swap") n += 1;
  if (s.warder === "spare") n += 1;
  if (s.signal === "wait") n += 1;
  return n;
}

export function revoltOf(s: Story, notes: number, heat: number): number {
  let n = 24;
  if (s.courier) n += 8;
  if (s.train === "hijack") n += 12;
  if (s.train === "sabotage") n += 7;
  if (s.papers === "both") n += 8;
  else if (s.papers) n += 6;
  if (s.assembly === "broadcast") n += 14;
  else if (s.assembly === "swap") n += 8;
  if (s.warder) n += 6;
  if (s.signal === "early") n += 10;
  else if (s.signal === "wait") n += 6;
  n += Math.min(4, notes) * 3;
  n -= heat * 5;
  return clamp(n, 0, 100);
}

function headlineFor(w: World): string {
  const s = w.story;
  if (w.level === 1) return s.courier === "plans" ? "TROOP PLANS TAKEN IN LAHORE" : "COURIER CLEAR OF THE ROOFS";
  if (w.level === 2) return s.train === "hijack" ? "ARMS TRAIN IN REBEL HANDS" : "ARMS TRAIN LEFT DEAD ON THE SIDING";
  if (w.level === 3) return s.papers === "passes" ? "FORGED PASSES ON THE ROAD" : "THE PRESS IS OUT OF THE WORKSHOP";
  if (w.level === 4) return s.assembly === "broadcast" ? "THE DECLARATION IS READ IN THE HOUSE" : "A FILE IS SWAPPED IN THE ASSEMBLY";
  if (w.level === 5) return s.warder === "lock" ? "THE WING IS OPEN. THE WARDER STAYS" : "REBEL LEADERS WALK OUT";
  return s.signal === "early" ? "THE SIGNAL BURNS OVER THE HOUSE" : "THE COLUMN IS ON THE AVENUE";
}

function tileAt(w: World, tx: number, ty: number): string {
  if (tx < 0 || ty < 0 || tx >= w.cols || ty >= w.rows) return "#";
  return w.tiles[ty]?.[tx] ?? "#";
}

function lockAt(w: World, tx: number, ty: number): Lock | undefined {
  return w.locks.find((l) => l.x === tx && l.y === ty);
}

function solidTile(w: World, tx: number, ty: number): boolean {
  const ch = tileAt(w, tx, ty);
  if (ch === "#" || ch === "c") return true;
  if (ch === "v" && w.agent !== "kite") return true;
  if (ch === "=") return lockAt(w, tx, ty)?.open !== true;
  return false;
}

function blocked(w: World, x: number, y: number): boolean {
  const r = 9;
  const x0 = Math.floor((x - r) / TS);
  const x1 = Math.floor((x + r) / TS);
  const y0 = Math.floor((y - r) / TS);
  const y1 = Math.floor((y + r) / TS);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!solidTile(w, tx, ty)) continue;
      const left = tx * TS;
      const top = ty * TS;
      const cx = clamp(x, left, left + TS);
      const cy = clamp(y, top, top + TS);
      const dx = cx - x;
      const dy = cy - y;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

function clearLine(w: World, x0: number, y0: number, x1: number, y1: number): boolean {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const tx = Math.floor(x / TS);
    const ty = Math.floor(y / TS);
    const ch = tileAt(w, tx, ty);
    if (ch === "#" || ch === "c") return false;
    if (ch === "=" && lockAt(w, tx, ty)?.open !== true) return false;
  }
  return true;
}

function inLamp(w: World, x: number, y: number): boolean {
  for (const lamp of w.lamps) {
    if (!lamp.on) continue;
    if (Math.hypot(lamp.x - x, lamp.y - y) <= lamp.r) return true;
  }
  return false;
}

function noiseAt(w: World, x: number, y: number, r: number): void {
  w.noises.push({ x, y, r, life: 0.45 });
  if (w.noises.length > 8) w.noises.shift();
}

function makeGuard(s: GuardSpawn): Guard {
  const x = (s.x + 0.5) * TS;
  const y = (s.y + 0.5) * TS;
  const x2 = (s.x2 + 0.5) * TS;
  const y2 = (s.y2 + 0.5) * TS;
  return {
    x, y, face: Math.atan2(y2 - y, x2 - x), kind: s.kind, ai: "patrol", tag: s.tag,
    range: s.range ?? 118, fov: 0.72,
    wx: [x, x2], wy: [y, y2], wi: 1,
    tx: x, ty: y, tel: 0, see: false, stashed: false, whistle: false,
    homeX: x, homeY: y,
  };
}

function copyGuard(g: Guard): Guard {
  return { ...g, wx: g.wx.slice(), wy: g.wy.slice() };
}

function center(t: XY): { x: number; y: number } {
  return { x: (t.x + 0.5) * TS, y: (t.y + 0.5) * TS };
}

function canSee(w: World, g: Guard, px: number, py: number): boolean {
  if (g.ai === "down" || g.stashed) return false;
  const p = w.player;
  if (p.hidden) return g.ai === "alert" && Math.hypot(g.x - px, g.y - py) < 18;
  const dx = px - g.x;
  const dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  let range = g.range;
  const ch = tileAt(w, Math.floor(px / TS), Math.floor(py / TS));
  if (ch === "," || ch === "g" || ch === "v" || ch === "h" || ch === "n") range *= 0.62;
  if (inLamp(w, px, py)) range *= 1.28;
  if (p.crouch) range *= 0.72;
  if ((ch === "g" || ch === "n") && p.crouch && dist > 36) return false;
  if (p.disguise && !w.sprinting && g.ai !== "alert") {
    const limit = g.kind === "officer" ? (w.agent === "veil" ? 24 : 38) : 20;
    if (dist > limit) return false;
  }
  if (dist > range || dist < 0.001) return false;
  let diff = Math.atan2(dy, dx) - g.face;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > g.fov) return false;
  return clearLine(w, g.x, g.y, px, py);
}

function seesBody(w: World, g: Guard, b: Guard): boolean {
  if (b.stashed || b.ai !== "down") return false;
  const dx = b.x - g.x;
  const dy = b.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > g.range) return false;
  let diff = Math.atan2(dy, dx) - g.face;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > g.fov) return false;
  return clearLine(w, g.x, g.y, b.x, b.y);
}

function nearestLock(w: World, reach: number): Lock | undefined {
  let best: Lock | undefined;
  let bestD = reach;
  const p = w.player;
  for (const lock of w.locks) {
    if (lock.open) continue;
    const c = center(lock);
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) { best = lock; bestD = d; }
  }
  return best;
}

function behind(g: Guard, px: number, py: number): boolean {
  const dx = px - g.x;
  const dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 26 || dist < 0.001) return false;
  const dot = Math.cos(g.face) * dx + Math.sin(g.face) * dy;
  return dot < -8;
}

function visionPoint(w: World): { x: number; y: number } {
  if (!w.peek) return { x: w.player.x, y: w.player.y };
  return {
    x: w.player.x + Math.cos(w.player.face) * 12,
    y: w.player.y + Math.sin(w.player.face) * 12,
  };
}

function useAbility(w: World): void {
  const p = w.player;
  const agent = w.agent;
  if (agent === "kite") {
    noiseAt(w, p.x + Math.cos(p.face) * 86, p.y + Math.sin(p.face) * 86, 150);
    w.banner = "A stone off the roof";
    w.bannerT = 0.7;
  } else if (agent === "veil") {
    if (w.uniformHeld) {
      p.disguise = true;
      w.banner = "The coat fits";
      w.bannerT = 0.7;
    }
  } else if (agent === "key") {
    const lock = nearestLock(w, 78);
    if (lock) {
      lock.open = true;
      w.banner = "The lock gives";
      w.bannerT = 0.6;
    } else if (w.lamps.some((lamp) => lamp.on)) {
      for (const lamp of w.lamps) lamp.on = false;
      w.banner = "The lamps die";
      w.bannerT = 0.8;
    }
  }
  if (w.level === 1 && w.lesson < 4) w.lesson = 4;
}

function labelFor(w: World): string {
  const p = w.player;
  if (p.hidden) return "Leave";
  if (p.drag >= 0) return "Drop";
  for (const g of w.guards) {
    if (g.ai !== "down" && behind(g, p.x, p.y)) return "Subdue";
  }
  for (const g of w.guards) {
    if (g.ai === "down" && !g.stashed && Math.hypot(g.x - p.x, g.y - p.y) < 24) return "Drag";
  }
  const tx = Math.floor(p.x / TS);
  const ty = Math.floor(p.y / TS);
  if (tileAt(w, tx, ty) === "h" || tileAt(w, tx, ty) === "n") return "Hide";
  if (nearestLock(w, 40)) return "Lockpick";
  if (w.uniformHeld && !p.disguise) return "Disguise";
  if (w.hugging) return "Knock";
  return "Action";
}

function dropBody(w: World): void {
  const p = w.player;
  const g = w.guards[p.drag];
  p.drag = -1;
  if (!g) return;
  const ch = tileAt(w, Math.floor(p.x / TS), Math.floor(p.y / TS));
  if (ch === "h" || ch === "n") g.stashed = true;
}

function resolveAct(w: World, inp: Inp): void {
  const p = w.player;
  if (!inp.actP) return;
  if (p.hidden) { p.hidden = false; return; }
  if (p.drag >= 0) { dropBody(w); return; }
  for (const g of w.guards) {
    if (g.ai !== "down" && behind(g, p.x, p.y)) {
      g.ai = "down";
      g.see = false;
      w.story.downs += 1;
      w.banner = "Laid down";
      w.bannerT = 0.45;
      if (w.level === 1 && w.lesson < 3) w.lesson = 3;
      return;
    }
  }
  for (let i = 0; i < w.guards.length; i++) {
    const g = w.guards[i];
    if (g && g.ai === "down" && !g.stashed && Math.hypot(g.x - p.x, g.y - p.y) < 24) {
      p.drag = i;
      return;
    }
  }
  const ch = tileAt(w, Math.floor(p.x / TS), Math.floor(p.y / TS));
  if (ch === "h" || ch === "n") { p.hidden = true; p.crouch = true; return; }
  if (w.uniformHeld && !p.disguise) {
    p.disguise = true;
    w.banner = "The coat fits";
    w.bannerT = 0.5;
    return;
  }
  if (w.hugging) {
    noiseAt(w, p.x + Math.cos(p.face) * 48, p.y + Math.sin(p.face) * 48, 160);
    w.banner = "A knock";
    w.bannerT = 0.4;
  }
}

function toss(w: World, inp: Inp): void {
  const p = w.player;
  if (p.hidden) return;
  let ax = inp.aimX;
  let ay = inp.aimY;
  if (ax * ax + ay * ay < 0.01) {
    ax = Math.cos(p.face);
    ay = Math.sin(p.face);
  }
  w.pebble = { x: p.x, y: p.y, vx: ax * 280, vy: ay * 280, life: 0.48 };
  if (w.level === 1 && w.lesson < 4) w.lesson = 4;
}

function heard(w: World, g: Guard): void {
  if (g.ai !== "patrol" && g.ai !== "return") return;
  for (const n of w.noises) {
    if (n.life < 0.28) continue;
    if (Math.hypot(n.x - g.x, n.y - g.y) <= n.r) {
      g.ai = "sus";
      g.tx = n.x;
      g.ty = n.y;
      g.tel = 3.1;
      return;
    }
  }
}

function stepGuard(w: World, g: Guard, dt: number): boolean {
  if (g.ai === "down") return false;
  if (w.player.drag >= 0 && w.guards[w.player.drag] === g) {
    g.x = w.player.x;
    g.y = w.player.y + 10;
    return false;
  }
  heard(w, g);
  const speed = g.ai === "alert" ? 92 : g.ai === "sus" ? 64 : g.ai === "return" ? 52 : 44;
  let tx = g.x;
  let ty = g.y;
  if (g.ai === "patrol") {
    tx = g.wx[g.wi] ?? g.x;
    ty = g.wy[g.wi] ?? g.y;
    if (Math.hypot(tx - g.x, ty - g.y) < 6) g.wi = g.wi === 0 ? 1 : 0;
  } else if (g.ai === "sus" || g.ai === "alert") {
    tx = g.tx;
    ty = g.ty;
    g.tel -= dt;
  } else if (g.ai === "search") {
    g.face += dt * 1.3;
    g.tel -= dt;
    if (g.tel <= 0) g.ai = "return";
  } else if (g.ai === "return") {
    tx = g.homeX;
    ty = g.homeY;
    if (Math.hypot(tx - g.x, ty - g.y) < 8) g.ai = "patrol";
  }
  if (g.ai !== "search") {
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const step = Math.min(dist, speed * dt);
      const mx = dx / dist * step;
      const my = dy / dist * step;
      if (!blocked(w, g.x + mx, g.y)) g.x += mx;
      if (!blocked(w, g.x, g.y + my)) g.y += my;
      g.face = Math.atan2(my, mx);
    } else if (g.ai === "sus") {
      g.ai = "search";
      g.tel = 2.4;
    }
  }
  if (g.ai === "sus" && g.tel <= 0) {
    g.ai = "search";
    g.tel = 2.2;
  }
  return false;
}

function caught(w: World): void {
  w.hitsTaken += 1;
  w.spotted = true;
  w.mode = "dead";
  w.deadT = 0.7;
  w.banner = "CAUGHT";
  w.bannerT = 0.7;
  w.player.hidden = false;
  w.player.drag = -1;
}

function reqsDone(w: World): boolean {
  if (!w.asked.includes("|" + w.choiceId + "|")) return false;
  for (const paper of w.papers) if (paper.req && !paper.got) return false;
  return true;
}

function tryFinish(w: World): void {
  if (w.prompt || !reqsDone(w)) return;
  const c = center(w.exit);
  if (Math.hypot(c.x - w.player.x, c.y - w.player.y) > 18) return;
  finishLevel(w);
}

function pollWorld(w: World): void {
  const p = w.player;
  for (const paper of w.papers) {
    if (paper.got) continue;
    const c = center(paper);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 20) {
      paper.got = true;
      w.notes += 1;
      w.banner = paper.req ? "Taken" : "A spare note";
      w.bannerT = 0.6;
    }
  }
  if (!w.chase && w.papers.some((paper) => paper.req) && w.papers.every((paper) => !paper.req || paper.got)) {
    w.chase = true;
    w.banner = "RUN";
    w.bannerT = 1.15;
    w.obj = "They are moving. Get to the exit.";
    for (const g of w.guards) {
      if (g.ai === "down") continue;
      if (g.tag === "chase" || g.tag === "officer") {
        g.ai = "alert";
        g.tx = p.x;
        g.ty = p.y;
        g.tel = 6;
      }
    }
  }
  for (const u of w.uniforms) {
    if (u.got) continue;
    const c = center(u);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 18) {
      u.got = true;
      w.uniformHeld = true;
      w.banner = "A uniform";
      w.bannerT = 0.5;
    }
  }
  if (!w.asked.includes("|" + w.choiceId + "|")) {
    const c = center(w.choice);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 24) {
      const prompt = PROMPTS[w.choiceId];
      if (prompt) w.prompt = { id: prompt.id, q: prompt.q, options: prompt.options.map((o) => ({ ...o })) };
    }
  }
  for (const check of w.checks) {
    if (check.used) continue;
    const c = center(check);
    if (Math.hypot(c.x - p.x, c.y - p.y) < 22) {
      check.used = true;
      w.chkX = p.x;
      w.chkY = p.y;
      w.save = takeSave(w);
      w.banner = "CHECKPOINT";
      w.bannerT = 0.45;
    }
  }
}

function takeSave(w: World): Save {
  return {
    guards: w.guards.map(copyGuard),
    papers: w.papers.map((p) => p.got),
    locks: w.locks.map((l) => l.open),
    lamps: w.lamps.map((l) => l.on),
    downs: w.story.downs,
    notes: w.notes,
    disguise: w.player.disguise,
    uniform: w.uniformHeld,
    spotted: w.spotted,
    chase: w.chase,
    x: w.player.x,
    y: w.player.y,
  };
}

function applySave(w: World, s: Save): void {
  w.guards = s.guards.map(copyGuard);
  w.papers.forEach((p, i) => { p.got = s.papers[i] === true; });
  w.locks.forEach((l, i) => { l.open = s.locks[i] === true; });
  w.lamps.forEach((l, i) => { l.on = s.lamps[i] !== false; });
  w.story.downs = s.downs;
  w.notes = s.notes;
  w.player.disguise = s.disguise;
  w.uniformHeld = s.uniform;
  w.spotted = s.spotted;
  w.chase = s.chase;
  w.chkX = s.x;
  w.chkY = s.y;
  w.pebble = null;
  w.noises = [];
  w.prompt = null;
}

function steer(w: World, g: Guard, dt: number): void {
  if (g.ai !== "alert") return;
  if (g.see) {
    g.tx = w.player.x;
    g.ty = w.player.y;
    g.tel = 1.2;
  }
  const dist = Math.hypot(g.x - w.player.x, g.y - w.player.y);
  if (dist < 20 && !w.player.hidden) caught(w);
  void dt;
}

function updatePlay(w: World, inp: Inp, dt: number): void {
  w.t += dt;
  w.time += dt;
  if (w.bannerT > 0) w.bannerT -= dt;
  const p = w.player;
  if (w.prompt) {
    if (inp.pick > 0) applyPick(w, inp.pick - 1);
    return;
  }
  if (inp.crouchP) {
    p.crouch = !p.crouch;
    if (p.crouch && w.level === 1 && w.lesson < 2) w.lesson = 2;
  }
  if (inp.abilityP) useAbility(w);
  w.actLabel = labelFor(w);
  resolveAct(w, inp);
  if (inp.throwP) toss(w, inp);
  const door = nearestLock(w, 40);
  if (inp.act && door && !p.hidden && p.drag < 0 && w.actLabel === "Lockpick") {
    p.channel += dt;
    if (p.channel >= 0.85) {
      door.open = true;
      p.channel = 0;
      w.banner = "The lock turns";
      w.bannerT = 0.45;
    }
  } else if (!inp.act) p.channel = 0;

  const moving = Math.hypot(inp.x, inp.y) > 0.2 && inp.mag > 0.12;
  if (moving && p.hidden) p.hidden = false;
  const quiet = p.crouch || (!inp.run && inp.mag < 0.82);
  w.sprinting = moving && !quiet;
  if (w.sprinting && p.disguise) {
    p.disguise = false;
    w.banner = "The disguise slips";
    w.bannerT = 0.45;
  }
  const spd = (quiet ? 70 : 168) * (p.drag >= 0 ? 0.62 : 1);
  let mx = 0;
  let my = 0;
  if (moving && !p.hidden) {
    const len = Math.hypot(inp.x, inp.y) || 1;
    mx = inp.x / len * spd * dt;
    my = inp.y / len * spd * dt;
    p.face = Math.atan2(inp.y, inp.x);
    if (w.level === 1 && w.lesson < 1) w.lesson = 1;
  }
  const beforeX = p.x;
  const beforeY = p.y;
  if (!blocked(w, p.x + mx, p.y)) p.x += mx;
  if (!blocked(w, p.x, p.y + my)) p.y += my;
  const hitX = Math.abs(p.x - beforeX) < Math.abs(mx) * 0.4 && Math.abs(mx) > 0.2;
  const hitY = Math.abs(p.y - beforeY) < Math.abs(my) * 0.4 && Math.abs(my) > 0.2;
  w.hugging = hitX || hitY;
  w.peek = (hitX && Math.abs(inp.x) > Math.abs(inp.y) + 0.2) || (hitY && Math.abs(inp.y) > Math.abs(inp.x) + 0.2);
  if (w.sprinting) {
    p.step -= dt;
    if (p.step <= 0) {
      noiseAt(w, p.x, p.y, 118);
      p.step = 0.38;
    }
  }
  if (w.pebble) {
    const b = w.pebble;
    const nx = b.x + b.vx * dt;
    const ny = b.y + b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || blocked(w, nx, ny)) {
      noiseAt(w, b.x, b.y, 150);
      w.pebble = null;
    } else {
      b.x = nx;
      b.y = ny;
    }
  }
  for (const n of w.noises) n.life -= dt;
  w.noises = w.noises.filter((n) => n.life > 0);
  pollWorld(w);
  if (w.prompt) return;
  const look = visionPoint(w);
  let anySee = false;
  for (const g of w.guards) {
    if (g.ai === "down") { g.see = false; continue; }
    g.see = canSee(w, g, look.x, look.y);
    if (g.see) {
      anySee = true;
      const was = g.ai;
      g.ai = "alert";
      g.tx = p.x;
      g.ty = p.y;
      if (was !== "alert" && !g.whistle) {
        g.whistle = true;
        for (const other of w.guards) {
          if (other === g || other.ai === "down") continue;
          if (Math.hypot(other.x - g.x, other.y - g.y) < 170 && (other.ai === "patrol" || other.ai === "return")) {
            other.ai = "sus";
            other.tx = p.x;
            other.ty = p.y;
            other.tel = 3;
          }
        }
      }
    } else if (!g.see && g.ai === "patrol") {
      for (const body of w.guards) {
        if (seesBody(w, g, body)) {
          g.ai = "sus";
          g.tx = body.x;
          g.ty = body.y;
          g.tel = 3;
          break;
        }
      }
    }
  }
  if (anySee) {
    w.spotted = true;
    if (w.phaseT <= 0) w.phaseT = 4.2;
    else w.phaseT -= dt;
    if (w.phaseT <= 0) { caught(w); return; }
  } else if (w.phaseT > 0) {
    w.phaseT -= dt;
    if (w.phaseT <= 0) {
      for (const g of w.guards) {
        if (g.ai === "alert") { g.ai = "search"; g.tel = 2.6; }
      }
    }
  }
  for (const g of w.guards) {
    if (w.mode !== "play") return;
    stepGuard(w, g, dt);
    steer(w, g, dt);
    if (w.mode !== "play") return;
  }
  let det = 0;
  for (const g of w.guards) {
    if (g.ai === "down") continue;
    if (g.see) det = 1;
    else if (g.ai === "alert" || g.ai === "search") det = Math.max(det, 0.72);
    else if (g.ai === "sus") det = Math.max(det, 0.4);
  }
  w.detect = det;
  w.lit = inLamp(w, p.x, p.y) && !p.hidden;
  w.heat = Math.max(0, w.story.downs - w.downs0);
  if (w.level === 1) w.hint = HINTS[Math.min(w.lesson, HINTS.length - 1)] ?? "";
  const lookX = p.x + Math.cos(p.face) * 70 - VW / 2;
  const lookY = p.y + Math.sin(p.face) * 48 - VH / 2;
  w.camX += (lookX - w.camX) * 0.14;
  w.camY += (lookY - w.camY) * 0.14;
  w.camX = clamp(w.camX, 0, Math.max(0, w.width - VW));
  w.camY = clamp(w.camY, 0, Math.max(0, w.height - VH));
  tryFinish(w);
}

function applyPick(w: World, index: number): void {
  const prompt = w.prompt;
  if (!prompt) return;
  const opt = prompt.options[index] ?? prompt.options[0];
  if (!opt) { w.prompt = null; return; }
  if (prompt.id === "courier") w.story.courier = opt.value;
  else if (prompt.id === "train") w.story.train = opt.value;
  else if (prompt.id === "papers") w.story.papers = opt.value;
  else if (prompt.id === "assembly") w.story.assembly = opt.value;
  else if (prompt.id === "warder") w.story.warder = opt.value;
  else if (prompt.id === "signal") w.story.signal = opt.value;
  w.asked += prompt.id + "|";
  w.prompt = null;
  w.banner = opt.label;
  w.bannerT = 0.8;
}

function tune(w: World): void {
  const s = w.story;
  if (w.level === 2 && s.courier === "save") {
    const i = w.guards.findIndex((g) => g.tag === "watch");
    if (i >= 0) w.guards.splice(i, 1);
    w.obj = "The courier is clear. The trench is quieter. Sabotage the train, or take it.";
  } else if (w.level === 2 && s.courier === "plans") {
    w.guards.push(makeGuard({ x: 12, y: 7, x2: 18, y2: 7, kind: "constable", tag: "watch" }));
    w.obj = "The plans are ours, and the yard is awake. Be someone else.";
  }
  if (w.level === 3 && s.train === "sabotage") {
    const i = w.guards.findIndex((g) => g.tag === "chase");
    if (i >= 0) w.guards.splice(i, 1);
    w.obj = "The arms never arrived. Cut the lamps if the hall looks at you.";
  } else if (w.level === 3 && s.train === "hijack") {
    w.obj = "The cells have the rifles. The workshop is searching. Move the press.";
  }
  if (w.level === 4 && s.papers === "both") {
    w.guards.push(makeGuard({ x: 14, y: 11, x2: 20, y2: 11, kind: "soldier", tag: "chase", range: 96 }));
    w.obj = "You carried both. The marble has an extra patrol.";
  }
  if (w.level === 6 && s.warder === "spare") {
    const i = w.guards.findIndex((g) => g.tag === "officer");
    if (i >= 0) w.guards.splice(i, 1);
    w.obj = "The warder left his post. One less rifle. Light the signal when you are ready.";
  } else if (w.level === 6 && s.warder === "lock") {
    w.guards.push(makeGuard({ x: 12, y: 9, x2: 18, y2: 9, kind: "soldier", tag: "chase", range: 96 }));
    w.obj = "The court heard the bolt. Stay on the roof and take the lamp room.";
  }
}

function missionWorld(w: World, m: Mission): void {
  w.cols = m.cols;
  w.rows = m.rows;
  w.tiles = m.tiles.map((row) => row);
  w.width = m.cols * TS;
  w.height = m.rows * TS;
  const start = center(m.start);
  w.player = {
    x: start.x, y: start.y, face: 0, crouch: false, hidden: false, disguise: false,
    channel: 0, drag: -1, step: 0,
  };
  w.guards = m.guards.map(makeGuard);
  w.lamps = m.lamps.map((l) => ({ x: (l.x + 0.5) * TS, y: (l.y + 0.5) * TS, r: l.r, on: true }));
  w.papers = m.papers.map((p) => ({ x: p.x, y: p.y, req: p.req, got: false }));
  w.locks = m.locks.map((l) => ({ x: l.x, y: l.y, open: false }));
  w.checks = m.checks.map((c) => ({ x: c.x, y: c.y, used: false }));
  w.uniforms = m.uniforms.map((u) => ({ x: u.x, y: u.y, got: false }));
  w.choice = m.choice;
  w.choiceId = m.choiceId;
  w.exit = m.exit;
  w.guide = m.guide;
  w.chkX = start.x;
  w.chkY = start.y;
  w.camX = clamp(start.x - VW / 2, 0, Math.max(0, w.width - VW));
  w.camY = clamp(start.y - VH / 2, 0, Math.max(0, w.height - VH));
}

export function applyLevel(w: World, id: number, talkKey: string): void {
  const m = missionById(id);
  w.level = id;
  w.mode = "play";
  missionWorld(w, m);
  w.time = 0;
  w.t = 0;
  w.agent = AGENT[id] ?? "kite";
  w.obj = OBJ[id] ?? "";
  w.caption = CAPTION[id] ?? "";
  w.banner = LNAME[id] ?? "";
  w.bannerT = 2.1;
  w.hint = id === 1 ? (HINTS[0] ?? "") : "";
  w.lesson = id === 1 ? 0 : 5;
  w.actLabel = "Action";
  w.detect = 0;
  w.lit = false;
  w.phaseT = 0;
  w.spotted = false;
  w.chase = false;
  w.sprinting = false;
  w.hugging = false;
  w.peek = false;
  w.uniformHeld = false;
  w.notes = 0;
  w.heat = 0;
  w.hitsTaken = 0;
  w.downs0 = w.story.downs;
  w.rank = "";
  w.score = 0;
  w.revolt = 0;
  w.trust = trustOf(w.story);
  w.headline = "";
  w.prompt = null;
  w.asked = "|";
  w.noises = [];
  w.pebble = null;
  w.deadT = 0;
  w.rainOn = false;
  tune(w);
  w.save = takeSave(w);
  if (talkKey) {
    w.talk = brief(id, w.story);
    w.talkI = 0;
    w.talkShown = 0;
    w.mode = "talk";
  }
}

function seedRain(): Spark[] {
  const rain: Spark[] = [];
  for (let i = 0; i < 46; i++) {
    rain.push({
      x: Math.random() * VW, y: Math.random() * VH, vx: -30, vy: 280,
      life: 1, size: 1 + Math.random() * 1.4,
    });
  }
  return rain;
}

export function fresh(): World {
  return {
    mode: "title", level: 0, unlocked: 1, t: 0, time: 0, camX: 0, camY: 0,
    cols: 0, rows: 0, tiles: [],
    player: { x: 80, y: 80, face: 0, crouch: false, hidden: false, disguise: false, channel: 0, drag: -1, step: 0 },
    guards: [], lamps: [], papers: [], locks: [], noises: [], pebble: null,
    checks: [], uniforms: [], choice: { x: 0, y: 0 }, choiceId: "", exit: { x: 0, y: 0 }, guide: [],
    story: emptyStory(), prompt: null, asked: "|", agent: "kite",
    talk: [], talkI: 0, talkShown: 0,
    banner: "", bannerT: 0, hint: "", obj: "", caption: "", actLabel: "",
    detect: 0, lit: false, phaseT: 0, spotted: false, chase: false, sprinting: false,
    hugging: false, peek: false, uniformHeld: false, notes: 0, heat: 0, hitsTaken: 0, downs0: 0,
    lesson: 0, rank: "", score: 0, revolt: 0, trust: 0, headline: "",
    chkX: 80, chkY: 80, save: null, deadT: 0, rain: seedRain(), rainOn: true,
    width: VW, height: VH,
  };
}

export function respawn(w: World): void {
  if (w.save) applySave(w, w.save);
  w.player.x = w.chkX;
  w.player.y = w.chkY;
  w.player.hidden = false;
  w.player.drag = -1;
  w.player.channel = 0;
  w.phaseT = 0;
  w.pebble = null;
  w.noises = [];
  w.mode = "play";
  w.banner = "CHECKPOINT";
  w.bannerT = 0.55;
}

export function grade(w: World): string {
  const par = [0, 70, 70, 70, 65, 60, 70][w.level] ?? 70;
  let s = 100;
  if (w.spotted) s -= 22;
  s -= w.heat * 8;
  s -= w.hitsTaken * 12;
  s += Math.min(3, w.notes) * 4;
  s -= Math.max(0, w.time - par) * 0.25;
  if (s >= 86) return "S";
  if (s >= 70) return "A";
  if (s >= 52) return "B";
  return "C";
}

export function finishLevel(w: World): void {
  w.rank = grade(w);
  w.trust = trustOf(w.story);
  w.revolt = revoltOf(w.story, w.notes, w.heat);
  w.headline = headlineFor(w);
  w.score = Math.max(0, Math.round(1000 - w.hitsTaken * 80 - w.heat * 40 - (w.spotted ? 100 : 0) + w.notes * 40 - w.time));
  if (w.unlocked < w.level + 1) w.unlocked = Math.min(LEVELS, w.level + 1);
  w.mode = "done";
  w.banner = w.rank;
  w.bannerT = 1.4;
}

export function advanceFromDone(w: World): void {
  if (w.level >= LEVELS) {
    w.mode = "finale";
    w.t = 0;
    return;
  }
  applyLevel(w, w.level + 1, "brief");
}

function updateTalk(w: World, inp: Inp, dt: number): void {
  w.talkShown += dt * 46;
  const line = w.talk[w.talkI];
  if (!line) { w.mode = "play"; return; }
  if (inp.startP) {
    if (w.talkShown < line.text.length) w.talkShown = line.text.length;
    else {
      w.talkI += 1;
      w.talkShown = 0;
    }
  }
}

function stepRain(w: World, dt: number): void {
  for (const q of w.rain) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    if (q.y > VH || q.x < -20) {
      q.x = Math.random() * (VW + 80);
      q.y = -8;
    }
  }
}

export function tick(w: World, inp: Inp, dt: number): void {
  if (w.mode === "pause") return;
  if (w.mode === "title" || w.mode === "select") {
    w.t += dt;
    stepRain(w, dt);
    if (w.mode === "title" && inp.pauseP) w.mode = "select";
    else if (w.mode === "select" && inp.pauseP) w.mode = "title";
    if (w.mode === "title" && inp.startP) applyLevel(w, 1, "brief");
    return;
  }
  if (w.mode === "talk") {
    w.t += dt;
    updateTalk(w, inp, dt);
    return;
  }
  if (w.mode === "dead") {
    w.deadT -= dt;
    if (w.deadT <= 0 || inp.startP) respawn(w);
    return;
  }
  if (w.mode === "done") {
    if (inp.startP) advanceFromDone(w);
    return;
  }
  if (w.mode === "finale") {
    w.t += dt;
    if (w.t > 8 && inp.startP) {
      w.mode = "title";
      w.t = 0;
      w.rainOn = true;
    }
    return;
  }
  if (w.mode === "play") updatePlay(w, inp, dt);
}
