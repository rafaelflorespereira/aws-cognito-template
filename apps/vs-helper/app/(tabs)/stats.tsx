import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LifetimeStats, Achievement } from "@/features/vs/types";
import {
  loadHistory,
  loadSettings,
  loadTodayProgress,
} from "@/features/vs/storage";
import { computeStats } from "@/features/vs/stats";
import { currentSpacingMin } from "@/features/vs/schedule";
import { ACHIEVEMENTS, evaluateAchievements } from "@/features/vs/achievements";
import { useI18n } from "@/features/i18n";
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
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [todayDone, setTodayDone] = useState(0);
  const [goal, setGoal] = useState(20);
  const [spacingMin, setSpacingMin] = useState(0);

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
        setSpacingMin(
          currentSpacingMin(
            {
              timesPerDay: settings.timesPerDay,
              firstTime: settings.firstTime,
              lastTime: settings.lastTime,
              completed: progress.completed,
              lastCompletedAt: progress.lastCompletedAt,
            },
            new Date(),
          ),
        );
      })();
    }, []),
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <Text style={styles.title}>{t("stats.title")}</Text>

      <ProgressRing
        progress={goal ? todayDone / goal : 0}
        label={`${todayDone}/${goal}`}
        sublabel={t("stats.today")}
      />

      {todayDone < goal ? (
        <Text style={styles.spacing}>
          {t("next.spacing", { min: spacingMin })}
        </Text>
      ) : null}

      <View style={styles.grid}>
        <StatCard label={t("stats.totalVS")} value={stats.totalSessions} />
        <StatCard label={t("stats.daysActive")} value={stats.daysActive} />
        <StatCard
          label={t("stats.currentStreak")}
          value={`${stats.currentStreak}d`}
        />
        <StatCard
          label={t("stats.bestStreak")}
          value={`${stats.bestStreak}d`}
        />
      </View>

      <Text style={styles.subtitle}>{t("stats.achievements")}</Text>
      <View style={styles.badges}>
        {achievements.map((a) => (
          <AchievementBadge key={a.id} item={a} />
        ))}
      </View>
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
  spacing: { fontSize: 13, color: "#64748b", marginTop: -4 },
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
});
