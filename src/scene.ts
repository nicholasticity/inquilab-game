import Phaser from "phaser";
import {
  BELL,
  BICYCLE,
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
  TONGA,
  WELL,
  blockedTile,
  validateMap,
} from "./map";
import { Frame, layoutFrame, readSafe } from "./layout";
import { paintCanvas, Pix } from "./pix";
import { Sfx, sfxEver, sfxLog } from "./sfx";
import { makeArrow, makeBox, makeCaption, makeDigit, makeDust, makeEye, makeHeart, makeItemCard, makeKnob, makeLeaflet, makeMark, makeSpark, makeStickBase, wrapBox } from "./ui";

const WIRE =
  "Thumbstick moves. Tap a spy to switch, then tap the active spy for the pebble, the disguise, or the picks. Get the leaflet and get out.";

const SPEED = 78;
const PATROL = 52;
const CHASE = 68;
const FRAMES = 9;
const STICK_DEAD = 0.2;
const OFFICER_A = { x: 20, y: 4 };
const OFFICER_B = { x: 27, y: 4 };

type Spy = "kite" | "veil" | "key";
type Facing = "up" | "down" | "left" | "right";
type Kind = Spy | "veil2" | "guard" | "officer";
type GState = "patrol" | "sus" | "chase" | "stun" | "bell";
type Then = "bell" | "guard" | "gate" | "leaf" | "push";

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
  private stickId = -1;
  private tapId = -1;
  private stickDx = 0;
  private stickDy = 0;
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
  private rune!: Phaser.GameObjects.Image;
  private dim!: Phaser.GameObjects.Image;
  private itemIcon!: Phaser.GameObjects.Image;
  private stickKnob!: Phaser.GameObjects.Image;
  private heartsImg: Phaser.GameObjects.Image[] = [];
  private ports: { id: Spy; img: Phaser.GameObjects.Image }[] = [];
  private sel!: Phaser.GameObjects.Graphics;
  private lanterns: Phaser.GameObjects.Image[] = [];
  private diyas: Phaser.GameObjects.Image[] = [];
  private laundry: Phaser.GameObjects.Image[] = [];
  private pigeons: Phaser.GameObjects.Image[] = [];
  private motes: Phaser.GameObjects.Image[] = [];
  private glows: Phaser.GameObjects.Image[] = [];
  private steam!: Phaser.GameObjects.Image;
  private officer!: Phaser.GameObjects.Sprite;
  private oShadow!: Phaser.GameObjects.Image;
  private ox = anchor(OFFICER_A.x, OFFICER_A.y).x;
  private oy = anchor(OFFICER_A.x, OFFICER_A.y).y;
  private oFacing: Facing = "right";
  private oFrame = 0;
  private oStep = 0;
  private oIdle = 0;
  private oDir = 1;
  private frame: Frame = layoutFrame(390, 844, { top: 0, right: 0, bottom: 0, left: 0 });
  private lookX = 0;
  private chrome!: Phaser.GameObjects.Graphics;
  private stickImg!: Phaser.GameObjects.Image;
  private marker!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Image;
  private leafletIcon!: Phaser.GameObjects.Image;
  private leafletCount!: Phaser.GameObjects.Image;

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
    image("lantern2", "lantern-b");
    image("well");
    image("sack");
    image("matka");
    image("laundry");
    image("laundryb", "laundry-b");
    image("shadow");
    image("pebble");
    image("plate");
    image("rune");
    image("charpoy");
    image("bicycle");
    image("tonga");
    image("tulsi");
    image("pillar");
    image("stall");
    image("bench");
    image("press");
    image("bell");
    image("diya");
    image("diya2", "diya-b");
    image("steam0");
    image("steam1");
    image("steam2");
    image("pigeon");
    image("pigeon2", "pigeon-b");
    image("pigeon3", "pigeon-c");
    image("jharokha");
    image("glow");
    image("mote");
    for (const id of ["kite", "veil", "key"] as const) image(`port-${id}`, `port-${id}`);
    for (const kind of ["kite", "veil", "veil2", "key", "guard", "officer"]) {
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
    upload(this, "stick", makeStickBase());
    upload(this, "knob", makeKnob());
    upload(this, "itemcard", makeItemCard(300));
    upload(this, "eye", makeEye());
    upload(this, "count0", makeDigit("0"));
    upload(this, "count1", makeDigit("1"));
    upload(this, "caption", makeCaption("tap a spy: switch or ability"));
    const px = new Pix(1, 1);
    px.force(0, 0, 31);
    upload(this, "px", px);

    const lines = wrapBox(WIRE, 148);
    upload(this, "wirebox", makeBox(lines, undefined, 320));

    const w0 = this.scale.width;
    const h0 = this.scale.height;
    this.uiCam = this.cameras.add(0, 0, w0, h0);
    this.uiCam.setScroll(0, 0);
    this.uiCam.roundPixels = true;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.roundPixels = true;

    this.world(this.add.image(0, 0, "map").setOrigin(0, 0).setDepth(0));
    this.cone = this.world(this.add.graphics().setDepth(2));
    this.rune = this.world(this.add.image(PLATE.x * TILE + 16, PLATE.y * TILE + 16, "rune").setDepth(3));

    this.dressCourt();

    const crateAt = this.crateAnchor(this.crateTx, this.crateTy);
    this.crate = this.world(this.add.image(crateAt.x, crateAt.y, "crate").setOrigin(0.5, 1));
    const grateAt = anchor(GRATE.x, GRATE.y);
    this.grate = this.world(this.add.image(grateAt.x, grateAt.y + 12, "grate").setOrigin(0.5, 1).setDepth(grateAt.y));
    this.gate = this.world(this.add.image(GATE.x * TILE + 16, GATE.y * TILE - 4, "door").setOrigin(0.5, 0));
    const leafAt = anchor(LEAF.x, LEAF.y);
    this.leaf = this.world(this.add.image(leafAt.x, leafAt.y - 10, "leaflet").setOrigin(0.5, 0.5));
    const bell = this.bellPoint();
    this.bell = this.world(this.add.image(bell.x, bell.y - 8, "bell").setOrigin(0.5, 0));

    const spawn = anchor(SPAWN.x, SPAWN.y);
    this.px = spawn.x;
    this.py = spawn.y;
    this.shadow = this.world(this.add.image(this.px, this.py, "shadow").setOrigin(0.5, 0.5).setAlpha(0.55));
    this.gShadow = this.world(this.add.image(this.gx, this.gy, "shadow").setOrigin(0.5, 0.5).setAlpha(0.55));
    this.player = this.world(this.add.sprite(this.px, this.py, "kite", rowOf("right") * FRAMES).setOrigin(0.5, 1));
    this.guard = this.world(this.add.sprite(this.gx, this.gy, "guard", rowOf("right") * FRAMES).setOrigin(0.5, 1));
    this.mark = this.world(this.add.image(this.gx, this.gy - 52, "qmark").setOrigin(0.5, 1).setVisible(false));
    this.pebbleShadow = this.world(this.add.image(0, 0, "shadow").setVisible(false).setAlpha(0.55));
    this.pebbleImg = this.world(this.add.image(0, 0, "pebble").setVisible(false).setDepth(2000));
    this.oShadow = this.world(this.add.image(this.ox, this.oy, "shadow").setOrigin(0.5, 0.5).setAlpha(0.5));
    this.officer = this.world(this.add.sprite(this.ox, this.oy, "officer", rowOf("right") * FRAMES).setOrigin(0.5, 1));
    this.hint = this.world(this.add.image(PLATE.x * TILE + 16, PLATE.y * TILE - 28, "arrow").setOrigin(0.5, 1));

    this.chrome = this.hud(this.add.graphics().setDepth(5800));
    this.flash = this.hud(this.add.image(0, 0, "px").setTint(0xa83838).setAlpha(0).setDepth(8000));
    this.fade = this.hud(this.add.image(0, 0, "px").setTint(0x1a1210).setAlpha(0).setDepth(9000));
    this.wireBox = this.hud(this.add.image(0, 0, "wirebox").setOrigin(0, 0).setDepth(7000));
    this.arrow = this.hud(this.add.image(0, 0, "arrow").setDepth(7100));
    this.dim = this.hud(this.add.image(0, 0, "px").setTint(0x140e0c).setAlpha(0.62).setDepth(7150).setVisible(false));
    this.itemBox = this.hud(this.add.image(0, 0, "itemcard").setDepth(7200).setVisible(false));
    this.itemIcon = this.hud(this.add.image(0, 0, "leaflet").setDepth(7210).setVisible(false));
    this.stickImg = this.hud(this.add.image(0, 0, "stick").setDepth(6400).setAlpha(0.86));
    this.stickKnob = this.hud(this.add.image(0, 0, "knob").setDepth(6410).setAlpha(0.96));
    this.marker = this.hud(this.add.image(0, 0, "eye").setDepth(6600).setVisible(false));
    this.caption = this.hud(this.add.image(0, 0, "caption").setOrigin(0.5, 0).setDepth(6200));
    this.leafletIcon = this.hud(this.add.image(0, 0, "leaflet").setDepth(6000));
    this.leafletCount = this.hud(this.add.image(0, 0, "count0").setDepth(6000));

    for (let i = 0; i < 3; i++) {
      this.heartsImg.push(this.hud(this.add.image(0, 0, "heart").setOrigin(0, 0).setDepth(6000)));
    }
    this.sel = this.hud(this.add.graphics().setDepth(6300));
    (["kite", "veil", "key"] as const).forEach((id) => {
      const img = this.hud(this.add.image(0, 0, `port-${id}`).setOrigin(0, 0).setDepth(6100));
      this.ports.push({ id, img });
    });

    const kb = this.input.keyboard;
    if (kb) this.keys = kb.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.addPointer(4);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.onUp(p));
    this.scale.on("resize", (size: Phaser.Structs.Size) => this.applyFrame(size.width, size.height));
    this.applyFrame(w0, h0);
    this.publish();
  }

  private bellPoint(): { x: number; y: number } {
    return { x: BELL.x * TILE + 16, y: 3 * TILE + 36 };
  }

  private applyFrame(w: number, h: number): void {
    this.frame = layoutFrame(w, h, readSafe());
    const f = this.frame;
    this.cameras.main.setViewport(f.viewX, f.viewY, f.viewW, f.viewH);
    this.uiCam.setSize(w, h);
    this.chrome.clear();
    this.chrome.fillStyle(0x1a1210, 1);
    this.chrome.fillRect(0, 0, w, f.viewY);
    this.chrome.fillRect(0, f.viewY + f.viewH, w, Math.max(0, h - (f.viewY + f.viewH)));
    if (f.viewX > 0) this.chrome.fillRect(0, f.viewY, f.viewX, f.viewH);
    const right = f.viewX + f.viewW;
    if (right < w) this.chrome.fillRect(right, f.viewY, w - right, f.viewH);
    this.chrome.fillStyle(0xc4a04a, 1);
    this.chrome.fillRect(0, f.viewY - 2, w, 2);
    this.chrome.fillRect(0, f.viewY + f.viewH, w, 2);

    this.flash.setPosition(w / 2, h / 2).setDisplaySize(w, h);
    this.fade.setPosition(w / 2, h / 2).setDisplaySize(w, h);
    this.dim.setPosition(w / 2, h / 2).setDisplaySize(w, h);
    const boxW = this.wireBox.width;
    const boxH = this.wireBox.height;
    const boxX = f.viewX + Math.max(8, Math.floor((f.viewW - boxW) / 2));
    const boxY = f.viewY + f.viewH - boxH - 8;
    this.wireBox.setPosition(boxX, boxY);
    this.arrow.setPosition(boxX + boxW - 22, boxY + boxH - 16);
    this.itemBox.setPosition(f.viewX + f.viewW / 2, f.viewY + f.viewH / 2);
    this.itemIcon.setPosition(f.viewX + f.viewW / 2 - 108, f.viewY + f.viewH / 2);
    this.stickImg.setPosition(f.stickX, f.stickY);
    this.stickKnob.setPosition(f.stickX, f.stickY);
    this.caption.setPosition(f.captionX, f.captionY);
    for (let i = 0; i < 3; i++) this.heartsImg[i].setPosition(f.viewX + 8 + i * 18, f.viewY - 22);
    this.leafletIcon.setPosition(f.viewX + f.viewW - 36, f.viewY - 16);
    this.leafletCount.setPosition(f.viewX + f.viewW - 16, f.viewY - 20);
    this.ports.forEach((port, i) => {
      const at = f.ports[i];
      port.img.setPosition(at.x, at.y).setDisplaySize(f.port, f.port);
    });
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
    const drop = (key: string, tx: number, ty: number, ox = 0.5, oy = 1) => {
      const at = anchor(tx, ty);
      const img = this.world(this.add.image(at.x, at.y + 2, key).setOrigin(ox, oy).setDepth(at.y));
      this.world(this.add.image(at.x, at.y, "shadow").setOrigin(0.5, 0.5).setAlpha(0.45).setDepth(at.y - 2));
      return img;
    };
    const glowAt = (x: number, y: number) => {
      const glow = this.world(this.add.image(x, y, "glow").setOrigin(0.5, 0.6).setAlpha(0.55).setDepth(2));
      glow.setBlendMode(Phaser.BlendModes.ADD);
      this.glows.push(glow);
    };
    this.world(this.add.image(WELL.x * TILE, WELL.y * TILE + 8, "well").setOrigin(0, 0).setDepth((WELL.y + 2) * TILE));
    drop("matka", 8, 5);
    drop("sack", 9, 5);
    drop("tulsi", 6, 4);
    drop("matka", 10, 4);
    drop("tulsi", 14, 4);
    drop("matka", 7, 9);
    drop("sack", 7, 10);
    drop("tulsi", 28, 6);
    drop("tulsi", 22, 10);
    drop("pillar", 12, 6);
    const bike = anchor(BICYCLE.x, BICYCLE.y);
    this.world(this.add.image(bike.x + 4, bike.y, "bicycle").setOrigin(0.35, 1).setDepth(bike.y));
    const cotY = 10 * TILE + 18;
    this.world(this.add.image(16 * TILE + 2, cotY, "charpoy").setOrigin(0, 1).setDepth(cotY));
    this.world(this.add.image(TONGA.x * TILE - 2, (TONGA.y + 1) * TILE, "tonga").setOrigin(0, 1).setDepth((TONGA.y + 1) * TILE));
    const stallY = 11 * TILE;
    this.world(this.add.image(8 * TILE + 2, stallY, "stall").setOrigin(0, 1).setDepth(stallY));
    this.world(this.add.image(14 * TILE + 20, 10 * TILE + 16, "bench").setOrigin(0.5, 1).setDepth(10 * TILE + 16));
    drop("press", 35, 6);
    drop("sack", 37, 6);
    drop("matka", 35, 9);
    // Bracketed jharokhas. The sill hangs into the yard, so the player can walk in front of it.
    for (const x of [9 * TILE + 16, 17 * TILE]) {
      const y = 4 * TILE + 8;
      this.world(this.add.image(x, y, "jharokha").setOrigin(0, 1).setDepth(y));
    }
    for (const x of [6, 19, 22, 30]) {
      const lx = x * TILE + 16;
      this.lanterns.push(this.world(this.add.image(lx, TILE + 8, "lantern").setOrigin(0.5, 0).setDepth(3 * TILE)));
      glowAt(lx, 3 * TILE + 8);
    }
    for (const [x, y] of [[8, 4], [27, 4], [36, 4], [36, 9]] as const) {
      this.diyas.push(this.world(this.add.image(x * TILE + 16, y * TILE + 8, "diya").setOrigin(0.5, 1).setDepth((y + 1) * TILE)));
      glowAt(x * TILE + 16, y * TILE + 4);
    }
    for (const x of [70, 20 * TILE]) {
      const cloth = this.world(this.add.image(x, 2 * TILE + 4, "laundry").setOrigin(0, 0).setDepth(4 * TILE));
      cloth.setData("base", "laundry");
      this.laundry.push(cloth);
    }
    // Steam climbs off the degchi on the left of the stall counter.
    this.steam = this.world(this.add.image(8 * TILE + 36, 11 * TILE - 52, "steam0").setOrigin(0.5, 1).setDepth(11 * TILE));
    // Two birds on the left ledge, one on the ledge further along the wall.
    for (const x of [24, 48, 15 * TILE + 28]) {
      const y = TILE + 30;
      const bird = this.world(this.add.image(x, y, "pigeon").setOrigin(0.5, 1).setDepth(y + 8));
      bird.setData("home", y);
      this.pigeons.push(bird);
    }
    for (const [x, y, p] of [[180, 200, 0.2], [420, 240, 1.4], [300, 160, 2.2], [640, 210, 3.1], [260, 300, 4.0]] as const) {
      const mote = this.world(this.add.image(x, y, "mote").setDepth(y).setAlpha(0.7));
      mote.setData("homeX", x);
      mote.setData("homeY", y);
      mote.setData("p", p);
      this.motes.push(mote);
    }
  }

  private crateAnchor(tx: number, ty: number): { x: number; y: number } {
    return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 2 };
  }

  private inStick(x: number, y: number): boolean {
    const f = this.frame;
    return Math.hypot(x - f.stickX, y - f.stickY) < f.stickGrab;
  }

  private setStick(x: number, y: number): void {
    const f = this.frame;
    let dx = x - f.stickX;
    let dy = y - f.stickY;
    const mag = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(mag, f.stickThrow);
    dx = (dx / mag) * clamped;
    dy = (dy / mag) * clamped;
    this.stickKnob.setPosition(f.stickX + dx, f.stickY + dy);
    const amount = clamped / f.stickThrow;
    if (amount < STICK_DEAD) {
      this.stickDx = 0;
      this.stickDy = 0;
      return;
    }
    const scaled = (amount - STICK_DEAD) / (1 - STICK_DEAD);
    this.stickDx = (dx / clamped) * scaled;
    this.stickDy = (dy / clamped) * scaled;
  }

  private releaseStick(): void {
    this.stickId = -1;
    this.stickDx = 0;
    this.stickDy = 0;
    this.stickKnob.setPosition(this.frame.stickX, this.frame.stickY);
  }

  private stickAim(): { x: number; y: number } | null {
    if (this.stickDx === 0 && this.stickDy === 0) return null;
    return { x: this.stickDx, y: this.stickDy };
  }

  private onDown(p: Phaser.Input.Pointer): void {
    this.sfx.unlock();
    this.lastTap = { x: Math.round(p.x), y: Math.round(p.y) };
    if (this.talking || this.itemUp) {
      if (this.tapId === -1) {
        this.tapId = p.id;
        this.dismissTalk = this.talking;
        this.dismissItem = this.itemUp;
      }
      return;
    }
    if (this.stickId === -1 && this.inStick(p.x, p.y) && !this.dying) {
      this.stickId = p.id;
      this.setStick(p.x, p.y);
      return;
    }
    if (this.tapId !== -1) return;
    this.tapId = p.id;
    this.downX = p.x;
    this.downY = p.y;
    this.dragged = false;
    this.pending = null;
    this.dismissTalk = false;
    this.dismissItem = false;
    if (this.dying || this.lock) return;
    const port = this.portAt(p.x, p.y);
    if (port) {
      this.switchTo(port);
      return;
    }
    const f = this.frame;
    if (p.x < f.viewX || p.x >= f.viewX + f.viewW || p.y < f.viewY || p.y >= f.viewY + f.viewH) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const hit = this.hitWorld(w.x, w.y);
    if (hit) this.pending = hit;
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id === this.stickId) {
      this.setStick(p.x, p.y);
      return;
    }
    if (p.id !== this.tapId || this.talking || this.itemUp) return;
    if (Math.hypot(p.x - this.downX, p.y - this.downY) > 12) {
      this.dragged = true;
      this.pending = null;
    }
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.stickId) {
      this.releaseStick();
      return;
    }
    if (p.id !== this.tapId) return;
    this.tapId = -1;
    if (this.dismissTalk && this.talking) {
      this.talking = false;
      this.wireBox.setVisible(false);
      this.arrow.setVisible(false);
      this.dismissTalk = false;
      this.sfx.startMusic();
      return;
    }
    if (this.dismissItem && this.itemUp) {
      this.hideItem();
      this.dismissItem = false;
      return;
    }
    if (this.pending && !this.dragged) {
      this.beginInteract(this.pending);
      this.pending = null;
    }
  }

  private portAt(x: number, y: number): Spy | null {
    const s = this.frame.port;
    for (const port of this.ports) {
      if (x >= port.img.x && y >= port.img.y && x < port.img.x + s && y < port.img.y + s) return port.id;
    }
    return null;
  }

  private switchTo(id: Spy): void {
    if (this.lock) return;
    if (id === this.who) {
      if (id === "veil") this.toggleVeil();
      else if (id === "kite") this.kiteAbility();
      else this.useGate();
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
    this.puff(this.px, this.py - 20, 6);
  }

  private kiteAbility(): void {
    const bell = this.bellPoint();
    if (Math.hypot(this.px - bell.x, this.py - bell.y) < 320) this.throwAt("bell");
    else if (Math.hypot(this.px - this.gx, this.py - this.gy) < 300) this.throwAt("guard");
  }

  private hitWorld(x: number, y: number): Then | null {
    if (Math.hypot(x - this.gx, y - (this.gy - 28)) < 44) return "guard";
    const bell = this.bellPoint();
    if (Math.hypot(x - bell.x, y - bell.y) < 40) return "bell";
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
      if (d < 44) this.jab();
      else if (this.who === "kite" && d < 300) this.throwAt("guard");
      return;
    }
    if (kind === "bell") {
      const bell = this.bellPoint();
      if (this.who === "kite" && Math.hypot(this.px - bell.x, this.py - bell.y) < 320) this.throwAt("bell");
      return;
    }
    if (kind === "gate") {
      if (this.adjacent(GATE.x, GATE.y)) this.useGate();
      return;
    }
    if (kind === "leaf") {
      if (this.grateOpen && this.adjacent(LEAF.x, LEAF.y)) this.pickup();
      return;
    }
    if (!this.adjacent(this.crateTx, this.crateTy)) return;
    const dx = Math.sign(this.crateTx * TILE + 16 - this.px) || 1;
    const dy = Math.sign(this.crateTy * TILE + 20 - this.py);
    const sx = Math.abs(this.crateTx * TILE + 16 - this.px) >= Math.abs(this.crateTy * TILE + 20 - this.py) ? dx : 0;
    const sy = sx === 0 ? (dy || 1) : 0;
    this.tryPush(sx, sy);
  }

  private throwAt(target: "bell" | "guard"): void {
    if (this.who !== "kite" || this.lock) return;
    const bell = this.bellPoint();
    const tx = target === "bell" ? bell.x : this.gx;
    const ty = target === "bell" ? bell.y : this.gy - 24;
    this.facing = this.faceOf(tx - this.px, ty - this.py);
    this.lock = { kind: "throw", t: 0, dur: 460, target };
    this.pebbleShot = false;
  }

  private jab(): void {
    if (this.lock) return;
    this.facing = this.faceOf(this.gx - this.px, this.gy - this.py);
    this.lock = { kind: "jab", t: 0, dur: 180 };
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
  }

  private pickup(): void {
    if (this.leafletGot || !this.grateOpen || this.leafFlash > 0) return;
    if (!this.adjacent(LEAF.x, LEAF.y)) return;
    this.leafFlash = 2;
  }

  private finishPickup(): void {
    this.leafletGot = true;
    this.leaf.setVisible(false);
    this.showItem();
  }

  private showItem(): void {
    this.itemUp = true;
    this.dim.setVisible(true).setAlpha(0.62);
    this.itemBox.setVisible(true).setScale(0.72);
    this.itemIcon.setVisible(true);
    this.tweens.add({ targets: this.itemBox, scale: 1, duration: 180, ease: "Back.Out" });
    this.tweens.add({ targets: this.itemIcon, scale: 2.6, duration: 180, ease: "Back.Out" });
    this.sfx.jingle();
  }

  private hideItem(): void {
    this.itemUp = false;
    this.itemBox.setVisible(false);
    this.itemIcon.setVisible(false);
    this.dim.setVisible(false);
  }

  private pressPlate(): void {
    if (this.grateOpen) return;
    this.grateOpen = true;
    this.sfx.rumble();
    this.shake(2, 240);
    this.hint.setVisible(false);
    this.rune.setVisible(false);
    const dustY = this.grate.y;
    this.tweens.add({
      targets: this.grate,
      y: this.grate.y - 52,
      alpha: 0,
      duration: 380,
      onComplete: () => this.grate.setVisible(false),
    });
    this.puff(this.grate.x, dustY, 10);
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

  private bodyHits(cx: number, foot: number, halfW: number, halfH: number, guardSolid: boolean, officerSolid = true): boolean {
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
    if (officerSolid && Math.hypot(cx - this.ox, foot - this.oy) < 14) return true;
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
    const cl = this.crateTx * TILE;
    const ct = this.crateTy * TILE;
    return l < cl + TILE && r > cl && t < ct + TILE && b > ct;
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
    return Math.hypot(this.px - ox, this.py - oy);
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
    const aim = this.keyVector() ?? this.stickAim();
    if (aim && Math.abs(aim.x) > 0.35) this.lookX = aim.x > 0 ? 1 : -1;
    const viewW = this.frame.viewW;
    const viewH = this.frame.viewH;
    const lead = 88;
    const maxX = Math.max(0, MAP_W * TILE - viewW);
    const maxY = Math.max(0, MAP_H * TILE - viewH);
    const destX = Phaser.Math.Clamp(this.px + this.lookX * lead - viewW * 0.5, 0, maxX);
    const destY = Phaser.Math.Clamp(this.py - viewH * 0.55, 0, maxY);
    cam.scrollX += (destX - cam.scrollX) * 0.14;
    cam.scrollY += (destY - cam.scrollY) * 0.14;
    if (this.px - 28 < cam.scrollX) cam.scrollX = this.px - 28;
    if (this.px + 28 > cam.scrollX + viewW) cam.scrollX = this.px + 28 - viewW;
    if (this.py - 56 < cam.scrollY) cam.scrollY = this.py - 56;
    if (this.py + 8 > cam.scrollY + viewH) cam.scrollY = this.py + 8 - viewH;
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

  private guardVector(): { x: number; y: number } {
    if (this.gFacing === "left") return { x: -1, y: 0 };
    if (this.gFacing === "right") return { x: 1, y: 0 };
    if (this.gFacing === "up") return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }

  private seesPlayer(): boolean {
    if (this.disguise || this.gState === "stun" || this.gState === "bell") return false;
    const { x: fx, y: fy } = this.guardVector();
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
      if (this.gState === "bell") this.gFacePoint(this.bellPoint().x, this.bellPoint().y);
      if (this.gTimer <= 0) this.gState = "patrol";
    }
    this.heard = false;
  }

  private updateOfficer(dt: number): void {
    const goal = this.oDir > 0 ? anchor(OFFICER_B.x, OFFICER_B.y) : anchor(OFFICER_A.x, OFFICER_A.y);
    if (this.oIdle > 0) {
      this.oIdle -= dt;
      if (this.oIdle <= 0) this.oFacing = this.oDir > 0 ? "right" : "left";
      return;
    }
    const dx = goal.x - this.ox;
    if (Math.abs(dx) < 2) {
      this.ox = goal.x;
      this.oDir *= -1;
      this.oIdle = 700;
      this.oFacing = this.oDir > 0 ? "right" : "left";
      return;
    }
    const step = Math.min(Math.abs(dx), (32 * dt) / 1000);
    const nx = this.ox + Math.sign(dx) * step;
    if (Math.hypot(nx - this.px, this.oy - this.py) < 18) {
      this.oIdle = 320;
      return;
    }
    if (!this.bodyHits(nx, this.oy, 8, 10, false, false)) this.ox = nx;
    this.oFacing = dx > 0 ? "right" : "left";
    this.oStep += step;
    if (this.oStep >= 7) {
      this.oStep -= 7;
      this.oFrame = (this.oFrame + 1) % FRAMES;
    }
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
    this.grate.setVisible(true).setAlpha(1).setAngle(0).setPosition(g.x, g.y + 12);
    this.hint.setVisible(true);
    this.rune.setVisible(true);
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
      const s = this.world(this.add.image(x, y, "spark").setDepth(4000));
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
      const s = this.world(this.add.image(x + (i - n / 2) * 4, y, "dust").setDepth(y));
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
    this.puff(tx, ty, 8);
    this.puff(tx, ty - 4, 4);
    if (hit === "bell") {
      this.gState = "bell";
      this.gTimer = 3000;
      const bell = this.bellPoint();
      this.gFacePoint(bell.x, bell.y);
      this.bellT = 900;
      this.burst(bell.x, bell.y, 4);
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
    const bell = this.bellPoint();
    const tx = hit === "bell" ? bell.x : this.gx;
    const ty = hit === "bell" ? bell.y - 8 : this.gy - 16;
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

  private applyActor(img: Phaser.GameObjects.Sprite, kind: Kind, facing: Facing, col: number, x: number, y: number, _moving: boolean): void {
    const frame = rowOf(facing) * FRAMES + (col % FRAMES);
    if (img.texture.key !== kind) img.setTexture(kind, frame);
    else img.setFrame(frame);
    img.setPosition(Math.round(x), Math.round(y));
    img.setDepth(y);
    img.setScale(1);
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
    const tick = Math.floor(this.time.now / 160);
    for (const lantern of this.lanterns) lantern.setTexture(tick % 2 === 0 ? "lantern" : "lantern2");
    for (const diya of this.diyas) diya.setTexture(tick % 2 === 0 ? "diya" : "diya2");
    for (const cloth of this.laundry) {
      const base = cloth.getData("base") as string;
      cloth.setTexture(tick % 2 === 0 ? base : `${base}b`);
    }
    const steamFrame = Math.floor(this.time.now / 140) % 3;
    this.steam.setTexture(`steam${steamFrame}`);
    this.steam.setY(11 * TILE - 48 - steamFrame * 6);
    const birdKeys = ["pigeon", "pigeon2", "pigeon3"];
    for (const bird of this.pigeons) {
      const frame = Math.floor(this.time.now / 280 + bird.x) % 3;
      bird.setTexture(birdKeys[frame]);
      const peck = frame === 2 ? 3 : 0;
      bird.setY((bird.getData("home") as number) + Math.sin(this.time.now / 320 + bird.x) * 3 + peck);
    }
    for (const mote of this.motes) {
      const t = this.time.now / 900 + (mote.getData("p") as number);
      mote.setPosition((mote.getData("homeX") as number) + Math.sin(t) * 8, (mote.getData("homeY") as number) + Math.cos(t * 0.8) * 5);
      mote.setAlpha(0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3)));
    }
    for (const glow of this.glows) glow.setAlpha(0.16 + 0.34 * (0.5 + 0.5 * Math.sin(this.time.now / 180 + glow.x)));
    this.arrow.setVisible(this.talking && Math.floor(this.time.now / 400) % 2 === 0);
    if (!this.grateOpen) {
      this.hint.setY(PLATE.y * TILE - 36 + Math.sin(this.time.now / 160) * 8);
      this.rune.setAlpha(0.55 + Math.sin(this.time.now / 160) * 0.45);
    }
    if (this.flash.alpha > 0) this.flash.setAlpha(Math.max(0, this.flash.alpha - dt / 140));

    if (this.dying) {
      this.fade.setAlpha(Math.min(1, this.fade.alpha + dt / 320));
      if (this.fade.alpha >= 1) this.respawn();
    } else if (this.fade.alpha > 0) this.fade.setAlpha(Math.max(0, this.fade.alpha - dt / 260));

    this.moved = 0;
    if (!this.talking && !this.itemUp && !this.dying) {
      this.updateOfficer(dt);
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
            this.tweens.add({
              targets: this.gate,
              x: GATE.x * TILE + 46,
              angle: -8,
              duration: 420,
              ease: "Cubic.Out",
            });
            this.puff(GATE.x * TILE + 16, GATE.y * TILE + 18, 6);
          } else if (done.kind === "cloak") {
            this.disguise = !!done.on;
            this.disguiseT = done.on ? 8000 : 0;
            this.puff(this.px, this.py - 16, 7);
          }
        }
      } else {
        const aim = this.keyVector() ?? this.stickAim();
        if (aim) {
          this.facing = this.faceOf(aim.x, aim.y);
          this.moved = this.moveBy((aim.x * SPEED * dt) / 1000, (aim.y * SPEED * dt) / 1000);
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
      const arc = Math.sin(t * Math.PI) * 72;
      this.pebbleImg.setPosition(x, groundY - arc).setVisible(true).setDepth(4000);
      this.pebbleShadow.setPosition(x, groundY).setVisible(true).setAlpha(0.25 + (1 - arc / 72) * 0.4).setDepth(groundY - 1);
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
    if (this.gState === "sus") this.gFacing = this.faceOf(this.px - this.gx, this.py - this.gy);
    const gMoving = this.gState === "patrol" ? this.gIdle <= 0 : this.gState === "chase";
    this.applyActor(this.guard, "guard", this.gFacing, gMoving ? this.gWalk : 0, this.gx, this.gy, gMoving);
    this.gShadow.setPosition(this.gx, this.gy - 2).setDepth(this.gy - 1);
    const oMoving = this.oIdle <= 0;
    this.applyActor(this.officer, "officer", this.oFacing, oMoving ? this.oFrame : 0, this.ox, this.oy, oMoving);
    this.oShadow.setPosition(this.ox, this.oy - 2).setDepth(this.oy - 1);
    this.crate.setDepth(this.crate.y);
    this.grate.setDepth(this.grate.y);
    this.gate.setDepth(this.gate.y + 36);

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
    this.placeMarker();
    this.layoutHud();
    this.updateCamera();
    this.publish();
  }

  private placeMarker(): void {
    const f = this.frame;
    const cam = this.cameras.main;
    const sx = this.gx - cam.scrollX;
    const sy = this.gy - 36 - cam.scrollY;
    const dist = Math.max(Math.abs(this.px - this.gx), Math.abs(this.py - this.gy));
    const off = sx < 4 || sx > f.viewW - 4 || sy < 4 || sy > f.viewH - 4;
    if (!off || dist > 8 * TILE) {
      this.marker.setVisible(false);
      return;
    }
    const x = sx < 4 ? f.viewX + 14 : sx > f.viewW - 4 ? f.viewX + f.viewW - 14 : f.viewX + Phaser.Math.Clamp(sx, 14, f.viewW - 14);
    const y = f.viewY + Phaser.Math.Clamp(sy, 16, f.viewH - 16);
    this.marker.setPosition(x, y).setVisible(true);
  }

  private drawCone(): void {
    this.cone.clear();
    if (this.gState === "stun" || this.gState === "bell") return;
    const { x: fx, y: fy } = this.guardVector();
    const rx = -fy;
    const ry = fx;
    const ox = this.gx + fx * 10;
    const oy = this.gy - 30 + fy * 6;
    const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(ox, oy)];
    for (let i = 0; i <= 6; i++) {
      const side = -1 + (2 * i) / 6;
      const tx = ox + fx * 120 + rx * side * 40;
      const ty = oy + fy * 120 + ry * side * 40;
      const dx = tx - ox;
      const dy = ty - oy;
      const len = Math.hypot(dx, dy) || 1;
      let hit = 1;
      for (let d = 8; d < len; d += 8) {
        const x = ox + (dx / len) * d;
        const y = oy + (dy / len) * d;
        if (this.tileSolid(Math.floor(x / TILE), Math.floor(y / TILE))) {
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
    this.leafletCount.setTexture(this.leafletGot ? "count1" : "count0");
    this.sel.clear();
    const s = this.frame.port;
    for (const port of this.ports) {
      const on = port.id === this.who;
      port.img.setAlpha(on ? 1 : 0.78);
      if (on) {
        this.sel.lineStyle(2, 0xf0d878, 1);
        this.sel.strokeRect(port.img.x - 3, port.img.y - 3, s + 6, s + 6);
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
      officer: { x: this.ox, y: this.oy, facing: this.oFacing },
      crate: { x: this.crateTx, y: this.crateTy },
      grate: this.grateOpen,
      gate: this.gateOpen,
      leaflet: this.leafletGot,
      talking: this.talking,
      item: this.itemUp,
      cam: { x: cam.scrollX, y: cam.scrollY },
      onScreen: left >= -1 && left + 64 <= this.frame.viewW + 1 && top >= -1 && this.py - cam.scrollY <= this.frame.viewH + 1,
      view: { w: this.frame.viewW, h: this.frame.viewH },
      marker: this.marker.visible,
      shakes: this.shakes.slice(),
      sfx: sfxEver.slice(),
      sfxRecent: sfxLog.slice(),
      keyboardPrompt: false,
      lock: this.lock?.kind ?? "",
      audio: this.sfx.status(),
      pebble: this.pebble !== null,
      stick: { x: this.stickDx, y: this.stickDy, down: this.stickId >= 0 },
      tap: this.lastTap,
    };
    (window as unknown as { __INQ: typeof debug }).__INQ = debug;
  }
}
