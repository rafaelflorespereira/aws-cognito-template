import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "@/features/i18n";

// Column headings for LeaderboardRow — widths/gap mirror that component so
// the labels line up with the numbers underneath.
export default function LeaderboardHeader() {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{t("leaderboard.colRank")}</Text>
      <Text style={styles.handle}>{t("leaderboard.colPlayer")}</Text>
      <Text style={styles.streak}>{t("leaderboard.colStreak")}</Text>
      <Text style={styles.total}>{t("leaderboard.colTotal")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
  },
  rank: {
    width: 36,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  handle: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  streak: {
    width: 40,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  total: {
    width: 48,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
