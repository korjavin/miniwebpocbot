'use client';

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useQuestions } from '@/contexts/QuestionContext';
import { initTelegramWebApp, isTelegramWebAppAvailable } from '@/lib/telegram';
import Link from 'next/link';

export default function Home() {
  const { user, loading: userLoading, error: userError } = useUser();
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions();

  useEffect(() => {
    // Initialize Telegram WebApp
    if (isTelegramWebAppAvailable()) {
      initTelegramWebApp();
    }
  }, []);

  if (userLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we set things up</p>
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

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Prediction Game</h1>
        {user && (
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Welcome, {user.name}</p>
            <p className="font-semibold">
              Balance: <span className="text-green-600">{user.balance} points</span>
            </p>
          </div>
        )}
      </header>

      <main>
        <h2 className="text-xl font-semibold mb-4">Open Questions</h2>

        {questionsError && (
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-500">{questionsError}</p>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">No open questions available right now.</p>
            <p className="text-sm mt-2">Check back later for new predictions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link
                href={`/question/${question.id}`}
                key={question.id}
                className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
              >
                <h3 className="font-medium mb-2">{question.question_text}</h3>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {question.options.length} options available
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    Place your bet →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
