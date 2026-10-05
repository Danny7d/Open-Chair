import "../_runtime.mjs";
import { c as require_react, n as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { d as KeyboardMusic, g as AudioLines, l as Music, m as Drum, n as Users, p as Guitar, u as MicVocal } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatTime(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
var STEM_IDS = [
	"lead",
	"feature",
	"drums",
	"bass",
	"guitar",
	"keys",
	"other"
];
var STEMS = [
	{
		id: "lead",
		label: "Lead vocal",
		short: "Lead",
		hint: "The singer in the center of the mix",
		icon: MicVocal,
		colorVar: "--color-stem-lead"
	},
	{
		id: "feature",
		label: "Features",
		short: "Features",
		hint: "Backing vocals, doubles, and guest lines",
		icon: Users,
		colorVar: "--color-stem-feature"
	},
	{
		id: "drums",
		label: "Drums",
		short: "Drums",
		hint: "Kick, snare, hats, and percussion",
		icon: Drum,
		colorVar: "--color-stem-drums"
	},
	{
		id: "bass",
		label: "Bass",
		short: "Bass",
		hint: "The low end that holds the pocket",
		icon: AudioLines,
		colorVar: "--color-stem-bass"
	},
	{
		id: "guitar",
		label: "Guitar",
		short: "Guitar",
		hint: "Rhythm and lead guitar",
		icon: Guitar,
		colorVar: "--color-stem-guitar"
	},
	{
		id: "keys",
		label: "Piano / keys",
		short: "Keys",
		hint: "Piano, electric piano, and synth pads",
		icon: KeyboardMusic,
		colorVar: "--color-stem-keys"
	},
	{
		id: "other",
		label: "Other",
		short: "Other",
		hint: "Everything the split could not name",
		icon: Music,
		colorVar: "--color-stem-other"
	}
];
var STEM_BY_ID = Object.fromEntries(STEMS.map((s) => [s.id, s]));
var ROLE_PRESETS = [
	{
		id: "karaoke",
		label: "Karaoke",
		mute: ["lead", "feature"],
		blurb: "All vocals out. You take every line."
	},
	{
		id: "singer",
		label: "Singer",
		mute: ["lead"],
		blurb: "Lead muted. Features stay as a cue."
	},
	{
		id: "harmony",
		label: "Harmony",
		mute: ["feature"],
		blurb: "Backing vocals out. Sing the stack."
	},
	{
		id: "guitarist",
		label: "Guitarist",
		mute: ["guitar"],
		blurb: "Guitar out. You are the guitarist."
	},
	{
		id: "bassist",
		label: "Bassist",
		mute: ["bass"],
		blurb: "Bass out. Hold the pocket."
	},
	{
		id: "drummer",
		label: "Drummer",
		mute: ["drums"],
		blurb: "Drums out. You are the kit."
	},
	{
		id: "keys",
		label: "Keys",
		mute: ["keys"],
		blurb: "Piano and keys out. Take the chair."
	},
	{
		id: "full",
		label: "Full mix",
		mute: [],
		blurb: "Every chair occupied. Listen first."
	}
];
function defaultStemStates() {
	return Object.fromEntries(STEM_IDS.map((id) => [id, {
		mute: false,
		solo: false,
		volume: .9
	}]));
}
function effectiveGain(id, states) {
	const self = states[id];
	if (self.mute) return 0;
	if (STEM_IDS.some((s) => states[s].solo) && !self.solo) return 0;
	return self.volume;
}
/** In-place radix-2 Cooley–Tukey FFT. `n` must be a power of two. */
function fft(re, im, invert) {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			const tr = re[i];
			re[i] = re[j];
			re[j] = tr;
			const ti = im[i];
			im[i] = im[j];
			im[j] = ti;
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = (invert ? 2 : -2) * Math.PI / len;
		const wlenRe = Math.cos(ang);
		const wlenIm = Math.sin(ang);
		const half = len >> 1;
		for (let i = 0; i < n; i += len) {
			let wRe = 1;
			let wIm = 0;
			for (let j = 0; j < half; j++) {
				const i0 = i + j;
				const i1 = i0 + half;
				const ur = re[i0];
				const ui = im[i0];
				const vr = re[i1] * wRe - im[i1] * wIm;
				const vi = re[i1] * wIm + im[i1] * wRe;
				re[i0] = ur + vr;
				im[i0] = ui + vi;
				re[i1] = ur - vr;
				im[i1] = ui - vi;
				const nRe = wRe * wlenRe - wIm * wlenIm;
				wIm = wRe * wlenIm + wIm * wlenRe;
				wRe = nRe;
			}
		}
	}
	if (invert) {
		const inv = 1 / n;
		for (let i = 0; i < n; i++) {
			re[i] *= inv;
			im[i] *= inv;
		}
	}
}
function hann(n) {
	const w = new Float32Array(n);
	if (n < 2) return w;
	for (let i = 0; i < n; i++) w[i] = .5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
	return w;
}
var NFFT = 2048;
var HOP = 512;
var BINS = 1025;
function median5(a, b, c, d, e) {
	const x = [
		a,
		b,
		c,
		d,
		e
	];
	x.sort((u, v) => u - v);
	return x[2];
}
function magAt(spec, frames, t, k) {
	return spec[(t < 0 ? 0 : t >= frames ? frames - 1 : t) * BINS + k];
}
/**
* Spectral unmix: mid/side vocal extraction + harmonic/percussive split +
* frequency masks. Isolation is strongest on vocals, drums, and bass.
*/
function unmix(input, onProgress) {
	const { sampleRate } = input;
	let left = input.left;
	let right = input.right;
	const n0 = Math.min(left.length, right.length);
	let sr = sampleRate;
	if (sr > 48e3) {
		const factor = Math.round(sr / 44100);
		if (factor > 1) {
			const n = Math.floor(n0 / factor);
			const l = new Float32Array(n);
			const r = new Float32Array(n);
			for (let i = 0; i < n; i++) {
				l[i] = left[i * factor];
				r[i] = right[i * factor];
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
	const report = (p) => {
		onProgress?.(Math.max(0, Math.min(1, p)));
	};
	for (let t = 0; t < frames; t++) {
		const pos = t * HOP;
		frameIm.fill(0);
		for (let i = 0; i < NFFT; i++) frameRe[i] = (left[pos + i] ?? 0) * win[i];
		fft(frameRe, frameIm, false);
		const base = t * BINS;
		for (let k = 0; k < BINS; k++) {
			reL[base + k] = frameRe[k];
			imL[base + k] = frameIm[k];
			magL[base + k] = Math.hypot(frameRe[k], frameIm[k]);
		}
		frameIm.fill(0);
		for (let i = 0; i < NFFT; i++) frameRe[i] = (right[pos + i] ?? 0) * win[i];
		fft(frameRe, frameIm, false);
		for (let k = 0; k < BINS; k++) {
			reR[base + k] = frameRe[k];
			imR[base + k] = frameIm[k];
			magR[base + k] = Math.hypot(frameRe[k], frameIm[k]);
		}
		if ((t & 31) === 0) report(t / frames * .45);
	}
	const magMid = new Float32Array(frames * BINS);
	for (let i = 0; i < magMid.length; i++) magMid[i] = .5 * (magL[i] + magR[i]);
	const harm = new Float32Array(frames * BINS);
	const perc = new Float32Array(frames * BINS);
	for (let t = 0; t < frames; t++) {
		const base = t * BINS;
		for (let k = 0; k < BINS; k++) {
			const h = median5(magAt(magMid, frames, t - 2, k), magAt(magMid, frames, t - 1, k), magAt(magMid, frames, t, k), magAt(magMid, frames, t + 1, k), magAt(magMid, frames, t + 2, k));
			const p = median5(magAt(magMid, frames, t, Math.max(0, k - 2)), magAt(magMid, frames, t, Math.max(0, k - 1)), magAt(magMid, frames, t, k), magAt(magMid, frames, t, Math.min(1024, k + 1)), magAt(magMid, frames, t, Math.min(1024, k + 2)));
			const h2 = h * h;
			const p2 = p * p;
			const den = h2 + p2 + 1e-12;
			harm[base + k] = h2 / den;
			perc[base + k] = p2 / den;
		}
		if ((t & 31) === 0) report(.45 + t / frames * .15);
	}
	const hzPerBin = sr / NFFT;
	const masks = {
		lead: new Float32Array(frames * BINS),
		feature: new Float32Array(frames * BINS),
		drums: new Float32Array(frames * BINS),
		bass: new Float32Array(frames * BINS),
		guitar: new Float32Array(frames * BINS),
		keys: new Float32Array(frames * BINS),
		other: new Float32Array(frames * BINS)
	};
	const ramp = (f, lo, hi) => {
		if (f <= lo) return 0;
		if (f >= hi) return 1;
		return (f - lo) / (hi - lo);
	};
	for (let t = 0; t < frames; t++) {
		const base = t * BINS;
		let energy = 0;
		for (let k = 0; k < BINS; k++) energy += magMid[base + k];
		const leadGate = energy / BINS * 1.15;
		for (let k = 0; k < BINS; k++) {
			const f = k * hzPerBin;
			const i = base + k;
			const ml = magL[i];
			const mr = magR[i];
			const mid = .5 * (ml + mr);
			const center = mid / (mid + Math.abs(ml - mr) * .5 + 1e-8);
			const vocalBand = ramp(f, 140, 220) * (1 - ramp(f, 3800, 5200));
			const bassBand = 1 - ramp(f, 160, 280);
			const lowMid = ramp(f, 180, 280) * (1 - ramp(f, 1400, 2200));
			const highMid = ramp(f, 400, 700) * (1 - ramp(f, 4200, 6500));
			const air = ramp(f, 5e3, 8e3);
			const h = harm[i];
			const p = perc[i];
			const lead = center * center * center * vocalBand * h * (mid > leadGate ? 1 : .35);
			const feature = center * vocalBand * h * (1 - lead) * (.45 + .55 * (1 - center));
			const bass = bassBand * (.65 + .35 * h) * (1 - lead * .25);
			const drums = p * (1 - bassBand * .35) * (1 - lead * .4) + air * p * .6;
			const restH = h * (1 - lead) * (1 - feature) * (1 - bass);
			const guitar = restH * lowMid * (.35 + .65 * (1 - center));
			const keys = restH * highMid * (1 - guitar * .4);
			const other = Math.max(0, 1 - (lead + feature + drums + bass + guitar + keys));
			const raw = [
				lead,
				feature,
				drums,
				bass,
				guitar,
				keys,
				other
			];
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
		if ((t & 31) === 0) report(.6 + t / frames * .1);
	}
	const outLen = (frames - 1) * HOP + NFFT;
	const stems = {};
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
				const m = mask[base + k];
				const lr = reL[base + k];
				const li = imL[base + k];
				const rr = reR[base + k];
				const ri = imR[base + k];
				const vr = .5 * (lr + rr) * m;
				const vi = .5 * (li + ri) * m;
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
				const w = win[i];
				acc[pos + i] += outRe[i] * w;
				winAcc[pos + i] += w * w;
			}
		}
		const pcm = new Float32Array(n);
		const copy = Math.min(n, outLen);
		for (let i = 0; i < copy; i++) pcm[i] = acc[i] / (winAcc[i] + 1e-8);
		stems[id] = pcm;
		si += 1;
		report(.7 + si / STEM_IDS.length * .28);
	}
	report(1);
	return {
		stems,
		sampleRate: sr
	};
}
function channelPair(buffer) {
	const left = buffer.getChannelData(0);
	return {
		left,
		right: buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left
	};
}
async function decodeAudioFile(ctx, file) {
	const buf = await file.arrayBuffer();
	return await ctx.decodeAudioData(buf.slice(0));
}
function buffersFromPcm(ctx, stems, sampleRate) {
	const out = {};
	for (const id of STEM_IDS) {
		const pcm = stems[id];
		const b = ctx.createBuffer(1, pcm.length, sampleRate);
		b.copyToChannel(pcm, 0);
		out[id] = b;
	}
	return out;
}
async function splitOnDevice(ctx, buffer, onProgress) {
	const { left, right } = channelPair(buffer);
	const leftCopy = left.slice();
	const rightCopy = right.slice();
	try {
		const WorkerCtor = (await import("./unmix.worker-D2eAhx3G.mjs")).default;
		const worker = new WorkerCtor();
		const result = await new Promise((resolve, reject) => {
			worker.onmessage = (ev) => {
				const msg = ev.data;
				if (msg.type === "progress") onProgress?.(msg.p);
				else if (msg.type === "done") resolve(msg);
				else if (msg.type === "error") reject(new Error(msg.message));
			};
			worker.onerror = (e) => reject(e.error instanceof Error ? e.error : /* @__PURE__ */ new Error("Worker failed"));
			worker.postMessage({
				type: "run",
				left: leftCopy,
				right: rightCopy,
				sampleRate: buffer.sampleRate
			}, [leftCopy.buffer, rightCopy.buffer]);
		});
		worker.terminate();
		return buffersFromPcm(ctx, result.stems, result.sampleRate);
	} catch {
		const result = unmix({
			left: left.slice(),
			right: right.slice(),
			sampleRate: buffer.sampleRate
		}, onProgress);
		return buffersFromPcm(ctx, result.stems, result.sampleRate);
	}
}
function peaksFromBuffer(buffer, buckets = 720) {
	const ch0 = buffer.getChannelData(0);
	const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
	const len = Math.min(ch0.length, ch1.length);
	const peaks = new Float32Array(buckets);
	const step = len / buckets;
	for (let i = 0; i < buckets; i++) {
		const start = Math.floor(i * step);
		const end = Math.min(len, Math.floor((i + 1) * step));
		let m = 0;
		for (let j = start; j < end; j++) {
			const v = Math.abs((ch0[j] + ch1[j]) * .5);
			if (v > m) m = v;
		}
		peaks[i] = m;
	}
	return peaks;
}
function mixPeaks(stems, buckets = 720) {
	const out = {};
	for (const id of STEM_IDS) out[id] = peaksFromBuffer(stems[id], buckets);
	return out;
}
var StemPlayer = class {
	ctx = null;
	master = null;
	stems = /* @__PURE__ */ new Map();
	playing = false;
	startedAt = 0;
	offsetAtStart = 0;
	rate = 1;
	duration = 0;
	loop = null;
	loopTimer = null;
	clickBuf = null;
	ensure() {
		if (!this.ctx) {
			this.ctx = new AudioContext();
			this.master = this.ctx.createGain();
			this.master.gain.value = .9;
			this.master.connect(this.ctx.destination);
		}
		return this.ctx;
	}
	async resume() {
		const ctx = this.ensure();
		if (ctx.state !== "running") await ctx.resume();
	}
	load(stems) {
		const ctx = this.ensure();
		this.stopSources();
		for (const node of this.stems.values()) try {
			node.gain.disconnect();
		} catch {}
		this.stems.clear();
		this.duration = 0;
		for (const id of STEM_IDS) {
			const buffer = stems[id];
			this.duration = Math.max(this.duration, buffer.duration);
			const gain = ctx.createGain();
			gain.gain.value = .9;
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = .7;
			gain.connect(analyser);
			analyser.connect(this.master);
			this.stems.set(id, {
				buffer,
				gain,
				analyser,
				source: null
			});
		}
		this.offsetAtStart = 0;
		this.playing = false;
	}
	applyStates(states) {
		const ctx = this.ctx;
		if (!ctx) return;
		for (const id of STEM_IDS) {
			const node = this.stems.get(id);
			if (!node) continue;
			const g = effectiveGain(id, states);
			node.gain.gain.setTargetAtTime(g, ctx.currentTime, .03);
		}
	}
	getTime() {
		if (!this.ctx) return this.offsetAtStart;
		if (!this.playing) return this.offsetAtStart;
		const t = this.offsetAtStart + (this.ctx.currentTime - this.startedAt) * this.rate;
		return Math.min(this.duration, Math.max(0, t));
	}
	isPlaying() {
		return this.playing;
	}
	setRate(rate) {
		const t = this.getTime();
		this.rate = rate;
		if (this.playing) this.startAt(t);
	}
	getRate() {
		return this.rate;
	}
	async play(from) {
		await this.resume();
		const t = from ?? this.getTime();
		this.startAt(t);
	}
	pause() {
		const t = this.getTime();
		this.stopSources();
		this.offsetAtStart = t;
		this.playing = false;
	}
	seek(t) {
		const clamped = Math.min(this.duration, Math.max(0, t));
		if (this.playing) this.startAt(clamped);
		else this.offsetAtStart = clamped;
	}
	stop() {
		this.stopSources();
		this.offsetAtStart = 0;
		this.playing = false;
	}
	levels() {
		const out = {};
		const data = /* @__PURE__ */ new Uint8Array(128);
		for (const id of STEM_IDS) {
			const node = this.stems.get(id);
			if (!node) {
				out[id] = 0;
				continue;
			}
			node.analyser.getByteTimeDomainData(data);
			let sum = 0;
			for (let i = 0; i < data.length; i++) {
				const v = (data[i] - 128) / 128;
				sum += v * v;
			}
			out[id] = Math.sqrt(sum / data.length);
		}
		return out;
	}
	async countIn(bpm) {
		await this.resume();
		const ctx = this.ctx;
		const beat = 60 / bpm;
		const buf = this.makeClick();
		for (let i = 0; i < 4; i++) {
			const src = ctx.createBufferSource();
			src.buffer = buf;
			const g = ctx.createGain();
			g.gain.value = i === 0 ? .7 : .4;
			src.connect(g);
			g.connect(ctx.destination);
			src.start(ctx.currentTime + i * beat);
		}
		await new Promise((r) => setTimeout(r, beat * 4 * 1e3));
	}
	exportMix(states) {
		const sr = this.stems.get("lead")?.buffer.sampleRate ?? 44100;
		const length = Math.floor(this.duration * sr);
		const L = new Float32Array(length);
		const R = new Float32Array(length);
		for (const id of STEM_IDS) {
			const g = effectiveGain(id, states);
			if (g <= .001) continue;
			const buf = this.stems.get(id)?.buffer;
			if (!buf) continue;
			const c0 = buf.getChannelData(0);
			const c1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : c0;
			const n = Math.min(length, c0.length, c1.length);
			for (let i = 0; i < n; i++) {
				L[i] += c0[i] * g;
				R[i] += c1[i] * g;
			}
		}
		return encodeWav(L, R, sr);
	}
	startAt(offset) {
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
	armLoop() {
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
		this.loopTimer = window.setTimeout(() => {
			if (this.playing && this.loop) this.startAt(this.loop.start);
		}, Math.max(20, remain * 1e3));
	}
	stopSources() {
		if (this.loopTimer != null) {
			window.clearTimeout(this.loopTimer);
			this.loopTimer = null;
		}
		for (const node of this.stems.values()) {
			try {
				node.source?.stop();
			} catch {}
			node.source = null;
		}
	}
	makeClick() {
		if (this.clickBuf) return this.clickBuf;
		const ctx = this.ensure();
		const n = Math.floor(ctx.sampleRate * .04);
		const b = ctx.createBuffer(1, n, ctx.sampleRate);
		const d = b.getChannelData(0);
		for (let i = 0; i < n; i++) {
			const t = i / ctx.sampleRate;
			d[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 80);
		}
		this.clickBuf = b;
		return b;
	}
};
function encodeWav(L, R, sampleRate) {
	const n = Math.min(L.length, R.length);
	const bytes = 44 + n * 4;
	const buf = new ArrayBuffer(bytes);
	const view = new DataView(buf);
	const writeStr = (off, s) => {
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
		const l = Math.max(-1, Math.min(1, L[i]));
		const r = Math.max(-1, Math.min(1, R[i]));
		view.setInt16(o, l * 32767, true);
		view.setInt16(o + 2, r * 32767, true);
		o += 4;
	}
	return new Blob([buf], { type: "audio/wav" });
}
var player = new StemPlayer();
var initial = {
	status: "idle",
	progress: 0,
	progressLabel: "",
	error: null,
	song: null,
	stems: defaultStemStates(),
	peaks: null,
	mixPeak: null,
	playing: false,
	currentTime: 0,
	rate: 1,
	loopEnabled: false,
	loopStart: 0,
	loopEnd: 0,
	countIn: false,
	activeRole: "full"
};
var useSession = create((set, get) => ({
	...initial,
	reset: () => {
		player.stop();
		set({
			...initial,
			stems: defaultStemStates()
		});
	},
	setStatus: (status, extra) => set({
		status,
		...extra
	}),
	loadReady: (song, buffers, mix) => {
		player.load(buffers);
		player.applyStates(defaultStemStates());
		const peaks = mixPeaks(buffers);
		const mixPeak = mix ? peaksFromBuffer(mix) : averagePeaks(peaks);
		set({
			status: "ready",
			progress: 1,
			progressLabel: "",
			error: null,
			song,
			stems: defaultStemStates(),
			peaks,
			mixPeak,
			playing: false,
			currentTime: 0,
			rate: 1,
			loopEnabled: false,
			loopStart: 0,
			loopEnd: song.duration,
			activeRole: "full"
		});
	},
	setStem: (id, patch) => {
		const stems = {
			...get().stems,
			[id]: {
				...get().stems[id],
				...patch
			}
		};
		player.applyStates(stems);
		set({
			stems,
			activeRole: matchingRole(stems)
		});
	},
	applyRole: (roleId) => {
		const role = ROLE_PRESETS.find((r) => r.id === roleId);
		if (!role) return;
		const stems = defaultStemStates();
		for (const id of role.mute) stems[id].mute = true;
		player.applyStates(stems);
		set({
			stems,
			activeRole: roleId
		});
	},
	setPlaying: (playing) => set({ playing }),
	setTime: (currentTime) => set({ currentTime }),
	setRate: (rate) => {
		player.setRate(rate);
		set({ rate });
	},
	setLoop: (enabled, start, end) => {
		const loopStart = start ?? get().loopStart;
		const loopEnd = end ?? get().loopEnd;
		player.loop = enabled ? {
			start: loopStart,
			end: loopEnd
		} : null;
		set({
			loopEnabled: enabled,
			loopStart,
			loopEnd
		});
	},
	setCountIn: (countIn) => set({ countIn })
}));
function averagePeaks(peaks) {
	const first = peaks.lead;
	const out = new Float32Array(first.length);
	for (let i = 0; i < first.length; i++) {
		let s = 0;
		for (const id of STEM_IDS) s += peaks[id][i];
		out[i] = s / STEM_IDS.length;
	}
	return out;
}
function matchingRole(stems) {
	for (const role of ROLE_PRESETS) if (STEM_IDS.filter((id) => stems[id].mute).length === role.mute.length && role.mute.every((id) => stems[id].mute) && STEM_IDS.every((id) => !stems[id].solo)) return role.id;
	return null;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[opacity,background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-elevated text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "bg-transparent text-fg hover:bg-elevated",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			default: "h-11 rounded-md px-4 text-sm",
			sm: "h-9 rounded-sm px-3 text-sm",
			lg: "h-12 rounded-lg px-5 text-base",
			icon: "size-11 rounded-md",
			"icon-sm": "size-9 rounded-sm"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
export { cn as a, peaksFromBuffer as c, useSession as d, STEM_IDS as i, player as l, STEMS as n, decodeAudioFile as o, STEM_BY_ID as r, formatTime as s, Button as t, splitOnDevice as u };
