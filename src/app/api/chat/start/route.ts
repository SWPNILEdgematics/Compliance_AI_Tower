import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('✅ POST /api/chat/start called');
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
    const { convId, question, agentId, agentType } = body;

    console.log('API Route received:', { convId, question, agentId, agentType });

    // Validate required fields
    if (!convId || !question || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: convId, question, agentId' },
        { status: 400 }
      );
    }

     if (!agentType) {
      return NextResponse.json(
        { error: 'Missing required field: agentType' },
        { status: 400 }
      );
    }


    const ORG_ID = 'f9f0d317-ce64-4cba-8379-696cfeacbc42';
    const APP_ID = '9aeea00b-ec69-4291-9273-ee287306a331';
    const API_KEY = 'gAAAAABpadaMNeKS5gsCoJI_KlIswU7RDQKXAUFSE35lwUOKKNzgddxC5mIkQF-8-IbvZXA5SB42lIToSw8_oe84iI3lgTLx2yZ9_VJdBJ54GNei1nn7FVGfqVLRGI8RZ5pEEYzh09Po';

    // Determine agent type
    const mappedAgentType = agentType === 'compliance' ? 'AA' : 'AA';

    const url = `https://api.genx-dev.insightgen.ai/agent-runner/api/v1/orgs/${ORG_ID}/app/${APP_ID}/chat/sse`;

    // Prepare the request body for the external API
    const requestBody = {
      convId: convId,
      question: question,
      model: 'gpt-mini',
      fromPlayground: false,
      isStream: true,
      apiKey: API_KEY,
      additionalArgs: {
        isPrivate: false,
        embedModel: 'gemini_embedding',
        rightIds: ['f3530894-e638-4131-8ae1-5ec72777d598'],
        userPrivateFilePaths: [],
        timeout: 60,
        dimSize: 768,
      },
      agentIds: [agentId],
      agentType: mappedAgentType,
    };
    console.log('Request for url API:', url);
    console.log('Calling external API with:', requestBody);

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
      throw new Error(`External API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('External API response data:', data);

    // Return the response to the frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat start API route:', error);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        error: 'Failed to start chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}