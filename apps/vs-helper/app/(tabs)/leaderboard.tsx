import { useCallback } from "react";
import {
  View,
  Text,
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
import LeaderboardHeader from "@/components/LeaderboardHeader";
import LeaderboardRow from "@/components/LeaderboardRow";

export default function Leaderboard() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, signedIn, entries, error, refresh } = useLeaderboard();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (loading) {
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

      {error ? (
        <Text style={styles.error}>
          {`${t("leaderboard.loadFailed")} (${error.code})`}
        </Text>
      ) : entries.length === 0 ? (
        <Text style={styles.empty}>{t("leaderboard.empty")}</Text>
      ) : (
        <>
          <LeaderboardHeader />
          <View style={styles.list}>
            {entries.map((e) => (
              <LeaderboardRow key={`${e.rank}-${e.handle}`} entry={e} />
            ))}
          </View>
        </>
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
  saveBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  list: { gap: 8 },
  error: { fontSize: 14, color: "#ef4444", fontWeight: "600" },
  empty: { fontSize: 14, color: "#94a3b8" },
});
