import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface Props {
  size?: number;
  progress: number; // 0..1
  label: string;
  sublabel?: string;
}

// Circular progress ring that draws a proportional arc for `progress` (0..1)
// using an SVG stroke, with the value shown in the middle.
export default function ProgressRing({
  size = 160,
  progress,
  label,
  sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = Math.round(size * 0.08);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;
  const done = clamped >= 1;
  const color = done ? "#22c55e" : "#6366f1";
  const center = size / 2;

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress arc */}
          {clamped > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
        </Svg>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1e293b",
  },
  sublabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
});
