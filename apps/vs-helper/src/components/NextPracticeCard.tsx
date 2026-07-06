import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/features/i18n";
import ProgressRing from "@/components/ProgressRing";

interface Props {
  nextDue: Date | null;
  spacingMin: number;
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

export default function NextPracticeCard({
  nextDue,
  spacingMin,
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

  // Pulse the countdown while in the alarm window.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!alarm && !due) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
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
  }, [alarm, due, pulse]);

  const urgent = alarm || due;

  const countdownText =
    due || msToNext === null ? t("next.dueNow") : formatCountdown(msToNext);

  return (
    <View style={[styles.card, urgent && styles.cardAlarm]}>
      <View style={styles.split}>
        <View style={styles.progressCol}>
          <ProgressRing
            size={92}
            progress={target ? completed / target : 0}
            label={`${completed}/${target}`}
            sublabel={t("stats.today")}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.nextCol}>
          <Text style={styles.caption}>{t("next.caption")}</Text>
          <Text style={[styles.time, urgent && styles.timeAlarm]}>
            {nextDue ? formatClock(nextDue) : t("next.allDone")}
          </Text>

          {nextDue ? (
            <Animated.View
              style={[
                styles.countdownRow,
                urgent && { transform: [{ scale: pulse }] },
              ]}
            >
              {urgent ? (
                <Ionicons name="alarm" size={20} color="#dc2626" />
              ) : null}
              <Text style={[styles.countdown, urgent && styles.countdownAlarm]}>
                {countdownText}
              </Text>
            </Animated.View>
          ) : null}

          {alarm ? (
            <Text style={styles.getReady}>{t("next.getReady")}</Text>
          ) : null}
        </View>
      </View>

      {nextDue ? (
        <Text style={styles.spacing}>
          {t("next.spacing", { min: spacingMin })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
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
  split: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  progressCol: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  nextCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  caption: {
    fontSize: 13,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  time: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e293b",
  },
  timeAlarm: {
    color: "#b91c1c",
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 2,
  },
  countdown: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366f1",
    fontVariant: ["tabular-nums"],
  },
  countdownAlarm: {
    fontSize: 24,
    color: "#dc2626",
  },
  getReady: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  spacing: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
