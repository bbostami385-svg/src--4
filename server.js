const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("OpenAI Server Running ✅");
});

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.json({ reply: "কিছু লিখুন।" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "API error হয়েছে। Key ঠিক আছে কিনা চেক করুন।" });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000 ✅");
});
