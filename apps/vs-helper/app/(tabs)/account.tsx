import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import {
  cognitoConfig,
  issuer,
  getRedirectUri,
  exchangeCodeForTokens,
  getStoredTokens,
  parseIdToken,
  clearTokens,
  LoginButton,
  type AuthUser,
} from "@vs/auth";
import { useI18n } from "@/features/i18n";
import { syncSettingsNow } from "@/features/vs/sync";
import { useLeaderboard } from "@/features/vs/useLeaderboard";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Account() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const redirectUri = getRedirectUri();
  console.log("[auth] redirectUri:", redirectUri);
  const discovery = AuthSession.useAutoDiscovery(issuer);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoConfig.clientId,
      scopes: cognitoConfig.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: { identity_provider: "Google" },
    },
    discovery,
  );

  const {
    loading: lbLoading,
    profile,
    refresh: refreshLeaderboard,
    saveProfile,
  } = useLeaderboard();
  const [handle, setHandle] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [lbHydrated, setLbHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStoredTokens().then((t) => {
      if (t) setUser(parseIdToken(t.idToken));
    });
  }, []);

  useEffect(() => {
    if (response?.type !== "success" || !request?.codeVerifier) return;
    exchangeCodeForTokens(response.params.code, request.codeVerifier)
      .then((t) => {
        setUser(parseIdToken(t.idToken));
        // Pull/push settings now that we have a token; other screens' own
        // useSchedule() picks up the merged result on their next focus.
        void syncSettingsNow();
        void refreshLeaderboard();
      })
      .catch((err) => console.error("[auth] token exchange failed:", err));
  }, [response, request, refreshLeaderboard]);

  useEffect(() => {
    if (lbLoading || lbHydrated) return;
    setHandle(profile.handle);
    setOptIn(profile.leaderboardOptIn);
    setLbHydrated(true);
  }, [lbLoading, lbHydrated, profile]);

  async function handleSignOut() {
    await clearTokens();
    setUser(null);
    setLbHydrated(false);
  }

  async function handleSaveLeaderboard() {
    setFormError(null);
    if (optIn && !HANDLE_RE.test(handle)) {
      setFormError(t("leaderboard.handleInvalid"));
      return;
    }
    setSaving(true);
    const ok = await saveProfile({ handle, leaderboardOptIn: optIn });
    setSaving(false);
    if (!ok) setFormError(t("leaderboard.saveFailed"));
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <Text style={styles.title}>{t("account.title")}</Text>

      {user ? (
        <View style={styles.profile}>
          <Ionicons name="person-circle" size={72} color="#6366f1" />
          <Text style={styles.name}>{user.name ?? user.email}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <Text style={styles.signOut} onPress={handleSignOut}>
            {t("account.signOut")}
          </Text>
        </View>
      ) : (
        <View style={styles.authPrompt}>
          <Ionicons name="cloud-upload-outline" size={56} color="#94a3b8" />
          <Text style={styles.blurb}>{t("account.blurb")}</Text>
          <LoginButton
            title={t("account.loginTitle")}
            subtitle={t("account.loginSubtitle")}
            disabled={!request}
            onPress={() => promptAsync()}
          />
        </View>
      )}

      {user ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>{t("leaderboard.title")}</Text>
          <Text style={styles.intro}>{t("leaderboard.intro")}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t("leaderboard.handleLabel")}</Text>
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={setHandle}
              placeholder={t("leaderboard.handlePlaceholder")}
              autoCapitalize="none"
              maxLength={20}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t("leaderboard.optIn")}</Text>
            <Switch value={optIn} onValueChange={setOptIn} />
          </View>

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveLeaderboard}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? t("leaderboard.saving") : t("leaderboard.save")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 14,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    alignSelf: "flex-start",
  },
  profile: { alignItems: "center", gap: 8 },
  name: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  email: { fontSize: 14, color: "#64748b" },
  authPrompt: { width: "100%", alignItems: "center", gap: 16, maxWidth: 360 },
  blurb: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    textAlign: "center",
  },
  signOut: {
    marginTop: 8,
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 15,
  },
  section: {
    width: "100%",
    gap: 14,
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  subtitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  intro: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 15, color: "#334155" },
  error: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
