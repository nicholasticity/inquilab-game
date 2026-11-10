import { deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import { HUD_BUTTONS, mountHudButtons } from "./hud";
import { urlForPath } from "./art-urls";
import { drawWorld, type ArtBook } from "./draw";
import {
  applyLevel,
  blankInp,
  DASH_COOL,
  DODGE_COOL,
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
  act: boolean;
}

const HOLD_KEYS: (keyof Hold)[] = ["l", "r", "u", "d", "jump", "atk", "dash", "dodge", "act"];

function emptyHold(): Hold {
  return { l: false, r: false, u: false, d: false, jump: false, atk: false, dash: false, dodge: false, act: false };
}

const art: ArtBook = { bg: {}, portrait: {}, frame: {}, ground: {}, prop: {} };
const loaded = new Map<string, HTMLImageElement>();
const inflight = new Map<string, Promise<void>>();

function place(path: string, im: HTMLImageElement): void {
  const url = urlForPath(path);
  if (path.startsWith("assets/bg/")) art.bg[path.slice("assets/bg/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/ground/")) art.ground[path.slice("assets/ground/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/prop/")) art.prop[path.slice("assets/prop/".length, -".webp".length)] = im;
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
  const prev = { jump: false, atk: false, dash: false, dodge: false, act: false, start: false, pause: false };
  const frame = mustEl("frame");
  const stickEl = mustEl("stick");
  const knobEl = mustEl("stick-knob");
  const idleEl = mustEl("stick-idle");
  const hudButtons = mountHudButtons(mustEl("actions"));
  let stickId: number | null = null;
  let flick = false;
  let prevKnob = 0;
  let prevKnobT = 0;
  const clearStick = () => {
    stickId = null;
    hold.l = false;
    hold.r = false;
    hold.u = false;
    hold.d = false;
    stickEl.hidden = true;
    idleEl.hidden = false;
    knobEl.style.transform = "translate(0px, 0px)";
  };
  const aimStick = (clientX: number, clientY: number, originX: number, originY: number) => {
    let dx = clientX - originX;
    let dy = clientY - originY;
    const dist = Math.hypot(dx, dy);
    const max = 56;
    if (dist > max) {
      dx = dx / dist * max;
      dy = dy / dist * max;
    }
    knobEl.style.transform = "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px)";
    const dead = 12;
    hold.l = dx < -dead;
    hold.r = dx > dead;
    hold.u = dy < -dead;
    hold.d = dy > dead * 1.15;
    const now = performance.now();
    const dt = (now - prevKnobT) / 1000;
    if (dt > 0 && dt < 0.08 && Math.abs(dx - prevKnob) / dt > 1400 && Math.abs(dx) > Math.abs(dy)) flick = true;
    prevKnob = dx;
    prevKnobT = now;
  };
  let originX = 0;
  let originY = 0;
  frame.addEventListener("pointerdown", (e) => {
    if (document.body.dataset.mode !== "play") return;
    if (e.target instanceof Element && e.target.closest("button")) return;
    const rect = frame.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const handsLeft = document.body.classList.contains("hands-left");
    const inStick = handsLeft ? localX > rect.width * 0.52 : localX < rect.width * 0.48;
    if (!inStick) return;
    stickId = e.pointerId;
    originX = e.clientX;
    originY = e.clientY;
    prevKnob = 0;
    prevKnobT = performance.now();
    stickEl.hidden = false;
    idleEl.hidden = true;
    stickEl.style.left = (e.clientX - rect.left) + "px";
    stickEl.style.top = (e.clientY - rect.top) + "px";
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  frame.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickId) return;
    aimStick(e.clientX, e.clientY, originX, originY);
  });
  const endStick = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
    clearStick();
  };
  frame.addEventListener("pointerup", endStick);
  frame.addEventListener("pointercancel", endStick);
  frame.addEventListener("contextmenu", (e) => e.preventDefault());
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
      el.classList.add("is-down");
    };
    const up = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      hold[key] = false;
      el.classList.remove("is-down");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", () => {
      hold[key] = false;
      el.classList.remove("is-down");
    });
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
    const viewH = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-h", Math.round(viewH) + "px");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(VW * dpr);
    canvas.height = Math.round(VH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
  };
  fit();
  window.addEventListener("resize", fit);
  window.visualViewport?.addEventListener("resize", fit);
  window.visualViewport?.addEventListener("scroll", fit);

  const portraitQuery = window.matchMedia("(orientation: portrait)");
  let askedStage = false;
  const goLandscape = () => {
    if (askedStage) return;
    askedStage = true;
    const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    const req = root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root);
    const pendingFs = req ? Promise.resolve().then(() => req()) : Promise.resolve();
    void pendingFs.catch(() => undefined).then(() => {
      const orient = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
      if (!orient.lock) return undefined;
      return orient.lock("landscape");
    }).catch(() => undefined);
  };
  window.addEventListener("pointerdown", goLandscape, true);

  type Prefs = { size: "s" | "m" | "l"; opacity: "low" | "mid" | "high"; left: boolean };
  const prefKey = "inquilab-controls";
  const readPrefs = (): Prefs => {
    const fallback: Prefs = { size: "m", opacity: "high", left: false };
    try {
      const raw = localStorage.getItem(prefKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return {
        size: parsed.size === "s" || parsed.size === "l" ? parsed.size : "m",
        opacity: parsed.opacity === "low" || parsed.opacity === "mid" ? parsed.opacity : "high",
        left: parsed.left === true,
      };
    } catch {
      return fallback;
    }
  };
  let prefs = readPrefs();
  const applyPrefs = () => {
    document.documentElement.style.setProperty("--hud-scale", prefs.size === "s" ? "0.84" : prefs.size === "l" ? "1.16" : "1");
    document.documentElement.style.setProperty("--hud-opacity", prefs.opacity === "low" ? "0.5" : prefs.opacity === "mid" ? "0.72" : "0.94");
    document.body.classList.toggle("hands-left", prefs.left);
    document.querySelectorAll<HTMLButtonElement>("[data-size]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.size === prefs.size);
    });
    document.querySelectorAll<HTMLButtonElement>("[data-opacity]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.opacity === prefs.opacity);
    });
    const hands = mustEl("btn-hands");
    hands.classList.toggle("is-on", prefs.left);
    hands.textContent = prefs.left ? "Left hand on" : "Left hand";
    try { localStorage.setItem(prefKey, JSON.stringify(prefs)); } catch { /* private mode */ }
  };
  applyPrefs();
  document.querySelectorAll<HTMLButtonElement>("[data-size]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const size = btn.dataset.size;
      if (size === "s" || size === "m" || size === "l") prefs = { ...prefs, size };
      applyPrefs();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-opacity]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opacity = btn.dataset.opacity;
      if (opacity === "low" || opacity === "mid" || opacity === "high") prefs = { ...prefs, opacity };
      applyPrefs();
    });
  });
  mustEl("btn-hands").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    prefs = { ...prefs, left: !prefs.left };
    if (stickId !== null) clearStick();
    applyPrefs();
  });

  const hints = document.querySelectorAll<HTMLElement>(".touch-hint");
  let lastHint = "";
  const syncHud = () => {
    const throwing = world.mode === "play" && world.level === 4 && world.gallery && world.leaflets < 8;
    for (const def of HUD_BUTTONS) {
      const el = hudButtons.find((btn) => btn.dataset.hud === def.id);
      if (!el) continue;
      const on = def.show === "always" || throwing;
      if (el.hidden === on) {
        el.hidden = !on;
        if (!on) {
          hold[def.hold] = false;
          el.classList.remove("is-down");
        }
      }
      if (def.cool === "dodge") el.style.setProperty("--sweep", String(Math.max(0, Math.min(1, world.player.cool / DODGE_COOL))));
      else if (def.cool === "dash") el.style.setProperty("--sweep", String(Math.max(0, Math.min(1, world.player.dcd / DASH_COOL))));
    }
    let key = "";
    let text = "";
    if (world.mode === "play" && world.level === 1) {
      if (world.lesson <= 0) { key = "move"; text = "Move"; }
      else if (world.lesson === 1) { key = "jump"; text = "Jump"; }
      else if (world.lesson === 2) { key = "atk"; text = "Tap"; }
      else if (world.lesson === 3) { key = "dodge"; text = "Dodge"; }
      else if (world.lesson === 4) { key = "atk"; text = "Hold, release"; }
    } else if (world.mode === "play" && world.level === 2 && world.player.x < 2100) {
      key = "move";
      text = "Stay with her";
    } else if (throwing) {
      key = "act";
      text = "Throw";
    }
    const stamp = key + ":" + text;
    if (stamp === lastHint) return;
    lastHint = stamp;
    hints.forEach((hint) => {
      const on = hint.dataset.hint === key;
      hint.hidden = !on;
      if (on) hint.textContent = text;
    });
    idleEl.classList.remove("is-hot");
    for (const btn of hudButtons) btn.classList.remove("is-hot");
    const hintEl = key ? document.querySelector<HTMLElement>(`.touch-hint[data-hint="${key}"]`) : null;
    hintEl?.parentElement?.classList.add("is-hot");
  };

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  const loop = (now: number) => {
    let frame = (now - last) / 1000;
    last = now;
    if (portraitQuery.matches) frame = 0;
    else if (frame > 0.12) frame = 0.12;
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
    const throwing = world.mode === "play" && world.level === 4 && world.gallery && world.leaflets < 8;
    const jumpNow = down(" ") || down("space") || down("arrowup") || down("w") || hold.jump;
    const atkNow = down("j") || down("x") || hold.atk;
    const actNow = hold.act;
    const dashNow = down("k") || down("c") || hold.dash || flick;
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
      atkR: prev.atk && !atkNow,
      dash: dashNow,
      dashP: (dashNow && !prev.dash) || flick,
      dodge: dodgeNow,
      dodgeP: dodgeNow && !prev.dodge,
      act: actNow,
      actP: throwing && actNow && !prev.act,
      startP: (startNow && !prev.start) || pulses.start,
      pauseP: (pauseNow && !prev.pause) || pulses.pause,
    };
    flick = false;
    prev.jump = jumpNow;
    prev.atk = atkNow;
    prev.dash = dashNow;
    prev.dodge = dodgeNow;
    prev.act = actNow;
    prev.start = startNow;
    prev.pause = pauseNow;
    if (world.mode !== "play" && stickId !== null) clearStick();
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
        jumpP: false, atkP: false, atkR: false, dashP: false, dodgeP: false, actP: false, startP: false, pauseP: false,
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
    syncHud();
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
