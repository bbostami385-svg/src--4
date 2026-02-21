// =====================================================
// BAYOJID AI - Persistent Room System (Firestore)
// =====================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// CREATE ROOM
// =====================================================
app.post("/room/create", async (req, res) => {
  try {
    const { roomId, creator } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (snap.exists) {
      return res.status(400).json({ error: "Room already exists" });
    }

    await roomRef.set({
      createdBy: creator,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      premium: false,
      admins: [creator],
      kickedUsers: []
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// JOIN ROOM
// =====================================================
app.post("/room/join", async (req, res) => {
  try {
    const { roomId, user } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists)
      return res.status(404).json({ error: "Room not found" });

    const data = snap.data();

    if (data.kickedUsers.includes(user))
      return res.status(403).json({ error: "You are kicked" });

    res.json({ success: true, room: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// ADD ADMIN
// =====================================================
app.post("/room/admin/add", async (req, res) => {
  try {
    const { roomId, currentAdmin, newAdmin } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists)
      return res.status(404).json({ error: "Room not found" });

    const data = snap.data();

    if (!data.admins.includes(currentAdmin))
      return res.status(403).json({ error: "Not authorized" });

    await roomRef.update({
      admins: admin.firestore.FieldValue.arrayUnion(newAdmin)
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// REMOVE ADMIN
// =====================================================
app.post("/room/admin/remove", async (req, res) => {
  try {
    const { roomId, currentAdmin, targetAdmin } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists)
      return res.status(404).json({ error: "Room not found" });

    const data = snap.data();

    if (!data.admins.includes(currentAdmin))
      return res.status(403).json({ error: "Not authorized" });

    if (targetAdmin === data.createdBy)
      return res.status(400).json({ error: "Cannot remove creator" });

    await roomRef.update({
      admins: admin.firestore.FieldValue.arrayRemove(targetAdmin)
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// KICK USER
// =====================================================
app.post("/room/user/kick", async (req, res) => {
  try {
    const { roomId, adminUser, targetUser } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists)
      return res.status(404).json({ error: "Room not found" });

    const data = snap.data();

    if (!data.admins.includes(adminUser))
      return res.status(403).json({ error: "Not authorized" });

    await roomRef.update({
      kickedUsers: admin.firestore.FieldValue.arrayUnion(targetUser)
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// SEND MESSAGE (Persistent History)
// =====================================================
app.post("/chat", async (req, res) => {
  try {
    const { roomId, sender, message } = req.body;

    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();

    if (!snap.exists)
      return res.status(404).json({ error: "Room not found" });

    const data = snap.data();

    if (data.kickedUsers.includes(sender))
      return res.status(403).json({ error: "You are kicked" });

    // Save user message
    await roomRef.collection("messages").add({
      sender,
      text: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // AI Response (Replace this function later)
    const aiReply = `Bayojid AI: ${message}`;

    await roomRef.collection("messages").add({
      sender: "AI",
      text: aiReply,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ reply: aiReply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// GET CHAT HISTORY
// =====================================================
app.get("/room/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;

    const snapshot = await db.collection("rooms")
      .doc(roomId)
      .collection("messages")
      .orderBy("timestamp")
      .get();

    const messages = [];

    snapshot.forEach(doc => {
      messages.push(doc.data());
    });

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Bayojid AI Server running on port ${PORT}`);
});
