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

  return (
    <View style={styles.screen}>
      <PracticeBackground />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48 },
        ]}
      >
        <ProgressRing
          size={240}
          progress={elapsedRatio}
          label={fmt(remaining)}
          labelFontSize={52}
          trackColor="rgba(255,255,255,0.15)"
          labelColor="#fff"
        />

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

        <View style={styles.energyArea}>
          <EnergyBodyIllustration progress={elapsedRatio} height={240} />
          <Text style={styles.energyCaption}>{t("practice.energyFlow")}</Text>
        </View>

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
  energyArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
  },
  cancel: { color: "#94a3b8", fontSize: 15, marginTop: 8 },
});
