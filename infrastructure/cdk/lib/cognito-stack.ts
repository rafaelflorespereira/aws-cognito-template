import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface CognitoStackProps extends cdk.StackProps {
  appName: string;
  googleClientId: string;
  googleClientSecret: string;
  callbackUrls: string[];
  logoutUrls: string[];
}

export class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { appName, googleClientId, googleClientSecret, callbackUrls, logoutUrls } = props;

    // ── User Pool ─────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${appName}-user-pool`,
      selfSignUpEnabled: false, // only via federated IdP (Google)
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
        profilePicture: { required: false, mutable: true },
      },
      // Refresh token validity
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change to RETAIN for production
    });

    // ── Hosted UI Domain ──────────────────────────────────────────────────────
    const domain = userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: appName,
      },
    });

    // ── Google Identity Provider ───────────────────────────────────────────────
    const googleIdP = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIdP', {
      userPool,
      clientId: googleClientId,
      clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
      // Request these scopes from Google
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
        custom: {
          email_verified: cognito.ProviderAttribute.other('email_verified'),
        },
      },
    });

    // ── App Client (public — no secret, uses PKCE) ─────────────────────────────
    const appClient = userPool.addClient('AppClient', {
      userPoolClientName: `${appName}-client`,
      generateSecret: false, // public client
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true, // + PKCE enforced by Amplify
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      // Token validity
      idTokenValidity: cdk.Duration.hours(1),
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Ensure IdP is created before the client
    appClient.node.addDependency(googleIdP);

    // ── CloudFormation Outputs ─────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: appClient.userPoolClientId,
      description: 'Cognito App Client ID',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `${appName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Hosted UI domain',
    });

    new cdk.CfnOutput(this, 'HostedUIUrl', {
      value: domain.baseUrl(),
      description: 'Cognito Hosted UI base URL',
    });
  }
}
