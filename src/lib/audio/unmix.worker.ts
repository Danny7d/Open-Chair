import { unmix, type UnmixInput } from "./unmix-core";

type RequestMsg = {
  type: "run";
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
};

self.onmessage = (ev: MessageEvent<RequestMsg>) => {
  const msg = ev.data;
  if (!msg || msg.type !== "run") return;
  try {
    const input: UnmixInput = {
      left: msg.left,
      right: msg.right,
      sampleRate: msg.sampleRate,
    };
    const result = unmix(input, (p) => {
      self.postMessage({ type: "progress", p });
    });
    const transfer: Transferable[] = [];
    for (const buf of Object.values(result.stems)) {
      transfer.push(buf.buffer);
    }
    self.postMessage(
      { type: "done", stems: result.stems, sampleRate: result.sampleRate },
      { transfer },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Split failed";
    self.postMessage({ type: "error", message });
  }
};
