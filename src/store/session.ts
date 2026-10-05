import { create } from "zustand";
import {
  defaultStemStates,
  ROLE_PRESETS,
  STEM_IDS,
  type MixKind,
  type SongMeta,
  type StemId,
  type StemState,
} from "@/lib/stems";
import { player } from "@/lib/audio/player";
import { mixPeaks, peaksFromBuffer } from "@/lib/audio/unmix";

export type SessionStatus =
  | "idle"
  | "decoding"
  | "dissolving"
  | "ready"
  | "error";

export type SessionState = {
  status: SessionStatus;
  progress: number;
  progressLabel: string;
  error: string | null;
  song: SongMeta | null;
  stems: Record<StemId, StemState>;
  peaks: Record<StemId, Float32Array> | null;
  mixPeak: Float32Array | null;
  playing: boolean;
  currentTime: number;
  rate: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  countIn: boolean;
  activeRole: string | null;
};

type Actions = {
  reset: () => void;
  setStatus: (
    status: SessionStatus,
    extra?: Partial<
      Pick<SessionState, "progress" | "progressLabel" | "error" | "song">
    >,
  ) => void;
  loadReady: (
    song: SongMeta,
    buffers: Record<StemId, AudioBuffer>,
    mix?: AudioBuffer,
  ) => void;
  setStem: (id: StemId, patch: Partial<StemState>) => void;
  applyRole: (roleId: string) => void;
  setPlaying: (playing: boolean) => void;
  setTime: (t: number) => void;
  setRate: (rate: number) => void;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;
  setCountIn: (on: boolean) => void;
};

const initial: SessionState = {
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
  activeRole: "full",
};

export const useSession = create<SessionState & Actions>((set, get) => ({
  ...initial,
  reset: () => {
    player.stop();
    set({ ...initial, stems: defaultStemStates() });
  },
  setStatus: (status, extra) => set({ status, ...extra }),
  loadReady: (song, buffers, mix) => {
    player.load(buffers);
    player.applyStates(defaultStemStates());
    const peaks = mixPeaks(buffers);
    const mixPeak = mix
      ? peaksFromBuffer(mix)
      : averagePeaks(peaks);
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
      activeRole: "full",
    });
  },
  setStem: (id, patch) => {
    const stems = { ...get().stems, [id]: { ...get().stems[id], ...patch } };
    player.applyStates(stems);
    set({ stems, activeRole: matchingRole(stems) });
  },
  applyRole: (roleId) => {
    const role = ROLE_PRESETS.find((r) => r.id === roleId);
    if (!role) return;
    const stems = defaultStemStates();
    for (const id of role.mute) stems[id].mute = true;
    player.applyStates(stems);
    set({ stems, activeRole: roleId });
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
    player.loop = enabled ? { start: loopStart, end: loopEnd } : null;
    set({ loopEnabled: enabled, loopStart, loopEnd });
  },
  setCountIn: (countIn) => set({ countIn }),
}));

function averagePeaks(
  peaks: Record<StemId, Float32Array>,
): Float32Array {
  const first = peaks.lead;
  const out = new Float32Array(first.length);
  for (let i = 0; i < first.length; i++) {
    let s = 0;
    for (const id of STEM_IDS) s += peaks[id][i]!;
    out[i] = s / STEM_IDS.length;
  }
  return out;
}

function matchingRole(stems: Record<StemId, StemState>): string | null {
  for (const role of ROLE_PRESETS) {
    const muted = STEM_IDS.filter((id) => stems[id].mute);
    if (
      muted.length === role.mute.length &&
      role.mute.every((id) => stems[id].mute) &&
      STEM_IDS.every((id) => !stems[id].solo)
    ) {
      return role.id;
    }
  }
  return null;
}

export type { MixKind };
