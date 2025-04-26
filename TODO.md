TODO

This document outlines all the tasks needed to implement the project, with details about architecture decisions and specific features. The project will use Pocketbase for the backend (database and API), Next.js for the frontend (web UI), pnpm for package management, GitHub Actions for CI, ghcr.io for container image hosting, and podman-compose for container orchestration. Pocketbase and Next.js will run in separate containers, orchestrated via Docker/Podman Compose (with distinct configurations for development and production).

Architecture & Setup
	•	Project Structure & Repositories:
	•	Organize the code into two main parts: a backend directory (for Pocketbase) and a frontend directory (for Next.js).
	•	Ensure a clear separation so that Pocketbase and Next.js can be containerized independently (separate Dockerfiles and containers).
	•	Pocketbase Container Setup:
	•	Use the official Pocketbase binary or image. Create a Dockerfile if custom configuration is needed (e.g. seeding or custom startup).
	•	Plan to persist Pocketbase data (e.g., mount a volume for the Pocketbase data directory so data isn’t lost when containers restart).
	•	Networking: Expose Pocketbase on its default port (e.g. 8090) inside the container. The Next.js container will communicate with Pocketbase via this port (e.g., using an internal Docker network).
	•	Enable CORS or configure Pocketbase to allow requests from the frontend’s origin (e.g., localhost:3000 for dev, or your production domain) so that the Next.js app (in a browser) can call Pocketbase APIs.
	•	Next.js Container Setup:
	•	Initialize a Next.js project (TypeScript preferred) for the frontend interface. Use pnpm as the package manager for all JavaScript/TypeScript dependencies.
	•	Create a Dockerfile for the Next.js app. It should install dependencies with pnpm and build the Next.js application. In production it will run next start to serve the app. In development, consider running next dev for hot-reloading (or use bind mounts with dev compose).
	•	The Next.js container should expose port 3000 (or whichever port Next uses) and be networked with the Pocketbase container.
	•	Docker Compose Configurations:
	•	Create two docker-compose files: one for development and one for production.
	•	docker-compose.dev.yml: This will set up the Pocketbase and Next.js containers for local development. Use this to mount source code for iterative development and possibly run Next.js in development mode. Include environment variables and volume mounts as needed (e.g., mount Next.js source for hot reload, mount Pocketbase data volume).
	•	docker-compose.prod.yml (or a similar name): This will define the production deployment, pulling pre-built images from ghcr.io (GitHub Container Registry). No source code mounts; just use the built images. Configure necessary environment variables for production (e.g., production API URLs, any keys).
	•	Both compose files should define separate services for Pocketbase (backend) and Next.js (frontend), ensuring they can talk to each other over a common network.
	•	Verify that podman-compose can interpret these files (ensure compatibility with Docker Compose syntax). Use podman-compose -f docker-compose.dev.yml up for local dev and a similar command for production deployment.
	•	Environment Variables & Configuration:
	•	Decide how configuration (like the Telegram Bot token, domain, etc.) will be provided. Likely via environment variables in the compose files.
	•	Examples: POCKETBASE_URL (if Next.js needs it), TELEGRAM_BOT_TOKEN (for the bot to post messages), WEBAPP_URL (the public URL where the Next.js app is hosted for Telegram WebApp).
	•	Document these variables and ensure they are used in code where appropriate (for example, Next.js might need the Pocketbase API URL, and the bot token for server-side actions).

Backend (Pocketbase) Tasks
	•	Pocketbase Initialization:
	•	Include Pocketbase in the project (either by using the official Docker image or adding the Pocketbase binary to the repo). Ensure the Pocketbase server can start automatically in the container (e.g., Docker entrypoint running pocketbase serve --http 0.0.0.0:8090).
	•	On first run, create an admin account for Pocketbase (this can be done via the Pocketbase web UI). This admin will be used for managing collections if needed.
	•	Define Data Collections (Data Model): Set up the necessary collections in Pocketbase to model users, questions, and votes/bets. For each collection, define fields and any relations:
	•	Users (or Players): If not using Pocketbase’s built-in auth collection for users, create a collection (e.g., “users”) with fields:
	•	telegram_id (numeric, unique – the Telegram user’s ID),
	•	name (text – the Telegram display name or username),
	•	balance (number – the user’s current points balance).
Ensure that telegram_id is unique (so one Telegram user corresponds to one record). The balance persists across questions, so it will be updated as users win/lose bets. Initialize new users with a starting balance (could be a fixed number of points, e.g., 1000, if desired).
(If Pocketbase’s built-in Users collection is used instead: adapt by adding a balance field and perhaps telegram_id. You may choose to bypass email/password by generating dummy credentials since login isn’t manual in this app.)
	•	Questions: Create a collection “questions” with fields:
	•	question_text (text – the question being asked),
	•	options (array or JSON – list of possible answers, e.g., [“Yes”,“No”] or multiple choices),
	•	status (enum – e.g., “open”, “closed”),
	•	correct_option (text or number – identifies the correct answer option once the question is resolved; null/empty if not resolved yet),
	•	created_at / updated_at (timestamps).
This collection represents each betting question posed to users. Only questions with status “open” accept votes. When an admin determines the outcome, they will set status to “closed” and fill correct_option.
There should be a relation or link between Questions and the Bets collection (one-to-many).
	•	Bets (Votes): Create a collection “bets” with fields:
	•	user_id (relation to Users – the user who placed the bet),
	•	question_id (relation to Questions – the question this bet is for),
	•	selected_option (text or number – corresponds to one of the question’s options, e.g., “Yes” or index of the chosen option),
	•	amount (number – how many points the user wagered),
	•	placed_at (timestamp).
Enforce that each user can vote only once per question. This could be done by a Pocketbase rule or will be handled in logic (see below: prevent duplicate bets). If possible, add a unique index on (user_id, question_id) to prevent multiple bets from the same user on one question.
When a bet is created, the user’s balance will be immediately deducted by amount (since those points are being wagered). The amount is essentially put into the pot for that question. Bets remain linked to the question for later payout calculation.
	•	Ensure Data Validation & Rules:
	•	Set Pocketbase collection rules or use API logic to ensure:
	•	A user’s bet amount cannot exceed their current balance. (This check can be done in the frontend and double-checked before processing the bet on the backend side.)
	•	A user can only have one bet per question (enforced via the unique index or by checking existing bet before allowing a new one).
	•	Perhaps prevent bets from being created if a question’s status is not “open” (to avoid late bets after closure). This could be enforced in application logic or via Pocketbase record rules (e.g., disable create on “bets” if the referenced question is closed).
	•	Payout Calculation Logic: Develop a clear mechanism to calculate and distribute payouts when a question is resolved:
	•	Implement a function or script (could be within the Next.js backend or a Pocketbase server-side hook) to handle closing a question and computing payouts. For example, when an admin sets status to “closed” and provides the correct_option for a question, trigger the payout process.
	•	Payout algorithm:
	1.	Gather all bets for the question. Separate them into winners (those whose selected_option matches the correct_option) and losers (the rest).
	2.	Sum the total amount staked by winners (call this W) and sum the total amount staked by losers (call this L).
	3.	Each winning bet gets a share of the losers’ pool proportional to their stake. For a particular winning bet with amount x, calculate their winnings share as (x / W) * L.
	4.	The total payout for that bet’s user = their original stake back + the winnings share. Since we deducted their stake when they placed the bet, effectively you will credit their balance with this total payout now. Losers do not get their stake back (their stake remains deducted).
	5.	As a result, all of L is distributed among winners proportionally, and each winner’s net gain is proportional to their bet size. (If there are no winners – e.g., everyone guessed wrong – then typically the house would keep the pot; you may decide to handle that case, but it might not occur if one option is always correct. If it could occur, perhaps refund or carry over the pot; define a rule in that scenario.)
	•	Implement Payout: For each winning bet, update the corresponding user’s balance in the Users collection (balance = balance + payout_amount). Also, optionally mark bets as settled (maybe add a field settled: true or move them to a history). Mark the question as fully settled (could set a field or rely on status “closed” with correct_option as indicator).
	•	Make sure this function runs only once per question. If using Pocketbase hooks, ensure idempotence (so recalculation doesn’t double-pay). If using an external script (like a Next.js API call), ensure an admin or automated process triggers it only once after question resolution.
	•	Prevent Double Voting (Backend): Although the frontend will prevent a user from betting twice on one question, also include a safety check on the backend side. Before creating a new bet record, check if a bet by that user for that question already exists in Pocketbase. If it does, reject the new bet (to maintain the rule: one vote/bet per user per question). This check can be done by querying the bets collection for an existing record with the same user and question (or by the unique index if implemented which will throw an error).
	•	Testing Data Operations:
	•	After setting up the collections, test basic operations on Pocketbase: creating a user, creating a question, placing a bet via the API, and then simulating closing the question to see if the payout logic correctly updates balances. These tests ensure that the data model and constraints work as expected before integrating the frontend.

Frontend (Next.js) Tasks
	•	Initialize Next.js Project:
	•	Use Next.js (latest version) with TypeScript to scaffold the frontend. Use pnpm for package management – run pnpm init and pnpm create next-app (or manually configure). Ensure the project is set up in a dedicated frontend directory if separating.
	•	Configure the Next.js app to run in a container-friendly way (listen on 0.0.0.0 and not use webpack’s hot reload socket outside container by default – in development mode, you may need to adjust config for container, like setting NEXT_PUBLIC_* environment variables for API URLs, etc.).
	•	Install Dependencies:
	•	Using pnpm, add any required libraries: for example, the Pocketbase JavaScript SDK (pnpm add pocketbase), which can simplify API calls to Pocketbase. Alternatively, plan to use native fetch calls to Pocketbase’s REST API.
	•	Add types for Telegram WebApp if available (Telegram provides a global Telegram object; you may use community type definitions or declare the type for window.Telegram).
	•	Ensure all packages are managed via pnpm workspace if multiple packages (though here primarily just the Next.js app is the Node project).
	•	Page Structure: Design the Next.js pages to handle the main user interactions. Proposed pages/components:
	•	Home Page (/):
	•	If there is a single current active question at a time, the home page can directly display the active question’s details and options. If multiple questions can be active, the home page could list all open questions as clickable items.
	•	Also display the user’s current balance somewhere prominently (e.g., “Your Balance: 500 points”) so they know how much they can bet.
	•	For each active question, show the question text and a call-to-action to vote/bet (either a button to go to the question page or an inline form). If handling on the same page, you can embed the betting form here.
	•	Question Detail Page (/question/[id]):
	•	This page will display a specific question’s details, the possible answer options, and a form for the user to place their bet. If the home page already handles the betting form, this page might not be needed; but having a separate page is clean if multiple questions are supported.
	•	Show the question text and maybe additional info (like how many people have bet on each side if you want to display odds – this is optional and can come later).
	•	Provide input for the user to choose an option (e.g., select one of the multiple choice answers or Yes/No) and input the amount of points to wager. This could be an input box or preset buttons for common amounts.
	•	A submit button to confirm the bet. On submission, call the appropriate API (via Pocketbase or Next.js API route) to record the bet. After success, give feedback (e.g., “Bet placed!”). You might also then disable further betting on this question for that user or navigate back.
	•	If the user already placed a bet on this question (which you can know from state or by querying the bets collection for that user/question), instead of showing the form, you might show “You have already voted/bet on this question” and perhaps details of their bet.
	•	(Optional) Results/History Page: Not initially required, but consider a page where users can see closed questions and whether they won or lost, and how their balance changed. This can be a future enhancement. For now, closed questions can be omitted or shown read-only.
	•	Integrate Telegram WebApp SDK:
	•	Include the Telegram WebApp JavaScript SDK in the Next.js app. According to Telegram’s documentation, you include a script tag for telegram-web-app.js in your HTML. In Next.js, this can be added in the <Head> of the _app.js or _document.js. Ensure it loads before your React code that uses window.Telegram.
	•	On application load (for example, in a top-level React effect or in a context provider), initialize the Telegram WebApp:
	•	Call Telegram.WebApp.init() (or Telegram.WebApp.ready()) if required to notify Telegram that your app is ready. You can also use Telegram.WebApp.expand() to open to full height if desired.
	•	Retrieve user information from Telegram: Telegram.WebApp.initDataUnsafe (or Telegram.WebApp.initData) provides the authenticated user data (user id, username, etc., along with a hash for verification). Parse this to get the Telegram user’s ID and name.
	•	Use this info to identify the user in your application. Likely, you will send this user ID to the backend to fetch or create the corresponding user record (and get their current balance, etc.).
	•	User Authentication via Telegram:
	•	Implement a mechanism to verify the Telegram user identity in the backend for security. Telegram WebApp provides a hash (HMAC) of the user data that can be verified with your bot token. Implement a function in Next.js (maybe an API route /api/auth/telegram) that takes initData from the WebApp, uses the secret token (Telegram bot token) to recompute the hash and ensure it matches, thereby confirming the data is legitimate.
	•	On successful verification, create a session or directly use the Telegram ID to fetch the user from Pocketbase. If the user (Telegram ID) is not yet in Pocketbase, create a new user record with default balance. (This can be done via Pocketbase’s REST API or SDK: e.g., create a record in the Users collection with telegram_id and starting balance.)
	•	This process can be done automatically whenever a user opens the WebApp. Consider storing the Pocketbase record ID or an auth token in the Next.js session (perhaps store it in a cookie or React state) if you plan to make authenticated requests. If not using Pocketbase auth tokens, you might simply use an internal session or send the Telegram ID with each request (and validate on server).
	•	API Client Functions (Frontend): Implement a set of functions or service modules in the Next.js app to interact with the Pocketbase backend API for all required operations:
	•	Fetching Questions: A function to retrieve the list of open questions (and perhaps the user’s existing bets). This can call Pocketbase’s REST API endpoint for the questions collection (/api/collections/questions/records with a filter for status=open) or use the Pocketbase JS SDK (e.g., pb.collection('questions').getFullList() etc.). If using the SDK, instantiate the Pocketbase client with the base URL of the backend (from an env var).
	•	Placing a Bet: A function to submit a new bet. This will need the current user’s ID (Pocketbase record or at least Telegram ID to associate) and the question ID, selected option, and amount. If using a Next.js API route for this, you’d call something like POST /api/bets on your Next app which in turn calls Pocketbase. Alternatively, call Pocketbase directly from the frontend: e.g., pb.collection('bets').create({...}). Provide the required fields (user_id, question_id, selected_option, amount).
	•	Before sending, ensure on the client side that the user has not already voted on this question (you might keep track after the first vote). Regardless, the backend will double-check.
	•	After a successful bet, update the UI: subtract the bet amount from the local displayed balance (to reflect the deduction), and perhaps mark the question as “voted”. You might fetch the updated user record from Pocketbase to get the new balance.
	•	Fetching User Data/Balance: A function to get the user’s current balance (and perhaps list of their bets). This could be part of the login/verification step where after verifying Telegram user, you request their user record from Pocketbase. Store this in React state (like a User context) so it can be displayed.
	•	React Integration: Use React state or context to store global data like current user and current question(s). Ensure components use this state and the above client functions to retrieve and modify data.
	•	UI/UX Details:
	•	Use the Telegram WebApp theming info for a better user experience: The SDK provides theme parameters (e.g., background color, text color). Adjust the styling of the Next.js app to match Telegram’s current theme (light/dark mode, colors) for a seamless look. For example, set the page background to Telegram.WebApp.themeParams.bg_color if available.
	•	Add a “Submit Vote/Bet” button that is clearly visible. After the user submits a bet, possibly call Telegram.WebApp.close() to close the web app automatically (if the intended flow is one-time submission). Alternatively, keep it open and allow them to see a confirmation.
	•	Provide feedback for actions: e.g., error messages if bet fails (not enough balance or already voted), success message on screen if bet is placed.
	•	If appropriate, disable or hide input fields after a bet is placed on a question (to enforce one-time vote in the UI).
	•	Prevent Double Voting (Frontend):
	•	On the client side, once a user places a bet on a question, update the state to mark that question as voted. This can disable the betting form for that question to prevent the user from attempting a second vote.
	•	Also, if loading a question page, check if the user’s existing bets (perhaps fetched on load) include one for this question. If yes, do not show the betting form. Instead, display a notice like “You have bet X points on [option]. Good luck!” to remind them of their choice.
	•	Testing the Frontend:
	•	Manually test the Next.js app within Telegram (and also in a normal browser for development). Use the Telegram Desktop or Mobile app to open the bot’s WebApp and verify the integration works: the user info loads, questions load from Pocketbase, you can place a bet, and balances update.
	•	Test edge cases: betting more than balance (should be prevented), two users (you can simulate with two different Telegram accounts) to see that each has independent balances and cannot vote twice.
	•	Ensure the UI is responsive and works within Telegram’s in-app browser (which might be mobile sized).

Integration & Bot (Telegram) Tasks
	•	Telegram Bot Setup:
	•	Register a Telegram Bot via @BotFather (if not done already) to obtain a bot token. This token will be used by the system to integrate with Telegram (both for WebApp authentication verification and for sending messages to the channel).
	•	Configure the bot for WebApp usage: using BotFather’s commands, enable the bot’s Web App features. For example, use /newapp in BotFather to link a Web App to your bot (providing the bot username, a short name for the app, etc.). This will let Telegram know about your WebApp and allow a direct launch link. (Detailed steps will be in telegram.md guide.)
	•	Set the WebApp URL or domain as needed (BotFather may prompt for the URL where your Next.js app will be hosted; ensure this is correctly set, especially for production domain).
	•	Bot Channel Integration:
	•	Add the bot to your Telegram channel and give it appropriate admin permissions (primarily the ability to Post Messages in the channel). The bot will act on behalf of the channel to post questions and results. If you want the bot to not appear as a separate user, you can keep it “anonymous” so posts show under the channel name.
	•	Ensure the channel or group settings allow the bot to operate (in a channel, just being admin with posting rights is sufficient; in a group scenario, you’d disable privacy mode if you wanted it to read messages, but for channel announcements privacy mode is not applicable).
	•	Announcing New Questions:
	•	Implement a function to post a new question to the Telegram channel via the bot. This could be triggered when a question is created or when an admin explicitly starts a round. For example, when a new Question record is added in Pocketbase (status “open”), send a message to the channel:
	•	The message might include the question text and possibly the answer options.
	•	Include an inline keyboard button that opens the WebApp for voting. Telegram’s Bot API allows an InlineKeyboardButton of type web_app with a URL. The URL should be the link to your Next.js web app, ideally with a route or parameter identifying the question (e.g., https://yourapp.com/question/QUESTION_ID). By using a web_app button, when users tap it, it will open the WebApp inside Telegram and Telegram will pass the user info to it.
	•	Use the bot token and Bot API sendMessage method with reply_markup to create this button. This can be implemented in a Next.js API route or a small Node script that runs as part of the server. (For example, an admin interface could call POST /api/publishQuestion?id=XYZ which triggers the bot message.)
	•	Make sure to construct the WebApp URL to include any needed parameters (Telegram will automatically include user auth info via hash when opening, but you may want to include the question ID in the path or #fragment).
	•	Closing Questions & Publishing Results:
	•	Determine how an admin closes a question and triggers payout. This could be done by updating the question in Pocketbase (setting correct_option and status). Once that is done, implement a mechanism to announce the results:
	•	The easiest method: after running the payout calculation (perhaps manually triggered or automatically via a hook when question status changes), use the Telegram bot to send a message to the channel announcing the outcome. For example: “Question Closed: The correct answer was Option A. Winners have been paid out!” You might include some stats like how many users won or the total points distributed, if desired.
	•	Optionally, mention a few top winners or instruct users to check their balance via the bot (though in this setup, users would reopen the WebApp to see their new balance).
	•	Implement this announcement by using the Bot API sendMessage again. This can be part of the same flow as the payout function.
	•	(Optional enhancement: The bot could also edit the original question message to indicate it’s closed or pin a comment. But a simple new message announcement is sufficient.)
	•	Bot Command (Optional/Admin):
	•	If needed, implement simple bot commands for admin to control the game via Telegram chat: e.g., a /closequestion command that an admin can send in the channel (the bot, if admin, can see it possibly if from another admin) to trigger the closing logic. This would require setting the bot’s privacy mode off (so it can see commands in channels/groups) and handling that update via a webhook or polling inside your app. This is more advanced; if not needed, an admin can simply use the Pocketbase UI or a web admin page to close questions.
	•	CI/CD Integration:
	•	Add the Telegram bot token (and any other secret like channel ID if needed) to your deployment environment securely. For example, in GitHub Actions, set the bot token as a secret so it can be injected into the Docker image or compose file. In production compose, reference the token from an env file. Do not hard-code the token in the repo.
	•	GitHub Actions for CI:
	•	Create a GitHub Actions workflow (e.g., .github/workflows/docker-ci.yml) that runs on pushes to main or on new tags. The CI should build both the Pocketbase container image and the Next.js container image.
	•	Use pnpm in the build process for the frontend: e.g., docker build will do RUN pnpm install && RUN pnpm build for Next.js. Ensure the CI environment has access to pnpm (you might need to npm install -g pnpm or use a Node image that includes pnpm).
	•	After building images, push them to GitHub Container Registry (ghcr.io). You’ll need to log in to ghcr within the action. Use GitHub’s ${{ secrets.GITHUB_TOKEN }} with appropriate permissions, or a personal access token, to push to ghcr.io/<YOUR_USERNAME>/<PROJECT-NAME>-frontend:tag and ...-backend:tag. Tag the images with something like the Git commit SHA or a version.
	•	Mark these images as latest as well if pushing on the main branch, so that the production compose can pull the latest easily.
	•	Ensure the workflow is configured to run tests or linters if any (not specified, but at least verify build succeeds).
	•	Production Deployment Instructions:
	•	Prepare the production docker-compose file to use the images from ghcr.io. For example, in docker-compose.prod.yml, the Pocketbase service uses image: ghcr.io/<user>/<project>-backend:latest and Next.js uses ghcr.io/<user>/<project>-frontend:latest. This way, deploying is as simple as pulling the updated images.
	•	Document that to deploy in production, you must set the necessary environment (like the bot token, perhaps Pocketbase admin password if needed, etc.) either in the compose or external .env.prod file, then run podman-compose -f docker-compose.prod.yml up -d. This will fetch the latest images from GHCR and run the containers.
	•	Finalize Documentation:
	•	(After implementing) Update README.md with a clear project description, setup guide, and usage instructions. Also create telegram.md with detailed steps for setting up the Telegram bot and integrating it with the web app.
	•	Ensure all important details (like one-vote rule, payout logic, etc.) are documented for future maintainers or users of the project.

By completing the above tasks, we will have a fully functional system: a Pocketbase backend to store users, questions, and bets; a Next.js frontend that runs as a Telegram MiniApp for users to place bets; and a Telegram bot that ties everything together by providing the entry point (WebApp button) and posting game updates to the channel. Each component will be containerized and the project will be deployable locally for development and on a server for production with CI/CD support