// src/app/api/langchain/chat/route.ts
// Dedicated LangChain.js Multi-Route LCEL Chat API Route for RoastMaster AI.
// Runs completely isolated from the manual /api/chat route.

import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getSessionDocuments } from "@/lib/db";
import { getLangChainSessionDocuments } from "@/lib/langchain/vectorstore";
import { createRagChain } from "@/lib/langchain/rag-chain";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, sessionId, userId, codeSnippet } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array." }, { status: 400 });
    }

    // 1. Derive verified tenant identity from session cookie or header
    let token = null;
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/roastmaster_token=([^;]+)/);
      if (match) token = match[1];
    }
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    const payload = token ? verifySessionToken(token) : null;
    const verifiedTenantId = payload?.uid || userId || "default-tenant";

    // 2. Extract latest user message
    const lastItem = messages[messages.length - 1]?.content;
    const lastMessage =
      typeof lastItem === "object" && lastItem !== null
        ? String(lastItem.roast || lastItem.suggestion || JSON.stringify(lastItem))
        : String(lastItem || "");

    if (!lastMessage.trim()) {
      return NextResponse.json({ error: "Empty query string." }, { status: 400 });
    }

    // 3. Check for uploaded documents in session (LangChain store first, fallback to manual)
    let sessionDocs: any[] = [];
    if (sessionId) {
      try {
        sessionDocs = await getLangChainSessionDocuments(sessionId);
        if (sessionDocs.length === 0) {
          sessionDocs = await getSessionDocuments(sessionId);
        }
      } catch (err: any) {
        console.warn("[LangChain Chat Route] Notice fetching session docs:", err?.message);
      }
    }
    const hasUploadedDocs = sessionDocs && sessionDocs.length > 0;

    // 4. Invoke isolated LangChain LCEL Multi-Route Chain
    const ragChain = await createRagChain({
      tenantId: verifiedTenantId,
      k: 4,
      temperature: 0.2,
      minSimilarity: 0.50,
      enforceTenantIsolation: true,
    });

    const chainResult = await ragChain.invoke({
      question: lastMessage,
      hasUploadedDocs,
      sessionId: sessionId || undefined,
      codeSnippet: codeSnippet || undefined,
    });

    // 5. Map into RoastMaster standard comedy stage UI response format
    const formattedCitations = (chainResult.citations || []).map((c, i) => ({
      chunkId: c.chunkIndex ?? i + 1,
      fileName: c.fileName,
      pageNumber: c.pageNumber,
      quote: c.excerpt,
    }));

    const primarySource =
      formattedCitations.length > 0
        ? `Source: ${formattedCitations[0].fileName}, Page ${formattedCitations[0].pageNumber}`
        : null;

    let displayTitle = "Standup Roast";
    if (chainResult.intent === "document_rag") {
      displayTitle = "Document Review (LangChain)";
    } else if (chainResult.intent === "code_analysis") {
      displayTitle = "Code Audit (LangChain)";
    } else if (chainResult.intent === "banter") {
      displayTitle = "Crowd Work (LangChain)";
    } else if (chainResult.intent === "clarification") {
      displayTitle = "Hold Up (LangChain)";
    }

    const finalPayload = {
      title: displayTitle,
      roast: chainResult.answer.split("\n")[0] || chainResult.answer,
      severity: chainResult.grounded ? 6 : 8,
      category: chainResult.intent === "document_rag" ? "Document RAG" : "LangChain",
      suggestion: chainResult.answer,
      answer: chainResult.answer,
      isDocumentSupported: chainResult.grounded,
      citations: formattedCitations,
      source: primarySource,
      engine: "langchain",
      ragEngine: "langchain",
      intent: chainResult.intent,
      retrievedCount: chainResult.retrievedCount,
    };

    return NextResponse.json(finalPayload, { status: 200 });
  } catch (error: any) {
    console.error("[LangChain Chat Route Error]:", error);
    return NextResponse.json(
      {
        title: "Stage Mic Drop",
        roast: "The LangChain pipeline tripped over the cables. Even the AI couldn't survive that blunder.",
        severity: 9,
        category: "Mic Malfunction",
        suggestion: `LangChain Error: ${error?.message || "Execution failed"}. Check vectorstore or model quota.`,
        answer: "Execution failed in LangChain pipeline.",
        isDocumentSupported: false,
        citations: [],
        engine: "langchain",
        ragEngine: "langchain",
      },
      { status: 500 }
    );
  }
}
