// hooks/useStreamHandler.ts
import { useCallback } from 'react';
import moment from 'moment';
import { AgentCard } from './useConversation';
import { ToolResponseData } from './useStream';

export const useStreamHandler = (
  setActiveCards: React.Dispatch<React.SetStateAction<AgentCard[]>>,
  setStreamingCard: React.Dispatch<React.SetStateAction<string | null>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  parseToolResponse: (toolName: string, responseData: any, timestamp?: string) => ToolResponseData
) => {
  const handleAgentThought = useCallback((cardId: string, thoughtContent: string) => {
    setActiveCards((prev: any) =>
      prev.map((card: any) => {
        if (card.id !== cardId) return card;

        const updatedStreamData = { 
          ...card.streamData, 
          steps: [...(card.streamData?.steps || [])] 
        };
        updatedStreamData.steps.push({
          title: "Agent Thought",
          description: thoughtContent,
          timestamp: moment().format("hh:mm:ss"),
        });

        const thoughtsAndTools = [...(card.agentStreamData?.thoughtsAndtoolsAction || [])];
        thoughtsAndTools.push({ thought: thoughtContent, toolActions: [] });

        return {
          ...card,
          streamData: updatedStreamData,
          agentStreamData: { 
            ...card.agentStreamData, 
            thoughtsAndtoolsAction: thoughtsAndTools 
          },
        };
      })
    );
  }, [setActiveCards]);

  const handleToolCall = useCallback((cardId: string, toolCall: any) => {
    try {
      const toolName = toolCall?.content?.[0]?.name || toolCall?.tool_name;
      
      // Handle get_user_choice
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
                return {
                  ...card,
                  toolResponses: [...(card.toolResponses || []), optionsResponse]
                };
              }
              return card;
            })
          );
        }
      }

      // Normalize tool calls
      const normalizedToolCalls: { tool_id: any; tool_name: any; tool_kwargs: any; }[] = [];
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

      setActiveCards((prev: any) =>
        prev.map((card: any) => {
          if (card.id !== cardId) return card;

          const updatedStreamData = { 
            ...card.streamData, 
            steps: [...(card.streamData?.steps || [])] 
          };
          
          normalizedToolCalls.forEach((tc) => {
            updatedStreamData.steps.push({
              title: `Calling: ${tc.tool_name}`,
              description: `Calling tool with arguments: ${JSON.stringify(tc.tool_kwargs)}`,
              timestamp: moment().format("hh:mm:ss"),
              toolName: tc.tool_name,
              toolArgs: tc.tool_kwargs,
            });
          });

          const thoughtsAndTools = [...(card.agentStreamData?.thoughtsAndtoolsAction || [])];
          if (thoughtsAndTools.length === 0) {
            thoughtsAndTools.push({ thought: "", toolActions: [] });
          }

          const lastItemIndex = thoughtsAndTools.length - 1;
          const lastItem = { ...thoughtsAndTools[lastItemIndex] };

          normalizedToolCalls.forEach((normalizedToolCall: { tool_id: any; tool_name: any; tool_kwargs: any; }) => {
            const existingToolAction = lastItem.toolActions.find(
              (action: any) => 
                action.action === normalizedToolCall.tool_name &&
                action.argument === JSON.stringify(normalizedToolCall.tool_kwargs, null, 2)
            );
            
            if (!existingToolAction) {
              lastItem.toolActions.push({
                action: normalizedToolCall.tool_name,
                argument: JSON.stringify(normalizedToolCall.tool_kwargs, null, 2),
                output: "",
                toolId: normalizedToolCall.tool_id,
              });
            }
          });

          thoughtsAndTools[lastItemIndex] = lastItem;

          return {
            ...card,
            streamData: updatedStreamData,
            agentStreamData: { 
              ...card.agentStreamData, 
              thoughtsAndtoolsAction: thoughtsAndTools 
            },
          };
        })
      );
    } catch (e) {
      console.error("Error parsing TOOLCALL", e);
    }
  }, [setActiveCards]);

  const handleToolResult = useCallback((cardId: string, toolResult: any) => {
    try {
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
              return {
                ...card,
                toolResponses: [...(card.toolResponses || []), parsedResponse]
              };
            }
            return card;
          })
        );
      }

      // Also update the stream steps with tool response info
      setActiveCards((prev: any) =>
        prev.map((card: any) => {
          if (card.id !== cardId) return card;

          const updatedStreamData = { 
            ...card.streamData, 
            steps: [...(card.streamData?.steps || [])] 
          };
          
          updatedStreamData.steps.push({
            title: `Response from ${toolName || 'tool'}`,
            description: `Received response from tool`,
            timestamp: moment().format("hh:mm:ss"),
            toolResponse: responseData,
          });

          return {
            ...card,
            streamData: updatedStreamData,
          };
        })
      );
    } catch (e) {
      console.error("Error parsing TOOLCALLRESULT", e);
    }
  }, [setActiveCards, parseToolResponse]);

  // Store final responses in an array to accumulate multiple END_RESPONSE events
 const handleEndResponse = useCallback((
  cardId: string,
  data: any,
  agentId: string,
  resolve: () => void,
  isStreamClosed: boolean = false
) => {

  const extractMarkdown = (input: any): string => {
    if (!input) return "";

    if (typeof input === "string") return input;

    if (Array.isArray(input)) {
      for (const item of input) {
        const result = extractMarkdown(item);
        if (result) return result;
      }
    }

    if (typeof input === "object") {
      const keys = ["response", "text", "content", "message"];

      for (const key of keys) {
        if (input[key]) {
          if (typeof input[key] === "string") return input[key];
          return extractMarkdown(input[key]);
        }
      }
    }

    return "";
  };

  try {
    let markdownContent = extractMarkdown(data);

    if (!markdownContent) {
      markdownContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }

    if (data?.content?.response) {
        // This matches your test data structure
        markdownContent = data.content.response;
        } else if (data?.response && typeof data.response === 'string') {
        // Direct string response
        markdownContent = data.response;
        } else if (data?.content?.[0]?.text) {
        // Content array with text field
        markdownContent = data.content[0].text;
        } else if (data?.content?.[0]?.response) {
        // Content array with response field
        const response = data.content[0].response;
        markdownContent = typeof response === 'string' ? response : JSON.stringify(response);
        } else if (data?.chat_response?.response) {
        // Chat response structure
        const response = data.chat_response.response;
        markdownContent = typeof response === 'string' ? response : JSON.stringify(response);
        } else if (typeof data === 'string') {
        // Direct string data
        markdownContent = data;
        } else if (data?.content && typeof data.content === 'string') {
        // Content as string
        markdownContent = data.content;
        } else if (data?.text) {
        // Text field
        markdownContent = data.text;
        } else if (data?.message) {
        // Message field
        markdownContent = data.message;
        } else {
        // Fallback: stringify the whole object
        markdownContent = JSON.stringify(data, null, 2);
        }
    // Clean escaped markdown
    markdownContent = markdownContent
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .trim();

      
    const finalResponseData: ToolResponseData = {
      type: "markdown",
      title: "Agent Response",
      content: markdownContent,
      timestamp: moment().format("HH:mm:ss"),
    };

    setActiveCards((prev: any) =>
      prev.map((card: any) => {
        if (card.id !== cardId) return card;

        return {
          ...card,
          streamData: {
            ...card.streamData,
            steps: [
              ...(card.streamData?.steps || []),
              {
                title: "Agent Response",
                description: "Agent completed processing",
                timestamp: moment().format("HH:mm:ss"),
              },
            ],
          },
          finalResponses: [...(card.finalResponses || []), finalResponseData],
          streaming: !isStreamClosed,
        };
      })
    );

    if (isStreamClosed) {
      setStreamingCard(null);
      setIsTyping(false);
    }

  } catch (error) {
    console.error("Error processing agent response:", error);
  } finally {
    resolve();
  }

}, [setActiveCards, setStreamingCard, setIsTyping]);


  return {
    handleAgentThought,
    handleToolCall,
    handleToolResult,
    handleEndResponse,
  };
};