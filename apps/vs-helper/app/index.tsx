import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
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
import { useSchedule } from "@/features/vs/useSchedule";
import NextPracticeCard from "@/components/NextPracticeCard";

export default function Dashboard() {
  const router = useRouter();
  const { settings, next, progress, refresh, loading } = useSchedule();

  // Optional auth (advisable, not required).
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
      .then((t) => setUser(parseIdToken(t.idToken)))
      .catch((err) => console.error("[auth] token exchange failed:", err));
  }, [response, request]);

  // Refresh progress whenever the dashboard regains focus (e.g. after a session).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleSignOut() {
    await clearTokens();
    setUser(null);
  }

  if (loading) return <View style={styles.container} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vibrational State</Text>

      <NextPracticeCard
        next={next}
        completed={progress.completed}
        target={settings.timesPerDay}
      />

      <TouchableOpacity
        style={styles.primary}
        onPress={() => router.push("/practice")}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryText}>Do the Vibrational State now</Text>
      </TouchableOpacity>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => router.push("/stats")}>
          <Text style={styles.link}>Progress & achievements</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Text style={styles.link}>Settings</Text>
        </TouchableOpacity>
      </View>

      {user ? (
        <Text style={styles.signedIn}>
          Signed in as {user.name ?? user.email} ·{" "}
          <Text style={styles.signOut} onPress={handleSignOut}>
            Sign out
          </Text>
        </Text>
      ) : (
        <View style={styles.authPrompt}>
          <LoginButton
            title="Save your progress"
            subtitle="Signing in lets your sessions count across devices (optional)."
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
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  primary: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  linkRow: {
    flexDirection: "row",
    gap: 24,
  },
  link: { color: "#6366f1", fontWeight: "600", fontSize: 15 },
  signedIn: { color: "#64748b", fontSize: 13 },
  signOut: { color: "#ef4444", fontWeight: "600" },
  authPrompt: { width: "100%", alignItems: "center" },
});
