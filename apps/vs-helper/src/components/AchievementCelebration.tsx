import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Achievement, AchievementTier } from "@/features/vs/types";
import { useI18n, type TranslationKey } from "@/features/i18n";

const TIER_ACCENT: Record<AchievementTier, string> = {
  bronze: "#b45309",
  silver: "#64748b",
  gold: "#ca8a04",
  platinum: "#7c3aed",
};

export default function AchievementCelebration({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[];
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  const visible = achievements.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{t("achievements.unlocked")}</Text>
          {achievements.map((a) => (
            <View key={a.id} style={styles.item}>
              <Ionicons name="star" size={28} color={TIER_ACCENT[a.tier]} />
              <Text style={styles.itemTitle}>
                {t(`achievement.${a.id}.title` as TranslationKey)}
              </Text>
              <Text style={styles.itemDesc}>
                {t(`achievement.${a.id}.desc` as TranslationKey)}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>{t("achievements.nice")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6366f1",
  },
  item: { alignItems: "center", gap: 6 },
  itemTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  itemDesc: { fontSize: 13, color: "#64748b", textAlign: "center" },
  dismissBtn: {
    marginTop: 8,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  dismissText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
