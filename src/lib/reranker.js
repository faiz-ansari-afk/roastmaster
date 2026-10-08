// src/lib/reranker.js — Multi-Signal Relevance Filtering & Reranking Engine for RAG
// Bridges broad vector recall (Top 10-20) with high-precision context injection (Top 3-5).
import { getEmbedding } from "./embeddings.js";
import { searchSimilarChunks } from "./db.js";

// Common conversational & structural stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
  "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
  "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
  "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

/**
 * Extracts salient terms and technical tokens from a query string.
 * Preserves compound tokens (e.g. "api-key", "pgvector", "v2.5").
 * @param {string} text
 * @returns {string[]}
 */
export function extractSalientKeywords(text) {
  if (!text || typeof text !== "string") return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  return [...new Set(tokens)];
}

/**
 * Calculates lexical Jaccard overlap between two chunk text blocks for redundancy suppression.
 * @param {string} textA
 * @param {string} textB
 * @returns {number} Value between 0.0 and 1.0.
 */
export function calculateTokenOverlap(textA, textB) {
  const setA = new Set(extractSalientKeywords(textA));
  const setB = new Set(extractSalientKeywords(textB));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/**
 * Multi-Signal Relevance Reranking & Filtering Algorithm.
 *
 * Scored across 4 complementary dimensions:
 * 1. Semantic Cosine Vector Distance (40%)
 * 2. Salient Term Density & Frequency (25%)
 * 3. Query Keyword Coverage Ratio (25%)
 * 4. Exact Phrase & Subphrase Alignment Bonus (10%)
 *
 * Then applies:
 * - Hard Query-Relevance Threshold (discards noise & unrelated queries)
 * - Near-Duplicate Redundancy Suppression (MMR-style diversity)
 * - Dynamic Top-K Selection (Top 3-5)
 *
 * @param {string} query - Original user prompt/query.
 * @param {Array<object>} candidates - Initial candidate chunks retrieved from pgvector (Top 10-20).
 * @param {object} [options]
 * @param {number} [options.topK=4] - Target number of final top chunks to return (3-5).
 * @param {number} [options.minRelevanceScore=0.36] - Cutoff threshold below which chunks are discarded.
 * @param {number} [options.maxRedundancyOverlap=0.65] - Maximum Jaccard overlap before a chunk is considered a duplicate.
 * @returns {Array<object>} Top 3-5 reranked, deduplicated, and relevance-filtered chunks.
 */
export function rerankAndFilterChunks(query, candidates, options = {}) {
  const {
    topK = 4,
    minRelevanceScore = 0.36,
    maxRedundancyOverlap = 0.65,
  } = options;

  if (!query || typeof query !== "string" || !Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const queryClean = query.trim().toLowerCase();
  const queryKeywords = extractSalientKeywords(queryClean);

  const scoredCandidates = candidates.map((chunk, originalRank) => {
    const content = (chunk.content || "").toLowerCase();
    const vectorSim = Math.max(0, Math.min(1, chunk.similarity || 0));

    // Fallback if query has no extracted keywords (e.g. single stopword query)
    if (queryKeywords.length === 0) {
      return {
        ...chunk,
        rerankScore: vectorSim,
        vectorSimilarity: vectorSim,
        keywordDensity: 0,
        coverageRatio: 0,
        phraseBonus: 0,
        matchedKeywords: [],
        originalRank: originalRank + 1,
      };
    }

    // 1. Keyword Frequency & Coverage
    let totalKeywordHits = 0;
    const matchedKeywords = [];

    for (const kw of queryKeywords) {
      // Word boundary match or hyphenated term match
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        totalKeywordHits += matches.length;
        matchedKeywords.push(kw);
      }
    }

    const coverageRatio = matchedKeywords.length / queryKeywords.length;
    const wordsInChunk = content.split(/\s+/).length || 1;
    // Normalized keyword density (bounded [0, 1])
    const keywordDensity = Math.min(1.0, (totalKeywordHits * 10) / wordsInChunk);

    // 2. Exact Phrase & Subphrase Bonus
    let phraseBonus = 0;
    if (queryClean.length >= 6 && content.includes(queryClean)) {
      phraseBonus = 0.18;
    } else if (queryKeywords.length >= 2) {
      for (let i = 0; i < queryKeywords.length - 1; i++) {
        const bigram = `${queryKeywords[i]} ${queryKeywords[i + 1]}`;
        if (content.includes(bigram)) {
          phraseBonus = Math.max(phraseBonus, 0.10);
        }
      }
    }

    // 3. Composite Relevance Score (0.0 to 1.0 scale)
    const compositeScore = Math.min(
      1.0,
      0.40 * vectorSim +
      0.25 * keywordDensity +
      0.25 * coverageRatio +
      phraseBonus
    );

    return {
      ...chunk,
      rerankScore: Number(compositeScore.toFixed(4)),
      vectorSimilarity: Number(vectorSim.toFixed(4)),
      keywordDensity: Number(keywordDensity.toFixed(4)),
      coverageRatio: Number(coverageRatio.toFixed(4)),
      phraseBonus: Number(phraseBonus.toFixed(4)),
      matchedKeywords,
      originalRank: originalRank + 1,
    };
  });

  // Sort descending by multi-signal rerankScore
  scoredCandidates.sort((a, b) => b.rerankScore - a.rerankScore);

  // 4. Relevance Gatekeeper: Filter out low-confidence & unrelated noise
  const filtered = scoredCandidates.filter((chunk) => {
    // If the query contains multiple distinct keywords, require that at least one matched or vector is high-confidence (>= 0.68)
    if (queryKeywords.length >= 2 && chunk.coverageRatio === 0 && chunk.vectorSimilarity < 0.68) {
      return false;
    }

    // Drop chunks below the minimum composite relevance cutoff
    if (chunk.rerankScore < minRelevanceScore) {
      return false;
    }

    return true;
  });

  // 5. Redundancy Suppression: Remove near-duplicate overlapping chunks
  const deduplicated = [];
  for (const chunk of filtered) {
    const isDuplicate = deduplicated.some(
      (existing) =>
        existing.fileName === chunk.fileName &&
        calculateTokenOverlap(existing.content, chunk.content) > maxRedundancyOverlap
    );

    if (!isDuplicate) {
      deduplicated.push(chunk);
    }

    if (deduplicated.length >= topK) {
      break;
    }
  }

  // Attach final rank and formatted relevance percentage
  return deduplicated.map((chunk, idx) => ({
    ...chunk,
    finalRank: idx + 1,
    similarity: chunk.rerankScore, // Expose rerank score as authoritative similarity
    relevancePercent: Math.round(chunk.rerankScore * 100),
  }));
}

/**
 * End-to-End High-Precision Retrieval Pipeline:
 * Query
 *  ↓
 * Embedding (gemini-embedding-2, 768)
 *  ↓
 * pgvector (Broad Recall: Top 10 to 20 candidates)
 *  ↓
 * Relevance filtering / reranking (Multi-signal scoring + redundancy suppression)
 *  ↓
 * Top 3–5 chunks
 *  ↓
 * Caller (Gemini Prompt Context)
 *
 * @param {object} params
 * @param {string} params.sessionId - Target chat session ID.
 * @param {string} params.query - User query string.
 * @param {number[]} [params.queryVector] - Precomputed query vector (optional).
 * @param {number} [params.broadLimit=15] - Initial candidate count from pgvector (range: 10-20).
 * @param {number} [params.topK=4] - Final top chunk count (range: 3-5).
 * @param {number} [params.minInitialSimilarity=0.20] - pgvector cosine distance threshold.
 * @param {number} [params.minRelevanceScore=0.36] - Reranker relevance cutoff threshold.
 * @returns {Promise<Array<object>>} Top 3-5 reranked and filtered chunks.
 */
export async function retrieveAndRerankChunks({
  sessionId,
  query,
  queryVector = null,
  broadLimit = 15,
  topK = 4,
  minInitialSimilarity = 0.20,
  minRelevanceScore = 0.36,
}) {
  if (!sessionId || !query || typeof query !== "string" || !query.trim()) {
    return [];
  }

  // 1. Generate query embedding (if not precomputed)
  let vector = queryVector;
  if (!Array.isArray(vector) || vector.length === 0) {
    try {
      vector = await getEmbedding(query);
    } catch (err) {
      console.warn("[RAG Pipeline] Query embedding generation failed:", err?.message);
      return [];
    }
  }

  if (!Array.isArray(vector) || vector.length === 0) {
    return [];
  }

  // 2. Broad Vector Retrieval (Top 10 to 20 from pgvector)
  const initialCandidates = await searchSimilarChunks({
    sessionId,
    queryVector: vector,
    limit: Math.max(10, Math.min(25, broadLimit)),
    minSimilarity: minInitialSimilarity,
  });

  if (!initialCandidates || initialCandidates.length === 0) {
    return [];
  }

  // 3. Multi-Signal Relevance Filtering & Reranking (Cut down to Top 3–5)
  const finalChunks = rerankAndFilterChunks(query, initialCandidates, {
    topK: Math.max(1, Math.min(5, topK)),
    minRelevanceScore,
  });

  console.log(
    `[RAG Pipeline] Query: "${query.slice(0, 45)}..." | Broad Candidates: ${initialCandidates.length} -> Reranked & Filtered: ${finalChunks.length} chunks (Top Score: ${finalChunks[0]?.relevancePercent || 0}%)`
  );

  return finalChunks;
}

