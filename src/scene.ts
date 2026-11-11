import Phaser from "phaser";
import {
  BELL,
  CRATE,
  GATE,
  GRATE,
  GUARD_NODES,
  LEAF,
  MAP_H,
  MAP_W,
  PLATE,
  SPAWN,
  TILE,
  blockedTile,
  validateMap,
} from "./map";
import { astar, nearestOpen } from "./path";
import { paintCanvas, Pix } from "./pix";
import { Sfx, sfxEver, sfxLog } from "./sfx";
import { makeArrow, makeBox, makeDust, makeHeart, makeLeaflet, makeMark, makeSpark, wrapBox } from "./ui";

const WIRE =
  "WIRE: Courtyard's watched. Switch spies — Kite's pebble, Veil's disguise, Key's picks. Get the leaflet and get out.";

const HUD = 40;
const VIEW_W = 640;
const VIEW_H = 320;
const SPEED = 78;
const PATROL = 52;
const CHASE = 68;
const FRAMES = 9;

type Spy = "kite" | "veil" | "key";
type Facing = "up" | "down" | "left" | "right";
type Kind = Spy | "veil2" | "guard";
type GState = "patrol" | "sus" | "chase" | "stun" | "bell";
type Then = "bell" | "guard" | "gate" | "leaf" | "push";
type Order =
  | { kind: "path"; pts: { x: number; y: number }[]; i: number; then?: Then; psx?: number; psy?: number }
  | { kind: "steer"; x: number; y: number };

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

function rowOf(facing: Facing): number {
  if (facing === "up") return 0;
  if (facing === "left") return 1;
  if (facing === "down") return 2;
  return 3;
}

function anchor(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 4 };
}

export class Yard extends Phaser.Scene {
  private sfx = new Sfx();
  private px = anchor(SPAWN.x, SPAWN.y).x;
  private py = anchor(SPAWN.x, SPAWN.y).y;
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
  private lock: { kind: string; t: number; dur: number; on?: boolean; target?: "bell" | "guard"; sparked?: number } | null = null;
  private order: Order | null = null;
  private stepAcc = 0;
  private walkFrame = 0;
  private moved = 0;
  private pushCd = 0;
  private crateTx = CRATE.x;
  private crateTy = CRATE.y;
  private gx = anchor(GUARD_NODES[0].x, GUARD_NODES[0].y).x;
  private gy = anchor(GUARD_NODES[0].x, GUARD_NODES[0].y).y;
  private gFacing: Facing = "right";
  private gState: GState = "patrol";
  private gTimer = 0;
  private gNode = 0;
  private gIdle = 0;
  private gLost = 0;
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
  private sparkAcc = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;

  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private guard!: Phaser.GameObjects.Sprite;
  private gShadow!: Phaser.GameObjects.Image;
  private mark!: Phaser.GameObjects.Image;
  private crate!: Phaser.GameObjects.Image;
  private grate!: Phaser.GameObjects.Image;
  private gate!: Phaser.GameObjects.Image;
  private leaf!: Phaser.GameObjects.Image;
  private bell!: Phaser.GameObjects.Image;
  private pebbleImg!: Phaser.GameObjects.Image;
  private pebbleShadow!: Phaser.GameObjects.Image;
  private cone!: Phaser.GameObjects.Graphics;
  private flash!: Phaser.GameObjects.Image;
  private fade!: Phaser.GameObjects.Image;
  private wireBox!: Phaser.GameObjects.Image;
  private itemBox!: Phaser.GameObjects.Image;
  private arrow!: Phaser.GameObjects.Image;
  private hint!: Phaser.GameObjects.Image;
  private glow!: Phaser.GameObjects.Graphics;
  private heartsImg: Phaser.GameObjects.Image[] = [];
  private ports: { id: Spy; img: Phaser.GameObjects.Image }[] = [];
  private sel!: Phaser.GameObjects.Graphics;
  private lanterns: Phaser.GameObjects.Image[] = [];
  private laundry: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("yard");
  }

  preload(): void {
    const image = (key: string, file = key) => this.load.image(key, `assets/lpc/${file}.png`);
    image("map");
    image("crate");
    image("grate");
    image("door");
    image("lantern");
    image("well");
    image("barrel");
    image("sack");
    image("awning");
    image("laundry");
    image("rug");
    image("flower", "prop-flower");
    image("shadow");
    image("pebble");
    image("plate");
    for (const id of ["kite", "veil", "key"] as const) image(`port-${id}`, `port-${id}`);
    for (const kind of ["kite", "veil", "veil2", "key", "guard"]) {
      this.load.spritesheet(kind, `assets/lpc/${kind}.png`, { frameWidth: 64, frameHeight: 64 });
    }
  }

  create(): void {
    const problems = validateMap();
    if (problems.length) throw new Error(problems.join("; "));

    upload(this, "dust", makeDust());
    upload(this, "spark", makeSpark());
    upload(this, "heart", makeHeart(true));
    upload(this, "heart-empty", makeHeart(false));
    upload(this, "qmark", makeMark("?"));
    upload(this, "bang", makeMark("!"));
    upload(this, "arrow", makeArrow());
    upload(this, "leaflet", makeLeaflet());
    const bar = new Pix(VIEW_W, HUD);
    bar.fill(0);
    bar.fillRect(0, HUD - 2, VIEW_W, 2, 13);
    upload(this, "hudbar", bar);
    const px = new Pix(1, 1);
    px.force(0, 0, 31);
    upload(this, "px", px);

    const lines = wrapBox(WIRE, 240);
    upload(this, "wirebox", makeBox(lines));
    upload(this, "itembox", makeBox(wrapBox("Coded leaflet", 200), "ITEM GET"));

    this.uiCam = this.cameras.add(0, 0, VIEW_W, HUD + VIEW_H);
    this.uiCam.setScroll(0, 0);
    this.uiCam.roundPixels = true;
    const cam = this.cameras.main;
    cam.setViewport(0, HUD, VIEW_W, VIEW_H);
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.roundPixels = true;

    this.world(this.add.image(0, 0, "map").setOrigin(0, 0).setDepth(0));
    this.cone = this.world(this.add.graphics().setDepth(2));
    this.glow = this.world(this.add.graphics().setDepth(3));

    this.dressCourt();

    const crateAt = this.crateAnchor(this.crateTx, this.crateTy);
    this.crate = this.world(this.add.image(crateAt.x, crateAt.y, "crate").setOrigin(0.5, 1).setScale(1.2));
    const grateAt = anchor(GRATE.x, GRATE.y);
    this.grate = this.world(this.add.image(grateAt.x, grateAt.y + 8, "grate").setOrigin(0.5, 1));
    const gateAt = anchor(GATE.x, GATE.y);
    this.gate = this.world(this.add.image(GATE.x * TILE, gateAt.y - 10, "door").setOrigin(0, 0.5));
    const leafAt = anchor(LEAF.x, LEAF.y);
    this.leaf = this.world(this.add.image(leafAt.x, leafAt.y - 10, "leaflet").setOrigin(0.5, 0.5).setScale(1.4));
    this.bell = this.world(this.add.image(BELL.x * TILE + 16, BELL.y * TILE + 4, "lantern").setOrigin(0.5, 0));

    const spawn = anchor(SPAWN.x, SPAWN.y);
    this.px = spawn.x;
    this.py = spawn.y;
    this.shadow = this.world(this.add.image(this.px, this.py, "shadow").setOrigin(0.5, 0.5).setAlpha(0.55));
    this.gShadow = this.world(this.add.image(this.gx, this.gy, "shadow").setOrigin(0.5, 0.5).setAlpha(0.55));
    this.player = this.world(this.add.sprite(this.px, this.py, "kite", rowOf("right") * FRAMES).setOrigin(0.5, 1));
    this.guard = this.world(this.add.sprite(this.gx, this.gy, "guard", rowOf("right") * FRAMES).setOrigin(0.5, 1));
    this.mark = this.world(this.add.image(this.gx, this.gy - 52, "qmark").setOrigin(0.5, 1).setVisible(false));
    this.pebbleShadow = this.world(this.add.image(0, 0, "shadow").setVisible(false).setScale(0.45).setAlpha(0.4));
    this.pebbleImg = this.world(this.add.image(0, 0, "pebble").setVisible(false).setScale(3).setDepth(2000));
    this.hint = this.world(this.add.image(PLATE.x * TILE + 16, PLATE.y * TILE - 6, "arrow").setOrigin(0.5, 1).setScale(1.6));

    this.flash = this.hud(this.add.image(VIEW_W / 2, (HUD + VIEW_H) / 2, "px").setDisplaySize(VIEW_W, HUD + VIEW_H).setTint(0xa83838).setAlpha(0).setDepth(8000));
    this.fade = this.hud(this.add.image(VIEW_W / 2, (HUD + VIEW_H) / 2, "px").setDisplaySize(VIEW_W, HUD + VIEW_H).setTint(0x1a1210).setAlpha(0).setDepth(9000));
    this.hud(this.add.image(0, 0, "hudbar").setOrigin(0, 0).setDepth(5900));
    this.wireBox = this.hud(this.add.image(40, HUD + VIEW_H - 78, "wirebox").setOrigin(0, 0).setDepth(7000));
    this.arrow = this.hud(this.add.image(560, HUD + VIEW_H - 28, "arrow").setDepth(7100));
    this.itemBox = this.hud(this.add.image(VIEW_W / 2, HUD + 120, "itembox").setDepth(7200).setVisible(false));

    for (let i = 0; i < 3; i++) {
      this.heartsImg.push(this.hud(this.add.image(8 + i * 18, 12, "heart").setOrigin(0, 0).setDepth(6000)));
    }
    this.sel = this.hud(this.add.graphics().setDepth(6000));
    (["kite", "veil", "key"] as const).forEach((id, i) => {
      const img = this.hud(this.add.image(78 + i * 42, 2, `port-${id}`).setOrigin(0, 0).setDisplaySize(36, 36).setDepth(6100));
      this.ports.push({ id, img });
    });

    const kb = this.input.keyboard;
    if (kb) this.keys = kb.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT") as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onUp(p));
    this.publish();
  }

  private world<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.uiCam.ignore(obj);
    return obj;
  }

  private hud<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.cameras.main.ignore(obj);
    return obj;
  }

  private dressCourt(): void {
    const drop = (key: string, tx: number, ty: number, ox = 0.5, oy = 1, scale = 1) => {
      const at = anchor(tx, ty);
      return this.world(this.add.image(at.x, at.y + 2, key).setOrigin(ox, oy).setScale(scale).setDepth(at.y));
    };
    this.world(this.add.image(25 * TILE, 8 * TILE, "well").setOrigin(0.5, 1).setDepth(8 * TILE));
    drop("barrel", 8, 5);
    drop("sack", 9, 5, 0.5, 1, 0.85);
    drop("flower", 6, 4, 0.5, 1, 0.9);
    drop("barrel", 8, 10, 0.5, 1, 0.9);
    drop("flower", 28, 10, 0.5, 1, 0.9);
    drop("sack", 12, 6, 0.5, 1, 0.8);
    drop("barrel", 29, 7, 0.5, 1, 0.85);
    this.world(this.add.image(10 * TILE, 11 * TILE, "rug").setOrigin(0, 1).setScale(0.7).setDepth(11 * TILE));
    this.world(this.add.image(20 * TILE, 12 * TILE, "rug").setOrigin(0, 1).setScale(0.8).setDepth(12 * TILE));
    for (let i = 0; i < 5; i++) {
      this.world(this.add.image((1 + i) * TILE + 8, 9 * TILE + 4, "awning").setOrigin(0, 1).setDepth(9 * TILE + 4));
    }
    for (const x of [6, 14, 22, 30]) {
      this.lanterns.push(this.world(this.add.image(x * TILE + 16, 2 * TILE + 6, "lantern").setOrigin(0.5, 0).setDepth(3 * TILE)));
    }
    for (const x of [5, 11, 18, 27]) {
      this.laundry.push(this.world(this.add.image(x * TILE + 8, 3 * TILE + 10, "laundry").setOrigin(0.5, 0).setDepth(4 * TILE)));
    }
  }

  private crateAnchor(tx: number, ty: number): { x: number; y: number } {
    return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 2 };
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
    if (p.y < HUD) return;
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
    if (Math.hypot(p.x - this.downX, p.y - this.downY) < 10) return;
    if (p.y < HUD) return;
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
      if (x >= port.img.x && y >= port.img.y && x < port.img.x + 36 && y < port.img.y + 36) return port.id;
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
    this.lock = { kind: "cloak", t: 0, dur: 420, on, sparked: 0 };
    this.order = null;
    this.puff(this.px, this.py - 20, 6);
  }

  private hitWorld(x: number, y: number): Then | null {
    if (Math.hypot(x - this.gx, y - (this.gy - 28)) < 44) return "guard";
    const bell = { x: BELL.x * TILE + 16, y: BELL.y * TILE + 28 };
    if (Math.hypot(x - bell.x, y - bell.y) < 36) return "bell";
    if (!this.leafletGot && Math.hypot(x - (LEAF.x * TILE + 16), y - (LEAF.y * TILE + 16)) < 32) return "leaf";
    if (!this.gateOpen && this.inTile(x, y, GATE.x, GATE.y, 16)) return "gate";
    if (this.inTile(x, y, this.crateTx, this.crateTy, 12)) return "push";
    return null;
  }

  private inTile(x: number, y: number, tx: number, ty: number, pad: number): boolean {
    return x >= tx * TILE - pad && y >= ty * TILE - pad && x < (tx + 1) * TILE + pad && y < (ty + 1) * TILE + pad;
  }

  private beginInteract(kind: Then): void {
    if (kind === "guard") {
      const d = Math.hypot(this.px - this.gx, this.py - this.gy);
      if (d < 44) {
        this.jab();
        return;
      }
      if (this.who === "kite" && d < 300) {
        this.throwAt("guard");
        return;
      }
      this.order = this.pathTo(this.gx, this.gy, "guard");
      return;
    }
    if (kind === "bell") {
      const bx = BELL.x * TILE + 16;
      const by = BELL.y * TILE + 36;
      if (this.who === "kite" && Math.hypot(this.px - bx, this.py - by) < 320) {
        this.throwAt("bell");
        return;
      }
      this.order = this.pathTo(bx, by + 28, "bell");
      return;
    }
    if (kind === "gate") {
      if (this.adjacent(GATE.x, GATE.y)) this.useGate();
      else this.order = this.pathTo(GATE.x * TILE + 8, GATE.y * TILE + 20, "gate");
      return;
    }
    if (kind === "leaf") {
      if (!this.grateOpen) {
        this.order = this.pathTo(GRATE.x * TILE - 16, GRATE.y * TILE + 20);
        return;
      }
      if (this.adjacent(LEAF.x, LEAF.y)) this.pickup();
      else this.order = this.pathTo(LEAF.x * TILE + 16, LEAF.y * TILE + 20, "leaf");
      return;
    }
    const dx = Math.sign(this.crateTx * TILE + 16 - this.px) || 1;
    const dy = Math.sign(this.crateTy * TILE + 20 - this.py);
    const sx = Math.abs(this.crateTx * TILE + 16 - this.px) >= Math.abs(this.crateTy * TILE + 20 - this.py) ? dx : 0;
    const sy = sx === 0 ? (dy || 1) : 0;
    if (this.adjacent(this.crateTx, this.crateTy)) this.tryPush(sx, sy);
    else this.order = this.pathTo(this.crateTx * TILE + 16 - sx * 28, this.crateTy * TILE + 20 - sy * 28, "push", sx, sy);
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
      pts: tiles.map((t) => anchor(t.x, t.y)),
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
    const tx = target === "bell" ? BELL.x * TILE + 16 : this.gx;
    const ty = target === "bell" ? BELL.y * TILE + 20 : this.gy - 24;
    this.facing = this.faceOf(tx - this.px, ty - this.py);
    this.lock = { kind: "throw", t: 0, dur: 460, target };
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
    this.gx = Phaser.Math.Clamp(this.gx + (dx / m) * 12, 24, MAP_W * TILE - 24);
    this.gy = Phaser.Math.Clamp(this.gy + (dy / m) * 12, 48, MAP_H * TILE - 12);
    this.burst(this.gx, this.gy - 28, 5);
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
    this.lock = { kind: "kneel", t: 0, dur: 720, sparked: 0 };
    this.knelt = false;
    this.sparkAcc = 0;
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
    this.shake(2, 240);
    this.hint.setVisible(false);
    const dustY = this.grate.y;
    this.tweens.add({ targets: this.grate, y: this.grate.y - 78, angle: -12, duration: 420 });
    this.puff(this.grate.x, dustY, 8);
  }

  private stunGuard(ms: number, _sit: boolean): void {
    this.gState = "stun";
    this.gTimer = ms;
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

  private bodyHits(cx: number, foot: number, halfW: number, halfH: number, guardSolid: boolean): boolean {
    const l = cx - halfW;
    const r = cx + halfW;
    const t = foot - halfH;
    const b = foot;
    const x0 = Math.floor(l / TILE);
    const x1 = Math.floor((r - 0.01) / TILE);
    const y0 = Math.floor(t / TILE);
    const y1 = Math.floor((b - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) if (this.tileSolid(tx, ty)) return true;
    }
    if (guardSolid && !this.disguise && this.gState !== "chase" && this.gState !== "stun" && this.gState !== "bell") {
      if (Math.hypot(cx - this.gx, foot - this.gy) < 18) return true;
    }
    return false;
  }

  private hits(cx: number, foot: number): boolean {
    return this.bodyHits(cx, foot, 10, 12, true);
  }

  private overlapsCrate(cx: number, foot: number): boolean {
    const l = cx - 10;
    const r = cx + 10;
    const t = foot - 12;
    const b = foot;
    const cl = this.crateTx * TILE + 4;
    const ct = this.crateTy * TILE + 8;
    return l < cl + TILE - 8 && r > cl && t < ct + TILE - 4 && b > ct;
  }

  private tryPush(sx: number, sy: number): boolean {
    if (this.pushCd > 0 || (sx === 0 && sy === 0)) return false;
    if (this.crateTx === PLATE.x && this.crateTy === PLATE.y) return false;
    const destX = this.crateTx + sx;
    const destY = this.crateTy + sy;
    const terrain = blockedTile(destX, destY, this.grateOpen, this.gateOpen);
    const gt = this.tileOf(this.gx, this.gy);
    if (terrain || (destX === gt.x && destY === gt.y)) {
      if (destX === gt.x && destY === gt.y) this.heard = true;
      if (terrain) this.resetCrate();
      return false;
    }
    this.crateTx = destX;
    this.crateTy = destY;
    this.pushCd = 180;
    this.tweens.killTweensOf(this.crate);
    const pos = this.crateAnchor(destX, destY);
    this.tweens.add({
      targets: this.crate,
      x: pos.x,
      y: pos.y,
      duration: 110,
      onComplete: () => {
        const snap = this.crateAnchor(this.crateTx, this.crateTy);
        this.crate.setPosition(snap.x, snap.y);
      },
    });
    this.sfx.thud();
    if (Math.max(Math.abs(destX - gt.x), Math.abs(destY - gt.y)) <= 1) this.heard = true;
    if (destX === PLATE.x && destY === PLATE.y) this.pressPlate();
    return true;
  }

  private resetCrate(): void {
    if (this.crateTx === CRATE.x && this.crateTy === CRATE.y) return;
    if (this.crateTx === PLATE.x && this.crateTy === PLATE.y) return;
    this.puff(this.crate.x, this.crate.y, 5);
    this.crateTx = CRATE.x;
    this.crateTy = CRATE.y;
    this.pushCd = 240;
    this.tweens.killTweensOf(this.crate);
    const pos = this.crateAnchor(CRATE.x, CRATE.y);
    this.tweens.add({
      targets: this.crate,
      x: pos.x,
      y: pos.y,
      duration: 180,
      onComplete: () => {
        const snap = this.crateAnchor(this.crateTx, this.crateTy);
        this.crate.setPosition(snap.x, snap.y);
      },
    });
    this.sfx.thud();
  }

  private moveBy(dx: number, dy: number): number {
    const ox = this.px;
    const oy = this.py;
    const firstX = Math.abs(dx) >= Math.abs(dy);
    this.step(firstX ? dx : 0, firstX ? 0 : dy);
    this.step(firstX ? 0 : dx, firstX ? dy : 0);
    const moved = Math.hypot(this.px - ox, this.py - oy);
    if (moved > 0.2) this.facing = this.faceOf(this.px - ox, this.py - oy);
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
    this.px = Phaser.Math.Clamp(this.px, 20, MAP_W * TILE - 20);
    this.py = Phaser.Math.Clamp(this.py, 48, MAP_H * TILE - 8);
  }

  private updateCamera(): void {
    const cam = this.cameras.main;
    const maxX = Math.max(0, MAP_W * TILE - VIEW_W);
    const maxY = Math.max(0, MAP_H * TILE - VIEW_H);
    const destX = Phaser.Math.Clamp(this.px - VIEW_W / 2, 0, maxX);
    const destY = Phaser.Math.Clamp(this.py - VIEW_H * 0.62, 0, maxY);
    cam.scrollX += (destX - cam.scrollX) * 0.16;
    cam.scrollY += (destY - cam.scrollY) * 0.16;
    if (this.px - 34 < cam.scrollX) cam.scrollX = this.px - 34;
    if (this.px + 34 > cam.scrollX + VIEW_W) cam.scrollX = this.px + 34 - VIEW_W;
    if (this.py - 68 < cam.scrollY) cam.scrollY = this.py - 68;
    if (this.py + 4 > cam.scrollY + VIEW_H) cam.scrollY = this.py + 4 - VIEW_H;
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, maxX);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, maxY);
  }

  private keyVector(): { x: number; y: number } | null {
    if (!this.keys) return null;
    let x = 0;
    let y = 0;
    if (this.keys.A?.isDown || this.keys.LEFT?.isDown) x -= 1;
    if (this.keys.D?.isDown || this.keys.RIGHT?.isDown) x += 1;
    if (this.keys.W?.isDown || this.keys.UP?.isDown) y -= 1;
    if (this.keys.S?.isDown || this.keys.DOWN?.isDown) y += 1;
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
    if (along < 12 || along > 128) return false;
    const half = 14 + 40 * (along / 128);
    if (Math.abs(side) > half) return false;
    const steps = Math.max(1, Math.ceil(along / 8));
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
    return near && this.moved > 0.4;
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
      if (!this.seesPlayer() && Math.hypot(this.px - this.gx, this.py - this.gy) > 190) this.gLost += dt;
      else this.gLost = 0;
      if (this.gLost > 2000) {
        this.gState = "patrol";
        this.gLost = 0;
      } else {
        this.chase(dt);
        if (this.invuln <= 0 && Math.hypot(this.px - this.gx, this.py - this.gy) < 22) this.catchPlayer();
      }
    } else if (this.gState === "stun" || this.gState === "bell") {
      this.gTimer -= dt;
      if (this.gState === "bell") this.gFacePoint(BELL.x * TILE + 16, BELL.y * TILE);
      if (this.gTimer <= 0) this.gState = "patrol";
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
    this.sfx.alarm();
    this.shake(3, 200);
  }

  private patrol(dt: number): void {
    if (this.gIdle > 0) {
      this.gIdle -= dt;
      return;
    }
    const node = GUARD_NODES[this.gNode];
    const at = anchor(node.x, node.y);
    const dx = at.x - this.gx;
    const dy = at.y - this.gy;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      this.gx = at.x;
      this.gy = at.y;
      this.gNode = (this.gNode + 1) % GUARD_NODES.length;
      this.gIdle = 900;
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
    const tryAt = (nx: number, ny: number) => !this.bodyHits(nx, ny, 10, 12, false);
    if (tryAt(this.gx + dx, this.gy)) this.gx += dx;
    if (tryAt(this.gx, this.gy + dy)) this.gy += dy;
    this.gx = Phaser.Math.Clamp(this.gx, 24, MAP_W * TILE - 24);
    this.gy = Phaser.Math.Clamp(this.gy, 48, MAP_H * TILE - 8);
    const moved = Math.hypot(this.gx - ox, this.gy - oy);
    if (moved > 0.2) this.gFacing = this.faceOf(this.gx - ox, this.gy - oy);
    this.gStep += moved;
    if (this.gStep >= 7) {
      this.gStep -= 7;
      this.gWalk = (this.gWalk + 1) % FRAMES;
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
    this.shake(4, 240);
    this.flash.setAlpha(0.45);
    const dx = this.px - this.gx;
    const dy = this.py - this.gy;
    const m = Math.hypot(dx, dy) || 1;
    this.px += (dx / m) * 28;
    this.py += (dy / m) * 18;
    this.clampPlayer();
    this.order = null;
    if (this.hearts <= 0) this.dying = true;
  }

  private respawn(): void {
    const spawn = anchor(SPAWN.x, SPAWN.y);
    this.px = spawn.x;
    this.py = spawn.y;
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
    this.pebbleShadow.setVisible(false);
    this.crateTx = CRATE.x;
    this.crateTy = CRATE.y;
    const c = this.crateAnchor(CRATE.x, CRATE.y);
    this.crate.setPosition(c.x, c.y);
    this.grateOpen = false;
    const g = anchor(GRATE.x, GRATE.y);
    this.grate.setPosition(g.x, g.y + 8);
    this.grate.angle = 0;
    this.hint.setVisible(true);
    const home = anchor(GUARD_NODES[0].x, GUARD_NODES[0].y);
    this.gx = home.x;
    this.gy = home.y;
    this.gState = "patrol";
    this.gNode = 0;
    this.gIdle = 0;
    this.gTimer = 0;
    this.gFacing = "right";
    this.who = "kite";
  }

  private shake(px: number, ms: number): void {
    this.cameras.main.shake(ms, px / 640);
    this.shakes.push(px);
  }

  private burst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.world(this.add.image(x, y, "spark").setDepth(4000).setScale(1.4));
      const a = (Math.PI * 2 * i) / n;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(a) * 18,
        y: y + Math.sin(a) * 14,
        alpha: 0,
        duration: 260,
        onComplete: () => s.destroy(),
      });
    }
  }

  private puff(x: number, y: number, n = 4): void {
    for (let i = 0; i < n; i++) {
      const s = this.world(this.add.image(x + (i - n / 2) * 4, y, "dust").setDepth(y).setScale(1.6));
      this.tweens.add({
        targets: s,
        x: x + (i - n / 2) * 7,
        y: y - 10 - i * 2,
        alpha: 0,
        duration: 280,
        onComplete: () => s.destroy(),
      });
    }
  }

  private landPebble(): void {
    if (!this.pebble) return;
    const hit = this.pebble.hit;
    const tx = this.pebble.tx;
    const ty = this.pebble.ty;
    this.pebble = null;
    this.pebbleImg.setVisible(false);
    this.pebbleShadow.setVisible(false);
    this.sfx.clink();
    this.puff(tx, ty, 6);
    if (hit === "bell") {
      this.gState = "bell";
      this.gTimer = 3000;
      this.gFacePoint(BELL.x * TILE + 16, BELL.y * TILE);
      this.bellT = 900;
      this.burst(BELL.x * TILE + 16, BELL.y * TILE + 24, 4);
      return;
    }
    if (Math.hypot(this.gx - tx, this.gy - ty) < 48) {
      this.freezeUntil = performance.now() + 50;
      this.stunGuard(2000, true);
      this.burst(this.gx, this.gy - 30, 6);
    }
  }

  private spawnPebble(hit: "bell" | "guard"): void {
    const hand = this.hand();
    const tx = hit === "bell" ? BELL.x * TILE + 16 : this.gx;
    const ty = hit === "bell" ? BELL.y * TILE + 18 : this.gy - 16;
    this.pebble = { sx: hand.x, sy: hand.y, tx, ty, t: 0, hit };
    this.sfx.whoosh();
    this.pebbleShot = true;
  }

  private hand(): { x: number; y: number } {
    const dir = this.facing === "left" ? -1 : 1;
    if (this.facing === "up") return { x: this.px, y: this.py - 46 };
    if (this.facing === "down") return { x: this.px + 8, y: this.py - 28 };
    return { x: this.px + dir * 16, y: this.py - 30 };
  }

  private applyActor(img: Phaser.GameObjects.Sprite, kind: Kind, facing: Facing, col: number, x: number, y: number, moving: boolean): void {
    const frame = rowOf(facing) * FRAMES + (col % FRAMES);
    if (img.texture.key !== kind) img.setTexture(kind, frame);
    else img.setFrame(frame);
    img.setPosition(Math.round(x), Math.round(y));
    img.setDepth(y);
    const plant = moving && (col % FRAMES === 1 || col % FRAMES === 5);
    img.setScale(plant ? 1.08 : 1, plant ? 0.9 : 1);
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
      this.bell.angle = Math.sin(this.bellT / 38) * 24;
    } else this.bell.angle = Math.sin(this.time.now / 500) * 2;

    const bob = Math.sin(this.time.now / 180);
    if (!this.leafletGot) {
      this.leaf.setY(LEAF.y * TILE + 12 + bob * 2);
      this.leaf.setDepth(this.leaf.y);
    }
    for (const lantern of this.lanterns) lantern.setAlpha(0.82 + (Math.sin(this.time.now / 140 + lantern.x) > 0 ? 0.18 : 0));
    for (const cloth of this.laundry) cloth.angle = Math.sin(this.time.now / 260 + cloth.x) * 8;
    this.arrow.setVisible(this.talking && Math.floor(this.time.now / 400) % 2 === 0);
    if (!this.grateOpen) this.hint.setY(PLATE.y * TILE - 4 + Math.sin(this.time.now / 160) * 4);
    if (this.flash.alpha > 0) this.flash.setAlpha(Math.max(0, this.flash.alpha - dt / 140));

    if (this.dying) {
      this.fade.setAlpha(Math.min(1, this.fade.alpha + dt / 320));
      if (this.fade.alpha >= 1) this.respawn();
    } else if (this.fade.alpha > 0) this.fade.setAlpha(Math.max(0, this.fade.alpha - dt / 260));

    this.moved = 0;
    if (!this.talking && !this.itemUp && !this.dying) {
      if (this.lock) {
        this.lock.t += dt;
        if (this.lock.kind === "throw" && !this.pebbleShot && this.lock.t > 140 && this.lock.target) this.spawnPebble(this.lock.target);
        if (this.lock.kind === "kneel") {
          this.sparkAcc += dt;
          if (this.sparkAcc > 90) {
            this.sparkAcc = 0;
            this.burst(GATE.x * TILE + 8, GATE.y * TILE + 16, 3);
            if (!this.knelt) {
              this.knelt = true;
              this.sfx.pick();
            }
          }
        }
        if (this.lock.kind === "cloak" && this.lock.t > 180 && (this.lock.sparked ?? 0) < 1) {
          this.lock.sparked = 1;
          this.puff(this.px, this.py - 24, 8);
        }
        if (this.lock.t >= this.lock.dur) {
          const done = this.lock;
          this.lock = null;
          if (done.kind === "kneel") {
            this.gateOpen = true;
            this.sfx.slide();
            this.tweens.add({ targets: this.gate, angle: -100, duration: 420 });
            this.puff(this.gate.x + 10, this.gate.y, 6);
          } else if (done.kind === "cloak") {
            this.disguise = !!done.on;
            this.disguiseT = done.on ? 8000 : 0;
            this.puff(this.px, this.py - 16, 7);
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
          if (dist > 4) this.moved = this.moveBy((dx / dist) * SPEED * dt / 1000, (dy / dist) * SPEED * dt / 1000);
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
            if (dist < 3) this.order.i += 1;
            else this.moved = this.moveBy((dx / dist) * SPEED * dt / 1000, (dy / dist) * SPEED * dt / 1000);
          }
        }
        this.clampPlayer();
        if (this.moved > 0.2) {
          this.stepAcc += this.moved;
          if (this.stepAcc >= 7) {
            this.stepAcc -= 7;
            this.walkFrame = (this.walkFrame + 1) % FRAMES;
            if (this.walkFrame === 1 || this.walkFrame === 5) {
              const pitch = this.who === "kite" ? 1.25 : this.who === "veil" ? 1.05 : 0.85;
              this.sfx.stepSound(pitch);
              this.puff(this.px, this.py, 2);
            }
          }
        }
        if (this.disguise) {
          this.disguiseT -= dt;
          if (this.disguiseT <= 0) {
            this.disguise = false;
            this.sfx.rustle(false);
            this.puff(this.px, this.py - 16, 5);
          }
        }
        this.updateGuard(dt);
      }
    }

    if (this.pebble) {
      this.pebble.t += dt / 360;
      const t = Math.min(1, this.pebble.t);
      const x = this.pebble.sx + (this.pebble.tx - this.pebble.sx) * t;
      const groundY = this.pebble.sy + (this.pebble.ty - this.pebble.sy) * t;
      const arc = Math.sin(t * Math.PI) * 52;
      this.pebbleImg.setPosition(x, groundY - arc).setVisible(true).setDepth(4000);
      this.pebbleShadow.setPosition(x, groundY).setVisible(true).setScale(0.35 + (1 - arc / 52) * 0.25).setDepth(groundY - 1);
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
    if (this.lock?.kind === "cloak") kind = this.disguise ? "veil2" : "veil";
    const moving = this.moved > 0.2 && !this.lock;
    this.applyActor(this.player, kind, this.facing, moving ? this.walkFrame : 0, this.px, this.py, moving);
    this.shadow.setPosition(this.px, this.py - 2).setDepth(this.py - 1);
    const gMoving = this.gState === "patrol" ? this.gIdle <= 0 : this.gState === "chase";
    this.applyActor(this.guard, "guard", this.gFacing, gMoving ? this.gWalk : 0, this.gx, this.gy, gMoving);
    this.gShadow.setPosition(this.gx, this.gy - 2).setDepth(this.gy - 1);
    this.crate.setDepth(this.crate.y);
    this.grate.setDepth(this.grate.y);
    this.gate.setDepth(this.gate.y + 20);

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
    this.mark.setPosition(this.gx, this.gy - 58 - (Math.floor(this.time.now / 120) % 2));
    this.mark.setDepth(5200);

    this.drawCone();
    this.drawGlow();
    this.layoutHud();
    this.updateCamera();
    this.publish();
  }

  private drawGlow(): void {
    this.glow.clear();
    if (this.grateOpen) return;
    const x = PLATE.x * TILE + 16;
    const y = PLATE.y * TILE + 16;
    const pulse = 0.35 + Math.sin(this.time.now / 180) * 0.2;
    this.glow.fillStyle(0xf0d878, pulse);
    this.glow.fillCircle(x, y, 18);
    this.glow.lineStyle(2, 0xffe090, 0.9);
    this.glow.strokeCircle(x, y, 12);
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
    const ox = this.gx + fx * 10;
    const oy = this.gy - 8 + fy * 6;
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(ox, oy)];
    for (let i = 0; i <= 6; i++) {
      const side = -1 + (2 * i) / 6;
      const tx = ox + fx * 128 + rx * side * 46;
      const ty = oy + fy * 128 + ry * side * 46;
      const dx = tx - ox;
      const dy = ty - oy;
      const len = Math.hypot(dx, dy) || 1;
      let hit = 1;
      for (let d = 10; d < len; d += 8) {
        const x = ox + (dx / len) * d;
        const y = oy + (dy / len) * d;
        if (this.tileSolid(Math.floor(x / TILE), Math.floor((y - 1) / TILE))) {
          hit = d / len;
          break;
        }
      }
      pts.push(new Phaser.Math.Vector2(ox + (dx / len) * len * hit, oy + (dy / len) * len * hit));
    }
    this.cone.fillStyle(this.gState === "chase" ? 0xa83838 : 0xf0d878, 0.28);
    this.cone.fillPoints(pts, true);
  }

  private layoutHud(): void {
    for (let i = 0; i < 3; i++) this.heartsImg[i].setTexture(i < this.hearts ? "heart" : "heart-empty");
    this.sel.clear();
    for (const port of this.ports) {
      const on = port.id === this.who;
      port.img.setAlpha(on ? 1 : 0.72);
      if (on) {
        this.sel.lineStyle(2, 0xf0d878, 1);
        this.sel.strokeRect(port.img.x - 2, port.img.y - 1, 40, 38);
      }
    }
  }

  private publish(): void {
    const cam = this.cameras.main;
    const top = this.py - 64 - cam.scrollY;
    const left = this.px - 32 - cam.scrollX;
    const debug = {
      ready: true,
      x: this.px,
      y: this.py,
      facing: this.facing,
      frame: this.moved > 0.2 ? this.walkFrame : 0,
      mode: this.lock ? this.lock.kind : this.moved > 0.2 ? "walk" : "idle",
      who: this.who,
      disguise: this.disguise,
      hearts: this.hearts,
      guard: { x: this.gx, y: this.gy, state: this.gState, facing: this.gFacing, frame: this.gWalk },
      crate: { x: this.crateTx, y: this.crateTy },
      grate: this.grateOpen,
      gate: this.gateOpen,
      leaflet: this.leafletGot,
      talking: this.talking,
      item: this.itemUp,
      cam: { x: cam.scrollX, y: cam.scrollY },
      onScreen: left >= -1 && left + 64 <= VIEW_W + 1 && top >= -1 && this.py - cam.scrollY <= VIEW_H + 1,
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
