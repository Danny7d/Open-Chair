import { STEM_IDS, type SongMeta, type StemId } from "../stems";

export type StudioSong = SongMeta & {
  studioId: "after-hours" | "copper-wire" | "late-fee";
};

export const STUDIO_SONGS: StudioSong[] = [
  {
    id: "after-hours",
    studioId: "after-hours",
    title: "After Hours",
    subtitle: "Midnight trio · synth pop",
    bpm: 100,
    key: "A minor",
    duration: 0,
    kind: "studio",
    isolation: "true",
  },
  {
    id: "copper-wire",
    studioId: "copper-wire",
    title: "Copper Wire",
    subtitle: "Dust room · slow blues",
    bpm: 88,
    key: "E minor",
    duration: 0,
    kind: "studio",
    isolation: "true",
  },
  {
    id: "late-fee",
    studioId: "late-fee",
    title: "Late Fee",
    subtitle: "Basement · tight funk",
    bpm: 104,
    key: "D dorian",
    duration: 0,
    kind: "studio",
    isolation: "true",
  },
];

const SR = 44100;
let bufferFactory: OfflineAudioContext | null = null;

function midiToHz(m: number): number {
  return 440 * 2 ** ((m - 69) / 12);
}


function envADSR(
  t: number,
  dur: number,
  a = 0.01,
  d = 0.08,
  s = 0.7,
  r = 0.12,
): number {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t > dur - r) return s * Math.max(0, (dur - t) / r);
  return s;
}

function noise(): number {
  return Math.random() * 2 - 1;
}

function addMono(
  L: Float32Array,
  R: Float32Array,
  sample: Float32Array,
  at: number,
  gainL: number,
  gainR: number,
): void {
  const start = Math.floor(at * SR);
  for (let i = 0; i < sample.length; i++) {
    const n = start + i;
    if (n < 0 || n >= L.length) continue;
    const v = sample[i]!;
    L[n]! += v * gainL;
    R[n]! += v * gainR;
  }
}

const oneShots = {
  kick: null as Float32Array | null,
  snare: null as Float32Array | null,
  hat: null as Float32Array | null,
  ohat: null as Float32Array | null,
  click: null as Float32Array | null,
};

function kick(): Float32Array {
  if (oneShots.kick) return oneShots.kick;
  const n = Math.floor(SR * 0.32);
  const s = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 148 * Math.exp(-t * 22) + 36;
    phase += (2 * Math.PI * f) / SR;
    const body = Math.sin(phase) * Math.exp(-t * 14);
    const click = t < 0.01 ? noise() * (1 - t / 0.01) * 0.35 : 0;
    s[i] = body * 0.95 + click;
  }
  oneShots.kick = s;
  return s;
}

function snare(): Float32Array {
  if (oneShots.snare) return oneShots.snare;
  const n = Math.floor(SR * 0.22);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 22);
    const nz = noise() * Math.exp(-t * 16);
    s[i] = tone * 0.35 + nz * 0.7;
  }
  oneShots.snare = s;
  return s;
}

function hat(open: boolean): Float32Array {
  const key = open ? "ohat" : "hat";
  const cached = oneShots[key];
  if (cached) return cached;
  const n = Math.floor(SR * (open ? 0.28 : 0.06));
  const s = new Float32Array(n);
  let lp = 0;
  const decay = open ? 10 : 42;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = noise();
    lp += (x - lp) * 0.55;
    const hp = x - lp;
    s[i] = hp * Math.exp(-t * decay) * 0.55;
  }
  oneShots[key] = s;
  return s;
}

function pluck(freq: number, dur: number, brightness = 0.45): Float32Array {
  const nDelay = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(nDelay);
  for (let i = 0; i < nDelay; i++) buf[i] = noise();
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  let ptr = 0;
  let lp = 0;
  const damp = 0.992 - (1 - brightness) * 0.012;
  for (let i = 0; i < n; i++) {
    const a = buf[ptr]!;
    const b = buf[(ptr + 1) % nDelay]!;
    const v = (a + b) * 0.5 * damp;
    buf[ptr] = v;
    lp += (v - lp) * (0.25 + brightness * 0.5);
    s[i] = lp * envADSR(i / SR, dur, 0.002, 0.04, 0.55, 0.08);
    ptr = (ptr + 1) % nDelay;
  }
  return s;
}

function bassNote(freq: number, dur: number): Float32Array {
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  let lp = 0;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = envADSR(t, dur, 0.008, 0.08, 0.7, 0.07);
    phase += (2 * Math.PI * freq) / SR;
    const saw = ((phase / Math.PI) % 2) - 1;
    const sub = Math.sin(phase);
    const cutoff = 0.12 + 0.28 * e;
    lp += (saw - lp) * cutoff;
    s[i] = (lp * 0.7 + sub * 0.45) * e * 0.7;
  }
  return s;
}

function rhodes(freq: number, dur: number): Float32Array {
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 2.4) * envADSR(t, dur, 0.004, 0.12, 0.55, 0.2);
    const mod = Math.sin(2 * Math.PI * freq * 2 * t) * 0.55 * Math.exp(-t * 4);
    const car = Math.sin(2 * Math.PI * freq * t + mod);
    const bell = Math.sin(2 * Math.PI * freq * 7 * t) * Math.exp(-t * 10) * 0.08;
    s[i] = (car + bell) * e * 0.42;
  }
  return s;
}

function piano(freq: number, dur: number): Float32Array {
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  const partials = [1, 2.002, 3.01, 4.04, 5.08];
  const gains = [1, 0.42, 0.22, 0.1, 0.05];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.exp(-t * 3.1) * envADSR(t, dur, 0.002, 0.18, 0.4, 0.22);
    let v = 0;
    for (let p = 0; p < partials.length; p++) {
      v += Math.sin(2 * Math.PI * freq * partials[p]! * t) * gains[p]!;
    }
    s[i] = v * e * 0.28;
  }
  return s;
}

function vocal(freq: number, dur: number, formant: "ah" | "oo"): Float32Array {
  const n = Math.floor(SR * dur);
  const s = new Float32Array(n);
  const f1 = formant === "ah" ? 720 : 320;
  const f2 = formant === "ah" ? 1240 : 920;
  const f3 = formant === "ah" ? 2500 : 2200;
  let bp1 = 0,
    bp1d = 0,
    bp2 = 0,
    bp2d = 0,
    bp3 = 0,
    bp3d = 0;
  const q = 0.08;
  let phase = 0;
  const vibHz = 5.2;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = envADSR(t, dur, 0.03, 0.08, 0.85, 0.12);
    const vib = 1 + 0.012 * Math.sin(2 * Math.PI * vibHz * t);
    phase += (2 * Math.PI * freq * vib) / SR;
    const src =
      (Math.sin(phase) +
        0.35 * Math.sin(phase * 2) +
        0.12 * Math.sin(phase * 3)) *
      0.55;
    const a1 = (2 * Math.PI * f1) / SR;
    bp1d += a1 * (src - bp1) - q * bp1d;
    bp1 += a1 * bp1d;
    const a2 = (2 * Math.PI * f2) / SR;
    bp2d += a2 * (src - bp2) - q * bp2d;
    bp2 += a2 * bp2d;
    const a3 = (2 * Math.PI * f3) / SR;
    bp3d += a3 * (src - bp3) - q * bp3d;
    bp3 += a3 * bp3d;
    s[i] = (bp1 * 0.55 + bp2 * 0.35 + bp3 * 0.18) * e * 0.9;
  }
  return s;
}

function normalizeStereo(L: Float32Array, R: Float32Array, peak = 0.86): void {
  let m = 1e-8;
  for (let i = 0; i < L.length; i++) {
    const a = Math.abs(L[i]!);
    const b = Math.abs(R[i]!);
    if (a > m) m = a;
    if (b > m) m = b;
  }
  const g = peak / m;
  for (let i = 0; i < L.length; i++) {
    L[i]! *= g;
    R[i]! *= g;
  }
}

function toBuffer(L: Float32Array, R: Float32Array): AudioBuffer {
  bufferFactory ??= new OfflineAudioContext(1, 8, SR);
  const b = bufferFactory.createBuffer(2, L.length, SR);
  b.copyToChannel(L as Float32Array<ArrayBuffer>, 0);
  b.copyToChannel(R as Float32Array<ArrayBuffer>, 1);
  return b;
}

type Hit = { at: number; kind: "kick" | "snare" | "hat" | "ohat" };
type Note = {
  at: number;
  midi: number;
  dur: number;
  vel?: number;
  pan?: number;
};

type Chart = {
  bpm: number;
  bars: number;
  drums: Hit[];
  bass: Note[];
  guitar: Note[];
  keys: Note[];
  lead: Note[];
  feature: Note[];
  other: Note[];
};

function stepTime(bpm: number, bar: number, step: number): number {
  const beat = 60 / bpm;
  return (bar * 4 + step / 4) * beat;
}

function pattern(
  bpm: number,
  bars: number,
  grid: string,
  kind: Hit["kind"],
  every = 1,
  offset = 0,
): Hit[] {
  const hits: Hit[] = [];
  for (let bar = offset; bar < bars; bar += every) {
    for (let s = 0; s < grid.length; s++) {
      if (grid[s] === "x") hits.push({ at: stepTime(bpm, bar, s), kind });
    }
  }
  return hits;
}

function afterHours(): Chart {
  const bpm = 100;
  const bars = 16;
  const drums: Hit[] = [
    ...pattern(bpm, bars, "x-------x-------", "kick"),
    ...pattern(bpm, bars, "----x-------x---", "snare"),
    ...pattern(bpm, bars, "x-x-x-x-x-x-x-x-", "hat"),
    ...pattern(bpm, bars, "--------------x-", "ohat", 2, 1),
  ];
  const bass: Note[] = [];
  const bassLine = [45, 45, 48, 41, 43, 43, 41, 45]; // A2 A2 C3 F2 G2 G2 F2 A2 per 2 bars
  for (let bar = 0; bar < bars; bar++) {
    const root = bassLine[bar % 8]!;
    bass.push({ at: stepTime(bpm, bar, 0), midi: root, dur: 0.42 });
    bass.push({ at: stepTime(bpm, bar, 6), midi: root, dur: 0.18 });
    bass.push({ at: stepTime(bpm, bar, 8), midi: root + 7, dur: 0.28 });
    bass.push({ at: stepTime(bpm, bar, 12), midi: root + 5, dur: 0.22 });
  }
  const guitar: Note[] = [];
  const gChords = [
    [57, 60, 64], // Am
    [53, 57, 60], // F
    [55, 59, 62], // C/G-ish
    [55, 59, 62], // G
  ];
  for (let bar = 2; bar < bars; bar++) {
    const ch = gChords[Math.floor(bar / 2) % 4]!;
    for (const m of ch) {
      guitar.push({
        at: stepTime(bpm, bar, 2),
        midi: m,
        dur: 0.35,
        vel: 0.55,
        pan: 0.25,
      });
      guitar.push({
        at: stepTime(bpm, bar, 10),
        midi: m,
        dur: 0.3,
        vel: 0.45,
        pan: 0.25,
      });
    }
  }
  const keys: Note[] = [];
  const kProg = [
    [69, 72, 76],
    [65, 69, 72],
    [67, 71, 74],
    [67, 71, 74],
  ];
  for (let bar = 0; bar < bars; bar++) {
    const ch = kProg[Math.floor(bar / 2) % 4]!;
    for (const m of ch) {
      keys.push({
        at: stepTime(bpm, bar, 0),
        midi: m,
        dur: 1.7,
        vel: 0.5,
        pan: -0.2,
      });
    }
  }
  const leadMidi = [
    72, 74, 76, 74, 72, 69, 67, 69, 72, 76, 79, 76, 74, 72, 69, 67,
  ];
  const lead: Note[] = [];
  for (let bar = 2; bar < bars; bar++) {
    const m = leadMidi[bar % 16]!;
    lead.push({
      at: stepTime(bpm, bar, 0),
      midi: m,
      dur: 0.7,
      vel: 0.9,
    });
    lead.push({
      at: stepTime(bpm, bar, 8),
      midi: leadMidi[(bar + 4) % 16]!,
      dur: 0.55,
      vel: 0.75,
    });
  }
  const feature: Note[] = [];
  for (let bar = 6; bar < 10; bar++) {
    const m = leadMidi[bar % 16]! + 4;
    feature.push({
      at: stepTime(bpm, bar, 0),
      midi: m,
      dur: 0.85,
      vel: 0.55,
      pan: -0.45,
    });
    feature.push({
      at: stepTime(bpm, bar, 8),
      midi: leadMidi[(bar + 4) % 16]! + 3,
      dur: 0.7,
      vel: 0.45,
      pan: 0.45,
    });
  }
  for (let bar = 14; bar < bars; bar++) {
    feature.push({
      at: stepTime(bpm, bar, 0),
      midi: 76,
      dur: 1.4,
      vel: 0.5,
      pan: 0.4,
    });
  }
  const other: Note[] = [];
  for (let bar = 6; bar < bars; bar++) {
    other.push({
      at: stepTime(bpm, bar, 12),
      midi: 84,
      dur: 0.18,
      vel: 0.25,
      pan: 0.6,
    });
  }
  return { bpm, bars, drums, bass, guitar, keys, lead, feature, other };
}

function copperWire(): Chart {
  const bpm = 88;
  const bars = 12;
  const drums: Hit[] = [
    ...pattern(bpm, bars, "x-------x-------", "kick"),
    ...pattern(bpm, bars, "----x-------x---", "snare"),
    ...pattern(bpm, bars, "x---x---x---x---", "hat"),
    ...pattern(bpm, bars, "--------------x-", "ohat", 1, 0),
  ];
  const bass: Note[] = [];
  const walk = [40, 40, 40, 40, 45, 45, 40, 40, 47, 45, 40, 47];
  for (let bar = 0; bar < bars; bar++) {
    const root = walk[bar]!;
    bass.push({ at: stepTime(bpm, bar, 0), midi: root, dur: 0.55 });
    bass.push({ at: stepTime(bpm, bar, 4), midi: root, dur: 0.4 });
    bass.push({ at: stepTime(bpm, bar, 8), midi: root + 3, dur: 0.35 });
    bass.push({ at: stepTime(bpm, bar, 12), midi: root + 5, dur: 0.32 });
  }
  const guitar: Note[] = [];
  const riff = [64, 67, 69, 67, 64, 62, 64, 59];
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < 8; i++) {
      guitar.push({
        at: stepTime(bpm, bar, i * 2),
        midi: riff[i]! + (bar >= 4 && bar < 6 ? 5 : 0),
        dur: 0.28,
        vel: i % 2 === 0 ? 0.8 : 0.5,
        pan: 0.15,
      });
    }
  }
  const keys: Note[] = [];
  const chords = [
    [64, 67, 71],
    [64, 67, 71],
    [69, 72, 76],
    [64, 67, 71],
    [71, 74, 78],
    [69, 72, 76],
  ];
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[Math.floor(bar / 2) % chords.length]!;
    for (const m of ch) {
      keys.push({
        at: stepTime(bpm, bar, 0),
        midi: m - 12,
        dur: 2.4,
        vel: 0.4,
        pan: -0.3,
      });
    }
  }
  const lead: Note[] = [];
  const melody = [76, 74, 71, 69, 71, 67, 64, 67, 69, 71, 74, 76];
  for (let bar = 1; bar < bars; bar++) {
    lead.push({
      at: stepTime(bpm, bar, 0),
      midi: melody[bar % melody.length]!,
      dur: 0.85,
    });
    lead.push({
      at: stepTime(bpm, bar, 6),
      midi: melody[(bar + 3) % melody.length]!,
      dur: 0.5,
      vel: 0.7,
    });
  }
  const feature: Note[] = [];
  for (let bar = 8; bar < bars; bar++) {
    feature.push({
      at: stepTime(bpm, bar, 2),
      midi: melody[bar % melody.length]! + 3,
      dur: 0.9,
      vel: 0.5,
      pan: -0.5,
    });
  }
  const other: Note[] = [];
  for (let bar = 0; bar < bars; bar += 2) {
    other.push({
      at: stepTime(bpm, bar, 14),
      midi: 52,
      dur: 0.2,
      vel: 0.3,
      pan: -0.6,
    });
  }
  return { bpm, bars, drums, bass, guitar, keys, lead, feature, other };
}

function lateFee(): Chart {
  const bpm = 104;
  const bars = 16;
  const drums: Hit[] = [
    ...pattern(bpm, bars, "x--x----x--x----", "kick"),
    ...pattern(bpm, bars, "----x-------x---", "snare"),
    ...pattern(bpm, bars, "x-xxx-x-x-xxx-x-", "hat"),
    ...pattern(bpm, bars, "--------x-------", "ohat", 2, 1),
  ];
  const bass: Note[] = [];
  const funk = [50, 50, 57, 50, 53, 50, 55, 57];
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < 8; i++) {
      if (i === 3 || i === 7) continue;
      bass.push({
        at: stepTime(bpm, bar, i * 2),
        midi: funk[i]!,
        dur: 0.14,
        vel: i === 0 ? 0.95 : 0.7,
      });
    }
    bass.push({ at: stepTime(bpm, bar, 11), midi: 50, dur: 0.1, vel: 0.5 });
  }
  const guitar: Note[] = [];
  const skank = [62, 65, 69]; // Dm
  for (let bar = 0; bar < bars; bar++) {
    const shift = bar % 4 === 1 ? 5 : bar % 4 === 3 ? 2 : 0;
    for (const m of skank) {
      guitar.push({
        at: stepTime(bpm, bar, 4),
        midi: m + shift,
        dur: 0.14,
        vel: 0.7,
        pan: 0.3,
      });
      guitar.push({
        at: stepTime(bpm, bar, 12),
        midi: m + shift,
        dur: 0.14,
        vel: 0.65,
        pan: 0.3,
      });
    }
  }
  const keys: Note[] = [];
  const clav = [
    [65, 69, 72],
    [67, 71, 74],
    [65, 69, 72],
    [64, 67, 72],
  ];
  for (let bar = 0; bar < bars; bar++) {
    const ch = clav[bar % 4]!;
    for (const m of ch) {
      keys.push({
        at: stepTime(bpm, bar, 0),
        midi: m,
        dur: 0.16,
        vel: 0.45,
        pan: -0.25,
      });
      keys.push({
        at: stepTime(bpm, bar, 6),
        midi: m,
        dur: 0.12,
        vel: 0.35,
        pan: -0.25,
      });
      keys.push({
        at: stepTime(bpm, bar, 10),
        midi: m,
        dur: 0.12,
        vel: 0.35,
        pan: -0.25,
      });
    }
  }
  const lead: Note[] = [];
  const hook = [69, 72, 74, 72, 69, 65, 67, 69];
  for (let bar = 2; bar < bars; bar++) {
    lead.push({
      at: stepTime(bpm, bar, 0),
      midi: hook[bar % 8]!,
      dur: 0.28,
    });
    lead.push({
      at: stepTime(bpm, bar, 4),
      midi: hook[(bar + 2) % 8]!,
      dur: 0.22,
      vel: 0.75,
    });
    lead.push({
      at: stepTime(bpm, bar, 10),
      midi: hook[(bar + 4) % 8]!,
      dur: 0.4,
      vel: 0.8,
    });
  }
  const feature: Note[] = [];
  for (let bar = 8; bar < bars; bar++) {
    feature.push({
      at: stepTime(bpm, bar, 2),
      midi: hook[bar % 8]! + 3,
      dur: 0.35,
      vel: 0.5,
      pan: 0.5,
    });
    feature.push({
      at: stepTime(bpm, bar, 8),
      midi: hook[(bar + 3) % 8]! + 7,
      dur: 0.2,
      vel: 0.4,
      pan: -0.5,
    });
  }
  const other: Note[] = [];
  for (let bar = 4; bar < bars; bar++) {
    other.push({
      at: stepTime(bpm, bar, 13),
      midi: 81,
      dur: 0.08,
      vel: 0.2,
      pan: 0.7,
    });
  }
  return { bpm, bars, drums, bass, guitar, keys, lead, feature, other };
}

function durationOf(chart: Chart): number {
  const beat = 60 / chart.bpm;
  return chart.bars * 4 * beat + 0.6;
}

function renderStem(chart: Chart, id: StemId): AudioBuffer {
  const dur = durationOf(chart);
  const n = Math.floor(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);

  if (id === "drums") {
    for (const h of chart.drums) {
      const sample =
        h.kind === "kick"
          ? kick()
          : h.kind === "snare"
            ? snare()
            : hat(h.kind === "ohat");
      const pan = h.kind === "hat" || h.kind === "ohat" ? 0.2 : 0;
      const g =
        h.kind === "kick" ? 0.95 : h.kind === "snare" ? 0.72 : 0.28;
      addMono(L, R, sample, h.at, g * (1 - pan), g * (1 + pan));
    }
  } else if (id === "bass") {
    for (const note of chart.bass) {
      addMono(
        L,
        R,
        bassNote(midiToHz(note.midi), note.dur),
        note.at,
        0.9,
        0.9,
      );
    }
  } else if (id === "guitar") {
    for (const note of chart.guitar) {
      const pan = note.pan ?? 0.2;
      const g = (note.vel ?? 0.7) * 0.7;
      addMono(
        L,
        R,
        pluck(midiToHz(note.midi), note.dur, 0.55),
        note.at,
        g * (1 - pan),
        g * (1 + pan),
      );
    }
  } else if (id === "keys") {
    const fn = chart.bpm === 88 ? piano : rhodes;
    for (const note of chart.keys) {
      const pan = note.pan ?? -0.2;
      const g = (note.vel ?? 0.5) * 0.85;
      addMono(
        L,
        R,
        fn(midiToHz(note.midi), note.dur),
        note.at,
        g * (1 - pan),
        g * (1 + pan),
      );
    }
  } else if (id === "lead") {
    for (const note of chart.lead) {
      const g = (note.vel ?? 0.85) * 0.9;
      addMono(
        L,
        R,
        vocal(midiToHz(note.midi), note.dur, "ah"),
        note.at,
        g,
        g,
      );
    }
  } else if (id === "feature") {
    for (const note of chart.feature) {
      const pan = note.pan ?? 0.4;
      const g = (note.vel ?? 0.5) * 0.75;
      addMono(
        L,
        R,
        vocal(midiToHz(note.midi), note.dur, "oo"),
        note.at,
        g * (1 - pan),
        g * (1 + pan),
      );
    }
  } else if (id === "other") {
    for (const note of chart.other) {
      const pan = note.pan ?? 0.5;
      const g = (note.vel ?? 0.3) * 0.5;
      addMono(
        L,
        R,
        rhodes(midiToHz(note.midi), note.dur),
        note.at,
        g * (1 - pan),
        g * (1 + pan),
      );
    }
  }

  normalizeStereo(L, R, 0.78);
  return toBuffer(L, R);
}

const CHARTS: Record<StudioSong["studioId"], () => Chart> = {
  "after-hours": afterHours,
  "copper-wire": copperWire,
  "late-fee": lateFee,
};

export function studioDuration(id: StudioSong["studioId"]): number {
  return durationOf(CHARTS[id]());
}

export function studioMeta(id: StudioSong["studioId"]): StudioSong {
  const base = STUDIO_SONGS.find((s) => s.studioId === id)!;
  return { ...base, duration: studioDuration(id) };
}

const cache = new Map<string, Record<StemId, AudioBuffer>>();

export async function renderStudioSong(
  id: StudioSong["studioId"],
  onProgress?: (p: number) => void,
): Promise<Record<StemId, AudioBuffer>> {
  const hit = cache.get(id);
  if (hit) {
    onProgress?.(1);
    return hit;
  }
  const chart = CHARTS[id]();
  const stems = {} as Record<StemId, AudioBuffer>;
  for (let i = 0; i < STEM_IDS.length; i++) {
    const stemId = STEM_IDS[i]!;
    stems[stemId] = renderStem(chart, stemId);
    onProgress?.((i + 1) / STEM_IDS.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  cache.set(id, stems);
  return stems;
}

export function warmupStudio(): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    void renderStudioSong("after-hours");
  }, 700);
}


