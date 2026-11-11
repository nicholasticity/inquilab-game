import Phaser from "phaser";
import { Yard } from "./scene";

const GAME_W = 320;
const GAME_H = 180;

function fit(): void {
  const canvas = document.querySelector("#game canvas") as HTMLCanvasElement | null;
  const rotate = document.getElementById("rotate");
  const portrait = window.innerHeight > window.innerWidth;
  if (rotate) rotate.hidden = !portrait;
  if (!canvas) return;
  const z = Math.max(1, Math.floor(Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H)));
  const cssW = `${GAME_W * z}px`;
  const cssH = `${GAME_H * z}px`;
  canvas.style.setProperty("width", cssW, "important");
  canvas.style.setProperty("height", cssH, "important");
  canvas.style.setProperty("image-rendering", "pixelated", "important");
  const host = document.getElementById("game");
  if (host) {
    host.style.width = cssW;
    host.style.height = cssH;
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#1a1210",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  banner: false,
  fps: { target: 60 },
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_W,
    height: GAME_H,
  },
  input: { activePointers: 2 },
  scene: [Yard],
  audio: { disableWebAudio: false },
});

game.events.once("ready", () => {
  fit();
  requestAnimationFrame(fit);
});
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 80));
