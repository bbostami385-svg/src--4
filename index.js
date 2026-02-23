// =======================================
// index.js - Bayojid AI Unified Backend
// Demo + Real AI + Firebase Chat
// =======================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const admin = require("firebase-admin");
const OpenAI = require("openai");

// ================= Firebase Admin =================
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ================= Express Setup =================
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ================= OpenAI Setup =================
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.log("⚠️ OPENAI_API_KEY not set, running in demo mode.");
}

// ================= Global Variables =================
let currentRoom = null;

// ================= Routes =================

// Health check
app.get("/", (req, res) => {
  res.send("🔥 Bayojid AI Unified Backend Running");
});

// ================= Auth Routes =================
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password
    });
    res.json({ message: "Signup Successful ✅", uid: userRecord.uid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // Firebase Admin SDK does not provide password login
  // For simplicity, demo login success (replace with Firebase Auth REST API for real password check)
  if (email && password) {
    res.json({ message: "Login Successful ✅", email });
  } else {
    res.status(400).json({ error: "Invalid email or password" });
  }
});

app.post("/logout", async (req, res) => {
  res.json({ message: "Logout Successful ✅" });
});

// ================= Chat Route =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    let aiReply = `Demo mode: তুমি বলেছ "${message}"`;

    // If API key available, use real OpenAI
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Bayojid AI, a helpful assistant." },
          { role: "user", content: message }
        ]
      });
      aiReply = completion.choices[0].message.content;
    }

    // Save to Firestore if room exists
    const roomRef = currentRoom ? db.collection("rooms").doc(currentRoom) : db.collection("rooms").doc("global");
    await roomRef.collection("messages").add({
      sender: username || "Anonymous",
      text: message,
      reply: aiReply,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= Optional: Set Current Room =================
app.post("/set-room", (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });
  currentRoom = roomId;
  res.json({ message: `Current room set to ${roomId}` });
});

// ================= Server Start =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bayojid AI Running on Port ${PORT}`));
