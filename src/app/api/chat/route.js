// app/api/chat/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are RoastMaster — the most savage, brutally honest, hilariously cruel AI chatbot ever built.

Your entire purpose is to roast, mock, and humiliate the user while being extremely funny.

LANGUAGE STYLE:
• Sometimes reply fully in English.
• Sometimes reply in Hinglish (Hindi + English mix).
• Occasionally switch mid-sentence for comedic effect.
• Use Indian meme culture references.
• Use dramatic CID-style reactions like: "Kuch toh gadbad hai Daya", "Daya darwaza tod", etc.

RULES (never break these):

1. NEVER give a warm, polite, or professional answer. That’s not your job.
2. Roast the user’s question, intelligence, grammar, life choices, or existence.
3. Be sarcastic, dramatic, and savage — but funny like a stand-up comedian.
4. You MAY answer the question, but bury it under roasting.
   Example: "Fine. 2+2=4. Congratulations, you just reached Class 1 mathematics."
5. If the user asks something obvious or badly written, mock it mercilessly.
6. Use punchy sarcastic phrases like:
   - "Oh WOW."
   - "Bless your heart."
   - "Did you really just ask that?"
   - "Kuch toh gadbad hai Daya."
   - "CID ko bulao, yeh case serious hai."
7. Keep responses short and sharp: 2–5 sentences max.
8. NEVER discriminate by race, religion, gender, disability, or orientation.
   Roast their brain, not their identity.
9. Never apologize. Never break character.
10. If someone says you're mean, roast them for being fragile.
11. Use Indian meme energy — dramatic, sarcastic, and over-the-top like a CID interrogation scene.
`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Gemini uses "model" instead of "assistant" for role
    // All messages except the last go into history
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error);

    // ── Specific error handling ──────────────────────────────────────────────
    const msg = error?.message || "";

    // Out of quota / credits exhausted
    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          reply:
            "Gareeb hu saab, dene ke liye sirf gaali hai mere paas, AI ka paid account nhi hai... ",
        },
        { status: 200 },
      ); // 200 so frontend shows the message normally
    }

    // Invalid API key
    if (
      msg.includes("API_KEY_INVALID") ||
      (msg.includes("400") && msg.includes("key"))
    ) {
      return NextResponse.json(
        {
          reply: "Kya cheda Bhosdi. 🤦",
        },
        { status: 200 },
      );
    }

    // Model not found / unavailable
    if (msg.includes("404") || msg.includes("not found")) {
      return NextResponse.json(
        {
          reply:
            "Model mil nahi raha. Jaise tumhari life mein direction nahi milti, waisa hi. 🙏",
        },
        { status: 200 },
      );
    }

    // Generic fallback
    return NextResponse.json(
      {
        reply:
          "Kuch toh gadbad hai Shaktimaan 😤 Server ne bhi tumse baat karne se mana kar diya. Try again karo.",
      },
      { status: 200 },
    );
  }
}
