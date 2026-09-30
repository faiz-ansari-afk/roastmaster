// app/api/chat/route.js
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
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
1. NEVER give a warm, polite, or professional answer in the roast. That’s not your job.
2. Roast the user’s question, code, intelligence, grammar, life choices, or existence.
3. Be sarcastic, dramatic, and savage — but funny like a stand-up comedian.
4. If the user asks something obvious or badly written, mock it mercilessly.
5. Use punchy sarcastic phrases like:
   - "Oh WOW."
   - "Bless your heart."
   - "Did you really just ask that?"
   - "Kuch toh gadbad hai Daya."
   - "CID ko bulao, yeh case serious hai."
6. Keep the roast punchy and sharp: 2–4 sentences max.
7. NEVER discriminate by race, religion, gender, disability, or orientation. Roast their code and brain, not their identity.
8. Never apologize. Never break character.

OUTPUT REQUIREMENTS:
You MUST output structured JSON matching the schema:
- "roast": The savage, funny, brutal roast of their question or code.
- "severity": An integer score from 1 to 10 evaluating how bad their mistake/code/question is (1 = minor slip, 10 = absolute catastrophic disaster).
- "category": A concise 1-2 word category describing the topic (e.g., "Frontend", "Backend", "State Management", "CSS & Layout", "Architecture", "Logic", "Database", "Security", "Life Choices", "General").
- "suggestion": A genuinely constructive, actionable tip or witty-yet-accurate advice on how to actually improve or fix the issue.
`;

const ROAST_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    roast: {
      type: SchemaType.STRING,
      description: "The savage, funny, and brutal roast of the user's input",
    },
    severity: {
      type: SchemaType.INTEGER,
      description: "Severity score from 1 to 10 representing how bad the code or question is",
    },
    category: {
      type: SchemaType.STRING,
      description: "Category of the roast, e.g. Frontend, Backend, State, Architecture, Logic",
    },
    suggestion: {
      type: SchemaType.STRING,
      description: "A constructive, actionable suggestion on how to actually improve or fix the code",
    },
  },
  required: ["roast", "severity", "category", "suggestion"],
};

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Gemini uses "model" instead of "assistant" for role
    // Format history safely handling both structured objects and strings
    const history = messages.slice(0, -1).map((m) => {
      let contentText = "";
      if (typeof m.content === "object" && m.content !== null) {
        contentText = m.content.roast
          ? `${m.content.roast} (Tip: ${m.content.suggestion || ""})`
          : JSON.stringify(m.content);
      } else {
        contentText = String(m.content || "");
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: contentText }],
      };
    });

    const lastItem = messages[messages.length - 1]?.content;
    const lastMessage =
      typeof lastItem === "object" && lastItem !== null
        ? JSON.stringify(lastItem)
        : String(lastItem || "");

    // Models to try in order of preference (handles transient 503 spike gracefully)
    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash-lite"];
    let rawResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: ROAST_SCHEMA,
            temperature: 0.8,
          },
        });

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage);
        rawResponse = result.response.text();
        if (rawResponse) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next fallback:`, err.message);
      }
    }

    if (!rawResponse && lastError) {
      throw lastError;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      const jsonMatch = rawResponse?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          roast: rawResponse || "Your code stunned me into silence.",
          severity: 7,
          category: "General",
          suggestion: "Check your logic and try again.",
        };
      }
    }

    const payload = {
      roast: parsed.roast || "Your code stunned me into silence.",
      severity:
        typeof parsed.severity === "number"
          ? Math.min(10, Math.max(1, parsed.severity))
          : 7,
      category: parsed.category || "General",
      suggestion:
        parsed.suggestion || "Take a deep breath and read the documentation.",
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const msg = error?.message || "";

    // Out of quota / credits exhausted
    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          roast:
            "Gareeb hu saab, dene ke liye sirf gaali hai mere paas, AI ka paid account nhi hai... 💸",
          severity: 10,
          category: "API Quota",
          suggestion:
            "Wait a moment for API quota to reset or upgrade your Gemini API tier.",
        },
        { status: 200 },
      );
    }

    // Invalid API key
    if (
      msg.includes("API_KEY_INVALID") ||
      (msg.includes("400") && msg.includes("key"))
    ) {
      return NextResponse.json(
        {
          roast: "Kya cheda Bhosdi. 🤦 API key ka format hi galat hai.",
          severity: 10,
          category: "Configuration",
          suggestion: "Please check your GEMINI_API_KEY in the .env file.",
        },
        { status: 200 },
      );
    }

    // Model not found / unavailable
    if (msg.includes("404") || msg.includes("not found")) {
      return NextResponse.json(
        {
          roast:
            "Model mil nahi raha. Jaise tumhari life mein direction nahi milti, waisa hi. 🙏",
          severity: 9,
          category: "Model Error",
          suggestion: "Check model configuration and supported model identifiers.",
        },
        { status: 200 },
      );
    }

    // Generic fallback
    return NextResponse.json(
      {
        roast:
          "Kuch toh gadbad hai Daya 😤 Server ne bhi tumse baat karne se mana kar diya. Try again karo.",
        severity: 8,
        category: "Server Error",
        suggestion: "Check your internet connection and re-submit your question.",
      },
      { status: 200 },
    );
  }
}
