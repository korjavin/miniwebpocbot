/// <reference path="../pb_data/types.d.ts" />

/**
 * This hook validates a bet before it's created:
 * 1. Checks if the question is open
 * 2. Checks if the user has already bet on this question
 * 3. Checks if the user has enough balance
 * 4. Updates the user's balance by deducting the bet amount
 */
onRecordBeforeCreateRequest((e) => {
  const record = e.record;
  
  // Only proceed for bets collection
  if (record.collection.name !== 'bets') {
    return;
  }
  
  const userId = record.get('user');
  const questionId = record.get('question');
  const betAmount = record.get('amount');
  
  // Check if the question is open
  try {
    const question = $app.dao().findRecordById('questions', questionId);
    if (!question || question.get('status') !== 'open') {
      throw new Error('Question is not open for betting');
    }
    
    // Validate that the selected option is valid
    const selectedOption = record.get('selected_option');
    const options = question.get('options');
    if (!options.includes(selectedOption)) {
      throw new Error('Selected option is not valid for this question');
    }
  } catch (err) {
    throw new Error(`Question validation failed: ${err.message}`);
  }
  
  // Check if user has already bet on this question
  try {
    const existingBet = $app.dao().findFirstRecordByFilter(
      'bets',
      `user="${userId}" && question="${questionId}"`
    );
    
    if (existingBet) {
      throw new Error('User has already placed a bet on this question');
    }
  } catch (err) {
    if (err.message !== 'User has already placed a bet on this question') {
      console.error(`Error checking for existing bet: ${err.message}`);
    }
    throw err;
  }
  
  // Check if user has enough balance and update it
  try {
    const user = $app.dao().findRecordById('users', userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentBalance = user.get('balance');
    if (currentBalance < betAmount) {
      throw new Error('Insufficient balance');
    }
    
    // Update user balance
    user.set('balance', currentBalance - betAmount);
    $app.dao().saveRecord(user);
    
    // Set the placed_at timestamp
    record.set('placed_at', new Date().toISOString());
  } catch (err) {
    throw new Error(`Balance validation failed: ${err.message}`);
  }
});
