// components/StreamSteps.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  SmartToy as SmartToyIcon,
  PlayArrow as PlayArrowIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { AgentCard } from "@/hooks/useConversation";

interface StreamStepsProps {
  card: AgentCard;
}

const StreamSteps: React.FC<StreamStepsProps> = ({ card }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const steps = card.streamData?.steps || [];
  if (steps.length === 0) return null;

  const getStepIcon = (title: string) => {
    if (title.includes("Calling")) return <CallMadeIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />;
    if (title.includes("Response")) return <CallReceivedIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />;
    if (title.includes("Thought")) return <SmartToyIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />;
    if (title.includes("Executing")) return <PlayArrowIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />;
    if (title.includes("Error")) return <ErrorIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />;
    return null;
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mt: 2,
        mb: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Agent Execution Steps ({steps.length})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {steps.map((step:any, index:number) => (
          <Box key={index}>
            {index > 0 && <Divider sx={{ my: 1.5 }} />}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStepIcon(step.title)}
                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                  {step.title}
                </Typography>
                {step.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    {step.timestamp}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3.5 }}>
                {step.description}
              </Typography>

              {step.toolArgs && (
                <Paper variant="outlined" sx={{ ml: 3.5, p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {JSON.stringify(step.toolArgs, null, 2)}
                  </pre>
                </Paper>
              )}

              {step.toolResponse && (
                <Paper variant="outlined" sx={{ ml: 3.5, p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <Typography variant="caption" color="success.main" sx={{ display: "block", mb: 1 }}>
                    Response:
                  </Typography>
                  <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {typeof step.toolResponse === "string"
                      ? step.toolResponse
                      : JSON.stringify(step.toolResponse, null, 2)}
                  </pre>
                </Paper>
              )}
            </Box>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default StreamSteps;