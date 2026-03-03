// ==========================
// server.js - Bayojid AI Backend
// ==========================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ==========================
// Firebase Admin Init
// ==========================
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json"); // তোমার Firebase Admin Key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==========================
// OpenAI Init
// ==========================
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

// ==========================
// Routes
// ==========================

// Simple Health Check
app.get("/", (req, res) => res.send("Bayojid AI Server is running ✅"));

// Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], userId } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [...history, { role: "user", content: message }],
    });

    const reply = completion.data.choices[0].message.content;

    // Save to Firestore
    await db.collection("messages").add({
      sender: userId || "Anonymous",
      text: message,
      reply: reply,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// Start Server
// ==========================
app.listen(port, () => console.log(`Server running on port ${port} ✅`));
