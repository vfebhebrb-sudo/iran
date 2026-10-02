require("dotenv").config();

const Anthropic = require("@anthropic-ai/sdk");

console.log("\n========================================");
console.log("🟣 CLAUDE API TEST");
console.log("========================================");

const key = process.env.CLAUDE_API_KEY;

console.log(
  "CLAUDE KEY:",
  key ? "✅ FOUND" : "❌ NOT FOUND"
);

if (!key) {
  console.log("❌ CLAUDE_API_KEY is missing from .env");
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: key
});

async function testClaude() {

  try {

    console.log("\n🧠 TRY: claude-opus-5-5");

    const message = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "فقط بنویس: CLAUDE OK"
        }
      ]
    });

    const text = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    console.log("✅ CLAUDE SUCCESS");
    console.log("📩 RESPONSE:", text);

  } catch (error) {

    console.log("❌ CLAUDE FAILED");

    console.log("STATUS:", error.status);
    console.log("ERROR:", error.message);

  }

}

testClaude();