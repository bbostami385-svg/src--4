// =======================================
// index_searchableHistory.js - Bayojid AI Backend
// Step 2: Searchable Chat History
// =======================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// =============== OpenAI Setup ===============
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// =============== Firebase Setup ===============
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/firestore");

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

let currentRoom = null;

// ================= ROUTES =================

// Root
app.get("/", (req, res) => {
  res.send("Bayojid AI Server with Searchable History ✅");
});

// ================= CHAT ROUTE WITH HISTORY =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message }]
    });

    const aiReply = response.data.choices[0].message.content;

    // Save chat to Firebase
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
    const snapshot = await messagesRef
      .orderBy("timestamp")
      .get();

    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.text.toLowerCase().includes(query.toLowerCase()) ||
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

// ================= TODOs =================
// Step 3: Typing Indicator Backend
// Step 4: Video Meeting Signaling

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
