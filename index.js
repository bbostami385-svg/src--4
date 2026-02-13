app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";

    let reply;

    if (message.toLowerCase().includes("hello")) {
      reply = "Hello! আমি Bayojid AI 😊";
    } else if (message.toLowerCase().includes("bangladesh")) {
      reply = "বাংলাদেশ একটি সুন্দর দেশ 🇧🇩";
    } else {
      reply = "আমি এখন demo mode এ আছি। Premium এ গেলে full AI চালু হবে 🔥";
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
