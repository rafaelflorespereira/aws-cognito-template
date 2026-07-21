import { useCallback, useEffect, useRef } from "react";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import type { Lang } from "../i18n";
import type { ManeuverNumber } from "./content";
import { getManeuverNarration } from "./narrationAssets";

let audioModePromise: Promise<void> | null = null;

function prepareNarrationAudio(): Promise<void> {
  if (!audioModePromise) {
    audioModePromise = setAudioModeAsync({
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch((error) => {
      audioModePromise = null;
      throw error;
    });
  }
  return audioModePromise;
}

export function useManeuverNarration({
  enabled,
  muted,
  lang,
  maneuver,
}: {
  enabled: boolean;
  muted: boolean;
  lang: Lang;
  maneuver: ManeuverNumber;
}): {
  stop: () => void;
  currentTime: number;
  duration: number;
} {
  const source = enabled ? getManeuverNarration(lang, maneuver) : null;
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const playbackTokenRef = useRef(0);

  useEffect(() => {
    const playbackToken = ++playbackTokenRef.current;

    if (!source) {
      return;
    }
    if (muted) {
      player.pause();
      return;
    }

    void prepareNarrationAudio()
      .catch((error) => {
        console.error("[vs/audio] failed to configure narration audio:", error);
      })
      .then(() => {
        if (playbackTokenRef.current === playbackToken) {
          player.play();
        }
      });

    return () => {
      if (playbackTokenRef.current === playbackToken) {
        playbackTokenRef.current += 1;
      }
    };
  }, [muted, player, source]);

  const stop = useCallback(() => {
    playbackTokenRef.current += 1;
    player.pause();
  }, [player]);
  const statusMatchesPlayer = status.id === player.id;

  return {
    stop,
    currentTime: statusMatchesPlayer ? status.currentTime : 0,
    duration: statusMatchesPlayer ? status.duration : 0,
  };
}
