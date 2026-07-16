import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useI18n } from "@/features/i18n";
import { type WeekDay } from "./WeekProgress";

export interface WeekStripCardProps {
  label: string;
  onLabelPress?: () => void; // set when viewing a past week, to jump back to the current one
  days: WeekDay[]; // exactly 7, Monday..Sunday
  runningTotal: number;
  runningTarget: number;
  bestStreak: number;
}

const BAR_HEIGHT = 26;

// A single compact row: the week's running total on the left, a mini bar chart
// of the seven days in the middle, and the best streak on the right.
export default function WeekStripCard({
  label,
  onLabelPress,
  days,
  runningTotal,
  runningTarget,
  bestStreak,
}: WeekStripCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        {onLabelPress ? (
          <TouchableOpacity onPress={onLabelPress} hitSlop={8}>
            <Text style={[styles.label, styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
        <Text style={styles.totalText}>
          <Text style={styles.totalDone}>{runningTotal}</Text>
          {` / ${runningTarget}`}
        </Text>
      </View>

      <View style={styles.chartRow}>
        {days.map((day) => {
          const target = Math.max(1, day.target);
          const ratio = Math.max(0, Math.min(1, day.completed / target));
          return (
            <View key={day.date} style={styles.barTrack}>
              {ratio > 0 ? (
                <View
                  style={[
                    styles.barFill,
                    { height: Math.max(3, BAR_HEIGHT * ratio) },
                    day.isToday && styles.barFillToday,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.bestRow}>
        <Ionicons name="triangle" size={11} color="#64748b" />
        <Text style={styles.bestText}>{t("week.best", { n: bestStreak })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  leftCol: {
    gap: 2,
  },
  label: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  labelActive: {
    color: "#6366f1",
  },
  totalText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  totalDone: {
    color: "#0f172a",
    fontWeight: "800",
  },
  chartRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: BAR_HEIGHT,
    gap: 4,
  },
  barTrack: {
    width: 6,
    height: BAR_HEIGHT,
    borderRadius: 3,
    backgroundColor: "#eceafd",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 3,
    backgroundColor: "#c4b5fd",
  },
  barFillToday: {
    backgroundColor: "#6366f1",
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bestText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
});
