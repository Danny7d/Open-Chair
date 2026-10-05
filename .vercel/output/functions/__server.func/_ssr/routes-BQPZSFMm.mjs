import { i as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Upload, v as Armchair } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as cn, c as peaksFromBuffer, d as useSession, i as STEM_IDS, l as player, n as STEMS, o as decodeAudioFile, s as formatTime, t as Button, u as splitOnDevice } from "./button-Cr--ncUy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BQPZSFMm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STUDIO_SONGS = [
	{
		id: "after-hours",
		studioId: "after-hours",
		title: "After Hours",
		subtitle: "Midnight trio · synth pop",
		bpm: 100,
		key: "A minor",
		duration: 0,
		kind: "studio",
		isolation: "true"
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
		isolation: "true"
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
		isolation: "true"
	}
];
var SR = 44100;
var bufferFactory = null;
function midiToHz(m) {
	return 440 * 2 ** ((m - 69) / 12);
}
function envADSR(t, dur, a = .01, d = .08, s = .7, r = .12) {
	if (t < 0 || t > dur) return 0;
	if (t < a) return t / a;
	if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
	if (t > dur - r) return s * Math.max(0, (dur - t) / r);
	return s;
}
function noise() {
	return Math.random() * 2 - 1;
}
function addMono(L, R, sample, at, gainL, gainR) {
	const start = Math.floor(at * SR);
	for (let i = 0; i < sample.length; i++) {
		const n = start + i;
		if (n < 0 || n >= L.length) continue;
		const v = sample[i];
		L[n] += v * gainL;
		R[n] += v * gainR;
	}
}
var oneShots = {
	kick: null,
	snare: null,
	hat: null,
	ohat: null,
	click: null
};
function kick() {
	if (oneShots.kick) return oneShots.kick;
	const n = Math.floor(SR * .32);
	const s = new Float32Array(n);
	let phase = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const f = 148 * Math.exp(-t * 22) + 36;
		phase += 2 * Math.PI * f / SR;
		const body = Math.sin(phase) * Math.exp(-t * 14);
		const click = t < .01 ? noise() * (1 - t / .01) * .35 : 0;
		s[i] = body * .95 + click;
	}
	oneShots.kick = s;
	return s;
}
function snare() {
	if (oneShots.snare) return oneShots.snare;
	const n = Math.floor(SR * .22);
	const s = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 22);
		const nz = noise() * Math.exp(-t * 16);
		s[i] = tone * .35 + nz * .7;
	}
	oneShots.snare = s;
	return s;
}
function hat(open) {
	const key = open ? "ohat" : "hat";
	const cached = oneShots[key];
	if (cached) return cached;
	const n = Math.floor(SR * (open ? .28 : .06));
	const s = new Float32Array(n);
	let lp = 0;
	const decay = open ? 10 : 42;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const x = noise();
		lp += (x - lp) * .55;
		const hp = x - lp;
		s[i] = hp * Math.exp(-t * decay) * .55;
	}
	oneShots[key] = s;
	return s;
}
function pluck(freq, dur, brightness = .45) {
	const nDelay = Math.max(2, Math.round(SR / freq));
	const buf = new Float32Array(nDelay);
	for (let i = 0; i < nDelay; i++) buf[i] = noise();
	const n = Math.floor(SR * dur);
	const s = new Float32Array(n);
	let ptr = 0;
	let lp = 0;
	const damp = .992 - (1 - brightness) * .012;
	for (let i = 0; i < n; i++) {
		const v = (buf[ptr] + buf[(ptr + 1) % nDelay]) * .5 * damp;
		buf[ptr] = v;
		lp += (v - lp) * (.25 + brightness * .5);
		s[i] = lp * envADSR(i / SR, dur, .002, .04, .55, .08);
		ptr = (ptr + 1) % nDelay;
	}
	return s;
}
function bassNote(freq, dur) {
	const n = Math.floor(SR * dur);
	const s = new Float32Array(n);
	let lp = 0;
	let phase = 0;
	for (let i = 0; i < n; i++) {
		const e = envADSR(i / SR, dur, .008, .08, .7, .07);
		phase += 2 * Math.PI * freq / SR;
		const saw = phase / Math.PI % 2 - 1;
		const sub = Math.sin(phase);
		const cutoff = .12 + .28 * e;
		lp += (saw - lp) * cutoff;
		s[i] = (lp * .7 + sub * .45) * e * .7;
	}
	return s;
}
function rhodes(freq, dur) {
	const n = Math.floor(SR * dur);
	const s = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const e = Math.exp(-t * 2.4) * envADSR(t, dur, .004, .12, .55, .2);
		const mod = Math.sin(2 * Math.PI * freq * 2 * t) * .55 * Math.exp(-t * 4);
		const car = Math.sin(2 * Math.PI * freq * t + mod);
		const bell = Math.sin(2 * Math.PI * freq * 7 * t) * Math.exp(-t * 10) * .08;
		s[i] = (car + bell) * e * .42;
	}
	return s;
}
function piano(freq, dur) {
	const n = Math.floor(SR * dur);
	const s = new Float32Array(n);
	const partials = [
		1,
		2.002,
		3.01,
		4.04,
		5.08
	];
	const gains = [
		1,
		.42,
		.22,
		.1,
		.05
	];
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const e = Math.exp(-t * 3.1) * envADSR(t, dur, .002, .18, .4, .22);
		let v = 0;
		for (let p = 0; p < partials.length; p++) v += Math.sin(2 * Math.PI * freq * partials[p] * t) * gains[p];
		s[i] = v * e * .28;
	}
	return s;
}
function vocal(freq, dur, formant) {
	const n = Math.floor(SR * dur);
	const s = new Float32Array(n);
	const f1 = formant === "ah" ? 720 : 320;
	const f2 = formant === "ah" ? 1240 : 920;
	const f3 = formant === "ah" ? 2500 : 2200;
	let bp1 = 0, bp1d = 0, bp2 = 0, bp2d = 0, bp3 = 0, bp3d = 0;
	const q = .08;
	let phase = 0;
	const vibHz = 5.2;
	for (let i = 0; i < n; i++) {
		const t = i / SR;
		const e = envADSR(t, dur, .03, .08, .85, .12);
		const vib = 1 + .012 * Math.sin(2 * Math.PI * vibHz * t);
		phase += 2 * Math.PI * freq * vib / SR;
		const src = (Math.sin(phase) + .35 * Math.sin(phase * 2) + .12 * Math.sin(phase * 3)) * .55;
		const a1 = 2 * Math.PI * f1 / SR;
		bp1d += a1 * (src - bp1) - q * bp1d;
		bp1 += a1 * bp1d;
		const a2 = 2 * Math.PI * f2 / SR;
		bp2d += a2 * (src - bp2) - q * bp2d;
		bp2 += a2 * bp2d;
		const a3 = 2 * Math.PI * f3 / SR;
		bp3d += a3 * (src - bp3) - q * bp3d;
		bp3 += a3 * bp3d;
		s[i] = (bp1 * .55 + bp2 * .35 + bp3 * .18) * e * .9;
	}
	return s;
}
function normalizeStereo(L, R, peak = .86) {
	let m = 1e-8;
	for (let i = 0; i < L.length; i++) {
		const a = Math.abs(L[i]);
		const b = Math.abs(R[i]);
		if (a > m) m = a;
		if (b > m) m = b;
	}
	const g = peak / m;
	for (let i = 0; i < L.length; i++) {
		L[i] *= g;
		R[i] *= g;
	}
}
function toBuffer(L, R) {
	bufferFactory ??= new OfflineAudioContext(1, 8, SR);
	const b = bufferFactory.createBuffer(2, L.length, SR);
	b.copyToChannel(L, 0);
	b.copyToChannel(R, 1);
	return b;
}
function stepTime(bpm, bar, step) {
	const beat = 60 / bpm;
	return (bar * 4 + step / 4) * beat;
}
function pattern(bpm, bars, grid, kind, every = 1, offset = 0) {
	const hits = [];
	for (let bar = offset; bar < bars; bar += every) for (let s = 0; s < grid.length; s++) if (grid[s] === "x") hits.push({
		at: stepTime(bpm, bar, s),
		kind
	});
	return hits;
}
function afterHours() {
	const bpm = 100;
	const bars = 16;
	const drums = [
		...pattern(bpm, bars, "x-------x-------", "kick"),
		...pattern(bpm, bars, "----x-------x---", "snare"),
		...pattern(bpm, bars, "x-x-x-x-x-x-x-x-", "hat"),
		...pattern(bpm, bars, "--------------x-", "ohat", 2, 1)
	];
	const bass = [];
	const bassLine = [
		45,
		45,
		48,
		41,
		43,
		43,
		41,
		45
	];
	for (let bar = 0; bar < bars; bar++) {
		const root = bassLine[bar % 8];
		bass.push({
			at: stepTime(bpm, bar, 0),
			midi: root,
			dur: .42
		});
		bass.push({
			at: stepTime(bpm, bar, 6),
			midi: root,
			dur: .18
		});
		bass.push({
			at: stepTime(bpm, bar, 8),
			midi: root + 7,
			dur: .28
		});
		bass.push({
			at: stepTime(bpm, bar, 12),
			midi: root + 5,
			dur: .22
		});
	}
	const guitar = [];
	const gChords = [
		[
			57,
			60,
			64
		],
		[
			53,
			57,
			60
		],
		[
			55,
			59,
			62
		],
		[
			55,
			59,
			62
		]
	];
	for (let bar = 2; bar < bars; bar++) {
		const ch = gChords[Math.floor(bar / 2) % 4];
		for (const m of ch) {
			guitar.push({
				at: stepTime(bpm, bar, 2),
				midi: m,
				dur: .35,
				vel: .55,
				pan: .25
			});
			guitar.push({
				at: stepTime(bpm, bar, 10),
				midi: m,
				dur: .3,
				vel: .45,
				pan: .25
			});
		}
	}
	const keys = [];
	const kProg = [
		[
			69,
			72,
			76
		],
		[
			65,
			69,
			72
		],
		[
			67,
			71,
			74
		],
		[
			67,
			71,
			74
		]
	];
	for (let bar = 0; bar < bars; bar++) {
		const ch = kProg[Math.floor(bar / 2) % 4];
		for (const m of ch) keys.push({
			at: stepTime(bpm, bar, 0),
			midi: m,
			dur: 1.7,
			vel: .5,
			pan: -.2
		});
	}
	const leadMidi = [
		72,
		74,
		76,
		74,
		72,
		69,
		67,
		69,
		72,
		76,
		79,
		76,
		74,
		72,
		69,
		67
	];
	const lead = [];
	for (let bar = 2; bar < bars; bar++) {
		const m = leadMidi[bar % 16];
		lead.push({
			at: stepTime(bpm, bar, 0),
			midi: m,
			dur: .7,
			vel: .9
		});
		lead.push({
			at: stepTime(bpm, bar, 8),
			midi: leadMidi[(bar + 4) % 16],
			dur: .55,
			vel: .75
		});
	}
	const feature = [];
	for (let bar = 6; bar < 10; bar++) {
		const m = leadMidi[bar % 16] + 4;
		feature.push({
			at: stepTime(bpm, bar, 0),
			midi: m,
			dur: .85,
			vel: .55,
			pan: -.45
		});
		feature.push({
			at: stepTime(bpm, bar, 8),
			midi: leadMidi[(bar + 4) % 16] + 3,
			dur: .7,
			vel: .45,
			pan: .45
		});
	}
	for (let bar = 14; bar < bars; bar++) feature.push({
		at: stepTime(bpm, bar, 0),
		midi: 76,
		dur: 1.4,
		vel: .5,
		pan: .4
	});
	const other = [];
	for (let bar = 6; bar < bars; bar++) other.push({
		at: stepTime(bpm, bar, 12),
		midi: 84,
		dur: .18,
		vel: .25,
		pan: .6
	});
	return {
		bpm,
		bars,
		drums,
		bass,
		guitar,
		keys,
		lead,
		feature,
		other
	};
}
function copperWire() {
	const bpm = 88;
	const bars = 12;
	const drums = [
		...pattern(bpm, bars, "x-------x-------", "kick"),
		...pattern(bpm, bars, "----x-------x---", "snare"),
		...pattern(bpm, bars, "x---x---x---x---", "hat"),
		...pattern(bpm, bars, "--------------x-", "ohat", 1, 0)
	];
	const bass = [];
	const walk = [
		40,
		40,
		40,
		40,
		45,
		45,
		40,
		40,
		47,
		45,
		40,
		47
	];
	for (let bar = 0; bar < bars; bar++) {
		const root = walk[bar];
		bass.push({
			at: stepTime(bpm, bar, 0),
			midi: root,
			dur: .55
		});
		bass.push({
			at: stepTime(bpm, bar, 4),
			midi: root,
			dur: .4
		});
		bass.push({
			at: stepTime(bpm, bar, 8),
			midi: root + 3,
			dur: .35
		});
		bass.push({
			at: stepTime(bpm, bar, 12),
			midi: root + 5,
			dur: .32
		});
	}
	const guitar = [];
	const riff = [
		64,
		67,
		69,
		67,
		64,
		62,
		64,
		59
	];
	for (let bar = 0; bar < bars; bar++) for (let i = 0; i < 8; i++) guitar.push({
		at: stepTime(bpm, bar, i * 2),
		midi: riff[i] + (bar >= 4 && bar < 6 ? 5 : 0),
		dur: .28,
		vel: i % 2 === 0 ? .8 : .5,
		pan: .15
	});
	const keys = [];
	const chords = [
		[
			64,
			67,
			71
		],
		[
			64,
			67,
			71
		],
		[
			69,
			72,
			76
		],
		[
			64,
			67,
			71
		],
		[
			71,
			74,
			78
		],
		[
			69,
			72,
			76
		]
	];
	for (let bar = 0; bar < bars; bar++) {
		const ch = chords[Math.floor(bar / 2) % chords.length];
		for (const m of ch) keys.push({
			at: stepTime(bpm, bar, 0),
			midi: m - 12,
			dur: 2.4,
			vel: .4,
			pan: -.3
		});
	}
	const lead = [];
	const melody = [
		76,
		74,
		71,
		69,
		71,
		67,
		64,
		67,
		69,
		71,
		74,
		76
	];
	for (let bar = 1; bar < bars; bar++) {
		lead.push({
			at: stepTime(bpm, bar, 0),
			midi: melody[bar % melody.length],
			dur: .85
		});
		lead.push({
			at: stepTime(bpm, bar, 6),
			midi: melody[(bar + 3) % melody.length],
			dur: .5,
			vel: .7
		});
	}
	const feature = [];
	for (let bar = 8; bar < bars; bar++) feature.push({
		at: stepTime(bpm, bar, 2),
		midi: melody[bar % melody.length] + 3,
		dur: .9,
		vel: .5,
		pan: -.5
	});
	const other = [];
	for (let bar = 0; bar < bars; bar += 2) other.push({
		at: stepTime(bpm, bar, 14),
		midi: 52,
		dur: .2,
		vel: .3,
		pan: -.6
	});
	return {
		bpm,
		bars,
		drums,
		bass,
		guitar,
		keys,
		lead,
		feature,
		other
	};
}
function lateFee() {
	const bpm = 104;
	const bars = 16;
	const drums = [
		...pattern(bpm, bars, "x--x----x--x----", "kick"),
		...pattern(bpm, bars, "----x-------x---", "snare"),
		...pattern(bpm, bars, "x-xxx-x-x-xxx-x-", "hat"),
		...pattern(bpm, bars, "--------x-------", "ohat", 2, 1)
	];
	const bass = [];
	const funk = [
		50,
		50,
		57,
		50,
		53,
		50,
		55,
		57
	];
	for (let bar = 0; bar < bars; bar++) {
		for (let i = 0; i < 8; i++) {
			if (i === 3 || i === 7) continue;
			bass.push({
				at: stepTime(bpm, bar, i * 2),
				midi: funk[i],
				dur: .14,
				vel: i === 0 ? .95 : .7
			});
		}
		bass.push({
			at: stepTime(bpm, bar, 11),
			midi: 50,
			dur: .1,
			vel: .5
		});
	}
	const guitar = [];
	const skank = [
		62,
		65,
		69
	];
	for (let bar = 0; bar < bars; bar++) {
		const shift = bar % 4 === 1 ? 5 : bar % 4 === 3 ? 2 : 0;
		for (const m of skank) {
			guitar.push({
				at: stepTime(bpm, bar, 4),
				midi: m + shift,
				dur: .14,
				vel: .7,
				pan: .3
			});
			guitar.push({
				at: stepTime(bpm, bar, 12),
				midi: m + shift,
				dur: .14,
				vel: .65,
				pan: .3
			});
		}
	}
	const keys = [];
	const clav = [
		[
			65,
			69,
			72
		],
		[
			67,
			71,
			74
		],
		[
			65,
			69,
			72
		],
		[
			64,
			67,
			72
		]
	];
	for (let bar = 0; bar < bars; bar++) {
		const ch = clav[bar % 4];
		for (const m of ch) {
			keys.push({
				at: stepTime(bpm, bar, 0),
				midi: m,
				dur: .16,
				vel: .45,
				pan: -.25
			});
			keys.push({
				at: stepTime(bpm, bar, 6),
				midi: m,
				dur: .12,
				vel: .35,
				pan: -.25
			});
			keys.push({
				at: stepTime(bpm, bar, 10),
				midi: m,
				dur: .12,
				vel: .35,
				pan: -.25
			});
		}
	}
	const lead = [];
	const hook = [
		69,
		72,
		74,
		72,
		69,
		65,
		67,
		69
	];
	for (let bar = 2; bar < bars; bar++) {
		lead.push({
			at: stepTime(bpm, bar, 0),
			midi: hook[bar % 8],
			dur: .28
		});
		lead.push({
			at: stepTime(bpm, bar, 4),
			midi: hook[(bar + 2) % 8],
			dur: .22,
			vel: .75
		});
		lead.push({
			at: stepTime(bpm, bar, 10),
			midi: hook[(bar + 4) % 8],
			dur: .4,
			vel: .8
		});
	}
	const feature = [];
	for (let bar = 8; bar < bars; bar++) {
		feature.push({
			at: stepTime(bpm, bar, 2),
			midi: hook[bar % 8] + 3,
			dur: .35,
			vel: .5,
			pan: .5
		});
		feature.push({
			at: stepTime(bpm, bar, 8),
			midi: hook[(bar + 3) % 8] + 7,
			dur: .2,
			vel: .4,
			pan: -.5
		});
	}
	const other = [];
	for (let bar = 4; bar < bars; bar++) other.push({
		at: stepTime(bpm, bar, 13),
		midi: 81,
		dur: .08,
		vel: .2,
		pan: .7
	});
	return {
		bpm,
		bars,
		drums,
		bass,
		guitar,
		keys,
		lead,
		feature,
		other
	};
}
function durationOf(chart) {
	const beat = 60 / chart.bpm;
	return chart.bars * 4 * beat + .6;
}
function renderStem(chart, id) {
	const dur = durationOf(chart);
	const n = Math.floor(dur * SR);
	const L = new Float32Array(n);
	const R = new Float32Array(n);
	if (id === "drums") for (const h of chart.drums) {
		const sample = h.kind === "kick" ? kick() : h.kind === "snare" ? snare() : hat(h.kind === "ohat");
		const pan = h.kind === "hat" || h.kind === "ohat" ? .2 : 0;
		const g = h.kind === "kick" ? .95 : h.kind === "snare" ? .72 : .28;
		addMono(L, R, sample, h.at, g * (1 - pan), g * (1 + pan));
	}
	else if (id === "bass") for (const note of chart.bass) addMono(L, R, bassNote(midiToHz(note.midi), note.dur), note.at, .9, .9);
	else if (id === "guitar") for (const note of chart.guitar) {
		const pan = note.pan ?? .2;
		const g = (note.vel ?? .7) * .7;
		addMono(L, R, pluck(midiToHz(note.midi), note.dur, .55), note.at, g * (1 - pan), g * (1 + pan));
	}
	else if (id === "keys") {
		const fn = chart.bpm === 88 ? piano : rhodes;
		for (const note of chart.keys) {
			const pan = note.pan ?? -.2;
			const g = (note.vel ?? .5) * .85;
			addMono(L, R, fn(midiToHz(note.midi), note.dur), note.at, g * (1 - pan), g * (1 + pan));
		}
	} else if (id === "lead") for (const note of chart.lead) {
		const g = (note.vel ?? .85) * .9;
		addMono(L, R, vocal(midiToHz(note.midi), note.dur, "ah"), note.at, g, g);
	}
	else if (id === "feature") for (const note of chart.feature) {
		const pan = note.pan ?? .4;
		const g = (note.vel ?? .5) * .75;
		addMono(L, R, vocal(midiToHz(note.midi), note.dur, "oo"), note.at, g * (1 - pan), g * (1 + pan));
	}
	else if (id === "other") for (const note of chart.other) {
		const pan = note.pan ?? .5;
		const g = (note.vel ?? .3) * .5;
		addMono(L, R, rhodes(midiToHz(note.midi), note.dur), note.at, g * (1 - pan), g * (1 + pan));
	}
	normalizeStereo(L, R, .78);
	return toBuffer(L, R);
}
var CHARTS = {
	"after-hours": afterHours,
	"copper-wire": copperWire,
	"late-fee": lateFee
};
function studioDuration(id) {
	return durationOf(CHARTS[id]());
}
function studioMeta(id) {
	return {
		...STUDIO_SONGS.find((s) => s.studioId === id),
		duration: studioDuration(id)
	};
}
var cache = /* @__PURE__ */ new Map();
async function renderStudioSong(id, onProgress) {
	const hit = cache.get(id);
	if (hit) {
		onProgress?.(1);
		return hit;
	}
	const chart = CHARTS[id]();
	const stems = {};
	for (let i = 0; i < STEM_IDS.length; i++) {
		const stemId = STEM_IDS[i];
		stems[stemId] = renderStem(chart, stemId);
		onProgress?.((i + 1) / STEM_IDS.length);
		await new Promise((r) => setTimeout(r, 0));
	}
	cache.set(id, stems);
	return stems;
}
function warmupStudio() {
	if (typeof window === "undefined") return;
	window.setTimeout(() => {
		renderStudioSong("after-hours");
	}, 700);
}
async function openStudioTrack(id) {
	player.stop();
	const meta = studioMeta(id);
	useSession.getState().setStatus("dissolving", {
		song: meta,
		progress: .06,
		progressLabel: "Setting the chairs…",
		error: null
	});
	useSession.setState({
		playing: false,
		currentTime: 0,
		peaks: null,
		mixPeak: null
	});
	try {
		const buffers = await renderStudioSong(id, (p) => {
			useSession.getState().setStatus("dissolving", {
				song: meta,
				progress: Math.max(.06, p),
				progressLabel: "Pulling the room apart…"
			});
		});
		useSession.getState().loadReady({
			...meta,
			duration: buffers.lead.duration
		}, buffers);
	} catch (err) {
		useSession.getState().setStatus("error", { error: err instanceof Error ? err.message : "Could not build the studio cut." });
	}
}
async function openUploadedFile(file) {
	player.stop();
	if (file.size > 29360128) {
		useSession.getState().setStatus("error", {
			error: "Keep the file under 28 MB.",
			song: null
		});
		return;
	}
	const song = {
		id: `upload-${Date.now()}`,
		title: file.name.replace(/\.[^.]+$/, ""),
		subtitle: "Your mix",
		bpm: 120,
		key: "—",
		duration: 0,
		kind: "upload",
		isolation: "split"
	};
	useSession.getState().setStatus("decoding", {
		song,
		progress: .04,
		progressLabel: "Reading the tape…",
		error: null
	});
	useSession.setState({
		playing: false,
		currentTime: 0,
		peaks: null,
		mixPeak: null
	});
	try {
		await player.resume();
		const ctx = player.ctx;
		if (!ctx) throw new Error("Audio is not ready yet.");
		const decoded = await decodeAudioFile(ctx, file);
		if (decoded.duration > 360) {
			useSession.getState().setStatus("error", { error: "Keep it under six minutes for an on-device split." });
			return;
		}
		const mixPeak = peaksFromBuffer(decoded);
		useSession.getState().setStatus("dissolving", {
			song: {
				...song,
				duration: decoded.duration
			},
			progress: .08,
			progressLabel: "Dissolving the mix…"
		});
		useSession.setState({ mixPeak });
		const buffers = await splitOnDevice(ctx, decoded, (p) => {
			useSession.getState().setStatus("dissolving", {
				song: {
					...song,
					duration: decoded.duration
				},
				progress: .08 + p * .9,
				progressLabel: "Separating chairs…"
			});
		});
		useSession.getState().loadReady({
			...song,
			duration: decoded.duration
		}, buffers, decoded);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Could not read that audio file.";
		useSession.getState().setStatus("error", { error: /decode/i.test(message) ? "That file could not be decoded. Try WAV, MP3, or M4A." : message });
	}
}
function isAudioFile(file) {
	if (file.type.startsWith("audio/")) return true;
	return /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(file.name);
}
function HomeView() {
	const navigate = useNavigate();
	const inputRef = (0, import_react.useRef)(null);
	const [over, setOver] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const goSession = (0, import_react.useCallback)((work) => {
		work();
		navigate({ to: "/session" });
	}, [navigate]);
	const onFiles = (0, import_react.useCallback)((files) => {
		const file = files?.[0];
		if (!file) return;
		if (!isAudioFile(file)) {
			toast.error("Drop an audio file — WAV, MP3, or M4A.");
			return;
		}
		setBusy("upload");
		goSession(() => openUploadedFile(file));
	}, [goSession]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 pb-20 pt-10 sm:gap-16 sm:pt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-2 text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Armchair, {
					className: "size-5 text-fg",
					strokeWidth: 1.6
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium uppercase tracking-widest",
					children: "Open Chair"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "font-display text-5xl leading-tight tracking-tight text-fg sm:text-6xl",
						children: [
							"Take the",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
								className: "italic",
								children: "empty chair."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-md text-base leading-relaxed text-muted",
						children: "Drop a song. Mute the part you want to play. Sit in from your room — singer, guitarist, drummer, anywhere you belong."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-subtle",
						children: STEMS.map((s) => s.short).join(" · ")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac",
				className: "sr-only",
				onChange: (e) => void onFiles(e.target.files)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => inputRef.current?.click(),
				onDragOver: (e) => {
					e.preventDefault();
					setOver(true);
				},
				onDragLeave: () => setOver(false),
				onDrop: (e) => {
					e.preventDefault();
					setOver(false);
					onFiles(e.dataTransfer.files);
				},
				className: cn("flex w-full flex-col items-start gap-3 rounded-2xl bg-surface px-6 py-8 text-left transition-[box-shadow,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 sm:py-10", over && "bg-elevated"),
				style: { boxShadow: over ? "var(--shadow-border-hover)" : "var(--shadow-border)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-11 items-center justify-center rounded-md bg-elevated text-fg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
							className: "size-4",
							strokeWidth: 1.75
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-2xl tracking-tight",
						children: "Drop a track"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-w-sm text-sm leading-relaxed text-muted",
						children: "The mix splits on your device into lead, features, drums, bass, guitar, keys, and the rest. Mute your chair. Play."
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: "Studio cuts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "True stems. Mute is complete."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-3",
					children: STUDIO_SONGS.map((song) => {
						const duration = studioDuration(song.studioId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy !== null,
							onClick: () => {
								setBusy(song.id);
								goSession(() => openStudioTrack(song.studioId));
							},
							className: "flex w-full items-center justify-between gap-4 rounded-xl bg-surface px-5 py-4 text-left transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] disabled:opacity-60",
							style: { boxShadow: "var(--shadow-border)" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-medium text-fg",
									children: song.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm text-muted",
									children: song.subtitle
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 text-right text-xs tabular-nums text-subtle",
								children: [
									song.bpm,
									" BPM · ",
									song.key,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 block",
										children: formatTime(duration)
									})
								]
							})]
						}) }, song.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-subtle",
				children: "Uploads never leave this browser. Isolation is strongest on vocals, drums, and bass — guitar and keys share the middle of a dense mix."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex sm:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full",
					onClick: () => inputRef.current?.click(),
					children: "Choose a file"
				})
			})
		]
	});
}
function Home() {
	(0, import_react.useEffect)(() => {
		warmupStudio();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeView, {}) });
}
//#endregion
export { Home as component };
