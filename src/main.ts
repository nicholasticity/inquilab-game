import { deferredPaths, finalePaths, levelPaths, titlePaths } from "./assets";
import { HUD_BUTTONS, mountHudButtons } from "./hud";
import { urlForPath } from "./art-urls";
import { drawWorld, type ArtBook } from "./draw";
import {
  LEVELS,
  LNAME,
  applyLevel,
  blankInp,
  fresh,
  respawn,
  tick,
  VH,
  VW,
  type Inp,
  type Mode,
  type World,
} from "./game";

const art: ArtBook = { bg: {}, portrait: {}, tile: {}, sheet: {} };
const loaded = new Map<string, HTMLImageElement>();
const inflight = new Map<string, Promise<void>>();

function place(path: string, im: HTMLImageElement): void {
  const url = urlForPath(path);
  if (path.startsWith("assets/bg/")) art.bg[path.slice("assets/bg/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/portraits/")) art.portrait[path.slice("assets/portraits/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/tiles/")) art.tile[path.slice("assets/tiles/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/props/")) art.tile[path.slice("assets/props/".length, -".webp".length)] = im;
  else if (path.startsWith("assets/sheets/")) art.sheet[path.slice("assets/sheets/".length, -".webp".length)] = im;
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

function boot(): void {
  const canvas = document.getElementById("game");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Missing canvas context");

  const world: World = fresh();
  const keys: Record<string, boolean> = {};
  const frame = mustEl("frame");
  const stickEl = mustEl("stick");
  const knobEl = mustEl("stick-knob");
  const idleEl = mustEl("stick-idle");
  const hudButtons = mountHudButtons(mustEl("actions"));
  let stickId: number | null = null;
  let originX = 0;
  let originY = 0;
  let stickX = 0;
  let stickY = 0;
  let stickMag = 0;
  let actHeld = false;
  let throwPulse = false;
  let aimX = 0;
  let aimY = 0;
  let abilityPulse = false;
  let crouchPulse = false;
  let pick = 0;
  const pulses = { start: false, pause: false };
  const prev = { act: false, ability: false, crouch: false, throw: false, start: false, pause: false };

  const clearStick = () => {
    stickId = null;
    stickX = 0;
    stickY = 0;
    stickMag = 0;
    stickEl.hidden = true;
    idleEl.hidden = false;
    knobEl.style.transform = "translate(0px, 0px)";
  };
  const aimStick = (clientX: number, clientY: number) => {
    let dx = clientX - originX;
    let dy = clientY - originY;
    const dist = Math.hypot(dx, dy);
    const max = 56;
    if (dist > max) {
      dx = dx / dist * max;
      dy = dy / dist * max;
    }
    knobEl.style.transform = "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px)";
    stickMag = Math.min(1, dist / max);
    stickX = dist > 10 ? dx / dist : 0;
    stickY = dist > 10 ? dy / dist : 0;
  };
  frame.addEventListener("pointerdown", (e) => {
    if (document.body.dataset.mode !== "play") return;
    if (e.target instanceof Element && e.target.closest("button, #choice-ui")) return;
    const rect = frame.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const handsLeft = document.body.classList.contains("hands-left");
    const inStick = handsLeft ? localX > rect.width * 0.52 : localX < rect.width * 0.48;
    if (!inStick) return;
    stickId = e.pointerId;
    originX = e.clientX;
    originY = e.clientY;
    stickEl.hidden = false;
    idleEl.hidden = true;
    stickEl.style.left = (e.clientX - rect.left) + "px";
    stickEl.style.top = (e.clientY - rect.top) + "px";
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  frame.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickId) return;
    aimStick(e.clientX, e.clientY);
  });
  const endStick = (e: PointerEvent) => {
    if (e.pointerId !== stickId) return;
    if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
    clearStick();
  };
  frame.addEventListener("pointerup", endStick);
  frame.addEventListener("pointercancel", endStick);
  frame.addEventListener("contextmenu", (e) => e.preventDefault());

  const actBtn = hudButtons.find((btn) => btn.dataset.hud === "act");
  const abilityBtn = hudButtons.find((btn) => btn.dataset.hud === "ability");
  const crouchBtn = hudButtons.find((btn) => btn.dataset.hud === "crouch");
  const throwBtn = hudButtons.find((btn) => btn.dataset.hud === "throw");
  const bindPress = (el: HTMLElement | undefined, down: () => void, up?: () => void) => {
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-down");
      down();
    });
    const release = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (up) up();
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  };
  bindPress(actBtn, () => { actHeld = true; }, () => { actHeld = false; actBtn?.classList.remove("is-down"); });
  bindPress(abilityBtn, () => { abilityPulse = true; }, () => { abilityBtn?.classList.remove("is-down"); });
  bindPress(crouchBtn, () => { crouchPulse = true; }, () => { crouchBtn?.classList.remove("is-down"); });
  if (throwBtn) {
    let throwId: number | null = null;
    let ox = 0;
    let oy = 0;
    throwBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      throwId = e.pointerId;
      ox = e.clientX;
      oy = e.clientY;
      aimX = 0;
      aimY = 0;
      throwBtn.setPointerCapture(e.pointerId);
      throwBtn.classList.add("is-down");
    });
    throwBtn.addEventListener("pointermove", (e) => {
      if (e.pointerId !== throwId) return;
      const dx = e.clientX - ox;
      const dy = e.clientY - oy;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        aimX = dx / dist;
        aimY = dy / dist;
      }
    });
    const releaseThrow = (e: PointerEvent) => {
      if (e.pointerId !== throwId) return;
      if (throwBtn.hasPointerCapture(e.pointerId)) throwBtn.releasePointerCapture(e.pointerId);
      throwBtn.classList.remove("is-down");
      throwPulse = true;
      throwId = null;
    };
    throwBtn.addEventListener("pointerup", releaseThrow);
    throwBtn.addEventListener("pointercancel", releaseThrow);
  }

  let uiMode: Mode | null = null;
  let uiUnlocked = -1;
  const titleUi = mustEl("title-ui");
  const chapterUi = mustEl("chapter-ui");
  const pauseUi = mustEl("pause-ui");
  const choiceUi = mustEl("choice-ui");
  const chapterWait = mustEl("chapter-wait");
  const chapterButtons: HTMLButtonElement[] = [];
  type Pending = { kind: "begin" } | { kind: "pick"; n: number } | { kind: "finale" };
  let pending: Pending | null = null;
  let choiceKey = "";

  const showWait = (text: string) => {
    chapterWait.textContent = text;
    chapterWait.hidden = false;
  };
  const hideWait = () => { chapterWait.hidden = true; };

  const requestLevel = (n: number) => {
    if (world.mode !== "title" && world.mode !== "select") return;
    if (n < 1 || n > LEVELS || n > world.unlocked) return;
    if (ready(levelPaths(n))) {
      pending = null;
      hideWait();
      applyLevel(world, n, "brief");
      return;
    }
    pending = { kind: "pick", n };
    showWait("Loading this mission…");
    void ensure(levelPaths(n), "high");
  };

  for (let n = 1; n <= LEVELS; n++) {
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

  const prevent = new Set(["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "space", "shift", "enter", "escape", "a", "d", "w", "s", "e", "c", "q", "f", "p"]);
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (prevent.has(k)) e.preventDefault();
    keys[k] = true;
    if (e.repeat) return;
    if ((world.mode === "title" || world.mode === "select") && k >= "1" && k <= String(LEVELS)) requestLevel(parseInt(k, 10));
    if (world.prompt && k >= "1" && k <= "3") pick = parseInt(k, 10);
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    actHeld = false;
    clearStick();
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
    let key = "";
    let text = "";
    if (world.mode === "play" && world.level === 1) {
      if (world.lesson <= 0) { key = "move"; text = "Sneak"; }
      else if (world.lesson === 1) { key = "crouch"; text = "Crouch"; }
      else if (world.lesson === 2) { key = "act"; text = "Action"; }
      else if (world.lesson === 3) { key = "throw"; text = "Throw"; }
    }
    const stamp = key + ":" + text;
    if (stamp !== lastHint) {
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
    }
    crouchBtn?.classList.toggle("is-down", world.player.crouch);
    for (const def of HUD_BUTTONS) {
      const el = hudButtons.find((btn) => btn.dataset.hud === def.id);
      if (el) el.setAttribute("aria-label", def.id === "act" ? world.actLabel : def.label);
    }
  };

  const syncChoice = () => {
    const prompt = world.mode === "play" ? world.prompt : null;
    if (!prompt) {
      choiceUi.hidden = true;
      choiceKey = "";
      return;
    }
    const key = prompt.id + prompt.q;
    if (key !== choiceKey) {
      choiceKey = key;
      mustEl("choice-q").textContent = prompt.q;
      const opts = mustEl("choice-options");
      opts.replaceChildren();
      prompt.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = String(i + 1) + "   " + opt.label;
        btn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          pick = i + 1;
        });
        opts.appendChild(btn);
      });
    }
    choiceUi.hidden = false;
  };

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  const loop = (now: number) => {
    let frameDt = (now - last) / 1000;
    last = now;
    if (portraitQuery.matches) frameDt = 0;
    else if (frameDt > 0.12) frameDt = 0.12;
    acc += frameDt;
    if (pending?.kind === "begin" && world.mode === "title" && ready(levelPaths(1))) {
      pending = null;
      hideWait();
      pulses.start = true;
    } else if (pending?.kind === "begin" && world.mode === "done" && world.level < LEVELS && ready(levelPaths(world.level + 1))) {
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
      if (n <= world.unlocked) applyLevel(world, n, "brief");
    }
    const down = (k: string) => keys[k] === true;
    let mx = stickX;
    let my = stickY;
    let mag = stickMag;
    const runKey = down("shift");
    if (mag < 0.08) {
      const kx = (down("d") || down("arrowright") ? 1 : 0) - (down("a") || down("arrowleft") ? 1 : 0);
      const ky = (down("s") || down("arrowdown") ? 1 : 0) - (down("w") || down("arrowup") ? 1 : 0);
      const kl = Math.hypot(kx, ky);
      if (kl > 0) {
        mx = kx / kl;
        my = ky / kl;
        mag = runKey ? 1 : 0.55;
      }
    }
    const actNow = actHeld || down("e");
    const abilityNow = down("f");
    const crouchNow = down("c");
    const throwNow = down("q");
    const startNow = down("enter") || down(" ");
    const pauseNow = down("escape") || down("p");
    const inp: Inp = {
      ...blankInp(),
      x: mx,
      y: my,
      mag,
      run: runKey || mag >= 0.82,
      crouchP: crouchPulse || (crouchNow && !prev.crouch),
      act: actNow,
      actP: actNow && !prev.act,
      throwP: throwPulse || (throwNow && !prev.throw),
      aimX: throwPulse ? aimX : 0,
      aimY: throwPulse ? aimY : 0,
      abilityP: abilityPulse || (abilityNow && !prev.ability),
      startP: (startNow && !prev.start) || pulses.start,
      pauseP: (pauseNow && !prev.pause) || pulses.pause,
      pick,
    };
    prev.act = actNow;
    prev.ability = abilityNow;
    prev.crouch = crouchNow;
    prev.throw = throwNow;
    prev.start = startNow;
    prev.pause = pauseNow;
    throwPulse = false;
    abilityPulse = false;
    crouchPulse = false;
    pick = 0;
    aimX = 0;
    aimY = 0;
    if (world.mode !== "play" && stickId !== null) clearStick();
    pulses.start = false;
    pulses.pause = false;

    if (world.mode === "title" && inp.startP && !ready(levelPaths(1))) {
      inp.startP = false;
      pending = { kind: "begin" };
      showWait("Loading this mission…");
      void ensure(levelPaths(1), "high");
    } else if (world.mode === "done" && inp.startP) {
      if (world.level >= LEVELS && !ready(finalePaths())) {
        inp.startP = false;
        pending = { kind: "finale" };
        showWait("Loading the finale…");
        void ensure(finalePaths(), "high");
      } else if (world.level < LEVELS && !ready(levelPaths(world.level + 1))) {
        inp.startP = false;
        pending = { kind: "begin" };
        showWait("Loading this mission…");
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
        crouchP: false, actP: false, throwP: false, abilityP: false, startP: false, pauseP: false, pick: 0,
      };
      tick(world, sub, STEP);
      steps += 1;
    }
    if (steps === 5) acc = 0;

    ctx.clearRect(0, 0, VW, VH);
    drawWorld(ctx, world, art);
    syncHud();
    syncChoice();
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
  boot();
  void ensure(levelPaths(1), "high")
    .then(() => ensure(deferredPaths(), "low"))
    .catch(() => undefined);
}).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : "Could not load the paintings";
  if (loadingMsg) loadingMsg.textContent = msg;
});
