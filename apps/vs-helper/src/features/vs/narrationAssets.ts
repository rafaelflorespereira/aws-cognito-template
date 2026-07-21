import type { Lang } from "../i18n";
import type { ManeuverNumber } from "./content";

const MANEUVER_NARRATION = {
  en: {
    1: require("../../../assets/audio/maneuvers/en/1.mp3"),
    2: require("../../../assets/audio/maneuvers/en/2.mp3"),
    3: require("../../../assets/audio/maneuvers/en/3.mp3"),
    4: require("../../../assets/audio/maneuvers/en/4.mp3"),
    5: require("../../../assets/audio/maneuvers/en/5.mp3"),
    6: require("../../../assets/audio/maneuvers/en/6.mp3"),
  },
  pt: {
    1: require("../../../assets/audio/maneuvers/pt/1.mp3"),
    2: require("../../../assets/audio/maneuvers/pt/2.mp3"),
    3: require("../../../assets/audio/maneuvers/pt/3.mp3"),
    4: require("../../../assets/audio/maneuvers/pt/4.mp3"),
    5: require("../../../assets/audio/maneuvers/pt/5.mp3"),
    6: require("../../../assets/audio/maneuvers/pt/6.mp3"),
  },
  es: {
    1: require("../../../assets/audio/maneuvers/es/1.mp3"),
    2: require("../../../assets/audio/maneuvers/es/2.mp3"),
    3: require("../../../assets/audio/maneuvers/es/3.mp3"),
    4: require("../../../assets/audio/maneuvers/es/4.mp3"),
    5: require("../../../assets/audio/maneuvers/es/5.mp3"),
    6: require("../../../assets/audio/maneuvers/es/6.mp3"),
  },
  fr: {
    1: require("../../../assets/audio/maneuvers/fr/1.mp3"),
    2: require("../../../assets/audio/maneuvers/fr/2.mp3"),
    3: require("../../../assets/audio/maneuvers/fr/3.mp3"),
    4: require("../../../assets/audio/maneuvers/fr/4.mp3"),
    5: require("../../../assets/audio/maneuvers/fr/5.mp3"),
    6: require("../../../assets/audio/maneuvers/fr/6.mp3"),
  },
  it: {
    1: require("../../../assets/audio/maneuvers/it/1.mp3"),
    2: require("../../../assets/audio/maneuvers/it/2.mp3"),
    3: require("../../../assets/audio/maneuvers/it/3.mp3"),
    4: require("../../../assets/audio/maneuvers/it/4.mp3"),
    5: require("../../../assets/audio/maneuvers/it/5.mp3"),
    6: require("../../../assets/audio/maneuvers/it/6.mp3"),
  },
} satisfies Record<Lang, Record<ManeuverNumber, number>>;

export function getManeuverNarration(
  lang: Lang,
  maneuver: ManeuverNumber,
): number {
  return MANEUVER_NARRATION[lang][maneuver];
}
