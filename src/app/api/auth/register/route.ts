import { NextResponse } from 'next/server';
import { 
  CognitoIdentityProviderClient, 
  SignUpCommand,
  UsernameExistsException,
  InvalidPasswordException,
  InvalidParameterException,
  TooManyRequestsException
} from '@aws-sdk/client-cognito-identity-provider';
import { createUser } from '@/db/utils';

// Initialize Cognito client with region from environment variables
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export async function POST(request: Request) {
  try {
    // Extract and validate required fields from request body
    const { 
      email, 
      password, 
      name,
      given_name,
      family_name,
      middle_name,
      nickname,
      preferred_username,
      profile,
      picture,
      website,
      gender,
      birthdate,
      zoneinfo,
      locale,
      phone_number,
      address,
      updated_at
    } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Prepare user attributes
    const userAttributes = [
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
    ];

    // Add optional attributes if provided
    if (name) userAttributes.push({ Name: 'name', Value: name });
    if (given_name) userAttributes.push({ Name: 'given_name', Value: given_name });
    if (family_name) userAttributes.push({ Name: 'family_name', Value: family_name });
    if (middle_name) userAttributes.push({ Name: 'middle_name', Value: middle_name });
    if (nickname) userAttributes.push({ Name: 'nickname', Value: nickname });
    if (profile) userAttributes.push({ Name: 'profile', Value: profile });
    if (picture) userAttributes.push({ Name: 'picture', Value: picture });
    if (website) userAttributes.push({ Name: 'website', Value: website });
    if (gender) userAttributes.push({ Name: 'gender', Value: gender });
    if (zoneinfo) userAttributes.push({ Name: 'zoneinfo', Value: zoneinfo });
    if (locale) userAttributes.push({ Name: 'locale', Value: locale });
    if (address) userAttributes.push({ Name: 'address', Value: address });
    if (updated_at) userAttributes.push({ Name: 'updated_at', Value: updated_at });

    // Create SignUp command
    const command = new SignUpCommand({
      ClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    });

    // Execute signup command
    const response = await cognitoClient.send(command);

    // Create user in our database
    if (response.UserSub) {
      await createUser(response.UserSub, email);
    }

    // Return success response
    return NextResponse.json(
      { 
        message: 'Registration successful. User is automatically confirmed.',
        userSub: response.UserSub
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific Cognito exceptions
    if (error instanceof UsernameExistsException) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (error instanceof InvalidPasswordException) {
      return NextResponse.json(
        { error: 'Password does not meet the requirements' },
        { status: 400 }
      );
    }

    if (error instanceof InvalidParameterException) {
      return NextResponse.json(
        { error: 'Invalid parameters provided' },
        { status: 400 }
      );
    }

    if (error instanceof TooManyRequestsException) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later' },
        { status: 429 }
      );
    }

    // Handle any other errors
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
} 