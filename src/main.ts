import Phaser from "phaser";
import { Boot } from "./scenes/boot";
import { Title } from "./scenes/title";
import { Select } from "./scenes/select";
import { Talk } from "./scenes/talk";
import { Play } from "./scenes/play";
import { Result } from "./scenes/result";
import { Strip } from "./scenes/strip";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "frame",
  width: 960,
  height: 540,
  backgroundColor: "#100c0e",
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    roundPixels: false,
    antialias: true,
    pixelArt: false,
  },
  input: {
    mouse: { preventDefaultWheel: true },
    touch: { capture: true },
  },
  scene: [Boot, Title, Select, Talk, Play, Result, Strip],
});
