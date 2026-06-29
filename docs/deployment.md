# Deployment Guide

## Infrastructure (AWS CDK)

### First-time bootstrap

```bash
# Authenticate with AWS
aws configure  # or use SSO: aws sso login

# Bootstrap CDK (once per account/region)
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

CDK will print a summary of changes and prompt for confirmation before creating IAM resources.

### Stack outputs

After deploy, `outputs.json` will contain:

```json
{
  "CognitoStack": {
    "UserPoolId": "us-east-1_XXXXXXXXX",
    "UserPoolClientId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "CognitoDomain": "my-app.auth.us-east-1.amazoncognito.com",
    "HostedUIUrl": "https://my-app.auth.us-east-1.amazoncognito.com/login?..."
  }
}
```

Copy these into your frontend `.env.local`.

### Update / destroy

```bash
# Update after code changes
npx cdk deploy CognitoStack

# Tear down all resources
npx cdk destroy CognitoStack
```

> **Warning:** Destroying the stack deletes the User Pool and all user accounts permanently.

---

## Frontend (Next.js)

### Local development

```bash
cd frontend
cp .env.example .env.local
# fill in values from CDK outputs
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Production build

```bash
npm run build
npm start
```

### Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Set the environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Deploy to AWS (Amplify Hosting)

1. Push the `frontend/` directory to a GitHub repo (or the monorepo root)
2. In the AWS Amplify console, click **New app → Host web app**
3. Connect your GitHub repo
4. Set the build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend && npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```
5. Add environment variables matching `.env.example`

---

## Production Checklist

- [ ] Google OAuth consent screen is **Published** (not Testing)
- [ ] Cognito App Client `callbackUrls` includes your production domain
- [ ] Cognito App Client `logoutUrls` includes your production domain
- [ ] `NEXT_PUBLIC_APP_URL` is set to the production URL
- [ ] Refresh token rotation is enabled in Cognito App Client settings
- [ ] MFA policy reviewed (optional but recommended)
- [ ] Cognito advanced security features reviewed
- [ ] CloudWatch alarms set for `UserPool` sign-in errors

---

## Useful AWS CLI Commands

```bash
# List user pool clients
aws cognito-idp list-user-pool-clients --user-pool-id <POOL_ID>

# Describe the app client
aws cognito-idp describe-user-pool-client \
  --user-pool-id <POOL_ID> \
  --client-id <CLIENT_ID>

# List users
aws cognito-idp list-users --user-pool-id <POOL_ID>
```
