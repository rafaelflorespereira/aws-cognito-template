import { View, Text, StyleSheet } from "react-native";
import type { LeaderboardEntry } from "@vs/shared";

export default function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={[styles.row, entry.isYou && styles.rowYou]}>
      <Text style={[styles.rank, entry.isYou && styles.textYou]}>
        #{entry.rank}
      </Text>
      <Text
        style={[styles.handle, entry.isYou && styles.textYou]}
        numberOfLines={1}
      >
        {entry.handle}
      </Text>
      <Text style={[styles.streak, entry.isYou && styles.textYou]}>
        {entry.currentStreak}d
      </Text>
      <Text style={[styles.total, entry.isYou && styles.textYou]}>
        {entry.totalSessions}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowYou: { backgroundColor: "#6366f1" },
  rank: { width: 36, fontSize: 14, fontWeight: "700", color: "#94a3b8" },
  handle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1e293b" },
  streak: { width: 40, fontSize: 13, color: "#64748b", textAlign: "right" },
  total: {
    width: 48,
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "right",
  },
  textYou: { color: "#fff" },
});
