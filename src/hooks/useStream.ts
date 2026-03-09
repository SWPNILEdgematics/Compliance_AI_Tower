// hooks/useStream.ts
import { useRef, useCallback } from 'react';
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

  const formatChecklistResponse = (checklist: any, timestamp?: string, toolName?: string): ToolResponseData => {
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
  };

  const formatFindingsResponse = (responseData: any, timestamp?: string, toolName?: string): ToolResponseData => {
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
  };

  const connectToStream = useCallback((
    runId: string,
    accessToken: string,
    onMessage: (message: StreamMessage) => void,
    onError: (error: any) => void,
    onClose: () => void
  ) => {
    // Abort existing stream for this runId if any
    if (activeStreamControllers.current.has(runId)) {
      activeStreamControllers.current.get(runId)?.abort();
      activeStreamControllers.current.delete(runId);
    }

    const controller = new AbortController();
    activeStreamControllers.current.set(runId, controller);

    const SSE_CHAT_URL = `/api/stream?runId=${runId}`;
    const selectedTenant = "e6e0a6cc-c509-45d4-b5a7-b92c619cb343";

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
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      },
      onerror: (error) => {
        console.error("SSE Error:", error);
        activeStreamControllers.current.delete(runId);
        onError(error);
      },
      onclose: () => {
        console.log("Stream connection closed for runId:", runId);
        activeStreamControllers.current.delete(runId);
        onClose();
      },
    });

    return () => {
      controller.abort();
      activeStreamControllers.current.delete(runId);
    };
  }, []);

  const abortAllStreams = useCallback(() => {
    activeStreamControllers.current.forEach((controller) => {
      controller.abort();
    });
    activeStreamControllers.current.clear();
  }, []);

  return {
    connectToStream,
    abortAllStreams,
    parseToolResponse
  };
};