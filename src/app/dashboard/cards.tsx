import { Card, CardContent } from "@mui/material"

 {/* Audit Checklist */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Audit Checklist & Evidence Summary</Typography>
                <Chip 
                  label="12 / 15 found" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    fontWeight: 600,
                  }}
                  size="small"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography variant="body2">Training Records</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography variant="body2">Incident Reports</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                  <Typography variant="body2" color="error">Safety Inspection Log - Missing</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<VisibilityIcon />}>View Pack</Button>
                <Button variant="outlined" size="small" color="error">Missing Items</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Evidence Pack Index */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Evidence Pack Index</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  <Typography variant="body2">Found: SOP Acknowledgement</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                  <Typography variant="body2" color="error">Missing: Safety Inspection Log (Week 3)</Typography>
                </Box>
              </Box>
              
              <Box sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), p: 1.5, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  <strong>Action:</strong> CAPA Draft Ready
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="primary" size="small">Request Approval</Button>
                <Button variant="outlined" size="small">View Report</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Draft Compliance Report */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Draft Compliance Report</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip 
                  label="AMBER" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    fontWeight: 'bold',
                  }}
                  icon={<WarningIcon />}
                />
                <Typography variant="body2" color="text.secondary">Risk Rating</Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Findings:</strong> Training Gaps, Incomplete Logs
                </Typography>
              </Box>
              <Box sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), p: 1.5, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Action:</strong> CAPA Draft Ready
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Approvals Agent */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>✅</Avatar>
                <Typography variant="h6">Approvals Agent</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Approve report v1, confirm training record issue.
              </Typography>
              <Button variant="outlined" color="success" size="small" startIcon={<MessageIcon />}>
                Message Agent
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Alert */}
        <Grid item xs={12}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.error.main}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon sx={{ color: theme.palette.error.main }} />
                <Typography variant="h6" color="error">Security Alert: Zscaler Bypass Detected</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="body2">
                      <strong>Device:</strong> LAP 1042
                    </Typography>
                    <Typography variant="body2">
                      <strong>User:</strong> J***
                    </Typography>
                    <Typography variant="body2">
                      <strong>Site:</strong> Houston
                    </Typography>
                    <Typography variant="body2">
                      <strong>Detected:</strong> 10:14 AM
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    <strong>Risk:</strong> Direct Internet Access - Policy Bypassed
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="error" size="small">Assign Owner</Button>
                  <Button variant="outlined" color="error" size="small">Open Details</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tower Agent - Red Sites */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>🏗️</Avatar>
                <Typography variant="h6">Tower Agent</Typography>
                <Chip 
                  label="Show me Red sites and issues" 
                  variant="outlined" 
                  size="small"
                  icon={<MessageIcon />}
                />
              </Box>
              
              <Typography variant="subtitle1" color="error" gutterBottom sx={{ fontWeight: 600 }}>
                Red Sites: 2
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>Site A</Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        <li><Typography variant="body2">Training Gap</Typography></li>
                        <li><Typography variant="body2">Missing Inspection Logs</Typography></li>
                        <li><Typography variant="body2">Overdue CAPA</Typography></li>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom>Site D</Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        <li><Typography variant="body2">Critical Patches Missing</Typography></li>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>