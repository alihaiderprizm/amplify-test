import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserByVerifiedAccessToken } from './utils';
import { User } from './types';

/**
 * Retrieves the authenticated user from the current session.
 * This function verifies both the session and the access token.
 * 
 * @returns Promise<User | null> - The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUserFromSession(): Promise<User | null> {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error('No session found');
      return null;
    }

    // Extract the access token from the session
    const accessToken = session.accessToken;
    if (!accessToken) {
      console.error('No access token found in session');
      return null;
    }

    // Verify the access token and get the user
    const user = await getUserByVerifiedAccessToken(accessToken);
    if (!user) {
      console.error('User not found for the provided access token');
      return null;
    }

    console.log('Successfully authenticated user:', user.email);
    return user;
  } catch (error) {
    console.error('Error in getAuthenticatedUserFromSession:', error);
    return null;
  }
} 