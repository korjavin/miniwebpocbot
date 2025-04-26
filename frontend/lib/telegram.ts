'use client';

// Define the Telegram WebApp interface
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: number;
    hash: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive: boolean): void;
    hideProgress(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}

// Extend the Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Check if Telegram WebApp is available
export function isTelegramWebAppAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// Get the Telegram WebApp instance
export function getTelegramWebApp(): TelegramWebApp | null {
  if (isTelegramWebAppAvailable()) {
    return window.Telegram!.WebApp;
  }
  return null;
}

// Initialize the Telegram WebApp
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

// Get the Telegram user from the WebApp
export function getTelegramUser() {
  const webApp = getTelegramWebApp();
  if (webApp && webApp.initDataUnsafe.user) {
    return webApp.initDataUnsafe.user;
  }
  return null;
}

// Verify the Telegram WebApp data on the server
export async function verifyTelegramWebAppData(initData: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify Telegram data');
    }

    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

// Close the Telegram WebApp
export function closeTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.close();
  }
}

// Set up the main button
export function setupMainButton(
  text: string,
  onClick: () => void,
  color?: string,
  textColor?: string
): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    const mainButton = webApp.MainButton;
    mainButton.setText(text);

    if (color) {
      mainButton.color = color;
    }

    if (textColor) {
      mainButton.textColor = textColor;
    }

    mainButton.onClick(onClick);
    mainButton.show();
  }
}

// Clean up the main button
export function cleanupMainButton(onClick: () => void): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.MainButton.offClick(onClick);
    webApp.MainButton.hide();
  }
}
