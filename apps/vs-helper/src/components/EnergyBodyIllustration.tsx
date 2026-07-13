import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const WIDTH = 200;
const HEIGHT = 420;
const BODY_CENTER_X = WIDTH / 2;
const ORB_TOP_Y = 64;
const ORB_BOTTOM_Y = 356;
const BODY_SHAPES = (
  <>
    <Circle cx={BODY_CENTER_X} cy={64} r={34} />
    <Rect x={52} y={112} width={96} height={276} rx={48} />
  </>
);

const CHAKRA_POINTS: { id: string; cx: number; cy: number }[] = [
  { id: "crown", cx: 100, cy: 72 },
  { id: "throat", cx: 100, cy: 124 },
  { id: "heart", cx: 100, cy: 176 },
  { id: "solar", cx: 100, cy: 226 },
  { id: "sacral", cx: 100, cy: 278 },
  { id: "root", cx: 100, cy: 334 },
  { id: "ground", cx: 100, cy: 348 },
];

const DESCENT_END = 0.08;
const AURA_START = 0.94;
const FREQ_START_HZ = 0.12;
const FREQ_END_HZ = 4.0;
const FREQ_RAMP_POWER = 2.4;

const BUBBLE_COUNT = 6;
const BUBBLE_TOP_Y = 40;
const BUBBLE_BOTTOM_Y = 400;
const BUBBLE_MIN_X = 62;
const BUBBLE_MAX_X = 138;

interface Bubble {
  x: number;
  radius: number;
  duration: number;
  delay: number;
}

function makeBubbles(count: number): Bubble[] {
  return Array.from({ length: count }, () => ({
    x: BUBBLE_MIN_X + Math.random() * (BUBBLE_MAX_X - BUBBLE_MIN_X),
    radius: 3 + Math.random() * 4,
    duration: 3200 + Math.random() * 2600,
    delay: Math.random() * 3000,
  }));
}

interface Props {
  progress: number;
  height?: number;
  // Whether a practice session is running. Drives the glowing bubbles rising
  // inside the silhouette, independent of the orb's own descent/vibration
  // phases so they stay on for the whole session.
  active?: boolean;
}

function flareInputRange(cy: number) {
  const rawCenter = (cy - ORB_TOP_Y) / (ORB_BOTTOM_Y - ORB_TOP_Y);
  const center = Math.max(0.001, Math.min(0.999, rawCenter));
  const spread = 0.13;
  return [
    Math.max(0, center - spread),
    Math.max(0.001, center - spread / 2),
    center,
    Math.min(0.999, center + spread / 2),
    Math.min(1, center + spread),
  ];
}

export default function EnergyBodyIllustration({
  progress,
  height = 260,
  active = false,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const posValue = useRef(new Animated.Value(0)).current;
  const auraOpacity = useRef(new Animated.Value(0)).current;

  const inVibrationRef = useRef(false);
  const instFreqRef = useRef(FREQ_START_HZ);
  const phaseRef = useRef(0);

  const bubbles = useRef(makeBubbles(BUBBLE_COUNT)).current;
  const bubbleProgress = useRef(
    bubbles.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!active) {
      bubbleProgress.forEach((value) => {
        value.stopAnimation();
        value.setValue(0);
      });
      return;
    }

    // Not Animated.loop(sequence([delay, timing])): looping a composite
    // sequence doesn't reliably reset the value to 0 before each repeat, so
    // after the first rise every following "loop" animates 1 -> 1 (no
    // visible motion, and opacity is 0 at value 1) — it looks like the
    // animation just stopped. Resetting explicitly before each rise avoids
    // relying on that behavior at all.
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function rise(i: number, delay: number) {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        bubbleProgress[i].setValue(0);
        Animated.timing(bubbleProgress[i], {
          toValue: 1,
          duration: bubbles[i].duration,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished && !cancelled) rise(i, 0);
        });
      }, delay);
      timeouts.push(timeout);
    }

    bubbles.forEach((bubble, i) => rise(i, bubble.delay));

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      bubbleProgress.forEach((value) => value.stopAnimation());
    };
  }, [active, bubbleProgress, bubbles]);

  useEffect(() => {
    if (clamped < DESCENT_END) {
      inVibrationRef.current = false;
      Animated.timing(posValue, {
        toValue: clamped / DESCENT_END,
        duration: 900,
        useNativeDriver: false,
      }).start();
      Animated.timing(auraOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
      return;
    }

    inVibrationRef.current = true;
    const t2 = (clamped - DESCENT_END) / (1 - DESCENT_END);
    const eased = Math.pow(Math.min(1, t2), FREQ_RAMP_POWER);
    instFreqRef.current = FREQ_START_HZ + (FREQ_END_HZ - FREQ_START_HZ) * eased;

    const auraTarget =
      t2 <= AURA_START ? 0 : (t2 - AURA_START) / (1 - AURA_START);
    Animated.timing(auraOpacity, {
      toValue: auraTarget,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [auraOpacity, clamped, posValue]);

  useEffect(() => {
    let raf: number;
    let lastTs: number | null = null;

    function tick(ts: number) {
      if (inVibrationRef.current) {
        if (lastTs == null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        phaseRef.current += 2 * Math.PI * instFreqRef.current * dt;
        posValue.setValue(0.5 + 0.5 * Math.cos(phaseRef.current));
      } else {
        lastTs = null;
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [posValue]);

  const orbY = posValue.interpolate({
    inputRange: [0, 1],
    outputRange: [ORB_TOP_Y, ORB_BOTTOM_Y],
  });
  // Glossy highlight offset: sits just above the orb centre so the single orb
  // reads as a lit, reflective sphere rather than a flat disc.
  const highlightY = posValue.interpolate({
    inputRange: [0, 1],
    outputRange: [ORB_TOP_Y - 16, ORB_BOTTOM_Y - 16],
  });
  const pulseOpacity = posValue.interpolate({
    inputRange: [0, 0.05, 0.5, 0.95, 1],
    outputRange: [0.75, 0.95, 0.9, 0.95, 0.75],
  });

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <RadialGradient id="bodyVignette" cx="50%" cy="42%" r="68%">
            <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.12} />
            <Stop offset="58%" stopColor="#c7d2fe" stopOpacity={0.055} />
            <Stop offset="100%" stopColor="#818cf8" stopOpacity={0.025} />
          </RadialGradient>
          <RadialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.92} />
            <Stop offset="34%" stopColor="#c7d2fe" stopOpacity={0.72} />
            <Stop offset="68%" stopColor="#818cf8" stopOpacity={0.24} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="haloGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#c7d2fe" stopOpacity={0.28} />
            <Stop offset="58%" stopColor="#818cf8" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="auraGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#c7d2fe" stopOpacity={0.16} />
            <Stop offset="60%" stopColor="#818cf8" stopOpacity={0.075} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="silhouetteSheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.09} />
            <Stop offset="100%" stopColor="#818cf8" stopOpacity={0.045} />
          </LinearGradient>
          <RadialGradient id="bubbleGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.85} />
            <Stop offset="45%" stopColor="#c7d2fe" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </RadialGradient>
          <ClipPath id="bodyClip">{BODY_SHAPES}</ClipPath>
        </Defs>

        <AnimatedEllipse
          cx={BODY_CENTER_X}
          cy={HEIGHT / 2}
          rx={118}
          ry={222}
          fill="url(#auraGradient)"
          opacity={auraOpacity}
        />

        <G fill="#c7d2fe" opacity={0.075}>
          {BODY_SHAPES}
        </G>
        <G fill="url(#bodyVignette)" opacity={0.7}>
          {BODY_SHAPES}
        </G>
        <G fill="url(#silhouetteSheen)" opacity={0.55}>
          {BODY_SHAPES}
        </G>

        <AnimatedEllipse
          cx={BODY_CENTER_X}
          cy={orbY}
          rx={62}
          ry={58}
          fill="url(#haloGradient)"
          opacity={pulseOpacity}
        />

        <G clipPath="url(#bodyClip)">
          <AnimatedEllipse
            cx={BODY_CENTER_X}
            cy={orbY}
            rx={54}
            ry={52}
            fill="url(#orbGradient)"
            opacity={pulseOpacity}
          />
          <AnimatedEllipse
            cx={BODY_CENTER_X}
            cy={highlightY}
            rx={20}
            ry={16}
            fill="#f5f7ff"
            opacity={0.35}
          />
        </G>

        {/* Rendered above the orb/halo so the bubbles stay visible once the
            orb starts vibrating fast and sweeping large, opaque ellipses
            across the same area. */}
        <G clipPath="url(#bodyClip)">
          {bubbles.map((bubble, i) => {
            const cy = bubbleProgress[i].interpolate({
              inputRange: [0, 1],
              outputRange: [BUBBLE_BOTTOM_Y, BUBBLE_TOP_Y],
            });
            const opacity = bubbleProgress[i].interpolate({
              inputRange: [0, 0.15, 0.85, 1],
              outputRange: [0, 0.8, 0.8, 0],
            });
            return (
              <AnimatedCircle
                key={i}
                cx={bubble.x}
                cy={cy}
                r={bubble.radius}
                fill="url(#bubbleGradient)"
                opacity={opacity}
              />
            );
          })}
        </G>

        {CHAKRA_POINTS.map((point) => {
          const inputRange = flareInputRange(point.cy);
          const flareOpacity = posValue.interpolate({
            inputRange,
            outputRange: [0, 0.14, 0.86, 0.14, 0],
            extrapolate: "clamp",
          });
          const flareRadius = posValue.interpolate({
            inputRange,
            outputRange: [4.5, 6, 9.5, 6, 4.5],
            extrapolate: "clamp",
          });

          return (
            <G key={point.id}>
              <Circle
                cx={point.cx}
                cy={point.cy}
                r={4.2}
                fill="#475569"
                opacity={0.34}
              />
              <AnimatedCircle
                cx={point.cx}
                cy={point.cy}
                r={flareRadius}
                fill="#e0e7ff"
                opacity={flareOpacity}
              />
            </G>
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
