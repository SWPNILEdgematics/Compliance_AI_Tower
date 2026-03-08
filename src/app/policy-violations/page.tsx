'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout  from '../dashboard/layout';


export default function PolicyViolationsPage() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <DashboardLayout>
         <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.1) }}>
              <ErrorIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
              <Typography variant="h4" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>2</Typography>
              <Typography variant="body2" color="text.secondary">Critical Violations</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
              <WarningIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h4" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>5</Typography>
              <Typography variant="body2" color="text.secondary">Medium Violations</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
              <PriorityHighIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h4" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>8</Typography>
              <Typography variant="body2" color="text.secondary">Low Violations</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Active Policy Violations
        </Typography>

        <Grid container spacing={3}>
          {/* Security Alert Card */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              bgcolor: alpha(theme.palette.error.main, 0.05),
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon sx={{ color: theme.palette.error.main, fontSize: 32 }} />
                  <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>
                    Security Alert: Zscaler Bypass Detected
                  </Typography>
                  <Chip 
                    label="HIGH" 
                    size="medium"
                    sx={{ 
                      bgcolor: theme.palette.error.main,
                      color: 'white',
                      fontWeight: 600,
                      ml: 'auto',
                    }}
                  />
                </Box>
                
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle2" gutterBottom>Incident Details</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="body2" color="text.secondary">Device</Typography>
                          <Typography variant="body1" fontWeight={600}>LAP 1042</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="body2" color="text.secondary">User</Typography>
                          <Typography variant="body1" fontWeight={600}>j*****</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="body2" color="text.secondary">Site</Typography>
                          <Typography variant="body1" fontWeight={600}>Houston</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Typography variant="body2" color="text.secondary">Detected</Typography>
                          <Typography variant="body1" fontWeight={600}>10:14 AM</Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Risk Description</Typography>
                        <Typography variant="body1" color="error" fontWeight={500}>
                          Direct Internet Access - Policy Bypassed
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>Actions Required</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Button variant="contained" color="error" fullWidth>
                          Assign Owner
                        </Button>
                        <Button variant="outlined" color="error" fullWidth>
                          Open Details
                        </Button>
                        <Button variant="outlined" fullWidth>
                          Acknowledge
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tanium Patch Compliance Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AssignmentIcon sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="h6">Tanium Patch Compliance</Typography>
                  <Chip 
                    label="Investigate" 
                    size="small"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Critical patches missing on 3 servers
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Affected Systems:</Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <li><Typography variant="body2">SRV-PROD-01</Typography></li>
                    <li><Typography variant="body2">SRV-PROD-02</Typography></li>
                    <li><Typography variant="body2">SRV-DEV-01</Typography></li>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button variant="contained" size="small">View Details</Button>
                  <Button variant="outlined" size="small">Start Patching</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Data Privacy Violation Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ErrorIcon sx={{ color: theme.palette.error.main }} />
                  <Typography variant="h6">Data Privacy Violation</Typography>
                  <Chip 
                    label="HIGH" 
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.error.main,
                      color: 'white',
                      ml: 'auto',
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Unauthorized access attempt to sensitive data
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">User</Typography>
                    <Typography variant="body2" fontWeight={600}>john.doe@company.com</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Resource</Typography>
                    <Typography variant="body2" fontWeight={600}>Customer DB</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Time</Typography>
                    <Typography variant="body2" fontWeight={600}>09:45 AM</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body2" fontWeight={600} color="error">Blocked</Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button variant="contained" size="small">Investigate</Button>
                  <Button variant="outlined" size="small">Review Logs</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Access Policy Violation Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="subtitle1" fontWeight={600}>Access Policy Violation</Typography>
                </Box>
                <Chip 
                  label="MEDIUM" 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    mb: 2,
                  }}
                />
                <Typography variant="body2">
                  User 'jsmith' attempted to access restricted folder
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Firewall Policy Violation Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="subtitle1" fontWeight={600}>Firewall Policy Violation</Typography>
                </Box>
                <Chip 
                  label="MEDIUM" 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    mb: 2,
                  }}
                />
                <Typography variant="body2">
                  Outbound connection to unauthorized IP
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Policy Violation Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PriorityHighIcon sx={{ color: theme.palette.info.main }} />
                  <Typography variant="subtitle1" fontWeight={600}>Password Policy Violation</Typography>
                </Box>
                <Chip 
                  label="LOW" 
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    mb: 2,
                  }}
                />
                <Typography variant="body2">
                  5 users have expired passwords
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
     </DashboardLayout>   
   
  );
}