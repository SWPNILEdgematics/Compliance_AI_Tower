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
// Tower Cards Component
export default function TowerCards() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Tower Overview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Tower Overview
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Chip 
                label="🔴 Red Sites: 2" 
                sx={{ 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 600,
                }}
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderColor: theme.palette.error.main }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="error" gutterBottom>🔴 Site A</Typography>
                    <Typography variant="body2">Training Gap</Typography>
                    <Typography variant="body2">Missing Inspection Logs</Typography>
                    <Typography variant="body2">Overdue CAPA</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderColor: theme.palette.error.main }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="error" gutterBottom>🔴 Site D</Typography>
                    <Typography variant="body2">Critical Patches Missing</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Red Sites Summary */}
      <Grid item xs={12} md={6}>
        <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.error.main }}>
              Red Sites Summary
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="error">🔴 Site A</Typography>
                <Typography variant="body2">• Training Gap</Typography>
                <Typography variant="body2">• Missing Inspection Logs</Typography>
                <Typography variant="body2">• Overdue CAPA</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="error">🔴 Site D</Typography>
                <Typography variant="body2">• Critical Patches Missing</Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" color="error" size="small">View Details</Button>
              <Button variant="outlined" color="error" size="small">Review Changes</Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}