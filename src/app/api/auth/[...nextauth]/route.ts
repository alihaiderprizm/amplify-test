import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthOptions, Account, Profile, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { getCartByUserId, createCart, getUserByEmail, createUser } from '@/db/utils';
import { Cart } from '@/db/types';
import { jwtDecode } from 'jwt-decode';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

interface Token extends JWT {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sub?: string;
  email?: string | null;
  name?: string | null;
  cart?: Cart;
}

interface SessionUser extends NextAuthUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  cart: Cart;
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser;
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresAt: number;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
            AuthParameters: {
              USERNAME: credentials.email,
              PASSWORD: credentials.password,
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

          // Get or create user in our database
          let user = await getUserByEmail(credentials.email);
          if (!user) {
            user = await createUser(cognitoId, credentials.email);
          }

          if (!user) {
            throw new Error('Failed to create user in database');
          }

          // Get or create cart for the user
          let cart: Cart | null = await getCartByUserId(user.id);
          if (!cart) {
            cart = await createCart(user.id);
          }

          if (!cart) {
            throw new Error('Failed to create cart for user');
          }

          return {
            id: user.id,
            email: credentials.email,
            name: credentials.email,
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            cart: {
              id: cart.id,
              user_id: cart.user_id,
              created_at: cart.created_at,
              updated_at: cart.updated_at,
            },
          };
        } catch (error: any) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.sub = profile?.sub || user.id;
        token.email = profile?.email || user.email;
        token.name = profile?.name || user.name;
        token.cart = (user as SessionUser).cart;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        const typedToken = token as Token;
        session.accessToken = typedToken.accessToken || '';
        session.idToken = typedToken.idToken || '';
        session.refreshToken = typedToken.refreshToken || '';
        session.expiresAt = typedToken.expiresAt || 0;
        session.user.id = typedToken.sub || '';
        session.user.email = typedToken.email || '';
        session.user.name = typedToken.name || '';
        session.user.cart = typedToken.cart || {
          id: '',
          user_id: '',
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 