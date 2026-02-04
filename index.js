import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Bayojid AI backend is running 🚀"
  });
});

// Chat endpoint (demo)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // এখন ডেমো রেসপন্স
  res.json({
    reply: `You said: ${message}`
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});