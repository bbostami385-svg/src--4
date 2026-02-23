// ================== index.js ==================

// ==== Firebase Config ====
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

// ==== DOM Elements ====
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginStatus = document.getElementById("user-status");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("chat-input");

// ==== Auth Functions ====
async function signup() {
  try {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
    loginStatus.textContent = `Logged in as ${emailInput.value}`;
    alert("Signup Successful ✅");
  } catch (err) {
    alert(err.message);
  }
}

async function login() {
  try {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    loginStatus.textContent = `Logged in as ${emailInput.value}`;
    alert("Login Successful ✅");
  } catch (err) {
    alert(err.message);
  }
}

async function logout() {
  try {
    await auth.signOut();
    loginStatus.textContent = "Not logged in";
    alert("Logout Successful ✅");
  } catch (err) {
    alert(err.message);
  }
}

// ==== Room Functions ====
let currentRoom = null;

async function createRoom() {
  const roomId = prompt("Enter Room ID:");
  if (!roomId) return;

  const res = await fetch("/create-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId })
  });
  const data = await res.json();
  if (!res.ok) alert(data.error || "Error creating room");
  else {
    currentRoom = roomId;
    alert(data.message);
  }
}

async function joinRoom(roomId) {
  if (!roomId) return;
  const res = await fetch("/join-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId })
  });
  const data = await res.json();
  if (!res.ok) alert(data.error || "Error joining room");
  else {
    currentRoom = roomId;
    alert(data.message);
    loadChatHistory();
  }
}

// ==== Chat Functions ====
async function sendMessage() {
  if (!messageInput.value) return;
  if (!currentRoom) return alert("Join or create a room first");

  const username = auth.currentUser ? auth.currentUser.email : "Anonymous";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: messageInput.value, username })
  });
  const data = await res.json();
  appendMessage(username, messageInput.value, true);
  appendMessage("AI", data.reply, false);
  messageInput.value = "";
}

function appendMessage(sender, text, isUser) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(isUser ? "user" : "ai");
  div.textContent = `${sender}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==== Load Chat History ====
async function loadChatHistory() {
  if (!currentRoom) return;
  const res = await fetch(`/search?query=`, { method: "GET" });
  const data = await res.json();
  chatBox.innerHTML = "";
  if (data.results && data.results.length > 0) {
    data.results.forEach(msg => {
      appendMessage(msg.sender, msg.text, true);
      if (msg.reply) appendMessage("AI", msg.reply, false);
    });
  }
}

// ==== Typing Indicator ====
let typingTimeout;
function setTyping(isTyping) {
  if (!currentRoom) return;
  const username = auth.currentUser ? auth.currentUser.email : "Anonymous";
  fetch("/typing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, typing: isTyping })
  });
  if (isTyping) {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => setTyping(false), 3000);
  }
}

// ==== Poll Typing Status ====
setInterval(async () => {
  if (!currentRoom) return;
  const res = await fetch("/typing-status");
  const data = await res.json();
  const typingDiv = document.getElementById("typing-status");
  typingDiv.textContent = data.typingUsers.length
    ? `Typing: ${data.typingUsers.join(", ")}`
    : "";
}, 1500);

// ==== Video Signaling ====
async function startCall() {
  const callId = prompt("Enter Call ID:");
  if (!callId || !currentRoom) return;
  const username = auth.currentUser ? auth.currentUser.email : "Anonymous";
  await fetch("/start-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callId, username })
  });
  alert("Call started ✅");
}

async function joinCall() {
  const callId = prompt("Enter Call ID to join:");
  if (!callId || !currentRoom) return;
  alert("Joined call ✅ - Video Signaling works via Firestore");
}

// ==== Admin Panel (Optional) ====
function promoteToAdmin() { alert("Promote functionality here"); }
function removeAdmin() { alert("Remove Admin functionality here"); }
function toggleTheme() { document.body.classList.toggle("dark"); }
