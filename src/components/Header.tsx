'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { ShoppingCart, Person, Login, Logout } from '@mui/icons-material';
import { Badge, IconButton, Button, Box, Typography, Menu, MenuItem, Avatar } from '@mui/material';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Link from 'next/link';

export default function Header() {
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const cartCount = useSelector((state: RootState) => state.user.cartCount);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          E-Commerce
        </Typography>
      </Link>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link href="/cart">
          <IconButton color="inherit">
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Link>

        {status === 'authenticated' ? (
          <>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {session.user?.image ? (
                <Avatar src={session.user.image} sx={{ width: 32, height: 32 }} />
              ) : (
                <Person />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <Typography variant="body2">{session.user?.name}</Typography>
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                signOut();
              }}>
                <Logout sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            color="inherit"
            startIcon={<Login />}
            onClick={() => signIn()}
          >
            Sign In
          </Button>
        )}
      </Box>
    </Box>
  );
} 