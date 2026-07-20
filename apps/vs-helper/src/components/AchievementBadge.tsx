import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Achievement, AchievementTier } from "@/features/vs/types";
import { useI18n, type TranslationKey } from "@/features/i18n";

const TIER_COLORS: Record<AchievementTier, { accent: string; bg: string }> = {
  bronze: { accent: "#b45309", bg: "#fef3e2" },
  silver: { accent: "#64748b", bg: "#f1f5f9" },
  gold: { accent: "#ca8a04", bg: "#fef9c3" },
  platinum: { accent: "#7c3aed", bg: "#f3e8ff" },
};

function formatUnlockDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function AchievementBadge({ item }: { item: Achievement }) {
  const { t } = useI18n();
  const unlocked = !!item.unlockedAt;
  const colors = TIER_COLORS[item.tier];

  return (
    <View style={[styles.row, !unlocked && styles.locked]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: unlocked ? colors.bg : "#e2e8f0" },
        ]}
      >
        <Ionicons
          name={unlocked ? "star" : "lock-closed"}
          size={18}
          color={unlocked ? colors.accent : "#94a3b8"}
        />
      </View>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {t(`achievement.${item.id}.title` as TranslationKey)}
          </Text>
          {unlocked ? (
            <View style={[styles.tierChip, { backgroundColor: colors.bg }]}>
              <Text style={[styles.tierChipText, { color: colors.accent }]}>
                {t(`achievements.tier.${item.tier}` as TranslationKey)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.desc}>
          {t(`achievement.${item.id}.desc` as TranslationKey)}
        </Text>
        {unlocked && item.unlockedAt ? (
          <Text style={styles.unlockedAt}>
            {t("achievements.unlockedOn", {
              date: formatUnlockDate(item.unlockedAt),
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  locked: {
    opacity: 0.5,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  tierChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tierChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  desc: { fontSize: 13, color: "#64748b" },
  unlockedAt: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
});
