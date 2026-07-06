#!/usr/bin/env node
import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { VsHelperBackendStack } from "../lib/vs-helper-backend-stack";

const userPoolId = requireEnv("VS_USER_POOL_ID");
const userPoolClientId = requireEnv("VS_USER_POOL_CLIENT_ID");

const app = new cdk.App();
new VsHelperBackendStack(app, "VsHelperBackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  userPoolId,
  userPoolClientId,
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}
