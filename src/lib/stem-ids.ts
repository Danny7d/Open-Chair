export const STEM_IDS = [
  "lead",
  "feature",
  "drums",
  "bass",
  "guitar",
  "keys",
  "other",
] as const;

export type StemId = (typeof STEM_IDS)[number];
