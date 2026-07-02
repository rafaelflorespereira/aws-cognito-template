import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import type { Chakra, SessionReport } from "@/features/vs/types";
import { CHAKRAS, PERCEPTIONS } from "@/features/vs/content";

interface Props {
  slot: string;
  onSave: (report: SessionReport) => void;
  onSkip: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function ReportForm({ slot, onSave, onSkip }: Props) {
  const [chakrasActive, setChakrasActive] = useState<Chakra[]>([]);
  const [chakrasBlocked, setChakrasBlocked] = useState<Chakra[]>([]);
  const [wellbeing, setWellbeing] = useState(4);
  const [perceptions, setPerceptions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function handleSave() {
    onSave({
      slot,
      completedAt: new Date().toISOString(),
      chakrasActive,
      chakrasBlocked,
      wellbeing,
      perceptions,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>How was it?</Text>

      <Text style={styles.section}>Chakras felt most active</Text>
      <View style={styles.chipWrap}>
        {CHAKRAS.map((c) => (
          <Chip
            key={`a-${c.id}`}
            label={c.label}
            selected={chakrasActive.includes(c.id)}
            onPress={() => setChakrasActive((p) => toggle(p, c.id))}
          />
        ))}
      </View>

      <Text style={styles.section}>Chakras felt blocked</Text>
      <View style={styles.chipWrap}>
        {CHAKRAS.map((c) => (
          <Chip
            key={`b-${c.id}`}
            label={c.label}
            selected={chakrasBlocked.includes(c.id)}
            onPress={() => setChakrasBlocked((p) => toggle(p, c.id))}
          />
        ))}
      </View>

      <Text style={styles.section}>Wellbeing after</Text>
      <View style={styles.chipWrap}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip
            key={`w-${n}`}
            label={String(n)}
            selected={wellbeing === n}
            onPress={() => setWellbeing(n)}
          />
        ))}
      </View>

      <Text style={styles.section}>Perceptions</Text>
      <View style={styles.chipWrap}>
        {PERCEPTIONS.map((p) => (
          <Chip
            key={`p-${p}`}
            label={p}
            selected={perceptions.includes(p)}
            onPress={() => setPerceptions((prev) => toggle(prev, p))}
          />
        ))}
      </View>

      <Text style={styles.section}>Notes</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything you noticed (optional)"
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save report</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 8, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  chipOn: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  chipText: { color: "#475569", fontSize: 13, fontWeight: "500" },
  chipTextOn: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  skipBtn: { marginTop: 8, paddingVertical: 12, alignItems: "center" },
  skipText: { color: "#64748b", fontWeight: "600", fontSize: 15 },
});
