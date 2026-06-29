#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();

new CognitoStack(app, 'CognitoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  appName: 'my-app',
  // Pass via env vars — never hardcode secrets
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // Allowed callback origins (add production URL here)
  callbackUrls: [
    'http://localhost:3000/auth/callback',
  ],
  logoutUrls: [
    'http://localhost:3000',
  ],
});
