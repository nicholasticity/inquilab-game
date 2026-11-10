import Phaser from "phaser";
import { isMuted, playCue, recentCues, unlockAudio } from "../audio/cues";
import { publish } from "../app/probe";
import { buttonFace, inkWash, label, plaque } from "./chrome";

interface ResultData {
  missionId: number;
  rank: string;
  headline: string;
  lines: string[];
  turns: number;
  caught: number;
}

export class Result extends Phaser.Scene {
  private info: ResultData = { missionId: 1, rank: "S", headline: "", lines: [], turns: 0, caught: 0 };
  private tex!: Phaser.Textures.CanvasTexture;

  constructor() {
    super("result");
  }

  init(data: ResultData): void {
    this.info = {
      missionId: data.missionId ?? 1,
      rank: data.rank ?? "C",
      headline: data.headline ?? "",
      lines: data.lines ?? [],
      turns: data.turns ?? 0,
      caught: data.caught ?? 0,
    };
  }

  create(): void {
    if (this.textures.exists("result-ui")) this.textures.remove("result-ui");
    const tex = this.textures.createCanvas("result-ui", 960, 540);
    if (!tex) throw new Error("result ui");
    this.tex = tex;
    this.add.image(0, 0, "result-ui").setOrigin(0, 0);
    this.draw();
    this.input.on("pointerdown", () => unlockAudio());
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x >= 680 && pointer.x <= 920 && pointer.y >= 460 && pointer.y <= 520) {
        playCue("ui_tap", this);
        if (this.info.missionId === 1) this.scene.start("talk", { missionId: 2 });
        else this.scene.start("select");
      }
    });
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Enter" || event.code === "Space") {
        if (this.info.missionId === 1) this.scene.start("talk", { missionId: 2 });
        else this.scene.start("select");
      }
    });
    publish({
      scene: "result",
      room: null,
      player: null,
      guards: [],
      cones: [],
      teach: null,
      pill: this.info.headline,
      phase: "result",
      muted: isMuted(),
      cues: recentCues(),
      result: { rank: this.info.rank, headline: this.info.headline },
      notice: null,
      fps: 60,
      playable: false,
      noticeAt: null,
      playableAt: null,
      nodes: [],
      queue: 0,
      text: this.info.headline + " " + this.info.lines.join(" "),
      walkT: null,
    });
  }

  private draw(): void {
    const ctx = this.tex.getContext();
    inkWash(ctx);
    plaque(ctx, 48, 36, 160, 160);
    label(ctx, this.info.rank, 128, 116, 92, { align: "center", weight: 700, color: "#f3e6c0" });
    label(ctx, "RANK", 128, 176, 14, { align: "center", color: "#e2bc7a" });
    label(ctx, this.info.headline, 230, 80, 26, { weight: 700, max: 680 });
    label(ctx, "Turns " + this.info.turns + "    Caught " + this.info.caught, 230, 124, 16, { color: "#e2bc7a" });
    this.info.lines.forEach((line, index) => {
      this.wrap(ctx, line, 230, 170 + index * 52, 680);
    });
    buttonFace(ctx, 700, 462, 210, 52, this.info.missionId === 1 ? "Continue" : "Missions");
    this.tex.refresh();
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number): void {
    ctx.fillStyle = "#f3e6c0";
    ctx.font = '600 16px Georgia, "Liberation Serif", serif';
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
        cy += 20;
      } else line = trial;
    }
    if (line) ctx.fillText(line, x, cy);
  }
}
