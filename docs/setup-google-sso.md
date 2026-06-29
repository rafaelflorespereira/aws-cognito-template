# Setting Up Google SSO

This guide walks through creating the Google OAuth 2.0 credentials required by the Cognito Identity Provider.

## Step 1 — Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it (e.g. `aws-cognito-sso`) and click **Create**

## Step 2 — Enable the Google+ API (People API)

1. In the left menu, go to **APIs & Services → Library**
2. Search for **"Google Identity"** or **"OAuth2"**
3. Enable **Google People API** (required for profile attributes)

## Step 3 — Configure the OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace org)
3. Fill in:
   - **App name**: your app name
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue**
5. On **Scopes**, add:
   - `openid`
   - `email`
   - `profile`
6. Click **Save and Continue** through the remaining steps

> **Note:** While in Testing mode, only users you explicitly add as test users can sign in. Publish the app when ready for production.

## Step 4 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name it (e.g. `Cognito Client`)
5. Under **Authorized redirect URIs**, add:

   ```
   https://<cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```

   Replace `<cognito-domain>` and `<region>` with your CDK stack outputs.

6. Click **Create**
7. **Copy** the `Client ID` and `Client Secret` — you'll need them for the CDK stack.

## Step 5 — Pass Credentials to CDK

Set environment variables before deploying (never commit these):

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"

cd infrastructure/cdk
npm run deploy
```

Alternatively, store them in **AWS Secrets Manager** or **AWS SSM Parameter Store** and read them in the CDK stack. See `infrastructure/cdk/lib/cognito-stack.ts` for the injection point.

## Step 6 — Register Callback URLs in Cognito

After deploying the CDK stack, the App Client callback URLs are automatically configured. For local development they include:

- `http://localhost:3000/auth/callback`

For production, add your domain in `infrastructure/cdk/lib/cognito-stack.ts` under `callbackUrls`.

## Attribute Mapping

Cognito maps Google profile attributes to user pool attributes:

| Google claim | Cognito attribute |
|--------------|------------------|
| `sub` | `username` |
| `email` | `email` |
| `name` | `name` |
| `picture` | `picture` |

These mappings are defined in the CDK stack (`GoogleIdP` construct).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `redirect_uri_mismatch` | The URI in Google Console must exactly match the Cognito idpresponse URL |
| User sees "App is not verified" | Add them as a test user in Google Console, or publish the app |
| `invalid_grant` | PKCE code verifier mismatch — ensure Amplify is configured with `responseType: 'code'` |
| Attributes not mapped | Check attribute mappings in the User Pool Identity Provider settings |
