import type { Chakra } from "./types";

// The 6 basic maneuvers of the Vibrational State technique (Energossomatologia).
export const MANEUVERS: { n: number; title: string; text: string }[] = [
  {
    n: 1,
    title: "Impulsion",
    text: "Stand upright with your feet apart and eyes closed. Let your arms hang. Drive the bioenergy flow, by the impulse of your will, from your head down to your hands and feet.",
  },
  {
    n: 2,
    title: "Sensations",
    text: "Bring the flow back, by decided will, from your feet up to your head. Notice, through sensations, the direction of the flow from bottom to top.",
  },
  {
    n: 3,
    title: "Repetition",
    text: "Repeat the up/down flow about 10 times, feeling the energy sweep through the organs of your body.",
  },
  {
    n: 4,
    title: "Rhythm",
    text: "Gradually increase the speed or rhythm of the flow through the force of your determined will.",
  },
  {
    n: 5,
    title: "Circuits",
    text: "Expand the intensity of the flow into ever-larger, more powerful circuits, inside and outside the body.",
  },
  {
    n: 6,
    title: "Installation",
    text: "Install the vibrational state: the flow and closed circuit dissolve, and your whole energetic field becomes vibrant and alight.",
  },
];

export const CHAKRAS: { id: Chakra; label: string }[] = [
  { id: "coronochakra", label: "Crown" },
  { id: "frontochakra", label: "Brow" },
  { id: "laryngochakra", label: "Throat" },
  { id: "cardiochakra", label: "Heart" },
  { id: "umbilicochakra", label: "Solar plexus" },
  { id: "sexochakra", label: "Sacral" },
  { id: "basochakra", label: "Root" },
  { id: "palmar", label: "Palms" },
  { id: "plantar", label: "Soles" },
];

export const PERCEPTIONS: string[] = [
  "Tingling",
  "Warmth",
  "Cold",
  "Pressure",
  "Expansion",
  "Clairvoyance",
  "Sounds",
  "None",
];
