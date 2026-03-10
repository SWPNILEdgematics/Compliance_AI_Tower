import { useEffect, useCallback, useState } from 'react';
import { useStream } from '@/hooks/useStream';

export function StreamComponent({ runId }: { runId: string }) {
  const { connectToStream, abortStream } = useStream();
  const [messages, setMessages] = useState<any[]>([]);

  const handleMessage = useCallback((message: any) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Stream error:', error);
  }, []);

  const handleClose = useCallback(() => {
    console.log('Stream closed');
  }, []);

  useEffect(() => {
    if (!runId || runId === 'summary_request') return;

    const accessToken = localStorage.getItem('accessToken') || '';
    
    // Connect to stream
    const cleanup = connectToStream(
      runId,
      accessToken,
      handleMessage,
      handleError,
      handleClose
    );

    // Cleanup on unmount or when runId changes
    return () => {
      if (cleanup) {
        cleanup();
      } else {
        // Fallback cleanup if connectToStream doesn't return a function
        abortStream(runId);
      }
    };
  }, [runId, connectToStream, abortStream, handleMessage, handleError, handleClose]);

  return (
    <div>
      {/* Render your messages */}
    </div>
  );
}