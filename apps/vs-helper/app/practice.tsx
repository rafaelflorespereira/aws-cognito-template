import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSchedule } from "@/features/vs/useSchedule";
import { MANEUVERS } from "@/features/vs/content";
import { useManeuverNarration } from "@/features/vs/narration";
import { useI18n, type TranslationKey } from "@/features/i18n";
import PracticeBackground from "@/components/PracticeBackground";
import EnergyBodyIllustration from "@/components/EnergyBodyIllustration";

const ILLUSTRATION_HEIGHT = 400;
const SERIF = "PlayfairDisplay_600SemiBold";
const PHRASE_MAX = 46; // target max characters per on-screen phrase

function wrapLength(text: string): number {
  return text.replace(/[.!?]+$/, "").length;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Breaks a maneuver's instruction into short, glanceable phrases so only a
// little text shows at a time. Splits on sentences first, then on commas when a
// sentence is too long, then hard-wraps by words as a last resort.
function splitPhrases(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const sentence of sentences) {
    if (wrapLength(sentence) <= PHRASE_MAX) {
      out.push(sentence);
      continue;
    }
    let buf = "";
    for (const part of sentence.split(/,\s*/)) {
      const candidate = buf ? `${buf}, ${part}` : part;
      if (wrapLength(candidate) > PHRASE_MAX && buf) {
        out.push(buf);
        buf = part;
      } else {
        buf = candidate;
      }
    }
    if (buf) out.push(buf);
  }

  // Hard-wrap any remaining over-long chunk by words.
  const wrapped = out.flatMap((chunk) => {
    if (wrapLength(chunk) <= PHRASE_MAX * 1.4) return [chunk];
    const words = chunk.split(/\s+/);
    const wrapped: string[] = [];
    let line = "";
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (wrapLength(candidate) > PHRASE_MAX && line) {
        wrapped.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) wrapped.push(line);
    return wrapped;
  });

  const tail = wrapped.at(-1);
  const beforeTail = wrapped.at(-2);
  if (
    tail &&
    beforeTail &&
    tail.trim().split(/\s+/).length === 1 &&
    wrapLength(`${beforeTail} ${tail}`) <= PHRASE_MAX * 1.4
  ) {
    wrapped.splice(-2, 2, `${beforeTail} ${tail}`);
  }

  return wrapped;
}

function phraseIndexAtProgress(phrases: string[], progress: number): number {
  const weights = phrases.map((phrase) =>
    Math.max(1, phrase.replace(/\s+/g, "").length),
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const targetWeight =
    Math.max(0, Math.min(1, progress)) * Math.max(1, totalWeight);

  let cumulativeWeight = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cumulativeWeight += weights[index];
    if (targetWeight < cumulativeWeight) {
      return index;
    }
  }

  return Math.max(0, phrases.length - 1);
}

export default function Practice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { settings, completeCurrent } = useSchedule();

  const [remaining, setRemaining] = useState(settings.sessionDurationSec);
  const [running, setRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [muted, setMuted] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    setRemaining(settings.sessionDurationSec);
  }, [settings.sessionDurationSec]);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  useEffect(() => {
    if (running && remaining === 0) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  const totalSec = Math.max(1, settings.sessionDurationSec);
  const elapsed = totalSec - remaining;
  const elapsedRatio = elapsed / totalSec;

  const stepCount = MANEUVERS.length;
  const activeStep = Math.min(
    stepCount,
    Math.max(1, Math.ceil(elapsedRatio * stepCount)),
  );
  const current = MANEUVERS[activeStep - 1];
  const narration = useManeuverNarration({
    enabled: running && settings.audioGuideEnabled,
    muted,
    lang,
    maneuver: current.n,
  });

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    setRunning(false);
    narration.stop();
    try {
      const slot = await completeCurrent({
        completedAt: startedAtRef.current ?? undefined,
      });
      router.replace({ pathname: "/report", params: { slot } });
    } catch {
      // Let the user retry rather than leaving the screen wedged.
      setFinishing(false);
    }
  }

  const stepDuration = totalSec / stepCount;
  const timeInStep = Math.max(
    0,
    Math.min(stepDuration, elapsed - (activeStep - 1) * stepDuration),
  );
  const stepFill = stepDuration > 0 ? timeInStep / stepDuration : 0;

  // Short phrases for the current maneuver, revealed one at a time across the
  // step so the screen never shows more than a line or two.
  const phrases = useMemo(
    () => splitPhrases(t(`maneuver.${current.n}.text` as TranslationKey)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current.n, lang],
  );
  const phraseCount = Math.max(1, phrases.length);
  const phraseProgress =
    running && settings.audioGuideEnabled && narration.duration > 0
      ? narration.currentTime / narration.duration
      : stepFill;
  const phraseIndex = Math.min(
    phraseCount - 1,
    phraseIndexAtProgress(phrases, phraseProgress),
  );
  const phrase = phrases[phraseIndex] ?? "";

  // Crossfade the phrase whenever it changes (new phrase or new step).
  const fade = useRef(new Animated.Value(1)).current;
  const fadeKey = `${activeStep}:${phraseIndex}`;
  const prevKey = useRef(fadeKey);
  useEffect(() => {
    if (prevKey.current === fadeKey) return;
    prevKey.current = fadeKey;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeKey, fade]);

  const guided = settings.showGuidedSteps;

  return (
    <View style={styles.screen}>
      <PracticeBackground />

      <Text style={[styles.topTimer, { top: insets.top + 12 }]}>
        {fmt(remaining)}
      </Text>
      {running && settings.audioGuideEnabled ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t(
            muted ? "practice.unmute" : "practice.mute",
          )}
          style={[styles.muteButton, { top: insets.top + 6 }]}
          onPress={() => setMuted((value) => !value)}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <Ionicons
            name={muted ? "volume-mute-outline" : "volume-high-outline"}
            size={18}
            color={muted ? "#9490ad" : "#d7d1f8"}
          />
          <Text style={[styles.muteText, muted && styles.muteTextMuted]}>
            {t(muted ? "practice.unmute" : "practice.mute")}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.center}>
        <View style={styles.illustrationWrap} pointerEvents="none">
          <EnergyBodyIllustration
            progress={elapsedRatio}
            height={ILLUSTRATION_HEIGHT}
            active={running}
          />
        </View>

        {guided ? (
          <Animated.View style={[styles.textOverlay, { opacity: fade }]}>
            <Text style={styles.eyebrow}>
              {t(`maneuver.${current.n}.title` as TranslationKey)}
            </Text>
            <Text style={styles.headline}>{phrase}</Text>
            {phraseCount > 1 ? (
              <Text style={styles.phraseCounter}>
                {phraseIndex + 1} / {phraseCount}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {running ? (
          <>
            {guided ? (
              <>
                <View style={styles.segments}>
                  {MANEUVERS.map((m) => {
                    const isPast = m.n < activeStep;
                    const isCurrent = m.n === activeStep;
                    const fillPct = isPast ? 1 : isCurrent ? stepFill : 0;
                    return (
                      <View key={m.n} style={styles.segmentTrack}>
                        <View
                          style={[
                            styles.segmentFill,
                            isCurrent && styles.segmentFillCurrent,
                            { width: `${Math.round(fillPct * 100)}%` },
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {t("practice.stepLabel", {
                      n: activeStep,
                      total: stepCount,
                    })}
                  </Text>
                  <Text style={styles.metaText}>
                    {t("practice.inStep", { time: fmt(timeInStep) })}
                  </Text>
                </View>
              </>
            ) : null}

            <TouchableOpacity onPress={finish} hitSlop={12}>
              <Text style={styles.finish}>{t("practice.finishShort")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                narration.stop();
                router.back();
              }}
              hitSlop={12}
            >
              <Text style={styles.cancel}>{t("practice.cancel")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {
                startedAtRef.current = new Date();
                setMuted(false);
                setRunning(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.startText}>{t("practice.start")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.cancel}>{t("practice.cancel")}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#141019",
  },
  topTimer: {
    position: "absolute",
    right: 24,
    color: "#8b88a3",
    fontSize: 17,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    zIndex: 10,
  },
  muteButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(43, 40, 54, 0.88)",
  },
  muteText: {
    color: "#d7d1f8",
    fontSize: 13,
    fontWeight: "700",
  },
  muteTextMuted: {
    color: "#9490ad",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  textOverlay: {
    paddingHorizontal: 36,
    alignItems: "center",
    gap: 14,
    minHeight: 150,
    justifyContent: "center",
  },
  eyebrow: {
    color: "#9490ad",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  headline: {
    color: "#f4f2f8",
    fontFamily: SERIF,
    fontSize: 30,
    lineHeight: 40,
    textAlign: "center",
    textShadowColor: "rgba(20,16,25,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  phraseCounter: {
    color: "#6f6c85",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
  },
  segments: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2b2836",
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#6d5ef2",
  },
  segmentFillCurrent: {
    backgroundColor: "#b3a7f7",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  metaText: {
    color: "#6f6c85",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  finish: {
    color: "#b6b3c9",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  startBtn: {
    backgroundColor: "#6d5ef2",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  startText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cancel: { color: "#8b88a3", fontSize: 15 },
});
