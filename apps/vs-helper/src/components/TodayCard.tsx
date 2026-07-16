import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "@/features/i18n";

export interface TodayCardProps {
  completed: number;
  target: number;
  next: string | null; // "HH:mm" of the immediate next slot, if any
  slots: string[]; // today's full schedule, "HH:mm"
  firstTime: string; // window start, "HH:mm"
  lastTime: string; // window end, "HH:mm"
}

// The home screen's hero: the count is the biggest thing on screen, and a
// single segmented bar carries count + order + next in one glance (no circular
// gauge). Done sessions and the immediate next one fill left-to-right; the
// remaining slots stay as faint ticks.
export default function TodayCard({
  completed,
  target,
  next,
  slots,
  firstTime,
  lastTime,
}: TodayCardProps) {
  const { t } = useI18n();

  const segmentCount = Math.max(1, target);
  const done = target > 0 && completed >= target;
  // The next slot is the first not-yet-done one; fill up to and including it so
  // the bar visibly "points" at what's coming next.
  const nextIndex = next ? slots.indexOf(next) : -1;
  const fillThrough = done
    ? segmentCount
    : Math.max(completed, nextIndex >= 0 ? nextIndex + 1 : completed);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.countRow}>
          <Text style={styles.count}>{completed}</Text>
          <Text style={styles.total}>{` / ${target}`}</Text>
        </View>
        <View style={styles.labelCol}>
          <Text style={styles.practices}>{t("today.practices")}</Text>
          <Text style={styles.todayLabel}>{t("today.todayLabel")}</Text>
        </View>
      </View>

      <View style={styles.barRow}>
        {Array.from({ length: segmentCount }, (_, i) => {
          const isDone = i < completed;
          const isNext = !done && i === nextIndex;
          const filled = i < fillThrough;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                filled
                  ? done
                    ? styles.segmentDone
                    : styles.segmentFilled
                  : styles.segmentEmpty,
                isNext && styles.segmentNext,
                isDone && done && styles.segmentComplete,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.boundsRow}>
        <Text style={styles.boundsText}>{firstTime}</Text>
        <Text style={styles.boundsText}>{lastTime}</Text>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 40;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  count: {
    fontSize: 64,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -2,
    lineHeight: 68,
  },
  total: {
    fontSize: 30,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
  },
  labelCol: {
    alignItems: "flex-end",
    marginTop: 10,
  },
  practices: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#6366f1",
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: BAR_HEIGHT,
    gap: 3,
    marginTop: 20,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
  segmentEmpty: {
    height: BAR_HEIGHT * 0.55,
    backgroundColor: "#eceafd",
  },
  segmentFilled: {
    height: BAR_HEIGHT,
    backgroundColor: "#6366f1",
  },
  segmentNext: {
    height: BAR_HEIGHT,
    backgroundColor: "#a5b4fc",
  },
  segmentDone: {
    height: BAR_HEIGHT,
    backgroundColor: "#22c55e",
  },
  segmentComplete: {
    backgroundColor: "#22c55e",
  },
  boundsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  boundsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
});
