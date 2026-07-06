import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

export interface WeekDay {
  date: string; // "YYYY-MM-DD"
  dayOfMonth: number;
  weekday: string; // locale-aware narrow label, e.g. "M"
  completed: number;
  target: number;
  isToday: boolean;
}

const RING_SIZE = 36;
const RING_SIZE_TODAY = 44;

// A row of small rings, one per day of the trailing week, showing how much of
// that day's target was completed. Today is enlarged; achieved days swap
// their day number for a checkmark so a completed day reads at a glance.
export default function WeekProgress({ days }: { days: WeekDay[] }) {
  return (
    <View style={styles.row}>
      {days.map((day) => (
        <DayRing key={day.date} day={day} />
      ))}
    </View>
  );
}

function DayRing({ day }: { day: WeekDay }) {
  const size = day.isToday ? RING_SIZE_TODAY : RING_SIZE;
  const target = Math.max(1, day.target);
  const ratio = Math.max(0, Math.min(1, day.completed / target));
  const achieved = day.completed >= target;
  const stroke = Math.round(size * 0.12);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * ratio;
  const center = size / 2;
  const color = achieved ? "#22c55e" : "#6366f1";

  return (
    <View style={styles.dayCol}>
      <Text style={[styles.weekday, day.isToday && styles.weekdayToday]}>
        {day.weekday}
      </Text>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="none"
          />
          {ratio > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
        </Svg>
        <View style={styles.center}>
          {achieved ? (
            <Ionicons name="checkmark" size={size * 0.5} color="#22c55e" />
          ) : (
            <Text
              style={[
                styles.dayNum,
                day.isToday && styles.dayNumToday,
                { fontSize: size * 0.36 },
              ]}
            >
              {day.dayOfMonth}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
  },
  dayCol: { alignItems: "center", gap: 6 },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  weekday: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  weekdayToday: { color: "#6366f1", fontWeight: "800" },
  dayNum: { fontWeight: "700", color: "#475569" },
  dayNumToday: { color: "#312e81" },
});
