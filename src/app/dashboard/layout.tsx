'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Paper,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { TokenService } from '@/lib/api-client';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { logout: authLogout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Policy Violations', icon: <AssignmentIcon />, path: '/policy-violations' },
    { text: 'Security', icon: <SecurityIcon />, path: '/security' },
  ];

  const chatUsers = [
    { name: 'Mark', active: true, avatar: 'M', lastMessage: 'Hey, can you check...' },
    { name: 'Sandeep', active: false, avatar: 'S', lastMessage: 'Compliance report ready' },
    { name: 'Jon', active: true, avatar: 'J', lastMessage: 'Thanks for the update' },
  ];

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call logout API
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear tokens from storage
      TokenService.clearTokens();
      
      // Update auth context
      authLogout();
      
      // Close dialog
      setLogoutDialogOpen(false);
      setIsLoggingOut(false);
      
      // Redirect to login page
      router.push('/');
    }
  };

  const drawer = (
    <Box sx={{ 
      overflow: 'auto', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'sidebar.background',
      color: 'sidebar.text',
    }}>
      <Toolbar sx={{ justifyContent: 'center', py: 3 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px' }}>
          Crystal Clean AI
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'sidebar.border' }} />
      
      {/* Main Menu */}
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              onClick={() => router.push(item.path)}
              sx={{
                borderRadius: '8px',
                color: 'sidebar.text',
                '&:hover': {
                  bgcolor: 'sidebar.hover',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'sidebar.text', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ borderColor: 'sidebar.border' }} />
      
      {/* All Chats Section */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="overline" sx={{ color: alpha('#fff', 0.5), fontWeight: 600 }}>
          ALL CHATS
        </Typography>
      </Box>
      
      <List sx={{ px: 2 }}>
        {chatUsers.map((user) => (
          <ListItem key={user.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              sx={{
                borderRadius: '8px',
                color: 'sidebar.text',
                '&:hover': {
                  bgcolor: 'sidebar.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Badge
                  color="success"
                  variant="dot"
                  invisible={!user.active}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: user.active ? theme.palette.primary.main : '#6b7280' }}>
                    {user.avatar}
                  </Avatar>
                </Badge>
              </ListItemIcon>
              <ListItemText 
                primary={user.name} 
                secondary={""}
                secondaryTypographyProps={{
                  sx: { color: alpha('#fff', 0.5), fontSize: '0.75rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              borderRadius: '8px',
              color: 'sidebar.text',
              '&:hover': {
                bgcolor: 'sidebar.hover',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'sidebar.text', minWidth: 40 }}>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText primary="Chat" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ borderColor: 'sidebar.border' }} />
      
      {/* Bottom Menu */}
      <List sx={{ px: 2, py: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            sx={{
              borderRadius: '8px',
              color: 'sidebar.text',
              '&:hover': {
                bgcolor: 'sidebar.hover',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'sidebar.text', minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogoutClick}
            sx={{
              borderRadius: '8px',
              color: 'sidebar.text',
              '&:hover': {
                bgcolor: 'sidebar.hover',
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <ListItemIcon sx={{ color: 'sidebar.text', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Dark Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'sidebar.background',
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}>
        {/* Sticky Header */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            m: 0,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="h6"></Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>U</Avatar>
          </Box>
        </Paper>

        {/* Scrollable Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 3,
        }}>
          {children}
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to log out? You will need to login again to access the dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleLogoutCancel} 
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLogoutConfirm} 
            color="error" 
            variant="contained"
            disabled={isLoggingOut}
            startIcon={isLoggingOut ? <CircularProgress size={20} /> : null}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}