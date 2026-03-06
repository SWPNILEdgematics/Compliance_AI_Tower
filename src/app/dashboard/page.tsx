"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Button,
  AppBar,
  Toolbar,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText as MuiListItemText,
} from "@mui/material";
import {
  Send as SendIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  SmartToy as SmartToyIcon,
  PlayArrow as PlayArrowIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
} from "@mui/icons-material";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { CircularProgress } from "@mui/material";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import moment from "moment";
import ComplianceReportCards from "../components/ComplianceReportCards";
import ApprovalsCards from "../components/ApprovalsCards";
import TowerCards from "../components/TowerCards";

interface StreamStep {
  title: string;
  description: string;
  timestamp?: string;
  node_id?: string;
  toolName?: string;
  toolArgs?: any;
  toolResponse?: any;
  expanded?: boolean;
}

interface StreamData {
  icon?: string;
  title?: string;
  description?: string;
  steps: StreamStep[];
}

interface AgentThoughtTool {
  thought: string;
  toolActions: {
    action: string;
    argument: string;
    output: string;
    toolId?: string;
  }[];
}

interface AgentStreamData {
  icon: string;
  title: string;
  agentName: string;
  thoughtsAndtoolsAction: AgentThoughtTool[];
  finalResult: string;
  isOpen: boolean;
}

interface AgentCard {
  id: string;
  agent: 'compliance' | 'approvals' | 'tower';
  title: string;
  timestamp: Date;
  runId?: string;
  convId?: string;
  streamData?: StreamData;
  agentStreamData?: AgentStreamData;
  streaming?: boolean;
  content?: React.ReactNode;
  prompt?: string;
  toolResponseData?: ToolResponseData;
}

interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  agentId: string;
}

// Track active conversations per agent
interface ActiveConversation {
  convId: string;
  createdAt: Date;
  lastUsed: Date;
}

// Add new interface for tool response data
interface ToolResponseData {
  type: 'table' | 'markdown' | 'options' | 'text';
  content: any;
  title?: string;
}

// Helper function to parse and format tool responses
const parseToolResponse = (toolName: string, responseData: any): ToolResponseData => {
  try {
    // Handle direct text responses
    if (typeof responseData === 'string') {
      return {
        type: 'text',
        title: 'Response',
        content: responseData
      };
    }

    // Handle response with text field
    if (responseData?.text) {
      return {
        type: 'text',
        title: 'Response',
        content: responseData.text
      };
    }

    // Handle response with content array (like in AGENTOUTPUT)
    if (responseData?.content?.[0]?.text) {
      return {
        type: 'text',
        title: 'Agent Response',
        content: responseData.content[0].text
      };
    }

    // Handle librarian_agent responses
    if (toolName === 'librarian_agent') {
      const response = responseData?.response;
      if (response?.checklist) {
        // Convert checklist object to table format
        const checklist = response.checklist;
        const keys = Object.keys(checklist);
        const rows = checklist[keys[0]]?.map((_: any, index: number) => {
          const row: any = {};
          keys.forEach(key => {
            row[key] = checklist[key]?.[index] || '';
          });
          return row;
        }) || [];
        
        return {
          type: 'table',
          title: 'Compliance Checklist',
          content: {
            headers: keys,
            rows: rows
          }
        };
      }
    }

    // Handle reporting_agent responses
    if (toolName === 'reporting_agent') {
      const response = responseData?.response;
      if (response?.report_markdown) {
        return {
          type: 'markdown',
          title: 'Audit Report',
          content: response.report_markdown.replace(/\\n/g, '\n') // Fix escaped newlines
        };
      } else if (response) {
        // Fallback to table for other response structures
        return {
          type: 'table',
          title: 'Report Data',
          content: response
        };
      }
    }

    // Handle db_saver_agent responses
    if (toolName === 'db_saver_agent') {
      const response = responseData?.response;
      if (response?.result) {
        return {
          type: 'text',
          title: 'Database Operation Result',
          content: response.result
        };
      }
    }

    // Handle get_findings_from_db responses
    if (toolName === 'get_findings_from_db') {
      const response = responseData?.response;
      if (response?.result) {
        try {
          const findings = JSON.parse(response.result);
          if (Array.isArray(findings) && findings.length > 0) {
            const headers = Object.keys(findings[0]);
            return {
              type: 'table',
              title: 'Findings from Database',
              content: {
                headers: headers,
                rows: findings
              }
            };
          }
        } catch (e) {
          console.error('Error parsing findings JSON:', e);
        }
      }
    }

    // Handle get_user_choice tool (this is a TOOLCALL, not TOOLCALLRESULT)
    // This will be handled separately in the TOOLCALL section

    // Default: return as formatted JSON
    return {
      type: 'text',
      title: 'Response',
      content: JSON.stringify(responseData, null, 2)
    };
  } catch (error) {
    console.error('Error parsing tool response:', error);
    return {
      type: 'text',
      title: 'Error Parsing Response',
      content: 'Unable to parse response data'
    };
  }
};

// Component to render tool response based on type
const ToolResponseRenderer: React.FC<{ data: ToolResponseData }> = ({ data }) => {
  const theme = useTheme();

  if (data.type === 'markdown') {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mt: 2,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          '& pre': {
            backgroundColor: alpha(theme.palette.common.black, 0.05),
            padding: 2,
            borderRadius: 1,
            overflow: 'auto',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            marginY: 2,
          },
          '& th, & td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: 1.5,
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            fontWeight: 600,
          },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.content}
        </ReactMarkdown>
      </Paper>
    );
  }

  if (data.type === 'table') {
    const { headers, rows } = data.content;
    
    if (!headers || !rows || rows.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No table data available
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header: string) => (
                <TableCell key={header} sx={{ fontWeight: 600 }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any, index: number) => (
              <TableRow key={index}>
                {headers.map((header: string) => (
                  <TableCell key={`${index}-${header}`}>
                    {row[header]?.toString() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (data.type === 'options') {
    return (
      <List sx={{ mt: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), p: 2, borderRadius: 1 }}>
        {data.content.map((option: string, index: number) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <MuiListItemText 
              primary={`${index + 1}. ${option}`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    );
  }

  // Default text display
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mt: 2,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {data.content}
    </Paper>
  );
};

export default function DashboardPage() {
  const theme = useTheme();
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [activeCards, setActiveCards] = useState<AgentCard[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [streamingCard, setStreamingCard] = useState<string | null>(null);

  // Add state for expanded accordions per card
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const { isLoading, isAuthenticated } = useProtectedRoute();

  // Track active conversations per agent
  const [activeConversations, setActiveConversations] = useState<
    Map<string, ActiveConversation>
  >(new Map());

  // Refs for streaming
  const assistantStreamingRef = useRef<string>("");
  const actionsRef = useRef<any[]>([]);
  const approvalsRef = useRef<any[]>([]);
  const messageIdRef = useRef<string>("");

  // API constants
  const ORG_ID = "f9f0d317-ce64-4cba-8379-696cfeacbc42";
  const APP_ID = "9aeea00b-ec69-4291-9273-ee287306a331";
  const API_KEY =
    "gAAAAABpadaMNeKS5gsCoJI_KlIswU7RDQKXAUFSE35lwUOKKNzgddxC5mIkQF-8-IbvZXA5SB42lIToSw8_oe84iI3lgTLx2yZ9_VJdBJ54GNei1nn7FVGfqVLRGI8RZ5pEEYzh09Po";

  const agents: Agent[] = [
    {
      id: "compliance",
      name: "ComplianceAgent",
      icon: <AssignmentIcon />,
      color: theme.palette.primary.main,
      description: "Run compliance checks and reports",
      agentId: "afdfe741-fc64-4225-a7af-0dc266b76388",
    },
    {
      id: "approvals",
      name: "ApprovalsAgent",
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      description: "Review and approve requests",
      agentId: "5d851c63-a285-4405-9108-b5ac02b0859e",
    },
    {
      id: "tower",
      name: "TowerAgent",
      icon: <SecurityIcon />,
      color: theme.palette.warning.main,
      description: "Site overview and red sites",
      agentId: "878b09a5-9013-49d5-832c-512b064c5072",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeCards, streamingCard]);

  // Load active conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeConversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const map = new Map();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          map.set(key, {
            ...value,
            createdAt: new Date(value.createdAt),
            lastUsed: new Date(value.lastUsed),
          });
        });
        setActiveConversations(map);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    }
  }, []);

  // Save active conversations to localStorage when they change
  useEffect(() => {
    if (activeConversations.size > 0) {
      const obj = Object.fromEntries(activeConversations);
      localStorage.setItem("activeConversations", JSON.stringify(obj));
    }
  }, [activeConversations]);

  // Toggle accordion for a specific card
  const toggleAccordion = (cardId: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const createConversation = async (agentType: string): Promise<string> => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }
      console.log("Creating conversation for agent:", agentType);

      const response = await fetch(`/api/conv/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ agentType }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create conversation error response:", errorText);
        throw new Error(
          `Failed to create conversation: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Create conversation response:", data);

      if (!data.convId) {
        throw new Error("No convId received from API");
      }

      return data.convId;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  const startChat = async (
    convId: string,
    question: string,
    agentId: string,
    agentType: string,
  ): Promise<string> => {
    try {
      console.log("Calling start chat API with:", {
        convId,
        question,
        agentId,
        agentType,
      });
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          convId,
          question,
          agentId,
          agentType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Start chat API error response:", errorText);
        throw new Error(
          `Failed to start chat: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Start chat API response:", data);

      if (!data.runId) {
        throw new Error("No runId received from API");
      }

      return data.runId;
    } catch (error) {
      console.error("Error starting chat:", error);
      throw error;
    }
  };

  // Get or create conversation for an agent
  const getOrCreateConversation = async (
    agentType: string,
  ): Promise<string> => {
    // Check if we have an active conversation for this agent
    const existing = activeConversations.get(agentType);

    // If exists and is less than 1 hour old, reuse it
    if (existing) {
      const age = moment().diff(moment(existing.lastUsed), "minutes");
      if (age < 60) {
        // Reuse conversations less than 1 hour old
        console.log(
          `Reusing existing conversation ${existing.convId} for ${agentType} (age: ${age} minutes)`,
        );

        // Update last used time
        setActiveConversations((prev) => {
          const updated = new Map(prev);
          updated.set(agentType, {
            ...existing,
            lastUsed: new Date(),
          });
          return updated;
        });

        return existing.convId;
      } else {
        console.log(
          `Conversation for ${agentType} is too old (${age} minutes), creating new one`,
        );
      }
    }

    // Create new conversation
    const convId = await createConversation(agentType);

    // Store it
    setActiveConversations((prev) => {
      const updated = new Map(prev);
      updated.set(agentType, {
        convId,
        createdAt: new Date(),
        lastUsed: new Date(),
      });
      return updated;
    });

    return convId;
  };

  // Clear conversation for an agent (useful if you want to start fresh)
  const clearAgentConversation = (agentType: string) => {
    setActiveConversations((prev) => {
      const updated = new Map(prev);
      updated.delete(agentType);
      return updated;
    });
  };

  const simulateStreaming = (agentId: string, content: React.ReactNode) => {
    setStreamingCard(agentId);

    // Simulate streaming effect
    setTimeout(() => {
      setStreamingCard(null);
      setActiveCards((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          agent: agentId as "compliance" | "approvals" | "tower",
          title:
            agentId === "compliance"
              ? "Compliance Report"
              : agentId === "approvals"
                ? "Approvals Required"
                : "Tower Overview",
          content: content,
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const lowerInput = inputValue.toLowerCase();

    let mentionedAgent = agents.find((agent) =>
      lowerInput.includes(`@${agent.name.toLowerCase()}`),
    );

    if (!mentionedAgent) {
      mentionedAgent = agents[0];
    }

    setIsTyping(true);

    try {
      // Step 1: Get or create conversation
      const convId = await getOrCreateConversation(mentionedAgent.name);

      // Step 2: Start chat and get runId
      const runId = await startChat(
        convId,
        inputValue.replace(`@${mentionedAgent.name}`, "").trim(),
        mentionedAgent.agentId,
        mentionedAgent.id,
      );

      // Create new card with prompt stored
      const newCardId = Date.now().toString();
      const newCard: AgentCard = {
        id: newCardId,
        agent: mentionedAgent.id as "compliance" | "approvals" | "tower",
        title:
          mentionedAgent.id === "compliance"
            ? "Compliance Report"
            : mentionedAgent.id === "approvals"
              ? "Approvals Required"
              : "Tower Overview",
        timestamp: new Date(),
        runId: runId,
        streaming: true,
        convId: convId,
        prompt: inputValue, // Store the prompt in the card
      };

      setActiveCards((prev) => [...prev, newCard]);
      setStreamingCard(mentionedAgent.id);

      // Step 3: Connect to SSE stream
      await handleStreamData(runId, newCardId, lowerInput, convId);
    } catch (error) {
      console.error("Error in conversation flow:", error);
      const errorCard: AgentCard = {
        id: Date.now().toString(),
        agent: "compliance",
        title: "Error",
        timestamp: new Date(),
        streamData: {
          steps: [
            {
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to start conversation",
              timestamp: moment().format("hh:mm:ss"),
            },
          ],
        },
        prompt: inputValue, // Also store prompt for error cards
      };
      setActiveCards((prev) => [...prev, errorCard]);
    } finally {
      setIsTyping(false);
    }

    setInputValue("");
  };

  const handleStreamData = async (
    runId: string,
    cardId: string,
    lowerInput: string,
    convId: string,
  ) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const SSE_CHAT_URL = `/api/stream?runId=${runId}`;
    const selectedTenant = "e6e0a6cc-c509-45d4-b5a7-b92c619cb343";

    return new Promise<void>(async (resolve) => {
      await fetchEventSource(SSE_CHAT_URL, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${accessToken}`,
          "x-tenant-id": selectedTenant,
        },
        onopen: async (response) => {
          if (response.ok) {
            console.log("Stream connection opened for runId:", runId);

            // Initialize stream data for this card
            setActiveCards((prev) =>
              prev.map((card) => {
                if (card.id === cardId) {
                  return {
                    ...card,
                    streamData: {
                      icon: "generating.gif",
                      title: "Generating Result",
                      steps: [
                        {
                          title: "Agent Initiated",
                          description: "Agent started processing your request",
                          timestamp: moment().format("hh:mm:ss"),
                        },
                      ],
                    },
                    agentStreamData: {
                      icon: "generating.gif",
                      title: "Generating Result",
                      agentName: "",
                      thoughtsAndtoolsAction: [],
                      finalResult: "",
                      isOpen: true,
                    },
                  };
                }
                return card;
              }),
            );
          } else {
            throw new Error(`Failed to connect to stream: ${response.status}`);
          }
        },
        onmessage: (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            const {
              step,
              data,
              node_status,
              stream,
              status,
              run_type,
              node_display_name,
              start_time,
              node_id,
            } = parsedData;

            console.log("Stream message:", parsedData);

            switch (run_type) {
              case "<AGENT>":
                switch (status) {
                  case "<INPROGRESS>":
                    if (step === "AGENTTHOUGHT") {
                      const thoughtContent =
                        typeof data === "string" ? data : data?.content;

                      // Update stream data
                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
                            const updatedStreamData = { ...card.streamData };
                            if (!updatedStreamData.steps) {
                              updatedStreamData.steps = [];
                            }

                            updatedStreamData.steps.push({
                              title: "Agent Thought",
                              description: thoughtContent,
                              timestamp: moment().format("hh:mm:ss"),
                            });

                            // Update agent stream data
                            const updatedAgentStreamData = {
                              ...card.agentStreamData,
                            };
                            const thoughtsAndTools =
                              updatedAgentStreamData?.thoughtsAndtoolsAction ||
                              [];

                            thoughtsAndTools.push({
                              thought: thoughtContent,
                              toolActions: [],
                            });

                            return {
                              ...card,
                              streamData: updatedStreamData,
                              agentStreamData: {
                                ...updatedAgentStreamData,
                                thoughtsAndtoolsAction: thoughtsAndTools,
                              },
                            };
                          }
                          return card;
                        }),
                      );
                    } else if (step === "TOOLCALL") {
                      try {
                        const toolCall =
                          typeof data === "string" ? JSON.parse(data) : data;
                        
                        // Handle get_user_choice specifically for options display
                        const toolName = toolCall?.content?.[0]?.name || toolCall?.tool_name;
                        if (toolName === 'get_user_choice') {
                          const options = toolCall?.content?.[0]?.args?.options || toolCall?.tool_kwargs?.options;
                          
                          if (options) {
                            setActiveCards((prev) =>
                              prev.map((card) => {
                                if (card.id === cardId) {
                                  return {
                                    ...card,
                                    toolResponseData: {
                                      type: 'options',
                                      title: 'Please choose an option:',
                                      content: options
                                    }
                                  };
                                }
                                return card;
                              })
                            );
                          }
                        }

                        const normalizedToolCalls: {
                          tool_id: string;
                          tool_name: string;
                          tool_kwargs: any;
                        }[] = [];

                        if (toolCall?.content?.length > 0) {
                          toolCall.content.forEach((part: any) => {
                            normalizedToolCalls.push({
                              tool_id: part.id ?? "",
                              tool_name: part.name ?? "",
                              tool_kwargs: part.args ?? {},
                            });
                          });
                        } else {
                          normalizedToolCalls.push({
                            tool_id: toolCall.tool_id ?? "",
                            tool_name: toolCall.tool_name ?? "",
                            tool_kwargs: toolCall.tool_kwargs ?? {},
                          });
                        }

                        setActiveCards((prev) =>
                          prev.map((card) => {
                            if (card.id === cardId) {
                              const updatedStreamData = { ...card.streamData };
                              if (!updatedStreamData.steps) {
                                updatedStreamData.steps = [];
                              }

                              // Add tool call steps
                              normalizedToolCalls.forEach((tc) => {
                                updatedStreamData.steps.push({
                                  title: `Calling: ${tc.tool_name}`,
                                  description: `Calling tool with arguments: ${JSON.stringify(tc.tool_kwargs)}`,
                                  timestamp: moment().format("hh:mm:ss"),
                                  toolName: tc.tool_name,
                                  toolArgs: tc.tool_kwargs,
                                  expanded: true,
                                });
                              });

                              // Update agent stream data
                              const updatedAgentStreamData = {
                                ...card.agentStreamData,
                              };
                              const thoughtsAndTools =
                                updatedAgentStreamData?.thoughtsAndtoolsAction ||
                                [];

                              if (thoughtsAndTools.length === 0) {
                                thoughtsAndTools.push({
                                  thought: "",
                                  toolActions: [],
                                });
                              }

                              const lastItemIndex = thoughtsAndTools.length - 1;
                              if (lastItemIndex >= 0) {
                                const lastItem = {
                                  ...thoughtsAndTools[lastItemIndex],
                                };

                                normalizedToolCalls.forEach(
                                  (normalizedToolCall) => {
                                    const existingToolAction =
                                      lastItem.toolActions.find(
                                        (action: any) =>
                                          action.action ===
                                            normalizedToolCall.tool_name &&
                                          action.argument ===
                                            JSON.stringify(
                                              normalizedToolCall.tool_kwargs,
                                              null,
                                              2,
                                            ),
                                      );
                                    if (!existingToolAction) {
                                      lastItem.toolActions.push({
                                        action: normalizedToolCall.tool_name,
                                        argument: JSON.stringify(
                                          normalizedToolCall.tool_kwargs,
                                          null,
                                          2,
                                        ),
                                        output: "",
                                        toolId: normalizedToolCall.tool_id,
                                      });
                                    }
                                  },
                                );

                                thoughtsAndTools[lastItemIndex] = lastItem;
                              }

                              return {
                                ...card,
                                streamData: updatedStreamData,
                                agentStreamData: {
                                  ...updatedAgentStreamData,
                                  thoughtsAndtoolsAction: thoughtsAndTools,
                                },
                              };
                            }
                            return card;
                          }),
                        );
                      } catch (e) {
                        console.error("Error parsing TOOLCALL", e);
                      }
                    } else if (step === "TOOLCALLRESULT") {
                      try {
                        const toolResult =
                          typeof data === "string" ? JSON.parse(data) : data;
                        
                        // Get the tool name and response
                        const content = toolResult?.content?.[0];
                        const toolName = content?.name || toolResult?.tool_name;
                        const responseData = content?.response || toolResult?.tool_response;

                        if (toolName && responseData) {
                          // Parse the response based on tool name
                          const parsedResponse = parseToolResponse(toolName, { response: responseData });
                          
                          // Update the card with parsed response
                          setActiveCards((prev) =>
                            prev.map((card) => {
                              if (card.id === cardId) {
                                return {
                                  ...card,
                                  toolResponseData: parsedResponse
                                };
                              }
                              return card;
                            })
                          );
                        }

                        const normalizedToolResults: {
                          tool_id: string;
                          tool_name: string;
                          tool_response: any;
                        }[] = [];

                        if (toolResult?.content?.length > 0) {
                          toolResult.content.forEach((part: any) => {
                            if (part) {
                              normalizedToolResults.push({
                                tool_id: part.id ?? "",
                                tool_name: part.name ?? "",
                                tool_response:
                                  JSON.stringify(part.response) ??
                                  JSON.stringify(part) ??
                                  null,
                              });
                            }
                          });
                        } else {
                          normalizedToolResults.push({
                            tool_id: toolResult?.tool_id ?? "",
                            tool_name: toolResult?.tool_name ?? "",
                            tool_response:
                              JSON.stringify(
                                toolResult?.tool_output?.content,
                              ) ??
                              JSON.stringify(toolResult?.tool_output) ??
                              null,
                          });
                        }

                        setActiveCards((prev) =>
                          prev.map((card) => {
                            if (card.id === cardId) {
                              const updatedStreamData = { ...card.streamData };

                              // Add tool response steps
                              normalizedToolResults.forEach((tr) => {
                                updatedStreamData.steps.push({
                                  title: `Response: ${tr.tool_name}`,
                                  description: `Response generated by tool: ${tr.tool_response}`,
                                  timestamp: moment().format("hh:mm:ss"),
                                  toolResponse: tr.tool_response,
                                });
                              });

                              // Update agent stream data with tool outputs
                              const updatedAgentStreamData = {
                                ...card.agentStreamData,
                              };
                              const thoughtsAndTools =
                                updatedAgentStreamData?.thoughtsAndtoolsAction ||
                                [];

                              const lastItemIndex = thoughtsAndTools.length - 1;
                              if (lastItemIndex >= 0) {
                                const lastItem = {
                                  ...thoughtsAndTools[lastItemIndex],
                                };

                                normalizedToolResults.forEach(
                                  (toolResultRes) => {
                                    const actionIndex =
                                      lastItem.toolActions.findIndex(
                                        (action: any) =>
                                          action.toolId ===
                                          toolResultRes?.tool_id,
                                      );
                                    if (actionIndex !== -1) {
                                      lastItem.toolActions[actionIndex] = {
                                        ...lastItem.toolActions[actionIndex],
                                        output:
                                          toolResultRes.tool_response ||
                                          "No output",
                                      };
                                    }
                                  },
                                );

                                thoughtsAndTools[lastItemIndex] = lastItem;
                              }

                              return {
                                ...card,
                                streamData: updatedStreamData,
                                agentStreamData: {
                                  ...updatedAgentStreamData,
                                  thoughtsAndtoolsAction: thoughtsAndTools,
                                },
                              };
                            }
                            return card;
                          }),
                        );
                      } catch (e) {
                        console.error("Error parsing TOOLCALLRESULT", e);
                      }
                    }
                    break;

                  case "<END_RESPONSE>":
                    // Handle both step types: "AGENTOUTPUT" or the default case
                    if (step === "AGENTOUTPUT" || !step) {
                      // Extract the response text from the nested structure
                      let responseText = "";
                      
                      // Navigate through the nested data structure
                      if (data?.response) {
                        // Direct response field
                        responseText = data.response;
                      } else if (data?.content?.[0]?.text) {
                        // Nested in content array with text field
                        responseText = data.content[0].text;
                      } else if (data?.content?.[0]?.response) {
                        // Nested in content array with response field
                        responseText = data.content[0].response;
                      } else if (data?.chat_response?.response) {
                        // Nested in chat_response
                        responseText = data.chat_response.response;
                      } else if (typeof data === 'string') {
                        // Direct string data
                        responseText = data;
                      } else if (data?.content && Array.isArray(data.content)) {
                        // Try to extract text from any content item
                        for (const item of data.content) {
                          if (item?.text) {
                            responseText = item.text;
                            break;
                          } else if (item?.response) {
                            responseText = item.response;
                            break;
                          }
                        }
                      }

                      // Find which agent was mentioned in the input
                      const mentionedAgent = agents.find((agent) =>
                        lowerInput
                          ?.toLowerCase()
                          .includes(`@${agent.name.toLowerCase()}`),
                      );

                      const agentId = mentionedAgent?.id || "compliance";

                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
                            // Create tool response data for the final message
                            const toolResponseData: ToolResponseData = {
                              type: 'text',
                              title: 'Agent Response',
                              content: responseText || 'No response text available'
                            };

                            // Update the card with final data
                            const updatedCard = {
                              ...card,
                              streamData: {
                                ...card.streamData,
                                steps: [
                                  ...(card.streamData?.steps || []),
                                  {
                                    title: "Agent Response",
                                    description: "Agent completed processing",
                                    timestamp: moment().format("hh:mm:ss"),
                                  }
                                ],
                                icon: "success-icon-popup.svg",
                                title: "Generated Result",
                              },
                              agentStreamData: {
                                ...card.agentStreamData,
                                icon: "success-icon-popup.svg",
                                title: "Generated Result",
                                finalResult: responseText,
                                isOpen: false,
                              },
                              toolResponseData, // Add the response as toolResponseData
                              streaming: false,
                            };

                            // Add the appropriate response component based on agent
                            if (agentId === "compliance") {
                              updatedCard.content = <ComplianceReportCards />;
                            } else if (agentId === "approvals") {
                              updatedCard.content = <ApprovalsCards />;
                            } else if (agentId === "tower") {
                              updatedCard.content = <TowerCards />;
                            }

                            return updatedCard;
                          }
                          return card;
                        }),
                      );

                      setStreamingCard(null);
                      setIsTyping(false);
                      resolve();
                    }
                    break;

                  case "<ERROR>":
                    const errorMessage =
                      parsedData?.error?.message ||
                      parsedData?.data?.slice(0, 200);

                    setActiveCards((prev) =>
                      prev.map((card) => {
                        if (card.id === cardId) {
                          return {
                            ...card,
                            streamData: {
                              steps: [
                                ...(card.streamData?.steps || []),
                                {
                                  title: "Error",
                                  description: errorMessage,
                                  timestamp: moment().format("hh:mm:ss"),
                                },
                              ],
                            },
                            streaming: false,
                          };
                        }
                        return card;
                      }),
                    );

                    setStreamingCard(null);
                    resolve();
                    break;
                }
                break;

              case "<WORKFLOW>":
              case "<CUSTOM_WORKFLOW>":
                switch (status) {
                  case "<INPROGRESS>":
                    if (stream && stream !== null) {
                      assistantStreamingRef.current += stream;
                    }

                    if (node_status === "<START>") {
                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
                            const updatedStreamData = { ...card.streamData };
                            if (!updatedStreamData.steps)
                              updatedStreamData.steps = [];

                            updatedStreamData.steps.push({
                              title: `Executing: ${node_display_name}`,
                              description: `Start time ${moment(start_time).format("hh:mm:ss")}`,
                              timestamp: moment().format("hh:mm:ss"),
                              node_id: node_id,
                            });

                            return {
                              ...card,
                              streamData: updatedStreamData,
                              agentStreamData: {
                                ...card.agentStreamData,
                                agentName: node_display_name,
                              },
                            };
                          }
                          return card;
                        }),
                      );
                    } else if (node_status === "<END>") {
                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
                            const updatedStreamData = { ...card.streamData };
                            const steps = updatedStreamData.steps || [];
                            const existingStepIndex = steps.findIndex(
                              (s: any) => s.node_id === node_id,
                            );

                            if (existingStepIndex !== -1) {
                              steps[existingStepIndex] = {
                                ...steps[existingStepIndex],
                                title: `Executed: ${node_display_name} ✅`,
                                description: `${steps[existingStepIndex].description} | End time ${moment(start_time).format("hh:mm:ss")}`,
                              };
                            }

                            return {
                              ...card,
                              streamData: updatedStreamData,
                            };
                          }
                          return card;
                        }),
                      );
                    }
                    break;

                  case "<END_RESPONSE>":
                    // Handle workflow END_RESPONSE with AGENTOUTPUT
                    if (step === "AGENTOUTPUT" || !step) {
                      let finalResponse = "";
                      
                      // Extract response from various possible structures
                      if (data?.chat_response?.response) {
                        finalResponse = data.chat_response.response;
                      } else if (data?.response) {
                        finalResponse = data.response;
                      } else if (data?.content?.[0]?.text) {
                        finalResponse = data.content[0].text;
                      } else if (data?.content?.[0]?.response) {
                        finalResponse = data.content[0].response;
                      } else if (typeof data === 'string') {
                        finalResponse = data;
                      }

                      // Find which agent was mentioned
                      const workflowMentionedAgent = agents.find((agent) =>
                        lowerInput
                          ?.toLowerCase()
                          .includes(`@${agent.name.toLowerCase()}`),
                      );

                      const workflowAgentId = workflowMentionedAgent?.id || "compliance";

                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
                            const toolResponseData: ToolResponseData = {
                              type: 'text',
                              title: 'Workflow Response',
                              content: finalResponse || 'Workflow completed successfully'
                            };

                            const updatedCard = {
                              ...card,
                              streamData: {
                                ...card.streamData,
                                steps: [
                                  ...(card.streamData?.steps || []),
                                  {
                                    title: "Workflow Complete",
                                    description: "Workflow executed successfully",
                                    timestamp: moment().format("hh:mm:ss"),
                                  }
                                ],
                                icon: "success-icon-popup.svg",
                                title: "Processed Workflow",
                              },
                              agentStreamData: {
                                ...card.agentStreamData,
                                icon: "success-icon-popup.svg",
                                title: "Processed Workflow",
                                agentName: "Workflow Executed",
                                finalResult: finalResponse,
                                isOpen: false,
                              },
                              toolResponseData,
                              streaming: false,
                            };

                            // Add the appropriate response component
                            if (workflowAgentId === "compliance") {
                              updatedCard.content = <ComplianceReportCards />;
                            } else if (workflowAgentId === "approvals") {
                              updatedCard.content = <ApprovalsCards />;
                            } else if (workflowAgentId === "tower") {
                              updatedCard.content = <TowerCards />;
                            }

                            return updatedCard;
                          }
                          return card;
                        }),
                      );

                      setStreamingCard(null);
                      setIsTyping(false);
                      resolve();
                    }
                    break;

                  case "<ERROR>":
                    const workflowError =
                      parsedData?.error?.message ||
                      parsedData?.data?.slice(0, 200);

                    setActiveCards((prev) =>
                      prev.map((card) => {
                        if (card.id === cardId) {
                          return {
                            ...card,
                            streamData: {
                              steps: [
                                ...(card.streamData?.steps || []),
                                {
                                  title: "Error",
                                  description: workflowError,
                                  timestamp: moment().format("hh:mm:ss"),
                                },
                              ],
                            },
                            streaming: false,
                          };
                        }
                        return card;
                      }),
                    );

                    setStreamingCard(null);
                    resolve();
                    break;
                }
                break;

              default:
                console.log("Unknown run_type:", parsedData);
                break;
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error);
          }
        },
        onerror: (error) => {
          console.error("SSE Error:", error);
          setActiveCards((prev) =>
            prev.map((card) => {
              if (card.id === cardId) {
                return {
                  ...card,
                  streaming: false,
                };
              }
              return card;
            }),
          );
          setStreamingCard(null);
          resolve();
        },
        onclose: () => {
          console.log("Stream connection closed for runId:", runId);
          resolve();
        },
      });
    });
  };

  // This function now just renders the steps without using hooks
  const renderStreamSteps = (card: AgentCard) => {
    if (
      !card.streamData?.steps &&
      !card.agentStreamData?.thoughtsAndtoolsAction
    ) {
      return null;
    }

    const steps = card.streamData?.steps || [];
    const isExpanded = expandedAccordions[card.id] ?? true; // Default to expanded

    if (steps.length === 0) return null;

    return (
      <Accordion
        expanded={isExpanded}
        onChange={() => toggleAccordion(card.id)}
        sx={{
          mt: 2,
          mb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: 2,
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 56,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Agent Execution Steps ({steps.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {steps.map((step, index) => (
            <Box key={index}>
              {index > 0 && <Divider sx={{ my: 1.5 }} />}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.title.includes("Calling") && (
                    <CallMadeIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                  )}
                  {step.title.includes("Response") && (
                    <CallReceivedIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                  )}
                  {step.title.includes("Thought") && (
                    <SmartToyIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                  )}
                  {step.title.includes("Executing") && (
                    <PlayArrowIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  )}
                  {step.title.includes("Error") && (
                    <ErrorIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                  )}
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
                  <Paper
                    variant="outlined"
                    sx={{
                      ml: 3.5,
                      p: 1.5,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      overflow: "auto",
                    }}
                  >
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(step.toolArgs, null, 2)}
                    </pre>
                  </Paper>
                )}

                {step.toolResponse && (
                  <Paper
                    variant="outlined"
                    sx={{
                      ml: 3.5,
                      p: 1.5,
                      mt: 1,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      overflow: "auto",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Response:
                    </Typography>
                    <pre style={{ margin: 0 }}>
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

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "compliance":
        return theme.palette.primary.main;
      case "approvals":
        return theme.palette.success.main;
      case "tower":
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setInputValue(value);
    setCursorPosition(position);

    const lastAtSymbol = value.lastIndexOf("@", position - 1);
    if (
      lastAtSymbol !== -1 &&
      (position === lastAtSymbol + 1 ||
        value.slice(lastAtSymbol + 1, position).length > 0)
    ) {
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

  const clearChat = () => {
    setActiveCards([]);
    // Optionally clear all conversations
    setActiveConversations(new Map());
    localStorage.removeItem("activeConversations");
  };

  // Add function to manually clear conversation for an agent
  const handleClearAgentConversation = (agentName: string) => {
    clearAgentConversation(agentName);
    // Show a snackbar or toast notification
    console.log(`Cleared conversation for ${agentName}`);
  };

  const handleAgentClick = (agent: string) => {
    setInputValue((prev) => prev + `@${agent} `);
    inputRef.current?.focus();
  };

  const filteredAgents = agents.filter((agent) => {
    const lastAtSymbol = inputValue.lastIndexOf("@", cursorPosition - 1);
    if (lastAtSymbol === -1) return false;
    const searchText = inputValue
      .slice(lastAtSymbol + 1, cursorPosition)
      .toLowerCase();
    return agent.name.toLowerCase().includes(searchText);
  });

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.default,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          {activeCards.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={3}>
                {activeCards.map((card) => {                  
                  return (
                    <Grid item xs={12} key={card.id}>
                        {/* Prompt Message Section */}
                        {card.prompt && (
                      <Paper sx={{ mb: 3, p: 2 }}>                           
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: getAgentColor(card.agent), width: 28, height: 28 }}>
                            {card.agent === 'compliance' && <AssignmentIcon sx={{ fontSize: 16 }} />}
                            {card.agent === 'approvals' && <CheckCircleIcon sx={{ fontSize: 16 }} />}
                            {card.agent === 'tower' && <SecurityIcon sx={{ fontSize: 16 }} />}
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
                        {/* Streaming Steps Accordion */}
                        {renderStreamSteps(card)}

                        {/* Tool Response Data - New Section */}
                        {card.toolResponseData && (
                          <Box sx={{ mt: 3 }}>
                            {card.toolResponseData.title && (
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                {card.toolResponseData.title}
                              </Typography>
                            )}
                            <ToolResponseRenderer data={card.toolResponseData} />
                          </Box>
                        )}

                        {/* Streaming Indicator */}
                        {card.streaming && streamingCard === card.agent && (
                          <Paper
                            sx={{
                              p: 2,
                              mt: 2,
                              bgcolor: alpha(getAgentColor(card.agent), 0.05),
                              border: `1px solid ${alpha(getAgentColor(card.agent), 0.3)}`,
                              borderRadius: 2
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: getAgentColor(card.agent),
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                {card.agent === "compliance" && <AssignmentIcon sx={{ fontSize: 20 }} />}
                                {card.agent === "approvals" && <CheckCircleIcon sx={{ fontSize: 20 }} />}
                                {card.agent === "tower" && <SecurityIcon sx={{ fontSize: 20 }} />}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ color: getAgentColor(card.agent) }}>
                                  {card.agent === "compliance"
                                    ? "Compliance Agent"
                                    : card.agent === "approvals"
                                      ? "Approvals Agent"
                                      : "Tower Agent"}{" "}
                                  is responding...
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Generating response ⚡
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        )}

                        {/* Card Content */}
                        {card.content && !card.streaming && (
                          <Box sx={{ mt: 3 }}>
                            {card.content}
                          </Box>
                        )}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {isTyping && !streamingCard && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                maxWidth: 200,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                AI Assistant is thinking...
              </Typography>
            </Paper>
          )}

          <div ref={messagesEndRef} />
        </Container>
      </Box>

      {/* Chat Input Section */}
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
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {agents.map((agent) => (
                <Chip
                  key={agent.id}
                  icon={agent.icon}
                  label={`@${agent.name}`}
                  onClick={() => handleAgentClick(agent.name)}
                  sx={{
                    bgcolor: activeConversations.has(agent.name)
                      ? alpha(agent.color, 0.2)
                      : alpha(agent.color, 0.1),
                    color: agent.color,
                    borderColor: agent.color,
                    "&:hover": {
                      bgcolor: alpha(agent.color, 0.3),
                    },
                  }}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>

            <Box sx={{ position: "relative" }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type @ to mention an agent or click chips above..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  size="small"
                  inputRef={inputRef}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: "white",
                    px: 4,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                    "&.Mui-disabled": {
                      bgcolor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  Send
                </Button>
              </Box>

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
                        <ClickAwayListener
                          onClickAway={() => setShowAgentMenu(false)}
                        >
                          <MenuList>
                            {filteredAgents.map((agent) => (
                              <MenuItem
                                key={agent.id}
                                onClick={() => handleAgentSelect(agent)}
                                sx={{
                                  "&:hover": {
                                    bgcolor: alpha(agent.color, 0.1),
                                  },
                                }}
                              >
                                <ListItemIcon
                                  sx={{ color: agent.color, minWidth: 36 }}
                                >
                                  {agent.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={`@${agent.name}`}
                                  secondary={agent.description}
                                  primaryTypographyProps={{
                                    sx: { fontWeight: 500, color: agent.color },
                                  }}
                                  secondaryTypographyProps={{
                                    sx: { fontSize: "0.75rem" },
                                  }}
                                />
                                {activeConversations.has(agent.name) && (
                                  <Chip
                                    size="small"
                                    label="Active"
                                    color="success"
                                    variant="outlined"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                )}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Fade>
                  )}
                </Popper>
              )}
            </Box>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
}