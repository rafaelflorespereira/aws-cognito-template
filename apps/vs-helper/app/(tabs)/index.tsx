import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  PanResponder,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStoredTokens, parseIdToken } from "@vs/auth";
import { useSchedule } from "@/features/vs/useSchedule";
import { loadHistory, todayStr } from "@/features/vs/storage";
import { sessionCountsByDate } from "@/features/vs/schedule";
import { computeStats } from "@vs/shared";
import { useI18n, type TranslationKey } from "@/features/i18n";
import TodayCard from "@/components/TodayCard";
import NextPracticeRow from "@/components/NextPracticeRow";
import WeekStripCard from "@/components/WeekStripCard";
import PrimaryActionButton from "@/components/PrimaryActionButton";
import { type WeekDay } from "@/components/WeekProgress";

const DAY_MS = 24 * 60 * 60 * 1000;
const SWIPE_THRESHOLD = 40;

type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

// Maps the current hour to a time-of-day greeting period.
function greetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function firstNameOf(fullName: string | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}

// Monday-aligned start of the calendar week containing `d`.
function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d.getTime() - offset * DAY_MS);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// "Jun 1 – Jun 7" label for a non-current week, so a swiped-to week is still
// identifiable without needing "N weeks ago" strings in every locale.
function weekRangeLabel(monday: Date, lang: string): string {
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  const fmt = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  return `${fmt.format(monday)} – ${fmt.format(sunday)}`;
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const {
    settings,
    now,
    slots,
    next,
    nextDue,
    progress,
    refresh,
    loading,
  } = useSchedule();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, negative = earlier weeks
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekLabel, setWeekLabel] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Swipe left -> earlier week, swipe right -> back toward the current week.
  // Only takes over from the screen's vertical ScrollView once the gesture is
  // clearly horizontal, so normal scrolling isn't hijacked.
  const weekPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) {
          setWeekOffset((o) => o - 1);
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          setWeekOffset((o) => Math.min(0, o + 1));
        }
      },
    }),
  ).current;

  // Refresh progress whenever the dashboard regains focus (e.g. after a session).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Re-check who's signed in on every focus, so the greeting picks up a fresh
  // sign-in/sign-out from the Account tab without needing a full app reload.
  useFocusEffect(
    useCallback(() => {
      getStoredTokens().then((tokens) => {
        setFirstName(
          tokens ? firstNameOf(parseIdToken(tokens.idToken).name) : null,
        );
      });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => {
        const counts = sessionCountsByDate(history);
        const current = new Date();
        const today = todayStr(current);
        const monday = new Date(
          startOfWeek(current).getTime() + weekOffset * 7 * DAY_MS,
        );
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
        setWeekLabel(
          weekOffset === 0
            ? t("week.thisWeek")
            : weekRangeLabel(monday, lang),
        );

        const stats = computeStats(history, settings.timesPerDay);
        setStreak(stats.currentStreak);
        setBestStreak(stats.bestStreak);
      });
    }, [lang, progress.completed, settings.timesPerDay, weekOffset, t]),
  );

  if (loading) return <View style={styles.container} />;

  // The design's big title is the live current day (not a static "Today"
  // label): the weekday leads, with the month + day beneath it.
  const dayLabel = new Intl.DateTimeFormat(lang, {
    weekday: "long",
  }).format(now);
  const dateLabel = new Intl.DateTimeFormat(lang, {
    month: "long",
    day: "numeric",
  }).format(now);

  const period = greetingPeriod(now.getHours());
  const greeting = firstName
    ? t(`home.greeting.${period}.named` as TranslationKey, { name: firstName })
    : t(`home.greeting.${period}` as TranslationKey);

  const target = settings.timesPerDay;
  const remainingAfter = Math.max(0, target - progress.completed - 1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting.toUpperCase()}</Text>
        <Text style={styles.title}>{dayLabel}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      {slots.length > 0 ? (
        <TodayCard
          completed={progress.completed}
          target={target}
          next={next}
          slots={slots}
          firstTime={settings.firstTime}
          lastTime={settings.lastTime}
        />
      ) : null}

      {slots.length > 0 ? (
        <NextPracticeRow
          nextDue={nextDue}
          remainingAfter={remainingAfter}
        />
      ) : null}

      <View {...weekPanResponder.panHandlers}>
        <WeekStripCard
          label={weekLabel}
          onLabelPress={weekOffset !== 0 ? () => setWeekOffset(0) : undefined}
          days={weekDays}
          runningTotal={weekTotal}
          runningTarget={settings.timesPerDay * 7}
          bestStreak={bestStreak}
        />
      </View>

      <View style={styles.spacer} />

      <PrimaryActionButton
        label={t("home.practiceNow")}
        onPress={() => router.push("/practice")}
      />
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
    gap: 4,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#6366f1",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.6,
    textTransform: "capitalize",
  },
  date: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  tagline: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 20,
  },
  timelineWrap: {
    marginTop: 4,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 16,
  },
});
