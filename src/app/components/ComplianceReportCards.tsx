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

interface ComplianceReportCardsProps {
  someProp?: string;
}

export default function ComplianceReportCards({ someProp }: ComplianceReportCardsProps) {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Audit Checklist */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Audit Checklist & Evidence Summary
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2">Coverage:</Typography>
              <Chip 
                label="12 / 15 found" 
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                <Typography variant="body2">Training Records</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                <Typography variant="body2">Incident Reports</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                <Typography variant="body2" color="error">Safety Inspection Log - Missing</Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small">View Pack</Button>
              <Button variant="outlined" size="small" color="error">Missing Items</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Evidence Pack Index */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Evidence Pack Index
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
              <Button variant="contained" size="small">Request Approval</Button>
              <Button variant="outlined" size="small">View Report</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Draft Compliance Report */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Draft Compliance Report
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon sx={{ color: theme.palette.warning.main }} />
              <Typography variant="body2">
                <strong>Rating:</strong> Amber
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>Findings:</strong> Training Gaps, Incomplete Logs
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
              <Typography variant="body2">
                <strong>Action:</strong> CAPA Draft Ready
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}