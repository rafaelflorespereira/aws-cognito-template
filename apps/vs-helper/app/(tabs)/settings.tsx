import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSchedule } from "@/features/vs/useSchedule";
import {
  useI18n,
  SUPPORTED_LANGS,
  LANG_NAMES,
  type Lang,
} from "@/features/i18n";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function timeStrToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function dateToTimeStr(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useI18n();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === "1";
  const { settings, updateSettings, loading } = useSchedule();

  const [timesPerDay, setTimesPerDay] = useState("20");
  const [firstTime, setFirstTime] = useState(() => timeStrToDate("07:00"));
  const [lastTime, setLastTime] = useState(() => timeStrToDate("22:00"));
  const [durationMin, setDurationMin] = useState(2);
  const [durationSec, setDurationSec] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [guided, setGuided] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading || hydrated) return;
    setTimesPerDay(String(settings.timesPerDay));
    setFirstTime(timeStrToDate(settings.firstTime));
    setLastTime(timeStrToDate(settings.lastTime));
    setDurationMin(Math.floor(settings.sessionDurationSec / 60));
    setDurationSec(settings.sessionDurationSec % 60);
    setNotifications(settings.notificationsEnabled);
    setGuided(settings.showGuidedSteps);
    setHydrated(true);
  }, [loading, hydrated, settings]);

  async function handleSave() {
    await updateSettings({
      timesPerDay: Math.max(1, parseInt(timesPerDay, 10) || 1),
      firstTime: dateToTimeStr(firstTime),
      lastTime: dateToTimeStr(lastTime),
      sessionDurationSec: Math.max(15, durationMin * 60 + durationSec),
      notificationsEnabled: notifications,
      showGuidedSteps: guided,
      configured: true,
    });
    router.replace("/");
  }

  function bumpTimesPerDay(delta: number) {
    const n = parseInt(timesPerDay, 10) || 0;
    setTimesPerDay(String(clamp(n + delta, 1, 99)));
  }

  function bumpDurationMin(delta: number) {
    setDurationMin((v) => clamp(v + delta, 0, 59));
  }

  function bumpDurationSec(delta: number) {
    setDurationSec((v) => clamp(v + delta, 0, 59));
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
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => bumpTimesPerDay(-1)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TextInput
            style={styles.stepperInput}
            value={timesPerDay}
            onChangeText={(txt) => setTimesPerDay(txt.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => bumpTimesPerDay(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </Field>

      <TimeField
        label={t("settings.firstTime")}
        value={firstTime}
        onChange={setFirstTime}
      />

      <TimeField
        label={t("settings.lastTime")}
        value={lastTime}
        onChange={setLastTime}
      />

      <Field label={t("settings.duration")}>
        <View style={styles.timerBox}>
          <DurationUnit
            value={durationMin}
            unit={t("settings.min")}
            onBump={bumpDurationMin}
          />
          <Text style={styles.timerColon}>:</Text>
          <DurationUnit
            value={durationSec}
            unit={t("settings.sec")}
            onBump={bumpDurationSec}
            step={5}
          />
        </View>
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

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);

  function open() {
    setDraft(value);
    setVisible(true);
  }

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      setVisible(false);
      if (event.type === "set" && date) onChange(date);
      return;
    }
    if (date) setDraft(date);
  }

  return (
    <Field label={label}>
      <TouchableOpacity
        style={styles.pickerTrigger}
        onPress={open}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={18} color="#6366f1" />
        <Text style={styles.pickerTriggerText}>{dateToTimeStr(value)}</Text>
      </TouchableOpacity>

      {visible && Platform.OS === "android" && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          display="default"
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onChange(draft);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draft}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </Field>
  );
}

function DurationUnit({
  value,
  unit,
  onBump,
  step = 1,
}: {
  value: number;
  unit: string;
  onBump: (delta: number) => void;
  step?: number;
}) {
  return (
    <View style={styles.timerColumn}>
      <TouchableOpacity
        style={styles.stepperBtnSm}
        onPress={() => onBump(step)}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-up" size={18} color="#6366f1" />
      </TouchableOpacity>
      <Text style={styles.timerValue}>{String(value).padStart(2, "0")}</Text>
      <TouchableOpacity
        style={styles.stepperBtnSm}
        onPress={() => onBump(-step)}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-down" size={18} color="#6366f1" />
      </TouchableOpacity>
      <Text style={styles.timerUnit}>{unit}</Text>
    </View>
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

  // Number stepper (times per day)
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Time picker trigger
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  pickerTriggerText: { fontSize: 16, fontWeight: "600", color: "#0f172a" },

  // iOS spinner modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalCancel: { fontSize: 16, color: "#64748b" },
  modalDone: { fontSize: 16, color: "#6366f1", fontWeight: "700" },

  // Duration timer (minutes:seconds steppers)
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 16,
  },
  timerColumn: { alignItems: "center", gap: 4 },
  stepperBtnSm: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  timerValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    minWidth: 36,
    textAlign: "center",
  },
  timerUnit: { fontSize: 12, color: "#94a3b8" },
  timerColon: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
});
