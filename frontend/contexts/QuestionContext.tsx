'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getOpenQuestions, getQuestion, getUserBetForQuestion, Question, Bet } from '../lib/pocketbase';
import { useUser } from './UserContext';

interface QuestionContextType {
  questions: Question[];
  loading: boolean;
  error: string | null;
  refreshQuestions: () => Promise<void>;
  currentQuestion: Question | null;
  setCurrentQuestionId: (id: string | null) => void;
  userBet: Bet | null;
  loadingBet: boolean;
}

const QuestionContext = createContext<QuestionContextType>({
  questions: [],
  loading: true,
  error: null,
  refreshQuestions: async () => {},
  currentQuestion: null,
  setCurrentQuestionId: () => {},
  userBet: null,
  loadingBet: false,
});

export const useQuestions = () => useContext(QuestionContext);

interface QuestionProviderProps {
  children: ReactNode;
}

export const QuestionProvider = ({ children }: QuestionProviderProps) => {
  const { user } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [loadingBet, setLoadingBet] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const openQuestions = await getOpenQuestions();
      setQuestions(openQuestions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const fetchCurrentQuestion = async () => {
      if (currentQuestionId) {
        try {
          const question = await getQuestion(currentQuestionId);
          setCurrentQuestion(question);
        } catch (err) {
          console.error(`Error fetching question ${currentQuestionId}:`, err);
          setCurrentQuestion(null);
        }
      } else {
        setCurrentQuestion(null);
      }
    };

    fetchCurrentQuestion();
  }, [currentQuestionId]);

  useEffect(() => {
    const fetchUserBet = async () => {
      if (user && currentQuestionId) {
        setLoadingBet(true);
        try {
          const bet = await getUserBetForQuestion(user.id, currentQuestionId);
          setUserBet(bet);
        } catch (err) {
          console.error(`Error fetching user bet for question ${currentQuestionId}:`, err);
          setUserBet(null);
        } finally {
          setLoadingBet(false);
        }
      } else {
        setUserBet(null);
      }
    };

    fetchUserBet();
  }, [user, currentQuestionId]);

  const refreshQuestions = async () => {
    await fetchQuestions();

    // Also refresh current question if needed
    if (currentQuestionId) {
      const question = await getQuestion(currentQuestionId);
      setCurrentQuestion(question);

      // Refresh user bet
      if (user) {
        const bet = await getUserBetForQuestion(user.id, currentQuestionId);
        setUserBet(bet);
      }
    }
  };

  return (
    <QuestionContext.Provider
      value={{
        questions,
        loading,
        error,
        refreshQuestions,
        currentQuestion,
        setCurrentQuestionId,
        userBet,
        loadingBet,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};
