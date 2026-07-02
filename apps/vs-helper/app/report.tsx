import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { SessionReport } from "@/features/vs/types";
import { saveReport } from "@/features/vs/storage";
import ReportForm from "@/components/ReportForm";

export default function Report() {
  const router = useRouter();
  const { slot } = useLocalSearchParams<{ slot?: string }>();

  async function handleSave(report: SessionReport) {
    await saveReport(report);
    router.replace("/");
  }

  function handleSkip() {
    // The session was already counted on the practice screen; skipping just
    // dismisses the reflection without saving a report.
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <ReportForm
        slot={slot ?? "manual"}
        onSave={handleSave}
        onSkip={handleSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
});
