import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

export async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const isAdmin = token?.isAdmin;
  // Check if the user is trying to access an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!isAdmin) {
      // Redirect to home if not admin
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (token && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login', '/auth/register'],
}; 