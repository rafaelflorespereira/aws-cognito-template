import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";

/**
 * Amplify Gen 2 backend entry point. `npx ampx sandbox` deploys this to your
 * AWS account and writes the connection details to `amplify_outputs.json`.
 */
defineBackend({
  auth,
  data,
});
