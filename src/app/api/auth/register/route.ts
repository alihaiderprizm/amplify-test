import { NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { createUser } from '@/db/utils';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export async function POST(request: Request) {
  try {
    const { email, password, preferred_username, phone_number, birthdate } = await request.json();

    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'preferred_username',
          Value: preferred_username,
        },
        {
          Name: 'phone_number',
          Value: phone_number,
        },
        {
          Name: 'birthdate',
          Value: birthdate,
        },
      ],
    });

    const response = await cognitoClient.send(command);
    
    // Create user in our database
    await createUser(response.UserSub!, email);

    return NextResponse.json({ message: 'User registered successfully' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
} 