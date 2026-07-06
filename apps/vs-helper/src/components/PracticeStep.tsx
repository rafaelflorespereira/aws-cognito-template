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
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: { backgroundColor: "#6366f1" },
  badgeText: { fontWeight: "700", color: "#94a3b8" },
  badgeTextActive: { color: "#fff" },
  col: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  text: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
});
