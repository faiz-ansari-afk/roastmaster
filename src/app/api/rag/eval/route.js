// src/app/api/rag/eval/route.js — Automated RAG Evaluation Endpoint
import { NextResponse } from "next/server";
import { runRagEvaluation } from "@/lib/rag_evaluator";
import { DEFAULT_EVAL_SESSION_ID } from "@/lib/rag_eval_dataset";

// GET /api/rag/eval?sessionId=...&category=...&topK=...
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || DEFAULT_EVAL_SESSION_ID;
    const category = searchParams.get("category") || null;
    const topK = parseInt(searchParams.get("topK") || "4", 10);

    const report = await runRagEvaluation({
      sessionId,
      categoryFilter: category,
      topK,
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[RAG Eval API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "RAG evaluation failed" },
      { status: 500 }
    );
  }
}

// POST /api/rag/eval — Custom test case evaluation
export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId = DEFAULT_EVAL_SESSION_ID, customDataset = null, topK = 4 } = body;

    const report = await runRagEvaluation({
      sessionId,
      dataset: Array.isArray(customDataset) && customDataset.length > 0 ? customDataset : undefined,
      topK,
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[RAG Eval API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "RAG evaluation failed" },
      { status: 500 }
    );
  }
}
