import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSchedule } from "@/features/vs/useSchedule";
import { loadHistory, todayStr } from "@/features/vs/storage";
import { sessionCountsByDate } from "@/features/vs/schedule";
import { useI18n } from "@/features/i18n";
import NextPracticeCard from "@/components/NextPracticeCard";
import WeekProgress, { type WeekDay } from "@/components/WeekProgress";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { settings, nextDue, spacingMin, progress, refresh, loading } =
    useSchedule();
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  // Refresh progress whenever the dashboard regains focus (e.g. after a session).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => {
        const counts = sessionCountsByDate(history);
        const now = new Date();
        const today = todayStr(now);
        const fmt = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
        const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now.getTime() - (6 - i) * DAY_MS);
          const date = todayStr(d);
          return {
            date,
            dayOfMonth: d.getDate(),
            weekday: fmt.format(d),
            completed:
              date === today ? progress.completed : (counts[date] ?? 0),
            target: settings.timesPerDay,
            isToday: date === today,
          };
        });
        setWeekDays(days);
      });
    }, [lang, progress.completed, settings.timesPerDay]),
  );

  if (loading) return <View style={styles.container} />;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <WeekProgress days={weekDays} />

      <View style={styles.centerArea}>
        <Text style={styles.title}>{t("home.title")}</Text>
        <NextPracticeCard
          nextDue={nextDue}
          spacingMin={spacingMin}
          completed={progress.completed}
          target={settings.timesPerDay}
        />

        <TouchableOpacity
          style={styles.primary}
          onPress={() => router.push("/practice")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>{t("home.cta")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  centerArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  primary: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
