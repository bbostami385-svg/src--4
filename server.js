// ==========================
// 🔥 BAYOJID AI SERVER PRO v2.0
// ==========================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================
// 🔥 Firebase Admin Init
// ==========================
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==========================
// 🔥 OpenAI NEW API INIT
// ==========================
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================
// 🔥 Middleware (Rate Limit)
// ==========================
let requestCount = {};

app.use((req, res, next) => {
  const ip = req.ip;

  if (!requestCount[ip]) requestCount[ip] = 0;
  requestCount[ip]++;

  if (requestCount[ip] > 100) {
    return res.status(429).json({ error: "Too many requests" });
  }

  setTimeout(() => {
    requestCount[ip]--;
  }, 60000);

  next();
});

// ==========================
// Routes
// ==========================

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("🔥 Bayojid AI Server PRO Running");
});

// ==========================
// 🔥 CHAT API
// ==========================
app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // 🧠 AI Response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 🔥 fast + cheap + powerful
      messages: [
        { role: "system", content: "You are a smart AI assistant." },
        ...history,
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;

    // 💾 Save to Firestore
    await db.collection("messages").add({
      userId: userId || "Anonymous",
      message: message,
      reply: reply,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ reply });

  } catch (err) {
    console.error("❌ ERROR:", err.message);

    res.status(500).json({
      error: "AI Server Error",
      details: err.message
    });
  }
});

// ==========================
// 🔥 GET CHAT HISTORY
// ==========================
app.get("/history/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("messages")
      .where("userId", "==", req.params.userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const messages = snapshot.docs.map(doc => doc.data());

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: "Failed to load history" });
  }
});

// ==========================
// 🔥 DELETE CHAT (OPTIONAL)
// ==========================
app.delete("/delete/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("messages")
      .where("userId", "==", req.params.userId)
      .get();

    const batch = db.batch();

    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({ message: "Chat deleted" });

  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
