import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

interface SecurityAlertProps {
  onAcknowledge?: () => void;
  onAssign?: () => void;
  onOpenDetails?: () => void;
}

export default function SecurityAlert({ onAcknowledge, onAssign, onOpenDetails }: SecurityAlertProps) {
  const theme = useTheme();
  
  return (
    <Paper sx={{ 
      p: 2, 
      borderLeft: `4px solid ${theme.palette.error.main}`,
      bgcolor: alpha(theme.palette.error.main, 0.05),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SecurityIcon sx={{ color: theme.palette.error.main }} />
        <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600 }}>
          Security Alert: Zscaler Bypass Detected
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="body2">
          <strong>Device:</strong> LAP 1042
        </Typography>
        <Typography variant="body2">
          <strong>User:</strong> j*****
        </Typography>
        <Typography variant="body2">
          <strong>Site:</strong> Houston
        </Typography>
        <Typography variant="body2">
          <strong>Detected:</strong> 10:14 AM
        </Typography>
      </Box>
      
      <Typography variant="body2" color="error" sx={{ mb: 2 }}>
        <strong>Risk:</strong> Direct Internet Access - Policy Bypassed
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" color="error" size="small" onClick={onAcknowledge}>
          Acknowledge
        </Button>
        <Button variant="outlined" color="error" size="small" onClick={onAssign}>
          Assign Owner
        </Button>
        <Button variant="outlined" size="small" onClick={onOpenDetails}>
          Open Details
        </Button>
      </Box>
    </Paper>
  );
}