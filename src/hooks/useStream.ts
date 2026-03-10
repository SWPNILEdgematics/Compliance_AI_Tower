// hooks/useStream.ts
import { useRef, useCallback, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import moment from 'moment';

export interface StreamMessage {
  step?: string;
  data?: any;
  node_status?: string;
  stream?: string;
  status?: string;
  run_type?: string;
  node_display_name?: string;
  start_time?: string;
  node_id?: string;
  error?: { message: string };
}

export interface ToolResponseData {
  type: 'table' | 'markdown' | 'options' | 'text';
  content: any;
  title?: string;
  timestamp?: string;
  toolName?: string;
}

export const useStream = () => {
  const activeStreamControllers = useRef<Map<string, AbortController>>(new Map());
  const activeStreamCleanups = useRef<Map<string, () => void>>(new Map());

  const parseToolResponse = useCallback((
    toolName: string, 
    responseData: any, 
    timestamp?: string
  ): ToolResponseData => {
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

      // Handle librarian_agent responses
      if (toolName === 'librarian_agent' && responseData?.response?.checklist) {
        return formatChecklistResponse(responseData.response.checklist, timestamp, toolName);
      }

      // Handle reporting_agent responses
      if (toolName === 'reporting_agent' && responseData?.response?.report_markdown) {
        return {
          type: 'markdown',
          title: 'Audit Report',
          content: responseData.response.report_markdown.replace(/\\n/g, '\n'),
          timestamp,
          toolName
        };
      }

      // Handle findings array
      if (responseData?.findings && Array.isArray(responseData.findings)) {
        return formatFindingsResponse(responseData, timestamp, toolName);
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
  }, []);

  const formatChecklistResponse = useCallback((checklist: any, timestamp?: string, toolName?: string): ToolResponseData => {
    const items = Object.values(checklist);
    if (items.length > 0 && typeof items[0] === 'object') {
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
        content: { headers, rows },
        timestamp,
        toolName
      };
    }
    
    return {
      type: 'text',
      title: 'Compliance Checklist',
      content: JSON.stringify(checklist, null, 2),
      timestamp,
      toolName
    };
  }, []);

  const formatFindingsResponse = useCallback((responseData: any, timestamp?: string, toolName?: string): ToolResponseData => {
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
      timestamp,
      toolName
    };
  }, []);

  const connectToStream = useCallback((
    runId: string,
    accessToken: string,
    onMessage: (message: StreamMessage) => void,
    onError: (error: any) => void,
    onClose: () => void
  ) => {
    // Don't connect for summary_request
    if (runId === "summary_request") {
      return () => {};
    }

    // Abort existing stream for this runId if any
    if (activeStreamControllers.current.has(runId)) {
      console.log(`Aborting existing stream for runId: ${runId}`);
      activeStreamControllers.current.get(runId)?.abort();
      activeStreamControllers.current.delete(runId);
    }

    // Clean up any existing cleanup function
    if (activeStreamCleanups.current.has(runId)) {
      activeStreamCleanups.current.get(runId)?.();
      activeStreamCleanups.current.delete(runId);
    }

    const controller = new AbortController();
    activeStreamControllers.current.set(runId, controller);
    
    const SSE_CHAT_URL = `/api/stream?runId=${runId}`;
    const selectedTenant = "e6e0a6cc-c509-45d4-b5a7-b92c619cb343";

    // Set a timeout to detect stale connections
    const connectionTimeout = setTimeout(() => {
      if (activeStreamControllers.current.has(runId)) {
        console.log(`Connection timeout for runId: ${runId}`);
        controller.abort();
        activeStreamControllers.current.delete(runId);
        onError(new Error('Connection timeout'));
      }
    }, 900000); // 15 minutes timeout

    // Track if we've already closed to prevent multiple calls
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      
      clearTimeout(connectionTimeout);
      if (activeStreamControllers.current.get(runId) === controller) {
        console.log(`Cleaning up stream for runId: ${runId}`);
        controller.abort();
        activeStreamControllers.current.delete(runId);
        activeStreamCleanups.current.delete(runId);
      }
    };

    // Store cleanup function
    activeStreamCleanups.current.set(runId, cleanup);

    fetchEventSource(SSE_CHAT_URL, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${accessToken}`,
        "x-tenant-id": selectedTenant,
      },
      signal: controller.signal,
      onmessage: (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          onMessage(parsedData);
          
          // Check for CLOSED status in the message
          if (parsedData.status === "<CLOSED>") {
            console.log(`Received CLOSED status for runId: ${runId}`);
            cleanup();
            onClose();
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      },
      onerror: (error) => {
        console.error("SSE Error for runId:", runId, error);
        if (!closed) {
          cleanup();
          onError(error);
        }
      },
      onclose: () => {
        console.log("Stream connection closed for runId:", runId);
        if (!closed) {
          cleanup();
          onClose();
        }
      },
    }).catch(error => {
      // Handle fetch errors
      if (!closed) {
        console.error("Fetch error for runId:", runId, error);
        cleanup();
        onError(error);
      }
    });

    // Return cleanup function
    return cleanup;
  }, []);

  // Cleanup all streams on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up all streams on hook unmount');
      activeStreamCleanups.current.forEach((cleanup, runId) => {
        console.log(`Cleaning up stream for runId: ${runId}`);
        cleanup();
      });
      activeStreamControllers.current.clear();
      activeStreamCleanups.current.clear();
    };
  }, []);

  const abortAllStreams = useCallback(() => {
    console.log('Aborting all streams');
    activeStreamCleanups.current.forEach((cleanup, runId) => {
      console.log(`Aborting stream for runId: ${runId}`);
      cleanup();
    });
    activeStreamControllers.current.clear();
    activeStreamCleanups.current.clear();
  }, []);

  const abortStream = useCallback((runId: string) => {
    if (activeStreamCleanups.current.has(runId)) {
      console.log(`Aborting stream for runId: ${runId}`);
      activeStreamCleanups.current.get(runId)?.();
    } else if (activeStreamControllers.current.has(runId)) {
      console.log(`Force aborting stream for runId: ${runId}`);
      activeStreamControllers.current.get(runId)?.abort();
      activeStreamControllers.current.delete(runId);
    }
  }, []);

  // Debug logging for active streams
  useEffect(() => {
    const interval = setInterval(() => {
      const activeCount = activeStreamControllers.current.size;
      if (activeCount > 0) {
        console.log('Active streams:', {
          controllers: Array.from(activeStreamControllers.current.keys()),
          cleanups: Array.from(activeStreamCleanups.current.keys())
        });
      }
    }, 10000); // Log every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    connectToStream,
    abortAllStreams,
    abortStream,
    parseToolResponse
  };
};