import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  value: string | number;
}

export default function StatCard({ label, value }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
    flexGrow: 1,
    flexBasis: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});
