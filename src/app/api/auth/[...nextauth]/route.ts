import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthOptions, Account, Profile, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import * as db from '@/db/db';
import { User, Cart, CartItem, CartWithItems } from '@/types';
import { jwtDecode } from 'jwt-decode';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  cartId: string;
  cart: CartWithItems;
}

interface Token extends JWT {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  cartId: string;
  cart: CartWithItems;
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
          let user = await db.getUserByEmail(credentials.email);
          if (!user) {
            user = await db.createUser(cognitoId, credentials.email);
          }

          if (!user) {
            throw new Error('Failed to create user in database');
          }

          // Get or create cart for the user
          let cart: Cart | null = await db.getCartByUserId(user.id);
          if (!cart) {
            cart = await db.createCart(user.id);
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
            isAdmin: false,
            cartId: cart.id,
          };
        } catch (error: any) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Get the user from the database
        const dbUser = await db.getUserByEmail(user.email as string);
        
        if (dbUser) {
          // Update the token with user data
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.email; // Using email as name since preferred_username might not exist
          token.isAdmin = dbUser.is_admin;
          
          // Get or create cart for the user
          let cart = await db.getCartByUserId(dbUser.id);
          if (!cart) {
            cart = await db.createCart(dbUser.id);
          }
          
          if (cart) {
            token.cartId = cart.id;
            // Get cart items
            const cartItems = await db.getCartItems(cart.id);
            token.cart = {
              ...cart,
              items: cartItems || []
            };
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        const typedToken = token as Token;
        session.user.id = typedToken.id;
        session.user.email = typedToken.email;
        session.user.name = typedToken.name;
        session.user.isAdmin = typedToken.isAdmin;
        session.user.cartId = typedToken.cartId;
        session.user.cart = typedToken.cart;
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