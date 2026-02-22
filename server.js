// ========================================
// Bayojid AI - Final Production Backend
// Real AI + Fallback + Firestore + Rate Limit
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
// Basic Rate Limit (Before Routes)
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
// OpenAI Init
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// Health Check
// ===============================
app.get("/", (req, res) => {
  res.send("🔥 Bayojid AI Production Server Running");
});

// ===============================
// CHAT ENDPOINT (Real + Fallback)
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { message, history, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        error: "Message and userId required"
      });
    }

    let reply;

    try {
      // Prepare conversation
      const messages = [
        {
          role: "system",
          content:
            "You are Bayojid AI, a smart, respectful, helpful assistant."
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

      // 🔥 Try Real OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      reply = completion.choices[0].message.content;

      console.log("✅ Real OpenAI Used");

    } catch (aiError) {

      console.log("⚠ OpenAI failed → Demo Mode Activated");

      // 🔥 Fallback Demo Reply
      reply = `Demo Mode: তুমি বলেছ "${message}"`;
    }

    // 🔥 Always Save Conversation
    await db.collection("conversations")
      .doc(userId)
      .collection("messages")
      .add({
        userMessage: message,
        aiReply: reply,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({
      error: "Server processing failed"
    });
  }
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Bayojid AI Running on Port ${PORT}`);
});
