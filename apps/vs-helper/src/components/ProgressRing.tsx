import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  progress: number; // 0..1
  label: string;
  sublabel?: string;
  labelFontSize?: number;
  trackColor?: string;
  labelColor?: string;
  sublabelColor?: string;
}

// Circular progress ring that animates its arc smoothly from the previous
// `progress` (0..1) to the next, rather than jumping. Track/label colors are
// overridable so the same ring reads well on both light and dark screens.
export default function ProgressRing({
  size = 160,
  progress,
  label,
  sublabel,
  labelFontSize = 30,
  trackColor = "#e2e8f0",
  labelColor = "#1e293b",
  sublabelColor = "#64748b",
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = Math.round(size * 0.08);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const done = clamped >= 1;
  const color = done ? "#22c55e" : "#6366f1";
  const center = size / 2;

  const animatedProgress = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 900,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [clamped, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

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
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        <Text
          style={[styles.label, { fontSize: labelFontSize, color: labelColor }]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.sublabel, { color: sublabelColor }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "800",
  },
  sublabel: {
    fontSize: 13,
    marginTop: 2,
  },
});
