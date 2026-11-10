import Phaser from "phaser";
import { isMuted, playCue, recentCues, unlockAudio } from "../audio/cues";
import { campaign } from "../app/campaign";
import { publish } from "../app/probe";
import { buildMission } from "../missions";
import { MISSION_CARDS } from "../missions/story";
import { buttonFace, inkWash, label, plaque } from "./chrome";
import { GAME_H, GAME_W } from "../render/layout";

export class Select extends Phaser.Scene {
  private tex!: Phaser.Textures.CanvasTexture;

  constructor() {
    super("select");
  }

  create(): void {
    if (this.textures.exists("select-ui")) this.textures.remove("select-ui");
    const tex = this.textures.createCanvas("select-ui", GAME_W, GAME_H);
    if (!tex) throw new Error("select ui");
    this.tex = tex;
    this.add.image(0, 0, "select-ui").setOrigin(0, 0);
    this.draw();
    this.input.on("pointerdown", () => unlockAudio());
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.tap(pointer.x, pointer.y));
    this.publish();
  }

  private row(index: number): { x: number; y: number; w: number; h: number } {
    return { x: 70, y: 78 + index * 68, w: 820, h: 60 };
  }

  private draw(): void {
    const ctx = this.tex.getContext();
    inkWash(ctx);
    label(ctx, "Missions", 70, 40, 28, { weight: 700 });
    MISSION_CARDS.forEach((card, index) => {
      const open = card.id <= campaign.unlocked && buildMission(card.id, campaign.story) !== null;
      const rect = this.row(index);
      plaque(ctx, rect.x, rect.y, rect.w, rect.h, { dim: !open });
      label(ctx, card.id + "   " + card.name, rect.x + 18, rect.y + 22, 20, {
        color: open ? "#f3e6c0" : "#8a7050",
        weight: 700,
      });
      const tail = open ? "" : "   ·   Ahead";
      label(ctx, card.agent + "  ·  " + card.blurb + tail, rect.x + 18, rect.y + 42, 14, {
        color: open ? "#e2bc7a" : "#6a5844",
      });
    });
    buttonFace(ctx, 70, 486, 140, 40, "Back");
    this.tex.refresh();
  }

  private tap(x: number, y: number): void {
    if (x >= 70 && x <= 210 && y >= 486 && y <= 526) {
      playCue("ui_tap", this);
      this.scene.start("title");
      return;
    }
    MISSION_CARDS.forEach((card, index) => {
      const rect = this.row(index);
      const open = card.id <= campaign.unlocked && buildMission(card.id, campaign.story) !== null;
      if (!open) return;
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        playCue("ui_tap", this);
        this.scene.start("talk", { missionId: card.id });
      }
    });
  }

  private publish(): void {
    publish({
      scene: "select",
      room: null,
      player: null,
      guards: [],
      cones: [],
      teach: null,
      pill: "",
      phase: "select",
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
      text: MISSION_CARDS.map((card) => card.name).join(" "),
      walkT: null,
    });
  }
}
