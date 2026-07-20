import * as Speech from "expo-speech";
import type { Lang } from "../i18n";

// BCP-47 tags for expo-speech (device TTS engine), one per supported UI
// language — see src/features/i18n/translations.ts SUPPORTED_LANGS.
const SPEECH_LOCALE: Record<Lang, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
};

// Speaks one maneuver's full instruction text aloud. Cancels any speech
// already in progress first so overlapping steps never talk over each other.
export function speakManeuver(text: string, lang: Lang): void {
  Speech.stop();
  Speech.speak(text, { language: SPEECH_LOCALE[lang] });
}

export function stopSpeaking(): void {
  Speech.stop();
}
