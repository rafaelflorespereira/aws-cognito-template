import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/features/i18n";
import { useLeaderboard } from "@/features/vs/useLeaderboard";
import LeaderboardRow from "@/components/LeaderboardRow";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Leaderboard() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, signedIn, profile, entries, refresh, saveProfile } =
    useLeaderboard();

  const [handle, setHandle] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (loading) return;
    setHandle(profile.handle);
    setOptIn(profile.leaderboardOptIn);
    setHydrated(true);
  }, [loading, profile]);

  async function handleSave() {
    setFormError(null);
    if (optIn && !HANDLE_RE.test(handle)) {
      setFormError(t("leaderboard.handleInvalid"));
      return;
    }
    setSaving(true);
    const ok = await saveProfile({ handle, leaderboardOptIn: optIn });
    setSaving(false);
    if (!ok) setFormError(t("leaderboard.saveFailed"));
  }

  if (!hydrated && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="trophy-outline" size={56} color="#94a3b8" />
        <Text style={styles.blurb}>{t("leaderboard.signInBlurb")}</Text>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => router.push("/account")}
        >
          <Text style={styles.saveText}>{t("leaderboard.goToAccount")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <Text style={styles.title}>{t("leaderboard.title")}</Text>
      <Text style={styles.intro}>{t("leaderboard.intro")}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t("leaderboard.handleLabel")}</Text>
        <TextInput
          style={styles.input}
          value={handle}
          onChangeText={setHandle}
          placeholder={t("leaderboard.handlePlaceholder")}
          autoCapitalize="none"
          maxLength={20}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("leaderboard.optIn")}</Text>
        <Switch value={optIn} onValueChange={setOptIn} />
      </View>

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? t("leaderboard.saving") : t("leaderboard.save")}
        </Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>{t("leaderboard.rankings")}</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{t("leaderboard.empty")}</Text>
      ) : (
        <View style={styles.list}>
          {entries.map((e) => (
            <LeaderboardRow key={`${e.rank}-${e.handle}`} entry={e} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 14,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  blurb: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
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
  error: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 8,
  },
  list: { gap: 8 },
  empty: { fontSize: 14, color: "#94a3b8" },
});
