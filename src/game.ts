export const VW = 960;
export const VH = 540;

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Plat extends AABB {
  t: number;
}
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: number;
}
export interface Ent extends AABB {
  vx: number;
  vy: number;
  face: number;
  hp: number;
  maxHp: number;
  onG: boolean;
  onW: number;
  st: string;
  stT: number;
  coy: number;
  jbuf: number;
  dcd: number;
  combo: number;
  inv: number;
  squash: number;
  atkId: number;
  lastHit: number;
  kind: string;
  ai: string;
  pMin: number;
  pMax: number;
  tel: number;
}
export interface Paper {
  x: number;
  y: number;
  got: boolean;
}
export interface Flag {
  x: number;
  y: number;
  used: boolean;
}
export interface Line {
  who: string;
  text: string;
  port: string;
}
export interface Inp {
  l: boolean;
  r: boolean;
  u: boolean;
  d: boolean;
  jump: boolean;
  jumpP: boolean;
  atk: boolean;
  atkP: boolean;
  dash: boolean;
  dashP: boolean;
  dodge: boolean;
  dodgeP: boolean;
  startP: boolean;
  pauseP: boolean;
}

export type Mode = "title" | "select" | "talk" | "play" | "pause" | "dead" | "done" | "endure" | "finale";

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
  exitX: number;
  fireX: number;
  leaflets: number;
  days: number;
  resolve: number;
  qte: string;
  qteT: number;
  qteHit: boolean;
  talk: Line[];
  talkI: number;
  talkShown: number;
  banner: string;
  bannerT: number;
  obj: string;
  caption: string;
  score: number;
  combo: number;
  comboT: number;
  maxCombo: number;
  disarmed: number;
  hitsTaken: number;
  chkX: number;
  chkY: number;
  chkGot: boolean[];
  deadT: number;
  width: number;
  bg: string;
  rainOn: boolean;
  gallery: boolean;
  camMin: number;
  endTalk: string;
}

export const NAMES: Record<string, string> = {
  bhagat: "BHAGAT SINGH",
  sukhdev: "SUKHDEV",
  azad: "CHANDRASHEKHAR AZAD",
  dutt: "BATUKESHWAR DUTT",
  durga: "DURGAWATI DEVI",
  jatin: "JATINDRA NATH DAS",
  inspector: "CID",
  narrator: "",
};

export const TALKS: Record<string, Line[]> = {
  l1: [
    { who: "sukhdev", text: "Scott ordered the charge. Lala ji is dying. The dragnet is already in the lanes.", port: "sukhdev" },
    { who: "bhagat", text: "Then we take the roofs. Knock them down if you must — no killing tonight.", port: "bhagat" },
  ],
  l2: [
    { who: "durga", text: "Walk beside me. If a constable asks, you are my husband. Keep your eyes steady.", port: "durga" },
    { who: "bhagat", text: "The platform first. Then the roof of the train until the next light.", port: "bhagat" },
  ],
  l3: [
    { who: "azad", text: "They have the workshop. Get the papers out. Leave the machine if you have to.", port: "azad" },
    { who: "bhagat", text: "I will not leave a comrade's words in their hands.", port: "bhagat" },
  ],
  l4: [
    { who: "dutt", text: "Empty benches. Smoke, not shrapnel. The leaflet is the blow.", port: "dutt" },
    { who: "bhagat", text: "If they take us, we speak in court. Stay with me to the gallery.", port: "bhagat" },
  ],
  l4end: [
    { who: "narrator", text: "Two low-intensity smoke bombs fall toward empty benches. Leaflets flood the hall.", port: "" },
    { who: "bhagat", text: "It is easy to kill individuals but you cannot kill the ideas. Great empires crumbled while the ideas survived.", port: "bhagat" },
    { who: "narrator", text: "They stand and wait. Arrest is the next sentence of the plan.", port: "" },
  ],
  l5: [
    { who: "bhagat", text: "We will be treated as political prisoners. We will not eat until they hear us.", port: "bhagat" },
    { who: "narrator", text: "Lahore Central Jail, June 1929. A hunger strike begins.", port: "" },
  ],
  jatin: [
    { who: "narrator", text: "13 September 1929. Jatindra Nath Das dies on the sixty-third day. The country erupts.", port: "jatin" },
  ],
  l5end: [
    { who: "narrator", text: "Early October 1929. After more than a hundred days, the strike ends; some demands are met.", port: "" },
    { who: "narrator", text: "4 October 1930. From prison, Bhagat Singh writes to his father — a later year, a longer wait.", port: "bhagat" },
  ],
};

export const CAPTION = [
  "",
  "Lahore, 30 October 1928. After the lathi charge on the Simon Commission protest.",
  "December 1928. Durgawati Devi escorts Bhagat Singh out of Lahore in disguise.",
  "A secret HSRA workshop. Escape with the papers as the raid closes in.",
  "Delhi, 8 April 1929. The Central Legislative Assembly.",
  "Lahore Central Jail, 1929. A strike of endurance, not of fists.",
];

export const LNAME = [
  "",
  "ROOFTOP DRAGNET",
  "NIGHT TRAIN",
  "THE WORKSHOP",
  "THE ASSEMBLY",
  "THE LONG FAST",
];

export function blankInp(): Inp {
  return {
    l: false, r: false, u: false, d: false,
    jump: false, jumpP: false,
    atk: false, atkP: false,
    dash: false, dashP: false,
    dodge: false, dodgeP: false,
    startP: false, pauseP: false,
  };
}

function clamp(n: number, a: number, b: number): number {
  return n < a ? a : n > b ? b : n;
}

export function mkEnt(x: number, y: number, kind: string): Ent {
  return {
    x, y, w: 26, h: 78, vx: 0, vy: 0, face: 1,
    hp: kind === "player" ? 5 : kind === "durga" ? 3 : 2,
    maxHp: kind === "player" ? 5 : kind === "durga" ? 3 : 2,
    onG: false, onW: 0, st: "idle", stT: 0,
    coy: 0, jbuf: 0, dcd: 0, combo: 0, inv: 0, squash: 0,
    atkId: 0, lastHit: -1, kind, ai: "patrol",
    pMin: x - 120, pMax: x + 180, tel: 0,
  };
}

function aabb(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function plat(x: number, y: number, w: number, h: number, t: number): Plat {
  return { x, y, w, h, t };
}

function addRoof(list: Plat[], x: number, y: number, w: number): void {
  list.push(plat(x, y, w, VH - y + 20, 0));
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
  let obj = "Reach the far roofs";
  let caption = CAPTION[id] ?? "";
  let ally: Ent | null = null;

  if (id === 1) {
    bg = "lahore"; rainOn = true; width = 4600; exitX = 4380;
    obj = "Escape the dragnet — disengage, do not kill";
    addRoof(plats, 0, 430, 540);
    plats.push(plat(250, 396, 54, 34, 2));
    addRoof(plats, 620, 400, 300);
    plats.push(plat(980, 356, 100, 22, 1));
    addRoof(plats, 1140, 420, 380);
    plats.push(plat(1580, 348, 200, 20, 1));
    addRoof(plats, 1860, 430, 160);
    addRoof(plats, 2100, 396, 340);
    // Column tops sit 60px above the roof, inside a full jump. The source
    // placed them at y=220, which a jump from the roof could never clear.
    plats.push(plat(2488, 336, 40, 204, 0));
    plats.push(plat(2670, 336, 40, 204, 0));
    plats.push(plat(2536, 360, 126, 16, 1));
    addRoof(plats, 2760, 410, 280);
    plats.push(plat(3100, 350, 170, 20, 1));
    addRoof(plats, 3340, 430, 220);
    addRoof(plats, 3640, 400, 960);
    checks.push({ x: 1320, y: 420, used: false }, { x: 2920, y: 410, used: false });
    const xs = [420, 760, 1360, 2220, 2880, 3760, 4040];
    for (let i = 0; i < xs.length; i++) {
      const e = mkEnt(xs[i] ?? 0, 200, i % 2 === 0 ? "officer" : "constable");
      e.pMin = (xs[i] ?? 0) - 90;
      e.pMax = (xs[i] ?? 0) + 160;
      if (i > 3) e.maxHp = 3;
      e.hp = e.maxHp;
      foes.push(e);
    }
  } else if (id === 2) {
    bg = "station"; rainOn = true; width = 5200; exitX = 4980;
    obj = "Escort Durgawati Devi to the train — then ride the roof";
    addRoof(plats, 0, 430, 1880);
    plats.push(plat(340, 396, 60, 34, 2));
    plats.push(plat(820, 396, 70, 34, 2));
    plats.push(plat(1280, 370, 120, 20, 1));
    checks.push({ x: 1760, y: 430, used: false });
    addRoof(plats, 1980, 400, 400);
    addRoof(plats, 2460, 400, 400);
    addRoof(plats, 2940, 400, 400);
    plats.push(plat(3420, 368, 200, 20, 1));
    addRoof(plats, 3680, 400, 520);
    addRoof(plats, 4280, 400, 920);
    hazards.push({ x: 2580, y: 250, w: 170, h: 70 }, { x: 3520, y: 230, w: 190, h: 80 });
    checks.push({ x: 3360, y: 400, used: false });
    ally = mkEnt(70, 350, "durga");
    const xs = [500, 980, 1500, 2200, 2700, 3180, 3900, 4500];
    for (let i = 0; i < xs.length; i++) {
      const e = mkEnt(xs[i] ?? 0, 200, i % 3 === 0 ? "constable" : "officer");
      e.pMin = (xs[i] ?? 0) - 80;
      e.pMax = (xs[i] ?? 0) + 140;
      foes.push(e);
    }
  } else if (id === 3) {
    bg = "press"; rainOn = false; width = 4000; exitX = 3820;
    obj = "Seize the papers (0/3) and get out — the fire is coming";
    addRoof(plats, 0, 440, 4000);
    plats.push(plat(220, 360, 190, 18, 1));
    plats.push(plat(520, 300, 170, 18, 1));
    plats.push(plat(880, 360, 200, 18, 1));
    plats.push(plat(1180, 338, 230, 102, 0));
    plats.push(plat(1500, 280, 150, 18, 1));
    plats.push(plat(1860, 360, 220, 18, 1));
    plats.push(plat(2280, 300, 180, 18, 1));
    plats.push(plat(2680, 360, 200, 18, 1));
    plats.push(plat(3100, 310, 170, 18, 1));
    papers.push({ x: 560, y: 268, got: false }, { x: 1540, y: 248, got: false }, { x: 2320, y: 268, got: false });
    checks.push({ x: 1640, y: 440, used: false }, { x: 2760, y: 440, used: false });
    const xs = [380, 760, 1100, 1720, 2100, 2540, 3000, 3440];
    for (let i = 0; i < xs.length; i++) {
      const e = mkEnt(xs[i] ?? 0, 200, i % 2 === 0 ? "officer" : "constable");
      e.pMin = (xs[i] ?? 0) - 70;
      e.pMax = (xs[i] ?? 0) + 150;
      e.maxHp = i > 2 ? 3 : 2;
      e.hp = e.maxHp;
      foes.push(e);
    }
  } else if (id === 4) {
    bg = "assembly"; rainOn = false; width = 3400; exitX = 3000;
    obj = "Reach the gallery before the session — do not fight";
    addRoof(plats, 0, 430, 780);
    plats.push(plat(840, 386, 260, 20, 1));
    addRoof(plats, 1160, 430, 480);
    plats.push(plat(1700, 350, 200, 18, 1));
    addRoof(plats, 1980, 430, 420);
    plats.push(plat(2460, 372, 180, 18, 1));
    addRoof(plats, 2700, 430, 700);
    checks.push({ x: 1540, y: 430, used: false });
    const xs = [460, 980, 1380, 2100, 2500];
    for (let i = 0; i < xs.length; i++) {
      const e = mkEnt(xs[i] ?? 0, 200, "officer");
      e.pMin = (xs[i] ?? 0) - 70;
      e.pMax = (xs[i] ?? 0) + 160;
      e.hp = 99;
      e.maxHp = 99;
      foes.push(e);
    }
  } else {
    bg = "cell"; rainOn = false; width = VW; exitX = 99999;
    obj = "Hold your resolve — match the prompts";
    addRoof(plats, 0, 460, VW);
  }
  return { plats, foes, papers, checks, hazards, exitX, width, bg, rainOn, obj, caption, ally };
}

export function seedRain(n: number): Spark[] {
  const a: Spark[] = [];
  for (let i = 0; i < n; i++) {
    a.push({
      x: Math.random() * (VW + 200), y: Math.random() * VH,
      vx: -220, vy: 680, life: 1, max: 1, size: 8 + Math.random() * 10, color: "rgba(180,200,220,0.35)", kind: 1,
    });
  }
  return a;
}

function burst(w: World, x: number, y: number, n: number, color: string, spd: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = spd * (0.4 + Math.random());
    w.parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80,
      life: 0.35 + Math.random() * 0.25, max: 0.6, size: 2 + Math.random() * 3, color, kind: 0,
    });
  }
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
  w.fireX = -200;
  w.gallery = false;
  w.combo = 0;
  w.comboT = 0;
  w.maxCombo = 0;
  w.disarmed = 0;
  w.hitsTaken = 0;
  w.score = 0;
  w.chkX = 70;
  w.chkY = 280;
  w.chkGot = L.papers.map(() => false);
  w.parts = [];
  w.rain = L.rainOn ? seedRain(70) : [];
  w.banner = LNAME[id] ?? "";
  w.bannerT = 2.2;
  w.endTalk = "";
  w.deadT = 0;
  settle(w);
  if (talkKey && TALKS[talkKey]) {
    w.talk = TALKS[talkKey];
    w.talkI = 0;
    w.talkShown = 0;
    w.mode = "talk";
  } else if (id === 5) {
    startEndure(w);
  } else {
    w.mode = "play";
  }
}

export function startEndure(w: World): void {
  w.mode = "endure";
  w.days = 0;
  w.resolve = 70;
  w.qte = "";
  w.qteT = 0.6;
  w.qteHit = false;
  w.bg = "cell";
  w.obj = "Match the prompts. Hold the strike.";
  w.caption = CAPTION[5] ?? "";
  w.banner = LNAME[5] ?? "";
  w.bannerT = 2;
  w.talk = [];
  w.talkI = 0;
  w.talkShown = 0;
  w.endTalk = "";
  w.rainOn = false;
}

export function fresh(): World {
  return {
    mode: "title", level: 1, unlocked: 1, t: 0, time: 0,
    camX: 0, shake: 0, shakeT: 0, hitstop: 0, slomo: 0,
    player: mkEnt(80, 300, "player"), ally: null, foes: [], plats: [],
    parts: [], rain: seedRain(50), papers: [], checks: [], hazards: [],
    exitX: 1000, fireX: -200, leaflets: 0, days: 0, resolve: 70,
    qte: "", qteT: 0, qteHit: false, talk: [], talkI: 0, talkShown: 0,
    banner: "", bannerT: 0, obj: "", caption: "", score: 0,
    combo: 0, comboT: 0, maxCombo: 0, disarmed: 0, hitsTaken: 0,
    chkX: 80, chkY: 300, chkGot: [], deadT: 0, width: VW,
    bg: "title", rainOn: true, gallery: false, camMin: 0, endTalk: "",
  };
}

/** Drop everyone onto the roofs before the opening line, so they are not frozen in the air. */
function settle(w: World): void {
  const dt = 1 / 60;
  const fall = (e: Ent) => {
    for (let i = 0; i < 120 && !e.onG; i++) {
      e.vy = Math.min(1450, e.vy + 2460 * dt);
      integrate(e, w.plats, dt, false);
    }
    e.vx = 0;
    e.vy = 0;
    e.st = "idle";
    e.stT = 0;
  };
  fall(w.player);
  for (const e of w.foes) fall(e);
  if (w.ally) fall(w.ally);
}

function integrate(e: Ent, plats: Plat[], dt: number, crouch: boolean): void {
  if (crouch && e.h > 50) {
    e.y += e.h - 44;
    e.h = 44;
  } else if (!crouch && e.h < 60) {
    const ny = e.y - (78 - e.h);
    const test: AABB = { x: e.x, y: ny, w: e.w, h: 78 };
    let blocked = false;
    for (let i = 0; i < plats.length; i++) {
      const pl = plats[i];
      if (pl && pl.t !== 1 && aabb(test, pl)) blocked = true;
    }
    if (!blocked) {
      e.y = ny;
      e.h = 78;
    }
  }
  const ox = e.x;
  e.onW = 0;
  e.x += e.vx * dt;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || pl.t === 1) continue;
    if (!aabb(e, pl)) continue;
    const rise = e.y + e.h - pl.y;
    if (rise > 0 && rise <= 38 && e.vy >= -40) {
      e.y = pl.y - e.h;
    } else {
      if (e.vx > 0 || ox + e.w <= pl.x + 1) {
        e.x = pl.x - e.w;
        e.onW = 1;
      } else {
        e.x = pl.x + pl.w;
        e.onW = -1;
      }
      e.vx = 0;
    }
  }
  e.y += e.vy * dt;
  e.onG = false;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || !aabb(e, pl)) continue;
    const prevBottom = e.y - e.vy * dt + e.h;
    if (e.vy >= 0 && prevBottom <= pl.y + 10) {
      e.y = pl.y - e.h;
      e.vy = 0;
      e.onG = true;
    } else if (pl.t !== 1 && e.vy < 0) {
      e.y = pl.y + pl.h;
      e.vy = 0;
    } else if (pl.t !== 1) {
      if (ox + e.w <= pl.x) e.x = pl.x - e.w;
      else if (ox >= pl.x + pl.w) e.x = pl.x + pl.w;
    }
  }
}

function hurt(w: World, e: Ent, dmg: number, dir: number): void {
  if (e.inv > 0 || e.st === "down") return;
  e.hp -= dmg;
  e.inv = e.kind === "player" ? 0.75 : 0.35;
  e.vx = dir * 280;
  e.vy = -220;
  e.st = e.hp <= 0 ? "down" : "hit";
  e.stT = 0;
  w.shakeT = 0.2;
  w.shake = 8;
  burst(w, e.x + e.w * 0.5, e.y + e.h * 0.4, 10, "#f0d48a", 260);
  if (e.kind === "player") {
    w.hitsTaken += 1;
    w.combo = 0;
    if (e.hp <= 0) {
      w.mode = "dead";
      w.deadT = 0.85;
      w.banner = "SEIZED";
      w.bannerT = 0.8;
    }
  } else if (e.kind === "durga" && e.hp <= 0) {
    w.mode = "dead";
    w.deadT = 1.1;
    w.banner = "SHE WAS SEIZED";
    w.bannerT = 1;
  } else if (e.hp <= 0) {
    e.ai = "down";
    w.disarmed += 1;
    w.slomo = 0.14;
  }
}

function attackBox(p: Ent): AABB {
  return {
    x: p.face > 0 ? p.x + p.w - 4 : p.x - 54,
    y: p.y + 12,
    w: 58,
    h: 52,
  };
}

function doAttack(w: World, p: Ent): void {
  const open = p.stT > 0.05 && p.stT < 0.16 + p.combo * 0.03;
  if (!open) return;
  const box = attackBox(p);
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e || e.hp <= 0 || e.lastHit === p.atkId) continue;
    if (!aabb(box, e)) continue;
    if (w.level === 4) continue;
    e.lastHit = p.atkId;
    e.hp -= 1;
    e.vx = p.face * (240 + p.combo * 40);
    e.vy = -160 - p.combo * 30;
    e.st = e.hp <= 0 ? "down" : "hit";
    e.stT = 0;
    e.ai = e.hp <= 0 ? "down" : "stun";
    w.hitstop = p.combo >= 2 ? 0.075 : 0.045;
    w.shakeT = 0.16;
    w.shake = 5 + p.combo * 3;
    w.combo += 1;
    w.comboT = 1.7;
    if (w.combo > w.maxCombo) w.maxCombo = w.combo;
    burst(w, e.x + e.w * 0.5, e.y + 30, 12, "#ffe9b0", 300);
    if (e.hp <= 0) {
      w.disarmed += 1;
      w.slomo = 0.11;
      e.hp = 0;
    }
  }
}

function updatePlayer(w: World, p: Ent, inp: Inp, dt: number): void {
  if (inp.jumpP) p.jbuf = 0.12;
  if (p.onG) p.coy = 0.1;
  else p.coy -= dt;
  p.jbuf -= dt;
  p.dcd -= dt;
  p.inv -= dt;
  p.squash = Math.max(0, p.squash - dt * 4);
  p.stT += dt;

  if (p.st === "down") return;
  if (p.st === "hit") {
    p.vx += (p.vx > 0 ? -1 : 1) * 900 * dt;
    if (p.stT > 0.3) p.st = p.onG ? "idle" : "jump";
  }

  const busy = p.st === "hit" || p.st === "down";
  if (!busy && inp.dodgeP && p.st !== "dodge") {
    p.st = "dodge";
    p.stT = 0;
    p.inv = 0.28;
    p.vx = p.face * 440;
    if (!p.onG) p.vy *= 0.35;
    burst(w, p.x, p.y + p.h, 6, "#c4b49a", 140);
  }
  if (!busy && inp.dashP && p.dcd <= 0) {
    const slide = inp.d && p.onG;
    p.st = slide ? "slide" : "dash";
    p.stT = 0;
    p.dcd = 0.46;
    p.vx = p.face * (slide ? 560 : 700);
    p.vy = 0;
    if (slide) p.inv = Math.max(p.inv, 0.14);
    burst(w, p.x + p.w * 0.5, p.y + p.h, 8, "#d8c4a0", 180);
  }
  if (!busy && inp.atkP && p.st !== "dodge" && !(w.level === 4 && !w.gallery)) {
    if (p.st === "attack" && p.stT > 0.1 && p.combo < 2) {
      p.combo += 1;
      p.stT = 0;
      p.atkId += 1;
      p.vx += p.face * 90;
    } else if (p.st !== "attack") {
      p.combo = 0;
      p.st = "attack";
      p.stT = 0;
      p.atkId += 1;
      p.vx += p.face * 70;
    }
  }
  if (p.jbuf > 0 && p.st !== "dodge" && p.st !== "down" && (p.coy > 0 || p.onW !== 0)) {
    p.jbuf = 0;
    p.coy = 0;
    if (p.onW !== 0 && !p.onG) {
      p.face = -p.onW;
      p.vx = -p.onW * 400;
      p.vy = -660;
    } else {
      p.vy = -740;
    }
    p.onG = false;
    if (p.st !== "attack") {
      p.st = "jump";
      p.stT = 0;
    }
  }
  if (!inp.jump && p.vy < -200 && p.st !== "dash") p.vy += 1900 * dt;

  if (p.st !== "dash" && p.st !== "slide" && p.st !== "dodge" && p.st !== "hit" && p.st !== "down") {
    const wish = (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
    if (wish !== 0) {
      p.face = wish;
      p.vx += wish * 3800 * dt;
      p.vx = clamp(p.vx, -340, 340);
    } else {
      const fr = p.onG ? 3400 : 900;
      if (p.vx > 0) p.vx = Math.max(0, p.vx - fr * dt);
      else p.vx = Math.min(0, p.vx + fr * dt);
    }
  }

  if (p.st !== "dash") {
    if (p.onW !== 0 && p.vy > 0 && !p.onG) p.vy = Math.min(p.vy, 150);
    else {
      p.vy += 2460 * dt;
      if (p.vy > 1450) p.vy = 1450;
    }
  }
  if (p.st === "dash" && p.stT > 0.17) p.st = p.onG ? "idle" : "jump";
  if (p.st === "slide" && p.stT > 0.36) p.st = "idle";
  if (p.st === "dodge" && p.stT > 0.34) p.st = p.onG ? "idle" : "jump";
  if (p.st === "attack") {
    const dur = p.combo >= 2 ? 0.34 : 0.2;
    doAttack(w, p);
    if (p.stT > dur) {
      p.st = p.onG ? "idle" : "jump";
      p.combo = 0;
    }
  }
  if ((p.st === "idle" || p.st === "run") && !p.onG) p.st = "jump";
  if (p.st === "jump" && p.onG) {
    p.st = "idle";
    p.squash = 1;
    burst(w, p.x + p.w * 0.5, p.y + p.h, 5, "#c8b090", 80);
  }
  if (p.st === "idle" && Math.abs(p.vx) > 40 && p.onG) p.st = "run";
  if (p.st === "run" && Math.abs(p.vx) <= 40) p.st = "idle";

  const crouch = p.st === "slide" || p.st === "dodge";
  const wasG = p.onG;
  integrate(p, w.plats, dt, crouch);
  if (!wasG && p.onG) p.squash = 1;
  if (p.x < 8) p.x = 8;
  if (p.x > w.width - 30) p.x = w.width - 30;
}

function updateEnemy(w: World, e: Ent, p: Ent, dt: number): void {
  e.stT += dt;
  e.inv -= dt;
  if (e.hp <= 0 || e.ai === "down") {
    e.st = "down";
    e.vx *= Math.max(0, 1 - 4 * dt);
    e.vy += 2460 * dt;
    integrate(e, w.plats, dt, false);
    return;
  }
  if (e.ai === "stun" || e.st === "hit") {
    e.vy += 2460 * dt;
    e.vx *= Math.max(0, 1 - 3 * dt);
    integrate(e, w.plats, dt, false);
    if (e.stT > 0.42) {
      e.ai = "chase";
      e.st = "idle";
    }
    return;
  }
  const dx = (p.x + p.w * 0.5) - (e.x + e.w * 0.5);
  const dist = Math.abs(dx);
  const nearY = Math.abs(p.y - e.y) < 90;
  if (e.ai === "patrol") {
    if (e.x < e.pMin) e.face = 1;
    if (e.x > e.pMax) e.face = -1;
    e.vx = e.face * 80;
    e.st = "run";
    if (dist < 300 && nearY) e.ai = "chase";
  } else if (e.ai === "chase") {
    e.face = dx >= 0 ? 1 : -1;
    e.vx = e.face * 150;
    e.st = "run";
    if (dist < 58 && nearY) {
      e.ai = "telegraph";
      e.tel = w.level >= 3 ? 0.34 : 0.44;
      e.vx = 0;
      e.st = "idle";
    }
    if (dist > 460) e.ai = "patrol";
  } else if (e.ai === "telegraph") {
    e.vx = 0;
    e.tel -= dt;
    e.st = "attack";
    if (e.tel <= 0) {
      e.ai = "strike";
      e.stT = 0;
    }
  } else if (e.ai === "strike") {
    e.st = "attack";
    e.vx = e.face * 40;
    if (e.stT > 0.07 && e.stT < 0.22) {
      const box: AABB = {
        x: e.face > 0 ? e.x + e.w - 2 : e.x - 46,
        y: e.y + 10,
        w: 50,
        h: 56,
      };
      if (p.inv <= 0 && aabb(box, p)) hurt(w, p, 1, e.face);
      if (w.ally && w.ally.hp > 0 && aabb(box, w.ally)) hurt(w, w.ally, 1, e.face);
    }
    if (e.stT > 0.5) e.ai = "chase";
  }
  e.vy += 2460 * dt;
  if (e.vy > 1400) e.vy = 1400;
  integrate(e, w.plats, dt, false);
}

/** Highest walkable surface near the feet, or null if the span is a gap. */
export function supportTop(plats: Plat[], x: number, footY: number): number | null {
  let best: number | null = null;
  for (let i = 0; i < plats.length; i++) {
    const pl = plats[i];
    if (!pl || x < pl.x + 1 || x > pl.x + pl.w - 1) continue;
    const dy = pl.y - footY;
    if (dy < -110 || dy > 150) continue;
    if (best === null || pl.y < best) best = pl.y;
  }
  return best;
}

function updateAlly(w: World, a: Ent, p: Ent, dt: number): void {
  if (a.hp <= 0) {
    a.st = "down";
    integrate(a, w.plats, dt, false);
    return;
  }
  const target = p.x - p.face * 64;
  const dx = target - a.x;
  const gap = Math.abs(dx);
  if (gap > 16) {
    a.face = dx > 0 ? 1 : -1;
    const spd = gap > 140 ? 360 : Math.min(320, 160 + Math.abs(p.vx));
    a.vx = a.face * spd;
    a.st = "run";
  } else {
    a.vx *= 0.8;
    a.st = "idle";
  }
  const foot = a.y + a.h;
  const probe = a.x + (a.face > 0 ? a.w + 28 : -28);
  const ahead = supportTop(w.plats, probe, foot);
  const here = supportTop(w.plats, a.x + a.w * 0.5, foot);
  const gapJump = a.onG && (ahead === null || (here !== null && ahead < here - 18));
  if ((gapJump || (p.y + 30 < a.y && Math.abs(dx) < 240)) && a.onG) a.vy = -740;
  a.vy += 2460 * dt;
  integrate(a, w.plats, dt, false);
  a.inv -= dt;
}

const QTES = ["J", "K", "X", "C", "LEFT", "RIGHT", "SPACE", "L"];

function qtePressed(tag: string, inp: Inp): boolean {
  if (tag === "J" || tag === "X") return inp.atkP;
  if (tag === "K" || tag === "C") return inp.dashP;
  if (tag === "L") return inp.dodgeP;
  if (tag === "SPACE") return inp.jumpP;
  if (tag === "LEFT") return inp.l && !inp.jumpP && !inp.atkP;
  if (tag === "RIGHT") return inp.r && !inp.jumpP && !inp.atkP;
  return false;
}

function updateEndure(w: World, inp: Inp, dt: number): void {
  w.t += dt;
  w.bannerT -= dt;
  if (w.qte === "") {
    w.qteT -= dt;
    if (w.qteT <= 0) {
      w.qte = QTES[Math.floor(Math.random() * QTES.length)] ?? "J";
      w.qteT = 1.15;
      w.qteHit = false;
    }
    return;
  }
  if (!w.qteHit && qtePressed(w.qte, inp)) {
    w.qteHit = true;
    w.resolve = clamp(w.resolve + 6, 0, 100);
    w.days += 8;
    w.banner = "Day " + String(w.days);
    w.bannerT = 0.7;
    burst(w, VW * 0.5, VH * 0.55, 14, "#e8c878", 200);
    if (w.days >= 63 && w.days < 71 && w.talk.length === 0) {
      w.talk = TALKS.jatin ?? [];
      w.talkI = 0;
      w.talkShown = 0;
      w.mode = "talk";
      w.endTalk = "endure";
    }
    if (w.days >= 112) {
      w.talk = TALKS.l5end ?? [];
      w.talkI = 0;
      w.talkShown = 0;
      w.mode = "talk";
      w.endTalk = "finale";
    }
    w.qte = "";
    w.qteT = 0.35;
    return;
  }
  if (inp.atkP || inp.dashP || inp.dodgeP || inp.jumpP) {
    if (!w.qteHit) {
      w.resolve -= 10;
      w.shakeT = 0.2;
      w.shake = 7;
    }
  }
  w.qteT -= dt;
  if (w.qteT <= 0 && !w.qteHit) {
    w.resolve -= 14;
    w.qte = "";
    w.qteT = 0.4;
    w.banner = "The body falters";
    w.bannerT = 0.7;
  }
  if (w.resolve <= 0) {
    w.resolve = 0;
    w.mode = "dead";
    w.deadT = 1;
    w.banner = "THE STRIKE BREAKS";
    w.bannerT = 1;
  }
}

export function respawn(w: World): void {
  if (w.level === 5) {
    startEndure(w);
    return;
  }
  const p = w.player;
  p.x = w.chkX;
  p.y = w.chkY;
  p.vx = 0;
  p.vy = 0;
  p.hp = p.maxHp;
  p.st = "idle";
  p.inv = 1.1;
  p.h = 78;
  if (w.ally) {
    w.ally.x = p.x - 50;
    w.ally.y = p.y;
    w.ally.hp = w.ally.maxHp;
    w.ally.st = "idle";
    w.ally.vx = 0;
    w.ally.vy = 0;
  }
  for (let i = 0; i < w.papers.length; i++) {
    const paper = w.papers[i];
    if (paper) paper.got = w.chkGot[i] === true;
  }
  for (let i = 0; i < w.foes.length; i++) {
    const e = w.foes[i];
    if (!e || e.x <= w.chkX - 40) continue;
    e.hp = e.maxHp;
    e.ai = "patrol";
    e.st = "idle";
    e.y = 200;
    e.vy = 0;
  }
  w.mode = "play";
  w.fireX = Math.min(w.fireX, w.chkX - 400);
}

function tally(w: World): void {
  const timeScore = Math.max(0, 8000 - Math.floor(w.time * 18));
  const nohit = w.hitsTaken === 0 ? 900 : 0;
  w.score = timeScore + w.disarmed * 160 + w.maxCombo * 50 + nohit + w.papers.filter((p) => p.got).length * 220;
}

export function finishLevel(w: World): void {
  tally(w);
  if (w.unlocked < w.level + 1) w.unlocked = Math.min(5, w.level + 1);
  w.mode = "done";
  w.banner = "CLEAR  " + String(Math.floor(w.time)) + "s";
  w.bannerT = 99;
}

export function advanceFromDone(w: World): void {
  if (w.level >= 5) {
    w.mode = "finale";
    w.t = 0;
    return;
  }
  const next = w.level + 1;
  applyLevel(w, next, "l" + String(next));
}

function updateTalk(w: World, inp: Inp, dt: number): void {
  w.talkShown += dt * 38;
  const line = w.talk[w.talkI];
  if (!line) {
    if (w.endTalk === "finale") {
      w.mode = "finale";
      w.t = 0;
    } else if (w.endTalk === "endure") {
      const days = w.days;
      startEndure(w);
      w.days = Math.max(days, 64);
    } else if (w.level === 4 && w.endTalk === "l4end") {
      finishLevel(w);
    } else if (w.level === 5) {
      startEndure(w);
    } else {
      w.mode = "play";
    }
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

function updatePlay(w: World, inp: Inp, dt: number): void {
  let sim = dt;
  if (w.hitstop > 0) {
    w.hitstop -= dt;
    sim = 0;
  } else if (w.slomo > 0) {
    w.slomo -= dt;
    sim = dt * 0.32;
  }
  w.time += sim;
  w.t += dt;
  w.bannerT -= dt;
  w.comboT -= dt;
  if (w.comboT <= 0) w.combo = 0;
  if (sim > 0) {
    updatePlayer(w, w.player, inp, sim);
    for (let i = 0; i < w.foes.length; i++) {
      const foe = w.foes[i];
      if (foe) updateEnemy(w, foe, w.player, sim);
    }
    if (w.ally) updateAlly(w, w.ally, w.player, sim);
  }
  const p = w.player;
  for (let i = 0; i < w.papers.length; i++) {
    const pap = w.papers[i];
    if (!pap || pap.got) continue;
    if (Math.abs(p.x - pap.x) < 36 && Math.abs(p.y + p.h - pap.y) < 70) {
      pap.got = true;
      burst(w, pap.x, pap.y, 10, "#f2e2a0", 160);
      const n = w.papers.filter((x) => x.got).length;
      w.obj = "Seize the papers (" + String(n) + "/3) and get out";
      w.banner = "PAPERS  " + String(n) + "/3";
      w.bannerT = 1.2;
    }
  }
  for (let i = 0; i < w.checks.length; i++) {
    const c = w.checks[i];
    if (!c || c.used) continue;
    if (Math.abs(p.x - c.x) < 46 && Math.abs(p.y + p.h - c.y) < 90) {
      c.used = true;
      w.chkX = c.x;
      w.chkY = c.y - p.h;
      w.chkGot = w.papers.map((x) => x.got);
      w.banner = "CHECKPOINT";
      w.bannerT = 1.3;
    }
  }
  if (w.level === 3) {
    w.fireX += sim * 42;
    if (p.x + p.w < w.fireX - 20) hurt(w, p, 1, 1);
  }
  if (w.level === 2 && p.x > 1980) w.camMin += sim * 55;
  for (let i = 0; i < w.hazards.length; i++) {
    const h = w.hazards[i];
    if (!h) continue;
    const crouched = p.st === "slide" || p.st === "dodge" || p.h < 50;
    if (!crouched && aabb(p, h)) hurt(w, p, 1, -p.face);
  }
  if (w.level === 4) {
    const left = Math.max(0, 52 - w.time);
    w.obj = w.gallery
      ? "Throw the leaflets  " + String(w.leaflets) + "/8  (J / X)"
      : "Reach the gallery  " + left.toFixed(0) + "s";
    if (!w.gallery && w.time >= 52) {
      w.mode = "dead";
      w.deadT = 0.9;
      w.banner = "TOO LATE";
      w.bannerT = 0.9;
    }
    if (p.x > w.exitX - 80) {
      w.gallery = true;
      if (inp.atkP && w.leaflets < 8) {
        w.leaflets += 1;
        burst(w, p.x + p.face * 50, p.y + 20, 8, "#f4e6c0", 220);
      }
      if (w.leaflets >= 8) {
        w.talk = TALKS.l4end ?? [];
        w.talkI = 0;
        w.talkShown = 0;
        w.endTalk = "l4end";
        w.mode = "talk";
      }
    }
    for (let i = 0; i < w.foes.length; i++) {
      const e = w.foes[i];
      if (e && e.hp > 0 && aabb(p, e) && p.inv <= 0) hurt(w, p, 1, e.face || 1);
    }
  }
  if (w.mode !== "play") return;
  if (p.y > VH + 70) hurt(w, p, 99, 0);
  if (w.mode !== "play") return;
  if (p.x > w.exitX && w.level !== 4 && w.level !== 5) {
    if (w.level === 3 && w.papers.some((x) => !x.got)) {
      w.banner = "THE PAPERS ARE STILL INSIDE";
      w.bannerT = 1;
    } else finishLevel(w);
  }
  const look = p.face * 90;
  const want = p.x - VW * 0.4 + look;
  w.camX += (want - w.camX) * Math.min(1, 5.5 * dt);
  w.camX = clamp(w.camX, w.camMin, Math.max(0, w.width - VW));
  if (w.camMin > 0 && p.x + p.w < w.camMin - 10) hurt(w, p, 99, 0);
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
    if (w.t > 8 && (inp.startP || inp.jumpP)) {
      w.mode = "title";
      w.t = 0;
      w.rainOn = true;
      if (w.rain.length < 10) w.rain = seedRain(50);
    }
    return;
  }
  if (w.mode === "endure") {
    updateEndure(w, inp, dt);
    return;
  }
  if (w.mode === "play") updatePlay(w, inp, dt);
}

export function playerFrame(p: Ent, t: number): string {
  if (p.st === "down") return "player_down";
  if (p.st === "hit") return "player_hit";
  if (p.st === "dash") return "player_dash";
  if (p.st === "slide" || p.st === "dodge") return "player_dodge";
  if (p.st === "attack") return "player_attack";
  if (!p.onG) return "player_jump";
  if (Math.abs(p.vx) > 40) return Math.floor(t / 0.11) % 2 === 0 ? "player_run1" : "player_run2";
  return "player_idle";
}

export function foeFrame(e: Ent): string {
  if (e.st === "down" || e.hp <= 0) return "officer_down";
  if (e.kind === "constable") return "constable_attack";
  if (e.st === "attack" || e.ai === "telegraph" || e.ai === "strike") return "officer_attack";
  return "officer_idle";
}

export function allyFrame(a: Ent): string {
  return a.st === "run" ? "durga_walk" : "durga_idle";
}
