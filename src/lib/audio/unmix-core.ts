import { fft, hann } from "./fft";
import { STEM_IDS, type StemId } from "../stem-ids";

export type UnmixInput = {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
};

export type UnmixResult = {
  stems: Record<StemId, Float32Array>;
  sampleRate: number;
};

const NFFT = 2048;
const HOP = 512;
const BINS = NFFT / 2 + 1;

function median5(a: number, b: number, c: number, d: number, e: number): number {
  const x = [a, b, c, d, e];
  x.sort((u, v) => u - v);
  return x[2]!;
}

function magAt(
  spec: Float32Array,
  frames: number,
  t: number,
  k: number,
): number {
  const tt = t < 0 ? 0 : t >= frames ? frames - 1 : t;
  return spec[tt * BINS + k]!;
}

/**
 * Spectral unmix: mid/side vocal extraction + harmonic/percussive split +
 * frequency masks. Isolation is strongest on vocals, drums, and bass.
 */
export function unmix(
  input: UnmixInput,
  onProgress?: (p: number) => void,
): UnmixResult {
  const { sampleRate } = input;
  let left = input.left;
  let right = input.right;
  const n0 = Math.min(left.length, right.length);

  // Downsample 2:1 if the tape is hotter than 48 kHz — keeps the split snappy.
  let sr = sampleRate;
  if (sr > 48000) {
    const factor = Math.round(sr / 44100);
    if (factor > 1) {
      const n = Math.floor(n0 / factor);
      const l = new Float32Array(n);
      const r = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        l[i] = left[i * factor]!;
        r[i] = right[i * factor]!;
      }
      left = l;
      right = r;
      sr = sr / factor;
    }
  }

  const n = Math.min(left.length, right.length);
  const frames = Math.max(1, Math.floor((n - NFFT) / HOP) + 1);
  const win = hann(NFFT);

  const magL = new Float32Array(frames * BINS);
  const magR = new Float32Array(frames * BINS);
  const reL = new Float32Array(frames * BINS);
  const imL = new Float32Array(frames * BINS);
  const reR = new Float32Array(frames * BINS);
  const imR = new Float32Array(frames * BINS);

  const frameRe = new Float32Array(NFFT);
  const frameIm = new Float32Array(NFFT);

  const report = (p: number) => {
    onProgress?.(Math.max(0, Math.min(1, p)));
  };

  for (let t = 0; t < frames; t++) {
    const pos = t * HOP;
    frameIm.fill(0);
    for (let i = 0; i < NFFT; i++) {
      frameRe[i] = (left[pos + i] ?? 0) * win[i]!;
    }
    fft(frameRe, frameIm, false);
    const base = t * BINS;
    for (let k = 0; k < BINS; k++) {
      reL[base + k] = frameRe[k]!;
      imL[base + k] = frameIm[k]!;
      magL[base + k] = Math.hypot(frameRe[k]!, frameIm[k]!);
    }

    frameIm.fill(0);
    for (let i = 0; i < NFFT; i++) {
      frameRe[i] = (right[pos + i] ?? 0) * win[i]!;
    }
    fft(frameRe, frameIm, false);
    for (let k = 0; k < BINS; k++) {
      reR[base + k] = frameRe[k]!;
      imR[base + k] = frameIm[k]!;
      magR[base + k] = Math.hypot(frameRe[k]!, frameIm[k]!);
    }

    if ((t & 31) === 0) report((t / frames) * 0.45);
  }

  const magMid = new Float32Array(frames * BINS);
  for (let i = 0; i < magMid.length; i++) {
    magMid[i] = 0.5 * (magL[i]! + magR[i]!);
  }

  const harm = new Float32Array(frames * BINS);
  const perc = new Float32Array(frames * BINS);

  for (let t = 0; t < frames; t++) {
    const base = t * BINS;
    for (let k = 0; k < BINS; k++) {
      const h = median5(
        magAt(magMid, frames, t - 2, k),
        magAt(magMid, frames, t - 1, k),
        magAt(magMid, frames, t, k),
        magAt(magMid, frames, t + 1, k),
        magAt(magMid, frames, t + 2, k),
      );
      const p = median5(
        magAt(magMid, frames, t, Math.max(0, k - 2)),
        magAt(magMid, frames, t, Math.max(0, k - 1)),
        magAt(magMid, frames, t, k),
        magAt(magMid, frames, t, Math.min(BINS - 1, k + 1)),
        magAt(magMid, frames, t, Math.min(BINS - 1, k + 2)),
      );
      const h2 = h * h;
      const p2 = p * p;
      const den = h2 + p2 + 1e-12;
      harm[base + k] = h2 / den;
      perc[base + k] = p2 / den;
    }
    if ((t & 31) === 0) report(0.45 + (t / frames) * 0.15);
  }

  const hzPerBin = sr / NFFT;
  const masks: Record<StemId, Float32Array> = {
    lead: new Float32Array(frames * BINS),
    feature: new Float32Array(frames * BINS),
    drums: new Float32Array(frames * BINS),
    bass: new Float32Array(frames * BINS),
    guitar: new Float32Array(frames * BINS),
    keys: new Float32Array(frames * BINS),
    other: new Float32Array(frames * BINS),
  };

  // Soft frequency ramps (Hz).
  const ramp = (f: number, lo: number, hi: number) => {
    if (f <= lo) return 0;
    if (f >= hi) return 1;
    return (f - lo) / (hi - lo);
  };

  for (let t = 0; t < frames; t++) {
    const base = t * BINS;
    let energy = 0;
    for (let k = 0; k < BINS; k++) energy += magMid[base + k]!;
    const mean = energy / BINS;
    const leadGate = mean * 1.15;

    for (let k = 0; k < BINS; k++) {
      const f = k * hzPerBin;
      const i = base + k;
      const ml = magL[i]!;
      const mr = magR[i]!;
      const mid = 0.5 * (ml + mr);
      const side = Math.abs(ml - mr) * 0.5;
      const center = mid / (mid + side + 1e-8);

      const vocalBand =
        ramp(f, 140, 220) * (1 - ramp(f, 3800, 5200));
      const bassBand = 1 - ramp(f, 160, 280);
      const lowMid = ramp(f, 180, 280) * (1 - ramp(f, 1400, 2200));
      const highMid = ramp(f, 400, 700) * (1 - ramp(f, 4200, 6500));
      const air = ramp(f, 5000, 8000);

      const h = harm[i]!;
      const p = perc[i]!;

      const lead =
        center * center * center * vocalBand * h * (mid > leadGate ? 1 : 0.35);
      const feature =
        center * vocalBand * h * (1 - lead) * (0.45 + 0.55 * (1 - center));
      const bass = bassBand * (0.65 + 0.35 * h) * (1 - lead * 0.25);
      const drums =
        p * (1 - bassBand * 0.35) * (1 - lead * 0.4) + air * p * 0.6;
      const restH = h * (1 - lead) * (1 - feature) * (1 - bass);
      const guitar = restH * lowMid * (0.35 + 0.65 * (1 - center));
      const keys = restH * highMid * (1 - guitar * 0.4);
      const other = Math.max(
        0,
        1 - (lead + feature + drums + bass + guitar + keys),
      );

      const raw = [lead, feature, drums, bass, guitar, keys, other];
      let sum = 0;
      for (const v of raw) sum += Math.max(0, v);
      const norm = sum < 1e-8 ? 1 : sum;
      masks.lead[i] = Math.max(0, lead) / norm;
      masks.feature[i] = Math.max(0, feature) / norm;
      masks.drums[i] = Math.max(0, drums) / norm;
      masks.bass[i] = Math.max(0, bass) / norm;
      masks.guitar[i] = Math.max(0, guitar) / norm;
      masks.keys[i] = Math.max(0, keys) / norm;
      masks.other[i] = Math.max(0, other) / norm;
    }
    if ((t & 31) === 0) report(0.6 + (t / frames) * 0.1);
  }

  const outLen = (frames - 1) * HOP + NFFT;
  const stems = {} as Record<StemId, Float32Array>;
  const acc = new Float32Array(outLen);
  const winAcc = new Float32Array(outLen);
  const outRe = new Float32Array(NFFT);
  const outIm = new Float32Array(NFFT);

  let si = 0;
  for (const id of STEM_IDS) {
    acc.fill(0);
    winAcc.fill(0);
    const mask = masks[id];
    for (let t = 0; t < frames; t++) {
      const base = t * BINS;
      outRe.fill(0);
      outIm.fill(0);
      for (let k = 0; k < BINS; k++) {
        const m = mask[base + k]!;
        const lr = reL[base + k]!;
        const li = imL[base + k]!;
        const rr = reR[base + k]!;
        const ri = imR[base + k]!;
        const vr = 0.5 * (lr + rr) * m;
        const vi = 0.5 * (li + ri) * m;
        outRe[k] = vr;
        outIm[k] = vi;
        if (k > 0 && k < NFFT / 2) {
          outRe[NFFT - k] = vr;
          outIm[NFFT - k] = -vi;
        }
      }
      fft(outRe, outIm, true);
      const pos = t * HOP;
      for (let i = 0; i < NFFT; i++) {
        const w = win[i]!;
        acc[pos + i]! += outRe[i]! * w;
        winAcc[pos + i]! += w * w;
      }
    }
    const pcm = new Float32Array(n);
    const copy = Math.min(n, outLen);
    for (let i = 0; i < copy; i++) {
      pcm[i] = acc[i]! / (winAcc[i]! + 1e-8);
    }
    stems[id] = pcm;
    si += 1;
    report(0.7 + (si / STEM_IDS.length) * 0.28);
  }

  report(1);
  return { stems, sampleRate: sr };
}
