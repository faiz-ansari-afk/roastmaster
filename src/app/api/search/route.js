// src/app/api/search/route.js — Semantic search endpoint for RoastMaster sessions and roasts
import { NextResponse } from "next/server";
import { getEmbedding, cosineSimilarity } from "@/lib/embeddings";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      query = "",
      candidates = [],
      limit = 10,
      minScore,
    } = body;

    const trimmedQuery = (query || "").trim();
    if (!trimmedQuery) {
      return NextResponse.json({ query: "", count: 0, results: [] }, { status: 200 });
    }

    // Adaptive threshold: Short 1-2 word broad queries (e.g. "food", "travel", "work") have naturally lower peak cosine similarities (~0.50), while specific multi-word queries reach ~0.53+
    const wordCount = trimmedQuery.split(/\s+/).filter(Boolean).length;
    const defaultThreshold = wordCount <= 2 ? 0.50 : 0.53;
    const effectiveMinScore = typeof minScore === "number" ? minScore : defaultThreshold;

    // 1. Generate query vector using Gemini text-embedding
    const queryVector = await getEmbedding(trimmedQuery);

    const qLower = trimmedQuery.toLowerCase();

    // If embedding generation failed (e.g. quota/network), fall back gracefully to keyword matching
    if (!queryVector || queryVector.length === 0) {
      console.warn("[Search API] Embedding generation unavailable, falling back to keyword search");
      const fallbackResults = (candidates || [])
        .map((item) => {
          const fullText = `${item.title || ""} ${item.snippet || ""} ${item.category || ""}`.toLowerCase();
          const matched = fullText.includes(qLower);
          const { embedding, ...cleanItem } = item;
          return {
            ...cleanItem,
            similarityScore: matched ? 0.85 : 0,
            matchType: "keyword_fallback",
          };
        })
        .filter((item) => item.similarityScore > 0)
        .slice(0, limit);

      return NextResponse.json({
        query: trimmedQuery,
        count: fallbackResults.length,
        results: fallbackResults,
        mode: "keyword_fallback",
      });
    }

    // 2. If no candidate items were sent, return the query vector
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({
        query: trimmedQuery,
        queryVector,
        count: 0,
        results: [],
        mode: "vector_only",
      });
    }

    // 3. Score each candidate item against the query vector
    const scoredItems = [];

    for (const item of candidates) {
      const itemVector = Array.isArray(item.embedding) && item.embedding.length > 0
        ? item.embedding
        : null;

      let score = 0;
      let matchType = "semantic";

      if (itemVector) {
        score = cosineSimilarity(queryVector, itemVector);
        // Small hybrid boost if the query literally appears in the title or snippet
        const fullText = `${item.title || ""} ${item.snippet || ""} ${item.category || ""}`.toLowerCase();
        if (fullText.includes(qLower)) {
          score = Math.min(1.0, score + 0.08);
          matchType = "hybrid";
        }
      } else {
        // Fallback for pre-existing legacy sessions without stored vector
        const fullText = `${item.title || ""} ${item.snippet || ""} ${item.category || ""}`.toLowerCase();
        if (fullText.includes(qLower)) {
          score = 0.55;
          matchType = "keyword";
        }
      }

      if (score >= effectiveMinScore) {
        // Remove raw vector from response payload to keep network transfer fast & lightweight
        const { embedding, ...cleanItem } = item;
        scoredItems.push({
          ...cleanItem,
          similarityScore: Number(score.toFixed(4)),
          matchType,
        });
      }
    }

    // 4. Sort descending by similarity score
    scoredItems.sort((a, b) => b.similarityScore - a.similarityScore);

    // Dynamic relative cutoff: drop trailing results that have a noticeable drop from the top score
    let filteredResults = scoredItems;
    if (scoredItems.length > 1) {
      const topScore = scoredItems[0].similarityScore;
      if (topScore >= 0.62) {
        // For strong matches, drop trailing results with gap > 0.15
        filteredResults = scoredItems.filter((item) => item.similarityScore >= topScore - 0.15);
      } else if (topScore >= 0.50) {
        // For broad 1-2 word concepts (e.g. "food" matching "veg biryani" at 0.518), drop trailing items with gap > 0.035
        filteredResults = scoredItems.filter((item) => item.similarityScore >= topScore - 0.035);
      }
    }

    const topResults = filteredResults.slice(0, limit);

    return NextResponse.json({
      query: trimmedQuery,
      count: topResults.length,
      results: topResults,
      mode: "semantic_hybrid",
    });
  } catch (error) {
    console.error("[Search API] Error executing semantic search:", error);
    return NextResponse.json(
      { error: error?.message || "Search failed", results: [] },
      { status: 500 }
    );
  }
}
