import { Amplify } from 'aws-amplify';

const region = process.env.NEXT_PUBLIC_AWS_REGION!;
const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID!;
const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!;
const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        oauth: {
          domain: `${cognitoDomain}.auth.${region}.amazoncognito.com`,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [`${appUrl}/auth/callback`],
          redirectSignOut: [`${appUrl}`],
          responseType: 'code', // authorization code + PKCE
        },
      },
    },
  },
});
