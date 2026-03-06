'use client';

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useLogin } from '@/hooks/useLogin';

export default function LoginPage() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const loginMutation = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            bgcolor: alpha(theme.palette.background.paper, 0.95),
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
            Crystal Clean AI
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            Enterprise Compliance & Security
          </Typography>

          {/* Error Alert */}
          {loginMutation.isError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {loginMutation.error?.response?.data?.message || 'Login failed. Please try again.'}
            </Alert>
          )}

          {/* License Warning */}
          {loginMutation.data?.licenseWarning && (
            <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
              {loginMutation.data.licenseWarning}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loginMutation.isPending}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loginMutation.isPending}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loginMutation.isPending}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                position: 'relative',
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      ml: -1.5,
                    }}
                  />
                  <span style={{ opacity: 0 }}>Sign In</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}