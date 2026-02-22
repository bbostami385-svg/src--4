// =======================================
// index_searchableHistory.js - Bayojid AI Backend
// Step 2: Searchable Chat History (Demo + Real AI)
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
  res.send(`Bayojid AI Server with Searchable History ✅ | Mode: ${isRealAI ? "Real AI" : "Demo"}`);
});

// ================= CHAT ROUTE =================
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
      // Demo mode
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

// ================= SEARCH CHAT HISTORY =================
app.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!currentRoom) return res.status(400).json({ error: "No active room" });
    if (!query) return res.status(400).json({ error: "Query required" });

    const messagesRef = db.collection("rooms").doc(currentRoom).collection("messages");
    const snapshot = await messagesRef.orderBy("timestamp").get();

    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if ((data.text && data.text.toLowerCase().includes(query.toLowerCase())) ||
          (data.reply && data.reply.toLowerCase().includes(query.toLowerCase()))) {
        results.push(data);
      }
    });

    res.json({ results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅ | Mode: ${isRealAI ? "Real AI" : "Demo"}`));
