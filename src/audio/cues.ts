import type Phaser from "phaser";

export const CUE_NAMES = [
  "ui_tap",
  "ui_deny",
  "step_soft",
  "step_hard",
  "guard_step",
  "wait",
  "stone_arc",
  "stone_land",
  "notice",
  "alert",
  "subdue",
  "pickup",
  "hide",
  "radio",
  "success",
] as const;

export type CueName = (typeof CUE_NAMES)[number];

const heard: string[] = [];
let muted = false;
let ctx: AudioContext | null = null;
let phaserReady = false;

export function recentCues(): string[] {
  return heard.slice();
}

export function setMuted(next: boolean): void {
  muted = next;
}

export function isMuted(): boolean {
  return muted;
}

export function setPhaserReady(next: boolean): void {
  phaserReady = next;
}

function context(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = context();
  if (audio.state === "suspended") void audio.resume();
}

function env(samples: Float32Array, attack: number, release: number): void {
  const a = Math.min(samples.length, Math.floor(attack));
  const r = Math.min(samples.length, Math.floor(release));
  for (let i = 0; i < a; i += 1) samples[i] *= i / a;
  for (let i = 0; i < r; i += 1) samples[samples.length - 1 - i] *= i / r;
}

function tone(freq: number, seconds: number, shape: "sine" | "square" | "triangle" = "sine", vol = 0.3): Float32Array {
  const rate = 22050;
  const n = Math.floor(rate * seconds);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const p = (i / rate) * freq;
    const u = p - Math.floor(p);
    let s = Math.sin(u * Math.PI * 2);
    if (shape === "square") s = u < 0.5 ? 1 : -1;
    if (shape === "triangle") s = u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
    out[i] = s * vol;
  }
  env(out, rate * 0.01, rate * seconds * 0.45);
  return out;
}

function noise(seconds: number, vol = 0.25): Float32Array {
  const rate = 22050;
  const n = Math.floor(rate * seconds);
  const out = new Float32Array(n);
  let seed = 3;
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 16807) % 2147483647;
    out[i] = ((seed / 2147483647) * 2 - 1) * vol;
  }
  env(out, rate * 0.005, rate * seconds * 0.55);
  return out;
}

function mixTo(target: Float32Array, src: Float32Array, offset = 0): void {
  for (let i = 0; i < src.length && offset + i < target.length; i += 1) {
    target[offset + i] += src[i];
  }
}

export function renderCue(name: CueName): Float32Array {
  if (name === "ui_tap") return tone(880, 0.05, "sine", 0.22);
  if (name === "ui_deny") return tone(150, 0.09, "square", 0.12);
  if (name === "step_soft") return noise(0.06, 0.18);
  if (name === "step_hard") {
    const out = noise(0.07, 0.22);
    mixTo(out, tone(180, 0.07, "sine", 0.12));
    return out;
  }
  if (name === "guard_step") return noise(0.08, 0.2);
  if (name === "wait") return tone(420, 0.1, "sine", 0.12);
  if (name === "stone_arc") {
    const rate = 22050;
    const n = Math.floor(rate * 0.16);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const f = 600 + (800 * i) / n;
      out[i] = Math.sin((i / rate) * f * Math.PI * 2) * 0.18;
    }
    env(out, 40, 800);
    return out;
  }
  if (name === "stone_land") {
    const out = noise(0.09, 0.24);
    mixTo(out, tone(1200, 0.08, "sine", 0.12));
    return out;
  }
  if (name === "notice") {
    const out = new Float32Array(22050 * 0.2);
    mixTo(out, tone(740, 0.09, "sine", 0.2));
    mixTo(out, tone(560, 0.1, "sine", 0.18), 22050 * 0.09);
    return out;
  }
  if (name === "alert") {
    const out = noise(0.18, 0.16);
    mixTo(out, tone(180, 0.18, "square", 0.1));
    return out;
  }
  if (name === "subdue") {
    const out = noise(0.1, 0.28);
    mixTo(out, tone(90, 0.1, "sine", 0.16));
    return out;
  }
  if (name === "pickup") {
    const out = new Float32Array(22050 * 0.18);
    mixTo(out, tone(660, 0.08, "triangle", 0.18));
    mixTo(out, tone(990, 0.1, "triangle", 0.16), 22050 * 0.07);
    return out;
  }
  if (name === "hide") return tone(280, 0.12, "sine", 0.14);
  if (name === "radio") {
    const out = noise(0.18, 0.12);
    mixTo(out, tone(800, 0.08, "sine", 0.1), 800);
    return out;
  }
  const out = new Float32Array(22050 * 0.36);
  mixTo(out, tone(523, 0.12, "triangle", 0.16));
  mixTo(out, tone(659, 0.12, "triangle", 0.16), 22050 * 0.1);
  mixTo(out, tone(784, 0.16, "triangle", 0.16), 22050 * 0.2);
  return out;
}

function wav(samples: Float32Array): ArrayBuffer {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buf);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true);
  view.setUint32(28, 44100, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }
  return buf;
}

export function cueWavs(): { key: string; data: ArrayBuffer }[] {
  return CUE_NAMES.map((key) => ({ key, data: wav(renderCue(key)) }));
}

function playBuffer(samples: Float32Array): void {
  const audio = context();
  const buffer = audio.createBuffer(1, samples.length, 22050);
  buffer.getChannelData(0).set(samples);
  const src = audio.createBufferSource();
  const gain = audio.createGain();
  gain.gain.value = 0.7;
  src.buffer = buffer;
  src.connect(gain);
  gain.connect(audio.destination);
  src.start();
}

export function playCue(name: CueName, scene?: Phaser.Scene): void {
  if (muted) return;
  heard.push(name);
  if (heard.length > 400) heard.splice(0, heard.length - 400);
  unlockAudio();
  try {
    if (phaserReady && scene?.cache.audio.exists(name)) {
      scene.sound.play(name, { volume: 0.5 });
      return;
    }
  } catch {
    /* synth below */
  }
  try {
    playBuffer(renderCue(name));
  } catch {
    /* the cue is still logged for the playtest */
  }
}
