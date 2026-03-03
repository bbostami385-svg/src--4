// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Functions
window.signup = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try { await createUserWithEmailAndPassword(auth, email, password); alert("Signup Success ✅"); }
  catch(err){ alert(err.message); }
};
window.login = async function() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try { await signInWithEmailAndPassword(auth, email, password); alert("Login Success ✅"); }
  catch(err){ alert(err.message); }
};
window.logout = async function() { await signOut(auth); alert("Logged Out ✅"); };

// Auto login state
onAuthStateChanged(auth, user => {
  document.getElementById("user-status").innerText = user ? "Logged in as " + user.email : "Not logged in";
});

// Room System
let currentRoom = null;
window.createRoom = async function() {
  if (!auth.currentUser) { alert("Login first!"); return; }
  const roomName = prompt("Enter Room Name"); if(!roomName) return;
  const roomRef = await addDoc(collection(db, "rooms"), { name: roomName, createdBy: auth.currentUser.email, createdAt: serverTimestamp() });
  currentRoom = roomRef.id; alert("Room Created ✅"); listenMessages(currentRoom);
};
window.sendMessage = async function() {
  if (!currentRoom || !auth.currentUser) { alert("Create room or login first!"); return; }
  const input = document.getElementById("chat-input");
  const text = input.value; if (!text) return;
  await addDoc(collection(db, "rooms", currentRoom, "messages"), { sender: auth.currentUser.email, text: text, timestamp: serverTimestamp() });
  input.value = "";
};
function listenMessages(roomId){
  const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    const chatBox = document.getElementById("chat-box"); chatBox.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data(); const div = document.createElement("div"); div.classList.add("message");
      div.classList.add(data.sender === auth.currentUser.email ? "user" : "ai"); div.innerText = data.sender + ": " + data.text; chatBox.appendChild(div);
    });
  });
    }
