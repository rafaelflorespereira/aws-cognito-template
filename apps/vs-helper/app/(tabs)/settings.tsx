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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSchedule } from "@/features/vs/useSchedule";
import {
  useI18n,
  SUPPORTED_LANGS,
  LANG_NAMES,
  type Lang,
} from "@/features/i18n";

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useI18n();
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
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <Text style={styles.title}>
        {isOnboarding ? t("settings.setupTitle") : t("settings.title")}
      </Text>
      {isOnboarding && <Text style={styles.intro}>{t("settings.intro")}</Text>}

      <Field label={t("settings.language")}>
        <View style={styles.langRow}>
          {SUPPORTED_LANGS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langChip, lang === l && styles.langChipOn]}
              onPress={() => setLang(l as Lang)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.langChipText,
                  lang === l && styles.langChipTextOn,
                ]}
              >
                {LANG_NAMES[l]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label={t("settings.timesPerDay")}>
        <TextInput
          style={styles.input}
          value={timesPerDay}
          onChangeText={setTimesPerDay}
          keyboardType="number-pad"
        />
      </Field>

      <Field label={t("settings.firstTime")}>
        <TextInput
          style={styles.input}
          value={firstTime}
          onChangeText={setFirstTime}
          placeholder="07:00"
          autoCapitalize="none"
        />
      </Field>

      <Field label={t("settings.lastTime")}>
        <TextInput
          style={styles.input}
          value={lastTime}
          onChangeText={setLastTime}
          placeholder="22:00"
          autoCapitalize="none"
        />
      </Field>

      <Field label={t("settings.duration")}>
        <TextInput
          style={styles.input}
          value={durationMin}
          onChangeText={setDurationMin}
          keyboardType="decimal-pad"
        />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("settings.notifications")}</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("settings.guidedSteps")}</Text>
        <Switch value={guided} onValueChange={setGuided} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>
          {isOnboarding ? t("settings.startPracticing") : t("settings.save")}
        </Text>
      </TouchableOpacity>
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
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  langChipOn: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  langChipText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  langChipTextOn: { color: "#fff" },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
