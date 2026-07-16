import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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
import WeekCard from "@/components/WeekCard";
import NextPracticeCard from "@/components/NextPracticeCard";
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
    slots,
    next,
    nextDue,
    spacingMin,
    progress,
    refresh,
    loading,
  } = useSchedule();

  const [now, setNow] = useState<Date>(new Date());
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
      setNow(new Date());
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

  const dateLabel = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const period = greetingPeriod(now.getHours());
  const greeting = firstName
    ? t(`home.greeting.${period}.named` as TranslationKey, { name: firstName })
    : t(`home.greeting.${period}` as TranslationKey);
  const tagline = t(`home.tagline.${period}` as TranslationKey);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </View>

      <View {...weekPanResponder.panHandlers}>
        <WeekCard
          label={weekLabel}
          onLabelPress={weekOffset !== 0 ? () => setWeekOffset(0) : undefined}
          days={weekDays}
          runningTotal={weekTotal}
          runningTarget={settings.timesPerDay * 7}
          currentStreak={streak}
          bestStreak={bestStreak}
        />
      </View>

      {slots.length > 0 ? (
        <View style={styles.timelineWrap}>
          <NextPracticeCard
            completed={progress.completed}
            target={settings.timesPerDay}
            nextDue={nextDue}
            spacingMin={spacingMin}
            slots={slots}
            completedSlots={progress.completedSlots}
            next={next}
            firstTime={settings.firstTime}
            lastTime={settings.lastTime}
            now={now}
          />
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
    gap: 4,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6366f1",
  },
  date: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.4,
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
