import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

// The loud, conversion-style primary CTA: a tall pill on a purple gradient with
// a slow light "shimmer" sweeping across it on a loop, plus a trailing arrow.
export default function PrimaryActionButton({ label, onPress, style }: Props) {
  const [width, setWidth] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Pause between sweeps so the light feels like an occasional glint,
        // not a constant scanning bar.
        Animated.delay(1600),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const bandWidth = Math.max(120, width * 0.45);
  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, width + bandWidth],
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.9}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* Purple base gradient */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="cta" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7c3aed" />
            <Stop offset="50%" stopColor="#6d28d9" />
            <Stop offset="100%" stopColor="#a855f7" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#cta)" />
      </Svg>

      {/* Animated light sweep */}
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            { width: bandWidth, transform: [{ translateX }, { skewX: "-18deg" }] },
          ]}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
                <Stop offset="50%" stopColor="#ffffff" stopOpacity={0.45} />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#shine)" />
          </Svg>
        </Animated.View>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="arrow-forward" size={24} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    minHeight: 68,
    overflow: "hidden",
    justifyContent: "center",
    // Purple glow lift.
    shadowColor: "#7c3aed",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  label: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
