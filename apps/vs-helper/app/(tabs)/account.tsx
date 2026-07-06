import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
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

export default function Account() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const redirectUri = getRedirectUri();
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
      })
      .catch((err) => console.error("[auth] token exchange failed:", err));
  }, [response, request]);

  async function handleSignOut() {
    await clearTokens();
    setUser(null);
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
    gap: 24,
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
});
