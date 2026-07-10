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
import { useSchedule } from "@/features/vs/useSchedule";
import { MANEUVERS } from "@/features/vs/content";
import { useI18n, type TranslationKey } from "@/features/i18n";
import PracticeBackground from "@/components/PracticeBackground";
import EnergyBodyIllustration from "@/components/EnergyBodyIllustration";

const ILLUSTRATION_HEIGHT = 400;
const SERIF = "PlayfairDisplay_600SemiBold";
const PHRASE_MAX = 46; // target max characters per on-screen phrase

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
    .map((s) => s.replace(/[.!?]+$/, "").trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= PHRASE_MAX) {
      out.push(sentence);
      continue;
    }
    let buf = "";
    for (const part of sentence.split(/,\s*/)) {
      const candidate = buf ? `${buf}, ${part}` : part;
      if (candidate.length > PHRASE_MAX && buf) {
        out.push(buf);
        buf = part;
      } else {
        buf = candidate;
      }
    }
    if (buf) out.push(buf);
  }

  // Hard-wrap any remaining over-long chunk by words.
  return out.flatMap((chunk) => {
    if (chunk.length <= PHRASE_MAX * 1.4) return [chunk];
    const words = chunk.split(/\s+/);
    const wrapped: string[] = [];
    let line = "";
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (candidate.length > PHRASE_MAX && line) {
        wrapped.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) wrapped.push(line);
    return wrapped;
  });
}

export default function Practice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { settings, completeCurrent } = useSchedule();

  const [remaining, setRemaining] = useState(settings.sessionDurationSec);
  const [running, setRunning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    setRunning(false);
    try {
      const slot = await completeCurrent();
      router.replace({ pathname: "/report", params: { slot } });
    } catch {
      // Let the user retry rather than leaving the screen wedged.
      setFinishing(false);
    }
  }

  const totalSec = Math.max(1, settings.sessionDurationSec);
  const elapsed = totalSec - remaining;
  const elapsedRatio = elapsed / totalSec;

  const stepCount = MANEUVERS.length;
  const activeStep = Math.min(
    stepCount,
    Math.max(1, Math.ceil(elapsedRatio * stepCount)),
  );
  const current = MANEUVERS[activeStep - 1];

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
  const phraseIndex = Math.min(
    phraseCount - 1,
    Math.floor(stepFill * phraseCount),
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

      <View style={styles.center}>
        <View style={styles.illustrationWrap} pointerEvents="none">
          <EnergyBodyIllustration
            progress={elapsedRatio}
            height={ILLUSTRATION_HEIGHT}
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
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setRunning(true)}
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
