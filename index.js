import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { OpenAI } from "openai";

dotenv.config();

if (!process.env.OPENAI_KEY) {
  console.error("❌ OPENAI_KEY missing in .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("WebSocket Chatbot Backend is running");
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () =>
  console.log(`✔ HTTP server ON http://localhost:${PORT}`)
);

// ❗ FIX 1: Remove PATH – Render does NOT support WebSocket path
const wss = new WebSocketServer({ server });

console.log(`✔ WebSocket ON ws://localhost:${PORT}`);

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.send(JSON.stringify({ type: "system", message: "connected" }));

  ws.on("message", async (raw) => {
    try {
      const msg = raw.toString();
      console.log("📩 Received:", msg);

      // ❗ FIX 2: Wrap message in JSON to avoid "Hello" being misinterpreted
      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [{ role: "user", content: msg }],
      });

      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content || "";
        if (token) {
          ws.send(JSON.stringify({ type: "token", data: token }));
        }
      }

      ws.send(JSON.stringify({ type: "end" }));

    } catch (err) {
      console.error("❌ OpenAI ERROR:", err);
      ws.send(JSON.stringify({ type: "error", message: err.message }));
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});
