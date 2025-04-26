import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');

export interface User {
  id: string;
  telegram_id: number;
  name: string;
  balance: number;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  status: 'open' | 'closed';
  correct_option?: string;
  created: string;
  updated: string;
}

export interface Bet {
  id: string;
  user: string;
  question: string;
  selected_option: string;
  amount: number;
  placed_at: string;
}

// User functions
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  try {
    const record = await pb.collection('users').getFirstListItem(`telegram_id=${telegramId}`);
    return record as unknown as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(telegramId: number, name: string): Promise<User | null> {
  try {
    const data = {
      telegram_id: telegramId,
      name: name,
      balance: 1000, // Default starting balance
    };
    const record = await pb.collection('users').create(data);
    return record as unknown as User;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Question functions
export async function getOpenQuestions(): Promise<Question[]> {
  try {
    const records = await pb.collection('questions').getFullList({
      filter: 'status="open"',
      sort: '-created',
    });
    return records as unknown as Question[];
  } catch (error) {
    console.error('Error fetching open questions:', error);
    return [];
  }
}

export async function getQuestion(id: string): Promise<Question | null> {
  try {
    const record = await pb.collection('questions').getOne(id);
    return record as unknown as Question;
  } catch (error) {
    console.error(`Error fetching question ${id}:`, error);
    return null;
  }
}

// Bet functions
export async function placeBet(
  userId: string,
  questionId: string,
  selectedOption: string,
  amount: number
): Promise<Bet | null> {
  try {
    const data = {
      user: userId,
      question: questionId,
      selected_option: selectedOption,
      amount: amount,
      placed_at: new Date().toISOString(),
    };
    const record = await pb.collection('bets').create(data);
    return record as unknown as Bet;
  } catch (error) {
    console.error('Error placing bet:', error);
    return null;
  }
}

export async function getUserBets(userId: string): Promise<Bet[]> {
  try {
    const records = await pb.collection('bets').getFullList({
      filter: `user="${userId}"`,
      sort: '-placed_at',
    });
    return records as unknown as Bet[];
  } catch (error) {
    console.error(`Error fetching bets for user ${userId}:`, error);
    return [];
  }
}

export async function getUserBetForQuestion(userId: string, questionId: string): Promise<Bet | null> {
  try {
    const record = await pb.collection('bets').getFirstListItem(`user="${userId}" && question="${questionId}"`);
    return record as unknown as Bet;
  } catch (error) {
    // Not found is expected if user hasn't bet yet
    if (!(error as any).status === 404) {
      console.error(`Error fetching bet for user ${userId} on question ${questionId}:`, error);
    }
    return null;
  }
}

export default pb;
