import { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  ClipPath,
  Rect,
  Circle,
  Ellipse,
  G,
} from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

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
// CHAKRA_IDS order. Used to light up markers as the energy point reaches them.
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

// Narrative phases, keyed off the overall session `progress` (0..1):
//   0 – 15%: a single slow pass, head to feet (the energy "settling in").
//  15% – 100%: the point sways bottom-to-top-to-bottom, accelerating into a
//   fast, blurred "dynamo" vibration.
// The last stretch of the vibration phase fades in an aura around the body,
// standing in for the vibrational state having been reached.
const DESCENT_END = 0.08;
const AURA_START = 0.94; // fraction *within* the vibration phase, not overall progress
const FREQ_START_HZ = 0.12;
const FREQ_END_HZ = 4.0;
// Eases the frequency ramp so it lingers slow for longer and only
// accelerates sharply near the end, instead of climbing at a constant rate.
const FREQ_RAMP_POWER = 2.4;

// The single head-to-feet pass plays once, in real time, independent of how
// often `progress` itself ticks (the practice screen updates it once per
// second) — see the effect below for why that decoupling matters.
const DESCENT_DURATION_MS = 1600;

// Ease-out curve built from the natural (Neperian) logarithm: quick initial
// motion that settles smoothly toward the end, rather than a linear or
// mechanically-stepped pass. ln(1) = 0 and ln(e) = 1, so t=0..1 maps cleanly
// to eased 0..1.
function easeOutNeperian(t: number): number {
  return Math.log(1 + t * (Math.E - 1));
}

interface Props {
  /** 0..1, how far the practice session has progressed. */
  progress: number;
  height?: number;
}

export default function EnergyBodyIllustration({
  progress,
  height = 260,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  // Position of the traveling energy point along the body: 0 = head, 1 = feet.
  const posValue = useRef(new Animated.Value(0)).current;
  // Fill height only ever grows: once the first descent completes, the body
  // stays fully lit while the point above keeps vibrating on top of it.
  const fillPosValue = useRef(new Animated.Value(0)).current;
  const auraOpacity = useRef(new Animated.Value(0)).current;

  const [maxPos, setMaxPos] = useState(0);
  const maxPosRef = useRef(0);
  const fillLatchedRef = useRef(false);

  // Read by the persistent rAF loop below; written whenever `progress` ticks.
  const inVibrationRef = useRef(false);
  const instFreqRef = useRef(FREQ_START_HZ);
  const phaseRef = useRef(0);
  // Guards the descent so it plays exactly once: `progress` ticks roughly
  // once a second from the practice screen's countdown, and re-triggering a
  // fresh Animated.timing on every one of those ticks (the old behavior) cut
  // the pass into overlapping fragments instead of one fluid motion.
  const descentStartedRef = useRef(false);

  // Tracks how far down the body the animated point has actually traveled,
  // for the chakra markers to light up progressively as it passes — driven
  // off the live animated value rather than the coarse per-tick `progress`.
  useEffect(() => {
    const id = posValue.addListener(({ value }) => {
      if (inVibrationRef.current) return;
      maxPosRef.current = Math.max(maxPosRef.current, value);
      setMaxPos(maxPosRef.current);
    });
    return () => posValue.removeListener(id);
  }, [posValue]);

  useEffect(() => {
    if (clamped < DESCENT_END) {
      inVibrationRef.current = false;
      if (descentStartedRef.current) return;
      descentStartedRef.current = true;
      Animated.timing(posValue, {
        toValue: 1,
        duration: DESCENT_DURATION_MS,
        easing: easeOutNeperian,
        useNativeDriver: false,
      }).start();
      Animated.timing(fillPosValue, {
        toValue: 1,
        duration: DESCENT_DURATION_MS,
        easing: easeOutNeperian,
        useNativeDriver: false,
      }).start();
      return;
    }

    // Entering the vibration phase: stop any in-flight descent timing before
    // the rAF loop below starts manually driving posValue via setValue, so
    // the two never fight over the same Animated.Value.
    posValue.stopAnimation();
    inVibrationRef.current = true;
    maxPosRef.current = 1;
    setMaxPos(1);
    if (!fillLatchedRef.current) {
      fillLatchedRef.current = true;
      Animated.timing(fillPosValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  // Persistent animation-frame loop: drives the oscillation continuously so
  // the vibration stays smooth regardless of how often `progress` itself
  // ticks (the practice screen updates it once per second).
  useEffect(() => {
    let raf: number;
    let lastTs: number | null = null;

    function tick(ts: number) {
      if (inVibrationRef.current) {
        if (lastTs == null) lastTs = ts;
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;
        phaseRef.current += 2 * Math.PI * instFreqRef.current * dt;
        const pos = 0.5 + 0.5 * Math.cos(phaseRef.current);
        posValue.setValue(pos);
      } else {
        lastTs = null;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [posValue]);

  const fillHeight = fillPosValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
  });
  const glowY = posValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
  });
  // Pulses each time the point passes through a turning point, which during
  // the vibration phase reads as the glow brightening with each sway.
  const glowOpacity = posValue.interpolate({
    inputRange: [0, 0.05, 0.5, 0.95, 1],
    outputRange: [0, 1, 1, 1, 0],
  });

  const boundaryY = maxPos * HEIGHT;

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
          <RadialGradient id="auraGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#c7d2fe" stopOpacity={0.55} />
            <Stop offset="55%" stopColor="#818cf8" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
          </RadialGradient>
          <ClipPath id="bodyClip">{BODY_SHAPES}</ClipPath>
        </Defs>

        {/* Aura: fades in once the vibration has ramped up to a dynamo. */}
        <AnimatedEllipse
          cx={WIDTH / 2}
          cy={HEIGHT / 2}
          rx={130}
          ry={230}
          fill="url(#auraGradient)"
          opacity={auraOpacity}
        />

        {/* Dim resting silhouette, always visible. */}
        <G fill="#c7d2fe" opacity={0.14}>
          {BODY_SHAPES}
        </G>

        {/* Bright energy fill, clipped to the body. Grows head-to-feet during
            the descent, then stays full through the vibration phase. */}
        <AnimatedRect
          x={0}
          y={0}
          width={WIDTH}
          height={fillHeight}
          fill="url(#energyGradient)"
          clipPath="url(#bodyClip)"
        />

        {/* Traveling glow: a single pass down, then the vibrating point. */}
        <AnimatedCircle
          cx={WIDTH / 2}
          cy={glowY}
          r={16}
          fill="#e0e7ff"
          opacity={glowOpacity}
          clipPath="url(#bodyClip)"
        />

        {/* Chakra markers: lit once the energy has reached them, then stay lit. */}
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
