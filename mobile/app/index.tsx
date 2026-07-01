import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  exchangeCodeForTokens,
  getStoredTokens,
  clearTokens,
  parseIdToken,
  type AuthUser,
} from "@/lib/auth";
import { cognitoConfig, discovery, getRedirectUri } from "@/lib/cognito";
import LoginButton from "@/components/LoginButton";
import UserProfile from "@/components/UserProfile";

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = getRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoConfig.clientId,
      scopes: cognitoConfig.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    },
    discovery,
  );

  // Restore session on mount
  useEffect(() => {
    getStoredTokens()
      .then((tokens) => {
        if (tokens) setUser(parseIdToken(tokens.idToken));
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (!response) return;
    if (response.type === "error") {
      console.error("[auth] authorization error:", response.error, response.params);
      return;
    }
    if (response.type !== "success") {
      console.log("[auth] authorization response:", response.type);
      return;
    }
    if (!request?.codeVerifier) {
      console.error("[auth] missing codeVerifier on success response");
      return;
    }
    const { code } = response.params;
    console.log("[auth] exchanging code for tokens...");
    exchangeCodeForTokens(code, request.codeVerifier)
      .then((tokens) => {
        console.log("[auth] token exchange succeeded");
        setUser(parseIdToken(tokens.idToken));
      })
      .catch((err) => console.error("[auth] token exchange failed:", err));
  }, [response]);

  async function handleSignOut() {
    await clearTokens();
    setUser(null);
  }

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      {user ? (
        <UserProfile user={user} onSignOut={handleSignOut} />
      ) : (
        <LoginButton
          disabled={!request}
          onPress={() => {
            console.log("[auth] redirectUri:", redirectUri);
            promptAsync().catch((err) => console.error("[auth] promptAsync failed:", err));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
});
