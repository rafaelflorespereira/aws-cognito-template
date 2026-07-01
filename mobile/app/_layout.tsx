import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Required on web to complete the auth session after redirect.
// On native this is a no-op.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
