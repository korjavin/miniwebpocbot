/// <reference path="../pb_data/types.d.ts" />

/**
 * This hook is triggered when a question is updated to 'closed' status with a correct_option.
 * It calculates and distributes payouts to winners.
 */
onRecordAfterUpdateRequest((e) => {
  const record = e.record;
  const oldRecord = e.oldRecord;

  // Only proceed if this is a question being closed with a correct answer
  if (
    record.collection.name !== 'questions' ||
    oldRecord.get('status') === 'closed' ||
    record.get('status') !== 'closed' ||
    !record.get('correct_option')
  ) {
    return;
  }

  const correctOption = record.get('correct_option');
  const questionId = record.id;

  // Get all bets for this question
  const bets = $app.dao().findRecordsByFilter(
    'bets',
    `question="${questionId}"`
  );

  if (!bets.length) {
    console.log(`No bets found for question ${questionId}`);
    return;
  }

  // Separate winners and losers
  const winners = [];
  const losers = [];

  for (const bet of bets) {
    if (bet.get('selected_option') === correctOption) {
      winners.push(bet);
    } else {
      losers.push(bet);
    }
  }

  // If no winners, no payouts needed
  if (!winners.length) {
    console.log(`No winners for question ${questionId}`);
    return;
  }

  // Calculate total amounts
  let totalWinnerAmount = 0;
  let totalLoserAmount = 0;

  for (const winner of winners) {
    totalWinnerAmount += winner.get('amount');
  }

  for (const loser of losers) {
    totalLoserAmount += loser.get('amount');
  }

  // Process payouts for each winner
  for (const winner of winners) {
    const userId = winner.get('user');
    const betAmount = winner.get('amount');
    
    // Calculate payout: original bet + (bet/totalWinnerBets) * totalLoserAmount
    const winningsShare = totalLoserAmount > 0 
      ? (betAmount / totalWinnerAmount) * totalLoserAmount 
      : 0;
    
    const totalPayout = betAmount + winningsShare;
    
    // Get the user
    const user = $app.dao().findRecordById('users', userId);
    if (!user) {
      console.log(`User ${userId} not found`);
      continue;
    }
    
    // Update user balance
    const currentBalance = user.get('balance');
    user.set('balance', currentBalance + totalPayout);
    
    try {
      $app.dao().saveRecord(user);
      console.log(`Paid out ${totalPayout} to user ${userId} for question ${questionId}`);
    } catch (err) {
      console.error(`Failed to update balance for user ${userId}: ${err}`);
    }
  }

  console.log(`Payout completed for question ${questionId}`);
});
