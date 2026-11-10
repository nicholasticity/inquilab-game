import { deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import { urlForPath } from "./art-urls";
import { drawWorld, type ArtBook } from "./draw";
import {
  applyLevel,
  blankInp,
  fresh,
  LNAME,
  respawn,
  stepParts,
  tick,
  VH,
  VW,
  type Inp,
  type Mode,
  type World,
} from "./game";

interface Hold {
  l: boolean;
  r: boolean;
  u: boolean;
  d: boolean;
  jump: boolean;
  atk: boolean;
  dash: boolean;
  dodge: boolean;
}

const HOLD_KEYS: (keyof Hold)[] = ["l", "r", "u", "d", "jump", "atk", "dash", "dodge"];

function emptyHold(): Hold {
  return { l: false, r: false, u: false, d: false, jump: false, atk: false, dash: false, dodge: false };
}

const art: ArtBook = { bg: {}, portrait: {}, frame: {} };
const loaded = new Map<string, HTMLImageElement>();
const inflight = new Map<string, Promise<void>>();

function place(path: string, im: HTMLImageElement): void {
  const url = urlForPath(path);
  if (path.startsWith("assets/bg/")) art.bg[path.slice("assets/bg/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/portraits/")) art.portrait[path.slice("assets/portraits/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/frames/")) art.frame[path.slice("assets/frames/".length, -".webp".length)] = im;
  loaded.set(url, im);
}

function loadOne(path: string, priority: "high" | "low"): Promise<void> {
  const url = urlForPath(path);
  if (loaded.has(url)) return Promise.resolve();
  const existing = inflight.get(url);
  if (existing) return existing;
  const job = (async () => {
    const im = new Image();
    im.decoding = "async";
    im.fetchPriority = priority;
    im.src = url;
    try {
      await im.decode();
    } catch {
      throw new Error("Missing image: " + path);
    }
    if (im.naturalWidth <= 0) throw new Error("Empty image: " + path);
    place(path, im);
  })().catch((err: unknown) => {
    inflight.delete(url);
    throw err;
  });
  inflight.set(url, job);
  return job;
}

function ensure(paths: string[], priority: "high" | "low"): Promise<void> {
  return Promise.all(paths.map((path) => loadOne(path, priority))).then(() => undefined);
}

function ready(paths: string[]): boolean {
  return paths.every((path) => loaded.has(urlForPath(path)));
}

function boot(art: ArtBook): void {
  const canvas = document.getElementById("game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Missing canvas context");

  const world: World = fresh();
  const keys: Record<string, boolean> = {};
  const hold = emptyHold();
  const prev = { jump: false, atk: false, dash: false, dodge: false, start: false, pause: false };
  const pulses = { start: false, pause: false };
  let uiMode: Mode | null = null;
  let uiUnlocked = -1;

  const titleUi = mustEl("title-ui");
  const chapterUi = mustEl("chapter-ui");
  const pauseUi = mustEl("pause-ui");
  const chapterWait = mustEl("chapter-wait");
  const chapterButtons: HTMLButtonElement[] = [];
  type Pending = { kind: "begin" } | { kind: "pick"; n: number } | { kind: "finale" };
  let pending: Pending | null = null;

  const showWait = (text: string) => {
    chapterWait.textContent = text;
    chapterWait.hidden = false;
  };
  const hideWait = () => { chapterWait.hidden = true; };

  const requestLevel = (n: number) => {
    if (world.mode !== "title" && world.mode !== "select") return;
    if (n < 1 || n > 5 || n > world.unlocked) return;
    if (ready(levelPaths(n))) {
      pending = null;
      hideWait();
      applyLevel(world, n, n === 5 ? "l5" : "l" + String(n));
      return;
    }
    pending = { kind: "pick", n };
    showWait("Loading this chapter…");
    void ensure(levelPaths(n), "high");
  };

  for (let n = 1; n <= 5; n++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.ch = String(n);
    btn.textContent = n + "  " + (LNAME[n] ?? "");
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestLevel(n);
    });
    chapterUi.appendChild(btn);
    chapterButtons.push(btn);
  }

  const bindHold = (el: HTMLElement, key: keyof Hold) => {
    const down = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      hold[key] = true;
    };
    const up = () => { hold[key] = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  document.querySelectorAll<HTMLElement>("[data-hold]").forEach((el) => {
    const key = el.dataset.hold;
    if (key && (HOLD_KEYS as string[]).includes(key)) bindHold(el, key as keyof Hold);
  });

  mustEl("btn-begin").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pulses.start = true;
  });
  mustEl("btn-chapters").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (world.mode === "title") world.mode = "select";
  });
  mustEl("btn-continue").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pulses.start = true;
  });
  mustEl("btn-pause").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pulses.pause = true;
  });
  mustEl("btn-resume").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (world.mode === "pause") world.mode = "play";
  });
  mustEl("btn-retry").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    respawn(world);
  });
  mustEl("btn-level-select").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    world.mode = "select";
  });

  canvas.addEventListener("pointerdown", () => {
    const m = world.mode;
    if (m === "title" || m === "talk" || m === "done" || m === "finale" || m === "dead") pulses.start = true;
  });

  const frame = mustEl("frame");
  frame.addEventListener("contextmenu", (e) => e.preventDefault());

  const prevent = new Set(["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "space", "shift", "enter", "escape", "a", "d", "w", "s", "j", "x", "k", "c", "l", "p"]);
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (prevent.has(k)) e.preventDefault();
    keys[k] = true;
    if (e.repeat) return;
    if (k >= "1" && k <= "5") {
      const n = parseInt(k, 10);
      requestLevel(n);
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    for (const key of HOLD_KEYS) hold[key] = false;
  });

  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(VW * dpr);
    canvas.height = Math.round(VH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
  };
  fit();
  window.addEventListener("resize", fit);

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  const loop = (now: number) => {
    let frame = (now - last) / 1000;
    last = now;
    if (frame > 0.12) frame = 0.12;
    acc += frame;
    if (pending?.kind === "begin" && world.mode === "title" && ready(levelPaths(1))) {
      pending = null;
      hideWait();
      pulses.start = true;
    } else if (pending?.kind === "begin" && world.mode === "done" && world.level < 5 && ready(levelPaths(world.level + 1))) {
      pending = null;
      hideWait();
      pulses.start = true;
    } else if (pending?.kind === "finale" && world.mode === "done" && ready(finalePaths())) {
      pending = null;
      hideWait();
      pulses.start = true;
    } else if (pending?.kind === "pick" && (world.mode === "title" || world.mode === "select") && ready(levelPaths(pending.n))) {
      const n = pending.n;
      pending = null;
      hideWait();
      if (n <= world.unlocked) applyLevel(world, n, n === 5 ? "l5" : "l" + String(n));
    }
    const down = (k: string) => keys[k] === true;
    const jumpNow = down(" ") || down("space") || down("arrowup") || down("w") || hold.jump;
    const atkNow = down("j") || down("x") || hold.atk;
    const dashNow = down("k") || down("c") || hold.dash;
    const dodgeNow = down("l") || down("shift") || hold.dodge;
    const startNow = down("enter") || down(" ");
    const pauseNow = down("escape") || down("p");
    const inp: Inp = {
      ...blankInp(),
      l: down("arrowleft") || down("a") || hold.l,
      r: down("arrowright") || down("d") || hold.r,
      u: down("arrowup") || down("w") || hold.u,
      d: down("arrowdown") || down("s") || hold.d,
      jump: jumpNow,
      jumpP: (jumpNow && !prev.jump),
      atk: atkNow,
      atkP: atkNow && !prev.atk,
      dash: dashNow,
      dashP: dashNow && !prev.dash,
      dodge: dodgeNow,
      dodgeP: dodgeNow && !prev.dodge,
      startP: (startNow && !prev.start) || pulses.start,
      pauseP: (pauseNow && !prev.pause) || pulses.pause,
    };
    prev.jump = jumpNow;
    prev.atk = atkNow;
    prev.dash = dashNow;
    prev.dodge = dodgeNow;
    prev.start = startNow;
    prev.pause = pauseNow;
    pulses.start = false;
    pulses.pause = false;

    if (world.mode === "title" && inp.startP && !ready(levelPaths(1))) {
      inp.startP = false;
      pending = { kind: "begin" };
      showWait("Loading this chapter…");
      void ensure(levelPaths(1), "high");
    } else if (world.mode === "done" && (inp.startP || inp.jumpP)) {
      if (world.level >= 5 && !ready(finalePaths())) {
        inp.startP = false;
        inp.jumpP = false;
        pending = { kind: "finale" };
        showWait("Loading the finale…");
        void ensure(finalePaths(), "high");
      } else if (world.level < 5 && !ready(levelPaths(world.level + 1))) {
        inp.startP = false;
        inp.jumpP = false;
        pending = { kind: "begin" };
        showWait("Loading this chapter…");
        void ensure(levelPaths(world.level + 1), "high");
      }
    }

    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP;
      const edge = steps === 0;
      if (edge && inp.pauseP && world.mode === "play") world.mode = "pause";
      else if (edge && inp.pauseP && world.mode === "pause") world.mode = "play";
      const sub: Inp = edge ? inp : {
        ...inp,
        jumpP: false, atkP: false, dashP: false, dodgeP: false, startP: false, pauseP: false,
      };
      tick(world, sub, STEP);
      if (world.mode !== "pause") {
        stepParts(world.parts, STEP, false);
        if (world.rainOn || world.mode === "title" || world.mode === "select") stepParts(world.rain, STEP, true);
      }
      steps += 1;
    }
    if (steps === 5) acc = 0;

    ctx.clearRect(0, 0, VW, VH);
    drawWorld(ctx, world, art);
    syncUi();
    requestAnimationFrame(loop);
  };

  function syncUi(): void {
    if (world.mode === uiMode && world.unlocked === uiUnlocked) return;
    uiMode = world.mode;
    uiUnlocked = world.unlocked;
    titleUi.hidden = world.mode !== "title";
    chapterUi.hidden = world.mode !== "select";
    pauseUi.hidden = world.mode !== "pause";
    for (const btn of chapterButtons) {
      const n = Number(btn.dataset.ch);
      btn.disabled = n > world.unlocked;
    }
    document.body.dataset.mode = world.mode;
  }

  mustEl("loading").classList.add("hidden");
  syncUi();
  requestAnimationFrame(loop);
}

function mustEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error("Missing #" + id);
  return el;
}

const loadingMsg = document.getElementById("loading-msg");
ensure(titlePaths(), "high").then(() => {
  boot(art);
  void ensure(levelPaths(1), "high")
    .then(() => ensure(deferredPaths(), "low"))
    .catch(() => undefined);
}).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : "Could not load the paintings";
  if (loadingMsg) loadingMsg.textContent = msg;
});
