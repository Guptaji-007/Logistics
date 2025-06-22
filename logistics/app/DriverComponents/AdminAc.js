"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Avatar, Box, Menu, MenuItem, IconButton,
  ListItemIcon, Divider, Tooltip
} from '@mui/material';
import {
  Logout, Settings, Dashboard, SupervisedUserCircle
} from '@mui/icons-material';

export default function AdminAccountMenu() {
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

  // Optional: Hide component if not admin
  if (session?.user?.role !== 'admin') return null;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title="Admin account">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'admin-account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {session?.user?.email?.charAt(0).toUpperCase() || "A"}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="admin-account-menu"
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
        <MenuItem onClick={() => router.push('/admin/FleetReg')}>
          <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
          Join the Fleet
        </MenuItem>
        <MenuItem onClick={() => router.push('/admin/users')}>
          <ListItemIcon><SupervisedUserCircle fontSize="small" /></ListItemIcon>
          Manage Users
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
