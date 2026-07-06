import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSchedule } from "@/features/vs/useSchedule";
import { MANEUVERS } from "@/features/vs/content";
import { useI18n, type TranslationKey } from "@/features/i18n";
import PracticeStep from "@/components/PracticeStep";
import PracticeBackground from "@/components/PracticeBackground";
import ProgressRing from "@/components/ProgressRing";
import EnergyBodyIllustration from "@/components/EnergyBodyIllustration";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Practice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
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
    const slot = await completeCurrent();
    router.replace({ pathname: "/report", params: { slot } });
  }

  const activeStep = Math.min(
    MANEUVERS.length,
    Math.max(
      1,
      Math.ceil(
        ((settings.sessionDurationSec - remaining) /
          Math.max(1, settings.sessionDurationSec)) *
          MANEUVERS.length,
      ),
    ),
  );
  const current = MANEUVERS[activeStep - 1];

  // Crossfade the step card in whenever the active maneuver changes.
  const fade = useRef(new Animated.Value(1)).current;
  const prevStep = useRef(activeStep);
  useEffect(() => {
    if (prevStep.current === activeStep) return;
    prevStep.current = activeStep;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeStep, fade]);

  const totalSec = Math.max(1, settings.sessionDurationSec);
  const elapsedRatio = (totalSec - remaining) / totalSec;

  // Focus transition: once running, the countdown shrinks into a small badge
  // pinned to the top of the screen and the illustration grows to take over
  // as the main focus.
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [illustrationHeight, setIllustrationHeight] = useState(240);
  useEffect(() => {
    const id = focusAnim.addListener(({ value }) => {
      setIllustrationHeight(240 + value * 120);
    });
    return () => focusAnim.removeListener(id);
  }, [focusAnim]);
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: running ? 1 : 0,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [running, focusAnim]);

  return (
    <View style={styles.screen}>
      <PracticeBackground />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.miniRing,
          {
            top: insets.top + 12,
            opacity: focusAnim,
            transform: [
              {
                scale: focusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <ProgressRing
          size={88}
          progress={elapsedRatio}
          label={fmt(remaining)}
          labelFontSize={20}
          trackColor="rgba(255,255,255,0.15)"
          labelColor="#fff"
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48 },
        ]}
      >
        <Animated.View
          style={[
            styles.energyArea,
            {
              flex: focusAnim,
              // Clears the mini countdown badge (top: insets.top+12, size
              // 88) which sits above the scroll content (padded
              // insets.top+48), so the centered illustration ends up with
              // equal space above and below it. Driven by the same
              // `focusAnim` as the ring collapse/illustration grow below so
              // the layout settles in one continuous motion instead of
              // snapping and re-animating.
              paddingTop: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 12 + 88 - 48],
              }),
            },
          ]}
        >
          <EnergyBodyIllustration
            progress={elapsedRatio}
            height={illustrationHeight}
          />
          <Text style={styles.energyCaption}>{t("practice.energyFlow")}</Text>
        </Animated.View>

        <Animated.View
          pointerEvents={running ? "none" : "auto"}
          style={{
            height: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [240, 0],
            }),
            opacity: focusAnim.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [1, 0, 0],
            }),
            overflow: "hidden",
          }}
        >
          <ProgressRing
            size={240}
            progress={elapsedRatio}
            label={fmt(remaining)}
            labelFontSize={52}
            trackColor="rgba(255,255,255,0.15)"
            labelColor="#fff"
          />
        </Animated.View>

        {!running ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setRunning(true)}
          >
            <Text style={styles.startText}>{t("practice.start")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishBtn} onPress={finish}>
            <Text style={styles.finishText}>{t("practice.finish")}</Text>
          </TouchableOpacity>
        )}

        {settings.showGuidedSteps && (
          <View style={styles.stepArea}>
            <View style={styles.dots}>
              {MANEUVERS.map((m) => (
                <View
                  key={m.n}
                  style={[styles.dot, m.n <= activeStep && styles.dotDone]}
                />
              ))}
            </View>

            <Animated.View style={[styles.stepCard, { opacity: fade }]}>
              <PracticeStep
                key={current.n}
                n={current.n}
                title={t(`maneuver.${current.n}.title` as TranslationKey)}
                text={t(`maneuver.${current.n}.text` as TranslationKey)}
                active
              />
            </Animated.View>
          </View>
        )}

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>{t("practice.cancel")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    gap: 16,
    paddingTop: 72,
  },
  startBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  startText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  finishBtn: {
    borderColor: "#94a3b8",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  finishText: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" },
  miniRing: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  energyArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  energyCaption: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  stepArea: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#334155",
  },
  dotDone: {
    backgroundColor: "#6366f1",
  },
  stepCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.35)",
    padding: 8,
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  cancel: { color: "#94a3b8", fontSize: 15, marginTop: 8 },
});
