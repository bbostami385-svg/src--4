// server.js - Bayojid AI Backend (Future-Ready)

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env for API keys etc.

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    // -----------------------------
    // TODO: Replace demo reply with real AI API call
    // Example for OpenAI GPT:
    // const reply = await openai.createChatCompletion({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: message }]
    // });
    // const aiReply = reply.data.choices[0].message.content;
    // -----------------------------

    // Demo reply
    const aiReply = `আমি এখন demo mode এ আছি। তুমি বলেছ: "${message}"`;

    res.json({ reply: aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Optional: Premium check endpoint (future-ready)
app.post("/premium-check", (req, res) => {
  const { username } = req.body;
  // TODO: Implement real premium logic
  const isPremium = false; // Demo
  res.json({ username, isPremium });
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
