// hooks/useConversation.ts
import { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

export interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  agentId: string;
}

export interface AgentCard {
  id: string;
  agent: 'compliance' | 'approvals' | 'tower';
  title: string;
  timestamp: Date;
  runId?: string;
  convId?: string;
  streamData?: any;
  agentStreamData?: any;
  streaming?: boolean;
  content?: React.ReactNode;
  prompt?: string;
  toolResponses?: any[];
  finalResponse?: any;
}

interface ActiveConversation {
  convId: string;
  createdAt: Date;
  lastUsed: Date;
}

export const useConversation = (agents: Agent[]) => {
  const [activeCards, setActiveCards] = useState<AgentCard[]>([]);
  const [activeConversations, setActiveConversations] = useState<Map<string, ActiveConversation>>(new Map());
  const [currentConversation, setCurrentConversation] = useState<{ convId: string; agentType: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingCard, setStreamingCard] = useState<string | null>(null);

  // Load conversations from localStorage
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

  // Save conversations to localStorage
  useEffect(() => {
    if (activeConversations.size > 0) {
      const obj = Object.fromEntries(activeConversations);
      localStorage.setItem("activeConversations", JSON.stringify(obj));
    }
  }, [activeConversations]);

  const createConversation = async (agentType: string): Promise<string> => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) throw new Error("No access token found");

    const response = await fetch(`/api/conv/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ agentType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.status}`);
    }

    const data = await response.json();
    return data.convId;
  };

  const startChat = async (
    convId: string,
    question: string,
    agentId: string,
    agentType: string,
  ): Promise<string> => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) throw new Error("No access token found");

    const response = await fetch("/api/chat/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ convId, question, agentId, agentType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start chat: ${response.status}`);
    }

    const data = await response.json();
    return data.runId;
  };

  const extractMentionedAgent = (input: string): Agent | null => {
    const atMentionRegex = /@(\w+)/g;
    const matches = [...input.matchAll(atMentionRegex)];
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const mentionedName = lastMatch[1];
      return agents.find(
        agent => agent.name.toLowerCase() === mentionedName.toLowerCase()
      ) || null;
    }
    return null;
  };

  const sendMessage = async (inputValue: string) => {
    const mentionedAgent = extractMentionedAgent(inputValue) || agents[0];
    setIsTyping(true);

    try {
      let convId: string;
      if (currentConversation) {
        convId = currentConversation.convId;
      } else {
        convId = await createConversation(mentionedAgent.name);
        setCurrentConversation({ convId, agentType: mentionedAgent.name });
        setActiveConversations(prev => {
          const updated = new Map(prev);
          updated.set(mentionedAgent.name, {
            convId,
            createdAt: new Date(),
            lastUsed: new Date(),
          });
          return updated;
        });
      }

      const cleanPrompt = inputValue.replace(/@(\w+)/g, '').trim();
      const runId = await startChat(
        convId,
        cleanPrompt || inputValue,
        mentionedAgent.agentId,
        mentionedAgent.id,
      );

      const newCardId = Date.now().toString();
      const newCard: AgentCard = {
        id: newCardId,
        agent: mentionedAgent.id as "compliance" | "approvals" | "tower",
        title: getCardTitle(mentionedAgent.id),
        timestamp: new Date(),
        runId,
        streaming: true,
        convId,
        prompt: inputValue,
        toolResponses: [],
      };

      setActiveCards(prev => [...prev, newCard]);
      setStreamingCard(mentionedAgent.id);

      return { runId, cardId: newCardId, mentionedAgent };
    } catch (error) {
      console.error("Error in conversation flow:", error);
      addErrorCard(inputValue);
      throw error;
    } finally {
      setIsTyping(false);
    }
  };

  const getCardTitle = (agentId: string): string => {
    switch (agentId) {
      case "compliance": return "Compliance Report";
      case "approvals": return "Approvals Required";
      case "tower": return "Tower Overview";
      default: return "Agent Response";
    }
  };

  const addErrorCard = (prompt: string) => {
    const errorCard: AgentCard = {
      id: Date.now().toString(),
      agent: "compliance",
      title: "Error",
      timestamp: new Date(),
      streamData: {
        steps: [{
          title: "Error",
          description: "Failed to start conversation",
          timestamp: moment().format("hh:mm:ss"),
        }],
      },
      prompt,
    };
    setActiveCards(prev => [...prev, errorCard]);
  };

  const clearConversation = () => {
    setCurrentConversation(null);
    setActiveCards([]);
    setActiveConversations(new Map());
    localStorage.removeItem("activeConversations");
  };

  return {
    activeCards,
    setActiveCards,
    isTyping,
    streamingCard,
    setStreamingCard,
    currentConversation,
    sendMessage,
    clearConversation,
  };
};