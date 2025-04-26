'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import pb, { Question } from '@/lib/pocketbase';

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    options: ['', ''],
    status: 'open'
  });
  const [channelId, setChannelId] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('questions').getFullList({
        sort: '-created',
      });
      setQuestions(records as unknown as Question[]);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Add option to the new question
  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, '']
    });
  };

  // Remove option from the new question
  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) {
      return; // Keep at least 2 options
    }
    const updatedOptions = [...newQuestion.options];
    updatedOptions.splice(index, 1);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  // Update option value
  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  // Create a new question
  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!newQuestion.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (newQuestion.options.some(opt => !opt.trim())) {
      setError('All options must have a value');
      return;
    }

    try {
      const data = {
        question_text: newQuestion.question_text,
        options: newQuestion.options,
        status: newQuestion.status,
        correct_option: null
      };

      await pb.collection('questions').create(data);

      setSuccessMessage('Question created successfully!');
      setNewQuestion({
        question_text: '',
        options: ['', ''],
        status: 'open'
      });

      fetchQuestions();
    } catch (err) {
      console.error('Error creating question:', err);
      setError('Failed to create question');
    }
  };

  // Close a question and set the correct option
  const closeQuestion = async (questionId: string, correctOption: string) => {
    try {
      await pb.collection('questions').update(questionId, {
        status: 'closed',
        correct_option: correctOption
      });

      setSuccessMessage('Question closed successfully!');
      fetchQuestions();
    } catch (err) {
      console.error('Error closing question:', err);
      setError('Failed to close question');
    }
  };

  // Post a question to Telegram
  const postQuestionToTelegram = async (questionId: string) => {
    if (!channelId.trim()) {
      setError('Channel ID is required');
      return;
    }

    try {
      const response = await fetch('/api/telegram/post-question', {
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
        throw new Error(data.error || 'Failed to post question');
      }

      setSuccessMessage('Question posted to Telegram successfully!');
    } catch (err) {
      console.error('Error posting question to Telegram:', err);
      setError((err as Error).message || 'Failed to post question to Telegram');
    }
  };

  // Post results to Telegram
  const postResultsToTelegram = async (questionId: string) => {
    if (!channelId.trim()) {
      setError('Channel ID is required');
      return;
    }

    try {
      const response = await fetch('/api/telegram/post-result', {
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
        throw new Error(data.error || 'Failed to post results');
      }

      setSuccessMessage('Results posted to Telegram successfully!');
    } catch (err) {
      console.error('Error posting results to Telegram:', err);
      setError((err as Error).message || 'Failed to post results to Telegram');
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage prediction questions and results</p>
      </header>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-red-600">
          {error}
          <button
            className="ml-2 text-sm underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 p-4 rounded-lg mb-6 text-green-600">
          {successMessage}
          <button
            className="ml-2 text-sm underline"
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Question</h2>
        <form onSubmit={createQuestion} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Question Text:</label>
            <input
              type="text"
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
              className="border rounded p-2 w-full"
              placeholder="e.g., Will it rain tomorrow?"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Options:</label>
            {newQuestion.options.map((option, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="border rounded p-2 flex-grow"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="ml-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  disabled={newQuestion.options.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Add Option
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Status:</label>
            <select
              value={newQuestion.status}
              onChange={(e) => setNewQuestion({...newQuestion, status: e.target.value})}
              className="border rounded p-2 w-full"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
          >
            Create Question
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Telegram Integration</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Channel ID:</label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="e.g., -1001234567890"
            />
            <p className="text-sm text-gray-500 mt-1">
              This is the ID of your Telegram channel where the bot will post messages.
              It usually starts with -100 for public channels.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Questions</h2>

        {loading ? (
          <div className="text-center p-8">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">No questions available.</p>
            <p className="text-sm mt-2">Create your first question above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{question.question_text}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    question.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {question.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Options:</h4>
                  <ul className="space-y-1">
                    {question.options.map((option, index) => (
                      <li
                        key={index}
                        className={`p-2 rounded ${
                          question.correct_option === option
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        {option}
                        {question.status === 'open' && (
                          <button
                            onClick={() => closeQuestion(question.id, option)}
                            className="ml-2 text-sm text-blue-600 hover:underline"
                          >
                            Set as correct
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {question.status === 'open' && (
                    <button
                      onClick={() => postQuestionToTelegram(question.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={!channelId.trim()}
                    >
                      Post to Telegram
                    </button>
                  )}

                  {question.status === 'closed' && question.correct_option && (
                    <button
                      onClick={() => postResultsToTelegram(question.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={!channelId.trim()}
                    >
                      Post Results to Telegram
                    </button>
                  )}

                  <Link
                    href={`/question/${question.id}`}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  >
                    View Question Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
