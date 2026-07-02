import { View, Text, StyleSheet } from "react-native";

interface Props {
  next: string | null;
  completed: number;
  target: number;
}

export default function NextPracticeCard({ next, completed, target }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.caption}>Next practice</Text>
      <Text style={styles.time}>{next ?? "All done for today"}</Text>
      <Text style={styles.progress}>
        {completed} / {target} done today
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 4,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  caption: {
    fontSize: 13,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  time: {
    fontSize: 44,
    fontWeight: "800",
    color: "#1e293b",
  },
  progress: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
});
