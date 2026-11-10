import Phaser from "phaser";
import { isMuted, playCue, recentCues, setMuted, unlockAudio } from "../audio/cues";
import { campaign, persist } from "../app/campaign";
import { publish } from "../app/probe";
import { buildMission } from "../missions";
import { epilogue, headline } from "../missions/story";
import { abilityCells, cellDef, cellKey, dirBetween, exitLocked, isLit, playerHiding, soundCells } from "../sim/board";
import { cloneRoom, coneDrawList, predict } from "../sim/ai";
import { cellRect, GAME_H, GAME_W, groundPoint, hudRects, layoutBoard } from "../render/layout";
import type { Archetype, PaintActor, PaintModel, PaintTile } from "../render/model";
import { paintBoard, paintBust } from "../render/painter";
import { GOLD, PAPER, SAND } from "../render/palette";
import { activeTeach, isLoudStep } from "../sim/rules";
import { cloneRun, startMission, stepRun, type RunState, type StepOutcome } from "../sim/run";
import type { Action, Dir, GuardKind, GuardMove, RoomState, TurnResult } from "../sim/types";
import { buttonFace, contains, label, plaque, roundRect } from "./chrome";

interface Pending {
  before: RoomState;
  outcome: Exclude<StepOutcome, { type: "deny" }>;
  lead: "L" | "R";
}

interface Beat {
  kind: "move" | "settle" | "stone" | "guards" | "flash" | "notice" | "fade";
  ms: number;
  elapsed: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  color: string;
}

const MENU = [
  { id: "resume", label: "Resume", y: 150 },
  { id: "retry", label: "Retry room", y: 214 },
  { id: "missions", label: "Mission select", y: 278 },
  { id: "mute", label: "Mute", y: 342 },
];

function portraitMode(): boolean {
  return window.matchMedia("(orientation: portrait)").matches;
}

function cubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return 1 - (1 - u) ** 3;
}

function archetypeOf(state: RoomState): Archetype {
  if (state.agent === "veil") return state.disguised ? "veil-coat" : "veil";
  return "kite";
}

function guardArchetype(kind: GuardKind): Archetype {
  return kind === "officer" ? "officer" : "constable";
}

function pictured(before: RoomState, result: TurnResult): RoomState {
  const next = cloneRoom(before);
  next.playerX = result.playerTo.x;
  next.playerY = result.playerTo.y;
  next.playerFace = result.face;
  if (result.toggledCoat) next.disguised = !before.disguised;
  if (result.sound) next.stoneCd = 3;
  else if (before.stoneCd > 0) next.stoneCd = before.stoneCd - 1;
  for (const move of result.guardMoves) {
    const guard = next.guards.find((entry) => entry.id === move.id);
    if (!guard) continue;
    guard.x = move.toX;
    guard.y = move.toY;
    guard.face = move.face;
    guard.state = move.state;
  }
  if (result.subdued) {
    const guard = next.guards.find((entry) => entry.id === result.subdued);
    if (guard) guard.state = "down";
  }
  if (result.pickup || result.courier) {
    next.taken = { ...next.taken, [cellKey(result.playerTo.x, result.playerTo.y)]: true };
    if (result.pickup === "plans") next.hasPlans = true;
    if (result.pickup === "note") next.hasNote = true;
    if (result.courier) next.savedCourier = true;
  }
  return next;
}

function tilesOf(state: RoomState): PaintTile[] {
  return state.room.cells.map((cell) => {
    const taken = Boolean(state.taken[cellKey(cell.x, cell.y)]);
    const locked = exitLocked(state, cell);
    let gleam: PaintTile["gleam"] = null;
    if (!taken && cell.kind === "ability" && state.agent === "kite" && state.stoneCd === 0) gleam = "cyan";
    else if (!taken && (cell.kind === "item" || cell.kind === "note" || cell.kind === "courier")) gleam = "gold";
    else if (cell.kind === "exit" && !locked) gleam = "gold";
    let prop = cell.prop;
    if (taken && (prop === "plans" || prop === "note")) prop = undefined;
    if (cell.kind === "courier") prop = undefined;
    return {
      x: cell.x,
      y: cell.y,
      lit: isLit(state, cell.x, cell.y),
      hide: cell.kind === "hide",
      prop,
      gleam,
      label: cell.label,
      locked,
      pit: false,
    };
  });
}

function stand(state: RoomState, lead: "L" | "R", pose: PaintActor["pose"] = "idle"): PaintActor {
  return {
    archetype: archetypeOf(state),
    face: state.playerFace,
    pose,
    walkT: 0,
    fromX: state.playerX,
    fromY: state.playerY,
    toX: state.playerX,
    toY: state.playerY,
    hidden: playerHiding(state),
    mark: "none",
    lead,
  };
}

export class Play extends Phaser.Scene {
  private missionId = 1;
  private run!: RunState;
  private checkpoint!: RunState;
  private pending: Pending[] = [];
  private beats: Beat[] = [];
  private beatIndex = 0;
  private playing = false;
  private paused = false;
  private lead: "L" | "R" = "L";
  private clock = 0;
  private enteredAt = -2000;
  private banner: { text: string; until: number } | null = null;
  private board!: Phaser.Textures.CanvasTexture;
  private hud!: Phaser.Textures.CanvasTexture;
  private boardImage!: Phaser.GameObjects.Image;
  private press: { x: number; y: number } | null = null;
  private shake = 0;
  private motes: Mote[] = [];
  private rings: { x: number; y: number; born: number }[] = [];
  private ghosts: { x: number; y: number; born: number }[] = [];
  private pebble: { x: number; y: number } | null = null;
  private noticeAt: number | null = null;
  private playableAt: number | null = null;
  private alerted = false;
  private fps = 60;
  private fpsFrames = 0;
  private fpsStamp = 0;
  private paintedCones: { tone: string; cells: { x: number; y: number }[] }[] = [];
  private notice: "q" | "bang" | null = null;

  constructor() {
    super("play");
  }

  init(data: { missionId?: number }): void {
    this.missionId = data.missionId ?? 1;
  }

  create(): void {
    const mission = buildMission(this.missionId, campaign.story);
    if (!mission) {
      this.scene.start("select");
      return;
    }
    this.run = startMission(mission, campaign.story);
    this.checkpoint = cloneRun(this.run);
    this.pending = [];
    this.beats = [];
    this.playing = false;
    this.paused = false;
    this.enteredAt = 0;
    this.banner = null;
    this.noticeAt = null;
    this.playableAt = performance.now();
    this.board = this.fresh("play-board");
    this.hud = this.fresh("play-hud");
    this.boardImage = this.add.image(0, 0, "play-board").setOrigin(0, 0);
    this.add.image(0, 0, "play-hud").setOrigin(0, 0);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (portraitMode()) return;
      unlockAudio();
      this.press = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.onUp(pointer));
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.onKey(event));
    this.draw();
    this.emit();
  }

  update(_time: number, delta: number): void {
    this.clock += delta;
    this.fpsFrames += 1;
    if (this.clock - this.fpsStamp > 500) {
      this.fps = Math.round((this.fpsFrames * 1000) / (this.clock - this.fpsStamp));
      this.fpsFrames = 0;
      this.fpsStamp = this.clock;
    }
    if (this.playing && !this.paused) this.advance(delta);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - delta);
    this.draw();
    this.emit();
  }

  private fresh(key: string): Phaser.Textures.CanvasTexture {
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, GAME_W, GAME_H);
    if (!tex) throw new Error(key);
    return tex;
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (!this.press || portraitMode()) {
      this.press = null;
      return;
    }
    const dx = pointer.x - this.press.x;
    const dy = pointer.y - this.press.y;
    this.press = null;
    const rect = this.scale.canvas.getBoundingClientRect();
    const css = rect.width / GAME_W;
    const phys = Math.hypot(dx, dy) * css * (window.devicePixelRatio || 1);
    if (phys >= 40 && !this.paused) {
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      this.tryAction({ type: "move", dir });
      return;
    }
    this.tap(pointer.x, pointer.y);
  }

  private onKey(event: KeyboardEvent): void {
    if (event.repeat || portraitMode()) return;
    const dirs: Record<string, Dir> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    if (dirs[event.code]) {
      event.preventDefault();
      this.tryAction({ type: "move", dir: dirs[event.code] });
    } else if (event.code === "Space") this.tryAction({ type: "wait" });
    else if (event.code === "KeyE" || event.code === "KeyF") this.useAbility();
    else if (event.code === "Escape") this.paused = !this.paused;
  }

  private tap(x: number, y: number): void {
    const hud = Object.fromEntries(hudRects().map((entry) => [entry.id, entry.r]));
    if (this.paused) {
      for (const item of MENU) {
        const rect = { x: 330, y: item.y, w: 300, h: 52 };
        if (!contains(x, y, rect)) continue;
        playCue("ui_tap", this);
        if (item.id === "resume") this.paused = false;
        else if (item.id === "retry") this.restore();
        else if (item.id === "missions") this.scene.start("select");
        else {
          campaign.mute = !campaign.mute;
          setMuted(campaign.mute);
          persist();
        }
      }
      return;
    }
    if (contains(x, y, hud.pause)) {
      playCue("ui_tap", this);
      this.paused = true;
      return;
    }
    if (contains(x, y, hud.wait)) {
      this.tryAction({ type: "wait" });
      return;
    }
    if (contains(x, y, hud.ability) && this.abilityShown(this.run.room)) {
      this.useAbility();
      return;
    }
    if (this.playing) return;
    if (this.banner && contains(x, y, hud.objective)) {
      this.banner = null;
      return;
    }
    const state = this.hudState();
    const layout = layoutBoard(state.room.cols, state.room.rows);
    const cx = Math.floor((x - layout.ox) / layout.cell);
    const cy = Math.floor((y - layout.oy) / layout.cell);
    const cell = cellDef(state.room, cx, cy);
    if (cell && state.agent === "kite" && state.stoneCd === 0 && cell.kind === "ability") {
      this.tryAction({ type: "ability", x: cx, y: cy });
      return;
    }
    if (cx === state.playerX && cy === state.playerY) {
      this.tryAction({ type: "wait" });
      return;
    }
    if (Math.abs(cx - state.playerX) + Math.abs(cy - state.playerY) === 1) {
      const dir = dirBetween({ x: state.playerX, y: state.playerY }, { x: cx, y: cy });
      if (dir) {
        this.tryAction({ type: "move", dir });
        return;
      }
    }
    playCue("ui_deny", this);
    this.shake = 140;
  }

  private useAbility(): void {
    const state = this.run.room;
    if (state.agent === "veil") {
      this.tryAction({ type: "ability" });
      return;
    }
    if (state.stoneCd > 0) {
      playCue("ui_deny", this);
      this.shake = 140;
      return;
    }
    const cells = abilityCells(state);
    if (cells.length === 0) {
      playCue("ui_deny", this);
      return;
    }
    const target = cells
      .slice()
      .sort(
        (a, b) =>
          Math.abs(a.x - state.playerX) + Math.abs(a.y - state.playerY) - (Math.abs(b.x - state.playerX) + Math.abs(b.y - state.playerY)),
      )[0];
    this.tryAction({ type: "ability", x: target.x, y: target.y });
  }

  private tryAction(action: Action): void {
    if (this.paused || portraitMode()) return;
    if (this.pending.length >= 3) return;
    if (this.pending.some((item) => item.outcome.type !== "continue")) return;
    const before = cloneRoom(this.run.room);
    const outcome = stepRun(this.run, action);
    if (outcome.type === "deny") {
      playCue("ui_deny", this);
      this.shake = 140;
      return;
    }
    this.lead = this.lead === "L" ? "R" : "L";
    this.pending.push({ before, outcome, lead: this.lead });
    if (!this.playing) this.begin();
  }

  private begin(): void {
    const item = this.pending[0];
    if (!item) {
      this.playing = false;
      return;
    }
    this.beats = script(item);
    this.beatIndex = 0;
    this.playing = true;
    this.alerted = false;
    this.onBeatStart(this.beats[0]);
  }

  private onBeatStart(beat: Beat | undefined): void {
    const item = this.pending[0];
    if (!beat || !item) return;
    const result = item.outcome.result;
    if (beat.kind === "move") {
      playCue(isLoudStep(item.before, result.playerTo.x, result.playerTo.y) ? "step_hard" : "step_soft", this);
      navigator.vibrate?.(12);
    } else if (beat.kind === "settle") playCue(result.toggledCoat ? "hide" : "wait", this);
    else if (beat.kind === "stone") playCue("stone_arc", this);
    else if (beat.kind === "guards") {
      if (result.guardMoves.some((move) => move.pose === "walk")) playCue("guard_step", this);
    } else if (beat.kind === "flash") playCue("subdue", this);
    else if (beat.kind === "notice") {
      playCue("notice", this);
      navigator.vibrate?.(25);
      this.noticeAt = performance.now();
      this.alerted = false;
    } else if (beat.kind === "fade" && item.outcome.type === "extract") playCue("success", this);
  }

  private advance(delta: number): void {
    const beat = this.beats[this.beatIndex];
    if (!beat) return;
    beat.elapsed += delta;
    const item = this.pending[0];
    if (beat.kind === "notice" && item && !this.alerted && beat.elapsed > 110) {
      this.alerted = true;
      playCue("alert", this);
    }
    if (beat.elapsed < beat.ms) return;
    this.finishBeat(beat);
    this.beatIndex += 1;
    if (this.beatIndex >= this.beats.length) this.finishItem();
    else this.onBeatStart(this.beats[this.beatIndex]);
  }

  private finishBeat(beat: Beat): void {
    const item = this.pending[0];
    if (!item) return;
    const result = item.outcome.result;
    if (beat.kind === "move") {
      if (result.pickup || result.courier) playCue("pickup", this);
      const cell = cellDef(item.before.room, result.playerTo.x, result.playerTo.y);
      if (cell?.kind === "hide") playCue("hide", this);
    }
    if (beat.kind === "stone" && result.sound) this.land(item.before, result.sound.x, result.sound.y);
    if (beat.kind === "guards") {
      this.ghosts = result.ghosts.map((ghost) => ({ ...ghost, born: this.clock }));
    }
  }

  private land(state: RoomState, x: number, y: number): void {
    playCue("stone_land", this);
    const layout = layoutBoard(state.room.cols, state.room.rows);
    const ground = groundPoint(layout, x, y);
    this.rings = soundCells(state, x, y).map((cell) => ({ ...cell, born: this.clock }));
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      this.motes.push({
        x: ground.x,
        y: ground.y - 8,
        vx: Math.cos(angle) * 46,
        vy: -28 - Math.abs(Math.sin(angle)) * 24,
        born: this.clock,
        life: 420,
        color: i % 2 === 0 ? SAND : PAPER,
      });
    }
  }

  private finishItem(): void {
    const item = this.pending.shift();
    this.playing = false;
    this.beats = [];
    if (!item) return;
    if (item.outcome.result.banner) this.banner = { text: item.outcome.result.banner, until: this.clock + 1200 };
    if (item.outcome.type === "caught") {
      this.pending = [];
      this.restore();
      this.playableAt = performance.now();
      return;
    }
    if (item.outcome.type === "room") {
      this.enteredAt = this.clock;
      this.checkpoint = cloneRun(this.run);
      this.motes = [];
      this.rings = [];
      this.ghosts = [];
    }
    if (item.outcome.type === "extract") {
      const outcome = item.outcome;
      campaign.story = { ...outcome.story };
      if (this.run.mission.id === 1) campaign.unlocked = Math.max(campaign.unlocked, 2);
      persist();
      this.scene.start("result", {
        missionId: this.run.mission.id,
        rank: outcome.rank,
        headline: headline(this.run.mission.id, outcome.story),
        lines: this.run.mission.id === 2 ? epilogue(outcome.story) : [],
        turns: outcome.turns,
        caught: outcome.caught,
      });
      return;
    }
    if (this.pending.length > 0) this.begin();
  }

  private restore(): void {
    const caught = this.run.caughtCount;
    const story = { ...this.run.story };
    this.run = cloneRun(this.checkpoint);
    this.run.caughtCount = caught;
    this.run.story = story;
    this.pending = [];
    this.beats = [];
    this.playing = false;
    this.paused = false;
    this.motes = [];
    this.rings = [];
    this.ghosts = [];
    this.pebble = null;
    this.banner = null;
  }

  private hudState(): RoomState {
    return this.pending[0]?.before ?? this.run.room;
  }

  private abilityShown(state: RoomState): boolean {
    if (state.agent === "veil") return state.hasUniform;
    return state.agent === "kite" && abilityCells(state).length > 0;
  }

  private draw(): void {
    const view = this.compose();
    const ctx = this.board.getContext();
    paintBoard(ctx, view.model);
    this.board.refresh();
    const nudge = view.nudge;
    const shake = this.shake > 0 ? Math.sin(this.clock * 0.08) * 7 : 0;
    this.boardImage.setPosition(nudge.x + shake, nudge.y);
    this.drawHud(view);
    this.paintedCones = view.model.cones.map((cone) => ({
      tone: cone.tone,
      cells: cone.cells.map((cell) => ({ x: cell.x, y: cell.y })),
    }));
    this.notice = view.notice;
  }

  private compose(): { model: PaintModel; nudge: { x: number; y: number }; notice: "q" | "bang" | null } {
    const item = this.playing ? this.pending[0] : undefined;
    const beat = item ? this.beats[this.beatIndex] : undefined;
    const room = item ? item.before : this.run.room;
    const result = item?.outcome.result;
    const end = item && result ? pictured(item.before, result) : this.run.room;
    const caught = item?.outcome.type === "caught";
    let board = room;
    let player = stand(room, item?.lead ?? this.lead);
    let guardMode: "start" | "tween" | "end" = "end";
    let tween = 0;
    let notice: "q" | "bang" | null = null;
    let fade = 0;
    let flash = 0;
    this.pebble = null;

    if (beat && result && item) {
      const t = beat.elapsed / beat.ms;
      const eased = cubic(t);
      if (beat.kind === "move") {
        board = room;
        guardMode = "start";
        player = {
          ...stand(room, item.lead),
          pose: "walk",
          walkT: eased,
          face: result.face,
          fromX: result.playerFrom.x,
          fromY: result.playerFrom.y,
          toX: result.playerTo.x,
          toY: result.playerTo.y,
          hidden: false,
        };
      } else if (beat.kind === "stone") {
        board = room;
        guardMode = "start";
        const layout = layoutBoard(room.room.cols, room.room.rows);
        const from = groundPoint(layout, room.playerX, room.playerY);
        const to = groundPoint(layout, result.sound?.x ?? room.playerX, result.sound?.y ?? room.playerY);
        this.pebble = {
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased - Math.sin(eased * Math.PI) * layout.cell * 0.7,
        };
      } else if (beat.kind === "settle") {
        board = result.toggledCoat && t > 0.45 ? { ...room, disguised: !room.disguised } : room;
        player = stand(board, item.lead);
        guardMode = "start";
      } else if (beat.kind === "flash") {
        board = end;
        player = stand(end, item.lead);
        player.hidden = playerHiding(end);
        guardMode = "end";
        flash = 1 - t;
      } else if (beat.kind === "guards") {
        board = t < 0.5 ? room : end;
        player = stand(end, item.lead);
        player.hidden = playerHiding(end);
        guardMode = "tween";
        tween = eased;
      } else if (beat.kind === "notice") {
        board = end;
        player = stand(end, item.lead);
        player.hidden = false;
        guardMode = "end";
        notice = t < 0.42 ? "q" : "bang";
      } else if (beat.kind === "fade") {
        board = item.outcome.type === "room" ? room : end;
        player = stand(item.outcome.type === "room" ? end : end, item.lead);
        if (item.outcome.type === "room") {
          player = {
            ...stand(room, item.lead),
            face: result.face,
            fromX: result.playerTo.x,
            fromY: result.playerTo.y,
            toX: result.playerTo.x,
            toY: result.playerTo.y,
          };
          board = end;
        }
        player.hidden = caught ? false : playerHiding(board);
        guardMode = "end";
        fade = t;
        if (caught) notice = "bang";
      }
    }

    const catchId = caught ? result?.caught?.guardId ?? null : null;
    const actors: PaintActor[] = [player, ...this.guardActors(room, result, guardMode, tween, catchId, notice)];
    const courier = board.room.cells.find((cell) => cell.kind === "courier" && !board.taken[cellKey(cell.x, cell.y)]);
    if (courier) {
      actors.push({
        archetype: "courier",
        face: "left",
        pose: "idle",
        walkT: 0,
        fromX: courier.x,
        fromY: courier.y,
        toX: courier.x,
        toY: courier.y,
        hidden: false,
        mark: "none",
        lead: "L",
      });
    }

    const cones = this.coneLayer(board, room, Boolean(beat && (beat.kind === "guards" || beat.kind === "notice" || beat.kind === "fade" || beat.kind === "flash")));
    if (catchId && notice) {
      const catcher = (guardMode === "start" ? room : end).guards.find((guard) => guard.id === catchId);
      const nodes = catcher ? coneDrawList(end).find((cone) => cone.id === catchId)?.nodes.slice() ?? [] : [];
      if (!nodes.some((node) => node.x === end.playerX && node.y === end.playerY)) nodes.push({ x: end.playerX, y: end.playerY });
      const rest = coneDrawList(end).filter((cone) => cone.id !== catchId);
      cones.length = 0;
      for (const cone of rest) cones.push({ cells: cone.nodes, tone: cone.tone, alpha: 0.4 });
      cones.push({ cells: nodes, tone: "red", alpha: 0.55 });
    }

    if (!item) {
      const next = predict(this.run.room);
      const future = coneDrawList(next);
      const under = future.map((cone) => ({ cells: cone.nodes, tone: cone.tone, alpha: 0.16 }));
      cones.unshift(...under);
    }

    const age = (born: number, life: number) => Math.max(0, 1 - (this.clock - born) / life);
    const model: PaintModel = {
      cols: board.room.cols,
      rows: board.room.rows,
      time: this.clock / 1000,
      fade,
      flash,
      tiles: tilesOf(board),
      cones,
      ghosts: this.ghosts.map((ghost) => ({ x: ghost.x, y: ghost.y, alpha: age(ghost.born, 700) * 0.8 })).filter((ghost) => ghost.alpha > 0),
      rings: this.rings.map((ring) => ({ x: ring.x, y: ring.y, alpha: age(ring.born, 400) })).filter((ring) => ring.alpha > 0),
      actors,
      particles: this.motes
        .map((mote) => {
          const u = (this.clock - mote.born) / mote.life;
          return { x: mote.x + mote.vx * u, y: mote.y + mote.vy * u + 30 * u * u, r: 2.4, color: mote.color, a: Math.max(0, 1 - u) };
        })
        .filter((mote) => mote.a > 0),
      highlights: [],
      pebble: this.pebble ?? undefined,
    };

    let nudge = { x: 0, y: 0 };
    if (notice && catchId) {
      const layout = layoutBoard(end.room.cols, end.room.rows);
      const guard = end.guards.find((entry) => entry.id === catchId);
      if (guard) {
        const from = groundPoint(layout, end.playerX, end.playerY);
        const to = groundPoint(layout, guard.x, guard.y);
        const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
        const strength = fade > 0 ? 1 - fade : 1;
        nudge = { x: ((from.x - to.x) / len) * 12 * strength, y: ((from.y - to.y) / len) * 12 * strength };
      }
    }
    return { model, nudge, notice };
  }

  private coneLayer(
    board: RoomState,
    start: RoomState,
    later: boolean,
  ): PaintModel["cones"] {
    const source = later ? board : start;
    return coneDrawList(source).map((cone) => ({ cells: cone.nodes, tone: cone.tone, alpha: 0.62 }));
  }

  private guardActors(
    before: RoomState,
    result: TurnResult | undefined,
    mode: "start" | "tween" | "end",
    tween: number,
    catchId: string | null,
    notice: "q" | "bang" | null,
  ): PaintActor[] {
    const moves = result?.guardMoves ?? [];
    if (moves.length === 0) {
      return before.guards.map((guard) => ({
        archetype: guardArchetype(guard.kind),
        face: guard.face,
        pose: guard.id === catchId && notice ? "alert" : guard.state === "down" ? "down" : "idle",
        walkT: 0,
        fromX: guard.x,
        fromY: guard.y,
        toX: guard.x,
        toY: guard.y,
        hidden: false,
        mark: guard.id === catchId && notice ? notice : "none",
        lead: "L" as const,
      }));
    }
    return moves.map((move) => this.oneGuard(before, move, mode, tween, catchId, notice));
  }

  private oneGuard(
    before: RoomState,
    move: GuardMove,
    mode: "start" | "tween" | "end",
    tween: number,
    catchId: string | null,
    notice: "q" | "bang" | null,
  ): PaintActor {
    const kind = before.guards.find((guard) => guard.id === move.id)?.kind ?? "constable";
    const alert = move.id === catchId && notice ? "alert" : null;
    if (mode === "start") {
      return {
        archetype: guardArchetype(kind),
        face: move.fromFace,
        pose: move.fromState === "down" ? "down" : "idle",
        walkT: 0,
        fromX: move.fromX,
        fromY: move.fromY,
        toX: move.fromX,
        toY: move.fromY,
        hidden: false,
        mark: "none",
        lead: "L",
      };
    }
    if (mode === "tween" && move.pose === "walk") {
      return {
        archetype: guardArchetype(kind),
        face: move.face,
        pose: "walk",
        walkT: tween,
        fromX: move.fromX,
        fromY: move.fromY,
        toX: move.toX,
        toY: move.toY,
        hidden: false,
        mark: "none",
        lead: move.fromX + move.fromY * 3 % 2 === 0 ? "L" : "R",
      };
    }
    const face = mode === "tween" && move.pose === "scan" && tween < 0.45 ? move.fromFace : move.face;
    return {
      archetype: guardArchetype(kind),
      face,
      pose: alert ?? (move.state === "down" ? "down" : "idle"),
      walkT: 0,
      fromX: move.toX,
      fromY: move.toY,
      toX: move.toX,
      toY: move.toY,
      hidden: false,
      mark: move.id === catchId && notice ? notice : "none",
      lead: "L",
    };
  }

  private drawHud(view: { notice: "q" | "bang" | null }): void {
    const ctx = this.hud.getContext();
    ctx.clearRect(0, 0, GAME_W, GAME_H);
    const hud = Object.fromEntries(hudRects().map((entry) => [entry.id, entry.r]));
    const state = this.hudState();
    plaque(ctx, hud.portrait.x, hud.portrait.y, hud.portrait.w, hud.portrait.h);
    ctx.save();
    roundRect(ctx, hud.portrait.x + 4, hud.portrait.y + 4, 34, 32, 6);
    ctx.clip();
    paintBust(ctx, archetypeOf(state), hud.portrait.x + 21, hud.portrait.y + 18);
    ctx.restore();
    label(ctx, state.agent === "veil" ? "VEIL" : "KITE", hud.portrait.x + 46, hud.portrait.y + 20, 16, { weight: 700, color: PAPER });
    plaque(ctx, hud.objective.x, hud.objective.y, hud.objective.w, hud.objective.h);
    label(ctx, this.pill(state), hud.objective.x + 14, hud.objective.y + 20, 15, { max: hud.objective.w - 28, color: PAPER });
    plaque(ctx, hud.pause.x, hud.pause.y, hud.pause.w, hud.pause.h);
    ctx.fillStyle = GOLD;
    ctx.fillRect(hud.pause.x + 13, hud.pause.y + 12, 5, 16);
    ctx.fillRect(hud.pause.x + 22, hud.pause.y + 12, 5, 16);
    buttonFace(ctx, hud.wait.x, hud.wait.y, hud.wait.w, hud.wait.h, "Wait");
    if (this.abilityShown(state)) {
      const dim = state.agent === "kite" && state.stoneCd > 0;
      const gleam = state.agent === "kite" && state.stoneCd === 0;
      plaque(ctx, hud.ability.x, hud.ability.y, hud.ability.w, hud.ability.h, { dim, gleam });
      const word = state.agent === "veil" ? (state.disguised ? "Remove" : "Coat") : "Stone";
      label(ctx, word, hud.ability.x + hud.ability.w / 2, hud.ability.y + (state.agent === "kite" ? 16 : 23), 16, {
        align: "center",
        color: dim ? "#8a7050" : PAPER,
      });
      if (state.agent === "kite") {
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i < 3 - state.stoneCd ? "#7ee0d6" : "#3a342c";
          ctx.fillRect(hud.ability.x + 28 + i * 14, hud.ability.y + 30, 10, 6);
        }
      }
    }
    if (this.paused) {
      ctx.fillStyle = "rgba(16, 12, 14, 0.72)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      label(ctx, "Paused", 480, 100, 32, { align: "center", weight: 700 });
      for (const item of MENU) {
        const word = item.id === "mute" ? (isMuted() ? "Sound on" : "Mute") : item.label;
        buttonFace(ctx, 330, item.y, 300, 52, word);
      }
    }
    this.hud.refresh();
    void view;
  }

  private pill(state: RoomState): string {
    if (this.clock - this.enteredAt < 1200) return state.room.title;
    if (this.banner && this.clock < this.banner.until) return this.banner.text;
    return activeTeach(state)?.text ?? this.run.mission.objective;
  }

  private emit(): void {
    const state = this.hudState();
    const layout = layoutBoard(state.room.cols, state.room.rows);
    const beat = this.playing ? this.beats[this.beatIndex] : undefined;
    const playerAt = this.playing && this.pending[0] ? this.pending[0].outcome.result.playerTo : { x: state.playerX, y: state.playerY };
    const shownPlayer = beat && (beat.kind === "move" || beat.kind === "stone" || beat.kind === "settle")
      ? { x: state.playerX, y: state.playerY }
      : playerAt;
    const ground = groundPoint(layout, shownPlayer.x, shownPlayer.y);
    publish({
      scene: "play",
      room: this.pending[0]?.before.room.id ?? this.run.room.room.id,
      player: {
        x: shownPlayer.x,
        y: shownPlayer.y,
        face: state.playerFace,
        hidden: playerHiding(state),
        px: ground.x,
        py: ground.y,
      },
      guards: state.guards.map((guard) => {
        const at = groundPoint(layout, guard.x, guard.y);
        return { id: guard.id, x: guard.x, y: guard.y, face: guard.face, state: guard.state, px: at.x, py: at.y };
      }),
      cones: this.paintedCones,
      teach: activeTeach(state)?.text ?? null,
      pill: this.pill(state),
      phase: this.paused ? "paused" : beat ? beat.kind : "idle",
      muted: isMuted(),
      cues: recentCues(),
      result: null,
      notice: this.notice,
      fps: this.fps,
      playable: !this.paused && !this.playing,
      noticeAt: this.noticeAt,
      playableAt: this.playableAt,
      nodes: state.room.cells.map((cell) => {
        const rect = cellRect(layout, cell.x, cell.y);
        return { x: cell.x, y: cell.y, px: rect.x + rect.w / 2, py: rect.y + rect.h / 2 };
      }),
      queue: this.pending.length,
      text: this.pill(state),
      walkT: null,
    });
  }
}

function script(item: Pending): Beat[] {
  const result = item.outcome.result;
  const caught = item.outcome.type === "caught";
  const beats: Beat[] = [];
  const moved = result.playerFrom.x !== result.playerTo.x || result.playerFrom.y !== result.playerTo.y;
  if (result.sound) beats.push({ kind: "stone", ms: 200, elapsed: 0 });
  else if (moved) beats.push({ kind: "move", ms: caught ? 160 : 220, elapsed: 0 });
  else beats.push({ kind: "settle", ms: result.toggledCoat ? 150 : 90, elapsed: 0 });
  if (result.subdued) beats.push({ kind: "flash", ms: 80, elapsed: 0 });
  if (result.guardMoves.length > 0) beats.push({ kind: "guards", ms: caught ? 120 : 170, elapsed: 0 });
  if (caught) {
    beats.push({ kind: "notice", ms: 230, elapsed: 0 });
    beats.push({ kind: "fade", ms: 80, elapsed: 0 });
  } else if (item.outcome.type === "room" || item.outcome.type === "extract") {
    beats.push({ kind: "fade", ms: 150, elapsed: 0 });
  }
  return beats;
}
