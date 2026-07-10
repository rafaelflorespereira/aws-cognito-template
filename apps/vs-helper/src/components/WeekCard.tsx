import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

import { useI18n } from "@/features/i18n";
import { type WeekDay } from "./WeekProgress";

export interface WeekCardProps {
  days: WeekDay[]; // exactly 7, Monday..Sunday
  runningTotal: number;
  runningTarget: number;
  currentStreak: number;
  bestStreak: number;
}

const BAR_HEIGHT = 72;
const BAR_WIDTH = 24;

export default function WeekCard({
  days,
  runningTotal,
  runningTarget,
  currentStreak,
  bestStreak,
}: WeekCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{t("week.thisWeek")}</Text>
        <Text style={styles.totalText}>
          <Text style={styles.totalDone}>{runningTotal}</Text>
          {` / ${runningTarget}`}
        </Text>
      </View>

      <View style={styles.chartRow}>
        {days.map((day) => (
          <DayBar key={day.date} day={day} />
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.streakRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="triangle" size={12} color="#6366f1" />
          </View>
          <Text style={styles.streakText}>
            {t("week.streak", { days: currentStreak })}
          </Text>
        </View>
        <Text style={styles.bestText}>{t("week.best", { n: bestStreak })}</Text>
      </View>
    </View>
  );
}

function DayBar({ day }: { day: WeekDay }) {
  const target = Math.max(1, day.target);
  // Clamp each day's fill to a 0..1 ratio so over-target days render full.
  const ratio = Math.max(0, Math.min(1, day.completed / target));
  const fillHeight = BAR_HEIGHT * ratio;

  return (
    <View style={styles.dayColumn}>
      <View style={styles.barTrack}>
        {ratio > 0 ? <View style={[styles.barFill, { height: fillHeight }]} /> : null}
      </View>
      <Text style={[styles.weekday, day.isToday && styles.weekdayToday]}>
        {day.weekday}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  totalText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
  },
  totalDone: {
    color: "#0f172a",
    fontWeight: "800",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
  },
  dayColumn: {
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 6,
    backgroundColor: "#ede9fe",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
    backgroundColor: "#6366f1",
  },
  weekday: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  weekdayToday: {
    color: "#6366f1",
    fontWeight: "900",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 8,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ede9fe",
  },
  streakText: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "700",
  },
  bestText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
  },
});
