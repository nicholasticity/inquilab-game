import Phaser from "phaser";
import { isMuted, playCue, recentCues, unlockAudio } from "../audio/cues";
import { publish } from "../app/probe";
import { resetStory } from "../app/campaign";
import { buttonFace, contains } from "./chrome";
import { GAME_H, GAME_W } from "../render/layout";

const BEGIN = { x: 36, y: 448, w: 150, h: 52 };
const MISSIONS = { x: 202, y: 448, w: 170, h: 52 };

export class Title extends Phaser.Scene {
  private tex!: Phaser.Textures.CanvasTexture;
  private ready = false;

  constructor() {
    super("title");
  }

  create(): void {
    this.add.image(0, 0, "title").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H);
    if (this.textures.exists("title-ui")) this.textures.remove("title-ui");
    const tex = this.textures.createCanvas("title-ui", GAME_W, GAME_H);
    if (!tex) throw new Error("title ui");
    this.tex = tex;
    this.add.image(0, 0, "title-ui").setOrigin(0, 0);
    this.draw();
    this.ready = true;
    this.input.on("pointerdown", () => unlockAudio());
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (contains(pointer.x, pointer.y, BEGIN)) this.begin();
      else if (contains(pointer.x, pointer.y, MISSIONS)) this.missions();
    });
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Enter" || event.code === "Space") this.begin();
    });
    this.publish();
  }

  private draw(): void {
    const ctx = this.tex.getContext();
    ctx.clearRect(0, 0, GAME_W, GAME_H);
    ctx.fillStyle = "rgba(16, 12, 14, 0.55)";
    ctx.fillRect(28, 28, 340, 78);
    ctx.fillStyle = "#f3e6c0";
    ctx.font = '700 42px Georgia, "Liberation Serif", serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("INQUILAB", 44, 52);
    ctx.font = '600 16px Georgia, "Liberation Serif", serif';
    ctx.fillStyle = "#e2bc7a";
    ctx.fillText("Shadow Raj", 46, 84);
    buttonFace(ctx, BEGIN.x, BEGIN.y, BEGIN.w, BEGIN.h, "Begin");
    buttonFace(ctx, MISSIONS.x, MISSIONS.y, MISSIONS.w, MISSIONS.h, "Missions");
    this.tex.refresh();
  }

  private begin(): void {
    if (!this.ready) return;
    playCue("ui_tap", this);
    resetStory();
    this.scene.start("talk", { missionId: 1 });
  }

  private missions(): void {
    playCue("ui_tap", this);
    this.scene.start("select");
  }

  private publish(): void {
    publish({
      scene: "title",
      room: null,
      player: null,
      guards: [],
      cones: [],
      teach: null,
      pill: "",
      phase: "title",
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
      text: "INQUILAB Begin Missions",
      walkT: null,
    });
  }
}
