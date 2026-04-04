// ==========================
// 🔥 BAYOJID AI SERVER PRO MAX v3.0
// ==========================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// 🔥 MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ==========================
// 🔥 FIREBASE ADMIN INIT
// ==========================
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// ==========================
// 🔥 OPENAI INIT (NEW SDK)
// ==========================
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================
// 🔥 RATE LIMIT (IMPROVED)
// ==========================
const rateLimitMap = new Map();

app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(t => now - t < 60000);

  requests.push(now);
  rateLimitMap.set(ip, requests);

  if (requests.length > 60) {
    return res.status(429).json({ error: "Too many requests 🚫" });
  }

  next();
});

// ==========================
// 🔥 HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "🔥 Bayojid AI Server PRO MAX Running",
    time: new Date()
  });
});

// ==========================
// 🔥 CHAT API (SMART)
// ==========================
app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], userId = "Anonymous" } = req.body;

    if (!message || message.length > 2000) {
      return res.status(400).json({ error: "Invalid message" });
    }

    // 🧠 AI RESPONSE
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a powerful AI assistant. Be helpful, smart and fast."
        },
        ...history.slice(-10),
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content || "No response";

    // 💾 SAVE (async safe)
    db.collection("messages").add({
      userId,
      message,
      reply,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});

    res.json({ reply });

  } catch (err) {
    console.error("❌ CHAT ERROR:", err.message);

    res.status(500).json({
      error: "AI Server Error",
      details: err.message
    });
  }
});

// ==========================
// 🔥 HISTORY API (OPTIMIZED)
// ==========================
app.get("/history/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("messages")
      .where("userId", "==", req.params.userId)
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const messages = snapshot.docs.map(doc => doc.data());

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: "Failed to load history" });
  }
});

// ==========================
// 🔥 DELETE CHAT (SAFE)
// ==========================
app.delete("/delete/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("messages")
      .where("userId", "==", req.params.userId)
      .get();

    const batch = db.batch();

    snapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({ message: "Chat deleted ✅" });

  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================
// 🔥 GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
