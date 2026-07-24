import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  cognitoConfig,
  cognitoIdentityProviders,
  issuer,
  getRedirectUri,
  exchangeCodeForTokens,
  getStoredTokens,
  parseIdToken,
  clearTokens,
  LoginButton,
  type CognitoIdentityProvider,
  type AuthUser,
} from "@vs/auth";
import { useI18n } from "@/features/i18n";
import {
  syncSessionHistoryNow,
  syncSettingsNow,
  useNeedsReauth,
} from "@/features/vs/sync";
import { useLeaderboard } from "@/features/vs/useLeaderboard";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Account() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const redirectUri = getRedirectUri();
  console.log("[auth] redirectUri:", redirectUri);
  const discovery = AuthSession.useAutoDiscovery(issuer);
  const [googleRequest, , promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoConfig.clientId,
      scopes: cognitoConfig.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        identity_provider: cognitoIdentityProviders.google,
        prompt: "login",
      },
    },
    discovery,
  );
  const [appleRequest, , promptAppleAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoConfig.clientId,
      scopes: cognitoConfig.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        identity_provider: cognitoIdentityProviders.apple,
        prompt: "login",
      },
    },
    discovery,
  );

  const {
    loading: lbLoading,
    profile,
    profileError,
    refresh: refreshLeaderboard,
    saveProfile,
  } = useLeaderboard();
  const [handle, setHandle] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [lbHydrated, setLbHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authenticatingProvider, setAuthenticatingProvider] =
    useState<CognitoIdentityProvider | null>(null);
  const needsReauth = useNeedsReauth();

  useEffect(() => {
    getStoredTokens().then((t) => {
      if (t) setUser(parseIdToken(t.idToken));
    });
  }, []);

  useEffect(() => {
    if (profileError) {
      setLbHydrated(false);
      return;
    }
    if (lbLoading || lbHydrated) return;
    setHandle(profile.handle);
    setOptIn(profile.leaderboardOptIn);
    setLbHydrated(true);
  }, [lbLoading, lbHydrated, profile, profileError]);

  async function handleSignIn(provider: CognitoIdentityProvider) {
    const isApple = provider === cognitoIdentityProviders.apple;
    const request = isApple ? appleRequest : googleRequest;
    const promptAsync = isApple ? promptAppleAsync : promptGoogleAsync;

    if (!request?.codeVerifier) {
      console.error(`[auth] ${provider} request is not ready`);
      return;
    }

    setAuthenticatingProvider(provider);
    try {
      const response = await promptAsync();
      if (response.type !== "success") return;

      const tokens = await exchangeCodeForTokens(
        response.params.code,
        request.codeVerifier,
      );
      setUser(parseIdToken(tokens.idToken));
      // Pull/push settings now that we have a token; other screens' own
      // useSchedule() picks up the merged result on their next focus.
      void syncSettingsNow();
      void syncSessionHistoryNow();
      void refreshLeaderboard();
    } catch (err) {
      console.error(`[auth] ${provider} sign-in failed:`, err);
    } finally {
      setAuthenticatingProvider(null);
    }
  }

  async function handleSignOut() {
    await clearTokens();
    setUser(null);
    setLbHydrated(false);
  }

  async function handleSaveLeaderboard() {
    setFormError(null);
    setSaved(false);
    if (optIn && !HANDLE_RE.test(handle)) {
      setFormError(t("leaderboard.handleInvalid"));
      return;
    }
    setSaving(true);
    const error = await saveProfile({ handle, leaderboardOptIn: optIn });
    setSaving(false);
    if (error) {
      if (error.code === "unauthorized" || error.code === "signed_out") {
        setFormError(t("leaderboard.authRequired"));
      } else {
        setFormError(t("leaderboard.saveFailed"));
      }
      // The switch/handle must reflect what's actually persisted — otherwise
      // a failed save leaves the UI claiming an opt-in that never reached
      // the server, and the leaderboard silently stays empty with no clue why.
      setHandle(profile.handle);
      setOptIn(profile.leaderboardOptIn);
      return;
    }
    setSaved(true);
  }

  const reauthProvider =
    user?.identityProvider ?? cognitoIdentityProviders.google;
  const reauthRequest =
    reauthProvider === cognitoIdentityProviders.apple
      ? appleRequest
      : googleRequest;
  const authBusy = authenticatingProvider !== null;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
    >
      <Text style={styles.title}>{t("account.title")}</Text>

      {user && needsReauth ? (
        <View style={styles.reauthBanner}>
          <Ionicons name="alert-circle" size={20} color="#b45309" />
          <Text style={styles.reauthText}>{t("account.reauthBanner")}</Text>
          <TouchableOpacity
            disabled={!reauthRequest || authBusy}
            onPress={() => void handleSignIn(reauthProvider)}
          >
            <Text style={styles.reauthAction}>
              {t("account.reauthAction")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>{t("account.loginTitle")}</Text>
            <Text style={styles.loginSubtitle}>
              {t("account.loginSubtitle")}
            </Text>
            {Platform.OS === "ios" ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={8}
                style={styles.appleLoginButton}
                pointerEvents={!appleRequest || authBusy ? "none" : "auto"}
                accessibilityState={{
                  disabled: !appleRequest || authBusy,
                  busy:
                    authenticatingProvider === cognitoIdentityProviders.apple,
                }}
                onPress={() =>
                  void handleSignIn(cognitoIdentityProviders.apple)
                }
              />
            ) : null}
            <LoginButton
              label={t("account.signInWithGoogle")}
              icon={<Ionicons name="logo-google" size={20} color="#4285f4" />}
              disabled={!googleRequest || authBusy}
              loading={
                authenticatingProvider === cognitoIdentityProviders.google
              }
              onPress={() =>
                void handleSignIn(cognitoIdentityProviders.google)
              }
            />
          </View>
        </View>
      )}

      {user ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>{t("leaderboard.title")}</Text>
          <Text style={styles.intro}>{t("leaderboard.intro")}</Text>
          {profileError ? (
            <Text style={styles.error}>
              {profileError.code === "unauthorized" ||
              profileError.code === "signed_out"
                ? t("leaderboard.authRequired")
                : `${t("leaderboard.loadFailed")} (${profileError.code})`}
            </Text>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>{t("leaderboard.handleLabel")}</Text>
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={(v) => {
                setHandle(v);
                setFormError(null);
                setSaved(false);
              }}
              placeholder={t("leaderboard.handlePlaceholder")}
              autoCapitalize="none"
              maxLength={20}
              editable={!lbLoading && !profileError}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t("leaderboard.optIn")}</Text>
            <Switch
              value={optIn}
              disabled={lbLoading || !!profileError}
              onValueChange={(v) => {
                setOptIn(v);
                setFormError(null);
                setSaved(false);
              }}
            />
          </View>

          {formError ? (
            <Text style={styles.error}>{formError}</Text>
          ) : saved ? (
            <Text style={styles.saved}>{t("leaderboard.saved")}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.saveBtn,
              (saving || lbLoading || !!profileError) &&
                styles.saveBtnDisabled,
            ]}
            onPress={handleSaveLeaderboard}
            disabled={saving || lbLoading || !!profileError}
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
  reauthBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 12,
  },
  reauthText: { flex: 1, fontSize: 13, color: "#92400e", lineHeight: 18 },
  reauthAction: { fontSize: 13, fontWeight: "700", color: "#6366f1" },
  profile: { alignItems: "center", gap: 8 },
  name: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  email: { fontSize: 14, color: "#64748b" },
  authPrompt: { width: "100%", alignItems: "center", gap: 16, maxWidth: 360 },
  loginCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  appleLoginButton: {
    width: "100%",
    height: 48,
  },
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
  saved: { color: "#16a34a", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
