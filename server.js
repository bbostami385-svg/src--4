// ========================================
// Bayojid AI - REAL OpenAI Production Backend
// ========================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");
const admin = require("firebase-admin");

// ===============================
// Firebase Admin Init
// ===============================
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===============================
// Express Setup
// ===============================
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ===============================
// OpenAI Init (Real)
// ===============================
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠ OPENAI_API_KEY not found in .env");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// Health Check
// ===============================
app.get("/", (req, res) => {
  res.send("🔥 Bayojid AI Real Server Running");
});

// ===============================
// REAL AI CHAT ENDPOINT
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API Key not configured"
      });
    }

    // Conversation memory support
    const messages = [
      {
        role: "system",
        content:
          "You are Bayojid AI, a smart, helpful, and respectful assistant."
      }
    ];

    if (Array.isArray(history)) {
      history.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    messages.push({
      role: "user",
      content: message
    });

    // 🔥 REAL GPT CALL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      error: "AI processing failed",
      details: error.message
    });
  }
});

// ===============================
// BASIC RATE LIMIT (Simple Protection)
// ===============================
const rateLimit = {};
app.use("/chat", (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimit[ip]) {
    rateLimit[ip] = [];
  }

  rateLimit[ip] = rateLimit[ip].filter(
    timestamp => now - timestamp < 60000
  );

  if (rateLimit[ip].length > 20) {
    return res.status(429).json({
      error: "Too many requests. Please slow down."
    });
  }

  rateLimit[ip].push(now);
  next();
});

// ===============================
// Server Start
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Bayojid AI Running on Port ${PORT}`);
});
