import { NextRequest, NextResponse } from 'next/server';

// Verify Telegram WebApp data
export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ verified: false, error: 'No initData provided' }, { status: 400 });
    }

    // Forward the request to Pocketbase's custom API endpoint
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090';
    const response = await fetch(`${pbUrl}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        initData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from Pocketbase:', data);
      return NextResponse.json(
        { verified: false, error: data.error || 'Failed to verify Telegram data' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 });
  }
}
