# Scripts

This directory contains utility scripts for the Prediction Game project.

## Telegram Bot Setup Script

The `setup_telegram_bot.sh` script helps you configure your Telegram bot for the Prediction Game.

### Usage

1. Make sure you have created a bot with @BotFather and have the token ready.
2. Set the token as an environment variable:
   ```bash
   export TELEGRAM_BOT_TOKEN=your_token_here
   ```
3. Run the script:
   ```bash
   ./setup_telegram_bot.sh
   ```
4. Follow the menu options to configure your bot:
   - Set bot commands
   - Set bot description
   - Set bot short description
   - Get bot information
   - Run all setup steps

### Bot Commands

The script sets up the following commands for your bot:

- `/start` - Start the bot and get a welcome message
- `/help` - Get help and information about the bot
- `/newquestion` - Create a new prediction question (admin only)
- `/closequestion` - Close a question and set the correct answer (admin only)

### Notes

- You need to have `curl` installed to run this script.
- Make sure the script is executable (`chmod +x setup_telegram_bot.sh`).
- The bot needs to be added to your channel with admin privileges to post messages.

## Pocketbase Test Script

The `test_pocketbase.sh` script helps you verify that Pocketbase is running correctly and the required collections exist.

### Usage

1. Make sure Pocketbase is running (either directly or via Docker/Podman).
2. Run the script:
   ```bash
   ./test_pocketbase.sh
   ```
3. The script will:
   - Check if Pocketbase is running
   - Verify that the required collections (users, questions, bets) exist
   - Optionally create a test question

### Notes

- You need to have `curl` installed to run this script.
- Make sure the script is executable (`chmod +x test_pocketbase.sh`).
- By default, the script connects to http://localhost:8090. You can override this by setting the NEXT_PUBLIC_PB_URL environment variable.
