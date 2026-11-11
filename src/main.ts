import Phaser from "phaser";
import { Yard } from "./scene";

function fit(game: Phaser.Game): void {
  const canvas = document.querySelector("#game canvas") as HTMLCanvasElement | null;
  const rotate = document.getElementById("rotate");
  const portrait = window.innerHeight >= window.innerWidth;
  if (rotate) rotate.hidden = portrait;
  if (!canvas || !portrait) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (game.scale.width !== w || game.scale.height !== h) game.scale.resize(w, h);
  const cssW = `${w}px`;
  const cssH = `${h}px`;
  canvas.style.setProperty("width", cssW, "important");
  canvas.style.setProperty("height", cssH, "important");
  canvas.style.setProperty("image-rendering", "pixelated", "important");
  const host = document.getElementById("game");
  if (host) {
    host.style.width = cssW;
    host.style.height = cssH;
  }
}

const portrait = window.innerHeight >= window.innerWidth;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: portrait ? window.innerWidth : 390,
  height: portrait ? window.innerHeight : 844,
  backgroundColor: "#1a1210",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  banner: false,
  fps: { target: 60 },
  scale: {
    mode: Phaser.Scale.NONE,
    width: portrait ? window.innerWidth : 390,
    height: portrait ? window.innerHeight : 844,
  },
  input: { activePointers: 4 },
  scene: [Yard],
  audio: { disableWebAudio: false },
});

game.events.once("ready", () => {
  fit(game);
  requestAnimationFrame(() => fit(game));
});
window.addEventListener("resize", () => fit(game));
window.addEventListener("orientationchange", () => setTimeout(() => fit(game), 80));
