import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get('runId');
  
  if (!runId) {
    return new Response('runId is required', { status: 400 });
  }
  const url = `https://api.genx-dev.insightgen.ai/agent-runner/api/v1/stream/sse/${runId}`;
  try {
    console.log('Connecting to stream with url:', url);
     // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        console.log('Auth header present:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json(
            { error: 'Missing or invalid Authorization header' },
            { status: 401 }
          );
        }
        
        const accessToken = authHeader.substring(7);
        const xtenantId = request.headers.get('x-tenant-id') || 'e6e0a6cc-c509-45d4-b5a7-b92c619cb343';
    

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/event-stream',        
        'Authorization': `Bearer ${accessToken}`,
        'x-tenant-id': xtenantId,
      },
    });

    if (!response.ok) {
      return new Response(`Failed to connect to stream: ${response.status}`, { status: response.status });
    }

    // Return the stream response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        
      },
    });
  } catch (error) {
    console.error('Error in stream API route:', error);
    return new Response('Internal server error', { status: 500 });
  }
}