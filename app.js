// ================= FRONTEND: public/app.js =================

// ==== Firebase Config ====
const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8",
  measurementId: "G-NHBRHRLRQR"
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

// ==== Auth ====
async function signup() {
  try {
    await auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    loginStatus.textContent = `Logged in as ${emailInput.value}`;
    alert("Signup Successful ✅");
  } catch (err) {
    alert(err.message);
  }
}

async function login() {
  try {
    await auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
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

// ==== Chat ====
async function sendMessage() {
  if (!messageInput.value) return;

  const username = auth.currentUser
    ? auth.currentUser.email
    : "Anonymous";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: messageInput.value, username }),
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
