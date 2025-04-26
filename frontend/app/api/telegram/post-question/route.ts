import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { questionId, channelId } = await request.json();

    // Validate required fields
    if (!questionId || !channelId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Forward the request to Pocketbase's custom API endpoint
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090';
    const response = await fetch(`${pbUrl}/api/telegram/post-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionId,
        channelId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from Pocketbase:', data);
      return NextResponse.json(
        { error: data.error || 'Failed to post question to Telegram' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error posting question to Telegram:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
