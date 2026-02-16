const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  // এখানে তুমি OpenAI / Google AI API call করবে
  // আপাতত test reply দিচ্ছি

  res.json({ reply: "You said: " + message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
