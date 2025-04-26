'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTelegramUser, isTelegramWebAppAvailable, verifyTelegramWebAppData, getTelegramWebApp } from '../lib/telegram';
import { getUserByTelegramId, createUser, User } from '../lib/pocketbase';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we're in a Telegram WebApp
      if (!isTelegramWebAppAvailable()) {
        // For development, you might want to use a mock user
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Using mock user');
          const mockUser = {
            id: 'mock-id',
            telegram_id: 12345,
            name: 'Mock User',
            balance: 1000,
          };
          setUser(mockUser);
          setLoading(false);
          return;
        }

        throw new Error('Not in a Telegram WebApp');
      }

      // Get Telegram user
      const telegramUser = getTelegramUser();
      if (!telegramUser) {
        throw new Error('No Telegram user found');
      }

      // Verify Telegram data
      const webApp = getTelegramWebApp();
      if (!webApp) {
        throw new Error('WebApp not available');
      }

      const isVerified = await verifyTelegramWebAppData(webApp.initData);
      if (!isVerified) {
        throw new Error('Telegram data verification failed');
      }

      // Get or create user in Pocketbase
      let pbUser = await getUserByTelegramId(telegramUser.id);

      if (!pbUser) {
        // Create new user
        const name = telegramUser.username ||
                    `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`;

        pbUser = await createUser(telegramUser.id, name);

        if (!pbUser) {
          throw new Error('Failed to create user');
        }
      }

      setUser(pbUser);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    if (user) {
      const refreshedUser = await getUserByTelegramId(user.telegram_id);
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
