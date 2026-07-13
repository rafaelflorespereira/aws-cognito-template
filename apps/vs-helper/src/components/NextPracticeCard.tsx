import { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useI18n } from "@/features/i18n";

export interface NextPracticeCardProps {
  completed: number;
  target: number;
  nextDue: Date | null; // adaptive recommended time for the next session
  spacingMin: number; // adaptive minutes between remaining sessions
  slots: string[]; // today's full schedule, "HH:mm"
  completedSlots: string[];
  next: string | null;
  firstTime: string; // window start, "HH:mm"
  lastTime: string; // window end, "HH:mm"
  now: Date;
}

const SIZE = 210;
const STROKE = 16;
const SWEEP_DEG = 180; // a dome: flat ends at 9 and 3 o'clock, nothing drawn below
const START_DEG = -90;
const CELL_WIDTH = 56;
const VISIBLE_STEPS = 5; // swipe to reveal the rest when there are more than this

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Standard SVG "describe an arc" helper: draws from `endDeg` back to
// `startDeg` (clockwise, 0° = top) so a Path can render a gauge that doesn't
// close into a full circle.
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const clampedEnd = Math.max(startDeg, Math.min(startDeg + 359.99, endDeg));
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = clampedEnd - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// The home screen's "what's next" card: a dome gauge split into one arc
// segment per target session (filled left-to-right as sessions complete —
// see adaptiveSlots in features/vs/schedule.ts for how the schedule itself
// reflows), plus a live countdown to the next one and a swipeable stepper of
// today's slots.
export default function NextPracticeCard({
  completed,
  target,
  nextDue,
  spacingMin,
  slots,
  completedSlots,
  next,
  firstTime,
  lastTime,
  now,
}: NextPracticeCardProps) {
  const { t } = useI18n();
  const stepsScrollRef = useRef<ScrollView>(null);

  const msToNext = nextDue ? nextDue.getTime() - now.getTime() : null;
  const minutesToNext =
    msToNext !== null ? Math.max(0, Math.ceil(msToNext / 60000)) : 0;

  const done = target > 0 && completed >= target;

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = (SIZE - STROKE) / 2;
  const gaugeHeight = cy + STROKE / 2 + 6;

  // One arc segment per target session, with a small gap between each, so the
  // dome reads as a stepper (matching the slots stepper below) instead of a
  // single smooth fill.
  const segmentCount = Math.max(1, target);
  const segmentSweep = SWEEP_DEG / segmentCount;
  const gapDeg = Math.min(6, segmentSweep * 0.18);
  const segments = Array.from({ length: segmentCount }, (_, i) => {
    const segStart = START_DEG + segmentSweep * i + gapDeg / 2;
    const segEnd = START_DEG + segmentSweep * (i + 1) - gapDeg / 2;
    return {
      path: describeArc(cx, cy, r, segStart, segEnd),
      filled: i < completed,
    };
  });

  const doneSet = new Set(completedSlots);
  const nextIndex = slots.findIndex((s) => s === next);
  const visibleWidth = Math.min(slots.length, VISIBLE_STEPS) * CELL_WIDTH;

  // Keep the "next" step centered in view whenever the schedule reflows.
  useEffect(() => {
    if (nextIndex < 0 || !stepsScrollRef.current) return;
    const x = Math.max(
      0,
      nextIndex * CELL_WIDTH - visibleWidth / 2 + CELL_WIDTH / 2,
    );
    stepsScrollRef.current.scrollTo({ x, animated: true });
  }, [nextIndex, visibleWidth]);

  return (
    <View style={styles.card}>
      <Text style={styles.fraction}>{`${completed} / ${target}`}</Text>

      <View style={[styles.gaugeWrap, { height: gaugeHeight }]}>
        <Svg
          width={SIZE}
          height={SIZE}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {segments.map((segment, i) => (
            <Path
              key={i}
              d={segment.path}
              stroke={segment.filled ? (done ? "#22c55e" : "#6366f1") : "#e2e8f0"}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </Svg>

        <View style={styles.gaugeCenter}>
          {nextDue ? (
            <>
              <Text style={styles.bigNumber}>{minutesToNext}</Text>
              <Text style={styles.minToNext}>{t("next.minToNext")}</Text>
              <Text style={styles.nextAt}>
                {t("next.at")}{" "}
                <Text style={styles.nextAtTime}>{formatClock(nextDue)}</Text>
              </Text>
            </>
          ) : (
            <Text style={styles.allDone}>{t("next.allDone")}</Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={stepsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: visibleWidth }}
      >
        <View style={[styles.stepsRow, { width: slots.length * CELL_WIDTH }]}>
          <View style={styles.stepsLine} />
          {slots.map((time, i) => {
            const state = doneSet.has(time)
              ? "done"
              : time === next
                ? "next"
                : "upcoming";
            return (
              <View key={`${time}-${i}`} style={styles.stepCell}>
                <View style={styles.stepIconWrap}>
                  {state === "done" ? (
                    <View style={styles.stepDone}>
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    </View>
                  ) : state === "next" ? (
                    <View style={styles.stepNext} />
                  ) : (
                    <View style={styles.stepUpcoming} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepTime,
                    state === "next" && styles.stepTimeNext,
                  ]}
                >
                  {time}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.boundsRow}>
        <Text style={styles.boundsText}>{firstTime}</Text>
        <Text style={styles.boundsText}>{lastTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fraction: {
    alignSelf: "flex-end",
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
  },
  gaugeWrap: {
    width: SIZE,
    overflow: "hidden",
  },
  gaugeCenter: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 1,
  },
  bigNumber: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0f172a",
  },
  minToNext: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#64748b",
    textTransform: "uppercase",
  },
  nextAt: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  nextAtTime: {
    color: "#6366f1",
  },
  allDone: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22c55e",
    textAlign: "center",
    maxWidth: 140,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  stepsLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 18,
    height: 2,
    marginTop: -1,
    backgroundColor: "#e2e8f0",
  },
  stepCell: {
    width: CELL_WIDTH,
    alignItems: "center",
  },
  stepIconWrap: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepUpcoming: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#6366f1",
    backgroundColor: "#ffffff",
  },
  stepDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNext: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366f1",
  },
  stepTime: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    fontVariant: ["tabular-nums"],
  },
  stepTimeNext: {
    color: "#0f172a",
    fontWeight: "800",
  },
  boundsRow: {
    width: SIZE,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  boundsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
});
