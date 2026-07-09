import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export interface VsHelperBackendStackProps extends cdk.StackProps {
  /** Existing Cognito User Pool that already gates the VS app (see docs/deployment.md). */
  userPoolId: string;
  /** Public PKCE App Client id; the ID token's `aud` claim must match this. */
  userPoolClientId: string;
}

// Cloud sync backend for apps/vs-helper (docs/vs-helper-architecture.md §12).
// Phase 2: Settings + Sessions + Stats sync — Reports and UserAchievements stay
// on-device. Phase 3 (§11): opt-in leaderboard via Users table + Stats GSI.
export class VsHelperBackendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: VsHelperBackendStackProps,
  ) {
    super(scope, id, props);

    // User data — retained even if the stack is destroyed, so an accidental
    // `cdk destroy` can't wipe every user's settings/history/streaks.
    const settingsTable = new dynamodb.Table(this, "SettingsTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const sessionsTable = new dynamodb.Table(this, "SessionsTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const statsTable = new dynamodb.Table(this, "StatsTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Phase 3 (docs/vs-helper-architecture.md §11): opted-in users are indexed
    // by this GSI so the leaderboard is a single query, sorted by totalSessions
    // descending. Rows without gsi1pk (the default) never appear in the index.
    statsTable.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Profile + leaderboard opt-in, one row per user (docs §12.2 Users table).
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const commonEnv = {
      SETTINGS_TABLE_NAME: settingsTable.tableName,
      SESSIONS_TABLE_NAME: sessionsTable.tableName,
      STATS_TABLE_NAME: statsTable.tableName,
      USERS_TABLE_NAME: usersTable.tableName,
    };

    const commonProps: Partial<lambdaNode.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv,
      bundling: { minify: true, sourceMap: true },
    };

    const handlersDir = path.join(__dirname, "..", "src", "handlers");
    const fn = (name: string) =>
      new lambdaNode.NodejsFunction(this, name, {
        entry: path.join(handlersDir, `${lowerFirst(name)}.ts`),
        ...commonProps,
      });

    const getSettingsFn = fn("GetSettingsFn");
    const putSettingsFn = fn("PutSettingsFn");
    const getSessionsFn = fn("GetSessionsFn");
    const postSessionFn = fn("PostSessionFn");
    const getStatsFn = fn("GetStatsFn");
    const getProfileFn = fn("GetProfileFn");
    const putProfileFn = fn("PutProfileFn");
    const getLeaderboardFn = fn("GetLeaderboardFn");

    settingsTable.grantReadData(getSettingsFn);
    settingsTable.grantReadWriteData(putSettingsFn);
    sessionsTable.grantReadData(getSessionsFn);
    sessionsTable.grantReadWriteData(postSessionFn);
    statsTable.grantReadWriteData(postSessionFn);
    statsTable.grantReadData(getStatsFn);
    usersTable.grantReadData(postSessionFn); // reads opt-in/handle to keep Stats' GSI fields current

    usersTable.grantReadData(getProfileFn);
    usersTable.grantReadWriteData(putProfileFn);
    statsTable.grantReadWriteData(putProfileFn); // keeps Stats' denormalized handle/gsi fields in sync
    statsTable.grantReadData(getLeaderboardFn);

    // The RN app already holds a Cognito ID token (packages/auth); this
    // authorizer verifies it directly — no separate Lambda authorizer needed.
    const authorizer = new HttpJwtAuthorizer(
      "CognitoAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPoolId}`,
      { jwtAudience: [props.userPoolClientId] },
    );

    const httpApi = new apigwv2.HttpApi(this, "VsHelperHttpApi", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.POST,
        ],
        allowHeaders: ["authorization", "content-type"],
      },
    });

    httpApi.addRoutes({
      path: "/settings",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetSettingsInt", getSettingsFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/settings",
      methods: [apigwv2.HttpMethod.PUT],
      integration: new HttpLambdaIntegration("PutSettingsInt", putSettingsFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/sessions",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetSessionsInt", getSessionsFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/sessions",
      methods: [apigwv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration("PostSessionInt", postSessionFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/stats",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetStatsInt", getStatsFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/profile",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetProfileInt", getProfileFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/profile",
      methods: [apigwv2.HttpMethod.PUT],
      integration: new HttpLambdaIntegration("PutProfileInt", putProfileFn),
      authorizer,
    });
    httpApi.addRoutes({
      path: "/leaderboard",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetLeaderboardInt",
        getLeaderboardFn,
      ),
      authorizer,
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
  }
}

function lowerFirst(pascal: string): string {
  // "GetSettingsFn" -> "getSettings"
  return pascal.replace(/Fn$/, "").replace(/^./, (c) => c.toLowerCase());
}
