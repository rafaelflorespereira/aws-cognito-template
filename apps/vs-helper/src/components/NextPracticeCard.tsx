import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/features/i18n";
import ProgressRing from "@/components/ProgressRing";

interface Props {
  nextDue: Date | null;
  completed: number;
  target: number;
}

// Sessions within this window trigger the urgent "alarm" state.
const ALARM_MS = 5 * 60 * 1000;

function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

// The day's single focal point: one big ring for today's progress, with a
// single status line underneath (next time, live countdown, or "all done").
// Intentionally leaves out secondary detail (session spacing, captions) that
// used to sit alongside it — that lives on the Progress tab instead.
export default function NextPracticeCard({
  nextDue,
  completed,
  target,
}: Props) {
  const { t } = useI18n();
  const [now, setNow] = useState<Date>(new Date());

  // Live countdown: refresh once a second while a session is pending.
  useEffect(() => {
    if (!nextDue) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [nextDue]);

  const msToNext = nextDue ? nextDue.getTime() - now.getTime() : null;
  const due = msToNext !== null && msToNext <= 0;
  const alarm = msToNext !== null && msToNext > 0 && msToNext <= ALARM_MS;
  const urgent = alarm || due;
  const allDone = !nextDue;

  // Pulse the status line while in the alarm window.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!urgent) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [urgent, pulse]);

  return (
    <View style={[styles.card, urgent && styles.cardAlarm]}>
      <ProgressRing
        size={176}
        progress={target ? completed / target : 0}
        label={`${completed}/${target}`}
        labelFontSize={42}
        sublabel={t("stats.today")}
      />

      {allDone ? (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <Text style={styles.statusDone}>{t("next.allDone")}</Text>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.statusRow,
            urgent && { transform: [{ scale: pulse }] },
          ]}
        >
          {urgent ? (
            <Ionicons name="alarm" size={18} color="#dc2626" />
          ) : null}
          <Text style={[styles.statusText, urgent && styles.statusAlarm]}>
            {due
              ? t("next.dueNow")
              : alarm
                ? formatCountdown(msToNext!)
                : t("home.nextAt", { time: formatClock(nextDue!) })}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 14,
    width: "100%",
    maxWidth: 360,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAlarm: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    fontVariant: ["tabular-nums"],
  },
  statusAlarm: {
    fontSize: 20,
    color: "#dc2626",
  },
  statusDone: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22c55e",
  },
});
