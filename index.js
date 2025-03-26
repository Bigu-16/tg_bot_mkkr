import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const targetChatIds = [314589754, 6635151682];

app.use(express.json());

app.post("/", async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.message) {
            return res.status(400).send("No message found in payload.");
        }

        const chatId = payload.message.chat.id;
        const userFirstName = payload.message.from.username || "User";
        console.log("Received message from:", userFirstName);

        if (payload.message.document || payload.message.photo) {
            const file = payload.message.document || payload.message.photo[0];
            const fileId = file.file_id;
            const fileType = payload.message.document ? "document" : "photo";

            for (const targetChatId of targetChatIds) {
                await sendFile(API_KEY, targetChatId, fileId, fileType);
            }
        } else if (payload.message.text) {
            const input = payload.message.text;
            for (const targetChatId of targetChatIds) {
                const response = `${userFirstName} said: ${input}`;
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
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
        const data = await response.json();
        if (!data.ok) {
            console.error(`Failed to send message to ${chatId}:`, data.description);
        }
    } catch (error) {
        console.error(`Error sending message to ${chatId}:`, error);
    }
}

async function sendFile(apiKey, chatId, fileId, fileType) {
    const url = `https://api.telegram.org/bot${apiKey}/send${fileType === 'document' ? 'Document' : 'Photo'}`;
    try {
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
            console.error(`Failed to send ${fileType} to ${chatId}:`, data.description);
        }
    } catch (error) {
        console.error(`Error sending ${fileType} to ${chatId}:`, error);
    }
} 

app.listen(PORT, () => {
    console.log(`Bot is running on http://localhost:${PORT}`);
});
