// ===============================
// Bayojid AI - FINAL Professional Server
// ===============================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { OpenAI } = require("openai");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/firestore");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// Firebase Init
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===============================
// OpenAI Setup (Auto Demo/Real)
// ===============================
let openai = null;
let isRealAI = false;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  isRealAI = true;
  console.log("🚀 Real AI Mode");
} else {
  console.log("⚠ Demo Mode");
}

// ===============================
// Auth Routes
// ===============================
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    await auth.createUserWithEmailAndPassword(email, password);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    await auth.signInWithEmailAndPassword(email, password);
    res.json({ success: true, user: auth.currentUser.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===============================
// Room System
// ===============================
app.post("/create-room", async (req, res) => {
  const { roomId } = req.body;
  await db.collection("rooms").doc(roomId).set({
    createdAt: Date.now()
  });
  res.json({ success: true });
});

app.post("/join-room", async (req, res) => {
  const { roomId } = req.body;
  const room = await db.collection("rooms").doc(roomId).get();
  if (!room.exists) return res.status(404).json({ error: "Room not found" });
  res.json({ success: true });
});

// ===============================
// Chat System
// ===============================
app.post("/chat", async (req, res) => {
  try {
    const { message, roomId } = req.body;

    let reply = "";

    if (isRealAI) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      });
      reply = completion.choices[0].message.content;
    } else {
      reply = `Demo Mode Reply: "${message}"`;
    }

    await db.collection("rooms").doc(roomId)
      .collection("messages").add({
        user: message,
        ai: reply,
        time: Date.now()
      });

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Search
// ===============================
app.get("/search", async (req, res) => {
  const { roomId, query } = req.query;
  const snap = await db.collection("rooms").doc(roomId)
    .collection("messages").get();

  let results = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (data.user.includes(query) || data.ai.includes(query)) {
      results.push(data);
    }
  });

  res.json({ results });
});

// ===============================
// Typing Indicator
// ===============================
app.post("/typing", async (req, res) => {
  const { roomId, user, status } = req.body;
  await db.collection("rooms").doc(roomId)
    .collection("typing").doc(user).set({ status });
  res.json({ success: true });
});

// ===============================
// Video Signaling
// ===============================
app.post("/signal", async (req, res) => {
  const { roomId, signal } = req.body;
  await db.collection("rooms").doc(roomId)
    .collection("signals").add(signal);
  res.json({ success: true });
});

// ===============================
// Server Start
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🔥 Server running on ${PORT} | Mode: ${isRealAI ? "Real" : "Demo"}`)
);
