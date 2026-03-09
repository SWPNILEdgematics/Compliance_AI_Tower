// components/AgentMessage.tsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import AgentCard from "../../hooks/useConversation";
import StreamSteps from "../components/StreamSteps";
import ToolResponseRenderer from "../components/ToolResponseRenderer";

interface AgentMessageProps {
  card: AgentCard;
  streamingCard: string | null;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ card, streamingCard }) => {
  const theme = useTheme();

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "compliance": return theme.palette.primary.main;
      case "approvals": return theme.palette.success.main;
      case "tower": return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "compliance": return <AssignmentIcon sx={{ fontSize: 16 }} />;
      case "approvals": return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "tower": return <SecurityIcon sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  // Determine if we should show streaming indicator
  const showStreamingIndicator = card.streaming && streamingCard === card.agent;

  // Check if there are any streaming responses (toolResponses or finalResponses during streaming)
  const hasStreamingResponses = (card.toolResponses && card.toolResponses.length > 0) || 
                                (card.finalResponses && card.finalResponses.length > 0);

  return (
    <Box>
      {/* Prompt Message */}
      {card.prompt && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: getAgentColor(card.agent), width: 28, height: 28 }}>
              {getAgentIcon(card.agent)}
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {card.prompt}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {card.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Stream Steps */}
      <StreamSteps card={card} />

      {/* Tool Responses */}
      {card.toolResponses && card.toolResponses.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'warning.main' }}>
            Tool Responses {showStreamingIndicator ? '(Streaming)' : ''} ({card.toolResponses.length})
          </Typography>
          {card.toolResponses.map((response, index) => (
            <Box key={`tool-${index}`} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  size="small" 
                  label={response.toolName || 'Tool Response'} 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontSize: '0.7rem',
                    height: 20
                  }} 
                />
                {response.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    {response.timestamp}
                  </Typography>
                )}
              </Box>
              <ToolResponseRenderer data={response} />
            </Box>
          ))}
        </Box>
      )}

      {/* Final Responses */}
      {card.finalResponses && card.finalResponses.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
            {showStreamingIndicator ? 'Streaming Responses' : 'Final Results'} ({card.finalResponses.length})
          </Typography>
          {card.finalResponses.map((response, index) => (
            <Box key={`final-${index}`} sx={{ mb: 3 }}>
              {response.timestamp && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {response.timestamp}
                </Typography>
              )}
              <ToolResponseRenderer data={response} />
            </Box>
          ))}
        </Box>
      )}

      {/* Keep backward compatibility for single finalResponse */}
      {!card.finalResponses && card.finalResponse && !showStreamingIndicator && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
            Final Result
          </Typography>
          <ToolResponseRenderer data={card.finalResponse} />
        </Box>
      )}

      {/* Streaming Indicator - Only show if actively streaming AND no responses yet */}
      {showStreamingIndicator && !hasStreamingResponses && (
        <Paper
          sx={{
            p: 2,
            mt: 2,
            bgcolor: alpha(getAgentColor(card.agent), 0.05),
            border: `1px solid ${alpha(getAgentColor(card.agent), 0.3)}`,
            borderRadius: 2,
            animation: "pulse 1.5s infinite",
            "@keyframes pulse": {
              "0%": { opacity: 0.6 },
              "50%": { opacity: 1 },
              "100%": { opacity: 0.6 },
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: getAgentColor(card.agent), width: 32, height: 32 }}>
              {getAgentIcon(card.agent)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ color: getAgentColor(card.agent) }}>
                {card.agent === "compliance" ? "Compliance Agent" :
                 card.agent === "approvals" ? "Approvals Agent" : "Tower Agent"} is thinking...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Preparing response ⚡
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AgentMessage;