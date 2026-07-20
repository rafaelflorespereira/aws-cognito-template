import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/features/i18n";
import { useGroupLeaderboard, useGroups } from "@/features/vs/useGroups";
import LeaderboardHeader from "@/components/LeaderboardHeader";
import LeaderboardRow from "@/components/LeaderboardRow";

export default function GroupLeaderboard() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId, name } = useLocalSearchParams<{
    groupId: string;
    name?: string;
  }>();
  const { entries, loading, error, refresh } = useGroupLeaderboard(groupId);
  const { leaveGroup } = useGroups();
  const [leaving, setLeaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  function confirmLeave() {
    Alert.alert(t("groups.leaveConfirmTitle"), t("groups.leaveConfirmBody"), [
      { text: t("groups.cancel"), style: "cancel" },
      {
        text: t("groups.leave"),
        style: "destructive",
        onPress: async () => {
          setLeaving(true);
          await leaveGroup(groupId);
          setLeaving(false);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#334155" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.title} numberOfLines={1}>
            {name || groupId}
          </Text>
          <Text style={styles.code}>{groupId}</Text>
        </View>
        <TouchableOpacity onPress={confirmLeave} disabled={leaving} hitSlop={12}>
          {leaving ? (
            <ActivityIndicator size="small" />
          ) : (
            <Ionicons name="exit-outline" size={22} color="#ef4444" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <Text style={styles.error}>
          {`${t("groups.loadFailed")} (${error.code})`}
        </Text>
      ) : entries.length === 0 ? (
        <Text style={styles.empty}>{t("groups.empty")}</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTextCol: { flex: 1, gap: 2 },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  code: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  spinner: { marginTop: 40 },
  list: { gap: 8 },
  error: { fontSize: 14, color: "#ef4444", fontWeight: "600" },
  empty: { fontSize: 14, color: "#94a3b8" },
});
