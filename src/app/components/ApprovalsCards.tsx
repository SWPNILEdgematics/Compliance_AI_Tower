import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Divider,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

// Tower Cards Component
export default function ApprovalsCards() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.success.main }}>
              Evidence Pack Index - Approval Required
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                <Typography variant="body2">Found: SOP Acknowledgement</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                <Typography variant="body2" color="error">Missing: Safety Inspection Log (Week 3)</Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AssignmentIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
              <Typography variant="body2">
                <strong>Action:</strong> CAPA Draft Ready
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="success" size="small">Approve</Button>
              <Button variant="outlined" color="error" size="small">Reject</Button>
              <Button variant="outlined" size="small">Request Changes</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Approval Queue
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Report v1</strong> - Pending Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted by Compliance Agent
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}