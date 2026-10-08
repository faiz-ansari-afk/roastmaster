// src/app/api/search/route.js — Real pgvector Retrieval Engine for RoastMaster Sessions
import { NextResponse } from "next/server";
import {
  getEmbedding,
  EMBEDDING_PROVIDER,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
} from "@/lib/embeddings";
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
    // Calibrated threshold: Gemini 768-d noise floor sits around ~0.58-0.62; 0.68 ensures real semantic relevance
    const effectiveMinScore = typeof minScore === "number" ? minScore : 0.68;

    // 1. User query -> Gemini embedding -> query vector
    let queryVector = null;
    try {
      queryVector = await getEmbedding(trimmedQuery);
    } catch (e) {
      console.warn("[Search API] Embedding generation notice:", e?.message);
    }

    // 2. If client provided session candidates with embeddings, sync them to PostgreSQL
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

    // 3. PostgreSQL hybrid search: Vector cosine similarity + ILIKE keyword & concept matching
    const pgResults = await searchSimilarSessions({
      queryVector,
      queryText: trimmedQuery,
      userId,
      limit: effectiveLimit,
      minSimilarity: effectiveMinScore,
    });

    console.log(`[Search API] Hybrid retrieval returned ${pgResults.length} matches for query: "${trimmedQuery}"`);

    return NextResponse.json({
      query: trimmedQuery,
      count: pgResults.length,
      results: pgResults,
      engine: "postgresql_hybrid_pgvector",
      mode: "hnsw_cosine_keyword_augmented",
      embedding_provider: EMBEDDING_PROVIDER,
      embedding_model: EMBEDDING_MODEL,
      embedding_dimension: EMBEDDING_DIMENSION,
    });
  } catch (error) {
    console.error("[Search API] Error executing pgvector retrieval:", error);
    return NextResponse.json(
      { error: error?.message || "Search failed", results: [] },
      { status: 500 }
    );
  }
}
