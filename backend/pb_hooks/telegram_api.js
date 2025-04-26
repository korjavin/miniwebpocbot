/// <reference path="../pb_data/types.d.ts" />

/**
 * Telegram API utilities for sending messages
 */

// Helper function to send a message to a Telegram channel
async function sendTelegramMessage(chatId, text, parseMode = 'Markdown', replyMarkup = null) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
        throw new Error('Bot token not configured');
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
    };
    
    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(`Telegram API error: ${data.description}`);
        }
        
        return data.result;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
}

// Register a custom route for posting a question to Telegram
routerAdd('POST', '/api/telegram/post-question', async (c) => {
    try {
        const body = $apis.requestInfo(c).data;
        const { questionId, channelId } = body;
        
        if (!questionId || !channelId) {
            return c.json({
                success: false,
                error: 'Missing required fields'
            }, 400);
        }
        
        // Get the question from the database
        const question = await $app.dao().findRecordById('questions', questionId);
        if (!question) {
            return c.json({
                success: false,
                error: 'Question not found'
            }, 404);
        }
        
        // Construct the message text
        const messageText = `📊 *New Prediction Question*\n\n*${question.get('question_text')}*\n\nOptions: ${question.get('options').join(', ')}\n\nClick the button below to place your bet!`;
        
        // Get the webapp URL from environment variables
        const webappUrl = process.env.PUBLIC_WEBAPP_URL;
        if (!webappUrl) {
            return c.json({
                success: false,
                error: 'WebApp URL not configured'
            }, 500);
        }
        
        // Construct the inline keyboard with a WebApp button
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '🎲 Place Your Bet',
                        web_app: {
                            url: `${webappUrl}/question/${questionId}`
                        }
                    }
                ]
            ]
        };
        
        // Send the message to the Telegram channel
        const result = await sendTelegramMessage(channelId, messageText, 'Markdown', inlineKeyboard);
        
        return c.json({
            success: true,
            message: 'Question posted to Telegram channel',
            result
        });
    } catch (error) {
        console.error('Error posting question to Telegram:', error);
        return c.json({
            success: false,
            error: error.message || 'Internal server error'
        }, 500);
    }
});

// Register a custom route for posting results to Telegram
routerAdd('POST', '/api/telegram/post-result', async (c) => {
    try {
        const body = $apis.requestInfo(c).data;
        const { questionId, channelId } = body;
        
        if (!questionId || !channelId) {
            return c.json({
                success: false,
                error: 'Missing required fields'
            }, 400);
        }
        
        // Get the question from the database
        const question = await $app.dao().findRecordById('questions', questionId);
        if (!question) {
            return c.json({
                success: false,
                error: 'Question not found'
            }, 404);
        }
        
        // Check if the question is closed and has a correct option
        if (question.get('status') !== 'closed' || !question.get('correct_option')) {
            return c.json({
                success: false,
                error: 'Question is not closed or does not have a correct option'
            }, 400);
        }
        
        // Construct the message text
        const messageText = `🏁 *Prediction Results*\n\n*${question.get('question_text')}*\n\nThe correct answer is: *${question.get('correct_option')}*\n\nWinners have been paid out! Check your balance in the app.`;
        
        // Get the webapp URL from environment variables
        const webappUrl = process.env.PUBLIC_WEBAPP_URL;
        if (!webappUrl) {
            return c.json({
                success: false,
                error: 'WebApp URL not configured'
            }, 500);
        }
        
        // Construct the inline keyboard with a WebApp button to check balance
        const inlineKeyboard = {
            inline_keyboard: [
                [
                    {
                        text: '💰 Check Your Balance',
                        web_app: {
                            url: `${webappUrl}`
                        }
                    }
                ]
            ]
        };
        
        // Send the message to the Telegram channel
        const result = await sendTelegramMessage(channelId, messageText, 'Markdown', inlineKeyboard);
        
        return c.json({
            success: true,
            message: 'Results posted to Telegram channel',
            result
        });
    } catch (error) {
        console.error('Error posting results to Telegram:', error);
        return c.json({
            success: false,
            error: error.message || 'Internal server error'
        }, 500);
    }
});
