import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { loadSettings } from "@/features/vs/storage";

// Required on web to complete the auth session after redirect; no-op on native.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setNeedsOnboarding(!s.configured);
      setReady(true);
    });
  }, []);

  // First-run gate: send un-configured users through Settings (onboarding mode).
  useEffect(() => {
    if (ready && needsOnboarding) {
      router.replace("/settings?onboarding=1");
    }
  }, [ready, needsOnboarding, router]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
