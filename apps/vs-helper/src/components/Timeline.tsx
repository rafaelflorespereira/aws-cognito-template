import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "@/features/i18n";

export type TimelineState = "done" | "next" | "upcoming";

export interface TimelineItem {
  time: string;
  state: TimelineState;
}

export interface TimelineProps {
  items: TimelineItem[];
}

const LEFT_COLUMN_WIDTH = 28;
const LINE_WIDTH = 2;
const DONE_DOT_SIZE = 12;
const NEXT_DOT_SIZE = 16;
const UPCOMING_DOT_SIZE = 12;

export default function Timeline({ items }: TimelineProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <View key={`${item.time}-${index}`} style={styles.row}>
            <View style={styles.markerColumn}>
              {!isFirst ? <View style={[styles.line, styles.lineTop]} /> : null}
              {!isLast ? <View style={[styles.line, styles.lineBottom]} /> : null}
              <View style={dotStyle(item.state)} />
            </View>

            <View style={styles.content}>{renderContent(item, t)}</View>
          </View>
        );
      })}
    </View>
  );
}

function renderContent(
  item: TimelineItem,
  t: (key: "timeline.done" | "timeline.now" | "timeline.nextUp") => string,
) {
  if (item.state === "next") {
    return (
      <View style={styles.nextPill}>
        <Text style={styles.nextCaption}>
          {`${t("timeline.now")} · ${t("timeline.nextUp")}`}
        </Text>
        <Text style={styles.nextTime}>{item.time}</Text>
      </View>
    );
  }

  if (item.state === "done") {
    return (
      <Text style={styles.doneText}>
        {item.time} · {t("timeline.done")}
      </Text>
    );
  }

  return <Text style={styles.upcomingText}>{item.time}</Text>;
}

function dotStyle(state: TimelineState) {
  switch (state) {
    case "done":
      return [styles.dot, styles.doneDot];
    case "next":
      return [styles.dot, styles.nextDot];
    case "upcoming":
      return [styles.dot, styles.upcomingDot];
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 40,
    paddingVertical: 4,
  },
  markerColumn: {
    width: LEFT_COLUMN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  line: {
    position: "absolute",
    left: (LEFT_COLUMN_WIDTH - LINE_WIDTH) / 2,
    width: LINE_WIDTH,
    backgroundColor: "#cbd5e1",
  },
  lineTop: {
    top: 0,
    bottom: "50%",
  },
  lineBottom: {
    top: "50%",
    bottom: 0,
  },
  dot: {
    zIndex: 1,
  },
  doneDot: {
    width: DONE_DOT_SIZE,
    height: DONE_DOT_SIZE,
    borderRadius: DONE_DOT_SIZE / 2,
    backgroundColor: "#0f172a",
  },
  nextDot: {
    width: NEXT_DOT_SIZE,
    height: NEXT_DOT_SIZE,
    borderRadius: NEXT_DOT_SIZE / 2,
    backgroundColor: "#6366f1",
  },
  upcomingDot: {
    width: UPCOMING_DOT_SIZE,
    height: UPCOMING_DOT_SIZE,
    borderRadius: UPCOMING_DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 12,
  },
  doneText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  upcomingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  nextPill: {
    alignSelf: "flex-start",
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nextCaption: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#6366f1",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  nextTime: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
});
