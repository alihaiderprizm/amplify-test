'use client';

// import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import Navbar from '../components/Navbar';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SessionProvider>
              <Navbar />
              <main className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                  {children}
                </div>
              </main>
            </SessionProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
