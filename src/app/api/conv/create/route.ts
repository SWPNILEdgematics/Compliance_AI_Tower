import { NextRequest, NextResponse } from 'next/server';

// Handle GET requests - for testing
export async function GET() {
  console.log('✅ GET /api/conv/create called');
  return NextResponse.json({ 
    message: 'GET endpoint is working',
    availableMethods: ['GET', 'POST', 'OPTIONS']
  });
}

// Handle POST requests - your main functionality
export async function POST(request: NextRequest) {
  console.log('✅ POST /api/conv/create called');
  
  try {
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

    // Parse the request body
    const body = await request.json();
    const { agentType } = body;

    console.log('Request body:', { agentType });

    if (!agentType) {
      return NextResponse.json(
        { error: 'Missing required field: agentType' },
        { status: 400 }
      );
    }

    const ORG_ID = 'f9f0d317-ce64-4cba-8379-696cfeacbc42';
    const APP_ID = '9aeea00b-ec69-4291-9273-ee287306a331';

    // External API URL
    //https://api.genx-dev.insightgen.ai/chat-engine/api/v1/app/9aeea00b-ec69-4291-9273-ee287306a331/conv
    const url = `https://api.genx-dev.insightgen.ai/chat-engine/api/v1/app/${APP_ID}/conv`;

    const requestBody = {
      convTitle: `New conversation-${agentType}`,
      modelName: 'gpt-mini',
      isPrivate: false,
      tagIds: [],
      responseType: 'balanced',
    };

    console.log('Calling external API:', url);
    console.log('Request body for external API:', requestBody);

    // Make the request to the external API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-tenant-id': xtenantId,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        { error: 'External API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('External API response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
    },
  });
}