// =======================================
// index_realAI_full.js - Bayojid AI Backend (Demo + Real AI Ready)
// =======================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/firestore");

// ===============================
// Firebase Config
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
// OpenAI Setup
// ===============================
let openai = null;
let isRealAI = false;

if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  openai = new OpenAIApi(configuration);
  isRealAI = true;
  console.log("🚀 Real OpenAI GPT enabled");
} else {
  console.log("⚠ Demo mode: OpenAI API Key not found");
}

// ===============================
// Express Setup
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

let currentRoom = null;

// ===============================
// Routes
// ===============================

// Root
app.get("/", (req, res) => {
  res.send(`Bayojid AI Server Running ✅ | Mode: ${isRealAI ? "Real AI" : "Demo"}`);
});

// ================= AUTH =================
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    res.json({ message: "Signup Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    res.json({ message: "Login Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  try {
    await auth.signOut();
    res.json({ message: "Logout Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= ROOM SYSTEM =================
app.post("/create-room", async (req, res) => {
  if (!auth.currentUser) return res.status(401).json({ error: "Login first ❌" });
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });
  try {
    await db.collection("rooms").doc(roomId).set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.email,
      premium: false
    });
    currentRoom = roomId;
    res.json({ message: `Room ${roomId} created ✅` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/join-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });
  try {
    const snap = await db.collection("rooms").doc(roomId).get();
    if (!snap.exists) return res.status(404).json({ error: "Room not found" });
    currentRoom = roomId;
    res.json({ message: `Joined Room: ${roomId} ✅`, roomData: snap.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/delete-room", async (req, res) => {
  if (!currentRoom) return res.status(400).json({ error: "No active room" });
  try {
    await db.collection("rooms").doc(currentRoom).delete();
    currentRoom = null;
    res.json({ message: "Room deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/toggle-premium", async (req, res) => {
  if (!currentRoom) return res.status(400).json({ error: "No active room" });
  try {
    const roomRef = db.collection("rooms").doc(currentRoom);
    const snap = await roomRef.get();
    const currentStatus = snap.data().premium;
    await roomRef.update({ premium: !currentStatus });
    res.json({ message: `Premium status changed to ${!currentStatus} ✅` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    let aiReply = "";

    if (isRealAI) {
      // Real GPT
      const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        max_tokens: 500
      });
      aiReply = completion.data.choices[0].message.content;
    } else {
      // Demo mode reply
      aiReply = `Demo Mode: তুমি বলেছ "${message}"`;
    }

    // Save chat to Firestore
    if (currentRoom) {
      await db.collection("rooms").doc(currentRoom)
        .collection("messages")
        .add({
          sender: username || "Anonymous",
          text: message,
          reply: aiReply,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    res.json({ reply: aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= PREMIUM CHECK =================
app.post("/premium-check", (req, res) => {
  const { username } = req.body;
  const isPremium = false; // Demo logic
  res.json({ username, isPremium });
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅ | Mode: ${isRealAI ? "Real AI" : "Demo"}`));
