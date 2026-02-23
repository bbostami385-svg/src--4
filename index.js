// ===============================
// Bayojid AI Render-ready Server
// ===============================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const admin = require("firebase-admin");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// ================= Firebase Admin Init =================
const serviceAccount = require("./serviceAccountKey.json"); // তোমার admin JSON ফাইল

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ================= OpenAI Setup =================
let openai;
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  openai = new OpenAIApi(configuration);
  console.log("⚡ OpenAI Enabled (Real GPT) ");
} else {
  console.log("⚡ OpenAI Disabled (Demo Mode) ");
}

// ================= Routes =================

// Health Check
app.get("/", (req, res) => {
  res.send("Bayojid AI Server Running ✅");
});

// Chat Route
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    let reply;

    if (openai) {
      // Real GPT Call
      const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      });
      reply = completion.data.choices[0].message.content;
    } else {
      // Demo reply
      reply = `Demo reply: "${message}"`;
    }

    // Save to Firestore (optional)
    if (username) {
      await db.collection("messages").add({
        sender: username,
        text: message,
        reply,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ================= Server Start =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bayojid AI Server running on port ${PORT}`));
