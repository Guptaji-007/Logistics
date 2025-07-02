"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Avatar, Box, Menu, MenuItem, IconButton,
  ListItemIcon, Divider, Tooltip
} from '@mui/material';
import {
  Logout, Settings
} from '@mui/icons-material';
import AboutIcon from '@mui/icons-material/Info';
import ContactIcon from '@mui/icons-material/ContactMail';
import Link from 'next/link';

export default function AccountMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    handleClose();
    router.push('/');
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {session?.user?.email?.charAt(0).toUpperCase() || "U"}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem><Avatar /> {session?.user?.email}</MenuItem>
        <Divider />

        <Link href="/order-history" passHref>
          <MenuItem><ListItemIcon><AboutIcon fontSize="small" /></ListItemIcon>Order History</MenuItem>
        </Link>
        <Link href="/settings" passHref>
          <MenuItem><ListItemIcon><Settings fontSize="small" /></ListItemIcon>Settings</MenuItem>
        </Link>
        <Link href="/contact" passHref>
          <MenuItem><ListItemIcon><ContactIcon fontSize="small" /></ListItemIcon>Contact</MenuItem>
        </Link>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>Logout
        </MenuItem>
      </Menu>
    </>
  );
}
