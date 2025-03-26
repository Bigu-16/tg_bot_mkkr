## Telegram Forwarding Bot


---

## ⚙️ Prerequisites

1. Install **Node.js** (if not already installed): [Download Node.js](https://nodejs.org/)

2. Install **LocalTunnel** (for local testing):

*****
npm install -g localtunnel
*****

3. Install required npm packages:

*****
npm install express dotenv node-fetch
*****

4. Create a `.env` file to store your bot token:

*****
API_KEY=YOUR_BOT_TOKEN_HERE
PORT=3000
*****

---

## ⚡ Steps to Run the Bot

1. **Start LocalTunnel** to expose your local server:

*****
lt --port 3000
*****

- Copy the generated URL (like `https://fresh-dryers-rule.loca.lt`).

2. **Set the Telegram Webhook**:

*****
curl -F "url=https://forty-falcons-juggle.loca.lt/" https://api.telegram.org/bot5726918634:AAHww24wR_GTVKIgxzuN1V1vtHUiggG8su4/setWebhook
*****

- Replace `YOUR_BOT_TOKEN` with your actual bot token.

3. **Start the Bot**:

*****
node index.js
*****
