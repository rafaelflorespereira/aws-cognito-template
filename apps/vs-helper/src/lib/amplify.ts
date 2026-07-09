// Amplify client bootstrap. Import polyfills BEFORE aws-amplify.
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

let configured = false;

/**
 * Configure Amplify from the deploy-generated amplify_outputs.json.
 *
 * Until you run `npx ampx sandbox` (or a pipeline deploy) the file is just a
 * stub, so this is a no-op and the app keeps working fully offline against
 * AsyncStorage. Once deployed, the file carries the real AppSync + Cognito
 * endpoints and cloud access turns on automatically.
 */
export function configureAmplify(): boolean {
  if (configured) return true;
  const hasBackend = Boolean(
    (outputs as { data?: { url?: string } })?.data?.url,
  );
  if (!hasBackend) return false;
  Amplify.configure(outputs as Parameters<typeof Amplify.configure>[0]);
  configured = true;
  return true;
}

export function isCloudEnabled(): boolean {
  return configured;
}
