import { NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getUserByCognitoId } from '@/db/utils';
import { jwtDecode } from 'jwt-decode';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed');
    }

    // Extract Cognito ID from the ID token
    const decodedToken = jwtDecode(response.AuthenticationResult.IdToken!);
    const cognitoId = decodedToken.sub;

    if (!cognitoId) {
      throw new Error('Invalid token: missing sub claim');
    }

    // Get user from our database
    const user = await getUserByCognitoId(cognitoId);

    return NextResponse.json({
      user: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        ...user,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
} 