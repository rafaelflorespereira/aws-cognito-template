import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  Circle,
  G,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WIDTH = 200;
const HEIGHT = 420;

// Body silhouette built from simple overlapping rounded shapes (head, torso,
// arms, legs, feet), all the same fill so the seams disappear and it reads as
// one figure. Coordinates are hand-placed, not derived from anything.
const BODY_SHAPES = (
  <>
    <Circle cx={100} cy={54} r={28} />
    <Rect x={66} y={78} width={68} height={130} rx={30} />
    <Rect x={40} y={86} width={30} height={118} rx={13} />
    <Rect x={130} y={86} width={30} height={118} rx={13} />
    <Rect x={68} y={198} width={30} height={170} rx={14} />
    <Rect x={102} y={198} width={30} height={170} rx={14} />
    <Rect x={62} y={364} width={40} height={16} rx={8} />
    <Rect x={98} y={364} width={40} height={16} rx={8} />
  </>
);

// The 9 chakra points the VS maneuvers move through, top to bottom, matching
// CHAKRA_IDS order. Used to light up markers as the energy fill passes them.
const CHAKRA_POINTS: { id: string; cx: number; cy: number }[] = [
  { id: "coronochakra", cx: 100, cy: 28 },
  { id: "frontochakra", cx: 100, cy: 48 },
  { id: "laryngochakra", cx: 100, cy: 84 },
  { id: "cardiochakra", cx: 100, cy: 122 },
  { id: "umbilicochakra", cx: 100, cy: 165 },
  { id: "sexochakra", cx: 100, cy: 200 },
  { id: "basochakra", cx: 100, cy: 216 },
  { id: "palmar", cx: 55, cy: 195 },
  { id: "palmar", cx: 145, cy: 195 },
  { id: "plantar", cx: 82, cy: 380 },
  { id: "plantar", cx: 118, cy: 380 },
];

interface Props {
  /** 0..1, how far the practice session has progressed. */
  progress: number;
  height?: number;
}

// Placeholder illustration for the practice screen: a simple energy-body
// silhouette that fills with light from head to feet as the session
// progresses, so the user can see the vibrational state's flow happening
// rather than just a countdown.
export default function EnergyBodyIllustration({
  progress,
  height = 260,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  const animatedProgress = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [clamped, animatedProgress]);

  const fillHeight = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
  });
  const glowY = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
  });
  const glowOpacity = animatedProgress.interpolate({
    inputRange: [0, 0.02, 0.98, 1],
    outputRange: [0, 1, 1, 0],
  });

  const boundaryY = clamped * HEIGHT;

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <LinearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a5b4fc" />
            <Stop offset="60%" stopColor="#6366f1" />
            <Stop offset="100%" stopColor="#4338ca" />
          </LinearGradient>
          <ClipPath id="bodyClip">{BODY_SHAPES}</ClipPath>
        </Defs>

        {/* Dim resting silhouette, always visible. */}
        <G fill="#c7d2fe" opacity={0.14}>
          {BODY_SHAPES}
        </G>

        {/* Bright energy fill, clipped to the body, growing head-to-feet. */}
        <AnimatedRect
          x={0}
          y={0}
          width={WIDTH}
          height={fillHeight}
          fill="url(#energyGradient)"
          clipPath="url(#bodyClip)"
        />

        {/* Traveling glow marking the current leading edge of the energy. */}
        <AnimatedCircle
          cx={WIDTH / 2}
          cy={glowY}
          r={16}
          fill="#e0e7ff"
          opacity={glowOpacity}
          clipPath="url(#bodyClip)"
        />

        {/* Chakra markers: lit once the energy has reached them. */}
        {CHAKRA_POINTS.map((p, i) => {
          const lit = p.cy <= boundaryY;
          return (
            <Circle
              key={`${p.id}-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={lit ? 5 : 4}
              fill={lit ? "#e0e7ff" : "#475569"}
              opacity={lit ? 0.95 : 0.5}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
