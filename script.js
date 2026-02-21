const API_URL = "http://localhost:3000/chat"; 
// Deploy করলে এখানে Render URL দিবে

let chatHistory = [];

sendBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  messageInput.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    const data = await res.json();

    if (data.reply) {
      appendMessage("AI", data.reply);

      // Save conversation memory
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: data.reply });

    } else if (data.error) {
      appendMessage("System", data.error);
    }

  } catch (err) {
    appendMessage("System", "Error connecting to AI backend");
  }
});
