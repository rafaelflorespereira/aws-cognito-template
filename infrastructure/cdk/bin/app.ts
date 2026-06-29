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
  callbackUrls: [
    // Standalone / EAS build (matches app.json scheme)
    'myapp://callback',
    // Expo Go on simulator
    'exp://localhost:8081',
    // Expo Go on physical device (replace with your machine's local IP)
    'exp://192.168.1.100:8081',
  ],
  logoutUrls: [
    'myapp://',
    'exp://localhost:8081',
    'exp://192.168.1.100:8081',
  ],
});
