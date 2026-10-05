import { unmix as unmixCore } from "./unmix-core";
import { STEM_IDS, type StemId } from "../stem-ids";

export const MAX_UPLOAD_BYTES = 28 * 1024 * 1024;
export const MAX_DURATION_SEC = 6 * 60;

export function channelPair(buffer: AudioBuffer): {
  left: Float32Array;
  right: Float32Array;
} {
  const left = buffer.getChannelData(0);
  const right =
    buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  return { left, right };
}

export async function decodeAudioFile(
  ctx: AudioContext,
  file: File,
): Promise<AudioBuffer> {
  const buf = await file.arrayBuffer();
  return await ctx.decodeAudioData(buf.slice(0));
}

type WorkerDone = {
  type: "done";
  stems: Record<StemId, Float32Array>;
  sampleRate: number;
};

function buffersFromPcm(
  ctx: AudioContext,
  stems: Record<StemId, Float32Array>,
  sampleRate: number,
): Record<StemId, AudioBuffer> {
  const out = {} as Record<StemId, AudioBuffer>;
  for (const id of STEM_IDS) {
    const pcm = stems[id];
    const b = ctx.createBuffer(1, pcm.length, sampleRate);
    b.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
    out[id] = b;
  }
  return out;
}

export async function splitOnDevice(
  ctx: AudioContext,
  buffer: AudioBuffer,
  onProgress?: (p: number) => void,
): Promise<Record<StemId, AudioBuffer>> {
  const { left, right } = channelPair(buffer);
  const leftCopy = left.slice();
  const rightCopy = right.slice();

  try {
    const WorkerCtor = (await import("./unmix.worker.ts?worker")).default;
    const worker = new WorkerCtor();
    const result = await new Promise<WorkerDone>((resolve, reject) => {
      worker.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as
          | WorkerDone
          | { type: "progress"; p: number }
          | { type: "error"; message: string };
        if (msg.type === "progress") onProgress?.(msg.p);
        else if (msg.type === "done") resolve(msg);
        else if (msg.type === "error") reject(new Error(msg.message));
      };
      worker.onerror = (e) =>
        reject(e.error instanceof Error ? e.error : new Error("Worker failed"));
      worker.postMessage(
        {
          type: "run",
          left: leftCopy,
          right: rightCopy,
          sampleRate: buffer.sampleRate,
        },
        [leftCopy.buffer, rightCopy.buffer],
      );
    });
    worker.terminate();
    return buffersFromPcm(ctx, result.stems, result.sampleRate);
  } catch {
    const result = unmixCore(
      { left: left.slice(), right: right.slice(), sampleRate: buffer.sampleRate },
      onProgress,
    );
    return buffersFromPcm(ctx, result.stems, result.sampleRate);
  }
}

export function peaksFromBuffer(
  buffer: AudioBuffer,
  buckets = 720,
): Float32Array {
  const ch0 = buffer.getChannelData(0);
  const ch1 =
    buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const len = Math.min(ch0.length, ch1.length);
  const peaks = new Float32Array(buckets);
  const step = len / buckets;
  for (let i = 0; i < buckets; i++) {
    const start = Math.floor(i * step);
    const end = Math.min(len, Math.floor((i + 1) * step));
    let m = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs((ch0[j]! + ch1[j]!) * 0.5);
      if (v > m) m = v;
    }
    peaks[i] = m;
  }
  return peaks;
}

export function mixPeaks(
  stems: Record<StemId, AudioBuffer>,
  buckets = 720,
): Record<StemId, Float32Array> {
  const out = {} as Record<StemId, Float32Array>;
  for (const id of STEM_IDS) {
    out[id] = peaksFromBuffer(stems[id], buckets);
  }
  return out;
}
