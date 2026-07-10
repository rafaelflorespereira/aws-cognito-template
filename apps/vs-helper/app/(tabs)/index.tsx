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
import { computeStats } from "@vs/shared";
import { useI18n, type TranslationKey } from "@/features/i18n";
import WeekCard from "@/components/WeekCard";
import Timeline, { type TimelineItem } from "@/components/Timeline";
import { type WeekDay } from "@/components/WeekProgress";

const DAY_MS = 24 * 60 * 60 * 1000;

// Maps the current hour to a time-of-day greeting key.
function greetingKey(hour: number): TranslationKey {
  if (hour >= 5 && hour < 12) return "home.greeting.morning";
  if (hour >= 12 && hour < 18) return "home.greeting.afternoon";
  if (hour >= 18 && hour < 22) return "home.greeting.evening";
  return "home.greeting.night";
}

// Monday-aligned start of the calendar week containing `d`.
function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d.getTime() - offset * DAY_MS);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Builds a compact timeline around "now": the most recent completed slot, the
// next-up slot, and the couple of slots that follow it.
function buildTimeline(
  slots: string[],
  completedSlots: string[],
  next: string | null,
): TimelineItem[] {
  const doneSet = new Set(completedSlots);
  const done = slots.filter((s) => doneSet.has(s));
  const items: TimelineItem[] = [];

  if (next) {
    const lastDone = done[done.length - 1];
    if (lastDone) items.push({ time: lastDone, state: "done" });
    items.push({ time: next, state: "next" });
    const idx = slots.indexOf(next);
    const upcoming = slots
      .slice(idx + 1)
      .filter((s) => !doneSet.has(s))
      .slice(0, 2);
    for (const s of upcoming) items.push({ time: s, state: "upcoming" });
  } else {
    // Nothing left today — show the last few completed sessions.
    for (const s of done.slice(-3)) items.push({ time: s, state: "done" });
  }

  return items;
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const {
    settings,
    slots,
    next,
    progress,
    refresh,
    loading,
  } = useSchedule();

  const [now, setNow] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Refresh progress whenever the dashboard regains focus (e.g. after a session).
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      refresh();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => {
        const counts = sessionCountsByDate(history);
        const current = new Date();
        const today = todayStr(current);
        const monday = startOfWeek(current);
        const fmt = new Intl.DateTimeFormat(lang, { weekday: "narrow" });

        let total = 0;
        const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday.getTime() + i * DAY_MS);
          const date = todayStr(d);
          const completed =
            date === today ? progress.completed : (counts[date] ?? 0);
          total += completed;
          return {
            date,
            dayOfMonth: d.getDate(),
            weekday: fmt.format(d),
            completed,
            target: settings.timesPerDay,
            isToday: date === today,
          };
        });
        setWeekDays(days);
        setWeekTotal(total);

        const stats = computeStats(history, settings.timesPerDay);
        setStreak(stats.currentStreak);
        setBestStreak(stats.bestStreak);
      });
    }, [lang, progress.completed, settings.timesPerDay]),
  );

  if (loading) return <View style={styles.container} />;

  const dateLabel = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const timeline = buildTimeline(slots, progress.completedSlots, next);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{t(greetingKey(now.getHours()))}</Text>
        <Text style={styles.title}>{t("home.today")}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <WeekCard
        days={weekDays}
        runningTotal={weekTotal}
        runningTarget={settings.timesPerDay * 7}
        currentStreak={streak}
        bestStreak={bestStreak}
      />

      {timeline.length > 0 ? (
        <View style={styles.timelineWrap}>
          <Timeline items={timeline} />
        </View>
      ) : null}

      <View style={styles.spacer} />

      <TouchableOpacity
        style={styles.primary}
        onPress={() => router.push("/practice")}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryText}>{t("home.practiceNow")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
    gap: 20,
  },
  header: {
    gap: 2,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: "#64748b",
    textTransform: "capitalize",
  },
  timelineWrap: {
    marginTop: 4,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 16,
  },
  primary: {
    backgroundColor: "#ede9fe",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryText: {
    color: "#4f46e5",
    fontSize: 17,
    fontWeight: "700",
  },
});
