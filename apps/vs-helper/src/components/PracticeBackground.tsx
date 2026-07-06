import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

// Slow "breathing" ambient glow behind the practice screen — a soft radial
// gradient that gently scales and fades in and out on a loop. Purely
// decorative (pointerEvents disabled), sits behind the scrollable content.
export default function PracticeBackground() {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 4200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const scale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const opacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fill, { opacity, transform: [{ scale }] }]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="32%" r="60%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
            <Stop offset="55%" stopColor="#4338ca" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
