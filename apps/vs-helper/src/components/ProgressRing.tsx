import { View, Text, StyleSheet } from "react-native";

interface Props {
  size?: number;
  progress: number; // 0..1
  label: string;
  sublabel?: string;
}

// Lightweight "ring" without extra SVG deps: a thick circular track with the
// value in the middle. Good enough for the dashboard/stats at-a-glance.
export default function ProgressRing({
  size = 160,
  progress,
  label,
  sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const border = Math.round(size * 0.08);
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: border,
            borderColor: clamped >= 1 ? "#22c55e" : "#6366f1",
            opacity: clamped === 0 ? 0.35 : 1,
          },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1e293b",
  },
  sublabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
});
