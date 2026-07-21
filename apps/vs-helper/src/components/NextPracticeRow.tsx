import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useI18n } from "@/features/i18n";

export interface NextPracticeRowProps {
  nextDue: Date | null; // adaptive recommended time for the next session
  remainingAfter: number; // sessions still left after the next one
}

function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// The countdown, demoted from the old dome gauge to a plain row: a small badge
// with the minutes-to-next, the scheduled time, and how many remain after it.
export default function NextPracticeRow({
  nextDue,
  remainingAfter,
}: NextPracticeRowProps) {
  const { t } = useI18n();
  const nextDueTime = nextDue?.getTime() ?? null;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [reduceMotion, setReduceMotion] = useState(false);
  const changeProgress = useRef(new Animated.Value(1)).current;
  const minutesToNext =
    nextDueTime === null
      ? 0
      : Math.max(0, Math.ceil((nextDueTime - nowMs) / 60_000));
  const previousMinutes = useRef(minutesToNext);

  useFocusEffect(
    useCallback(() => {
      if (nextDueTime === null) return;

      setNowMs(Date.now());
      const interval = setInterval(() => setNowMs(Date.now()), 1_000);
      return () => clearInterval(interval);
    }, [nextDueTime]),
  );

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      previousMinutes.current = minutesToNext;
      changeProgress.stopAnimation();
      changeProgress.setValue(1);
      return;
    }
    if (previousMinutes.current === minutesToNext) return;

    previousMinutes.current = minutesToNext;
    changeProgress.setValue(0);
    const animation = Animated.spring(changeProgress, {
      toValue: 1,
      damping: 15,
      stiffness: 190,
      mass: 0.7,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [changeProgress, minutesToNext, reduceMotion]);

  if (!nextDue) {
    return (
      <View style={styles.row}>
        <View style={[styles.badge, styles.badgeDone]}>
          <Text style={styles.badgeDoneText}>✓</Text>
        </View>
        <Text style={styles.title}>{t("next.allDone")}</Text>
      </View>
    );
  }

  const subtitleParts = [t("next.rowIn", { min: minutesToNext })];
  if (remainingAfter > 0) {
    subtitleParts.push(t("next.rowLeftAfter", { n: remainingAfter }));
  }

  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Animated.Text
          style={[
            styles.badgeText,
            {
              opacity: changeProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: changeProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                    extrapolate: "clamp",
                  }),
                },
                {
                  scale: changeProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
        >
          {minutesToNext}
        </Animated.Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>
          {t("next.rowAt", { time: formatClock(nextDue) })}
        </Text>
        <Text style={styles.subtitle}>{subtitleParts.join(" · ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#6366f1",
    fontVariant: ["tabular-nums"],
  },
  badgeDone: {
    backgroundColor: "#dcfce7",
  },
  badgeDoneText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#22c55e",
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
  },
});
