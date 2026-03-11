"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
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
  Chip,
} from "@mui/material";

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
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Refs
  const cleanupRef = useRef<(() => void) | null>(null);

  // Custom hooks
  const {
    activeCards,
    setActiveCards,
    isTyping,
    setIsTyping,
    streamingCard,
    setStreamingCard,
    sendMessage,
    clearConversation,
  } = useConversation(agents);

  const { connectToStream, abortStream, parseToolResponse } = useStream();
  
  const {
    handleAgentThought,
    handleToolCall,
    handleToolResult,
    handleEndResponse,
  } = useStreamHandler(
    setActiveCards,
    setStreamingCard,
    setIsTyping,
    parseToolResponse
  );
  
  const handleStreamMessage = useCallback((message: any, cardId: string, agentId: string) => {
    const { step, data, status, run_type } = message;
    let finalResponseData = data?.content?.response || data?.content || data;
    
    switch (run_type) {
      case "<AGENT>":
        switch (status) {
          case "<INPROGRESS>":
            if (step === "AGENTTHOUGHT" && data) {
              const thoughtContent = typeof data === "string" ? data : data?.content;
              if (thoughtContent) {
                handleAgentThought(cardId, thoughtContent);
              }
            } else if (step === "TOOLCALL" && data) {
              handleToolCall(cardId, data);
            } else if (step === "TOOLCALLRESULT" && data) {
              handleToolResult(cardId, data);
            }
            break;

          case "<END_RESPONSE>":
            if (data) {
              handleEndResponse(cardId, finalResponseData, agentId, () => {}, false);
            }
            break;
          
          case "<CLOSED>":
            console.log("Stream properly closed for card:", cardId);
            handleEndResponse(cardId, null, agentId, () => {}, true);
            setActiveRunId(null);
            cleanupRef.current = null; // Clear cleanup ref
            break;
            
          case "<ERROR>":
            console.error("Agent error:", message.error);
            handleStreamError(message.error, cardId);
            break;
        }
        break;
        
      case "<WORKFLOW>":
      case "<CUSTOM_WORKFLOW>":
        console.log("Workflow message:", message);
        break;
        
      default:
        console.log("Unknown message type:", run_type);
    }
  }, [handleAgentThought, handleToolCall, handleToolResult, handleEndResponse]);

  const handleStreamError = useCallback((error: any, cardId: string) => {
    console.error("Stream error:", error);
    setActiveCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, streaming: false } : card
      )
    );
    setStreamingCard(null);
    setIsTyping(false);
    setActiveRunId(null);
    cleanupRef.current = null; // Clear cleanup ref
  }, [setActiveCards, setStreamingCard, setIsTyping]);

  const handleStreamClose = useCallback((cardId: string, agentId: string) => {
    console.log("Stream closed for card:", cardId);
    handleEndResponse(cardId, null, agentId, () => {}, true);
    setActiveRunId(null);
    cleanupRef.current = null; // Clear cleanup ref
  }, [handleEndResponse]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      // Abort any existing stream before starting a new one
      if (activeRunId) {
        console.log("Aborting existing stream:", activeRunId);
        abortStream(activeRunId);
        setActiveRunId(null);
      }

      // Clear any existing cleanup ref
      if (cleanupRef.current) {
        cleanupRef.current = null;
      }

      const { runId, cardId, mentionedAgent } = await sendMessage(inputValue);
      
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token found");
      if (!runId) throw new Error("No run ID returned");

      // Set the active runId
      setActiveRunId(runId);

      // Connect to stream - only ONE connection
      const cleanup = connectToStream(
        runId,
        accessToken,
        (message) => handleStreamMessage(message, cardId, mentionedAgent.id),
        (error) => handleStreamError(error, cardId),
        () => handleStreamClose(cardId, mentionedAgent.id)
      );

      // Store cleanup function in ref for later use
      cleanupRef.current = cleanup;

      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      setActiveRunId(null);
      cleanupRef.current = null;
    }
  };

  // Manual cleanup function (can be called from UI if needed)
  const handleManualCleanup = useCallback(() => {
    if (cleanupRef.current) {
      console.log("Manually cleaning up stream");
      cleanupRef.current();
      cleanupRef.current = null;
      setActiveRunId(null);
    } else if (activeRunId) {
      console.log("Fallback: aborting stream by runId");
      abortStream(activeRunId);
      setActiveRunId(null);
    }
  }, [activeRunId, abortStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use cleanup ref if available, otherwise fallback to abortStream
      if (cleanupRef.current) {
        console.log("Cleaning up stream via cleanup ref on unmount");
        cleanupRef.current();
        cleanupRef.current = null;
      } else if (activeRunId) {
        console.log("Cleaning up stream via abortStream on unmount:", activeRunId);
        abortStream(activeRunId);
      }
    };
  }, [activeRunId, abortStream]);

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setInputValue(value);
    setCursorPosition(position);

    // Show agent menu when @ is typed
    const lastAtSymbol = value.lastIndexOf("@", position - 1);
    if (lastAtSymbol !== -1) {
      const textAfterAt = value.slice(lastAtSymbol + 1, position);
      if (!textAfterAt.includes(" ")) {
        setShowAgentMenu(true);
      } else {
        setShowAgentMenu(false);
      }
    } else {
      setShowAgentMenu(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    const lastAtSymbol = inputValue.lastIndexOf("@", cursorPosition - 1);
    
    if (lastAtSymbol !== -1) {
      const newValue =
        inputValue.substring(0, lastAtSymbol) +
        `@${agent.name} ` +
        inputValue.substring(cursorPosition);
      setInputValue(newValue);
    } else {
      setInputValue(inputValue + ` @${agent.name} `);
    }
    
    setShowAgentMenu(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = useCallback(() => {
    // Abort any active stream
    if (cleanupRef.current) {
      console.log("Cleaning up stream before clearing conversation");
      cleanupRef.current();
      cleanupRef.current = null;
    } else if (activeRunId) {
      console.log("Aborting stream before clearing conversation:", activeRunId);
      abortStream(activeRunId);
    }
    setActiveRunId(null);
    clearConversation();
  }, [activeRunId, abortStream, clearConversation]);

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
    <Box sx={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column", 
      bgcolor: theme.palette.background.default,
      overflow: "hidden",
    }}>
      {/* Main Content - Scrollable Area */}
      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        <Container maxWidth="xl">
          {activeCards.length === 0 ? (
            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              height: "50vh",
              flexDirection: "column",
              gap: 2,
            }}>
              <Typography variant="h5" color="text.secondary">
                Welcome to Compliance AI Agent Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Type @ to mention an agent and start a conversation
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {activeCards.map((card) => (
                <Grid size={{ xs: 12 }} key={card.id}>
                  <AgentMessage card={card} streamingCard={streamingCard} />
                </Grid>
              ))}
            </Grid>
          )}
          
          {isTyping && !streamingCard && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), maxWidth: 200 }}>
              <Typography variant="body2" color="text.secondary">
                AI Assistant is gathering information...
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>

      {/* Input Section - Sticky at Bottom */}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Agent Chips */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  size="small"
                  variant="outlined"
                  startIcon={agent.icon}
                  onClick={() => setInputValue(prev => prev + `@${agent.name} `)}
                  sx={{
                    borderColor: agent.color,
                    color: agent.color,
                    '&:hover': {
                      borderColor: agent.color,
                      bgcolor: alpha(agent.color, 0.1),
                    }
                  }}
                >
                  @{agent.name}
                </Button>
              ))}
            </Box>

            {/* Input Row with Stop Button */}
            <Box sx={{ position: "relative", display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type @ to mention an agent..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                inputRef={inputRef}
                disabled={!!activeRunId} // Disable input while streaming
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  },
                }}
              />
              {activeRunId ? (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleManualCleanup}
                  sx={{
                    px: 4,
                    "&:hover": { bgcolor: theme.palette.error.dark },
                  }}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: "white",
                    px: 4,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    "&.Mui-disabled": { bgcolor: alpha(theme.palette.primary.main, 0.3) },
                  }}
                >
                  Send
                </Button>
              )}
            </Box>

            {/* New Conversation Button */}
            <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 2 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleClearConversation}
                size="small"
                disabled={activeCards.length === 0}
              >
                Start New Conversation
              </Button>
              
              {/* Show active run indicator */}
              {activeRunId && (
                <Chip 
                  size="small"
                  label="Streaming Active"
                  color="info"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          </Box>

          {/* Agent Menu Popper */}
          {showAgentMenu && filteredAgents.length > 0 && (
            <Popper
              open={showAgentMenu}
              anchorEl={menuAnchorRef.current}
              placement="top-start"
              transition
              sx={{ zIndex: 1300, width: 300 }}
            >
              {({ TransitionProps }) => (
                <Fade {...TransitionProps} timeout={350}>
                  <Paper elevation={4}>
                    <ClickAwayListener onClickAway={() => setShowAgentMenu(false)}>
                      <MenuList>
                        {filteredAgents.map((agent) => (
                          <MenuItem 
                            key={agent.id} 
                            onClick={() => handleAgentSelect(agent)}
                          >
                            <ListItemIcon sx={{ color: agent.color, minWidth: 36 }}>
                              {agent.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={`@${agent.name}`} 
                              secondary={agent.description}
                              primaryTypographyProps={{ sx: { color: agent.color } }}
                            />
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