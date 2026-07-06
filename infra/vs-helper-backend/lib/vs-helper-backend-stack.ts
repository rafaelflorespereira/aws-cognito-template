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

// Phase 2 cloud sync backend for apps/vs-helper (docs/vs-helper-architecture.md §12).
// First pass scope: Settings + Sessions + Stats sync only — Reports and
// UserAchievements stay on-device for now, and no leaderboard GSI is created yet.
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

    const commonEnv = {
      SETTINGS_TABLE_NAME: settingsTable.tableName,
      SESSIONS_TABLE_NAME: sessionsTable.tableName,
      STATS_TABLE_NAME: statsTable.tableName,
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
    const postSessionFn = fn("PostSessionFn");
    const getStatsFn = fn("GetStatsFn");

    settingsTable.grantReadData(getSettingsFn);
    settingsTable.grantReadWriteData(putSettingsFn);
    sessionsTable.grantReadWriteData(postSessionFn);
    statsTable.grantReadWriteData(postSessionFn);
    statsTable.grantReadData(getStatsFn);

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

    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
  }
}

function lowerFirst(pascal: string): string {
  // "GetSettingsFn" -> "getSettings"
  return pascal.replace(/Fn$/, "").replace(/^./, (c) => c.toLowerCase());
}
