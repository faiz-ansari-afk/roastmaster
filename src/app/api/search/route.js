// src/app/api/search/route.js — Real pgvector Retrieval Engine for RoastMaster Sessions
import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";
import {
  searchSimilarSessions,
  upsertBatchSessionEmbeddings,
} from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      query = "",
      userId = null,
      candidates = [],
      limit = 5,
      minScore,
    } = body;

    const trimmedQuery = (query || "").trim();
    if (!trimmedQuery) {
      return NextResponse.json({ query: "", count: 0, results: [] }, { status: 200 });
    }

    const effectiveLimit = typeof limit === "number" ? Math.min(20, Math.max(1, limit)) : 5;
    const effectiveMinScore = typeof minScore === "number" ? minScore : 0.35;

    // 1. User query -> Gemini embedding -> query vector
    const queryVector = await getEmbedding(trimmedQuery);

    if (!queryVector || queryVector.length === 0) {
      console.warn("[Search API] Embedding generation unavailable");
      return NextResponse.json({
        query: trimmedQuery,
        count: 0,
        results: [],
        engine: "gemini_unavailable",
      });
    }

    // 2. If client provided session candidates with embeddings, sync them to PostgreSQL session_embeddings
    if (Array.isArray(candidates) && candidates.length > 0) {
      const validEmbeddings = candidates.filter(
        (c) => Array.isArray(c?.embedding) && c.embedding.length > 0
      );
      if (validEmbeddings.length > 0) {
        await upsertBatchSessionEmbeddings(validEmbeddings, userId).catch((syncErr) =>
          console.warn("[Search API] Candidate sync warning:", syncErr?.message)
        );
      }
    }

    // 3. PostgreSQL + pgvector is the real retrieval engine:
    //    ORDER BY embedding <=> queryVector LIMIT 5
    const pgResults = await searchSimilarSessions({
      queryVector,
      userId,
      limit: effectiveLimit,
      minSimilarity: effectiveMinScore,
    });

    console.log(`[Search API] pgvector retrieval returned ${pgResults.length} matches for query: "${trimmedQuery}"`);

    return NextResponse.json({
      query: trimmedQuery,
      count: pgResults.length,
      results: pgResults,
      engine: "postgresql_pgvector",
      mode: "hnsw_cosine",
    });
  } catch (error) {
    console.error("[Search API] Error executing pgvector retrieval:", error);
    return NextResponse.json(
      { error: error?.message || "Search failed", results: [] },
      { status: 500 }
    );
  }
}
