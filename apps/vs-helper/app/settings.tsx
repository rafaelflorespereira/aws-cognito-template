import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSchedule } from "@/features/vs/useSchedule";

export default function Settings() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === "1";
  const { settings, updateSettings, loading } = useSchedule();

  const [timesPerDay, setTimesPerDay] = useState("20");
  const [firstTime, setFirstTime] = useState("07:00");
  const [lastTime, setLastTime] = useState("22:00");
  const [durationMin, setDurationMin] = useState("2");
  const [notifications, setNotifications] = useState(true);
  const [guided, setGuided] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading || hydrated) return;
    setTimesPerDay(String(settings.timesPerDay));
    setFirstTime(settings.firstTime);
    setLastTime(settings.lastTime);
    setDurationMin(String(Math.round(settings.sessionDurationSec / 60)));
    setNotifications(settings.notificationsEnabled);
    setGuided(settings.showGuidedSteps);
    setHydrated(true);
  }, [loading, hydrated, settings]);

  async function handleSave() {
    await updateSettings({
      timesPerDay: Math.max(1, parseInt(timesPerDay, 10) || 1),
      firstTime: firstTime.trim(),
      lastTime: lastTime.trim(),
      sessionDurationSec: Math.max(
        15,
        Math.round((parseFloat(durationMin) || 2) * 60),
      ),
      notificationsEnabled: notifications,
      showGuidedSteps: guided,
      configured: true,
    });
    router.replace("/");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {isOnboarding ? "Set up your practice" : "Settings"}
      </Text>
      {isOnboarding && (
        <Text style={styles.intro}>
          Choose how many times a day to practice and your daily window.
          We&apos;ll space the reminders evenly through the day.
        </Text>
      )}

      <Field label="Times per day">
        <TextInput
          style={styles.input}
          value={timesPerDay}
          onChangeText={setTimesPerDay}
          keyboardType="number-pad"
        />
      </Field>

      <Field label="First time (HH:mm)">
        <TextInput
          style={styles.input}
          value={firstTime}
          onChangeText={setFirstTime}
          placeholder="07:00"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Last time (HH:mm)">
        <TextInput
          style={styles.input}
          value={lastTime}
          onChangeText={setLastTime}
          placeholder="22:00"
          autoCapitalize="none"
        />
      </Field>

      <Field label="Session duration (minutes)">
        <TextInput
          style={styles.input}
          value={durationMin}
          onChangeText={setDurationMin}
          keyboardType="decimal-pad"
        />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Show guided steps</Text>
        <Switch value={guided} onValueChange={setGuided} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>
          {isOnboarding ? "Start practicing" : "Save"}
        </Text>
      </TouchableOpacity>

      {!isOnboarding && (
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  intro: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 15, color: "#334155" },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  back: { textAlign: "center", color: "#64748b", fontWeight: "600" },
});
