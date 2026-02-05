const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

const API_URL = "https://src-4-a535.onrender.com/chat"; // তোমার Render URL

sendBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  messageInput.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "free_user", message })
    });

    const data = await res.json();

    if (data.reply) {
      appendMessage("AI", data.reply);
    } else if (data.error) {
      appendMessage("System", data.error);
    }
  } catch (err) {
    appendMessage("System", "Error connecting to AI backend");
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}