'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  agent?: 'compliance' | 'approvals' | 'tower';
  content: string;
  timestamp: Date;
  response?: React.ReactNode;
}

export default function ChatInterface() {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome to Crystal Clean AI Tower. Mention @ComplianceAgent, @ApprovalsAgent, or @TowerAgent to get started.',
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const lowerInput = inputValue.toLowerCase();
    
    if (lowerInput.includes('@complianceagent')) {
      setTimeout(() => {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          agent: 'compliance',
          content: 'Running compliance report for Site A...',
          timestamp: new Date(),
          response: <ComplianceReport />,
        };
        setMessages(prev => [...prev, agentMessage]);
      }, 1000);
    }
    
    if (lowerInput.includes('@approvalsagent')) {
      setTimeout(() => {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          agent: 'approvals',
          content: 'Reviewing approval requests...',
          timestamp: new Date(),
          response: <ApprovalsResponse />,
        };
        setMessages(prev => [...prev, agentMessage]);
      }, 1000);
    }
    
    if (lowerInput.includes('@toweragent')) {
      setTimeout(() => {
        const agentMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          agent: 'tower',
          content: 'Here are the current red sites and issues:',
          timestamp: new Date(),
          response: <TowerResponse />,
        };
        setMessages(prev => [...prev, agentMessage]);
      }, 1000);
    }

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentColor = (agent?: string) => {
    switch(agent) {
      case 'compliance': return theme.palette.primary.main;
      case 'approvals': return theme.palette.success.main;
      case 'tower': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  const getAgentIcon = (agent?: string) => {
    switch(agent) {
      case 'compliance': return <AssignmentIcon />;
      case 'approvals': return <CheckCircleIcon />;
      case 'tower': return <SecurityIcon />;
      default: return <BotIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ 
        height: 400, 
        overflow: 'auto', 
        p: 2,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        borderRadius: 1,
        mb: 2,
      }}>
        {messages.map((message) => (
          <Box key={message.id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            {message.type !== 'user' && (
              <Avatar sx={{ 
                bgcolor: message.type === 'system' ? theme.palette.grey[500] : getAgentColor(message.agent),
                width: 32,
                height: 32,
              }}>
                {message.type === 'system' ? <BotIcon sx={{ fontSize: 20 }} /> : getAgentIcon(message.agent)}
              </Avatar>
            )}
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>
                  {message.type === 'user' ? 'You' : 
                   message.type === 'system' ? 'System' :
                   message.agent === 'compliance' ? 'Compliance Agent' :
                   message.agent === 'approvals' ? 'Approvals Agent' : 'Tower Agent'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              
              <Paper sx={{
                p: 1.5,
                bgcolor: message.type === 'user' ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                border: message.type === 'agent' ? `1px solid ${alpha(getAgentColor(message.agent), 0.3)}` : 'none',
                borderRadius: 2,
              }}>
                <Typography variant="body2" sx={{ mb: message.response ? 1.5 : 0 }}>
                  {message.content}
                </Typography>
                {message.response}
              </Paper>
            </Box>

            {message.type === 'user' && (
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                <PersonIcon sx={{ fontSize: 20 }} />
              </Avatar>
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
          />
          <IconButton color="primary" onClick={handleSendMessage} sx={{ alignSelf: 'flex-end' }}>
            <SendIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip label="@ComplianceAgent" size="small" onClick={() => setInputValue('@ComplianceAgent ')} />
          <Chip label="@ApprovalsAgent" size="small" onClick={() => setInputValue('@ApprovalsAgent ')} />
          <Chip label="@TowerAgent" size="small" onClick={() => setInputValue('@TowerAgent ')} />
        </Box>
      </Box>
    </Box>
  );
}

// Compliance Report Component
function ComplianceReport() {
  const theme = useTheme();
  
  return (
    <Box sx={{ mt: 1 }}>
      <Paper sx={{ p: 1.5, mb: 1.5 }}>
        <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
          Audit Checklist & Evidence Summary
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption">Coverage:</Typography>
          <Chip label="12/15 found" size="small" sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.625rem' } }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 14 }} />
          <Typography variant="caption">Training Records</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 14 }} />
          <Typography variant="caption">Incident Reports</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 14 }} />
          <Typography variant="caption" color="error">Safety Inspection Log - Missing</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 1.5, mb: 1.5 }}>
        <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
          Evidence Pack Index
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 14 }} />
          <Typography variant="caption">Found: SOP Acknowledgement</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 14 }} />
          <Typography variant="caption" color="error">Missing: Safety Inspection Log (Week 3)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AssignmentIcon sx={{ color: theme.palette.info.main, fontSize: 14 }} />
          <Typography variant="caption"><strong>Action:</strong> CAPA Draft Ready</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 1.5 }}>
        <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
          Draft Compliance Report
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 14 }} />
          <Typography variant="caption"><strong>Rating:</strong> Amber</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 14 }} />
          <Typography variant="caption"><strong>Findings:</strong> Training Gaps, Incomplete Logs</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AssignmentIcon sx={{ color: theme.palette.info.main, fontSize: 14 }} />
          <Typography variant="caption"><strong>Action:</strong> CAPA Draft Ready</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// Approvals Response Component
function ApprovalsResponse() {
  const theme = useTheme();
  
  return (
    <Box sx={{ mt: 1 }}>
      <Paper sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
        <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.success.main }} display="block" gutterBottom>
          Approval Request Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip label="Report v1" size="small" sx={{ height: 20 }} />
          <Typography variant="caption">Pending Review</Typography>
        </Box>
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          <strong>Training Record Issue:</strong> Confirmed
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" variant="contained" color="success" sx={{ fontSize: '0.625rem' }}>Approve</Button>
          <Button size="small" variant="outlined" color="error" sx={{ fontSize: '0.625rem' }}>Reject</Button>
        </Box>
      </Paper>
    </Box>
  );
}

// Tower Response Component
function TowerResponse() {
  const theme = useTheme();
  
  return (
    <Box sx={{ mt: 1 }}>
      <Paper sx={{ p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
        <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.warning.main }} display="block" gutterBottom>
          Red Sites: 2
        </Typography>
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <Card variant="outlined" sx={{ borderColor: theme.palette.error.main }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" color="error" fontWeight={600}>🔴 Site A</Typography>
                <Typography variant="caption" display="block">Training Gap</Typography>
                <Typography variant="caption" display="block">Missing Logs</Typography>
              </CardContent>
            </Card>
          </Grid>
           <Grid size={{ xs: 6 }}>
            <Card variant="outlined" sx={{ borderColor: theme.palette.error.main }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" color="error" fontWeight={600}>🔴 Site D</Typography>
                <Typography variant="caption" display="block">Critical Patches</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}