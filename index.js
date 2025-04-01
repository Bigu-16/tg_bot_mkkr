import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const targetChatIds = [314589754, 6635151682];

// Validate environment variables
if (!API_KEY) {
  console.error("ERROR: API_KEY is not set in environment variables!");
  process.exit(1);
}

app.use(express.json());

// Add root endpoint
app.get("/", (req, res) => {
  res.send(`
    <h1>Telegram Bot is Running</h1>
    <p>This is a Telegram bot webhook endpoint.</p>
    <p>Status: <span style="color: green;">Active</span></p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/health">/health</a> - Check bot health status</li>
      <li>POST / - Webhook endpoint for Telegram updates</li>
    </ul>
  `);
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Bot is healthy!");
});

app.post("/", async (req, res) => {
  try {
    console.log("Received webhook payload:", JSON.stringify(req.body, null, 2));
    const payload = req.body;

    if (!payload.message) {
      console.log("No message found in payload");
      return res.status(400).send("No message found in payload.");
    }

    const chatId = payload.message.chat.id;
    const userFirstName = payload.message.from.username || "User";

    // Check if the message is a reply from an admin
    if (payload.message.reply_to_message) {
      const originalUserChatId =
        payload.message.reply_to_message.text.match(/User ID: (\d+)/)?.[1];
      if (originalUserChatId) {
        const adminReply = payload.message.text;
        await sendMessage(API_KEY, originalUserChatId, `Admin: ${adminReply}`);
        console.log(`Forwarded admin reply to user ${originalUserChatId}`);
        return res.status(200).send("OK");
      }
    }

    // Forward user messages to admins
    if (payload.message.document || payload.message.photo) {
      const file = payload.message.document || payload.message.photo[0];
      const fileId = file.file_id;
      const fileType = payload.message.document ? "document" : "photo";

      for (const targetChatId of targetChatIds) {
        await sendFile(API_KEY, targetChatId, fileId, fileType);
        await sendMessage(
          API_KEY,
          targetChatId,
          `User ${userFirstName} (User ID: ${chatId}) sent a ${fileType}.`
        );
      }
    } else if (payload.message.text) {
      const input = payload.message.text;
      for (const targetChatId of targetChatIds) {
        const response = `User ${userFirstName} (User ID: ${chatId}) said: "${input}"`;
        await sendMessage(API_KEY, targetChatId, response);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function sendMessage(apiKey, chatId, text) {
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  try {
    console.log(`Attempting to send message to chat ${chatId}`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`Failed to send message to ${chatId}:`, data.description);
    } else {
      console.log(`Successfully sent message to chat ${chatId}`);
    }
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
  }
}

async function sendFile(apiKey, chatId, fileId, fileType) {
  const url = `https://api.telegram.org/bot${apiKey}/send${
    fileType === "document" ? "Document" : "Photo"
  }`;
  try {
    console.log(`Attempting to send ${fileType} to chat ${chatId}`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        [fileType]: fileId,
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(
        `Failed to send ${fileType} to ${chatId}:`,
        data.description
      );
    } else {
      console.log(`Successfully sent ${fileType} to chat ${chatId}`);
    }
  } catch (error) {
    console.error(`Error sending ${fileType} to ${chatId}:`, error);
  }
}

app.listen(PORT, () => {
  console.log(`Bot is running on http://localhost:${PORT}`);
  console.log("Environment variables loaded:", {
    PORT,
    API_KEY: API_KEY ? "Set" : "Not set",
    NODE_ENV: process.env.NODE_ENV,
  });
});
