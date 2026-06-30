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
    if (response?.type !== "success" || !request?.codeVerifier) return;
    const { code } = response.params;
    exchangeCodeForTokens(code, request.codeVerifier)
      .then((tokens) => setUser(parseIdToken(tokens.idToken)))
      .catch(console.error);
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
        <LoginButton disabled={!request} onPress={() => promptAsync()} />
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
