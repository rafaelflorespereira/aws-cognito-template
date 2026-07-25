import { useCallback, useEffect, useRef, useState } from "react";
import { Asset } from "expo-asset";
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
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
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
  error: string | null;
} {
  const assetId = enabled ? getManeuverNarration(lang, maneuver) : null;
  const [resolvedAsset, setResolvedAsset] = useState<{
    assetId: number;
    uri: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const source =
    assetId !== null && resolvedAsset?.assetId === assetId
      ? resolvedAsset.uri
      : null;
  const player = useAudioPlayer(source, {
    updateInterval: 250,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);
  const playbackTokenRef = useRef(0);

  useEffect(() => {
    if (assetId === null) {
      setResolvedAsset(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    void Asset.loadAsync(assetId)
      .then(([asset]) => {
        const uri = asset.localUri ?? asset.uri;
        if (!uri) {
          throw new Error("Narration asset did not resolve to a playable URI");
        }
        if (!cancelled) setResolvedAsset({ assetId, uri });
      })
      .catch((loadError: unknown) => {
        const message = getErrorMessage(loadError);
        console.error("[vs/audio] failed to load narration asset:", loadError);
        if (!cancelled) setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const statusMatchesPlayer = status.id === player.id;
  const isLoaded = statusMatchesPlayer && status.isLoaded;

  useEffect(() => {
    const playbackToken = ++playbackTokenRef.current;

    if (!source || !isLoaded) {
      return;
    }
    if (muted) {
      player.pause();
      return;
    }

    void prepareNarrationAudio()
      .then(() => {
        if (playbackTokenRef.current === playbackToken) {
          player.volume = 1;
          player.play();
          setError(null);
        }
      })
      .catch((playError: unknown) => {
        const message = getErrorMessage(playError);
        console.error("[vs/audio] failed to play narration:", playError);
        if (playbackTokenRef.current === playbackToken) setError(message);
      });

    return () => {
      if (playbackTokenRef.current === playbackToken) {
        playbackTokenRef.current += 1;
      }
    };
  }, [isLoaded, muted, player, source]);

  const stop = useCallback(() => {
    playbackTokenRef.current += 1;
    player.pause();
  }, [player]);

  return {
    stop,
    currentTime: statusMatchesPlayer ? status.currentTime : 0,
    duration: statusMatchesPlayer ? status.duration : 0,
    error,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown audio error";
}
