import { NextRequest, NextResponse } from 'next/server';

// Simple polling-based socket functionality for Vercel compatibility
// This replaces Socket.IO with HTTP polling

const connections = new Map<string, { messages: any[], lastPoll: number }>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId') || 'default';
  const lastMessageId = url.searchParams.get('lastMessageId') || '0';

  // Initialize client connection if not exists
  if (!connections.has(clientId)) {
    connections.set(clientId, { messages: [], lastPoll: Date.now() });
  }

  const client = connections.get(clientId)!;

  // Check for new messages since last poll
  const newMessages = client.messages.filter(msg => msg.id > parseInt(lastMessageId));

  return NextResponse.json({
    messages: newMessages,
    timestamp: Date.now()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, clientId = 'default' } = body;

    // Initialize client connection if not exists
    if (!connections.has(clientId)) {
      connections.set(clientId, { messages: [], lastPoll: Date.now() });
    }

    // Add message with unique ID
    const messageId = Date.now() + Math.random();
    const message = {
      id: messageId,
      event,
      data,
      timestamp: Date.now()
    };

    // Broadcast to all clients (simple pub/sub)
    for (const [id, conn] of connections) {
      conn.messages.push(message);
      // Keep only last 100 messages to prevent memory issues
      if (conn.messages.length > 100) {
        conn.messages = conn.messages.slice(-100);
      }
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Socket API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
