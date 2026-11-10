export const VW = 960;
export const VH = 540;

export interface AABB { x: number; y: number; w: number; h: number }
export interface Plat extends AABB { t: number; vx: number }
export interface Spark {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string; kind: number;
}
export interface Ent extends AABB {
  vx: number; vy: number; face: number;
  hp: number; maxHp: number;
  onG: boolean; onW: number;
  st: string; stT: number;
  coy: number; jbuf: number; dcd: number;
  combo: number; inv: number; squash: number;
  atkId: number; lastHit: number;
  kind: string; ai: string;
  pMin: number; pMax: number;
  tel: number; telMax: number;
  open: number; cool: number;
  tag: string; did: boolean; buf: number;
}
export interface Paper { x: number; y: number; got: boolean }
export interface Flag { x: number; y: number; used: boolean }
export interface Line { who: string; text: string; port: string }
export interface Bolt { x: number; y: number; vx: number; life: number }
export interface Ghost { x: number; y: number; face: number; life: number; frame: string }
export interface Inp {
  l: boolean; r: boolean; u: boolean; d: boolean;
  jump: boolean; jumpP: boolean;
  atk: boolean; atkP: boolean;
  dash: boolean; dashP: boolean;
  dodge: boolean; dodgeP: boolean;
  startP: boolean; pauseP: boolean;
}
export type Mode = "title" | "select" | "talk" | "play" | "pause" | "dead" | "done" | "finale";

interface Save {
  foes: Ent[];
  papers: boolean[];
  camMin: number;
  wave: number;
  bossDown: boolean;
  flags: number;
  days: number;
  bars: boolean;
  jatin: boolean;
  disarmed: number;
  alarm: number;
  leaflets: number;
  fireX: number;
}

export interface World {
  mode: Mode;
  level: number;
  unlocked: number;
  t: number;
  time: number;
  camX: number;
  shake: number;
  shakeT: number;
  hitstop: number;
  slomo: number;
  player: Ent;
  ally: Ent | null;
  foes: Ent[];
  plats: Plat[];
  parts: Spark[];
  rain: Spark[];
  papers: Paper[];
  checks: Flag[];
  hazards: AABB[];
  bolts: Bolt[];
  ghosts: Ghost[];
  exitX: number;
  fireX: number;
  leaflets: number;
  days: number;
  talk: Line[];
  talkI: number;
  talkShown: number;
  banner: string;
  bannerT: number;
  hint: string;
  obj: string;
  caption: string;
  score: number;
  rank: string;
  combo: number;
  comboT: number;
  maxCombo: number;
  disarmed: number;
  hitsTaken: number;
  perfects: number;
  focus: number;
  alarm: number;
  lesson: number;
  heavyOn: boolean;
  dashOn: boolean;
  chkX: number;
  chkY: number;
  deadT: number;
  width: number;
  bg: string;
  rainOn: boolean;
  gallery: boolean;
  camMin: number;
  endTalk: string;
  bossDown: boolean;
  wave: number;
  fast: boolean;
  broke: boolean;
  jatin: boolean;
  bars: boolean;
  flags: number;
  burn: number;
  aid: number;
  stand: number;
  leafCd: number;
  breadX: number;
  breadOn: boolean;
  save: Save | null;
}

export const NAMES: Record<string, string> = {
  bhagat: "BHAGAT SINGH",
  sukhdev: "SUKHDEV",
  azad: "CHANDRASHEKHAR AZAD",
  dutt: "BATUKESHWAR DUTT",
  durga: "DURGAWATI DEVI",
  jatin: "JATINDRA NATH DAS",
  narrator: "",
};

export const TALKS: Record<string, Line[]> = {
  l1: [
    { who: "sukhdev", text: "Scott ordered the charge. Lala ji is dying. The dragnet is already on the roofs.", port: "sukhdev" },
    { who: "bhagat", text: "Then we cross. Knock them down if you must. Nobody dies tonight.", port: "bhagat" },
    { who: "sukhdev", text: "Break the lathi line or go over the scaffolds. The cordon closes behind you. The officer on the last roof has to fall.", port: "sukhdev" },
  ],
  l2: [
    { who: "durga", text: "Walk at my shoulder. If you stray, or strike, they will see you are not my husband.", port: "durga" },
    { who: "bhagat", text: "The platform first. Then the roof of the train, and do not leave her between the cars.", port: "bhagat" },
    { who: "durga", text: "Slide the lamps. On the last carriage a rifleman has the coupling. Close on him. I will trip anyone who grabs me.", port: "durga" },
  ],
  l3: [
    { who: "azad", text: "They have the workshop. Three bundles of the press. Leave the machine.", port: "azad" },
    { who: "bhagat", text: "I will not leave a comrade's words in their hands.", port: "bhagat" },
    { who: "azad", text: "The fire climbs the stair behind you. I will hold the door when you have the papers. Break whoever stands on them.", port: "azad" },
  ],
  l4: [
    { who: "dutt", text: "Empty benches. Smoke, not shrapnel. The leaflet is the blow.", port: "dutt" },
    { who: "bhagat", text: "If they take us, we speak in court. Stay with me to the gallery.", port: "bhagat" },
    { who: "dutt", text: "A fight fills the house. Slip the cones, throw eight leaflets from the gallery, then stand still and be taken. I throw with you.", port: "dutt" },
  ],
  l4end: [
    { who: "narrator", text: "Two low-intensity smoke bombs fall toward empty benches. Leaflets flood the hall.", port: "" },
    { who: "bhagat", text: "It is easy to kill individuals but you cannot kill the ideas. Great empires crumbled while the ideas survived.", port: "bhagat" },
    { who: "narrator", text: "They stand and wait. Arrest is the next sentence of the plan.", port: "" },
  ],
  l5: [
    { who: "bhagat", text: "We will be treated as political prisoners. We will not eat until they hear us.", port: "bhagat" },
    { who: "narrator", text: "Lahore Central Jail, June 1929. A hunger strike begins. The warders come anyway.", port: "" },
    { who: "bhagat", text: "Read them. A perfect dodge keeps the body. When they offer bread, do not take it.", port: "bhagat" },
  ],
  jatin: [
    { who: "narrator", text: "13 September 1929. Jatindra Nath Das dies on the sixty-third day. The country erupts. The fast does not.", port: "jatin" },
  ],
  l5end: [
    { who: "narrator", text: "Early October 1929. After more than a hundred days, the strike ends. Some demands are met.", port: "" },
    { who: "narrator", text: "4 October 1930. From prison, Bhagat Singh writes to his father. A later year. A longer wait.", port: "bhagat" },
  ],
};

export const CAPTION = [
  "",
  "Lahore, 30 October 1928. After the lathi charge on the Simon Commission protest.",
  "December 1928. Durgawati Devi escorts Bhagat Singh out of Lahore in disguise.",
  "A secret HSRA workshop. The raid is already in the stair.",
  "Delhi, 8 April 1929. The Central Legislative Assembly.",
  "Lahore Central Jail, 1929. A strike of endurance.",
];

export const LNAME = [
  "",
  "ROOFTOP DRAGNET",
  "NIGHT TRAIN",
  "THE WORKSHOP",
  "THE ASSEMBLY",
  "THE LONG FAST",
];

const HINTS = [
  "Move. A and D, or the pad.",
  "Jump. Space, or Jump.",
  "Tap Attack. Three taps is a string. The third blow puts them down.",
  "Dodge as the baton lifts. Dodge through the swing and the next blow lands harder.",
  "Hold Attack. A lathi line turns a tap aside. The scaffolds go over them.",
  "",
];

export function blankInp(): Inp {
  return {
    l: false, r: false, u: false, d: false,
    jump: false, jumpP: false, atk: false, atkP: false,
    dash: false, dashP: false, dodge: false, dodgeP: false,
    startP: false, pauseP: false,
  };
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}

function aabb(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function mkEnt(x: number, y: number, kind: string): Ent {
  const hp = kind === "player" ? 5 : kind === "durga" ? 3 : kind === "inspector" ? 6 : kind === "officer" || kind === "shield" ? 4 : 3;
  return {
    x, y, w: kind === "inspector" ? 30 : 26, h: 78, vx: 0, vy: 0, face: 1,
    hp, maxHp: hp, onG: false, onW: 0, st: "idle", stT: 0,
    coy: 0, jbuf: 0, dcd: 0, combo: 1, inv: 0, squash: 0,
    atkId: 1, lastHit: 0, kind, ai: "patrol", pMin: x - 80, pMax: x + 80,
    tel: 0, telMax: 1, open: 0, cool: 0, tag: "", did: false, buf: 0,
  };
}

function copyEnt(e: Ent): Ent {
  return { ...e };
}

export function seedRain(n: number): Spark[] {
  const a: Spark[] = [];
  for (let i = 0; i < n; i++) {
    a.push({
      x: Math.random() * (VW + 200), y: Math.random() * VH,
      vx: -220, vy: 680, life: 1, max: 1, size: 8 + Math.random() * 10,
      color: "rgba(180,200,220,0.35)", kind: 1,
    });
  }
  return a;
}

function burst(w: World, x: number, y: number, n: number, color: string, spd: number): void {
  for (let i = 0; i < n; i++) {
    if (w.parts.length > 72) w.parts.shift();
    const a = Math.random() * Math.PI * 2;
    const s = spd * (0.4 + Math.random());
    w.parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80,
      life: 0.32 + Math.random() * 0.2, max: 0.55, size: 2 + Math.random() * 3, color, kind: 0,
    });
  }
}

function roof(list: Plat[], x: number, y: number, w: number): void {
  list.push({ x, y, w, h: VH - y + 30, t: 0, vx: 0 });
}
function step(list: Plat[], x: number, y: number, w: number): void {
  list.push({ x, y, w, h: 16, t: 1, vx: 0 });
}
function block(list: Plat[], x: number, y: number, w: number, h: number, t = 0): void {
  list.push({ x, y, w, h, t, vx: 0 });
}

function foe(x: number, y: number, kind: string, face: number, tag = ""): Ent {
  const e = mkEnt(x, y, kind);
  e.face = face;
  e.tag = tag;
  e.pMin = x - 70;
  e.pMax = x + 120;
  if (tag === "wave" || tag === "wait") {
    e.ai = "wait";
    e.hp = 0;
    e.st = "idle";
  }
  if (tag === "watch") e.ai = "watch";
  if (tag === "march") {
    e.ai = "march";
    e.face = -1;
    e.pMin = x - 520;
    e.pMax = x + 40;
  }
  if (tag === "drill") e.ai = "drill";
  return e;
}

function buildLevel(id: number): Pick<World,
  "plats" | "foes" | "papers" | "checks" | "hazards" | "exitX" | "width" | "bg" | "rainOn" | "obj" | "caption" | "ally"
> {
  const plats: Plat[] = [];
  const foes: Ent[] = [];
  const papers: Paper[] = [];
  const checks: Flag[] = [];
  const hazards: AABB[] = [];
  let exitX = 4000;
  let width = 4400;
  let bg = "lahore";
  let rainOn = false;
  let obj = "";
  const caption = CAPTION[id] ?? "";
  let ally: Ent | null = null;

  if (id === 1) {
    bg = "lahore"; rainOn = true; width = 4600; exitX = 4280;
    obj = "Cross the roofs. Drop the officer. Do not kill.";
    roof(plats, 0, 448, 620);
    foes.push(foe(470, 200, "constable", -1, "drill"));
    roof(plats, 620, 470, 920);
    block(plats, 1040, 348, 260, 16, 2);
    foes.push(foe(1120, 400, "shield", -1, "march"));
    foes.push(foe(1220, 400, "shield", -1, "march"));
    step(plats, 660, 370, 150);
    step(plats, 860, 270, 160);
    foes.push(foe(900, 40, "constable", 1, ""));
    step(plats, 1080, 240, 220);
    step(plats, 1340, 340, 160);
    roof(plats, 1500, 420, 820);
    foes.push(foe(1860, 200, "officer", -1, ""));
    checks.push({ x: 1980, y: 420, used: false });
    roof(plats, 2420, 440, 200);
    block(plats, 2700, 330, 34, 130, 0);
    block(plats, 2860, 300, 34, 150, 0);
    step(plats, 2760, 360, 90);
    roof(plats, 3000, 430, 360);
    step(plats, 3120, 320, 130);
    foes.push(foe(3180, 80, "rifle", -1, ""));
    hazards.push({ x: 3040, y: 338, w: 150, h: 22 });
    roof(plats, 3480, 440, 1000);
    block(plats, 3480, 300, 1000, 16, 2);
    foes.push(foe(4000, 200, "inspector", -1, "boss"));
    block(plats, 4380, 300, 28, 160, 4);
    exitX = 4460;
  } else if (id === 2) {
    bg = "station"; rainOn = true; width = 5200; exitX = 4860;
    obj = "Stay with Durga. Then take the rifleman on the last car.";
    roof(plats, 0, 450, 1680);
    ally = mkEnt(80, 300, "durga");
    foes.push(foe(380, 200, "constable", 1, "watch"));
    foes.push(foe(760, 200, "constable", -1, "watch"));
    foes.push(foe(1180, 200, "constable", 1, "watch"));
    checks.push({ x: 1560, y: 450, used: false });
    block(plats, 1780, 400, 540, 28, 0);
    block(plats, 2420, 400, 500, 28, 0);
    block(plats, 3020, 400, 500, 28, 0);
    step(plats, 1680, 490, 100);
    step(plats, 2320, 470, 100);
    step(plats, 2920, 470, 100);
    hazards.push({ x: 3180, y: 300, w: 160, h: 36 });
    roof(plats, 3480, 500, 1500);
    plats.push({ x: 3640, y: 400, w: 560, h: 40, t: 3, vx: 78 });
    plats.push({ x: 3640, y: 292, w: 560, h: 16, t: 5, vx: 78 });
    foes.push(foe(3940, 200, "rifle", -1, "boss"));
    block(plats, 4480, 300, 26, 120, 4);
    step(plats, 4300, 460, 120);
  } else if (id === 3) {
    bg = "press"; rainOn = false; width = 3000; exitX = 2680;
    obj = "Three bundles. Outrun the fire.";
    roof(plats, 0, 470, 2800);
    step(plats, 180, 390, 200);
    step(plats, 520, 310, 180);
    roof(plats, 240, 390, 420);
    roof(plats, 860, 360, 460);
    roof(plats, 1280, 270, 520);
    roof(plats, 1760, 390, 400);
    papers.push({ x: 320, y: 430, got: false }, { x: 1040, y: 320, got: false }, { x: 1500, y: 230, got: false });
    foes.push(foe(460, 200, "constable", -1, ""));
    foes.push(foe(1000, 80, "shield", -1, ""));
    foes.push(foe(1160, 80, "officer", -1, ""));
    foes.push(foe(1600, 40, "constable", 1, ""));
    foes.push(foe(2360, 200, "constable", -1, "wave"));
    foes.push(foe(2480, 200, "officer", -1, "wave"));
    foes.push(foe(2580, 200, "constable", -1, "wave"));
    checks.push({ x: 700, y: 470, used: false }, { x: 1900, y: 390, used: false });
    block(plats, 2720, 330, 24, 160, 4);
  } else if (id === 4) {
    bg = "assembly"; rainOn = false; width = 3400; exitX = 3200;
    obj = "Slip the hall. Throw eight leaflets. Then stand.";
    roof(plats, 0, 450, 1900);
    step(plats, 280, 340, 160);
    roof(plats, 420, 330, 980);
    foes.push(foe(520, 200, "officer", -1, "watch"));
    foes.push(foe(980, 200, "rifle", -1, "watch"));
    foes.push(foe(860, 200, "officer", 1, "watch"));
    foes.push(foe(1400, 200, "constable", -1, "watch"));
    checks.push({ x: 1720, y: 450, used: false });
    roof(plats, 2000, 440, 1400);
    foes.push(foe(2140, 200, "officer", -1, "wave"));
    foes.push(foe(2300, 200, "constable", -1, "wave"));
  } else {
    bg = "cell"; rainOn = false; width = VW; exitX = 99999;
    obj = "Read the warders. Refuse the bread.";
    roof(plats, 0, 470, VW);
    step(plats, 180, 390, 150);
  }
  return { plats, foes, papers, checks, hazards, exitX, width, bg, rainOn, obj, caption, ally };
}

function takeSave(w: World): Save {
  return {
    foes: w.foes.map(copyEnt),
    papers: w.papers.map((p) => p.got),
    camMin: w.camMin,
    wave: w.wave,
    bossDown: w.bossDown,
    flags: w.flags,
    days: w.days,
    bars: w.bars,
    jatin: w.jatin,
    disarmed: w.disarmed,
    alarm: w.alarm,
    leaflets: w.leaflets,
    fireX: w.fireX,
  };
}

function applySave(w: World, s: Save): void {
  w.foes = s.foes.map(copyEnt);
  for (let i = 0; i < w.papers.length; i++) {
    const p = w.papers[i];
    if (p) p.got = s.papers[i] === true;
  }
  w.camMin = s.camMin;
  w.wave = s.wave;
  w.bossDown = s.bossDown;
  w.flags = s.flags;
  w.days = s.days;
  w.bars = s.bars;
  w.jatin = s.jatin;
  w.disarmed = s.disarmed;
  w.alarm = s.alarm;
  w.leaflets = s.leaflets;
  w.fireX = s.fireX;
  w.bolts = [];
}

export function supportTop(plats: Plat[], x: number, footY: number): number | null {
  let best: number | null = null;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || pl.t === 4 || x < pl.x + 1 || x > pl.x + pl.w - 1) continue;
    const dy = pl.y - footY;
    if (dy < -80 || dy > 160) continue;
    if (best === null || pl.y < best) best = pl.y;
  }
  return best;
}

function integrate(e: Ent, plats: Plat[], dt: number, crouch: boolean, gatesOpen: boolean): void {
  if (crouch && e.h > 50) {
    e.y += e.h - 46;
    e.h = 46;
  } else if (!crouch && e.h < 70) {
    const ny = e.y - (78 - e.h);
    const test: AABB = { x: e.x, y: ny, w: e.w, h: 78 };
    let blocked = false;
    for (let i = 0; i < plats.length; i++) {
      const pl = plats[i];
      if (!pl || pl.t === 1 || (pl.t === 4 && gatesOpen)) continue;
      if (aabb(test, pl)) blocked = true;
    }
    if (!blocked) { e.y = ny; e.h = 78; }
  }
  const ox = e.x;
  e.onW = 0;
  e.x += e.vx * dt;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || pl.t === 1 || pl.h <= 40 || (pl.t === 4 && gatesOpen)) continue;
    if (!aabb(e, pl)) continue;
    const rise = e.y + e.h - pl.y;
    if (rise > 0 && rise <= 42 && e.vy >= -40) e.y = pl.y - e.h;
    else {
      if (e.vx > 0 || ox + e.w <= pl.x + 1) { e.x = pl.x - e.w; e.onW = 1; }
      else { e.x = pl.x + pl.w; e.onW = -1; }
      e.vx = 0;
    }
  }
  e.y += e.vy * dt;
  e.onG = false;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || (pl.t === 4 && gatesOpen) || !aabb(e, pl)) continue;
    const prevBottom = e.y - e.vy * dt + e.h;
    if (e.vy >= 0 && pl.t !== 2 && pl.t !== 5 && prevBottom <= pl.y + 12) {
      e.y = pl.y - e.h;
      e.vy = 0;
      e.onG = true;
    } else if (pl.t !== 1 && e.vy < 0) {
      e.y = pl.y + pl.h;
      e.vy = 0;
    } else if (pl.t !== 1 && pl.h > 40) {
      if (ox + e.w <= pl.x) e.x = pl.x - e.w;
      else if (ox >= pl.x + pl.w) e.x = pl.x + pl.w;
    }
  }
}

function weary(w: World): number {
  if (!w.fast) return 1;
  return clamp(1 - w.days / 340, 0.74, 1);
}

function perfect(w: World, p: Ent): void {
  w.perfects += 1;
  w.focus = 1.7;
  w.hitstop = Math.max(w.hitstop, 0.07);
  w.slomo = 0.18;
  w.shake = 6;
  w.shakeT = 0.12;
  w.banner = "READ";
  w.bannerT = 0.45;
  if (w.jatin && p.hp < p.maxHp) p.hp += 1;
  burst(w, p.x + p.w * 0.5, p.y + 30, 10, "#f0e2a8", 220);
}

function hurt(w: World, e: Ent, dmg: number, dir: number, readable: boolean): void {
  if (e.st === "down") return;
  if (e.inv > 0) {
    if (readable && e.kind === "player" && e.st === "dodge") perfect(w, e);
    return;
  }
  e.hp -= dmg;
  e.inv = e.kind === "player" ? 0.7 : 0.3;
  e.vx = dir * 260;
  e.vy = -200;
  e.st = e.hp <= 0 ? "down" : "hit";
  e.stT = 0;
  e.squash = 1;
  w.shakeT = 0.18;
  w.shake = 7;
  burst(w, e.x + e.w * 0.5, e.y + 30, 8, "#e7c98a", 240);
  if (e.kind === "player") {
    w.hitsTaken += 1;
    w.combo = 0;
    w.focus = 0;
    if (e.hp <= 0) {
      w.mode = "dead";
      w.deadT = 0.7;
      w.banner = "SEIZED";
      w.bannerT = 0.8;
    }
  } else if (e.kind === "durga" && e.hp <= 0) {
    w.mode = "dead";
    w.deadT = 0.9;
    w.banner = "SHE IS TAKEN";
    w.bannerT = 1;
  }
}

function facing(e: Ent, p: Ent): boolean {
  const dir = (p.x + p.w * 0.5) >= (e.x + e.w * 0.5) ? 1 : -1;
  return e.face === dir;
}

function guarding(e: Ent, p: Ent): boolean {
  if (e.open > 0 || e.hp <= 0) return false;
  if (!facing(e, p)) return false;
  if (e.kind === "shield") return true;
  if (e.kind === "inspector" && e.ai === "guard") return true;
  return false;
}

function disarm(w: World, e: Ent, dir: number): void {
  e.hp = 0;
  e.st = "down";
  e.ai = "down";
  e.vx = dir * 240;
  e.vy = -180;
  w.disarmed += 1;
  w.combo += 1;
  w.comboT = 1.7;
  if (w.combo > w.maxCombo) w.maxCombo = w.combo;
  w.hitstop = Math.max(w.hitstop, 0.08);
  w.shake = 9;
  w.shakeT = 0.18;
  w.slomo = Math.max(w.slomo, 0.08);
  if (e.tag === "boss") {
    w.bossDown = true;
    w.banner = "DISARMED";
    w.bannerT = 0.9;
  }
  burst(w, e.x + e.w * 0.5, e.y + 36, 14, "#ffe7b0", 320);
}

function connect(w: World, p: Ent, e: Ent, dmg: number, heavy: boolean): void {
  if (e.hp <= 0 || e.ai === "wait" || e.lastHit === p.atkId) return;
  const reach = Math.abs((p.x + p.w * 0.5) - (e.x + e.w * 0.5));
  if ((e.kind === "rifle" || (e.kind === "inspector" && e.ai === "aim")) && reach > 92 && !heavy) return;
  if (guarding(e, p) && !heavy && w.focus <= 0) {
    e.lastHit = p.atkId;
    w.hitstop = Math.max(w.hitstop, 0.04);
    w.shake = 3;
    w.shakeT = 0.08;
    p.vx = -p.face * 140;
    burst(w, e.x + e.w * 0.5, e.y + 28, 6, "#d9d3c4", 180);
    w.banner = "CLANG";
    w.bannerT = 0.28;
    return;
  }
  e.lastHit = p.atkId;
  let d = dmg;
  let focus = false;
  if (w.focus > 0) {
    d += 2;
    w.focus = 0;
    focus = true;
  }
  if (heavy || focus) e.open = 0.9;
  e.hp -= d;
  const finisher = p.combo >= 3 || heavy || focus;
  e.vx = p.face * (finisher ? 340 : 170);
  e.vy = finisher ? -200 : -70;
  e.st = "hit";
  e.stT = 0;
  e.squash = 1;
  if (e.hp > 0 && (e.kind === "shield" || e.kind === "inspector") && !heavy && !focus) {
    e.ai = e.kind === "inspector" ? "guard" : e.ai;
  } else if (e.hp > 0) {
    e.ai = "stun";
  }
  if (e.hp > 0) {
    w.combo += 1;
    w.comboT = 1.7;
    if (w.combo > w.maxCombo) w.maxCombo = w.combo;
  }
  w.hitstop = Math.max(w.hitstop, focus ? 0.1 : finisher ? 0.08 : 0.045);
  w.shake = focus ? 11 : finisher ? 8 : 4;
  w.shakeT = 0.16;
  burst(w, e.x + e.w * 0.5, e.y + 32, finisher ? 12 : 7, focus ? "#fff1c4" : "#ffe0a4", finisher ? 340 : 240);
  if (e.hp <= 0) disarm(w, e, p.face);
}

function attackBox(p: Ent, heavy: boolean): AABB {
  const w = heavy ? 70 : 58;
  return {
    x: p.face > 0 ? p.x + p.w - 6 : p.x - w + 6,
    y: p.y + (heavy ? 8 : 16),
    w,
    h: heavy ? 64 : 50,
  };
}

function swing(w: World, p: Ent, heavy: boolean): void {
  const box = attackBox(p, heavy);
  const dmg = heavy ? 2 : p.combo >= 3 ? 2 : 1;
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e || !aabb(box, e)) continue;
    connect(w, p, e, dmg, heavy);
  }
}

function separate(p: Ent, foes: Ent[]): void {
  for (let i = 0; i < foes.length; i++) {
    const e = foes[i];
    if (!e || e.hp <= 0 || e.ai === "wait") continue;
    if (!aabb(p, e)) continue;
    const overlapY = Math.min(p.y + p.h, e.y + e.h) - Math.max(p.y, e.y);
    if (overlapY < 36) continue;
    if (p.x + p.w * 0.5 < e.x + e.w * 0.5) p.x = e.x - p.w - 0.5;
    else p.x = e.x + e.w + 0.5;
  }
}

function updatePlayer(w: World, p: Ent, inp: Inp, dt: number): void {
  const press = (inp.atkP || p.buf === 1) && w.hitstop <= 0;
  const dodgePress = (inp.dodgeP || p.buf === 2) && w.hitstop <= 0;
  if (w.hitstop > 0) {
    if (inp.atkP) p.buf = 1;
    else if (inp.dodgeP) p.buf = 2;
  } else p.buf = 0;
  if (inp.jumpP) p.jbuf = 0.12;
  if (p.onG) p.coy = 0.1;
  else p.coy -= dt;
  p.jbuf -= dt;
  p.dcd -= dt;
  p.cool -= dt;
  p.inv -= dt;
  p.open -= dt;
  p.squash = Math.max(0, p.squash - dt * 5);
  if (w.hitstop <= 0) p.stT += dt;
  const speed = 360 * weary(w);

  if (p.st === "down") return;
  if (p.st === "hit") {
    p.vx *= Math.max(0, 1 - 3 * dt);
    if (p.stT > 0.28) p.st = p.onG ? "idle" : "jump";
  }
  const busy = p.st === "hit" || p.st === "down";
  if (!busy && dodgePress && p.cool <= 0 && p.st !== "dodge") {
    p.st = "dodge";
    p.stT = 0;
    p.inv = 0.2;
    p.cool = 0.42;
    p.vx = p.face * 460;
    p.vy *= 0.4;
    if (w.lesson === 3) w.lesson = 4;
    burst(w, p.x, p.y + p.h, 5, "#cbbfa6", 120);
  }
  if (!busy && w.dashOn && inp.dashP && p.dcd <= 0 && p.st !== "dodge") {
    const slide = inp.d && p.onG;
    p.st = slide ? "slide" : "dash";
    p.stT = 0;
    p.dcd = 0.48;
    p.vx = p.face * (slide ? 620 : 760);
    p.vy = 0;
    burst(w, p.x + p.w * 0.5, p.y + p.h, 7, "#d8c4a0", 160);
  }
  if (!busy && press && p.st === "dash") {
    p.st = "attack";
    p.combo = 1;
    p.stT = 0;
    p.atkId += 1;
    p.did = false;
    p.vx = p.face * 280;
  } else if (!busy && press && p.st === "attack" && p.combo < 3 && p.stT > 0.08 && p.stT < 0.3) {
    p.combo += 1;
    p.stT = 0;
    p.atkId += 1;
    p.did = false;
    p.vx += p.face * 80;
  } else if (!busy && press && (p.st === "idle" || p.st === "run" || p.st === "jump")) {
    p.st = "attack";
    p.combo = 1;
    p.stT = 0;
    p.atkId += 1;
    p.did = false;
    p.vx += p.face * 60;
    if (w.lesson < 3) w.lesson = 3;
  }
  if (p.st === "attack" && !p.did && w.heavyOn && inp.atk && p.combo === 1 && p.stT > 0.16) {
    p.st = "heavy";
    p.stT = 0;
    p.atkId += 1;
    p.did = false;
    p.vx += p.face * 40;
    if (w.lesson === 4) w.lesson = 5;
  }

  if (p.jbuf > 0 && p.st !== "dodge" && p.st !== "down" && p.st !== "heavy" && (p.coy > 0 || p.onW !== 0)) {
    p.jbuf = 0;
    p.coy = 0;
    if (p.onW !== 0 && !p.onG) {
      p.face = -p.onW;
      p.vx = -p.onW * 380;
      p.vy = -700;
    } else p.vy = -840 * Math.sqrt(weary(w));
    p.onG = false;
    if (p.st !== "attack" && p.st !== "heavy") p.st = "jump";
    if (w.lesson < 2) w.lesson = 2;
  }
  if (p.st !== "dash") {
    p.vy += 2500 * dt;
    if (!inp.jump && p.vy < -220) p.vy += 2200 * dt;
    if (p.vy > 1500) p.vy = 1500;
  }

  if (p.st !== "dash" && p.st !== "slide" && p.st !== "dodge" && p.st !== "hit" && p.st !== "heavy") {
    const wish = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
    if (wish !== 0 && p.st !== "attack") {
      p.face = wish;
      p.vx += wish * 4200 * dt;
      p.vx = clamp(p.vx, -speed, speed);
    } else if (p.st !== "attack") {
      const fr = p.onG ? 3200 : 800;
      if (p.vx > 0) p.vx = Math.max(0, p.vx - fr * dt);
      else p.vx = Math.min(0, p.vx + fr * dt);
    }
  }
  if (p.st === "dash" && p.stT > 0.16) p.st = p.onG ? "idle" : "jump";
  if (p.st === "slide" && p.stT > 0.34) p.st = "idle";
  if (p.st === "dodge" && p.stT > 0.32) p.st = p.onG ? "idle" : "jump";
  if (p.st === "attack") {
    const dur = p.combo >= 3 ? 0.34 : 0.2;
    if (!p.did && p.stT > 0.04 && p.stT < 0.14) {
      p.did = true;
      swing(w, p, false);
    }
    if (p.stT > dur && p.st === "attack") p.st = p.onG ? "idle" : "jump";
  }
  if (p.st === "heavy") {
    p.vx *= Math.max(0, 1 - 2 * dt);
    if (!p.did && p.stT > 0.14 && p.stT < 0.28) {
      p.did = true;
      swing(w, p, true);
      p.squash = 1;
    }
    if (p.stT > 0.42) p.st = p.onG ? "idle" : "jump";
  }
  if ((p.st === "idle" || p.st === "run") && !p.onG) p.st = "jump";
  if (p.st === "jump" && p.onG) {
    p.st = "idle";
    p.squash = 1;
  }
  if (p.st === "idle" && Math.abs(p.vx) > 30 && p.onG) p.st = "run";
  if (p.st === "run" && Math.abs(p.vx) <= 30 && p.onG) p.st = "idle";

  if (p.st === "dodge" || p.st === "dash") {
    w.ghosts.push({ x: p.x + p.w * 0.5, y: p.y + p.h, face: p.face, life: 0.18, frame: p.st === "dash" ? "player_dash" : "player_dodge" });
    if (w.ghosts.length > 5) w.ghosts.shift();
  }

  const crouch = p.st === "slide" || p.st === "dodge" || (inp.d && p.onG && p.st !== "attack" && p.st !== "heavy" && p.st !== "hit");
  const wasG = p.onG;
  integrate(p, w.plats, dt, crouch, w.bossDown || w.wave >= 2);
  if (!wasG && p.onG) p.squash = 1;
  separate(p, w.foes);
  if (p.x < w.camMin + 4) p.x = w.camMin + 4;
  if (p.x > w.width - 40) p.x = w.width - 40;
  if (w.lesson === 0 && Math.abs(p.x - 70) > 28) w.lesson = 1;
}

function sight(w: World, e: Ent, p: Ent): boolean {
  if (e.hp <= 0) return false;
  const dx = (p.x + p.w * 0.5) - (e.x + e.w * 0.5);
  if (e.face > 0 && dx < 8) return false;
  if (e.face < 0 && dx > -8) return false;
  const range = p.h < 60 ? 108 : e.kind === "rifle" ? 260 : 196;
  if (Math.abs(dx) > range) return false;
  if (Math.abs((p.y + p.h) - (e.y + e.h)) > 80) return false;
  if (w.level === 2 && p.x < 1650 && w.ally && w.ally.hp > 0) {
    const close = Math.abs(p.x - w.ally.x) < 88 && Math.abs(p.y - w.ally.y) < 48;
    const calm = p.st !== "attack" && p.st !== "heavy" && p.st !== "dash";
    if (close && calm) return false;
  }
  return true;
}

function startTel(e: Ent, time: number): void {
  e.ai = "telegraph";
  e.tel = time;
  e.telMax = time;
  e.stT = 0;
  e.did = false;
  e.vx = 0;
  e.st = "attack";
}

function bolt(w: World, e: Ent): void {
  if (w.bolts.length > 8) w.bolts.shift();
  w.bolts.push({ x: e.x + e.w * 0.5 + e.face * 20, y: e.y + 28, vx: e.face * 460, life: 1.2 });
}

function updateFoe(w: World, e: Ent, p: Ent, dt: number): void {
  e.stT += dt;
  e.inv -= dt;
  e.open -= dt;
  e.cool -= dt;
  if (e.ai === "wait") return;
  if (e.hp <= 0 || e.ai === "down") {
    e.st = "down";
    e.vx *= Math.max(0, 1 - 4 * dt);
    e.vy += 2500 * dt;
    integrate(e, w.plats, dt, false, w.bossDown || w.wave >= 2);
    return;
  }
  if (e.ai === "stun" || e.st === "hit") {
    e.vy += 2500 * dt;
    e.vx *= Math.max(0, 1 - 3 * dt);
    integrate(e, w.plats, dt, false, w.bossDown || w.wave >= 2);
    if (e.stT > (e.kind === "inspector" ? 0.22 : 0.32)) {
      e.ai = e.kind === "shield" ? "march" : "chase";
      e.st = "idle";
    }
    return;
  }
  const dx = (p.x + p.w * 0.5) - (e.x + e.w * 0.5);
  const dist = Math.abs(dx);
  const nearY = Math.abs(p.y - e.y) < 90;
  const slow = w.aid > 0 ? 0.62 : 1;
  const seen = sight(w, e, p);

  if (e.tag === "drill" && w.lesson < 2) {
    e.vx = 0;
    e.face = dx >= 0 ? 1 : -1;
    e.st = "idle";
    e.vy += 2500 * dt;
    integrate(e, w.plats, dt, false, false);
    return;
  }

  if ((e.tag === "watch" || e.ai === "watch") && e.ai !== "chase" && e.ai !== "telegraph" && e.ai !== "strike" && e.ai !== "aim" && e.ai !== "recover" && e.ai !== "guard") {
    e.vx = 0;
    e.st = "idle";
    if (seen) {
      w.alarm = clamp(w.alarm + (e.kind === "rifle" ? 18 : 12), 0, 100);
      e.ai = e.kind === "rifle" ? "aim" : "chase";
      if (e.ai === "aim") { e.tel = 0.48; e.telMax = 0.48; }
    }
  } else if (e.ai === "drill" || e.ai === "patrol") {
    if (e.x < e.pMin) e.face = 1;
    if (e.x > e.pMax) e.face = -1;
    e.vx = e.face * 70;
    e.st = "run";
    if (dist < 280 && nearY) e.ai = "chase";
  } else if (e.ai === "march") {
    e.face = -1;
    e.vx = -78 * slow;
    e.st = "run";
    if (e.x < e.pMin) e.x = e.pMin;
    if (dist < 78 && nearY && dx < 0) startTel(e, 0.4);
  } else if (e.ai === "chase") {
    e.face = dx >= 0 ? 1 : -1;
    const spd = (e.kind === "constable" ? 175 : e.kind === "inspector" ? 150 : 125) * slow;
    e.vx = e.face * spd;
    e.st = "run";
    const reach = e.kind === "rifle" ? 70 : e.kind === "officer" ? 64 : 54;
    if (dist < reach && nearY && e.cool <= 0) {
      const wind = e.tag === "drill" ? 0.62 : e.kind === "constable" ? 0.3 : e.kind === "inspector" ? 0.36 : 0.46;
      startTel(e, wind);
    }
    if (e.kind === "rifle" && dist > 150 && dist < 340 && nearY && e.cool <= 0) {
      e.ai = "aim";
      e.tel = 0.5;
      e.telMax = 0.5;
      e.vx = 0;
    }
    if (e.kind === "inspector" && e.cool <= 0 && dist > 160 && nearY) {
      e.ai = "aim";
      e.tel = 0.42;
      e.telMax = 0.42;
      e.vx = 0;
    }
  } else if (e.ai === "aim") {
    e.face = dx >= 0 ? 1 : -1;
    e.vx = 0;
    e.st = "attack";
    e.tel -= dt;
    if (dist < 88 && nearY) startTel(e, 0.28);
    else if (e.tel <= 0) {
      bolt(w, e);
      e.ai = "recover";
      e.stT = 0;
      e.cool = e.kind === "inspector" ? 1.15 : 1.35;
    }
  } else if (e.ai === "recover") {
    e.vx = 0;
    e.st = "idle";
    if (e.stT > 0.35) e.ai = "chase";
  } else if (e.ai === "guard") {
    e.face = dx >= 0 ? 1 : -1;
    e.vx = 0;
    e.st = "idle";
    if (e.stT > 1.05) {
      e.ai = "chase";
      e.open = 0.35;
    }
  } else if (e.ai === "telegraph") {
    e.vx = e.face * (e.kind === "officer" ? 40 : 10);
    e.st = "attack";
    e.tel -= dt;
    if (e.tel <= 0) {
      e.ai = "strike";
      e.stT = 0;
      e.did = false;
    }
  } else if (e.ai === "strike") {
    e.st = "attack";
    e.vx = e.face * (e.kind === "constable" ? 90 : 50);
    if (!e.did && e.stT > 0.06 && e.stT < 0.2) {
      const box: AABB = {
        x: e.face > 0 ? e.x + e.w - 4 : e.x - (e.kind === "officer" || e.kind === "inspector" ? 62 : 48),
        y: e.y + 8,
        w: e.kind === "officer" || e.kind === "inspector" ? 66 : 52,
        h: 60,
      };
      if (aabb(box, p)) {
        e.did = true;
        hurt(w, p, 1, e.face, true);
      }
      if (w.ally && w.ally.hp > 0 && aabb(box, w.ally)) hurt(w, w.ally, 1, e.face, false);
    }
    if (e.stT > 0.42) {
      e.ai = e.kind === "shield" ? "march" : "chase";
      e.cool = 0.35;
      if (e.kind === "inspector" && e.hp <= 3) {
        e.ai = "guard";
        e.stT = 0;
      }
    }
  }

  e.vy += 2500 * dt;
  if (e.vy > 1400) e.vy = 1400;
  if (e.ai !== "stun" && e.ai !== "down") integrate(e, w.plats, dt, false, w.bossDown || w.wave >= 2);
}

function updateAlly(w: World, a: Ent, p: Ent, dt: number): void {
  a.cool -= dt;
  a.inv -= dt;
  if (a.hp <= 0) {
    a.st = "down";
    integrate(a, w.plats, dt, false, w.bossDown);
    return;
  }
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e || e.hp <= 0 || a.cool > 0) continue;
    if (Math.abs(e.x - a.x) < 58 && Math.abs(e.y - a.y) < 46 && (e.ai === "chase" || e.ai === "strike")) {
      e.hp -= 1;
      e.ai = "stun";
      e.st = "hit";
      e.stT = 0;
      e.vx = a.face * 160;
      a.cool = 2.5;
      burst(w, e.x, e.y + 20, 6, "#e4c4ea", 160);
      if (e.hp <= 0) disarm(w, e, a.face);
    }
  }
  const target = p.x - p.face * 58;
  const dx = target - a.x;
  if (Math.abs(dx) > 18) {
    a.face = dx > 0 ? 1 : -1;
    a.vx = a.face * (Math.abs(dx) > 150 ? 250 : 180);
    a.st = "run";
  } else {
    a.vx *= 0.7;
    a.st = "idle";
  }
  const foot = a.y + a.h;
  const probe = a.x + (a.face > 0 ? a.w + 36 : -36);
  const ahead = supportTop(w.plats, probe, foot);
  const here = supportTop(w.plats, a.x + a.w * 0.5, foot);
  if (a.onG && (ahead === null || (here !== null && ahead < here - 16) || p.y + 36 < a.y)) a.vy = -840;
  a.vy += 2500 * dt;
  integrate(a, w.plats, dt, false, w.bossDown);
  if (a.y > VH + 160) {
    a.x = p.x - 48;
    a.y = p.y;
    a.vy = 0;
  }
}

function ride(e: Ent, plats: Plat[], dt: number): void {
  if (!e.onG) return;
  const foot = e.y + e.h;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || pl.t !== 3 || pl.vx === 0) continue;
    if (e.x + e.w > pl.x + 2 && e.x < pl.x + pl.w - 2 && Math.abs(foot - pl.y) <= 8) e.x += pl.vx * dt;
  }
}

function updateBolts(w: World, dt: number): void {
  const p = w.player;
  for (let i = w.bolts.length - 1; i >= 0; i--) {
    const b = w.bolts[i];
    if (!b) continue;
    b.x += b.vx * dt;
    b.life -= dt;
    const box: AABB = { x: b.x - 6, y: b.y - 4, w: 14, h: 8 };
    if (aabb(box, p)) {
      hurt(w, p, 1, b.vx > 0 ? 1 : -1, true);
      b.life = 0;
    }
    if (b.life <= 0 || b.x < w.camMin - 40 || b.x > w.width + 40) w.bolts.splice(i, 1);
  }
}

function wake(e: Ent): void {
  e.hp = e.maxHp;
  e.ai = "chase";
  e.st = "idle";
  e.stT = 0;
  e.vy = 0;
}

function updatePlay(w: World, inp: Inp, dt: number): void {
  const real = dt;
  if (w.hitstop > 0) {
    w.hitstop -= real;
    dt = 0;
  } else if (w.slomo > 0) {
    w.slomo -= real;
  }
  w.time += real;
  w.t += real;
  w.bannerT -= real;
  w.comboT -= real;
  w.focus -= real;
  w.aid -= real;
  w.burn -= real;
  w.leafCd -= real;
  if (w.comboT <= 0) w.combo = 0;
  if (w.focus < 0) w.focus = 0;

  for (let i = 0; i < w.plats.length; i++) {
    const pl = w.plats[i];
    if (!pl || (pl.t !== 3 && pl.t !== 5)) continue;
    pl.x += pl.vx * real;
    if (pl.x > 3960) pl.vx = 0;
  }

  const foeDt = w.hitstop > 0 ? 0 : w.slomo > 0 ? real * 0.4 : real;
  const pDt = w.hitstop > 0 ? 0 : w.slomo > 0 ? real * 0.75 : real;
  if (pDt > 0 || inp.atkP || inp.dodgeP || inp.jumpP) updatePlayer(w, w.player, inp, pDt || 0);
  if (foeDt > 0) {
    for (let i = 0; i < w.foes.length; i++) {
      const e = w.foes[i];
      if (e) updateFoe(w, e, w.player, foeDt);
    }
    if (w.ally) updateAlly(w, w.ally, w.player, foeDt);
    updateBolts(w, foeDt);
  }
  ride(w.player, w.plats, real);
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (e) ride(e, w.plats, real);
  }
  if (w.ally) ride(w.ally, w.plats, real);
  for (let i = w.ghosts.length - 1; i >= 0; i--) {
    const g = w.ghosts[i];
    if (!g) continue;
    g.life -= real;
    if (g.life <= 0) w.ghosts.splice(i, 1);
  }

  const p = w.player;
  if (w.level === 4 && w.alarm >= 100 && (w.flags & 1) === 0) {
    w.flags |= 1;
    w.foes.push(foe(p.x - 280, p.y - 40, "officer", 1, ""));
    w.banner = "THE HOUSE IS UP";
    w.bannerT = 1;
  }
  if (w.lesson === 3 && p.x > 1100) w.lesson = 4;
  if (w.lesson === 4 && p.x > 1860) w.lesson = 5;
  w.heavyOn = w.level > 1 || w.lesson >= 4;
  w.hint = w.level === 1 ? (HINTS[w.lesson] ?? "") : w.level === 2 && p.x < 1650 ? "Stay at her shoulder. Hold Down to shorten a cone." : "";

  for (let i = 0; i < w.papers.length; i++) {
    const pap = w.papers[i];
    if (!pap || pap.got) continue;
    if (Math.abs(p.x - pap.x) < 36 && Math.abs(p.y + p.h - pap.y) < 80) {
      pap.got = true;
      burst(w, pap.x, pap.y, 8, "#f2e2a0", 160);
    }
  }
  for (let i = 0; i < w.checks.length; i++) {
    const c = w.checks[i];
    if (!c || c.used) continue;
    if (Math.abs(p.x - c.x) < 40 && Math.abs(p.y + p.h - c.y) < 80) {
      c.used = true;
      w.chkX = c.x - 10;
      w.chkY = c.y - p.h;
      w.save = takeSave(w);
      w.banner = "CHECKPOINT";
      w.bannerT = 0.8;
    }
  }
  for (let i = 0; i < w.hazards.length; i++) {
    const h = w.hazards[i];
    if (!h) continue;
    if (p.h > 60 && aabb(p, h)) hurt(w, p, 1, -p.face || -1, false);
  }
  if (w.level === 3) {
    w.fireX += real * 52;
    if (p.x + p.w < w.fireX && w.burn <= 0) {
      hurt(w, p, 1, 1, false);
      w.burn = 0.75;
    }
    const got = w.papers.filter((x) => x.got).length;
    w.obj = "Bundles " + String(got) + "/3. The fire is behind you.";
    if (got >= 3 && w.wave === 0) {
      w.wave = 1;
      w.aid = 8;
      w.banner = "AZAD HAS THE DOOR";
      w.bannerT = 1.2;
      for (const e of w.foes) if (e.tag === "wave") wake(e);
    }
    if (w.wave === 1 && w.foes.every((e) => e.tag !== "wave" || e.hp <= 0)) w.wave = 2;
  }
  if (w.level === 1) {
    w.obj = w.bossDown ? "The officer is down. Take the far roof." : "Drop the cordon's officer. Outrun the lanes behind you.";
    if (p.x > 1900 && p.x < 3400) w.camMin = Math.min(3320, w.camMin + 115 * real);
  }
  if (w.level === 2) {
    const withHer = w.ally && w.ally.hp > 0 && Math.abs(w.ally.x - p.x) < 300;
    w.obj = w.bossDown ? "Off the train. Keep her with you." : withHer ? "The last carriage. Close on the rifleman." : "Do not lose Durga between the cars.";
  }
  if (w.level === 4) {
    if (p.x > 2050) w.gallery = true;
    if (w.gallery && w.wave === 0) {
      w.wave = 1;
      for (const e of w.foes) if (e.tag === "wave") wake(e);
    }
    if (w.gallery && w.leaflets < 8 && inp.atkP && w.leafCd <= 0) {
      w.leaflets += 1;
      w.leafCd = 0.32;
      burst(w, p.x + p.face * 46, p.y + 24, 8, "#f4e6c0", 200);
      if (w.leaflets === 4 || w.leaflets === 8) {
        w.banner = "DUTT — TOGETHER";
        w.bannerT = 0.7;
        for (const e of w.foes) {
          if (e.hp > 0 && Math.abs(e.x - p.x) < 280) {
            e.ai = "stun";
            e.st = "hit";
            e.stT = 0;
          }
        }
      }
    }
    w.obj = w.leaflets >= 8 ? "Stand in the circle. Let them take you." : "Leaflets " + String(Math.min(8, w.leaflets)) + "/8. Alarm " + String(Math.floor(w.alarm));
    if (w.leaflets >= 8 && Math.abs(p.x - 2920) < 56 && Math.abs(p.vx) < 40 && p.st !== "attack" && p.st !== "heavy" && p.st !== "dash") {
      w.stand += real;
      if (w.stand > 1.45) {
        w.talk = TALKS.l4end ?? [];
        w.talkI = 0;
        w.talkShown = 0;
        w.endTalk = "l4end";
        w.mode = "talk";
        return;
      }
    } else w.stand = Math.max(0, w.stand - real);
  }
  if (w.fast) updateFast(w, inp, real);

  if (w.mode !== "play") return;
  if (p.y > VH + 180) {
    hurt(w, p, 1, 0, false);
    if (w.mode === "play") respawn(w);
    return;
  }
  if (w.camMin > 40 && p.x < w.camMin + 8 && w.level === 1) hurt(w, p, 1, 1, false);

  const past = p.x > w.exitX;
  if (past && w.level === 1 && w.bossDown) finishLevel(w);
  else if (past && w.level === 2 && w.bossDown && w.ally && w.ally.hp > 0 && Math.abs(w.ally.x - p.x) < 340) finishLevel(w);
  else if (past && w.level === 3 && w.papers.every((x) => x.got) && w.wave >= 2) finishLevel(w);
  else if (past && w.level === 1 && !w.bossDown) {
    w.banner = "HE IS STILL STANDING";
    w.bannerT = 0.4;
  }

  const want = p.x - VW * 0.42 + p.face * 70;
  w.camX += (want - w.camX) * Math.min(1, 6 * real);
  w.camX = clamp(w.camX, w.camMin, Math.max(0, w.width - VW));
}

function updateFast(w: World, inp: Inp, dt: number): void {
  w.days += dt * 1.4;
  w.obj = "Day " + String(Math.floor(w.days)) + (w.broke ? "" : "  —  refuse their bread");
  const p = w.player;
  const bit = (n: number) => (w.flags & n) !== 0;
  const mark = (n: number) => { w.flags |= n; };
  if (w.days > 8 && !bit(2)) { mark(2); w.foes.push(foe(40, 300, "constable", 1, "")); }
  if (w.days > 26 && !bit(4)) { mark(4); w.foes.push(foe(40, 300, "officer", 1, "")); }
  if (w.days > 46 && !bit(8)) { mark(8); w.foes.push(foe(80, 300, "shield", 1, "")); }
  if (w.days >= 63 && !w.jatin) {
    w.jatin = true;
    w.talk = TALKS.jatin ?? [];
    w.talkI = 0;
    w.talkShown = 0;
    w.endTalk = "fast";
    w.mode = "talk";
    return;
  }
  if (w.days > 74 && !bit(16)) { mark(16); w.bars = true; w.foes.push(foe(30, 300, "constable", 1, "")); }
  if (w.bars && w.burn <= 0) {
    w.burn = 2.1;
    const src = mkEnt(20, 360, "rifle");
    src.face = 1;
    bolt(w, src);
  }
  if (w.days > 90 && !w.breadOn && !w.broke) {
    w.breadOn = true;
    w.banner = "BREAD. STRIKE IT TO EAT. WALK AWAY TO REFUSE.";
    w.bannerT = 1.6;
  }
  if (w.breadOn && !w.broke && inp.atkP && Math.abs(p.x - w.breadX) < 36 && Math.abs(p.y + p.h - 430) < 70) {
    w.broke = true;
    w.banner = "THE FAST BREAKS";
    w.bannerT = 1;
    w.talk = TALKS.l5end ?? [];
    w.talkI = 0;
    w.talkShown = 0;
    w.endTalk = "finale";
    w.mode = "talk";
    return;
  }
  if (w.days > 100 && !bit(32) && !w.broke) {
    mark(32);
    const jailer = foe(70, 300, "inspector", 1, "boss");
    jailer.hp = 5;
    jailer.maxHp = 5;
    w.foes.push(jailer);
    w.banner = "THE JAILER";
    w.bannerT = 1;
  }
  if (w.days >= 40 && w.chkX < 200) {
    w.chkX = 180;
    w.chkY = 470 - p.h;
    w.save = takeSave(w);
  }
  if (!w.broke && w.days >= 112 && w.bossDown) {
    w.talk = TALKS.l5end ?? [];
    w.talkI = 0;
    w.talkShown = 0;
    w.endTalk = "finale";
    w.mode = "talk";
  }
}

function settle(w: World): void {
  const dt = 1 / 60;
  const fall = (e: Ent) => {
    for (let i = 0; i < 90 && !e.onG; i++) {
      e.vy = Math.min(1400, e.vy + 2500 * dt);
      integrate(e, w.plats, dt, false, false);
    }
    e.vx = 0;
    e.vy = 0;
  };
  fall(w.player);
  for (const e of w.foes) if (e.ai !== "wait") fall(e);
  if (w.ally) fall(w.ally);
}

export function applyLevel(w: World, id: number, talkKey: string): void {
  const L = buildLevel(id);
  w.level = id;
  w.plats = L.plats;
  w.foes = L.foes;
  w.papers = L.papers;
  w.checks = L.checks;
  w.hazards = L.hazards;
  w.exitX = L.exitX;
  w.width = L.width;
  w.bg = L.bg;
  w.rainOn = L.rainOn;
  w.obj = L.obj;
  w.caption = L.caption;
  w.ally = L.ally;
  w.player = mkEnt(70, 280, "player");
  w.camX = 0;
  w.camMin = 0;
  w.time = 0;
  w.leaflets = 0;
  w.fireX = -180;
  w.gallery = false;
  w.combo = 0;
  w.comboT = 0;
  w.maxCombo = 0;
  w.disarmed = 0;
  w.hitsTaken = 0;
  w.perfects = 0;
  w.focus = 0;
  w.alarm = 0;
  w.score = 0;
  w.rank = "";
  w.bolts = [];
  w.ghosts = [];
  w.bossDown = false;
  w.wave = 0;
  w.fast = id === 5;
  w.broke = false;
  w.jatin = false;
  w.bars = false;
  w.flags = 0;
  w.days = 0;
  w.burn = 0;
  w.aid = 0;
  w.stand = 0;
  w.leafCd = 0;
  w.breadX = 760;
  w.breadOn = false;
  w.lesson = id === 1 ? 0 : 5;
  w.heavyOn = id > 1;
  w.dashOn = id > 1;
  w.hint = id === 1 ? (HINTS[0] ?? "") : "";
  w.endTalk = "";
  w.banner = LNAME[id] ?? "";
  w.bannerT = 1.3;
  w.deadT = 0;
  w.hitstop = 0;
  w.slomo = 0;
  w.shake = 0;
  w.shakeT = 0;
  w.chkX = 70;
  w.chkY = 280;
  settle(w);
  w.chkY = w.player.y;
  w.save = takeSave(w);
  if (talkKey && TALKS[talkKey]) {
    w.talk = TALKS[talkKey];
    w.talkI = 0;
    w.talkShown = 0;
    w.mode = "talk";
  } else w.mode = "play";
}

export function fresh(): World {
  return {
    mode: "title", level: 0, unlocked: 1, t: 0, time: 0, camX: 0,
    shake: 0, shakeT: 0, hitstop: 0, slomo: 0,
    player: mkEnt(80, 300, "player"), ally: null, foes: [], plats: [],
    parts: [], rain: seedRain(48), papers: [], checks: [], hazards: [],
    bolts: [], ghosts: [],
    exitX: 1000, fireX: -200, leaflets: 0, days: 0,
    talk: [], talkI: 0, talkShown: 0,
    banner: "", bannerT: 0, hint: "", obj: "", caption: "",
    score: 0, rank: "", combo: 0, comboT: 0, maxCombo: 0,
    disarmed: 0, hitsTaken: 0, perfects: 0, focus: 0, alarm: 0,
    lesson: 0, heavyOn: false, dashOn: false,
    chkX: 80, chkY: 300, deadT: 0, width: VW, bg: "title",
    rainOn: true, gallery: false, camMin: 0, endTalk: "",
    bossDown: false, wave: 0, fast: false, broke: false, jatin: false,
    bars: false, flags: 0, burn: 0, aid: 0, stand: 0, leafCd: 0,
    breadX: 760, breadOn: false, save: null,
  };
}

export function respawn(w: World): void {
  if (w.save) applySave(w, w.save);
  const p = w.player;
  p.x = w.chkX;
  p.y = w.chkY;
  p.vx = 0;
  p.vy = 0;
  p.hp = p.maxHp;
  p.st = "idle";
  p.inv = 1;
  p.h = 78;
  p.buf = 0;
  if (w.ally) {
    w.ally.x = p.x - 50;
    w.ally.y = p.y;
    w.ally.hp = w.ally.maxHp;
    w.ally.st = "idle";
    w.ally.vx = 0;
    w.ally.vy = 0;
  }
  w.mode = "play";
  w.hitstop = 0;
  w.slomo = 0;
  w.bolts = [];
}

export function grade(w: World): string {
  const par = [0, 120, 130, 110, 120, 90][w.level] ?? 120;
  let s = 100 - w.hitsTaken * 7 + Math.min(12, w.perfects) * 3;
  if (w.broke) s -= 28;
  if (w.alarm >= 100) s -= 12;
  s -= Math.max(0, w.time - par) * 0.18;
  if (s >= 86) return "S";
  if (s >= 70) return "A";
  if (s >= 50) return "B";
  return "C";
}

export function finishLevel(w: World): void {
  w.rank = grade(w);
  w.score = Math.max(0, Math.round(1000 - w.hitsTaken * 40 + w.perfects * 25 + w.disarmed * 15 - w.time));
  if (w.unlocked < w.level + 1) w.unlocked = Math.min(5, w.level + 1);
  w.mode = "done";
  w.banner = w.rank;
  w.bannerT = 2;
}

export function advanceFromDone(w: World): void {
  if (w.level >= 5) {
    w.mode = "finale";
    w.t = 0;
    return;
  }
  applyLevel(w, w.level + 1, "l" + String(w.level + 1));
}

function updateTalk(w: World, inp: Inp, dt: number): void {
  w.talkShown += dt * 42;
  const line = w.talk[w.talkI];
  if (!line) {
    if (w.endTalk === "finale") {
      w.mode = "finale";
      w.t = 0;
    } else if (w.endTalk === "l4end") finishLevel(w);
    else if (w.endTalk === "fast") w.mode = "play";
    else if (w.level === 5 && w.endTalk === "") w.mode = "play";
    else w.mode = "play";
    return;
  }
  if (inp.startP || inp.atkP || inp.jumpP) {
    if (w.talkShown < line.text.length) w.talkShown = line.text.length;
    else {
      w.talkI += 1;
      w.talkShown = 0;
    }
  }
}

export function stepParts(arr: Spark[], dt: number, rain: boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const q = arr[i];
    if (!q) continue;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.life -= dt;
    if (rain) {
      if (q.y > VH || q.x < -20) {
        q.x = Math.random() * (VW + 240);
        q.y = -12;
        q.life = 1;
      }
    } else if (q.life <= 0) arr.splice(i, 1);
  }
}

export function tick(w: World, inp: Inp, dt: number): void {
  if (w.shakeT > 0) w.shakeT -= dt;
  else w.shake = 0;
  if (w.mode === "pause") return;
  if (w.mode === "title" || w.mode === "select") {
    w.t += dt;
    if (w.mode === "title" && inp.pauseP) w.mode = "select";
    else if (w.mode === "select" && inp.pauseP) w.mode = "title";
    if (w.mode === "title" && inp.startP) applyLevel(w, 1, "l1");
    return;
  }
  if (w.mode === "talk") {
    w.t += dt;
    updateTalk(w, inp, dt);
    return;
  }
  if (w.mode === "dead") {
    w.deadT -= dt;
    w.player.st = "down";
    if (w.deadT <= 0 || inp.startP) respawn(w);
    return;
  }
  if (w.mode === "done") {
    if (inp.startP || inp.jumpP) advanceFromDone(w);
    return;
  }
  if (w.mode === "finale") {
    w.t += dt;
    if (w.t > 6 && (inp.startP || inp.jumpP)) {
      w.mode = "title";
      w.t = 0;
      w.rainOn = true;
      if (w.rain.length < 10) w.rain = seedRain(48);
    }
    return;
  }
  if (w.mode === "play") updatePlay(w, inp, dt);
}

export function playerFrame(p: Ent, t: number): string {
  if (p.st === "down") return "player_down";
  if (p.st === "hit") return "player_hit";
  if (p.st === "dash") return "player_dash";
  if (p.st === "slide" || p.st === "dodge") return "player_dodge";
  if (p.st === "heavy") return p.stT < 0.12 ? "player_idle" : "player_attack";
  if (p.st === "attack") return "player_attack";
  if (!p.onG) return "player_jump";
  if (Math.abs(p.vx) > 40) return Math.floor(t / 0.11) % 2 === 0 ? "player_run1" : "player_run2";
  return "player_idle";
}

export function foeFrame(e: Ent): string {
  if (e.st === "down" || e.hp <= 0) return "officer_down";
  if (e.kind === "constable") return "constable_attack";
  if (e.ai === "telegraph" || e.ai === "strike" || e.ai === "aim" || e.st === "attack") return "officer_attack";
  return "officer_idle";
}

export function allyFrame(a: Ent): string {
  return a.st === "run" ? "durga_walk" : "durga_idle";
}
