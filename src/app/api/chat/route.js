// app/api/chat/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";
import { searchSimilarChunks, upsertSessionEmbedding, getSessionDocuments } from "@/lib/db";
import { retrieveAndRerankChunks, extractSalientKeywords } from "@/lib/reranker";

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
  "suggestion": "<Backstage Real Talk: clever, constructive, and actually helpful takeaway or advice>",
  "isDocumentSupported": <boolean: true if answered directly from uploaded document context, false otherwise>,
  "citations": [
    {
      "chunkId": <integer ID or index of supporting chunk>,
      "fileName": "<fileName>",
      "pageNumber": <pageNumber>,
      "quote": "<brief exact supporting quote from document excerpt>"
    }
  ]
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

  const suggestionText =
    parsed.suggestion ||
    parsed.answer ||
    "Chhodo coding, standup comedy dekh lo thodi der, mood theek ho jayega.";

  const rawCitations = Array.isArray(parsed.citations) ? parsed.citations : [];
  const isDocSupported =
    typeof parsed.isDocumentSupported === "boolean"
      ? parsed.isDocumentSupported
      : (rawCitations.length > 0 && /source:\s*[^,\n]+,\s*page\s*\d+/i.test(suggestionText));

  return {
    title: title.trim(),
    roast:
      parsed.roast ||
      parsed.reply ||
      text ||
      "Bhai, tumhara performance dekh ke comedy club ke saare mics mute ho gaye.",
    severity:
      typeof parsed.severity === "number"
        ? Math.min(10, Math.max(1, parsed.severity))
        : 8,
    category: parsed.category || "Crowd Work",
    suggestion: suggestionText,
    answer: suggestionText,
    isDocumentSupported: isDocSupported,
    citations: rawCitations,
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

    // ── Check if session has uploaded documents ──
    let sessionDocs = [];
    if (sessionId) {
      try {
        sessionDocs = await getSessionDocuments(sessionId);
      } catch (docErr) {
        console.warn("[Chat API] Warning fetching session docs:", docErr?.message);
      }
    }

    // ── High-Precision RAG Retrieval: Query -> Embedding -> pgvector (Top 15) -> Reranking & Filtering -> Top 3-5 -> Gemini
    let retrievedDocs = [];
    let ragContext = "";

    if (sessionId && lastMessage.trim()) {
      try {
        retrievedDocs = await retrieveAndRerankChunks({
          sessionId,
          query: lastMessage,
          broadLimit: 15, // Retrieve Top 10-20 broad candidates from pgvector
          topK: 4,        // Final Top 3-5 after multi-signal relevance reranking
          minInitialSimilarity: 0.20,
          minRelevanceScore: 0.36,
        });

        if (retrievedDocs.length > 0) {
          ragContext = retrievedDocs
            .map(
              (c, idx) =>
                `[Chunk ${idx + 1} (ID: ${c.id || c.chunkIndex}) | File: ${c.fileName} | Page: ${c.pageNumber || 1} (Relevance: ${(c.similarity * 100).toFixed(0)}%)]:\n"${c.content}"`
            )
            .join("\n\n");
          console.log(`[Chat API RAG] Injected ${retrievedDocs.length} high-relevance reranked chunks into Gemini context for session: ${sessionId}`);
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

GROUNDING & CITATION PROTOCOL (CRITICAL):
1. RELEVANCE & GROUNDING EVALUATION:
   Carefully examine the user's question and the DOCUMENT CONTEXT above:
   - Does the document context actually contain facts or information that answer or directly support the user's question?

   CASE A: THE DOCUMENT CONTAINS THE ANSWER:
   - Set "isDocumentSupported": true
   - In "suggestion" (Backstage Real Talk), provide a concise, factual answer grounded directly in the document excerpts.
   - Conclude "suggestion" with the exact citation in this format:
     Source: <fileName>, Page <pageNumber>
   - In "citations", return the supporting chunk references:
     [
       {
         "chunkId": <chunk ID or number from header above>,
         "fileName": "<exact fileName>",
         "pageNumber": <exact pageNumber from header above>,
         "quote": "<short exact quote from excerpt supporting this answer>"
       }
     ]

   CASE B: THE DOCUMENT DOES NOT CONTAIN THE ANSWER (OR IS IRRELEVANT):
   - Set "isDocumentSupported": false
   - Set "citations": []
   - In "suggestion", explicitly state that the uploaded document does not contain this information (e.g., "I couldn't find this in your document (<fileName>)."). You may optionally offer brief general knowledge advice, but NEVER claim it came from the document.
   - DO NOT append any "Source:" line to "suggestion" when the document does not contain the answer!
   - NEVER hallucinate or force a citation to an unrelated excerpt!

2. COMEDY PUNCHLINE ("roast"):
   - Deliver 1-2 razor-sharp comedy punchlines mocking their document, question, or dilemma.
   - If the document doesn't contain the answer, roast them for asking for something that isn't in their own uploaded file!

3. STRICT ACCURACY:
   - ONLY cite the exact page numbers and file names present in the DOCUMENT CONTEXT headers above.
   - Never invent pages or files.
`;
    } else if (sessionDocs.length > 0) {
      activeSystemPrompt += `

DOCUMENT RETRIEVAL NOTICE:
======================================================================
The user has uploaded reference document(s) in this session: ${sessionDocs.map((d) => d.fileName).join(", ")}.
However, automated vector and keyword retrieval found NO matching or relevant passages for the query: "${lastMessage}".

STRICT UNANSWERABLE / REFUSAL RULE:
- If the user's question is asking about their uploaded document or expecting document facts, you MUST explicitly state in "suggestion" (Backstage Real Talk):
  "I couldn't find this in your document (${sessionDocs[0].fileName})."
- Set "isDocumentSupported": false
- Set "citations": []
- NEVER invent document facts or cite non-existent pages!
======================================================================
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
      // ── STRICT CITATION VALIDATION & GROUNDING ENGINE ──
      // Verify citations against actual retrieved chunks before trusting them
      if (retrievedDocs.length > 0) {
        const suggestionLower = (finalPayload.suggestion || "").toLowerCase();
        const negativeRefusalPatterns = [
          "couldn't find this in your document",
          "could not find this in your document",
          "could not find any information",
          "couldn't find any information",
          "not mentioned in the document",
          "not mentioned in your document",
          "not found in the document",
          "not found in your document",
          "not contained in the document",
          "document does not mention",
          "document does not contain",
          "document doesn't mention",
          "document doesn't contain",
          "does not specify",
          "doesn't specify",
          "no information in the document",
          "not in your document",
          "unable to find in the document",
          "i couldn't find",
          "i could not find",
        ];
        const hasNegativeRefusal = negativeRefusalPatterns.some((pattern) =>
          suggestionLower.includes(pattern)
        );

        // If model explicitly declared unsupported, or text expresses inability to find in doc
        if (!finalPayload.isDocumentSupported || hasNegativeRefusal) {
          finalPayload.isDocumentSupported = false;
          finalPayload.citations = [];
          finalPayload.source = null;
          finalPayload.ragSources = [];
          // Strip any hallucinated "Source: ..." lines from suggestion
          finalPayload.suggestion = finalPayload.suggestion
            .replace(/\n\s*Source:\s*[^,\n]+,\s*Page\s*\d+[^\n]*/gi, "")
            .trim();
          finalPayload.answer = finalPayload.suggestion;
        } else {
          // Validate model citations against actual retrieved chunks
          const candidateCitations = Array.isArray(finalPayload.citations) ? finalPayload.citations : [];
          const verifiedCitations = [];

          for (const cit of candidateCitations) {
            if (!cit) continue;
            const citedPage = parseInt(cit.pageNumber || cit.page, 10);
            const citedFile = (cit.fileName || "").trim().toLowerCase();
            const citedChunkId = cit.chunkId != null ? String(cit.chunkId) : null;
            const citedQuote = (cit.quote || "").trim();

            const matchingDoc = retrievedDocs.find((doc) => {
              if (citedChunkId && (String(doc.id) === citedChunkId || String(doc.chunkIndex) === citedChunkId)) {
                return true;
              }
              const pageMatches = !citedPage || (doc.pageNumber || 1) === citedPage;
              const fileMatches =
                !citedFile ||
                doc.fileName.toLowerCase() === citedFile ||
                doc.fileName.toLowerCase().includes(citedFile) ||
                citedFile.includes(doc.fileName.toLowerCase());
              return pageMatches && fileMatches;
            });

            if (matchingDoc) {
              let isQuoteGrounded = true;
              if (citedQuote && citedQuote.length > 8) {
                const quoteWords = extractSalientKeywords(citedQuote);
                if (quoteWords.length > 0) {
                  const docContentLower = matchingDoc.content.toLowerCase();
                  const matchedWords = quoteWords.filter((w) => docContentLower.includes(w));
                  isQuoteGrounded = (matchedWords.length / quoteWords.length) >= 0.35;
                }
              }

              if (isQuoteGrounded) {
                verifiedCitations.push({
                  chunkId: matchingDoc.id || matchingDoc.chunkIndex,
                  fileName: matchingDoc.fileName,
                  pageNumber: matchingDoc.pageNumber || 1,
                  quote: citedQuote || matchingDoc.content.slice(0, 160) + "...",
                  similarity: matchingDoc.similarity,
                });
              }
            }
          }

          // Fallback check: If candidateCitations was empty or model formatted citation only in text,
          // verify if the textual citation matches a real retrieved chunk AND has lexical grounding
          if (verifiedCitations.length === 0) {
            const textSourceMatch = finalPayload.suggestion.match(
              /Source:\s*([^,\n]+),\s*Page\s*(\d+)/i
            );
            if (textSourceMatch) {
              const textFile = textSourceMatch[1].trim().toLowerCase();
              const textPage = parseInt(textSourceMatch[2], 10);
              const matchingDoc = retrievedDocs.find(
                (d) =>
                  (d.pageNumber || 1) === textPage &&
                  (d.fileName.toLowerCase().includes(textFile) || textFile.includes(d.fileName.toLowerCase()))
              );
              if (matchingDoc) {
                const suggKeywords = extractSalientKeywords(finalPayload.suggestion);
                const contentLower = matchingDoc.content.toLowerCase();
                const overlap = suggKeywords.filter((w) => contentLower.includes(w));
                if (suggKeywords.length === 0 || overlap.length >= 2 || (overlap.length / suggKeywords.length) >= 0.25) {
                  verifiedCitations.push({
                    chunkId: matchingDoc.id || matchingDoc.chunkIndex,
                    fileName: matchingDoc.fileName,
                    pageNumber: matchingDoc.pageNumber || 1,
                    quote: matchingDoc.content.slice(0, 160) + "...",
                    similarity: matchingDoc.similarity,
                  });
                }
              }
            }
          }

          // Grounding decision
          if (verifiedCitations.length > 0) {
            finalPayload.isDocumentSupported = true;
            finalPayload.citations = verifiedCitations;

            const primaryCitation = verifiedCitations[0];
            const primarySource = `Source: ${primaryCitation.fileName}, Page ${primaryCitation.pageNumber}`;
            finalPayload.source = primarySource;

            // Ensure citation in suggestion matches verified primary citation
            const sourceMatch = finalPayload.suggestion.match(/Source:\s*([^,\n]+),\s*Page\s*(\d+)/i);
            if (sourceMatch) {
              finalPayload.suggestion = finalPayload.suggestion.replace(
                sourceMatch[0],
                primarySource
              );
            } else {
              finalPayload.suggestion = `${finalPayload.suggestion.trim()}\n\n${primarySource}`;
            }
            finalPayload.answer = finalPayload.suggestion;

            // Mark which retrieved chunks were verified and cited
            finalPayload.ragSources = retrievedDocs.map((d) => {
              const isCited = verifiedCitations.some(
                (vc) =>
                  vc.pageNumber === (d.pageNumber || 1) &&
                  vc.fileName.toLowerCase() === d.fileName.toLowerCase()
              );
              return {
                fileName: d.fileName,
                chunkIndex: d.chunkIndex,
                pageNumber: d.pageNumber || 1,
                similarity: d.similarity,
                rerankScore: d.rerankScore || d.similarity,
                vectorSimilarity: d.vectorSimilarity || d.similarity,
                matchedKeywords: d.matchedKeywords || [],
                snippet: d.content.slice(0, 160) + (d.content.length > 160 ? "..." : ""),
                isCited,
              };
            });
          } else {
            // Citations could NOT be verified against retrieved chunks!
            // Do NOT blindly append top source!
            finalPayload.isDocumentSupported = false;
            finalPayload.citations = [];
            finalPayload.source = null;
            finalPayload.ragSources = [];
            finalPayload.suggestion = finalPayload.suggestion
              .replace(/\n\s*Source:\s*[^,\n]+,\s*Page\s*\d+[^\n]*/gi, "")
              .trim();
            finalPayload.answer = finalPayload.suggestion;
          }
        }
      } else {
        // No chunks retrieved at all
        finalPayload.isDocumentSupported = false;
        finalPayload.citations = [];
        finalPayload.source = null;
        finalPayload.ragSources = [];
        finalPayload.suggestion = finalPayload.suggestion
          .replace(/\n\s*Source:\s*[^,\n]+,\s*Page\s*\d+[^\n]*/gi, "")
          .trim();
        finalPayload.answer = finalPayload.suggestion;
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
