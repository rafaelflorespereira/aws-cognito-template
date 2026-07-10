import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import {
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import { queryClient } from "@/lib/queryClient";
import { loadSettings } from "@/features/vs/storage";
import { I18nProvider, getInitialLang, type Lang } from "@/features/i18n";

// Required on web to complete the auth session after redirect; no-op on native.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [lang, setLang] = useState<Lang | null>(null);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
  });

  useEffect(() => {
    Promise.all([loadSettings(), getInitialLang()]).then(([s, initialLang]) => {
      setNeedsOnboarding(!s.configured);
      setLang(initialLang);
      setReady(true);
    });
  }, []);

  // First-run gate: send un-configured users through Settings (onboarding mode).
  useEffect(() => {
    if (ready && needsOnboarding) {
      router.replace("/settings?onboarding=1");
    }
  }, [ready, needsOnboarding, router]);

  if (!ready || !lang || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <I18nProvider initialLang={lang}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="practice" />
            <Stack.Screen name="report" />
          </Stack>
        </I18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
