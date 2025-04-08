'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button, Space } from 'antd';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Todo App
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            ) : session ? (
              <Space>
                <span className="text-gray-600">
                  {session.user?.email}
                </span>
                <Button onClick={() => signOut()}>
                  Sign Out
                </Button>
              </Space>
            ) : (
              <Space>
                <Link href="/auth/login">
                  <Button type="primary">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </Space>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 