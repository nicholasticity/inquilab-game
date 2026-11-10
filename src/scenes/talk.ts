import Phaser from "phaser";
import { isMuted, playCue, recentCues, unlockAudio } from "../audio/cues";
import { publish } from "../app/probe";
import { buildMission } from "../missions";
import { campaign } from "../app/campaign";
import { NAMES } from "../missions/story";
import { buttonFace, inkWash, label, plaque } from "./chrome";
import { GAME_H, GAME_W } from "../render/layout";
import type { BriefLine } from "../sim/types";

const SKIP = { x: 560, y: 470, w: 160, h: 48 };
const NEXT = { x: 740, y: 470, w: 180, h: 48 };

export class Talk extends Phaser.Scene {
  private missionId = 1;
  private lines: BriefLine[] = [];
  private index = 0;
  private shown = 0;
  private tex!: Phaser.Textures.CanvasTexture;
  private name = "";

  constructor() {
    super("talk");
  }

  init(data: { missionId?: number }): void {
    this.missionId = data.missionId ?? 1;
    const mission = buildMission(this.missionId, campaign.story);
    this.lines = mission?.brief ?? [];
    this.index = 0;
    this.shown = 0;
    this.name = mission?.name ?? "";
  }

  create(): void {
    if (this.textures.exists("talk-ui")) this.textures.remove("talk-ui");
    const tex = this.textures.createCanvas("talk-ui", GAME_W, GAME_H);
    if (!tex) throw new Error("talk ui");
    this.tex = tex;
    this.add.image(0, 0, "talk-ui").setOrigin(0, 0);
    playCue("radio", this);
    this.input.on("pointerdown", () => unlockAudio());
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.tap(pointer.x, pointer.y));
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Enter" || event.code === "Space") this.advance();
    });
    this.redraw();
  }

  update(_time: number, delta: number): void {
    const line = this.lines[this.index];
    if (!line) return;
    const next = Math.min(line.text.length, this.shown + delta * 0.055);
    if (next !== this.shown) {
      this.shown = next;
      this.redraw();
    }
  }

  private tap(x: number, y: number): void {
    if (x >= SKIP.x && x <= SKIP.x + SKIP.w && y >= SKIP.y && y <= SKIP.y + SKIP.h) {
      playCue("ui_tap", this);
      this.scene.start("play", { missionId: this.missionId });
      return;
    }
    if (x >= NEXT.x && x <= NEXT.x + NEXT.w && y >= NEXT.y && y <= NEXT.y + NEXT.h) this.advance();
    else if (x > 360) this.advance();
  }

  private advance(): void {
    const line = this.lines[this.index];
    if (line && this.shown < line.text.length) {
      this.shown = line.text.length;
      this.redraw();
      return;
    }
    playCue("ui_tap", this);
    if (this.index >= this.lines.length - 1) {
      this.scene.start("play", { missionId: this.missionId });
      return;
    }
    this.index += 1;
    this.shown = 0;
    playCue("radio", this);
    this.redraw();
  }

  private redraw(): void {
    const ctx = this.tex.getContext();
    const line = this.lines[this.index];
    inkWash(ctx);
    plaque(ctx, 36, 36, 300, 400);
    const key = "portrait-" + (line?.who ?? "wire");
    if (this.textures.exists(key)) {
      const img = this.textures.get(key).getSourceImage() as HTMLImageElement;
      ctx.save();
      ctx.beginPath();
      ctx.rect(52, 88, 268, 268);
      ctx.clip();
      ctx.drawImage(img, 52, 88, 268, 268);
      ctx.restore();
      ctx.strokeStyle = "#e2bc7a";
      ctx.lineWidth = 3;
      ctx.strokeRect(52, 88, 268, 268);
    }
    label(ctx, "RADIO", 52, 62, 14, { color: "#e2bc7a" });
    label(ctx, NAMES[line?.who ?? "wire"] ?? "WIRE", 52, 378, 22, { weight: 700 });
    label(ctx, this.name, 380, 70, 22, { weight: 700 });
    this.wrap(ctx, (line?.text ?? "").slice(0, Math.floor(this.shown)), 380, 120, 520);
    buttonFace(ctx, SKIP.x, SKIP.y, SKIP.w, SKIP.h, "Skip");
    buttonFace(ctx, NEXT.x, NEXT.y, NEXT.w, NEXT.h, "Continue");
    this.tex.refresh();
    publish({
      scene: "talk",
      room: null,
      player: null,
      guards: [],
      cones: [],
      teach: null,
      pill: line?.text ?? "",
      phase: "talk",
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
      text: (line?.text ?? "") + " Skip Continue",
      walkT: null,
    });
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number): void {
    ctx.fillStyle = "#f3e6c0";
    ctx.font = '600 22px Georgia, "Liberation Serif", serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const words = text.split(" ");
    let line = "";
    let cy = y;
    for (const word of words) {
      const trial = line ? line + " " + word : word;
      if (ctx.measureText(trial).width > width) {
        ctx.fillText(line, x, cy);
        line = word;
        cy += 30;
      } else line = trial;
    }
    if (line) ctx.fillText(line, x, cy);
  }
}
