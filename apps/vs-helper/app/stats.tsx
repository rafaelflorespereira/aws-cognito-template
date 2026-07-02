import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { LifetimeStats, Achievement } from "@/features/vs/types";
import {
  loadHistory,
  loadSettings,
  loadTodayProgress,
} from "@/features/vs/storage";
import { computeStats } from "@/features/vs/stats";
import { ACHIEVEMENTS, evaluateAchievements } from "@/features/vs/achievements";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import AchievementBadge from "@/components/AchievementBadge";

const EMPTY_STATS: LifetimeStats = {
  totalSessions: 0,
  daysActive: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: "",
};

export default function Stats() {
  const router = useRouter();
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [todayDone, setTodayDone] = useState(0);
  const [goal, setGoal] = useState(20);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [history, settings, progress] = await Promise.all([
          loadHistory(),
          loadSettings(),
          loadTodayProgress(),
        ]);
        const s = computeStats(history, settings.timesPerDay);
        setStats(s);
        setAchievements(evaluateAchievements(s, ACHIEVEMENTS));
        setTodayDone(progress.completed);
        setGoal(settings.timesPerDay);
      })();
    }, []),
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Progress</Text>

      <ProgressRing
        progress={goal ? todayDone / goal : 0}
        label={`${todayDone}/${goal}`}
        sublabel="today"
      />

      <View style={styles.grid}>
        <StatCard label="Total VS" value={stats.totalSessions} />
        <StatCard label="Days active" value={stats.daysActive} />
        <StatCard label="Current streak" value={`${stats.currentStreak}d`} />
        <StatCard label="Best streak" value={`${stats.bestStreak}d`} />
      </View>

      <Text style={styles.subtitle}>Achievements</Text>
      <View style={styles.badges}>
        {achievements.map((a) => (
          <AchievementBadge key={a.id} item={a} />
        ))}
      </View>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  badges: { width: "100%", gap: 10 },
  back: { color: "#64748b", fontWeight: "600", marginTop: 8 },
});
