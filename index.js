// =======================================
// Bayojid AI - PREMIUM ROOM VERSION
// =======================================

const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat.firebaseapp.com",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const API_BASE = "https://src-4-a535.onrender.com";

let currentRoom = null;
let unsubscribe = null;

// ================= AUTH =================

function signup() {
  auth.createUserWithEmailAndPassword(emailInput().value, passwordInput().value)
    .then(() => alert("Signup Successful ✅"))
    .catch(err => alert(err.message));
}

function login() {
  auth.signInWithEmailAndPassword(emailInput().value, passwordInput().value)
    .then(() => alert("Login Successful ✅"))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(async user => {
  if (user) {
    document.getElementById("user-status").innerText =
      "Logged in as: " + user.email;

    // Create user doc if not exists
    const userRef = db.collection("users").doc(user.email);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        premium: false
      });
    }

    joinRoom("global-room");
  } else {
    document.getElementById("user-status").innerText = "Not logged in";
    document.getElementById("chat-box").innerHTML = "";
  }
});

// ================= CREATE ROOM =================

async function createRoom() {
  if (!auth.currentUser) return alert("Login first ❌");

  const roomId = prompt("Enter new Room ID:");
  if (!roomId) return;

  const isPremiumRoom = confirm("Make this a Premium Room?");

  const roomRef = db.collection("rooms").doc(roomId);
  const snap = await roomRef.get();

  if (snap.exists) return alert("Room already exists!");

  await roomRef.set({
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: auth.currentUser.email,
    premium: isPremiumRoom
  });

  alert("Room created ✅");
  joinRoom(roomId);
}

// ================= JOIN ROOM =================

async function joinRoom(roomId) {
  if (!auth.currentUser) return;

  const roomRef = db.collection("rooms").doc(roomId);
  const snap = await roomRef.get();

  if (!snap.exists) return alert("Room does not exist!");

  const roomData = snap.data();

  const userRef = db.collection("users").doc(auth.currentUser.email);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  if (roomData.premium && !userData.premium) {
    alert("This is a Premium Room 🔒 Upgrade required.");
    return;
  }

  currentRoom = roomId;
  document.getElementById("current-room").innerText =
    "Current Room: " + roomId;

  if (unsubscribe) unsubscribe();

  unsubscribe = roomRef.collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {

      const chatBox = document.getElementById("chat-box");
      chatBox.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "message " +
          (data.sender === auth.currentUser.email ? "user" : "ai");
        div.innerText = data.sender + ": " + data.text;
        chatBox.appendChild(div);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ================= SEND MESSAGE =================

async function sendMessage() {
  if (!auth.currentUser || !currentRoom) return;

  const input = document.getElementById("chat-input");
  const message = input.value;
  if (!message) return;

  const roomRef = db.collection("rooms").doc(currentRoom);

  await roomRef.collection("messages").add({
    sender: auth.currentUser.email,
    text: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    await roomRef.collection("messages").add({
      sender: "Bayojid AI",
      text: data.reply,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

  } catch {
    console.log("Backend failed");
  }

  input.value = "";
}

// ================= THEME =================

function toggleTheme() {
  document.body.classList.toggle("light");
}

// ================= HELPERS =================

function emailInput() {
  return document.getElementById("email");
}

function passwordInput() {
  return document.getElementById("password");
}
