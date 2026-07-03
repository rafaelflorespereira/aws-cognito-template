import type { Chakra } from "./types";

// The 6 basic maneuvers of the Vibrational State technique (Energossomatologia).
// Titles and descriptions are translated at render time via i18n keys
// `maneuver.<n>.title` / `maneuver.<n>.text`.
export const MANEUVERS: { n: number }[] = [
  { n: 1 },
  { n: 2 },
  { n: 3 },
  { n: 4 },
  { n: 5 },
  { n: 6 },
];

// Chakra ids; labels are translated via i18n key `chakra.<id>`.
export const CHAKRA_IDS: Chakra[] = [
  "coronochakra",
  "frontochakra",
  "laryngochakra",
  "cardiochakra",
  "umbilicochakra",
  "sexochakra",
  "basochakra",
  "palmar",
  "plantar",
];

// Perception ids stored on the report; labels translated via `perception.<id>`.
export const PERCEPTION_IDS = [
  "tingling",
  "warmth",
  "cold",
  "pressure",
  "expansion",
  "clairvoyance",
  "sounds",
  "none",
] as const;

export type PerceptionId = (typeof PERCEPTION_IDS)[number];
