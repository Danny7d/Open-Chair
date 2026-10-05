import { effectiveGain, STEM_IDS, type StemId, type StemState } from "../stems";

export type LoopRegion = { start: number; end: number } | null;

type StemNode = {
  buffer: AudioBuffer;
  gain: GainNode;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode | null;
};

class StemPlayer {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private stems = new Map<StemId, StemNode>();
  private playing = false;
  private startedAt = 0;
  private offsetAtStart = 0;
  private rate = 1;
  duration = 0;
  loop: LoopRegion = null;
  private loopTimer: number | null = null;
  private clickBuf: AudioBuffer | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async resume(): Promise<void> {
    const ctx = this.ensure();
    if (ctx.state !== "running") await ctx.resume();
  }

  load(stems: Record<StemId, AudioBuffer>): void {
    const ctx = this.ensure();
    this.stopSources();
    for (const node of this.stems.values()) {
      try {
        node.gain.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    this.stems.clear();
    this.duration = 0;
    for (const id of STEM_IDS) {
      const buffer = stems[id];
      this.duration = Math.max(this.duration, buffer.duration);
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      gain.connect(analyser);
      analyser.connect(this.master!);
      this.stems.set(id, { buffer, gain, analyser, source: null });
    }
    this.offsetAtStart = 0;
    this.playing = false;
  }

  applyStates(states: Record<StemId, StemState>): void {
    const ctx = this.ctx;
    if (!ctx) return;
    for (const id of STEM_IDS) {
      const node = this.stems.get(id);
      if (!node) continue;
      const g = effectiveGain(id, states);
      node.gain.gain.setTargetAtTime(g, ctx.currentTime, 0.03);
    }
  }

  getTime(): number {
    if (!this.ctx) return this.offsetAtStart;
    if (!this.playing) return this.offsetAtStart;
    const t =
      this.offsetAtStart +
      (this.ctx.currentTime - this.startedAt) * this.rate;
    return Math.min(this.duration, Math.max(0, t));
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setRate(rate: number): void {
    const t = this.getTime();
    this.rate = rate;
    if (this.playing) {
      this.startAt(t);
    }
  }

  getRate(): number {
    return this.rate;
  }

  async play(from?: number): Promise<void> {
    await this.resume();
    const t = from ?? this.getTime();
    this.startAt(t);
  }

  pause(): void {
    const t = this.getTime();
    this.stopSources();
    this.offsetAtStart = t;
    this.playing = false;
  }

  seek(t: number): void {
    const clamped = Math.min(this.duration, Math.max(0, t));
    if (this.playing) this.startAt(clamped);
    else this.offsetAtStart = clamped;
  }

  stop(): void {
    this.stopSources();
    this.offsetAtStart = 0;
    this.playing = false;
  }

  levels(): Record<StemId, number> {
    const out = {} as Record<StemId, number>;
    const data = new Uint8Array(128);
    for (const id of STEM_IDS) {
      const node = this.stems.get(id);
      if (!node) {
        out[id] = 0;
        continue;
      }
      node.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i]! - 128) / 128;
        sum += v * v;
      }
      out[id] = Math.sqrt(sum / data.length);
    }
    return out;
  }

  async countIn(bpm: number): Promise<void> {
    await this.resume();
    const ctx = this.ctx!;
    const beat = 60 / bpm;
    const buf = this.makeClick();
    for (let i = 0; i < 4; i++) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.7 : 0.4;
      src.connect(g);
      g.connect(ctx.destination);
      src.start(ctx.currentTime + i * beat);
    }
    await new Promise((r) => setTimeout(r, beat * 4 * 1000));
  }

  exportMix(states: Record<StemId, StemState>): Blob {
    const sr = this.stems.get("lead")?.buffer.sampleRate ?? 44100;
    const length = Math.floor(this.duration * sr);
    const L = new Float32Array(length);
    const R = new Float32Array(length);
    for (const id of STEM_IDS) {
      const g = effectiveGain(id, states);
      if (g <= 0.001) continue;
      const buf = this.stems.get(id)?.buffer;
      if (!buf) continue;
      const c0 = buf.getChannelData(0);
      const c1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : c0;
      const n = Math.min(length, c0.length, c1.length);
      for (let i = 0; i < n; i++) {
        L[i]! += c0[i]! * g;
        R[i]! += c1[i]! * g;
      }
    }
    return encodeWav(L, R, sr);
  }

  private startAt(offset: number): void {
    const ctx = this.ensure();
    this.stopSources();
    const when = ctx.currentTime;
    this.startedAt = when;
    this.offsetAtStart = offset;
    this.playing = true;
    for (const node of this.stems.values()) {
      const src = ctx.createBufferSource();
      src.buffer = node.buffer;
      src.playbackRate.value = this.rate;
      src.connect(node.gain);
      src.start(when, offset);
      node.source = src;
    }
    this.armLoop();
  }

  private armLoop(): void {
    if (this.loopTimer != null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (!this.loop || !this.playing) return;
    const remain = (this.loop.end - this.getTime()) / this.rate;
    if (remain <= 0) {
      this.startAt(this.loop.start);
      return;
    }
    this.loopTimer = window.setTimeout(
      () => {
        if (this.playing && this.loop) this.startAt(this.loop.start);
      },
      Math.max(20, remain * 1000),
    );
  }

  private stopSources(): void {
    if (this.loopTimer != null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    for (const node of this.stems.values()) {
      try {
        node.source?.stop();
      } catch {
        /* already stopped */
      }
      node.source = null;
    }
  }

  private makeClick(): AudioBuffer {
    if (this.clickBuf) return this.clickBuf;
    const ctx = this.ensure();
    const n = Math.floor(ctx.sampleRate * 0.04);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      d[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 80);
    }
    this.clickBuf = b;
    return b;
  }
}

function encodeWav(
  L: Float32Array,
  R: Float32Array,
  sampleRate: number,
): Blob {
  const n = Math.min(L.length, R.length);
  const bytes = 44 + n * 4;
  const buf = new ArrayBuffer(bytes);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, L[i]!));
    const r = Math.max(-1, Math.min(1, R[i]!));
    view.setInt16(o, l * 0x7fff, true);
    view.setInt16(o + 2, r * 0x7fff, true);
    o += 4;
  }
  return new Blob([buf], { type: "audio/wav" });
}

export const player = new StemPlayer();
