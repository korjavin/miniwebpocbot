/// <reference path="../pb_data/types.d.ts" />

/**
 * Telegram authentication verification
 */

const crypto = require('crypto');

// Helper function to verify Telegram WebApp data
function verifyTelegramWebAppData(initData, botToken) {
    if (!initData || !botToken) {
        return false;
    }
    
    try {
        // Parse the initData
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        
        if (!hash) {
            return false;
        }
        
        // Remove the hash from the data for verification
        urlParams.delete('hash');
        
        // Sort the params alphabetically
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        // Create the secret key by hashing the bot token
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();
        
        // Calculate the expected hash
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        
        // Compare the hashes
        return calculatedHash === hash;
    } catch (error) {
        console.error('Error verifying Telegram data:', error);
        return false;
    }
}

// Register a custom route for verifying Telegram WebApp data
routerAdd('POST', '/api/auth/telegram', async (c) => {
    try {
        const body = $apis.requestInfo(c).data;
        const { initData } = body;
        
        if (!initData) {
            return c.json({
                verified: false,
                error: 'No initData provided'
            }, 400);
        }
        
        // Get the bot token from environment variables
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
            return c.json({
                verified: false,
                error: 'Bot token not configured'
            }, 500);
        }
        
        // Verify the data
        const verified = verifyTelegramWebAppData(initData, botToken);
        
        return c.json({
            verified
        });
    } catch (error) {
        console.error('Error verifying Telegram data:', error);
        return c.json({
            verified: false,
            error: 'Internal server error'
        }, 500);
    }
});
