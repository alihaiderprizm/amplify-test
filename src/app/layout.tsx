'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import Header from '@/components/Header';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppBar, Toolbar, Container, Box, Typography } from '@mui/material';

const inter = Inter({ subsets: ['latin'] });

// Create a custom MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// export const metadata: Metadata = {
//   title: 'E-Commerce App',
//   description: 'A modern e-commerce application',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <SessionProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <AntdRegistry>
                  <ConfigProvider
                    theme={{
                      token: {
                        colorPrimary: theme.palette.primary.main,
                        borderRadius: 8,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                      <AppBar position="static" elevation={1}>
                        <Toolbar>
                          <Header />
                        </Toolbar>
                      </AppBar>
                      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                        {children}
                      </Container>
                      <Box
                        component="footer"
                        sx={{
                          py: 3,
                          px: 2,
                          mt: 'auto',
                          backgroundColor: (theme) => theme.palette.grey[100],
                        }}
                      >
                        <Container maxWidth="sm">
                          <Typography variant="body2" color="text.secondary" align="center">
                            © {new Date().getFullYear()} E-Commerce App. All rights reserved.
                          </Typography>
                        </Container>
                      </Box>
                    </Box>
                  </ConfigProvider>
                </AntdRegistry>
              </ThemeProvider>
            </SessionProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
