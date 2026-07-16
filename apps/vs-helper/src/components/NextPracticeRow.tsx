import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "@/features/i18n";

export interface NextPracticeRowProps {
  nextDue: Date | null; // adaptive recommended time for the next session
  now: Date;
  remainingAfter: number; // sessions still left after the next one
}

function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// The countdown, demoted from the old dome gauge to a plain row: a small badge
// with the minutes-to-next, the scheduled time, and how many remain after it.
export default function NextPracticeRow({
  nextDue,
  now,
  remainingAfter,
}: NextPracticeRowProps) {
  const { t } = useI18n();

  if (!nextDue) {
    return (
      <View style={styles.row}>
        <View style={[styles.badge, styles.badgeDone]}>
          <Text style={styles.badgeDoneText}>✓</Text>
        </View>
        <Text style={styles.title}>{t("next.allDone")}</Text>
      </View>
    );
  }

  const msToNext = nextDue.getTime() - now.getTime();
  const minutesToNext = Math.max(0, Math.ceil(msToNext / 60000));

  const subtitleParts = [t("next.rowIn", { min: minutesToNext })];
  if (remainingAfter > 0) {
    subtitleParts.push(t("next.rowLeftAfter", { n: remainingAfter }));
  }

  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{minutesToNext}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>
          {t("next.rowAt", { time: formatClock(nextDue) })}
        </Text>
        <Text style={styles.subtitle}>{subtitleParts.join(" · ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#6366f1",
    fontVariant: ["tabular-nums"],
  },
  badgeDone: {
    backgroundColor: "#dcfce7",
  },
  badgeDoneText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#22c55e",
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
  },
});
