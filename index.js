// ========================================
// Bayojid AI Backend (firebase-admin ছাড়া)
// Demo + Real AI একসাথে
// ========================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/firestore");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// =============== OpenAI Setup ===============
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "", // Empty হলে demo
});
const openai = new OpenAIApi(configuration);
const isRealAI = !!process.env.OPENAI_API_KEY;

// =============== Firebase Setup ===============
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

// =============== Global Variables ===============
let currentRoom = null;

// =============== ROUTES ===============

// Health check
app.get("/", (req, res) => {
  res.send("🔥 Bayojid AI Backend Running");
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
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });
  try {
    await db.collection("rooms").doc(roomId).set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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

// ================= CHAT =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    let aiReply = "";

    if (isRealAI) {
      // Real AI
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: message }]
      });
      aiReply = response.data.choices[0].message.content;
    } else {
      // Demo AI
      aiReply = `Demo reply: ${message.split("").reverse().join("")}`;
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

// ================= SEARCH =================
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

// ================= TYPING INDICATOR =================
app.post("/typing", async (req, res) => {
  try {
    const { username, typing } = req.body;
    if (!currentRoom) return res.status(400).json({ error: "No active room" });

    await db.collection("rooms").doc(currentRoom)
      .collection("typing")
      .doc(username || "Anonymous")
      .set({ typing, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/typing-status", async (req, res) => {
  try {
    if (!currentRoom) return res.status(400).json({ error: "No active room" });
    const snap = await db.collection("rooms").doc(currentRoom).collection("typing").get();
    const typingUsers = [];
    snap.forEach(doc => {
      if (doc.data().typing) typingUsers.push(doc.id);
    });
    res.json({ typingUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= VIDEO SIGNALING =================
app.post("/start-call", async (req, res) => {
  try {
    const { callId, username } = req.body;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const callRef = db.collection("rooms").doc(currentRoom).collection("calls").doc(callId);
    await callRef.set({ host: username || "Anonymous", createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/signal", async (req, res) => {
  try {
    const { callId, signalData, username } = req.body;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const signalsRef = db.collection("rooms").doc(currentRoom).collection("calls").doc(callId).collection("signals");
    await signalsRef.add({ sender: username || "Anonymous", signal: signalData, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/signals/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const snap = await db.collection("rooms").doc(currentRoom).collection("calls").doc(callId).collection("signals").orderBy("timestamp").get();
    const signals = [];
    snap.forEach(doc => signals.push(doc.data()));
    res.json({ signals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bayojid AI Backend Running on Port ${PORT}`));
