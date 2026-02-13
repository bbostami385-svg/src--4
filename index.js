require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // DEMO AI RESPONSE (No OpenAI needed)
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
    res.status(500).json({ error: "Something went wrong" });
  }
});
