import Phaser from "phaser";
import { isMuted, recentCues } from "../audio/cues";
import { publish } from "../app/probe";
import { GAME_H, GAME_W, groundPoint, layoutBoard } from "../render/layout";
import type { PaintModel } from "../render/model";
import { paintBoard } from "../render/painter";
import { GOLD } from "../render/palette";
import type { Dir } from "../sim/types";

const FACES: { face: Dir; fromX: number; fromY: number; toX: number; toY: number; label: string }[] = [
  { face: "up", fromX: 2, fromY: 3, toX: 2, toY: 2, label: "Up" },
  { face: "down", fromX: 5, fromY: 2, toX: 5, toY: 3, label: "Down" },
  { face: "left", fromX: 8, fromY: 2, toX: 7, toY: 2, label: "Left" },
  { face: "right", fromX: 10, fromY: 2, toX: 11, toY: 2, label: "Right" },
];

/** Four constables, one stride each way, painted by the same board pipeline. */
export class Strip extends Phaser.Scene {
  private tex!: Phaser.Textures.CanvasTexture;
  private walkT = 0.5;

  constructor() {
    super("strip");
  }

  create(): void {
    if (this.textures.exists("strip-board")) this.textures.remove("strip-board");
    const tex = this.textures.createCanvas("strip-board", GAME_W, GAME_H);
    if (!tex) throw new Error("strip");
    this.tex = tex;
    this.add.image(0, 0, "strip-board").setOrigin(0, 0);
    this.paint();
  }

  update(_time: number, delta: number): void {
    const hold = new URLSearchParams(location.search).get("hold");
    if (hold) this.walkT = Number(hold);
    else this.walkT = (this.walkT + delta / 900) % 1;
    this.paint();
  }

  private paint(): void {
    const tiles = [];
    for (let y = 1; y <= 4; y += 1) {
      for (let x = 1; x <= 12; x += 1) tiles.push({ x, y, lit: false, hide: false, gleam: null, locked: false, pit: false });
    }
    const model: PaintModel = {
      cols: 14,
      rows: 6,
      time: this.walkT * 4,
      fade: 0,
      flash: 0,
      tiles,
      cones: [],
      ghosts: [],
      rings: [],
      actors: FACES.map((step) => ({
        archetype: "constable",
        face: step.face,
        pose: "walk",
        walkT: this.walkT,
        fromX: step.fromX,
        fromY: step.fromY,
        toX: step.toX,
        toY: step.toY,
        hidden: false,
        mark: "none",
        lead: "L",
      })),
      particles: [],
      highlights: [],
    };
    const ctx = this.tex.getContext();
    paintBoard(ctx, model);
    const layout = layoutBoard(14, 6);
    ctx.fillStyle = GOLD;
    ctx.font = '700 22px Georgia, "Liberation Serif", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const step of FACES) {
      const at = groundPoint(layout, step.fromX, step.fromY);
      ctx.fillText(step.label, at.x, layout.oy - 18);
    }
    this.tex.refresh();
    publish({
      scene: "strip",
      room: "walk",
      player: null,
      guards: FACES.map((step) => ({
        id: step.face,
        x: step.toX,
        y: step.toY,
        face: step.face,
        state: "walk",
        px: 0,
        py: 0,
      })),
      cones: [],
      teach: null,
      pill: "",
      phase: "strip",
      muted: isMuted(),
      cues: recentCues(),
      result: null,
      notice: null,
      fps: 60,
      playable: false,
      noticeAt: null,
      playableAt: null,
      nodes: [],
      queue: 0,
      text: "Up Down Left Right",
      walkT: this.walkT,
    });
  }
}
