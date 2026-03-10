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
import ComplianceReportCards from "./ComplianceReportCards";

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

  // Check if there are any streaming responses
  const hasResponses = (card.toolResponses && card.toolResponses.length > 0) || 
                       (card.finalResponses && card.finalResponses.length > 0) ||
                       (card.finalResponse);

  console.log("AgentMessage Rendered for agent:", card.finalResponses, card.toolResponses, "Streaming:", card.streaming);
  
  const lowerInput = card.prompt?.toLowerCase() || "";
  
  // Extract agent mention (e.g., @complianceagent, @summaryagent, @riskagent)
  const agentMatch = card.prompt?.match(/@(\w+)/);
  const agentName = agentMatch ? agentMatch[0] : ''; // Full mention with @
  const agentNameWithoutAt = agentMatch ? agentMatch[1] : ''; // Just the name without @ 
  
  // Check if the question is asking for summary of findings
  const isSummaryRequest = lowerInput.includes("summary of findings") ||
                          lowerInput.includes("summarize the findings") ||
                          lowerInput.includes("what are the findings") ||
                          lowerInput.includes("can you summarize the findings") ||
                          lowerInput.includes("give me a summary of the findings");

  // Helper function to check if content is null or "null" string
  const isContentNull = (response: any) => {
    return !response || 
           response.content === null || 
           response.content === "null" || 
           response.content === undefined;
  };

  // Helper function to render response content
  const renderResponseContent = (response: any, index: number, type: 'tool' | 'final') => {
    if (!response) return null;

    // Handle null content
    if (isContentNull(response)) {
      return;
    }

    // Render normal content
    return (
      <Box key={`${type}-${index}`} sx={{ mb: 3 }}>
        {response.timestamp && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {response.timestamp}
          </Typography>
        )}
        <ToolResponseRenderer data={response} />
      </Box>
    );
  };

  // Render streaming indicator at the bottom
  const renderStreamingIndicator = () => {
    if (!showStreamingIndicator) return null;

    return (
      <Paper
        sx={{
          p: 2,
          mt: 3,
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
               card.agent === "approvals" ? "Summary Agent" : "Risk Agent"} is preparing more responses...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hasResponses ? 'Receiving additional data' : 'Initializing response'} ⚡
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box>
      {/* Prompt Message */}
      {card.prompt && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: getAgentColor(card.agent), width: 28, height: 28 }}>
            {getAgentIcon(card.agent)}
          </Avatar>
          <Paper sx={{ mb: 3, p: 2, bgcolor: alpha(getAgentColor(card.agent), 0.05) }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {card.prompt.split(/(@\w+)/g).map((part, index) => {
                // Check if the part is an agent mention (starts with @)
                if (part.startsWith('@')) {
                  return (
                    <Box
                      component="span"
                      key={index}
                      sx={{
                        color: getAgentColor(card.agent),
                        fontWeight: 600,
                        px: 0.5,
                        borderRadius: 0.5,
                        display: 'inline-block'
                      }}
                    >
                      {part}
                    </Box>
                  );
                }
                return part;
              })}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Stream Steps */}
      {/* <StreamSteps card={card} /> */}

      {isSummaryRequest ? (
        <ComplianceReportCards someProp={agentNameWithoutAt} />
      ) : (
        <>
          {/* Tool Responses */}
          {card.toolResponses && card.toolResponses.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'warning.main' }}>
                Tool Responses {showStreamingIndicator ? '(Receiving...)' : ''} ({card.toolResponses.length})
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
                  {renderResponseContent(response, index, 'tool')}
                </Box>
              ))}
            </Box>
          )}

          {/* Final Responses */}
          {card.finalResponses && card.finalResponses.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                {showStreamingIndicator ? 'Streaming Responses (Live)' : 'Final Results'} ({card.finalResponses.length})
              </Typography>
              {card.finalResponses.map((response, index) => (
                <Box key={`final-${index}`}>
                  {renderResponseContent(response, index, 'final')}
                </Box>
              ))}
            </Box>
          )}

          {/* Keep backward compatibility for single finalResponse */}
          {!card.finalResponses && card.finalResponse && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                Final Result {showStreamingIndicator ? '(Updating...)' : ''}
              </Typography>
              {renderResponseContent(card.finalResponse, 0, 'final')}
            </Box>
          )}

          {/* Streaming Indicator - Always shown at the bottom when streaming */}
          {renderStreamingIndicator()}
        </>
      )}  
    </Box>
  );
};

export default AgentMessage;