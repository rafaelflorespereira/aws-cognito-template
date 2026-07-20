import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/features/i18n";
import { useGroups } from "@/features/vs/useGroups";

type Mode = "create" | "join";

export default function NewGroup() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createGroup, joinGroup } = useGroups();

  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (mode === "create") {
      if (!name.trim()) {
        setError(t("groups.nameRequired"));
        return;
      }
      setSubmitting(true);
      const err = await createGroup(name.trim());
      setSubmitting(false);
      if (err) {
        setError(
          err.code === "bad_request"
            ? t("groups.needsHandle")
            : t("groups.createFailed"),
        );
        return;
      }
      router.back();
    } else {
      if (!code.trim()) {
        setError(t("groups.codeRequired"));
        return;
      }
      setSubmitting(true);
      const err = await joinGroup(code.trim().toUpperCase());
      setSubmitting(false);
      if (err) {
        setError(
          err.code === "not_found"
            ? t("groups.notFound")
            : err.code === "bad_request"
              ? t("groups.needsHandle")
              : t("groups.joinFailed"),
        );
        return;
      }
      router.back();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#334155" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{t("groups.newTitle")}</Text>

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === "create" && styles.segmentBtnOn]}
          onPress={() => setMode("create")}
        >
          <Text
            style={[
              styles.segmentText,
              mode === "create" && styles.segmentTextOn,
            ]}
          >
            {t("groups.create")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === "join" && styles.segmentBtnOn]}
          onPress={() => setMode("join")}
        >
          <Text
            style={[styles.segmentText, mode === "join" && styles.segmentTextOn]}
          >
            {t("groups.join")}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "create" ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t("groups.nameLabel")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("groups.namePlaceholder")}
            placeholderTextColor="#94a3b8"
            maxLength={40}
          />
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>{t("groups.codeLabel")}</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder={t("groups.codePlaceholder")}
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {mode === "create" ? t("groups.create") : t("groups.join")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 24, gap: 16 },
  header: { flexDirection: "row", justifyContent: "flex-end" },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  segment: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  segmentBtnOn: { backgroundColor: "#fff" },
  segmentText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  segmentTextOn: { color: "#0f172a" },
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
    color: "#0f172a",
  },
  codeInput: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
  },
  error: { fontSize: 13, color: "#ef4444", fontWeight: "600" },
  submitBtn: {
    marginTop: 8,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
