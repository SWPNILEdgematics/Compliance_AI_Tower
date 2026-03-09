// hooks/useStreamHandler.ts
import { useCallback } from 'react';
import moment from 'moment';
import { AgentCard } from './useConversation';
import { ToolResponseData, useStream } from './useStream';

export const useStreamHandler = (
  setActiveCards: React.Dispatch<React.SetStateAction<AgentCard[]>>,
  setStreamingCard: React.Dispatch<React.SetStateAction<string | null>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { parseToolResponse } = useStream();

  const handleAgentThought = useCallback((cardId: string, thoughtContent: string) => {
    setActiveCards((prev: any) =>
      prev.map((card: any) => {
        if (card.id !== cardId) return card;

        const updatedStreamData = { ...card.streamData, steps: [...(card.streamData?.steps || [])] };
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
          agentStreamData: { ...card.agentStreamData, thoughtsAndtoolsAction: thoughtsAndTools },
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

          const updatedStreamData = { ...card.streamData, steps: [...(card.streamData?.steps || [])] };
          
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

          normalizedToolCalls.forEach((normalizedToolCall) => {
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
            agentStreamData: { ...card.agentStreamData, thoughtsAndtoolsAction: thoughtsAndTools },
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
    } catch (e) {
      console.error("Error parsing TOOLCALLRESULT", e);
    }
  }, [setActiveCards, parseToolResponse]);

  const handleEndResponse = useCallback((
    cardId: string,
    data: any,
    agentId: string,
    resolve: () => void
  ) => {
    if (agentId === "tower") {
      setActiveCards((prev: any) =>
        prev.map((card: any) => {
          if (card.id === cardId) {
            return {
              ...card,
              streamData: { ...card.streamData, steps: [...(card.streamData?.steps || []), {
                title: "Agent Response",
                description: "Agent completed processing",
                timestamp: moment().format("hh:mm:ss"),
              }]},
              streaming: false,
            };
          }
          return card;
        })
      );
      
      setStreamingCard(null);
      setIsTyping(false);
      resolve();
      return;
    }

    // Process final response
    const finalResponseData = extractFinalResponse(data);
    
    setActiveCards((prev: any) =>
      prev.map((card: any) => {
        if (card.id === cardId) {
          return {
            ...card,
            streamData: { ...card.streamData, steps: [...(card.streamData?.steps || []), {
              title: "Agent Response",
              description: "Agent completed processing",
              timestamp: moment().format("hh:mm:ss"),
            }]},
            finalResponse: finalResponseData,
            streaming: false,
          };
        }
        return card;
      })
    );

    setStreamingCard(null);
    setIsTyping(false);
    resolve();
  }, [setActiveCards, setStreamingCard, setIsTyping]);

  const extractFinalResponse = (data: any): ToolResponseData => {
    let responseData = null;
    let responseContent = "";

    if (data?.response) {
      responseData = data.response;
      responseContent = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
    } else if (data?.content?.[0]?.text) {
      responseContent = data.content[0].text;
      responseData = { text: data.content[0].text };
    } else if (typeof data === 'string') {
      responseContent = data;
      responseData = { text: data };
    } else if (data && typeof data === 'object') {
      responseData = data;
      responseContent = JSON.stringify(data);
    }

    // Determine response type
    if (typeof responseData === 'string' && responseData.includes('|') && responseData.includes('\n')) {
      return {
        type: 'markdown',
        title: 'Final Response',
        content: responseData,
        timestamp: moment().format("hh:mm:ss")
      };
    } else if (responseData?.report_markdown) {
      return {
        type: 'markdown',
        title: 'Audit Report',
        content: responseData.report_markdown.replace(/\\n/g, '\n'),
        timestamp: moment().format("hh:mm:ss")
      };
    } else if (responseData?.checklist) {
      return formatChecklistResponse(responseData.checklist);
    } else if (responseData?.findings && Array.isArray(responseData.findings)) {
      return formatFindingsResponse(responseData);
    } else if (Array.isArray(responseData) && responseData.length > 0) {
      const headers = Object.keys(responseData[0]);
      return {
        type: 'table',
        title: 'Results',
        content: { headers, rows: responseData },
        timestamp: moment().format("hh:mm:ss")
      };
    }

    return {
      type: 'text',
      title: 'Agent Response',
      content: responseContent || 'No response text available',
      timestamp: moment().format("hh:mm:ss")
    };
  };

  const formatChecklistResponse = (checklist: any): ToolResponseData => {
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
      content: { headers: keys, rows },
      timestamp: moment().format("hh:mm:ss")
    };
  };

  const formatFindingsResponse = (responseData: any): ToolResponseData => {
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
      content: { headers, rows },
      timestamp: moment().format("hh:mm:ss")
    };
  };

  return {
    handleAgentThought,
    handleToolCall,
    handleToolResult,
    handleEndResponse,
  };
};