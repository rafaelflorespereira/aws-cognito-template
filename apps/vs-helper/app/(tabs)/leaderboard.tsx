import { useCallback, useState } from "react";
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
import { useGroups } from "@/features/vs/useGroups";
import LeaderboardHeader from "@/components/LeaderboardHeader";
import LeaderboardRow from "@/components/LeaderboardRow";
import GroupRow from "@/components/GroupRow";

type BoardView = "global" | "groups";

export default function Leaderboard() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<BoardView>("global");
  const { loading, signedIn, entries, error, refresh } = useLeaderboard();
  const {
    loading: groupsLoading,
    groups,
    error: groupsError,
    refresh: refreshGroups,
  } = useGroups();

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshGroups();
    }, [refresh, refreshGroups]),
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
      <SignInPrompt
        blurb={t("leaderboard.signInBlurb")}
        onPress={() => router.push("/account")}
      />
    );
  }

  // A live 401 means the session died server-side after signedIn was already
  // true (stale local token) — same recovery as being signed out, so reuse
  // the same prompt instead of surfacing a raw error code.
  if (error && (error.code === "unauthorized" || error.code === "signed_out")) {
    return (
      <SignInPrompt
        blurb={t("account.reauthBanner")}
        onPress={() => router.push("/account")}
      />
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

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, view === "global" && styles.segmentBtnOn]}
          onPress={() => setView("global")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "global" && styles.segmentTextOn,
            ]}
          >
            {t("leaderboard.global")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, view === "groups" && styles.segmentBtnOn]}
          onPress={() => setView("groups")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "groups" && styles.segmentTextOn,
            ]}
          >
            {t("groups.myGroups")}
          </Text>
        </TouchableOpacity>
      </View>

      {view === "global" ? (
        error ? (
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
        )
      ) : (
        <>
          <TouchableOpacity
            style={styles.newGroupBtn}
            onPress={() => router.push("/group/new")}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.newGroupText}>{t("groups.createOrJoin")}</Text>
          </TouchableOpacity>

          {groupsLoading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : groupsError ? (
            <Text style={styles.error}>
              {`${t("groups.loadFailed")} (${groupsError.code})`}
            </Text>
          ) : groups.length === 0 ? (
            <Text style={styles.empty}>{t("groups.noGroups")}</Text>
          ) : (
            <View style={styles.list}>
              {groups.map((g) => (
                <GroupRow
                  key={g.groupId}
                  group={g}
                  onPress={() =>
                    router.push({
                      pathname: "/group/[groupId]",
                      params: { groupId: g.groupId, name: g.name },
                    })
                  }
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function SignInPrompt({
  blurb,
  onPress,
}: {
  blurb: string;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.center, { paddingTop: insets.top }]}>
      <Ionicons name="trophy-outline" size={56} color="#94a3b8" />
      <Text style={styles.blurb}>{blurb}</Text>
      <TouchableOpacity style={styles.saveBtn} onPress={onPress}>
        <Text style={styles.saveText}>{t("leaderboard.goToAccount")}</Text>
      </TouchableOpacity>
    </View>
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
  segmentText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  segmentTextOn: { color: "#0f172a" },
  newGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 12,
  },
  newGroupText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
