import Phaser from "phaser";
import {
  actorSheet,
  bakeMap,
  FRAME_H,
  FRAME_W,
  makeArrow,
  makeBell,
  makeBox,
  makeCrate,
  makeDust,
  makeFlag,
  makeGate,
  makeGrate,
  makeHeart,
  makeLantern,
  makeLeaflet,
  makeMark,
  makePebble,
  makePillar,
  makePot,
  makeShadow,
  makeSign,
  makeSpark,
  makeStall,
  portrait,
  SHEET_COLS,
  type Facing,
  type Kind,
} from "./art";
import { wrap } from "./font";
import {
  BELL,
  CRATE,
  GATE,
  GRATE,
  GRID,
  GUARD_NODES,
  LANTERNS,
  LEAF,
  MAP_H,
  MAP_W,
  blockedTile,
  PILLARS,
  PLATE,
  POTS,
  SIGN,
  SPAWN,
  TILE,
  validateMap,
} from "./map";
import { astar, nearestOpen } from "./path";
import { paintCanvas, Pix } from "./pix";
import { Sfx, sfxEver, sfxLog } from "./sfx";

const WIRE =
  "WIRE: Courtyard's watched. Switch spies — Kite's pebble, Veil's disguise, Key's picks. Get the leaflet and get out.";

type Spy = "kite" | "veil" | "key";
type GState = "patrol" | "sus" | "chase" | "stun" | "bell";
type Then = "bell" | "guard" | "gate" | "leaf" | "push";
type Order =
  | { kind: "path"; pts: { x: number; y: number }[]; i: number; then?: Then; psx?: number; psy?: number }
  | { kind: "steer"; x: number; y: number };

const SPEED = 32;
const PATROL = 22;
const CHASE = 28;

function upload(scene: Phaser.Scene, key: string, pix: Pix): void {
  const canvas = document.createElement("canvas");
  canvas.width = pix.w;
  canvas.height = pix.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  paintCanvas(pix, ctx);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function sliceSheet(scene: Phaser.Scene, kind: Kind, sheet: Pix): void {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SHEET_COLS; c++) {
      const frame = new Pix(FRAME_W, FRAME_H);
      for (let y = 0; y < FRAME_H; y++) {
        for (let x = 0; x < FRAME_W; x++) frame.force(x, y, sheet.get(c * FRAME_W + x, r * FRAME_H + y));
      }
      upload(scene, `${kind}-${r}-${c}`, frame);
    }
  }
}

export class Yard extends Phaser.Scene {
  private sfx = new Sfx();
  private px = SPAWN.x * TILE + 8;
  private py = SPAWN.y * TILE + 12;
  private facing: Facing = "right";
  private who: Spy = "kite";
  private disguise = false;
  private disguiseT = 0;
  private hearts = 3;
  private invuln = 0;
  private dying = false;
  private talking = true;
  private itemUp = false;
  private leafletGot = false;
  private grateOpen = false;
  private gateOpen = false;
  private leafFlash = 0;
  private flicker = 0;
  private flickerT = 0;
  private lock: { kind: string; t: number; dur: number; on?: boolean; target?: "bell" | "guard" } | null = null;
  private order: Order | null = null;
  private stepAcc = 0;
  private walkFrame = 0;
  private breathT = 0;
  private breath = 0;
  private moved = 0;
  private pushCd = 0;
  private crateTx = CRATE.x;
  private crateTy = CRATE.y;
  private gx = GUARD_NODES[0].x * TILE + 8;
  private gy = GUARD_NODES[0].y * TILE + 12;
  private gFacing: Facing = "right";
  private gState: GState = "patrol";
  private gTimer = 0;
  private gNode = 0;
  private gIdle = 0;
  private gLost = 0;
  private gSit = false;
  private gStep = 0;
  private gWalk = 0;
  private heard = false;
  private pebble: { sx: number; sy: number; tx: number; ty: number; t: number; hit: "bell" | "guard" } | null = null;
  private pebbleShot = false;
  private knelt = false;
  private freezeUntil = 0;
  private shakes: number[] = [];
  private pid = -1;
  private downX = 0;
  private downY = 0;
  private dragged = false;
  private pending: Then | null = null;
  private dismissTalk = false;
  private dismissItem = false;
  private lastTap = { x: 0, y: 0 };
  private bellT = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private player!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Image;
  private guard!: Phaser.GameObjects.Image;
  private gShadow!: Phaser.GameObjects.Image;
  private mark!: Phaser.GameObjects.Image;
  private crate!: Phaser.GameObjects.Image;
  private grate!: Phaser.GameObjects.Image;
  private gate!: Phaser.GameObjects.Image;
  private leaf!: Phaser.GameObjects.Image;
  private bell!: Phaser.GameObjects.Image;
  private pebbleImg!: Phaser.GameObjects.Image;
  private cone!: Phaser.GameObjects.Graphics;
  private flash!: Phaser.GameObjects.Image;
  private fade!: Phaser.GameObjects.Image;
  private wireBox!: Phaser.GameObjects.Image;
  private itemBox!: Phaser.GameObjects.Image;
  private arrow!: Phaser.GameObjects.Image;
  private heartsImg: Phaser.GameObjects.Image[] = [];
  private ports: { id: Spy; img: Phaser.GameObjects.Image }[] = [];
  private sel!: Phaser.GameObjects.Image;
  private lanterns: Phaser.GameObjects.Image[] = [];
  private flag!: Phaser.GameObjects.Image;

  constructor() {
    super("yard");
  }

  create(): void {
    const problems = validateMap();
    if (problems.length) throw new Error(problems.join("; "));

    for (const kind of ["kite", "veil", "veil2", "key", "guard"] as const) sliceSheet(this, kind, actorSheet(kind));
    upload(this, "map", bakeMap(GRID));
    upload(this, "shadow", makeShadow());
    upload(this, "dust", makeDust());
    upload(this, "pebble", makePebble());
    upload(this, "spark", makeSpark());
    upload(this, "heart", makeHeart(true));
    upload(this, "heart-empty", makeHeart(false));
    upload(this, "qmark", makeMark("?"));
    upload(this, "bang", makeMark("!"));
    upload(this, "crate", makeCrate());
    upload(this, "grate", makeGrate(false));
    upload(this, "gate", makeGate());
    upload(this, "bell0", makeBell(0));
    upload(this, "bell1", makeBell(1));
    upload(this, "leaf0", makeLeaflet(0));
    upload(this, "leaf1", makeLeaflet(1));
    upload(this, "lantern0", makeLantern(0));
    upload(this, "lantern1", makeLantern(1));
    upload(this, "flag0", makeFlag(0));
    upload(this, "flag1", makeFlag(1));
    upload(this, "pot", makePot());
    upload(this, "pillar", makePillar());
    upload(this, "stall", makeStall());
    upload(this, "sign", makeSign());
    upload(this, "arrow", makeArrow());
    for (const id of ["kite", "veil", "key", "guard", "wire"]) upload(this, `port-${id}`, portrait(id));
    const sel = new Pix(18, 18);
    for (let i = 0; i < 18; i++) {
      sel.force(i, 0, 13);
      sel.force(i, 17, 13);
      sel.force(0, i, 13);
      sel.force(17, i, 13);
    }
    upload(this, "sel", sel);
    const px = new Pix(1, 1);
    px.force(0, 0, 31);
    upload(this, "px", px);

    this.add.image(0, 0, "map").setOrigin(0, 0).setDepth(0);
    this.cone = this.add.graphics().setDepth(1);

    this.add.image(TILE, 8 * TILE - 16, "stall").setOrigin(0, 0).setDepth(11 * TILE);
    for (const p of PILLARS) {
      this.add.image(p.x * TILE + 8, p.y * TILE + TILE, "pillar").setOrigin(0.5, 1).setDepth(p.y * TILE + TILE);
    }
    for (const p of POTS) {
      this.add.image(p.x * TILE + 8, p.y * TILE + TILE, "pot").setOrigin(0.5, 1).setDepth(p.y * TILE + TILE);
    }
    for (const p of LANTERNS) {
      this.lanterns.push(
        this.add.image(p.x * TILE + 8, p.y * TILE, "lantern0").setOrigin(0.5, 0).setDepth(p.y * TILE + 20),
      );
    }
    this.flag = this.add.image(15 * TILE + 4, 2 * TILE, "flag0").setOrigin(0, 0).setDepth(2 * TILE + 20);
    this.bell = this.add.image(BELL.x * TILE + 8, BELL.y * TILE + 2, "bell0").setOrigin(0.5, 0).setDepth(BELL.y * TILE + 24);
    this.crate = this.add.image(this.crateTx * TILE, this.crateTy * TILE, "crate").setOrigin(0, 0);
    this.grate = this.add.image(GRATE.x * TILE, GRATE.y * TILE + TILE, "grate").setOrigin(0, 1);
    this.gate = this.add.image(GATE.x * TILE, GATE.y * TILE + TILE, "gate").setOrigin(0, 1);
    this.leaf = this.add.image(LEAF.x * TILE + 8, LEAF.y * TILE + 8, "leaf0").setOrigin(0.5, 0.5);
    this.add.image(43 * TILE, SIGN.y * TILE + 8, "sign").setOrigin(1, 0.5).setDepth(4);

    this.shadow = this.add.image(this.px, this.py, "shadow").setOrigin(0.5, 0.5).setAlpha(0.45);
    this.gShadow = this.add.image(this.gx, this.gy, "shadow").setOrigin(0.5, 0.5).setAlpha(0.45);
    this.player = this.add.image(this.px, this.py, "kite-2-4").setOrigin(0.5, 1);
    this.guard = this.add.image(this.gx, this.gy, "guard-2-4").setOrigin(0.5, 1);
    this.mark = this.add.image(this.gx, this.gy - 26, "qmark").setOrigin(0.5, 1).setVisible(false);
    this.pebbleImg = this.add.image(0, 0, "pebble").setVisible(false).setDepth(2000);

    this.flash = this.add.image(160, 90, "px").setDisplaySize(320, 180).setTint(0xa83838).setAlpha(0).setScrollFactor(0).setDepth(8000);
    this.fade = this.add.image(160, 90, "px").setDisplaySize(320, 180).setTint(0x1a1210).setAlpha(0).setScrollFactor(0).setDepth(9000);

    const wire = makeBox({ lines: wrap(WIRE, 258), portrait: portrait("wire") });
    upload(this, "wirebox", wire);
    this.wireBox = this.add.image(4, 180 - wire.h - 4, "wirebox").setOrigin(0, 0).setScrollFactor(0).setDepth(7000);
    this.arrow = this.add.image(300, 172, "arrow").setScrollFactor(0).setDepth(7100);

    const item = makeBox({ title: "ITEM GET", lines: ["Coded leaflet"], icon: makeLeaflet(0) });
    upload(this, "itembox", item);
    this.itemBox = this.add.image(160, 78, "itembox").setScrollFactor(0).setDepth(7200).setVisible(false);

    for (let i = 0; i < 3; i++) {
      this.heartsImg.push(
        this.add.image(8 + i * 12, 6, "heart").setOrigin(0, 0).setScrollFactor(0).setDepth(6000),
      );
    }
    this.sel = this.add.image(0, 0, "sel").setOrigin(0, 0).setDisplaySize(36, 36).setScrollFactor(0).setDepth(6000);
    (["kite", "veil", "key"] as const).forEach((id, i) => {
      const img = this.add.image(284, 34 + i * 38, `port-${id}`).setOrigin(0, 0).setDisplaySize(32, 32).setScrollFactor(0).setDepth(6100);
      this.ports.push({ id, img });
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.roundPixels = true;
    cam.scrollX = 0;
    cam.scrollY = 0;

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = {
        ...kb.addKeys("W,A,S,D"),
        ...kb.createCursorKeys(),
      } as Record<string, Phaser.Input.Keyboard.Key>;
    }

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onUp(p));

    this.publish();
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.pid !== -1) return;
    this.pid = p.id;
    this.downX = p.x;
    this.downY = p.y;
    this.lastTap = { x: Math.round(p.x), y: Math.round(p.y) };
    this.dragged = false;
    this.pending = null;
    this.dismissTalk = false;
    this.dismissItem = false;
    this.sfx.unlock();
    if (this.talking) {
      this.dismissTalk = true;
      return;
    }
    if (this.itemUp) {
      this.dismissItem = true;
      return;
    }
    if (this.dying || this.lock) return;
    const port = this.portAt(p.x, p.y);
    if (port) {
      this.switchTo(port);
      return;
    }
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const hit = this.hitWorld(w.x, w.y);
    if (hit) {
      this.pending = hit;
      return;
    }
    this.order = this.pathTo(w.x, w.y);
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pid || this.talking || this.itemUp || this.dying || this.lock) return;
    if (Math.hypot(p.x - this.downX, p.y - this.downY) < 8) return;
    this.dragged = true;
    this.pending = null;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    this.order = { kind: "steer", x: w.x, y: w.y };
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pid) return;
    this.pid = -1;
    if (this.dismissTalk && this.talking) {
      this.talking = false;
      this.wireBox.setVisible(false);
      this.arrow.setVisible(false);
      this.sfx.startMusic();
      return;
    }
    if (this.dismissItem && this.itemUp) {
      this.itemUp = false;
      this.itemBox.setVisible(false);
      return;
    }
    if (this.pending && !this.dragged) {
      this.beginInteract(this.pending);
      this.pending = null;
      return;
    }
    if (this.order?.kind === "steer") this.order = null;
  }

  private portAt(x: number, y: number): Spy | null {
    for (const port of this.ports) {
      if (x >= port.img.x && y >= port.img.y && x < port.img.x + 32 && y < port.img.y + 32) return port.id;
    }
    return null;
  }

  private switchTo(id: Spy): void {
    if (this.lock) return;
    if (id === this.who) {
      if (id === "veil") this.toggleVeil();
      return;
    }
    this.who = id;
    this.disguise = false;
    this.disguiseT = 0;
    this.flicker = 6;
    this.flickerT = 0;
    this.player.clearTint();
  }

  private toggleVeil(): void {
    if (this.lock) return;
    const on = !this.disguise;
    this.sfx.rustle(on);
    this.lock = { kind: "cloak", t: 0, dur: 420, on };
    this.order = null;
  }

  private hitWorld(x: number, y: number): Then | null {
    if (Math.hypot(x - this.gx, y - (this.gy - 12)) < 22) return "guard";
    const bell = { x: BELL.x * TILE + 8, y: BELL.y * TILE + 12 };
    if (Math.hypot(x - bell.x, y - bell.y) < 18) return "bell";
    if (!this.leafletGot && Math.hypot(x - (LEAF.x * TILE + 8), y - (LEAF.y * TILE + 8)) < 16) return "leaf";
    if (!this.gateOpen && this.inTile(x, y, GATE.x, GATE.y, 8)) return "gate";
    if (this.inTile(x, y, this.crateTx, this.crateTy, 6)) return "push";
    return null;
  }

  private inTile(x: number, y: number, tx: number, ty: number, pad: number): boolean {
    return x >= tx * TILE - pad && y >= ty * TILE - pad && x < (tx + 1) * TILE + pad && y < (ty + 1) * TILE + pad;
  }

  private beginInteract(kind: Then): void {
    if (kind === "guard") {
      const d = Math.hypot(this.px - this.gx, this.py - this.gy);
      if (d < 22) {
        this.jab();
        return;
      }
      if (this.who === "kite" && d < 150) {
        this.throwAt("guard");
        return;
      }
      this.order = this.pathTo(this.gx, this.gy, "guard");
      return;
    }
    if (kind === "bell") {
      const bx = BELL.x * TILE + 8;
      const by = BELL.y * TILE + 16;
      if (this.who === "kite" && Math.hypot(this.px - bx, this.py - by) < 160) {
        this.throwAt("bell");
        return;
      }
      this.order = this.pathTo(bx, by + 20, "bell");
      return;
    }
    if (kind === "gate") {
      if (this.adjacent(GATE.x, GATE.y)) this.useGate();
      else this.order = this.pathTo(GATE.x * TILE + 8, GATE.y * TILE + 12, "gate");
      return;
    }
    if (kind === "leaf") {
      if (!this.grateOpen) {
        this.order = this.pathTo(GRATE.x * TILE - 8, GRATE.y * TILE + 12);
        return;
      }
      if (this.adjacent(LEAF.x, LEAF.y)) this.pickup();
      else this.order = this.pathTo(LEAF.x * TILE + 8, LEAF.y * TILE + 12, "leaf");
      return;
    }
    if (kind === "push") {
      const dx = Math.sign(this.crateTx * TILE + 8 - this.px) || 1;
      const dy = Math.sign(this.crateTy * TILE + 12 - this.py);
      const sx = Math.abs(this.crateTx * TILE + 8 - this.px) >= Math.abs(this.crateTy * TILE + 12 - this.py) ? dx : 0;
      const sy = sx === 0 ? (dy || 1) : 0;
      if (this.adjacent(this.crateTx, this.crateTy)) this.tryPush(sx, sy);
      else this.order = this.pathTo(this.crateTx * TILE + 8 - sx * 14, this.crateTy * TILE + 12 - sy * 14, "push", sx, sy);
    }
  }

  private pathTo(x: number, y: number, then?: Then, psx = 0, psy = 0): Order | null {
    let tx = Math.floor(x / TILE);
    let ty = Math.floor(y / TILE);
    const solid = (cx: number, cy: number) => this.tileSolid(cx, cy);
    const goal = nearestOpen(MAP_W, MAP_H, solid, tx, ty);
    if (!goal) return { kind: "steer", x, y };
    tx = goal.x;
    ty = goal.y;
    const start = this.tileOf(this.px, this.py);
    const tiles = astar(MAP_W, MAP_H, solid, start.x, start.y, tx, ty);
    if (!tiles || tiles.length === 0) {
      if (then) return { kind: "path", pts: [], i: 0, then, psx, psy };
      return { kind: "steer", x, y };
    }
    return {
      kind: "path",
      pts: tiles.map((t) => ({ x: t.x * TILE + 8, y: t.y * TILE + 12 })),
      i: 0,
      then,
      psx,
      psy,
    };
  }

  private arrive(then?: Then, psx = 0, psy = 0): void {
    if (then === "bell" && this.who === "kite") this.throwAt("bell");
    else if (then === "guard") this.beginInteract("guard");
    else if (then === "gate") this.useGate();
    else if (then === "leaf") this.beginInteract("leaf");
    else if (then === "push") this.tryPush(psx, psy);
  }

  private throwAt(target: "bell" | "guard"): void {
    if (this.who !== "kite" || this.lock) return;
    const tx = target === "bell" ? BELL.x * TILE + 8 : this.gx;
    const ty = target === "bell" ? BELL.y * TILE + 8 : this.gy - 10;
    this.facing = this.faceOf(tx - this.px, ty - this.py);
    this.lock = { kind: "throw", t: 0, dur: 440, target };
    this.pebbleShot = false;
    this.order = null;
  }

  private jab(): void {
    if (this.lock) return;
    this.facing = this.faceOf(this.gx - this.px, this.gy - this.py);
    this.lock = { kind: "jab", t: 0, dur: 180 };
    this.order = null;
    this.sfx.thud();
    this.stunGuard(700, false);
    const dx = this.gx - this.px;
    const dy = this.gy - this.py;
    const m = Math.hypot(dx, dy) || 1;
    this.gx = Phaser.Math.Clamp(this.gx + (dx / m) * 6, 16, MAP_W * TILE - 16);
    this.gy = Phaser.Math.Clamp(this.gy + (dy / m) * 6, 28, MAP_H * TILE - 8);
    this.burst(this.gx, this.gy - 12, 4);
  }

  private useGate(): void {
    if (this.gateOpen) return;
    if (!this.adjacent(GATE.x, GATE.y)) return;
    if (this.who !== "key") {
      this.sfx.rattle();
      return;
    }
    if (this.lock) return;
    this.facing = "right";
    this.lock = { kind: "kneel", t: 0, dur: 680 };
    this.knelt = false;
    this.order = null;
  }

  private pickup(): void {
    if (this.leafletGot || !this.grateOpen || this.leafFlash > 0) return;
    if (!this.adjacent(LEAF.x, LEAF.y)) return;
    this.leafFlash = 2;
    this.order = null;
  }

  private finishPickup(): void {
    this.leafletGot = true;
    this.leaf.setVisible(false);
    this.itemUp = true;
    this.itemBox.setVisible(true);
    this.sfx.jingle();
  }

  private pressPlate(): void {
    if (this.grateOpen) return;
    this.grateOpen = true;
    this.sfx.rumble();
    this.shake(2, 220);
    this.tweens.add({ targets: this.grate, y: this.grate.y - TILE, duration: 280 });
  }

  private stunGuard(ms: number, sit: boolean): void {
    this.gState = "stun";
    this.gTimer = ms;
    this.gSit = sit;
    this.gIdle = 0;
  }

  private tileOf(x: number, foot: number): { x: number; y: number } {
    return { x: Math.floor(x / TILE), y: Math.floor((foot - 1) / TILE) };
  }

  private tileSolid(tx: number, ty: number): boolean {
    if (blockedTile(tx, ty, this.grateOpen, this.gateOpen)) return true;
    if (tx === this.crateTx && ty === this.crateTy) return true;
    return false;
  }

  private adjacent(tx: number, ty: number): boolean {
    const t = this.tileOf(this.px, this.py);
    return Math.max(Math.abs(t.x - tx), Math.abs(t.y - ty)) <= 1;
  }

  private hits(cx: number, foot: number): boolean {
    const l = cx - 5;
    const r = cx + 5;
    const t = foot - 6;
    const b = foot;
    const x0 = Math.floor(l / TILE);
    const x1 = Math.floor((r - 0.01) / TILE);
    const y0 = Math.floor(t / TILE);
    const y1 = Math.floor((b - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) if (this.tileSolid(tx, ty)) return true;
    }
    if (!this.disguise && this.gState !== "chase" && this.gState !== "stun" && this.gState !== "bell") {
      if (Math.hypot(cx - this.gx, foot - this.gy) < 9) return true;
    }
    return false;
  }

  private overlapsCrate(cx: number, foot: number): boolean {
    const l = cx - 5;
    const r = cx + 5;
    const t = foot - 6;
    const b = foot;
    const cl = this.crateTx * TILE;
    const ct = this.crateTy * TILE;
    return l < cl + TILE && r > cl && t < ct + TILE && b > ct;
  }

  private tryPush(sx: number, sy: number): boolean {
    if (this.pushCd > 0 || (sx === 0 && sy === 0)) return false;
    if (this.crateTx === PLATE.x && this.crateTy === PLATE.y) return false;
    const destX = this.crateTx + sx;
    const destY = this.crateTy + sy;
    if (blockedTile(destX, destY, this.grateOpen, this.gateOpen)) return false;
    const gt = this.tileOf(this.gx, this.gy);
    if (destX === gt.x && destY === gt.y) {
      this.heard = true;
      return false;
    }
    this.crateTx = destX;
    this.crateTy = destY;
    this.pushCd = 160;
    this.tweens.killTweensOf(this.crate);
    const cx = destX * TILE;
    const cy = destY * TILE;
    this.tweens.add({
      targets: this.crate,
      x: cx,
      y: cy,
      duration: 90,
      onComplete: () => this.crate.setPosition(this.crateTx * TILE, this.crateTy * TILE),
    });
    if (Math.max(Math.abs(destX - gt.x), Math.abs(destY - gt.y)) <= 1) this.heard = true;
    if (destX === PLATE.x && destY === PLATE.y) this.pressPlate();
    return true;
  }

  private moveBy(dx: number, dy: number): number {
    const ox = this.px;
    const oy = this.py;
    const firstX = Math.abs(dx) >= Math.abs(dy);
    this.step(firstX ? dx : 0, firstX ? 0 : dy);
    this.step(firstX ? 0 : dx, firstX ? dy : 0);
    const moved = Math.hypot(this.px - ox, this.py - oy);
    if (moved > 0.15) this.facing = this.faceOf(this.px - ox, this.py - oy);
    return moved;
  }

  private step(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const nx = this.px + dx;
    const ny = this.py + dy;
    if (!this.hits(nx, ny)) {
      this.px += dx;
      this.py += dy;
      return;
    }
    if (dx !== 0 && this.overlapsCrate(nx, this.py) && this.tryPush(Math.sign(dx), 0)) {
      this.px += dx;
      return;
    }
    if (dy !== 0 && this.overlapsCrate(this.px, ny) && this.tryPush(0, Math.sign(dy))) this.py += dy;
  }

  private faceOf(dx: number, dy: number): Facing {
    if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? "right" : "left";
    return dy >= 0 ? "down" : "up";
  }

  private clampPlayer(): void {
    this.px = Phaser.Math.Clamp(this.px, 10, MAP_W * TILE - 10);
    this.py = Phaser.Math.Clamp(this.py, 26, MAP_H * TILE - 4);
  }

  private updateCamera(): void {
    const cam = this.cameras.main;
    const destX = Phaser.Math.Clamp(this.px - 160, 0, MAP_W * TILE - 320);
    const destY = Phaser.Math.Clamp(this.py - 100, 0, MAP_H * TILE - 180);
    cam.scrollX += (destX - cam.scrollX) * 0.15;
    cam.scrollY += (destY - cam.scrollY) * 0.15;
    const left = this.px - 8;
    const right = this.px + 8;
    const top = this.py - 24;
    const bot = this.py + 1;
    if (left < cam.scrollX) cam.scrollX = left;
    if (right > cam.scrollX + 320) cam.scrollX = right - 320;
    if (top < cam.scrollY) cam.scrollY = top;
    if (bot > cam.scrollY + 180) cam.scrollY = bot - 180;
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, MAP_W * TILE - 320);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, MAP_H * TILE - 180);
  }

  private keyVector(): { x: number; y: number } | null {
    if (!this.keys) return null;
    let x = 0;
    let y = 0;
    if (this.keys.A?.isDown || this.keys.left?.isDown) x -= 1;
    if (this.keys.D?.isDown || this.keys.right?.isDown) x += 1;
    if (this.keys.W?.isDown || this.keys.up?.isDown) y -= 1;
    if (this.keys.S?.isDown || this.keys.down?.isDown) y += 1;
    if (x === 0 && y === 0) return null;
    const m = Math.hypot(x, y);
    return { x: x / m, y: y / m };
  }

  private seesPlayer(): boolean {
    if (this.disguise || this.gState === "stun" || this.gState === "bell") return false;
    let fx = 0;
    let fy = 0;
    if (this.gFacing === "right") fx = 1;
    else if (this.gFacing === "left") fx = -1;
    else if (this.gFacing === "down") fy = 1;
    else fy = -1;
    const dx = this.px - this.gx;
    const dy = this.py - this.gy;
    const along = dx * fx + dy * fy;
    const side = dx * -fy + dy * fx;
    if (along < 6 || along > 64) return false;
    const half = 6 + 18 * (along / 64);
    if (Math.abs(side) > half) return false;
    const steps = Math.max(1, Math.ceil(along / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = this.gx + dx * t;
      const y = this.gy + dy * t;
      if (this.tileSolid(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
    }
    return true;
  }

  private threatened(): boolean {
    if (this.heard) return true;
    if (this.disguise || this.gState === "stun" || this.gState === "bell") return false;
    if (this.seesPlayer()) return true;
    const a = this.tileOf(this.px, this.py);
    const g = this.tileOf(this.gx, this.gy);
    const near = Math.max(Math.abs(a.x - g.x), Math.abs(a.y - g.y)) <= 1;
    return near && this.moved > 0.35;
  }

  private updateGuard(dt: number): void {
    const threat = this.threatened();
    if (this.gState === "patrol") {
      if (threat) this.enterSus();
      else this.patrol(dt);
    } else if (this.gState === "sus") {
      this.gTimer -= dt;
      this.gFacePoint(this.px, this.py);
      if (this.gTimer <= 0) {
        if (this.threatened()) this.enterChase();
        else this.gState = "patrol";
      }
    } else if (this.gState === "chase") {
      if (!this.seesPlayer() && Math.hypot(this.px - this.gx, this.py - this.gy) > 96) this.gLost += dt;
      else this.gLost = 0;
      if (this.gLost > 2000) {
        this.gState = "patrol";
        this.gLost = 0;
      } else {
        this.chase(dt);
        if (this.invuln <= 0 && Math.hypot(this.px - this.gx, this.py - this.gy) < 11) this.catchPlayer();
      }
    } else if (this.gState === "stun" || this.gState === "bell") {
      this.gTimer -= dt;
      if (this.gState === "bell") this.gFacePoint(BELL.x * TILE + 8, BELL.y * TILE);
      if (this.gTimer <= 0) {
        this.gState = "patrol";
        this.gSit = false;
      }
    }
    this.heard = false;
  }

  private enterSus(): void {
    this.gState = "sus";
    this.gTimer = 1200;
    this.gIdle = 0;
    this.sfx.question();
    this.gFacePoint(this.px, this.py);
  }

  private enterChase(): void {
    this.gState = "chase";
    this.gLost = 0;
    this.gSit = false;
    this.sfx.alarm();
    this.shake(3, 200);
  }

  private patrol(dt: number): void {
    if (this.gIdle > 0) {
      this.gIdle -= dt;
      return;
    }
    const node = GUARD_NODES[this.gNode];
    const tx = node.x * TILE + 8;
    const ty = node.y * TILE + 12;
    const dx = tx - this.gx;
    const dy = ty - this.gy;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.gx = tx;
      this.gy = ty;
      this.gNode = (this.gNode + 1) % GUARD_NODES.length;
      this.gIdle = 1000;
      return;
    }
    this.stepGuard((dx / dist) * PATROL * dt / 1000, (dy / dist) * PATROL * dt / 1000);
  }

  private chase(dt: number): void {
    const dx = this.px - this.gx;
    const dy = this.py - this.gy;
    const dist = Math.hypot(dx, dy) || 1;
    this.stepGuard((dx / dist) * CHASE * dt / 1000, (dy / dist) * CHASE * dt / 1000);
  }

  private stepGuard(dx: number, dy: number): void {
    const ox = this.gx;
    const oy = this.gy;
    const tryAt = (nx: number, ny: number) => {
      const l = nx - 5;
      const r = nx + 5;
      const t = ny - 6;
      const b = ny;
      const x0 = Math.floor(l / TILE);
      const x1 = Math.floor((r - 0.01) / TILE);
      const y0 = Math.floor(t / TILE);
      const y1 = Math.floor((b - 0.01) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.tileSolid(tx, ty)) return false;
      return true;
    };
    if (tryAt(this.gx + dx, this.gy)) this.gx += dx;
    if (tryAt(this.gx, this.gy + dy)) this.gy += dy;
    this.gx = Phaser.Math.Clamp(this.gx, 16, MAP_W * TILE - 16);
    this.gy = Phaser.Math.Clamp(this.gy, 28, MAP_H * TILE - 8);
    const mx = this.gx - ox;
    const my = this.gy - oy;
    const moved = Math.hypot(mx, my);
    if (moved > 0.15) this.gFacing = this.faceOf(mx, my);
    this.gStep += moved;
    if (this.gStep >= 4) {
      this.gStep -= 4;
      this.gWalk = (this.gWalk + 1) % 4;
      if (this.gWalk === 0 || this.gWalk === 2) this.puff(this.gx, this.gy);
    }
  }

  private gFacePoint(x: number, y: number): void {
    this.gFacing = this.faceOf(x - this.gx, y - this.gy);
  }

  private catchPlayer(): void {
    this.hearts = Math.max(0, this.hearts - 1);
    this.invuln = 1000;
    this.sfx.thud();
    this.sfx.alarm();
    this.shake(4, 220);
    this.flash.setAlpha(0.45);
    const dx = this.px - this.gx;
    const dy = this.py - this.gy;
    const m = Math.hypot(dx, dy) || 1;
    this.px += (dx / m) * 14;
    this.py += (dy / m) * 10;
    this.clampPlayer();
    this.order = null;
    if (this.hearts <= 0) this.dying = true;
  }

  private respawn(): void {
    this.px = SPAWN.x * TILE + 8;
    this.py = SPAWN.y * TILE + 12;
    this.facing = "right";
    this.hearts = 3;
    this.invuln = 800;
    this.dying = false;
    this.disguise = false;
    this.disguiseT = 0;
    this.order = null;
    this.lock = null;
    this.pebble = null;
    this.pebbleImg.setVisible(false);
    this.crateTx = CRATE.x;
    this.crateTy = CRATE.y;
    this.crate.setPosition(CRATE.x * TILE, CRATE.y * TILE);
    this.grateOpen = false;
    this.grate.setPosition(GRATE.x * TILE, GRATE.y * TILE + TILE);
    this.gx = GUARD_NODES[0].x * TILE + 8;
    this.gy = GUARD_NODES[0].y * TILE + 12;
    this.gState = "patrol";
    this.gNode = 0;
    this.gIdle = 0;
    this.gTimer = 0;
    this.gSit = false;
    this.gFacing = "right";
    this.who = "kite";
  }

  private shake(px: number, ms: number): void {
    this.cameras.main.shake(ms, px / 320);
    this.shakes.push(px);
  }

  private burst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, "spark").setDepth(4000);
      const a = (Math.PI * 2 * i) / n;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(a) * 12,
        y: y + Math.sin(a) * 10,
        alpha: 0,
        duration: 240,
        onComplete: () => s.destroy(),
      });
    }
  }

  private puff(x: number, y: number): void {
    for (const dx of [-3, 2]) {
      const s = this.add.image(x + dx, y - 1, "dust").setDepth(y);
      this.tweens.add({
        targets: s,
        y: y - 3,
        alpha: 0,
        duration: 180,
        onComplete: () => s.destroy(),
      });
    }
  }

  private landPebble(): void {
    if (!this.pebble) return;
    const hit = this.pebble.hit;
    this.pebble = null;
    this.pebbleImg.setVisible(false);
    this.sfx.clink();
    if (hit === "bell") {
      this.gState = "bell";
      this.gTimer = 3000;
      this.gSit = false;
      this.gFacePoint(BELL.x * TILE + 8, BELL.y * TILE);
      this.bellT = 700;
      this.burst(BELL.x * TILE + 8, BELL.y * TILE + 10, 3);
      return;
    }
    if (Math.hypot(this.gx - this.pebbleWasX, this.gy - this.pebbleWasY) < 30) {
      this.hitstop();
      this.stunGuard(2000, true);
      this.burst(this.gx, this.gy - 18, 5);
    }
  }

  private pebbleWasX = 0;
  private pebbleWasY = 0;
  private hitstop(): void {
    this.freezeUntil = performance.now() + 50;
  }

  private spawnPebble(hit: "bell" | "guard"): void {
    const hand = this.hand();
    const tx = hit === "bell" ? BELL.x * TILE + 8 : this.gx;
    const ty = hit === "bell" ? BELL.y * TILE + 8 : this.gy - 8;
    this.pebble = { sx: hand.x, sy: hand.y, tx, ty, t: 0, hit };
    this.pebbleWasX = tx;
    this.pebbleWasY = ty;
    this.sfx.whoosh();
    this.pebbleShot = true;
  }

  private hand(): { x: number; y: number } {
    const dir = this.facing === "left" ? -1 : 1;
    if (this.facing === "up") return { x: this.px, y: this.py - 22 };
    if (this.facing === "down") return { x: this.px + 4, y: this.py - 16 };
    return { x: this.px + dir * 8, y: this.py - 14 };
  }

  private applyActor(
    img: Phaser.GameObjects.Image,
    kind: Kind,
    facing: Facing,
    col: number,
    x: number,
    y: number,
  ): void {
    const row = facing === "down" ? 0 : facing === "up" ? 1 : 2;
    img.setTexture(`${kind}-${row}-${col}`);
    img.setFlipX(facing === "left");
    img.setPosition(Math.round(x), Math.round(y));
    img.setDepth(y);
  }

  private playerCol(): number {
    if (this.lock) {
      if (this.lock.kind === "jab") return 10;
      const f = Math.min(3, Math.floor((this.lock.t / this.lock.dur) * 4));
      if (this.lock.kind === "cloak" && this.lock.on === false) return 9 - f;
      return 6 + f;
    }
    if (this.moved > 0.15) return this.walkFrame;
    return 4 + this.breath;
  }

  private guardCol(): number {
    if (this.gState === "stun" && this.gSit) return 11;
    if (this.gState === "sus" || this.gState === "bell" || (this.gState === "stun" && !this.gSit)) return 8;
    if (this.gState === "chase") return this.gWalk;
    if (this.gIdle > 0 || this.gState !== "patrol") return 4;
    return this.gWalk;
  }

  update(_time: number, dtRaw: number): void {
    if (performance.now() < this.freezeUntil) {
      this.publish();
      return;
    }
    const dt = Math.min(40, dtRaw);
    this.sfx.pump();
    this.pushCd = Math.max(0, this.pushCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    if (this.bellT > 0) {
      this.bellT -= dt;
      this.bell.setTexture(Math.floor(this.bellT / 80) % 2 === 0 ? "bell0" : "bell1");
    } else this.bell.setTexture("bell0");

    const bob = Math.floor(this.time.now / 180) % 2;
    if (!this.leafletGot) {
      this.leaf.setTexture(bob ? "leaf1" : "leaf0");
      this.leaf.setY(LEAF.y * TILE + 8 + (bob ? -1 : 0));
      this.leaf.setDepth(this.leaf.y);
    }
    const lamp = Math.floor(this.time.now / 180) % 2;
    for (const lantern of this.lanterns) lantern.setTexture(lamp ? "lantern1" : "lantern0");
    this.flag.setTexture(Math.floor(this.time.now / 220) % 2 ? "flag1" : "flag0");
    this.arrow.setVisible(this.talking && Math.floor(this.time.now / 400) % 2 === 0);
    if (this.flash.alpha > 0) this.flash.setAlpha(Math.max(0, this.flash.alpha - dt / 140));

    if (this.dying) {
      this.fade.setAlpha(Math.min(1, this.fade.alpha + dt / 320));
      if (this.fade.alpha >= 1) this.respawn();
    } else if (this.fade.alpha > 0) this.fade.setAlpha(Math.max(0, this.fade.alpha - dt / 260));

    this.moved = 0;
    if (!this.talking && !this.itemUp && !this.dying) {
      if (this.lock) {
        this.lock.t += dt;
        if (this.lock.kind === "throw" && !this.pebbleShot && this.lock.t > 160 && this.lock.target) {
          this.spawnPebble(this.lock.target);
        }
        if (this.lock.kind === "kneel" && !this.knelt && this.lock.t >= 280) {
          this.knelt = true;
          this.sfx.pick();
        }
        if (this.lock.t >= this.lock.dur) {
          const done = this.lock;
          this.lock = null;
          if (done.kind === "kneel") {
            this.gateOpen = true;
            this.sfx.slide();
            this.tweens.add({ targets: this.gate, x: this.gate.x - 14, duration: 360 });
          } else if (done.kind === "cloak") {
            this.disguise = !!done.on;
            this.disguiseT = done.on ? 8000 : 0;
          }
        }
      } else {
        const key = this.keyVector();
        if (key) {
          this.order = null;
          this.moved = this.moveBy(key.x * SPEED * dt / 1000, key.y * SPEED * dt / 1000);
        } else if (this.order?.kind === "steer") {
          const dx = this.order.x - this.px;
          const dy = this.order.y - this.py;
          const dist = Math.hypot(dx, dy);
          if (dist > 3) this.moved = this.moveBy((dx / dist) * SPEED * dt / 1000, (dy / dist) * SPEED * dt / 1000);
        } else if (this.order?.kind === "path") {
          const pt = this.order.pts[this.order.i];
          if (!pt) {
            const then = this.order.then;
            const psx = this.order.psx ?? 0;
            const psy = this.order.psy ?? 0;
            this.order = null;
            this.arrive(then, psx, psy);
          } else {
            const dx = pt.x - this.px;
            const dy = pt.y - this.py;
            const dist = Math.hypot(dx, dy);
            if (dist < 2) this.order.i += 1;
            else this.moved = this.moveBy((dx / dist) * SPEED * dt / 1000, (dy / dist) * SPEED * dt / 1000);
          }
        }
        this.clampPlayer();
        if (this.moved > 0.15) {
          this.stepAcc += this.moved;
          if (this.stepAcc >= 4) {
            this.stepAcc -= 4;
            this.walkFrame = (this.walkFrame + 1) % 4;
            if (this.walkFrame === 0 || this.walkFrame === 2) {
              const pitch = this.who === "kite" ? 1.25 : this.who === "veil" ? 1.05 : 0.85;
              this.sfx.stepSound(pitch);
              this.puff(this.px, this.py);
            }
          }
        } else {
          this.breathT += dt;
          if (this.breathT > 400) {
            this.breathT = 0;
            this.breath = this.breath ? 0 : 1;
          }
        }
        if (this.disguise) {
          this.disguiseT -= dt;
          if (this.disguiseT <= 0) {
            this.disguise = false;
            this.sfx.rustle(false);
          }
        }
        this.updateGuard(dt);
      }
    }

    if (this.pebble) {
      this.pebble.t += dt / 280;
      const t = Math.min(1, this.pebble.t);
      const x = this.pebble.sx + (this.pebble.tx - this.pebble.sx) * t;
      const y = this.pebble.sy + (this.pebble.ty - this.pebble.sy) * t - Math.sin(t * Math.PI) * 26;
      this.pebbleImg.setPosition(x, y).setVisible(true).setDepth(4000);
      if (t >= 1) this.landPebble();
    }

    if (this.leafFlash > 0) {
      this.leaf.setTintFill(0xffffff);
      this.leafFlash -= 1;
      if (this.leafFlash <= 0) {
        this.leaf.clearTint();
        this.finishPickup();
      }
    }

    let kind: Kind = this.disguise ? "veil2" : this.who;
    if (this.lock?.kind === "cloak") kind = "veil";
    this.applyActor(this.player, kind, this.facing, this.playerCol(), this.px, this.py);
    this.shadow.setPosition(this.px, this.py).setDepth(this.py - 0.2);
    this.applyActor(this.guard, "guard", this.gFacing, this.guardCol(), this.gx, this.gy);
    this.gShadow.setPosition(this.gx, this.gy).setDepth(this.gy - 0.2);
    this.crate.setDepth(this.crate.y + TILE);
    this.grate.setDepth(this.grate.y);
    this.gate.setDepth(this.gate.y);

    if (this.flicker > 0) {
      this.flickerT += dt;
      if (this.flickerT > 32) {
        this.flickerT = 0;
        this.flicker -= 1;
      }
      if (this.flicker % 2 === 1) this.player.setTintFill(0xffffff);
      else this.player.clearTint();
    } else if (this.disguise && this.disguiseT > 0 && this.disguiseT < 2000) {
      if (Math.sin(this.disguiseT * 0.03) > 0) this.player.setTint(0xf6e6c8);
      else this.player.clearTint();
    } else this.player.clearTint();

    this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln / 70) % 2 === 0 ? 0.45 : 1);

    const showQ = this.gState === "sus";
    const showB = this.gState === "chase";
    this.mark.setVisible(showQ || showB);
    this.mark.setTexture(showB ? "bang" : "qmark");
    this.mark.setPosition(this.gx, this.gy - 28 - (Math.floor(this.time.now / 120) % 2));
    this.mark.setDepth(5200);

    this.drawCone();
    this.layoutHud();
    this.updateCamera();
    this.publish();
  }

  private drawCone(): void {
    this.cone.clear();
    if (this.gState === "stun" || this.gState === "bell") return;
    let fx = 0;
    let fy = 1;
    if (this.gFacing === "right") { fx = 1; fy = 0; }
    else if (this.gFacing === "left") { fx = -1; fy = 0; }
    else if (this.gFacing === "up") { fx = 0; fy = -1; }
    const rx = -fy;
    const ry = fx;
    const ox = this.gx + fx * 6;
    const oy = this.gy + fy * 4;
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(ox, oy)];
    for (let i = 0; i <= 6; i++) {
      const side = -1 + (2 * i) / 6;
      const tx = ox + fx * 64 + rx * side * 22;
      const ty = oy + fy * 64 + ry * side * 22;
      const dx = tx - ox;
      const dy = ty - oy;
      const len = Math.hypot(dx, dy) || 1;
      let hit = 1;
      for (let d = 6; d < len; d += 4) {
        const x = ox + (dx / len) * d;
        const y = oy + (dy / len) * d;
        if (this.tileSolid(Math.floor(x / TILE), Math.floor((y - 1) / TILE))) {
          hit = d / len;
          break;
        }
      }
      pts.push(new Phaser.Math.Vector2(ox + (dx / len) * len * hit, oy + (dy / len) * len * hit));
    }
    this.cone.fillStyle(this.gState === "chase" ? 0xa83838 : 0xf0d878, 0.34);
    this.cone.fillPoints(pts, true);
  }

  private layoutHud(): void {
    for (let i = 0; i < 3; i++) this.heartsImg[i].setTexture(i < this.hearts ? "heart" : "heart-empty");
    for (const port of this.ports) {
      const on = port.id === this.who;
      port.img.setAlpha(on ? 1 : 0.78);
      if (port.id === "veil") port.img.setTint(this.disguise ? 0xc4b48a : 0xffffff);
      if (on) this.sel.setPosition(port.img.x - 2, port.img.y - 2);
    }
  }

  private publish(): void {
    const cam = this.cameras.main;
    const top = this.py - 24 - cam.scrollY;
    const left = this.px - 8 - cam.scrollX;
    const debug = {
      ready: true,
      x: this.px,
      y: this.py,
      facing: this.facing,
      frame: this.playerCol(),
      mode: this.lock ? this.lock.kind : this.moved > 0.15 ? "walk" : "idle",
      who: this.who,
      disguise: this.disguise,
      hearts: this.hearts,
      guard: { x: this.gx, y: this.gy, state: this.gState, facing: this.gFacing, frame: this.guardCol() },
      crate: { x: this.crateTx, y: this.crateTy },
      grate: this.grateOpen,
      gate: this.gateOpen,
      leaflet: this.leafletGot,
      talking: this.talking,
      item: this.itemUp,
      cam: { x: cam.scrollX, y: cam.scrollY },
      onScreen: left >= -0.5 && left + 16 <= 320.5 && top >= -0.5 && this.py - cam.scrollY <= 180.5,
      shakes: this.shakes.slice(),
      sfx: sfxEver.slice(),
      sfxRecent: sfxLog.slice(),
      keyboardPrompt: false,
      lock: this.lock?.kind ?? "",
      audio: this.sfx.status(),
      pebble: this.pebble !== null,
      tap: this.lastTap,
    };
    (window as unknown as { __INQ: typeof debug }).__INQ = debug;
  }
}
