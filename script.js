// ===============================
// Bayojid AI Frontend Script
// ===============================

const API_URL = "https://src-4-a535.onrender.com/chat";

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

let chatHistory = [];

// Temporary user ID (Later Firebase UID use করবে)
const userId = "free_user_001";

// ===============================
// Append Message Function
// ===============================
function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// Send Message
// ===============================
sendBtn.addEventListener("click", async () => {

  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  messageInput.value = "";

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error("Server error: " + response.status);
    }

    const data = await response.json();

    if (data.reply) {

      appendMessage("AI", data.reply);

      // Save conversation locally
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: data.reply });

    } else if (data.error) {
      appendMessage("System", data.error);
    }

  } catch (error) {

    console.error("Fetch Error:", error);
    appendMessage("System", "⚠ Backend connection failed");

  }

});
