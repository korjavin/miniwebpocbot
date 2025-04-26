import { NextRequest, NextResponse } from 'next/server';
import { placeBet, getUserByTelegramId } from '@/lib/pocketbase';
import { verifyTelegramWebAppData } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { telegramId, questionId, selectedOption, amount, initData } = await request.json();

    // Validate required fields
    if (!telegramId || !questionId || !selectedOption || !amount || !initData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Telegram data
    const isVerified = await verifyTelegramWebAppData(initData);
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Telegram verification failed' },
        { status: 401 }
      );
    }

    // Get user from Pocketbase
    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (amount > user.balance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Place the bet
    const bet = await placeBet(user.id, questionId, selectedOption, amount);

    if (!bet) {
      return NextResponse.json(
        { error: 'Failed to place bet' },
        { status: 500 }
      );
    }

    // Return the updated user and bet
    const updatedUser = await getUserByTelegramId(telegramId);

    return NextResponse.json({
      success: true,
      bet,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error placing bet:', error);

    // Handle specific errors
    const errorObj = error as Error;
    if (errorObj.message?.includes('already placed a bet')) {
      return NextResponse.json(
        { error: 'You have already placed a bet on this question' },
        { status: 400 }
      );
    }

    if (errorObj.message?.includes('Question is not open')) {
      return NextResponse.json(
        { error: 'This question is no longer open for betting' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
