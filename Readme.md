# Project Overview

This project is a Telegram MiniApp and Bot for a Prediction Game, allowing Telegram channel members to bet points on the outcome of posted questions and receive payouts if they guess correctly. It combines a web-based interface (the MiniApp) with Telegram's bot system to create an interactive betting/voting experience within a Telegram channel.

## Key Features:
- **Interactive Betting in Telegram**: Channel admins can post a question (e.g., a prediction or a yes/no question) via the bot. Members click a "Vote/Bet" button that opens a web app right inside Telegram where they can place their bets using points.
- **Points and Payouts**: Each user has an account balance (points). They can wager points on their chosen answer. Once the correct answer is revealed, the bot distributes the pooled points to the winners proportionally to their bets. Winners gain points, losers lose their staked points, and balances are updated accordingly.
- **Persistent Accounts**: Users' point balances persist across all questions. Points won can be used to bet on future questions. The system ensures each user can only bet once per question.
- **Technology Stack**: The backend is powered by Pocketbase (an open-source Go backend with built-in database and REST API) for storing data. The frontend is built with Next.js and runs as a Telegram WebApp (MiniApp). We use npm to manage Node.js packages. The bot functionality is implemented using the Telegram Bot API. Everything is containerized with Docker/Podman for easy deployment.
- **Use Case**: This can be used for friendly wagers, community predictions, or polls in a Telegram channel, with a fun twist of points and competition.

## Architecture

The system is composed of two main components, each running in its own container:
- **Pocketbase (Backend)**: Acts as the database and REST API server. It stores all the data: user accounts (with their Telegram ID and points balance), questions, and bets. Pocketbase provides a web admin UI and APIs to manage data.
- **Next.js (Frontend WebApp)**: A React/Next.js application that serves the user interface for placing bets. This app is loaded as a Telegram MiniApp (WebApp) when users click the bot's button. It communicates with the Pocketbase backend via API calls to fetch questions, submit bets, and update balances.

These components communicate over an internal network (within Docker/Podman). The Next.js server (or static files) make requests to the Pocketbase API (for example, http://backend:8090/api/… inside the Docker network, or via an external URL if configured). The Telegram Bot functionality is handled by making requests to Telegram's Bot HTTP API from the Pocketbase backend.

## Diagram (High-level):

```
Telegram User --[Telegram Bot & WebApp]--> Next.js Frontend --(REST API)--> Pocketbase Backend --(Database)--> Data
           <--[Bot posts messages]--       (Container)            (Container)
```

1. **Telegram Interaction**: The user interacts with a Telegram bot in a channel. The bot posts a message with an "Open App" button.
2. **WebApp (Next.js)**: When the user clicks the button, Telegram opens the Next.js web application inside the Telegram app (passing along the user's Telegram ID securely to the app).
3. **Data Fetch/Update**: The WebApp uses Pocketbase's API to fetch the current question and the user's data (balance, etc.), and allows the user to place a bet. When the user submits a bet, the WebApp calls the backend to record that bet.
4. **Storage**: Pocketbase records the bet, updating the user's balance (deducting the wager).
5. **Outcome**: Later, when the question is closed and the correct answer recorded, a server function calculates payouts. Pocketbase updates user balances accordingly. The Telegram bot then posts a message in the channel announcing the results.

By separating backend and frontend in this way, we leverage Pocketbase for quick data modeling and Next.js for a rich interactive UI.

## Data Model (Pocketbase Collections)

The following collections (tables) are used in Pocketbase to manage the data:

### Users
- Stores each player's info and current balance.
- **Fields**: 
  - `telegram_id` (Integer, unique – the user's Telegram ID)
  - `name` (Text – Telegram username or display name)
  - `balance` (Number – the current points balance for the user)
- When a user first uses the app (via Telegram), a user record is created for them with an initial balance (e.g., 1000 points).
- **Example**: `{ telegram_id: 123456789, name: "alice", balance: 1000 }`

### Questions
- Stores the questions posted for betting.
- **Fields**: 
  - `question_text` (Text – the question content)
  - `options` (List/Text – the possible answers or outcomes, e.g. ["Yes","No"] or ["Team A wins", "Team B wins"])
  - `status` (Enum/Text – e.g. "open" or "closed")
  - `correct_option` (Text or Number – indicates which option was correct, e.g. "Yes" or an index like 0,1,… once the question is resolved; null if not yet decided)
  - `created_at` (Date/Time)
- Only questions with status = "open" are available for users to bet on. Once an outcome is determined, status becomes "closed" and correct_option is set.
- **Example**: `{ question_text: "Will it rain tomorrow?", options: ["Yes","No"], status: "open", correct_option: null }`

### Bets
- Stores each bet (vote) that a user places on a question.
- **Fields**: 
  - `user_id` (Relation – link to the Users collection record)
  - `question_id` (Relation – link to the Questions record)
  - `selected_option` (Text/Number – the option the user chose, e.g., "Yes")
  - `amount` (Number – points the user wagered)
  - `placed_at` (Date/Time)
- Each user can have at most one bet per question (the system enforces this). The amount is immediately subtracted from the user's balance when the bet is placed.
- **Example**: `{ user_id: (ref to alice), question_id: (ref to rain question), selected_option: "Yes", amount: 100, placed_at: "2025-04-26T20:00:00Z" }`

## Data Relationships and Rules:
- A User can place many Bets (one per each Question maximum).
- A Question can have many Bets from different users.
- Balances are updated transactionally: when a Bet is created, the user's balance = balance - amount. When a Question is closed with a correct option, each winning bet's user gets their payout added to their balance.
- **Unique Vote Constraint**: The combination of user_id and question_id in Bets is unique. This means if the same user tries to create a second bet on the same question, it will be rejected.
- **Preventing Invalid Bets**: The system ensures a user cannot bet more points than they have, and bets can only be placed on open questions. These checks are handled in the application logic.

## Setup Instructions (Development)

To run this project locally for development, we use Podman (or Docker) with podman-compose to orchestrate the services. Follow these steps:

### 1. Prerequisites:
- Install Podman and Podman Compose on your system. (If you prefer Docker, Docker Compose should also work with the provided configuration.)
- Ensure npm is installed for managing Node.js packages.
- You should have a Telegram Bot token ready (from @BotFather) for the bot functionality. You'll also need to configure Telegram to point to your local dev server for the WebApp; however, during local development you might test the WebApp in a regular browser with mock data, or use something like localhost.run or ngrok to expose it for Telegram.

### 2. Clone the Repository:
```bash
git clone https://github.com/korjavin/miniwebpocbot.git
cd miniwebpocbot
```

### 3. Environment Configuration:
- Copy or create an environment file for development, e.g., `cp .env.example .env.dev`. (The repository provides an example env file.)
- Open `.env.dev` in an editor and set the necessary values:
  - `TELEGRAM_BOT_TOKEN` – the token of your Telegram bot (for verifying users and sending messages).
  - `PUBLIC_WEBAPP_URL` – the URL where your Next.js app is accessible. In development, if you are testing within Telegram, this needs to be an accessible URL. If you're just testing in browser, you can set it to http://localhost:3000.
  - Any other config like Pocketbase admin credentials if required, etc.
- These env vars will be used by the docker-compose and the applications. The Next.js app uses NEXT_PUBLIC_... prefixes for any variable that needs to be exposed to the client side (e.g., NEXT_PUBLIC_PB_URL).

### 4. Docker/Podman Compose (Development Mode):
- Start the services using the development compose file:
```bash
podman-compose -f docker-compose.dev.yml up --build
```
This will build the Next.js image (using the local code) and start both Pocketbase and Next.js containers. The --build ensures any code changes are reflected; alternatively, the dev compose might mount the code for hot-reload.

- Pocketbase (Backend) will be running at http://localhost:8090.
- Pocketbase's admin UI can be accessed at http://localhost:8090/_/ (you'll create an admin user on first visit if not already set up).
- Verify Pocketbase is running: you should see logs in the console or be able to open the admin UI. If needed, log in and ensure the collections (Users, Questions, Bets) are created. If not, you can create them through the UI now following the data model described above.
- Next.js (Frontend) will be running at http://localhost:3000 (or another port if configured).
- If everything started correctly, you can open this URL in your browser to test the web app outside of Telegram. It should load the Next.js app. If not logged in via Telegram, some features might not work (since it expects Telegram context). You might create a test mode to simulate a user, or temporarily disable the Telegram check for local testing. But ideally, test through Telegram.
- To test via Telegram during dev, you need to expose your local Next.js server to the internet (Telegram clients need to reach it). You can use a tool like ngrok or Cloudflare Tunnel to get a public HTTPS URL that tunnels to localhost:3000. Put that URL in your bot settings (BotFather /setdomain or /setwebhook depending on approach) and as PUBLIC_WEBAPP_URL, then in Telegram click the bot's link to open the WebApp.
- You should see logs from both containers in the terminal. Next.js in dev mode will reload if you edit code. Pocketbase will preserve data in the pb_data volume.

### 5. Creating a Test Question (Dev):
- In the Pocketbase admin UI (or via API), create a new question in the Questions collection to simulate a round. For example, Question: "Is 2+2=4?", options ["Yes","No"], status "open".
- Alternatively, if you have an admin interface in Next.js (or plan to), you could use that. But initially using Pocketbase UI is fine to seed some data.

### 6. Telegram Bot Setup (Dev):
- Ensure your bot is set up with BotFather and that you have added it to a test channel (or group) where you can see its messages. For development, you might use a private test channel.
- From your development environment, you might not want the bot to actually post to Telegram until things are stable. But you can test pieces:
  - The WebApp integration: use Telegram to open the web app (BotFather can provide a direct link via /newapp setup, or use the menu button). Does it load your Next.js app and show the test question? Does it identify you properly?
  - The betting: place a bet through the WebApp and check Pocketbase that the bet record appeared and your user's balance reduced.
  - You may skip actual Telegram messaging in dev (since posting to real channel could annoy or require proper cleanup). But the full integration can be tested once basic functionality works.

### 7. Stopping the Dev Environment:
- When done, hit Ctrl+C in the terminal to stop the compose services. Data in Pocketbase (since it was on a volume) should persist for next time, but if you want a clean slate, you can remove the volumes as needed (e.g., podman volume rm yourproject_pb_data if named accordingly).

## Production Deployment

When ready to deploy to production (a server environment), we will use the production Docker Compose configuration and pre-built images from GitHub Container Registry (GHCR).

### Preparation:
- Obtain a server or cloud instance with Podman or Docker installed (and ability to run Compose files).
- Set up environment variables for production (similar to dev, but likely different values, and ensure secrets like the bot token are set).
- Make sure the domain or URL you plan to host the Next.js app on is the same one configured in your Telegram bot via BotFather (Telegram will only allow the WebApp to open on authorized domains for security).

### Deployment Steps:
1. On the server, install Podman and podman-compose (or Docker).
2. Pull the latest images from GHCR (the Compose file can do this automatically):
   - The images should have been published by the CI pipeline. For example, ghcr.io/yourusername/yourproject-frontend:latest and ...-backend:latest.
   - Ensure you have access to these images. If the repository is private, you'll need to podman login ghcr.io with a token that has read package permissions. If it's public, no login needed.
3. Transfer the docker-compose.prod.yml (and any needed .env file) to the server. Update the compose file with correct image references (they might already point to ghcr.io URLs) and ensure the environment variables (like TELEGRAM_BOT_TOKEN, PUBLIC_WEBAPP_URL with your production domain, etc.) are configured. For example, you might have a separate .env.prod file that the compose uses with env_file: directive.
4. Run the compose in detached mode:
```bash
podman-compose -f docker-compose.prod.yml up -d
```
This will start the Pocketbase and Next.js containers using the pulled images.

5. Verify Operation:
   - Pocketbase: Ensure the backend is running. In production, if you opened necessary ports, you could access the Pocketbase API or admin if needed (though you might restrict admin access in prod). The bot and webapp will be using it internally.
   - Next.js: Navigate to the public URL for your Next.js app (for example, https://yourdomain.com). If everything is correct, you might see a welcome page or be prompted that it should be opened in Telegram. (Since this is primarily a Telegram webapp, users will typically open it via Telegram, but direct access could still show something).
   - Telegram: Test the end-to-end flow in the real channel. Use your bot to post a question (you might trigger it manually if not automated – possibly by creating a question in Pocketbase and then calling the appropriate endpoint or running a script to send the message). Then as a user, click the button, place a bet, close the question, and see the result announcement.
6. Bot in Production: Make sure the bot is added to your production channel and has admin rights to post. Double-check that the PUBLIC_WEBAPP_URL in the production config matches exactly the domain set in BotFather for your WebApp; otherwise, Telegram will refuse to open the link for users.
7. Logging and Monitoring:
   - The containers will produce logs. You can view logs with podman logs <container_name> if needed. In production, you might want to set up a more robust logging or monitoring, but initially checking logs for errors (Pocketbase startup, Next.js serving, etc.) is useful.
8. Updating the Application:
   - Thanks to CI/CD, whenever you push updates to the repository (e.g., code changes for frontend or backend), GitHub Actions will build new images and push to GHCR. To deploy the update, you can pull the new images and restart the containers:
```bash
podman-compose -f docker-compose.prod.yml pull
podman-compose -f docker-compose.prod.yml up -d
```
This will fetch the latest image tags and recreate containers with the updated code. Downtime should be minimal (a few seconds during container restart).

## Continuous Integration and Deployment (CI/CD)

This project is set up with GitHub Actions to automate building and publishing container images, which streamlines deployment.
- **GitHub Actions Workflows**: In the repository, a workflow (YAML file under .github/workflows/) is configured to trigger on code push (and/or release tags). It will build the Docker images for both the backend and frontend.
- The Next.js image build will run the production build (npm install && npm build) to generate an optimized production app.
- The Pocketbase image might simply use a known Pocketbase version or include any custom initialization (if needed). Often, we might just use the official pocketbase/pocketbase image unless we have migrations to apply.
- **Image Publishing**: After a successful build, the workflow logs into GitHub's Container Registry (ghcr.io) and pushes the images. The images are typically tagged with the Git commit SHA or a version number, and also tagged latest for convenience. For example: ghcr.io/yourusername/telegram-prediction-frontend:latest and ...-backend:latest.
- **Configuration**: The workflow uses secrets stored in the GitHub repo (like GHCR_TOKEN or uses GitHub's provided ${{ secrets.GITHUB_TOKEN }} with permissions to packages) to authenticate to the registry. It's set to push to your repository's package registry so you (and your deployment) can pull the images.

With CI/CD in place, any new commit will go through tests/build and then you can deploy by pulling the updated images. This reduces manual steps and ensures consistency between the code and deployed containers.

## Using the Bot – How it Works (For Non-Technical Users)

Once everything is set up, here's how the prediction game bot functions from an end-user's perspective:
- **Joining the Game**: A Telegram user just needs to be a member of the channel where the bot is active. There's no separate app or login – everything happens through Telegram.
- **Starting a Prediction**: The channel admin will post a new question using the bot (for example: "Prediction: Will it rain tomorrow? Yes/No"). This appears as a message in the channel, often posted by the bot or the channel itself. Along with the question, there will be a "Vote Now" or "Place Bet" button.
- **Placing a Bet**: When a user taps the button, an app interface opens right inside Telegram (this is the Telegram WebApp). It will show the question and let the user choose an answer and how many points to bet on it. The user confirms their choice. The app will record their bet and show a confirmation (and may close automatically).
- **During the Vote**: Other users can also vote/bet while the question is open. Each user can only bet once on that question. Users might see their remaining balance in the app, so they know how many points they have left.
- **Closing the Question**: After some time, or when an outcome is determined, the admin will close the betting. They will indicate which answer was correct (for example, "Yes, it did rain."). This is usually done from the admin side (outside of what regular users do).
- **Payouts**: Once the correct answer is set, the system calculates the winners. All the points that were bet by users who guessed wrong are pooled and distributed to the users who guessed right. The more a user bet on the correct answer, the larger share of the winnings they get. For example, if two people won and one bet twice as much as the other, that person would get twice as many points from the pot.
- **Results Announcement**: The bot will post another message in the channel, for example: "Result: It did rain! Users who bet "Yes" win and have been rewarded points accordingly." Everyone who won will see their point balance increase in the next round, and those who lost will see a decrease corresponding to their bet.
- **Next Round**: The game can continue with a new question. Users keep their accumulated points across rounds. They can use their points to bet on future questions, growing their balance by winning or risking it by betting.

From a user's perspective, it's a fun way to participate in channel discussions or predictions. They don't need to understand the underlying tech – just click the button and interact with the simple interface.

For administrators and developers, the above sections detail how to set up and run the system. If you're an admin setting this up, continue to the Telegram setup guide (telegram.md) for step-by-step instructions on creating your bot and integrating it with your channel.
