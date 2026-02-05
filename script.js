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
      if (data.timeLeft) {
        appendMessage("System", `Time left: ${Math.floor(data.timeLeft/60)} min`);
      }
    } else if (data.error) {
      appendMessage("System", data.error);
    }
  } catch (err) {
    appendMessage("System", "Error connecting to AI backend");
  }
});