export const sfxLog: string[] = [];
/** Every cue that has fired this page, including ones the recent log has scrolled past. */
export const sfxEver: string[] = [];

function remember(name: string): void {
  sfxLog.push(name);
  if (!sfxEver.includes(name)) sfxEver.push(name);
  if (sfxLog.length > 80) sfxLog.shift();
}

/**
 * Tiny chiptune voice. If the browser blocks audio, calls still resolve
 * and the game keeps going.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private musicOn = false;
  private nextAt = 0;
  private step = 0;
  failed = false;

  status(): string {
    if (this.failed) return "failed";
    if (!this.ctx) return "none";
    return this.ctx.state;
  }

  unlock(): void {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        this.failed = true;
        return;
      }
      if (!this.ctx) {
        this.ctx = new AC();
        const n = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
        const d = n.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = n;
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.failed = true;
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private burst(dur: number, gain: number, rate = 1): void {
    if (!this.ctx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = rate;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400 * rate;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  stepSound(pitch: number): void {
    remember("step");
    this.burst(0.05, 0.05, pitch);
    this.tone(140 * pitch, 0.04, "square", 0.02);
  }

  whoosh(): void {
    remember("whoosh");
    this.burst(0.12, 0.06, 1.8);
  }

  clink(): void {
    remember("clink");
    this.tone(1480, 0.07, "square", 0.05);
    this.tone(980, 0.09, "square", 0.03, 0.04);
  }

  rustle(on: boolean): void {
    remember(on ? "rustle-on" : "rustle-off");
    this.burst(0.16, 0.05, on ? 1.4 : 0.8);
  }

  pick(): void {
    remember("pick");
    this.tone(880, 0.05, "square", 0.04);
    this.tone(1320, 0.06, "square", 0.04, 0.07);
  }

  slide(): void {
    remember("slide");
    this.tone(220, 0.28, "sawtooth", 0.03, 0, 90);
  }

  question(): void {
    remember("question");
    this.tone(520, 0.1, "square", 0.05);
    this.tone(660, 0.14, "square", 0.05, 0.1);
  }

  alarm(): void {
    remember("alarm");
    this.tone(220, 0.28, "sawtooth", 0.06, 0, 880);
  }

  jingle(): void {
    remember("jingle");
    const notes = [659, 784, 988, 1318];
    notes.forEach((n, i) => this.tone(n, 0.16, "triangle", 0.05, i * 0.09));
  }

  thud(): void {
    remember("thud");
    this.tone(110, 0.1, "square", 0.06, 0, 60);
  }

  rattle(): void {
    remember("rattle");
    this.tone(180, 0.07, "square", 0.04);
    this.burst(0.08, 0.04, 0.6);
  }

  rumble(): void {
    remember("rumble");
    this.burst(0.22, 0.07, 0.35);
    this.tone(70, 0.2, "sawtooth", 0.04);
  }

  startMusic(): void {
    if (this.musicOn) return;
    this.unlock();
    if (!this.ctx) {
      remember("music-blocked");
      return;
    }
    this.musicOn = true;
    this.nextAt = this.ctx.currentTime + 0.05;
    this.step = 0;
    remember("music");
  }

  /** Schedule a quiet courtyard loop a little ahead of the playhead. */
  pump(): void {
    if (!this.musicOn || !this.ctx) return;
    const scale = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63];
    while (this.nextAt < this.ctx.currentTime + 0.4) {
      const n = scale[this.step % scale.length];
      this.tone(n, 0.36, "triangle", 0.018, this.nextAt - this.ctx.currentTime);
      if (this.step % 8 === 0) this.tone(110, 0.4, "triangle", 0.02, this.nextAt - this.ctx.currentTime);
      this.nextAt += 0.42;
      this.step++;
    }
  }
}
