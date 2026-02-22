// =======================================
// Bayojid AI - Main Frontend Logic
// =======================================

// Firebase Config (ES Modules version)
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8",
  measurementId: "G-NHBRHRLRQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Backend URL
const API_URL = "https://src-4-a535.onrender.com/chat";

// UI Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginStatus = document.getElementById("user-status");
const messageInput = document.getElementById("chat-input");
const sendBtn = document.querySelector("button[onclick='sendMessage()']");
const chatBox = document.getElementById("chat-box");

// Chat History
let chatHistory = [];
let currentUser = null;
let currentRoom = null;

// ================= AUTH =================
function signup() {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(userCredential => {
      currentUser = userCredential.user;
      loginStatus.innerText = `Logged in as: ${currentUser.email}`;
      alert("Signup Successful ✅");
    })
    .catch(err => alert(err.message));
}

function login() {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(userCredential => {
      currentUser = userCredential.user;
      loginStatus.innerText = `Logged in as: ${currentUser.email}`;
      alert("Login Successful ✅");
    })
    .catch(err => alert(err.message));
}

function logout() {
  signOut(auth).then(() => {
    currentUser = null;
    loginStatus.innerText = "Not logged in";
    chatBox.innerHTML = "";
    alert("Logged out ✅");
  });
}

// Listen Auth State
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginStatus.innerText = `Logged in as: ${user.email}`;
  } else {
    currentUser = null;
    loginStatus.innerText = "Not logged in";
    chatBox.innerHTML = "";
  }
});

// ================= ROOM SYSTEM =================
async function createRoom() {
  if (!currentUser) return alert("Login first ❌");
  const roomId = prompt("Enter Room ID:");
  if (!roomId) return;

  await setDoc(doc(db, "rooms", roomId), {
    createdBy: currentUser.email,
    createdAt: new Date(),
    premium: false
  });

  joinRoom(roomId);
}

async function joinRoom(roomId) {
  if (!currentUser) return alert("Login first ❌");
  const roomRef = doc(db, "rooms", roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return alert("Room not found ❌");

  currentRoom = roomId;
  document.getElementById("current-room").innerText = `Current Room: ${roomId}`;

  // Listen for messages
  const messagesCol = collection(db, "rooms", roomId, "messages");
  const q = query(messagesCol, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    chatBox.innerHTML = "";
    chatHistory = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      chatHistory.push({ role: data.sender === currentUser.email ? "user" : "ai", content: data.text });
      appendMessage(data.sender, data.text, data.sender === currentUser.email ? "user" : "ai");
    });
  });
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  if (!currentUser) return alert("Login first ❌");
  if (!currentRoom) return alert("Join a room first ❌");

  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage(currentUser.email, message, "user");
  messageInput.value = "";

  // Save to Firestore
  await addDoc(collection(db, "rooms", currentRoom, "messages"), {
    sender: currentUser.email,
    text: message,
    timestamp: new Date()
  });

  // Send to AI backend
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: chatHistory
      })
    });

    const data = await res.json();
    if (data.reply) {
      appendMessage("AI", data.reply, "ai");
      chatHistory.push({ role: "ai", content: data.reply });
    }
  } catch (err) {
    appendMessage("System", "Error connecting to AI backend", "ai");
  }
}

// ================= HELPERS =================
function appendMessage(sender, text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.innerText = `${sender}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
