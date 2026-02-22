// =======================================
// script.js - Bayojid AI Frontend (Final Version)
// =======================================

// ===============================
// Firebase Config & Init
// ===============================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8",
  measurementId: "G-NHBRHRLRQR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);

// ===============================
// DOM Elements
// ===============================
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.querySelector("button[onclick='login()']");
const signupBtn = document.querySelector("button[onclick='signup()']");
const logoutBtn = document.querySelector("button[onclick='logout()']");
const loginStatus = document.getElementById("user-status");
const sendBtn = document.querySelector(".chat-input-area button");
const messageInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

// ===============================
// Backend URL
// ===============================
const API_URL = "https://src-4-a535.onrender.com/chat";

// ===============================
// Auth Functions
// ===============================
function signup() {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => alert("Signup Successful ✅"))
    .catch(err => alert(err.message));
}

function login() {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .then(() => alert("Login Successful ✅"))
    .catch(err => alert(err.message));
}

function logout() {
  signOut(auth);
}

// Track auth state
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    loginStatus.innerText = `Logged in as: ${user.email}`;
  } else {
    loginStatus.innerText = "Not logged in";
    chatBox.innerHTML = "";
  }
});

// ===============================
// Chat Functions
// ===============================
let chatHistory = [];

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "message " + (sender === "You" ? "user" : "ai");
  div.innerText = `${sender}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !currentUser) return;

  appendMessage("You", message);
  messageInput.value = "";

  // Save to Firestore
  try {
    await addDoc(collection(db, "messages"), {
      sender: currentUser.email,
      text: message,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore Error:", err);
  }

  // Send to backend
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        history: chatHistory,
        userId: currentUser.uid
      })
    });

    const data = await res.json();

    if (data.reply) {
      appendMessage("AI", data.reply);
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: data.reply });
    } else if (data.error) {
      appendMessage("System", data.error);
    }
  } catch (err) {
    appendMessage("System", "Error connecting to AI backend");
    console.error(err);
  }
}

// Event listener
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ===============================
// Load chat history from Firestore (optional)
// ===============================
const messagesCol = collection(db, "messages");
onSnapshot(messagesCol, (snapshot) => {
  chatBox.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    appendMessage(data.sender === currentUser?.email ? "You" : "AI", data.text);
  });
});

// ===============================
// Export functions for buttons
// ===============================
window.signup = signup;
window.login = login;
window.logout = logout;
window.sendMessage = sendMessage;
