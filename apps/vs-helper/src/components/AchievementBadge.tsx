import { View, Text, StyleSheet } from "react-native";
import type { Achievement } from "@/features/vs/types";

export default function AchievementBadge({ item }: { item: Achievement }) {
  const unlocked = !!item.unlockedAt;
  return (
    <View style={[styles.row, !unlocked && styles.locked]}>
      <View style={[styles.dot, unlocked ? styles.dotOn : styles.dotOff]}>
        <Text style={styles.dotText}>{unlocked ? "★" : "☆"}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>
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
    padding: 14,
  },
  locked: {
    opacity: 0.5,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: "#fef3c7" },
  dotOff: { backgroundColor: "#e2e8f0" },
  dotText: { fontSize: 18 },
  textCol: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  desc: { fontSize: 13, color: "#64748b" },
});
