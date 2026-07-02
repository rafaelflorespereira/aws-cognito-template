import { View, Text, StyleSheet } from "react-native";

interface Props {
  n: number;
  title: string;
  text: string;
  active?: boolean;
}

export default function PracticeStep({ n, title, text, active }: Props) {
  return (
    <View style={[styles.row, active && styles.active]}>
      <View style={[styles.badge, active && styles.badgeActive]}>
        <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
          {n}
        </Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  active: {
    backgroundColor: "#eef2ff",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: { backgroundColor: "#6366f1" },
  badgeText: { fontWeight: "700", color: "#475569" },
  badgeTextActive: { color: "#fff" },
  col: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  text: { fontSize: 13, color: "#475569", marginTop: 2 },
});
