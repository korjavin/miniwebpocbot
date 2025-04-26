'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useQuestions } from '@/contexts/QuestionContext';
import { getTelegramWebApp, initTelegramWebApp, isTelegramWebAppAvailable } from '@/lib/telegram';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function QuestionPage() {
  const params = useParams();
  const questionId = params.id as string;

  const { user, loading: userLoading, error: userError, refreshUser } = useUser();
  const {
    currentQuestion,
    setCurrentQuestionId,
    userBet,
    refreshQuestions
  } = useQuestions();

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (isTelegramWebAppAvailable()) {
      initTelegramWebApp();
    }

    // Set the current question ID
    setCurrentQuestionId(questionId);

    // Cleanup
    return () => {
      setCurrentQuestionId(null);
    };
  }, [questionId, setCurrentQuestionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentQuestion) {
      setError('User or question not available');
      return;
    }

    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    if (betAmount <= 0) {
      setError('Bet amount must be greater than 0');
      return;
    }

    if (betAmount > user.balance) {
      setError('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get Telegram WebApp data for verification
      const webApp = getTelegramWebApp();
      const initData = webApp?.initData || '';

      // Call the API to place the bet
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegram_id,
          questionId,
          selectedOption,
          amount: betAmount,
          initData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      // Update the user and refresh questions
      await refreshUser();
      await refreshQuestions();

      setSuccess('Your bet has been placed successfully!');

      // Close the WebApp after a short delay
      setTimeout(() => {
        if (isTelegramWebAppAvailable()) {
          const webApp = getTelegramWebApp();
          if (webApp) {
            webApp.close();
          }
        }
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load the question</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Error</h2>
          <p className="mb-4">{userError}</p>
          <p className="text-sm text-gray-500">
            This app is designed to work within Telegram. Please open it from a Telegram bot.
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Question Not Found</h2>
          <p className="mb-4">The question you&apos;re looking for doesn&apos;t exist or has been closed.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Questions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="p-4 max-w-md mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Questions
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{currentQuestion.question_text}</h1>
        </header>

      <main>
        {currentQuestion.status === 'closed' ? (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Question Closed</h2>
            <p className="mb-2">
              This question has been closed. The correct answer was:{' '}
              <span className="font-semibold">{currentQuestion.correct_option}</span>
            </p>
            {userBet && (
              <div className="mt-4 p-3 bg-white rounded border">
                <p>
                  You bet <span className="font-semibold">{userBet.amount} points</span> on{' '}
                  <span className="font-semibold">{userBet.selected_option}</span>
                </p>
                <p className="mt-1 text-sm">
                  {userBet.selected_option === currentQuestion.correct_option
                    ? '🎉 Congratulations! You won this bet.'
                    : '😔 Sorry, you lost this bet.'}
                </p>
              </div>
            )}
          </div>
        ) : userBet ? (
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Bet</h2>
            <p>
              You have already placed a bet on this question:
            </p>
            <div className="mt-4 p-4 bg-white rounded border">
              <p>
                You bet <span className="font-semibold">{userBet.amount} points</span> on{' '}
                <span className="font-semibold">{userBet.selected_option}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Good luck! Results will be announced when the question is closed.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Place Your Bet</h2>

            {error && (
              <div className="bg-red-50 p-3 rounded mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 p-3 rounded mb-4 text-green-600 text-sm">
                {success}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select an option:</label>
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label key={option} className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={() => setSelectedOption(option)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Bet amount:</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  min="1"
                  max={user?.balance || 0}
                  className="border rounded p-2 w-full"
                />
                <span className="ml-2">points</span>
              </div>
              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setBetAmount(10)}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  10
                </button>
                <button
                  type="button"
                  onClick={() => setBetAmount(50)}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  50
                </button>
                <button
                  type="button"
                  onClick={() => setBetAmount(100)}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  100
                </button>
                <button
                  type="button"
                  onClick={() => setBetAmount(user?.balance || 0)}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  All In
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedOption}
              className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </form>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Select an option and bet your points</li>
            <li>• If you guess correctly, you&apos;ll win points from the losing bets</li>
            <li>• Your winnings are proportional to your bet amount</li>
            <li>• You can only place one bet per question</li>
          </ul>
        </div>
      </main>
      </div>
    </div>
  );
}
