// src/lib/embeddings.js — Semantic embedding & similarity utilities using Google Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;

function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
}

/**
 * Explicit embedding provider, model, and dimension architecture.
 *
 * CRITICAL VECTOR RETRIEVAL PRINCIPLE:
 * In any vector index (pgvector, HNSW, cosine similarity), embeddings from different models
 * inhabit completely distinct high-dimensional spaces. A query vector generated from Model A
 * cannot be compared against document chunks embedded with Model B, even if dimension counts match.
 *
 * Silent cross-model fallbacks corrupt the vector index. Therefore, the entire index strictly
 * uses a single explicit model ('gemini-embedding-2') and dimension (768). Transient API issues
 * are retried on the same model rather than falling back to an incompatible model.
 */
export const EMBEDDING_PROVIDER = "gemini";
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-2";
export const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768;

// Backward-compatibility alias
export const DEFAULT_EMBEDDING_DIM = EMBEDDING_DIMENSION;

/**
 * Returns current active embedding configuration metadata.
 */
export function getEmbeddingConfig() {
  return {
    provider: EMBEDDING_PROVIDER,
    model: EMBEDDING_MODEL,
    dimension: EMBEDDING_DIMENSION,
  };
}
// In-memory query embedding cache (LRU-style with max 500 items) to prevent redundant API calls
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 500;

function getCachedEmbedding(key) {
  return embeddingCache.get(key) || null;
}

function setCachedEmbedding(key, vector) {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
  embeddingCache.set(key, vector);
}

/**
 * Extracts recommended retry delay in ms from Google Gemini RPC error message.
 * Example: "Please retry in 2.607340685s" or "retryDelay: '2s'".
 * @param {string} errorMsg
 * @returns {number|null} Delay in milliseconds
 */
function extractRetryDelayMs(errorMsg) {
  if (!errorMsg || typeof errorMsg !== "string") return null;
  const matchSeconds = errorMsg.match(/retry in\s+([0-9.]+)\s*s/i) || errorMsg.match(/retryDelay["']?\s*:\s*["']?([0-9.]+)s/i);
  if (matchSeconds) {
    const sec = parseFloat(matchSeconds[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.ceil(sec * 1000) + 400; // Add 400ms safety buffer
    }
  }
  return null;
}

/**
 * Generates an embedding vector for a given text snippet using Gemini.
 * Strictly uses EMBEDDING_MODEL ('gemini-embedding-2') and EMBEDDING_DIMENSION (768).
 * @param {string} text - The input text to embed.
 * @param {object} [options]
 * @param {number} [options.dimensions] - Desired output dimensionality (default: EMBEDDING_DIMENSION).
 * @param {string} [options.model] - Model name override (default: EMBEDDING_MODEL).
 * @param {number} [options.maxRetries=3] - Number of retries for transient errors.
 * @returns {Promise<number[]>} Array of floating-point numbers representing the embedding.
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const sanitizedText = text.trim().slice(0, 2048);
  if (!sanitizedText) return [];

  const dimensions = options.dimensions || EMBEDDING_DIMENSION;
  const modelName = options.model || EMBEDDING_MODEL;
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 3;

  // Check cache first for identical text + model + dimensions
  const cacheKey = `${modelName}:${dimensions}:${sanitizedText}`;
  const cached = getCachedEmbedding(cacheKey);
  if (cached) {
    return cached;
  }

  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: modelName });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.embedContent({
        content: { parts: [{ text: sanitizedText }] },
        outputDimensionality: dimensions,
      });

      if (result?.embedding?.values && result.embedding.values.length > 0) {
        const vector = result.embedding.values;
        setCachedEmbedding(cacheKey, vector);
        return vector;
      }
    } catch (error) {
      const msg = error?.message || "";
      const isRateLimit = /quota|rate|429|resource_exhausted|too many requests/i.test(msg);
      const isTransient = isRateLimit || /timeout|503|overloaded|econnreset/i.test(msg);

      if (attempt < maxRetries && isTransient) {
        // If Google provides an explicit retryDelay, respect it; otherwise exponential backoff
        const serverDelayMs = extractRetryDelayMs(msg);
        const backoffMs = serverDelayMs || Math.min(8000, Math.pow(2, attempt + 1) * 1000);

        console.warn(
          `[Embeddings] Rate limit/transient issue on attempt ${attempt + 1}/${maxRetries + 1}. Waiting ${backoffMs}ms before retry...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
      } else {
        console.error(
          `[Embeddings] Model ${modelName} error on attempt ${attempt + 1}/${maxRetries + 1}:`,
          msg || error
        );
        if (attempt === maxRetries) {
          return [];
        }
      }
    }
  }

  return [];
}

/**
 * Generates embeddings for multiple texts with safe concurrency throttling to respect Free Tier 100 RPM.
 * @param {string[]} texts - Array of strings to embed.
 * @param {object} [options]
 * @param {number} [options.concurrency=5] - Maximum parallel requests.
 * @returns {Promise<number[][]>} Array of embedding vectors.
 */
export async function getBatchEmbeddings(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const concurrency = options.concurrency || 5;
  const results = new Array(texts.length);

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const batchPromises = batch.map((text, idx) =>
      getEmbedding(text, options).then((res) => {
        results[i + idx] = res;
      })
    );
    await Promise.all(batchPromises);
    // Micro-delay between batches to smooth out RPM spikes
    if (i + concurrency < texts.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return results;
}

/**
 * Computes cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (where 1.0 means identical direction / semantic meaning).
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || !vecA.length || !vecB.length) return 0;
  if (vecA.length !== vecB.length) {
    console.warn(`[Embeddings] Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ranks a list of candidate items against a query vector using cosine similarity.
 * @param {number[]} queryVector - The query embedding vector.
 * @param {Array<object>} items - List of items containing embeddings.
 * @param {object} [options]
 * @param {string|function} [options.embeddingKey='embedding'] - Field name or getter function for the item's vector.
 * @param {number} [options.minScore=0.68] - Minimum similarity threshold (calibrated for Gemini 768-d noise floor).
 * @param {number} [options.limit=10] - Max number of top results to return.
 * @returns {Array<object>} Items sorted by similarity score descending, with a `similarityScore` property attached.
 */
export function rankBySimilarity(queryVector, items, options = {}) {
  const {
    embeddingKey = "embedding",
    minScore = 0.68,
    limit = 10,
  } = options;

  if (!queryVector || !queryVector.length || !Array.isArray(items)) {
    return [];
  }

  const getVector = typeof embeddingKey === "function"
    ? embeddingKey
    : (item) => item?.[embeddingKey];

  const scored = [];

  for (const item of items) {
    const itemVector = getVector(item);
    if (!itemVector || !itemVector.length) continue;

    const score = cosineSimilarity(queryVector, itemVector);
    if (score >= minScore) {
      scored.push({
        ...item,
        similarityScore: score,
      });
    }
  }

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, limit);
}
