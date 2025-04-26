## Telegram Bot Setup Guide

This guide explains how to configure your Telegram bot and channel for use with the prediction game WebApp. By following these steps, you’ll set up a Telegram Bot via BotFather, enable the WebApp (MiniApp) functionality, and integrate the bot into your channel with the proper permissions.

1. Create a New Telegram Bot with BotFather

First, you need a Telegram bot. Telegram bots are managed by the official BotFather bot.

Steps to register a new bot:
	1.	Open Telegram and start a chat with @BotFather.
	2.	Send the command /newbot to BotFather.
	3.	BotFather will ask for a name and username for your bot:
	•	Name: Choose a friendly name for your bot (this can be anything, like “Prediction Game Bot”).
	•	Username: Choose a unique username that ends with “bot” (for example, “PredictionGameBot”). BotFather will tell you if the username is available.
	4.	Once you’ve provided a name and username, BotFather will create the bot and send you a message with the bot token. The token is a string like 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 (this is essentially the bot’s password).
	5.	Save your bot token somewhere secure. You will need this token to configure the backend (it allows your application to use the Telegram Bot API as your bot).

At this point, your bot exists but it doesn’t do anything yet. It’s also not known to be a WebApp. Next, we’ll configure it as a MiniApp.

2. Enable and Configure the WebApp (MiniApp) for the Bot

Telegram’s WebApp (MiniApp) feature allows your bot to have a web interface that opens inside the Telegram app. We need to link the Next.js web application to your Telegram bot.

Steps to set up your bot’s WebApp via BotFather:
	1.	In the BotFather chat, use the command /newapp. (This command registers a Web App for an existing bot.)
	2.	BotFather will ask which bot you want to link the WebApp to. Choose the bot you created in step 1 (BotFather usually presents a list of your bots to click).
	3.	Provide the details for your WebApp when prompted:
	•	Title: A name for your WebApp (for example, “Prediction Game”). This might be shown to users as the app name.
	•	Description: A short description of what your WebApp does (e.g., “Place bets on channel questions and win points.”).
	•	Cover Image (Optional): BotFather may ask for an image or demo GIF for your MiniApp. You can skip or provide one if you have it (this is for display in the bot’s profile, not essential for functionality).
	•	WebApp Short Name: BotFather will prompt: “Now please choose a short name for your web app: 3-30 characters…”. This short name is important. It will be used in the WebApp URL. For example, if you choose predictions, users will later be able to launch the app via a link like https://t.me/YourBotUsername/predictions. Send a short name (all lowercase letters, numbers, or underscores, no spaces).
	4.	Once you provide a unique short name, BotFather will confirm and give you an example link. It will look like:
Your web app link is https://t.me/<YourBotUsername>/<shortname>
BotFather will likely also mention that you can use this short name in the Bot API or that the app is ready.
	5.	(Optional) Menu Button: By default, in a chat with your bot, users will see a menu (☰) button. You can configure this button to launch your WebApp:
	•	Use /setmenubutton in BotFather. It will ask if you want to set it for all users or just you (choose all users for general use).
	•	Then it will ask for the type of menu button. Choose “Web App”.
	•	It will ask for the text on the button (e.g., “Open Game”) and the URL. Provide the URL in the format https://t.me/<YourBotUsername>/<shortname> (the same link BotFather gave for your web app).
	•	This will set the bot’s menu button to directly open the WebApp.
	•	Result: When a user opens a chat with your bot (even just the bot’s profile), they will see a prominent “Open Game” button that launches the app.
	6.	Domain Setting (if needed): Telegram usually trusts the domain you’ve configured via the /newapp process. In some cases, you might need to set the domain explicitly (especially for web login widgets, which is separate). If BotFather or documentation indicates to set an allowed domain for WebApps, do so:
	•	Use /setdomain if prompted or necessary, and provide the domain name where your web app is hosted (for example, “myapp.example.com”). This ensures Telegram knows your bot is allowed to open that domain. (If you are just using the t.me/bot/shortname link, this might not be needed, but it’s good to have the correct domain on record.)
	7.	Now your bot is configured as a WebApp bot. It has a short name and a launch link. You can test this right away by clicking the t.me/YourBotUsername/shortname link – it should open Telegram and then open your web app (you need the web app actually running for it to load content, otherwise you might see an error or blank page).

Note: The WebApp configuration doesn’t automatically know where your Next.js app is running. The Telegram app will use the domain from the link to load the content. In development, if you used something like ngrok, you’d set that as the domain. In production, it should be your real domain. Make sure that your Next.js app is accessible via HTTPS at that domain for Telegram to load it.

3. Add the Bot to Your Telegram Channel

For the bot to post questions and results in your channel, you need to add it as a member (administrator) of the channel.

Steps to add the bot to a channel:
	1.	Go to your Telegram channel (the channel where you want the predictions game to happen). You need to be an admin of the channel to do this.
	2.	Open the channel’s Info page (tap the channel name at the top). Then find Administrators.
	3.	Select Add Administrator. Search for your bot by its username (the one ending in bot, e.g., @PredictionGameBot).
	4.	Select the bot. Telegram will show a confirmation dialog to add the bot as admin. Confirm this.
	5.	When adding, it will ask which permissions to give the bot. Give the bot the permissions it needs:
	•	At minimum, enable “Post Messages” (so it can send messages to the channel). This is crucial for the bot to announce new questions and results.
	•	You may also give “Edit Messages” if you want the bot to edit its own messages (for example, if you plan to update a question post with additional info). This is optional.
	•	“Delete Messages” is not necessary unless you want the bot to remove messages.
	•	Do not give it unnecessary powers like adding new admins or changing channel info.
	•	(The bot does not need to “Read Members” or anything, since in channels bots cannot see members list anyway. Channels are typically one-way for bots unless they are posting.)
	6.	After confirming, your bot is now an admin in the channel. By default, bot admins in channels are “anonymous” (their messages appear as the channel name). This is usually fine – it means when the bot posts, it looks like the channel itself is posting. If you want the messages to explicitly come from the bot’s name, you might have to disable anonymity, but that’s typically not necessary.

4. Configure Bot Permissions and Privacy

For our use-case (a channel), the bot doesn’t need to read others’ messages, only to post its own. However, if you were to use this in a group chat scenario or allow admin commands via the channel, consider these:
	•	Privacy Mode (for groups): BotFather has a setting /setprivacy which by default prevents the bot from seeing messages in group chats unless they start with a slash (commands). In a channel, this setting is irrelevant (bots can’t read channel messages except their own, and channel posts aren’t user messages). If you ever use the bot in a group and you want it to respond to non-command messages, you’d disable privacy mode. For our channel usage focusing on posting, you can leave it as default (enabled).
	•	Allowed Updates: If you set up a webhook or polling for the bot, you might configure what types of updates it receives. For simplicity, if you only plan to send messages out and not process incoming updates (except maybe WebApp queries), you might not need to handle incoming messages. If you do plan to handle some commands (like an admin sending /close to the bot), you’ll need to set up a webhook or long polling in your code. Make sure the bot is allowed to receive message updates from the channel (note: in channels, bot will only receive channel posts if it’s set as the sender or if you specifically set up channel post updates).
	•	Channel Settings: There’s not much in channel settings specific to bots beyond adding as admin. Just ensure no restrictions that would prevent the bot from posting (since it’s admin with post rights, it should be fine).

5. Setting the WebApp URL in BotFather (Recap)

It’s worth reiterating the URL configuration, as it’s a common point of confusion:
	•	The link https://t.me/YourBotUsername/shortname is a Telegram deeplink that instructs the Telegram app to open your bot’s web app. When a user clicks it (or uses the menu button), the Telegram client will attempt to load the web app using the domain you provided and the path associated with that short name.
	•	Ensure that in your Next.js application, the path or route for that short name is handled. Often, Telegram might supply an argument. If you used BotFather’s /newapp, Telegram handles it internally and just opens the WebView to your domain. The Next.js app just needs to be reachable.
	•	If BotFather asked for a “URL” at any point for your WebApp, make sure it is correct and uses HTTPS (Telegram will require a secure URL for web apps).
	•	If you ever change your production domain, update it in BotFather via /setdomain or by editing the WebApp in BotFather (/mybots -> choose bot -> Edit Bot -> Edit Web App).

6. Testing the Setup

After completing steps 1-5, you should test the bot and WebApp integration:
	•	In Telegram, go to your bot (open the bot chat or its profile). You should see a “Launch App” or menu button if configured. Try clicking it. Alternatively, use the link t.me/YourBotUsername/shortname.
	•	The WebApp should open (likely a loading screen then your Next.js interface). If it doesn’t open, check:
	•	That your Next.js app is running and accessible at the URL. In dev, this might require the use of a tunneling service as mentioned; in production, ensure DNS and hosting is set.
	•	That the domain matches what’s configured. Telegram might show an error like “Web app not available” if domain mismatch or other config issues.
	•	That you tapped the correct link and the bot is indeed configured with that short name.
	•	Assuming it opens, you should see the content of your web app (maybe a question or a welcome message).
	•	Now try the full flow:
	1.	As admin, create a question (in Pocketbase or via whatever admin UI you have). Then manually trigger the bot to post the question in the channel (if you haven’t automated this yet, you can simulate by using the Bot API sendMessage with an inline keyboard via an API testing tool or a temporary script). In the future, this will be part of your app logic.
	2.	In the channel, the question appears with a button. As a normal user, click the button. The WebApp opens with that specific question loaded.
	3.	Place a bet and submit. The WebApp might close or give confirmation.
	4.	Check in Pocketbase that the bet was recorded and the user’s balance updated.
	5.	Back in the channel (as admin), resolve the question: mark the correct answer and trigger the payout (again, maybe manually for now if not automated).
	6.	Use the bot (via API or your logic) to post a result message in the channel.
	7.	Open the WebApp again as the user (or in some UI) to confirm the balance updated reflecting the outcome.
	•	If all that works in testing, you have successfully configured the Telegram side and the system.

7. Expected Telegram Settings for Smooth Operation

To summarize the Telegram-related settings that need to be correct for everything to work:
	•	BotFather configuration:
	•	Bot created with token saved.
	•	WebApp (MiniApp) enabled via /newapp with short name and associated with the correct bot.
	•	Menu button or launch button set up (so users can find/open the app easily).
	•	(Domain allowed if needed, via /setdomain, matching your app’s domain.)
	•	Channel configuration:
	•	Bot added as Admin to the channel.
	•	Bot has “Post Messages” permission (and optionally “Edit Messages” if you plan to let it edit its posts).
	•	Bot is either posting anonymously as channel (default; good for a seamless channel experience) or not (if you want it clear messages are via bot – not usually needed).
	•	Channel members can see the bot’s posts (if it’s a public channel, all good; if private, members obviously can see since they are in it).
	•	Bot token in application:
	•	Ensure the bot token is correctly set in your server environment, so that your application can use it to call the Telegram Bot API. Without it, the bot can’t actually send messages or verify login payloads. (In development, you might test without sending messages, but in production it must be set.)
	•	Telegram App Version:
	•	Users should have relatively up-to-date Telegram apps (WebApp support was added in mid-2022 in Telegram. Virtually all users will have this by now, but if someone has a very old version, the WebApp might not launch for them).
	•	Supported platforms: Telegram WebApps work on Android, iOS, and desktop Telegram. Just ensure they tap the button; on some platforms it might open in an in-app browser.

If you encounter issues:
	•	Recheck each step in BotFather. A common mistake is not enabling the WebApp or a mismatch in URL domain.
	•	Use BotFather’s /mybots -> select your bot -> Bot Settings -> Configure Web App to review what’s set (title, short name, etc.). Adjust if needed.
	•	Make sure your channel hasn’t muted the bot or something (if the bot’s messages aren’t showing, double-check it’s admin and try sending a test message via Bot API manually to that channel using the bot token and chat ID).
	•	Consult Telegram’s official docs on WebApps if needed: Telegram Bots Web Apps.

With the bot properly configured and added to your channel, and your application running, you’ll be all set to run prediction games. Channel members just need to tap the buttons and enjoy the experience. Good luck!