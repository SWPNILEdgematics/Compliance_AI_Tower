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
  toolResponses?: ToolResponseData[]; // Array of streaming responses
  finalResponse?: ToolResponseData; // Final END_RESPONSE
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
  timestamp?: string;
  toolName?: string;
}

// Helper function to parse and format tool responses
const parseToolResponse = (toolName: string, responseData: any, timestamp?: string): ToolResponseData => {
  try {
    // Handle direct text responses
    if (typeof responseData === 'string') {
      return {
        type: 'text',
        title: `${toolName} Response`,
        content: responseData,
        timestamp,
        toolName
      };
    }

    // Handle response with text field
    if (responseData?.text) {
      return {
        type: 'text',
        title: `${toolName} Response`,
        content: responseData.text,
        timestamp,
        toolName
      };
    }

    // Handle response with content array (like in AGENTOUTPUT)
    if (responseData?.content?.[0]?.text) {
      return {
        type: 'text',
        title: `${toolName} Response`,
        content: responseData.content[0].text,
        timestamp,
        toolName
      };
    }

    // Handle librarian_agent responses
    if (toolName === 'librarian_agent') {
      const response = responseData?.response;
      if (response?.checklist) {
        // Convert checklist object (object of objects) to table format
        const checklist = response.checklist;
        
        // Get all keys from the first item to determine structure
        const items = Object.values(checklist);
        
        if (items.length > 0 && typeof items[0] === 'object') {
          // Get all unique keys from all objects
          const allKeys = new Set<string>();
          items.forEach((item: any) => {
            if (item && typeof item === 'object') {
              Object.keys(item).forEach(key => allKeys.add(key));
            }
          });
          
          const headers = Array.from(allKeys);
          const rows = items.map((item: any) => {
            const row: any = {};
            headers.forEach(header => {
              row[header] = item[header] || '';
            });
            return row;
          });
          
          return {
            type: 'table',
            title: 'Compliance Checklist',
            content: {
              headers,
              rows
            },
            timestamp,
            toolName
          };
        }
        
        // Fallback: if not an object of objects, return as formatted JSON
        return {
          type: 'text',
          title: 'Compliance Checklist',
          content: JSON.stringify(checklist, null, 2),
          timestamp,
          toolName
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
          content: response.report_markdown.replace(/\\n/g, '\n'), // Fix escaped newlines
          timestamp,
          toolName
        };
      } else if (response) {
        // Fallback to table for other response structures
        return {
          type: 'table',
          title: 'Report Data',
          content: response,
          timestamp,
          toolName
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
          content: response.result,
          timestamp,
          toolName
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
              },
              timestamp,
              toolName
            };
          }
        } catch (e) {
          console.error('Error parsing findings JSON:', e);
        }
      }
    }

    // Handle findings array in response
    if (responseData?.findings && Array.isArray(responseData.findings) && responseData.findings.length > 0) {
      const findings = responseData.findings;
      const headers = Object.keys(findings[0]).filter(key => key !== 'id');
      const rows = findings.map((finding: any) => {
        const row: any = {};
        headers.forEach(header => {
          row[header] = finding[header] || '';
        });
        return row;
      });
      
      return {
        type: 'table',
        title: `Audit Findings - ${responseData.audit_id || 'Results'}`,
        content: {
          headers: headers,
          rows: rows
        },
        timestamp,
        toolName
      };
    }

    // Default: return as formatted JSON
    return {
      type: 'text',
      title: `${toolName} Response`,
      content: JSON.stringify(responseData, null, 2),
      timestamp,
      toolName
    };
  } catch (error) {
    console.error('Error parsing tool response:', error);
    return {
      type: 'text',
      title: 'Error Parsing Response',
      content: 'Unable to parse response data',
      timestamp,
      toolName
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
          mt: 1,
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
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No table data available
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 400 }}>
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
      <List sx={{ mt: 1, bgcolor: alpha(theme.palette.primary.main, 0.02), p: 2, borderRadius: 1 }}>
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
        mt: 1,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const { isLoading, isAuthenticated } = useProtectedRoute();

  // Track active conversations per agent
  const [activeConversations, setActiveConversations] = useState<
    Map<string, ActiveConversation>
  >(new Map());

  // Add this state to track the current conversation
const [currentConversation, setCurrentConversation] = useState<{
  convId: string;
  agentType: string;
} | null>(null);

  // Refs for streaming
  const assistantStreamingRef = useRef<string>("");
  const actionsRef = useRef<any[]>([]);
  const approvalsRef = useRef<any[]>([]);
  const messageIdRef = useRef<string>("");

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
        
        // Set the current conversation to the most recently used one
        let mostRecent: { convId: string; agentType: string } | null = null;
        let mostRecentTime = new Date(0);
        
        map.forEach((value, key) => {
          if (value.lastUsed > mostRecentTime) {
            mostRecentTime = value.lastUsed;
            mostRecent = {
              convId: value.convId,
              agentType: key
            };
          }
        });
        
        setCurrentConversation(mostRecent);
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


  const handleSendMessage = async () => {
      if (!inputValue.trim()) return;

      const lowerInput = inputValue.toLowerCase();

      // Extract the mentioned agent from the prompt
      const atMentionRegex = /@(\w+)/g;
      const matches = [...inputValue.matchAll(atMentionRegex)];
      
      let mentionedAgent = null;
      if (matches.length > 0) {
        // Get the last mentioned agent
        const lastMatch = matches[matches.length - 1];
        const mentionedName = lastMatch[1];
        mentionedAgent = agents.find(
          agent => agent.name.toLowerCase() === mentionedName.toLowerCase()
        );
      }

      // If no agent mentioned, use the first agent as default
      if (!mentionedAgent) {
        mentionedAgent = agents[0];
      }

      setIsTyping(true);

      try {
        // ALWAYS use the existing conversation if available, regardless of agent
        let convId:any;
        if (currentConversation) {
          // Reuse the existing conversation even if agent changed
          convId = currentConversation.convId;
          console.log(`Reusing conversation ${convId} for agent ${mentionedAgent.name} (original agent: ${currentConversation.agentType})`);
        } else {
          // Only create a new conversation if there's no current conversation
          convId = await createConversation(mentionedAgent.name);
          setCurrentConversation({
            convId,
            agentType: mentionedAgent.name
          });
          
          // Update activeConversations for persistence
          setActiveConversations((prev) => {
            const updated = new Map(prev);
            updated.set(mentionedAgent.name, {
              convId,
              createdAt: new Date(),
              lastUsed: new Date(),
            });
            return updated;
          });
        }

        // Clean the prompt by removing @mentions
        const cleanPrompt = inputValue.replace(atMentionRegex, '').trim();

        const runId = await startChat(
          convId,
          cleanPrompt || inputValue, // Fallback to original if cleaning removed everything
          mentionedAgent.agentId,
          mentionedAgent.id,
        );

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
          prompt: inputValue, // Keep original prompt with @mention for display
          toolResponses: [],
        };

        setActiveCards((prev) => [...prev, newCard]);
        setStreamingCard(mentionedAgent.id);

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
          prompt: inputValue,
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
                    toolResponses: [], // Reset responses
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
                        
                        const toolName = toolCall?.content?.[0]?.name || toolCall?.tool_name;
                        
                        // Handle get_user_choice specifically for options display
                        if (toolName === 'get_user_choice') {
                          const options = toolCall?.content?.[0]?.args?.options || toolCall?.tool_kwargs?.options;
                          
                          if (options) {
                            const optionsResponse: ToolResponseData = {
                              type: 'options',
                              title: 'Please choose an option:',
                              content: options,
                              timestamp: moment().format("hh:mm:ss"),
                              toolName
                            };
                            
                            setActiveCards((prev) =>
                              prev.map((card) => {
                                if (card.id === cardId) {
                                  const existingResponses = card.toolResponses || [];
                                  return {
                                    ...card,
                                    toolResponses: [...existingResponses, optionsResponse]
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
                        
                        const content = toolResult?.content?.[0];
                        const toolName = content?.name || toolResult?.tool_name;
                        const responseData = content?.response || toolResult?.tool_response;

                        if (toolName && responseData) {
                          const parsedResponse = parseToolResponse(
                            toolName, 
                            { response: responseData },
                            moment().format("hh:mm:ss")
                          );
                          
                          setActiveCards((prev) =>
                            prev.map((card) => {
                              if (card.id === cardId) {
                                const existingResponses = card.toolResponses || [];
                                return {
                                  ...card,
                                  toolResponses: [...existingResponses, parsedResponse]
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

                              normalizedToolResults.forEach((tr) => {
                                updatedStreamData.steps.push({
                                  title: `Response: ${tr.tool_name}`,
                                  description: `Response generated by tool: ${tr.tool_response}`,
                                  timestamp: moment().format("hh:mm:ss"),
                                  toolResponse: tr.tool_response,
                                });
                              });

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
                    if (step === "AGENTOUTPUT" || !step) {
                      const mentionedAgent = agents.find((agent) =>
                        lowerInput
                          ?.toLowerCase()
                          .includes(`@${agent.name.toLowerCase()}`),
                      );

                      const agentId = mentionedAgent?.id || "compliance";
                      
                      if (agentId === "tower") {
                        setActiveCards((prev) =>
                          prev.map((card) => {
                            if (card.id === cardId) {
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
                                  finalResult: "",
                                  isOpen: false,
                                },
                                streaming: false,
                              };

                              updatedCard.content = <TowerCards />;
                              return updatedCard;
                            }
                            return card;
                          }),
                        );

                        setStreamingCard(null);
                        setIsTyping(false);
                        resolve();
                        return;
                      }
                      
                      let responseContent = "";
                      let responseData = null;
                      
                      if (data?.response) {
                        responseData = data.response;
                        responseContent = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
                      } else if (data?.content?.[0]?.text) {
                        responseContent = data.content[0].text;
                        responseData = { text: data.content[0].text };
                      } else if (data?.content?.[0]?.response) {
                        responseData = data.content[0].response;
                        responseContent = typeof data.content[0].response === 'string' 
                          ? data.content[0].response 
                          : JSON.stringify(data.content[0].response);
                      } else if (data?.chat_response?.response) {
                        responseData = data.chat_response.response;
                        responseContent = typeof data.chat_response.response === 'string' 
                          ? data.chat_response.response 
                          : JSON.stringify(data.chat_response.response);
                      } else if (typeof data === 'string') {
                        responseContent = data;
                        responseData = { text: data };
                      } else if (data?.content && Array.isArray(data.content)) {
                        for (const item of data.content) {
                          if (item?.text) {
                            responseContent = item.text;
                            responseData = { text: item.text };
                            break;
                          } else if (item?.response) {
                            responseData = item.response;
                            responseContent = typeof item.response === 'string' 
                              ? item.response 
                              : JSON.stringify(item.response);
                            break;
                          }
                        }
                      } else if (data && typeof data === 'object') {
                        responseData = data;
                        responseContent = JSON.stringify(data);
                      }

                      let finalResponseData: ToolResponseData;
                      
                      if (typeof responseData === 'string' && responseData.includes('|') && responseData.includes('\n')) {
                        finalResponseData = {
                          type: 'markdown',
                          title: 'Final Response',
                          content: responseData,
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } 
                      else if (responseData?.report_markdown) {
                        finalResponseData = {
                          type: 'markdown',
                          title: 'Audit Report',
                          content: responseData.report_markdown.replace(/\\n/g, '\n'),
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }
                      else if (responseData?.checklist) {
                        const checklist = responseData.checklist;
                        const keys = Object.keys(checklist);
                        const rows = checklist[keys[0]]?.map((_: any, index: number) => {
                          const row: any = {};
                          keys.forEach(key => {
                            row[key] = checklist[key]?.[index] || '';
                          });
                          return row;
                        }) || [];
                        
                        finalResponseData = {
                          type: 'table',
                          title: 'Compliance Checklist',
                          content: {
                            headers: keys,
                            rows: rows
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }
                      else if (responseData?.findings && Array.isArray(responseData.findings) && responseData.findings.length > 0) {
                        const findings = responseData.findings;
                        const headers = Object.keys(findings[0]).filter(key => key !== 'id');
                        const rows = findings.map((finding: any) => {
                          const row: any = {};
                          headers.forEach(header => {
                            row[header] = finding[header] || '';
                          });
                          return row;
                        });
                        
                        finalResponseData = {
                          type: 'table',
                          title: `Audit Findings - ${responseData.audit_id || 'Results'}`,
                          content: {
                            headers: headers,
                            rows: rows
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }
                      else if (Array.isArray(responseData) && responseData.length > 0) {
                        const headers = Object.keys(responseData[0]);
                        finalResponseData = {
                          type: 'table',
                          title: 'Results',
                          content: {
                            headers: headers,
                            rows: responseData
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }
                      else if (responseData?.result && typeof responseData.result === 'string') {
                        try {
                          const parsedResult = JSON.parse(responseData.result);
                          if (Array.isArray(parsedResult) && parsedResult.length > 0) {
                            const headers = Object.keys(parsedResult[0]);
                            finalResponseData = {
                              type: 'table',
                              title: 'Findings from Database',
                              content: {
                                headers: headers,
                                rows: parsedResult
                              },
                              timestamp: moment().format("hh:mm:ss")
                            };
                          } else {
                            finalResponseData = {
                              type: 'text',
                              title: 'Response',
                              content: responseData.result,
                              timestamp: moment().format("hh:mm:ss")
                            };
                          }
                        } catch (e) {
                          finalResponseData = {
                            type: 'text',
                            title: 'Response',
                            content: responseData.result,
                            timestamp: moment().format("hh:mm:ss")
                          };
                        }
                      }
                      else {
                        finalResponseData = {
                          type: 'text',
                          title: 'Agent Response',
                          content: responseContent || 'No response text available',
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }

                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
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
                                finalResult: typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent),
                                isOpen: false,
                              },
                              finalResponse: finalResponseData,
                              streaming: false,
                            };

                            if (agentId === "compliance") {
                              updatedCard.content = <ComplianceReportCards />;
                            } else if (agentId === "approvals") {
                              updatedCard.content = <ApprovalsCards />;
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
                    if (step === "AGENTOUTPUT" || !step) {
                      const workflowMentionedAgent = agents.find((agent) =>
                        lowerInput
                          ?.toLowerCase()
                          .includes(`@${agent.name.toLowerCase()}`),
                      );

                      const workflowAgentId = workflowMentionedAgent?.id || "compliance";

                      if (workflowAgentId === "tower") {
                        setActiveCards((prev) =>
                          prev.map((card) => {
                            if (card.id === cardId) {
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
                                  finalResult: "",
                                  isOpen: false,
                                },
                                streaming: false,
                              };

                              updatedCard.content = <TowerCards />;
                              return updatedCard;
                            }
                            return card;
                          }),
                        );

                        setStreamingCard(null);
                        setIsTyping(false);
                        resolve();
                        return;
                      }

                      let finalResponse = "";
                      let responseData = null;
                      
                      if (data?.chat_response?.response) {
                        responseData = data.chat_response.response;
                        finalResponse = typeof data.chat_response.response === 'string' 
                          ? data.chat_response.response 
                          : JSON.stringify(data.chat_response.response);
                      } else if (data?.response) {
                        responseData = data.response;
                        finalResponse = typeof data.response === 'string' 
                          ? data.response 
                          : JSON.stringify(data.response);
                      } else if (data?.content?.[0]?.text) {
                        responseData = { text: data.content[0].text };
                        finalResponse = data.content[0].text;
                      } else if (data?.content?.[0]?.response) {
                        responseData = data.content[0].response;
                        finalResponse = typeof data.content[0].response === 'string' 
                          ? data.content[0].response 
                          : JSON.stringify(data.content[0].response);
                      } else if (typeof data === 'string') {
                        responseData = { text: data };
                        finalResponse = data;
                      } else if (data && typeof data === 'object') {
                        responseData = data;
                        finalResponse = JSON.stringify(data);
                      }

                      let workflowFinalResponse: ToolResponseData;
                      
                      if (responseData?.findings && Array.isArray(responseData.findings) && responseData.findings.length > 0) {
                        const findings = responseData.findings;
                        const headers = Object.keys(findings[0]).filter(key => key !== 'id');
                        const rows = findings.map((finding: any) => {
                          const row: any = {};
                          headers.forEach(header => {
                            row[header] = finding[header] || '';
                          });
                          return row;
                        });
                        
                        workflowFinalResponse = {
                          type: 'table',
                          title: `Audit Findings - ${responseData.audit_id || 'Results'}`,
                          content: {
                            headers: headers,
                            rows: rows
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } else if (typeof responseData === 'string' && responseData.includes('|') && responseData.includes('\n')) {
                        workflowFinalResponse = {
                          type: 'markdown',
                          title: 'Workflow Response',
                          content: responseData,
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } else if (responseData?.report_markdown) {
                        workflowFinalResponse = {
                          type: 'markdown',
                          title: 'Audit Report',
                          content: responseData.report_markdown.replace(/\\n/g, '\n'),
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } else if (responseData?.checklist) {
                        const checklist = responseData.checklist;
                        const keys = Object.keys(checklist);
                        const rows = checklist[keys[0]]?.map((_: any, index: number) => {
                          const row: any = {};
                          keys.forEach(key => {
                            row[key] = checklist[key]?.[index] || '';
                          });
                          return row;
                        }) || [];
                        
                        workflowFinalResponse = {
                          type: 'table',
                          title: 'Compliance Checklist',
                          content: {
                            headers: keys,
                            rows: rows
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } else if (Array.isArray(responseData) && responseData.length > 0) {
                        const headers = Object.keys(responseData[0]);
                        workflowFinalResponse = {
                          type: 'table',
                          title: 'Results',
                          content: {
                            headers: headers,
                            rows: responseData
                          },
                          timestamp: moment().format("hh:mm:ss")
                        };
                      } else {
                        workflowFinalResponse = {
                          type: 'text',
                          title: 'Workflow Response',
                          content: finalResponse || 'Workflow completed successfully',
                          timestamp: moment().format("hh:mm:ss")
                        };
                      }

                      setActiveCards((prev) =>
                        prev.map((card) => {
                          if (card.id === cardId) {
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
                              finalResponse: workflowFinalResponse,
                              streaming: false,
                            };

                            if (workflowAgentId === "compliance") {
                              updatedCard.content = <ComplianceReportCards />;
                            } else if (workflowAgentId === "approvals") {
                              updatedCard.content = <ApprovalsCards />;
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

  const renderStreamSteps = (card: AgentCard) => {
    if (
      !card.streamData?.steps &&
      !card.agentStreamData?.thoughtsAndtoolsAction
    ) {
      return null;
    }

    const steps = card.streamData?.steps || [];
    const isExpanded = expandedAccordions[card.id] ?? true;

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
    
    // Find if there's already an @mention in the input
    const atMentionRegex = /@(\w+)/g;
    const matches = [...inputValue.matchAll(atMentionRegex)];
    
    let newValue;
    if (matches.length > 0) {
      // Replace the last @mention with the new agent
      const lastMatch = matches[matches.length - 1];
      if (lastMatch.index !== undefined) {
        newValue = 
          inputValue.substring(0, lastMatch.index) +
          `@${agent.name} ` +
          inputValue.substring(lastMatch.index + lastMatch[0].length);
      } else {
        newValue = inputValue + ` @${agent.name} `;
      }
    } else {
      // No existing @mention, add new one at cursor position
      newValue =
        inputValue.substring(0, lastAtSymbol) +
        `@${agent.name} ` +
        inputValue.substring(cursorPosition);
    }
    
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

  const handleCreateAgentConversation = () => {
    // Clear current conversation
    setCurrentConversation(null);
    // Clear all cards
    setActiveCards([]);
    // Clear active conversations from state
    setActiveConversations(new Map());
    // Clear from localStorage
    localStorage.removeItem("activeConversations");
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

      {/* Main Content Area - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,
          // Add padding at bottom to account for sticky input
          pb: 2,
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

                      {/* Streaming Tool Responses */}
                      {card.toolResponses && card.toolResponses.length > 0 && card.streaming && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'warning.main' }}>
                            Streaming Responses ({card.toolResponses.length})
                          </Typography>
                          {card.toolResponses.map((response, index) => (
                            <Box key={index} sx={{ mb: 3 }}>
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

                      {/* Final Response */}
                      {card.finalResponse && !card.streaming && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                            Final Result
                          </Typography>
                          <ToolResponseRenderer data={card.finalResponse} />
                        </Box>
                      )}

                      {/* All Tool Responses */}
                      {card.toolResponses && card.toolResponses.length > 0 && !card.streaming && !card.finalResponse && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Tool Responses ({card.toolResponses.length})
                          </Typography>
                          {card.toolResponses.map((response, index) => (
                            <Box key={index} sx={{ mb: 3 }}>
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

                      {/* Streaming Indicator */}
                      {card.streaming && streamingCard === card.agent && (
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

                      {/* Card Content (Agent-specific UI components) */}
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
        </Container>
      </Box>

      {/* Chat Input Section - Sticky at bottom */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          // Add shadow to separate from content
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.05)',
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
              {agents.map((agent) => {
                // Check if this agent is mentioned in the current input
                const isMentioned = inputValue.includes(`@${agent.name}`);
                
                return (
                  <Chip
                    key={agent.id}
                    icon={agent.icon}
                    label={`@${agent.name}`}
                    onClick={() => handleAgentClick(agent.name)}
                    sx={{
                      bgcolor: isMentioned 
                        ? agent.color // Full color when mentioned
                        : activeConversations.has(agent.name)
                          ? alpha(agent.color, 0.2)
                          : alpha(agent.color, 0.1),
                      color: isMentioned ? 'white' : agent.color,
                      borderColor: agent.color,
                      fontWeight: isMentioned ? 600 : 400,
                      '&:hover': {
                        bgcolor: isMentioned 
                          ? agent.color 
                          : alpha(agent.color, 0.3),
                      },
                    }}
                    variant={isMentioned ? "filled" : "outlined"}
                    size="small"
                  />
                );
              })}
            </Box>

            {/* Active conversation indicator */}
            {currentConversation && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Active conversation: @{currentConversation.agentType} (will be reused for all agents)
              </Typography>
            )}

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
              
              {/* New Conversation Button */}
              <Box sx={{ mt: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={handleCreateAgentConversation} 
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.dark,
                    }
                  }}
                >
                  Start New Conversation
                </Button>
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