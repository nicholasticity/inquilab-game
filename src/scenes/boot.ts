import Phaser from "phaser";
import { cueWavs, setPhaserReady } from "../audio/cues";
import titleUrl from "../art/bg/title.webp";
import netajiUrl from "../art/portraits/netaji.webp";
import wireUrl from "../art/portraits/wire.webp";
import kiteUrl from "../art/portraits/kite.webp";
import veilUrl from "../art/portraits/veil.webp";
import keyUrl from "../art/portraits/key.webp";

export class Boot extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.image("title", titleUrl);
    this.load.image("portrait-netaji", netajiUrl);
    this.load.image("portrait-wire", wireUrl);
    this.load.image("portrait-kite", kiteUrl);
    this.load.image("portrait-veil", veilUrl);
    this.load.image("portrait-key", keyUrl);
  }

  create(): void {
    const params = new URLSearchParams(location.search);
    const next = params.get("demo") === "walk" ? "strip" : "title";
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      document.getElementById("loading")?.remove();
      this.scene.start(next);
    };
    const sound = this.sound;
    if ("decodeAudio" in sound) {
      sound.once("decodedall", () => {
        setPhaserReady(true);
        go();
      });
      sound.decodeAudio(cueWavs());
    } else go();
    this.time.delayedCall(1200, go);
  }
}
