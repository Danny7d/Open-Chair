import {
  AudioLines,
  Drum,
  Guitar,
  KeyboardMusic,
  MicVocal,
  Music,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STEM_IDS, type StemId } from "./stem-ids";

export { STEM_IDS, type StemId };

export type StemDef = {
  id: StemId;
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  colorVar: string;
};

export const STEMS: StemDef[] = [
  {
    id: "lead",
    label: "Lead vocal",
    short: "Lead",
    hint: "The singer in the center of the mix",
    icon: MicVocal,
    colorVar: "--color-stem-lead",
  },
  {
    id: "feature",
    label: "Features",
    short: "Features",
    hint: "Backing vocals, doubles, and guest lines",
    icon: Users,
    colorVar: "--color-stem-feature",
  },
  {
    id: "drums",
    label: "Drums",
    short: "Drums",
    hint: "Kick, snare, hats, and percussion",
    icon: Drum,
    colorVar: "--color-stem-drums",
  },
  {
    id: "bass",
    label: "Bass",
    short: "Bass",
    hint: "The low end that holds the pocket",
    icon: AudioLines,
    colorVar: "--color-stem-bass",
  },
  {
    id: "guitar",
    label: "Guitar",
    short: "Guitar",
    hint: "Rhythm and lead guitar",
    icon: Guitar,
    colorVar: "--color-stem-guitar",
  },
  {
    id: "keys",
    label: "Piano / keys",
    short: "Keys",
    hint: "Piano, electric piano, and synth pads",
    icon: KeyboardMusic,
    colorVar: "--color-stem-keys",
  },
  {
    id: "other",
    label: "Other",
    short: "Other",
    hint: "Everything the split could not name",
    icon: Music,
    colorVar: "--color-stem-other",
  },
];

export const STEM_BY_ID = Object.fromEntries(
  STEMS.map((s) => [s.id, s]),
) as Record<StemId, StemDef>;

export type RolePreset = {
  id: string;
  label: string;
  mute: StemId[];
  blurb: string;
};

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "karaoke",
    label: "Karaoke",
    mute: ["lead", "feature"],
    blurb: "All vocals out. You take every line.",
  },
  {
    id: "singer",
    label: "Singer",
    mute: ["lead"],
    blurb: "Lead muted. Features stay as a cue.",
  },
  {
    id: "harmony",
    label: "Harmony",
    mute: ["feature"],
    blurb: "Backing vocals out. Sing the stack.",
  },
  {
    id: "guitarist",
    label: "Guitarist",
    mute: ["guitar"],
    blurb: "Guitar out. You are the guitarist.",
  },
  {
    id: "bassist",
    label: "Bassist",
    mute: ["bass"],
    blurb: "Bass out. Hold the pocket.",
  },
  {
    id: "drummer",
    label: "Drummer",
    mute: ["drums"],
    blurb: "Drums out. You are the kit.",
  },
  {
    id: "keys",
    label: "Keys",
    mute: ["keys"],
    blurb: "Piano and keys out. Take the chair.",
  },
  {
    id: "full",
    label: "Full mix",
    mute: [],
    blurb: "Every chair occupied. Listen first.",
  },
];

export type MixKind = "studio" | "upload";

export type SongMeta = {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  key: string;
  duration: number;
  kind: MixKind;
  isolation: "true" | "split";
};

export type StemState = {
  mute: boolean;
  solo: boolean;
  volume: number;
};

export function defaultStemStates(): Record<StemId, StemState> {
  return Object.fromEntries(
    STEM_IDS.map((id) => [id, { mute: false, solo: false, volume: 0.9 }]),
  ) as Record<StemId, StemState>;
}

export function effectiveGain(
  id: StemId,
  states: Record<StemId, StemState>,
): number {
  const self = states[id];
  if (self.mute) return 0;
  const anySolo = STEM_IDS.some((s) => states[s].solo);
  if (anySolo && !self.solo) return 0;
  return self.volume;
}
