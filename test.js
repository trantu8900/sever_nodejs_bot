import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  timeout: 20000, // 20s
});

console.log("🔍 Testing OpenAI connection...");

try {
  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello" }],
  });

  console.log("✅ SUCCESS:", result.choices[0].message.content);

} catch (err) {
  console.error("❌ ERROR connecting to OpenAI:", err);
}
