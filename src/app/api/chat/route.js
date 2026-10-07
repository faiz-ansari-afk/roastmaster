// app/api/chat/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";
import { searchSimilarChunks, upsertSessionEmbedding } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are RoastMaster — a legendary, razor-sharp standup comedian headlining an unfiltered roast comedy club.
The user is sitting in the VIP front row asking a question, sharing code, or making life/tech choices.

CORE COMEDY RULES:
1. SHORT & PUNCHY (STRICT):
   - Deliver exactly 1 to 2 crisp, razor-sharp sentences (strictly under 35-45 words).
   - No long preambles, no monologues. Immediate setup + savage punchline.

2. DIVERSE & 100% UNIQUE JOKES (CRITICAL):
   - NEVER repeat the same joke, metaphor, or punchline across different queries.
   - ABSOLUTELY BANNED: Never use stock clichés like "umbrella in a car wash", "dog chasing tail", or stale internet memes.
   - BANNED OPENINGS: Do NOT start with predictable formulas like "Bhai tu seriously..." or "Matlab tu wahi banda hai...". Start with fresh, dynamic, unpredictable phrasing every single turn!
   - Every roast must be 100% tailored specifically to the exact topic, words, and context of the user's question.

3. BACKSTAGE REAL TALK:
   - The "suggestion" field must ALWAYS contain "Backstage Real Talk" — clever, constructive, genuinely helpful advice directly answering their dilemma with wit.

4. STYLE:
   - Quick-witted, stand-up crowd work. Natural, effortless blend of smart English and relatable Hinglish slang.
   - Roast their ideas, questions, code, and choices — NEVER their identity, gender, or race.

OUTPUT FORMAT:
Always return valid JSON:
{
  "title": "<Concise 3-5 words punchy title summarizing the exact topic or dilemma, e.g. 'React useEffect Death Loop', 'PHP 2026 SaaS Dilemma', 'Fintech Architecture Review'>",
  "roast": "1-2 short, razor-sharp punchline sentences specifically roasting the user's exact topic",
  "severity": <integer from 1 to 10>,
  "category": "<1-2 words category, e.g. Frontend, Backend, Career, Logic, Food, Lifestyle, Travel, AI>",
  "suggestion": "<Backstage Real Talk: clever, constructive, and actually helpful takeaway or advice>"
}
`;

function parseStructuredRoast(text, fallbackQuery = "") {
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text?.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = {};
      }
    }
  }

  // Generate dynamic title
  let title = parsed.title;
  if (!title || typeof title !== "string" || !title.trim()) {
    if (fallbackQuery) {
      const clean = fallbackQuery.replace(/^(roast|can you roast|please roast|roast my|roast this|what is|how to)\s+/i, "").trim();
      title = clean.length > 36 ? clean.slice(0, 36) + "..." : clean;
      title = title ? title.charAt(0).toUpperCase() + title.slice(1) : "Standup Roast";
    } else if (parsed.category) {
      title = `${parsed.category} Roast`;
    } else {
      title = "Standup Roast";
    }
  }

  return {
    title: title.trim(),
    roast:
      parsed.roast ||
      text ||
      "Bhai, tumhara performance dekh ke comedy club ke saare mics mute ho gaye.",
    severity:
      typeof parsed.severity === "number"
        ? Math.min(10, Math.max(1, parsed.severity))
        : 8,
    category: parsed.category || "Crowd Work",
    suggestion:
      parsed.suggestion ||
      "Chhodo coding, standup comedy dekh lo thodi der, mood theek ho jayega.",
  };
}

export async function POST(req) {
  try {
    const { messages, sessionId, userId, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

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

    // ── RAG Retrieval via Aiven pgvector ────────────────────────────────────
    let retrievedDocs = [];
    let ragContext = "";

    if (sessionId && lastMessage.trim()) {
      try {
        const queryVector = await getEmbedding(lastMessage);
        if (Array.isArray(queryVector) && queryVector.length > 0) {
          retrievedDocs = await searchSimilarChunks({
            sessionId,
            queryVector,
            limit: 5,
            minSimilarity: 0.30,
          });

          if (retrievedDocs.length > 0) {
            ragContext = retrievedDocs
              .map(
                (c, idx) =>
                  `[Excerpt ${idx + 1} | File: ${c.fileName} | Page: ${c.pageNumber || 1} (Relevance: ${(c.similarity * 100).toFixed(0)}%)]:\n"${c.content}"`
              )
              .join("\n\n");
            console.log(`[Chat API RAG] Retrieved ${retrievedDocs.length} chunks with page numbers from Aiven pgvector for session: ${sessionId}`);
          }
        }
      } catch (ragErr) {
        console.warn("[Chat API] RAG retrieval error (falling back to standard chat):", ragErr?.message || ragErr);
      }
    }

    let activeSystemPrompt = SYSTEM_PROMPT;

    // ── VIP Front-Row Audience Profile Context (for Personalized Roasting) ──
    if (userProfile && typeof userProfile === "object") {
      const profileItems = [];
      if (userProfile.displayName && typeof userProfile.displayName === "string") {
        profileItems.push(`- Heckler Name / Handle: "${userProfile.displayName.trim()}"`);
      }
      if (userProfile.stageTitle && typeof userProfile.stageTitle === "string") {
        profileItems.push(`- Persona / Stage Title: "${userProfile.stageTitle.trim()}"`);
      }
      if (userProfile.bio && typeof userProfile.bio === "string" && userProfile.bio.trim()) {
        profileItems.push(`- Bio / Self-Confession: "${userProfile.bio.trim()}"`);
      }
      if (userProfile.favoriteTopic && typeof userProfile.favoriteTopic === "string" && userProfile.favoriteTopic.trim()) {
        profileItems.push(`- Favorite Tech / Coding Habit: "${userProfile.favoriteTopic.trim()}"`);
      }
      if (userProfile.roastLevel && typeof userProfile.roastLevel === "string") {
        profileItems.push(`- Requested Roast Intensity: "${userProfile.roastLevel.trim()}"`);
      }

      if (profileItems.length > 0) {
        activeSystemPrompt += `

VIP FRONT-ROW HECKLER PROFILE (Audience Member Context):
======================================================
${profileItems.join("\n")}
======================================================

PROFILE ROAST RULES:
1. When the user asks "roast me", "roast my profile", asks about their persona/habits, or when making comedic crowd work callbacks, roast their specific profile traits (their declared persona, stage title, bio quirks, favorite tech, or coding sins)!
2. Calibrate your comedy punchlines to their requested roast intensity:
   - "mild" (3/10): light, witty teasing; friendly ego checks.
   - "sarcastic" (7/10): sharp, punchy comedy club crowd work.
   - "incineration" (9.8/10): savage, ruthless technical humiliation. Zero mercy.
3. NEVER mention, invent, or ask for passwords, secret tokens, or private authentication credentials. Focus 100% on their public comedy persona, coding quirks, and bio.
`;
      }
    }
    if (ragContext) {
      activeSystemPrompt += `

DOCUMENT CONTEXT (from user's uploaded reference PDF via pgvector):
======================================================================
${ragContext}
======================================================================

RAG RULES:
1. Ground your roast and advice directly in the facts, claims, code, or context of the document excerpts above.
2. In "roast", mock or roast their document, ideas, or questions with razor-sharp standup comedy punchlines (1-2 sentences).
3. In "suggestion" (Backstage Real Talk), answer the user's specific query with genuine facts and constructive advice from the document.
4. STRICT CITATION OF REAL PAGE NUMBERS (MANDATORY):
   - Whenever answering questions or stating facts from the document excerpts, provide the exact source citation at the end of the answer in this exact format:
     Source: <fileName>, Page <pageNumber>
   - Example:
     Employees are entitled to 30 days of annual leave.

     Source: employee-handbook.pdf, Page 17
   - NEVER invent or hallucinate page numbers. ONLY cite the exact Page number provided in the excerpt header above. The retrieval layer has provided the true page number.
`;
    }

    const modelsToTry = [
      "gemini-flash-lite-latest",
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash-lite",
    ];

    let finalPayload = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: activeSystemPrompt,
        });

        const contents = [
          ...history,
          { role: "user", parts: [{ text: lastMessage }] },
        ];

        const res = await model.generateContent({ contents });
        finalPayload = parseStructuredRoast(res.response.text(), lastMessage);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed:`, err.message);
      }
    }

    if (!finalPayload && lastError) {
      throw lastError;
    }

    if (finalPayload) {
      if (retrievedDocs.length > 0) {
        finalPayload.ragSources = retrievedDocs.map((d) => ({
          fileName: d.fileName,
          chunkIndex: d.chunkIndex,
          pageNumber: d.pageNumber || 1,
          similarity: d.similarity,
          snippet: d.content.slice(0, 160) + (d.content.length > 160 ? "..." : ""),
        }));

        // Determine top verified source and page number from retrieval layer
        const topDoc = retrievedDocs[0];
        const primarySource = `Source: ${topDoc.fileName}, Page ${topDoc.pageNumber || 1}`;
        finalPayload.source = primarySource;

        // If the answer in suggestion does not cite the source or hallucinated an invalid page number,
        // guarantee accuracy by verifying against retrieved chunks
        if (finalPayload.suggestion && typeof finalPayload.suggestion === "string") {
          const sourceMatch = finalPayload.suggestion.match(/Source:\s*([^,\n]+),\s*Page\s*(\d+)/i);
          if (sourceMatch) {
            const citedPage = parseInt(sourceMatch[2], 10);
            const validPages = retrievedDocs.map((d) => d.pageNumber || 1);
            if (!validPages.includes(citedPage)) {
              // Replace hallucinated page number with the actual page number from the retrieval layer
              finalPayload.suggestion = finalPayload.suggestion.replace(
                sourceMatch[0],
                `Source: ${topDoc.fileName}, Page ${topDoc.pageNumber || 1}`
              );
            }
          } else if (!finalPayload.suggestion.toLowerCase().includes("source:")) {
            // Append the true source and page citation from the retrieval layer
            finalPayload.suggestion = `${finalPayload.suggestion.trim()}\n\nSource: ${topDoc.fileName}, Page ${topDoc.pageNumber || 1}`;
          }
        }
      }

      try {
        const roastText = finalPayload.roast || "";
        const suggestionText = finalPayload.suggestion || "";
        const categoryText = finalPayload.category || "";
        const textToEmbed = `Topic: ${lastMessage}. Subject: ${lastMessage}. Category: ${categoryText}. Roast: ${roastText}. Backstage: ${suggestionText}`.trim();
        const embedding = await getEmbedding(textToEmbed);
        if (embedding && embedding.length > 0) {
          finalPayload.embedding = embedding;

          // Real Retrieval Engine: Persist session embedding directly in PostgreSQL pgvector
          if (sessionId) {
            await upsertSessionEmbedding({
              sessionId,
              userId: userId || userProfile?.userId || null,
              title: finalPayload.title || null,
              snippet: roastText.slice(0, 160),
              category: categoryText,
              embedding,
            }).catch((pgErr) =>
              console.warn("[Chat API] Warning upserting session vector in pgvector:", pgErr?.message)
            );
          }
        }
      } catch (embErr) {
        console.warn("[Chat API] Failed to generate/store embedding for exchange:", embErr?.message || embErr);
      }
    }

    return NextResponse.json(finalPayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    const msg = error?.message || "";

    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        {
          roast:
            "Show cancel ho gaya bhai! Free tier quota khatam, comedy club walon ne mic cheen liya. 💸",
          severity: 10,
          category: "Club Closed / Quota",
          suggestion: "Wait a moment for API quota to reset or upgrade your Gemini API tier.",
        },
        { status: 200 },
      );
    }

    if (
      msg.includes("API_KEY_INVALID") ||
      (msg.includes("400") && msg.includes("key"))
    ) {
      return NextResponse.json(
        {
          roast: "Entry ticket hi nakli hai tumhari! 🤦 Check your GEMINI_API_KEY.",
          severity: 10,
          category: "Security / Gatecrash",
          suggestion: "Please verify your GEMINI_API_KEY in the .env file.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        roast:
          "Mic feedback aa raha hai bohot zor se! 😤 Server ne bol diya 'Not today bro'. Ek baar fir se try karo.",
        severity: 8,
        category: "Mic Glitch",
        suggestion: "Check your internet connection and re-submit your prompt.",
      },
      { status: 200 },
    );
  }
}
