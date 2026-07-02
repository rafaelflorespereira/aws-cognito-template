import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSchedule } from "@/features/vs/useSchedule";
import { MANEUVERS } from "@/features/vs/content";
import PracticeStep from "@/components/PracticeStep";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Practice() {
  const router = useRouter();
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.timer}>{fmt(remaining)}</Text>

      {!running ? (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setRunning(true)}
        >
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.finishBtn} onPress={finish}>
          <Text style={styles.finishText}>Finish now</Text>
        </TouchableOpacity>
      )}

      {settings.showGuidedSteps && (
        <View style={styles.steps}>
          {MANEUVERS.map((m) => (
            <PracticeStep
              key={m.n}
              n={m.n}
              title={m.title}
              text={m.text}
              active={running && m.n === activeStep}
            />
          ))}
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 24,
    gap: 16,
    paddingTop: 72,
  },
  timer: {
    fontSize: 64,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
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
  steps: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    marginTop: 8,
  },
  cancel: { color: "#94a3b8", fontSize: 15, marginTop: 8 },
});
