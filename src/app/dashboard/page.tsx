// app/dashboard/page.tsx (simplified version)
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Avatar,
  useTheme,
  alpha,
  Paper,
  Grid,
  Button,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useConversation, Agent } from "@/hooks/useConversation";
import { useStream } from "@/hooks/useStream";
import { useStreamHandler } from "@/hooks/useStreamHandler";
import AgentMessage from "../components/AgentMessage";
import { agents } from "../config/agents";

export default function DashboardPage() {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const { isLoading, isAuthenticated } = useProtectedRoute();
  
  // State
  const [inputValue, setInputValue] = useState("");
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Custom hooks
  const {
    activeCards,
    setActiveCards,
    isTyping,
    streamingCard,
    setStreamingCard,
    sendMessage,
    clearConversation,
  } = useConversation(agents);

  const { connectToStream, abortAllStreams } = useStream();
  
  const {
    handleAgentThought,
    handleToolCall,
    handleToolResult,
    handleEndResponse,
  } = useStreamHandler(setActiveCards, setStreamingCard, () => {});

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      abortAllStreams();
    };
  }, [abortAllStreams]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      const { runId, cardId, mentionedAgent } = await sendMessage(inputValue);
      
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found");

      // Connect to stream
      connectToStream(
        runId,
        accessToken,
        (message) => handleStreamMessage(message, cardId, mentionedAgent.id),
        (error) => handleStreamError(error, cardId),
        () => handleStreamClose(cardId)
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInputValue("");
  };

  const handleStreamMessage = (message: any, cardId: string, agentId: string) => {
    const { step, data, status, run_type } = message;

    switch (run_type) {
      case "<AGENT>":
        switch (status) {
          case "<INPROGRESS>":
            if (step === "AGENTTHOUGHT") {
              handleAgentThought(cardId, typeof data === "string" ? data : data?.content);
            } else if (step === "TOOLCALL") {
              handleToolCall(cardId, data);
            } else if (step === "TOOLCALLRESULT") {
              handleToolResult(cardId, data);
            }
            break;

          case "<END_RESPONSE>":
            handleEndResponse(cardId, data, agentId, () => {});
            break;
        }
        break;

      // Add other run_type handlers as needed
    }
  };

  const handleStreamError = (error: any, cardId: string) => {
    console.error("Stream error:", error);
    setActiveCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, streaming: false } : card
      )
    );
    setStreamingCard(null);
  };

  const handleStreamClose = (cardId: string) => {
    console.log("Stream closed for card:", cardId);
  };

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setInputValue(value);
    setCursorPosition(position);

    // Show agent menu when @ is typed
    const lastAtSymbol = value.lastIndexOf("@", position - 1);
    if (lastAtSymbol !== -1 && !value.slice(lastAtSymbol + 1, position).includes(" ")) {
      setShowAgentMenu(true);
    } else {
      setShowAgentMenu(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    const lastAtSymbol = inputValue.lastIndexOf("@", cursorPosition - 1);
    const newValue =
      inputValue.substring(0, lastAtSymbol) +
      `@${agent.name} ` +
      inputValue.substring(cursorPosition);
    
    setInputValue(newValue);
    setShowAgentMenu(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const lastAtSymbol = inputValue.lastIndexOf("@", cursorPosition - 1);
    if (lastAtSymbol === -1) return false;
    const searchText = inputValue.slice(lastAtSymbol + 1, cursorPosition).toLowerCase();
    return agent.name.toLowerCase().includes(searchText);
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: theme.palette.background.default }}>
      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        <Container maxWidth="xl">
          {activeCards.length > 0 && (
            <Grid container spacing={3}>
              {activeCards.map((card) => (
                <Grid size={{ xs: 12 }} key={card.id}>
                  <AgentMessage card={card} streamingCard={streamingCard} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Input Section */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          position: "sticky",
          bottom: 0,
          zIndex: 1100,
        }}
        ref={menuAnchorRef}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Type @ to mention an agent..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              inputRef={inputRef}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              Send
            </Button>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Button variant="contained" color="secondary" onClick={clearConversation}>
              Start New Conversation
            </Button>
          </Box>

          {/* Agent Menu */}
          {showAgentMenu && filteredAgents.length > 0 && (
            <Popper open={showAgentMenu} anchorEl={menuAnchorRef.current} placement="top-start" transition>
              {({ TransitionProps }) => (
                <Fade {...TransitionProps}>
                  <Paper elevation={4}>
                    <ClickAwayListener onClickAway={() => setShowAgentMenu(false)}>
                      <MenuList>
                        {filteredAgents.map((agent) => (
                          <MenuItem key={agent.id} onClick={() => handleAgentSelect(agent)}>
                            <ListItemIcon sx={{ color: agent.color }}>{agent.icon}</ListItemIcon>
                            <ListItemText primary={`@${agent.name}`} secondary={agent.description} />
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Fade>
              )}
            </Popper>
          )}
        </Container>
      </Paper>
    </Box>
  );
}