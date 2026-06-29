# Deployment Guide

## Infrastructure (AWS CDK)

### First-time bootstrap

```bash
aws configure   # or: aws sso login

cd infrastructure/cdk
npm install
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

### Deploy Cognito stack

```bash
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."

npx cdk deploy CognitoStack --outputs-file outputs.json
```

### Stack outputs

```json
{
  "CognitoStack": {
    "UserPoolId": "us-east-1_XXXXXXXXX",
    "UserPoolClientId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "CognitoDomain": "my-app.auth.us-east-1.amazoncognito.com"
  }
}
```

Copy `UserPoolClientId` and the domain prefix into `mobile/.env`.

### Update / destroy

```bash
npx cdk deploy CognitoStack   # apply changes
npx cdk destroy CognitoStack  # tear down (deletes all users!)
```

---

## Mobile App (Expo)

### Local development

```bash
cd mobile
cp .env.example .env
# fill in values from CDK outputs
npm install
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

### Expo Go on a physical device

`expo-auth-session` will generate a redirect URI like `exp://192.168.x.x:8081`.
You must add your machine's local IP to the Cognito `callbackUrls` in `infrastructure/cdk/bin/app.ts` and re-deploy before testing on a real device.

### Production build (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Build for both platforms
eas build --platform all
```

EAS Build uses the `myapp://callback` scheme (standalone app), which is already registered in the Cognito App Client.

Set environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_AWS_REGION --value us-east-1
eas secret:create --scope project --name EXPO_PUBLIC_USER_POOL_CLIENT_ID --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_DOMAIN --value my-app
eas secret:create --scope project --name EXPO_PUBLIC_APP_SCHEME --value myapp
```

---

## Production Checklist

- [ ] Google OAuth consent screen is **Published** (not Testing)
- [ ] Cognito `callbackUrls` contains only `myapp://callback` (remove `exp://` URLs)
- [ ] Cognito `logoutUrls` contains only `myapp://`
- [ ] `app.json` → `ios.bundleIdentifier` and `android.package` are set to your real identifiers
- [ ] EAS secrets are configured (not `.env` file)
- [ ] Token refresh logic is tested (let access token expire and verify silent refresh works)
- [ ] Refresh token rotation enabled in Cognito App Client

---

## Useful AWS CLI Commands

```bash
# Describe the app client
aws cognito-idp describe-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID>

# List federated users
aws cognito-idp list-users --user-pool-id <POOL_ID>

# Update callback URLs after changing scheme
aws cognito-idp update-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID> \
  --callback-urls '["myapp://callback"]' \
  --logout-urls '["myapp://"]'
```
