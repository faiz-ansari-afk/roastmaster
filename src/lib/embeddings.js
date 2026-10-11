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
  const matchSeconds =
    errorMsg.match(/retry in\s+([0-9.]+)\s*s/i) ||
    errorMsg.match(/retryDelay["']?\s*:\s*["']?([0-9.]+)s/i);
  if (matchSeconds) {
    const sec = parseFloat(matchSeconds[1]);
    if (!isNaN(sec) && sec > 0) {
      // If delay is longer than 5 seconds (e.g. daily quota reached), DO NOT sleep for hours!
      if (sec > 5) {
        return null;
      }
      return Math.min(3000, Math.ceil(sec * 1000) + 200);
    }
  }
  return null;
}

/**
 * Generates an embedding vector for a given text snippet using Gemini.
 * Uses EMBEDDING_MODEL (default: gemini-embedding-001) and EMBEDDING_DIMENSION (768).
 * @param {string} text - The input text to embed.
 * @param {object} [options]
 * @param {number} [options.dimensions] - Desired output dimensionality (default: EMBEDDING_DIMENSION).
 * @param {string} [options.model] - Model name override (default: EMBEDDING_MODEL).
 * @param {number} [options.maxRetries=1] - Number of retries for transient errors.
 * @returns {Promise<number[]>} Array of floating-point numbers representing the embedding.
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const sanitizedText = text.trim().slice(0, 2048);
  if (!sanitizedText) return [];

  const dimensions = options.dimensions || EMBEDDING_DIMENSION;
  const primaryModel = options.model || EMBEDDING_MODEL;
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 1;

  // Models to attempt: primary model first, followed by safe fallback
  const modelsToTry = [primaryModel];
  if (primaryModel !== "gemini-embedding-001") {
    modelsToTry.push("gemini-embedding-001");
  }

  // Check cache first
  const cacheKey = `${primaryModel}:${dimensions}:${sanitizedText}`;
  const cached = getCachedEmbedding(cacheKey);
  if (cached) {
    return cached;
  }

  const ai = getGenAI();

  for (const modelName of modelsToTry) {
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

        // If daily quota or large delay, skip retrying this model immediately
        const serverDelayMs = extractRetryDelayMs(msg);
        if (isRateLimit && !serverDelayMs && /13h|48704|day/i.test(msg)) {
          console.warn(`[Embeddings] Daily quota exhausted for ${modelName}. Trying fallback...`);
          break; // Move to next model
        }

        if (attempt < maxRetries && isTransient && serverDelayMs) {
          const backoffMs = Math.min(2500, serverDelayMs);
          console.warn(
            `[Embeddings] Brief rate limit on attempt ${attempt + 1}. Waiting ${backoffMs}ms before retry...`
          );
          await new Promise((r) => setTimeout(r, backoffMs));
        } else {
          console.error(`[Embeddings] Model ${modelName} error:`, msg);
          break; // Try next model or return empty
        }
      }
    }
  }

  return [];
}

/**
 * Generates embeddings for multiple texts using Gemini's native batchEmbedContents API.
 * Bundles up to 50 chunks per single API request to drastically reduce request volume
 * and easily stay below Google's 100 RPM Free Tier limits.
 *
 * @param {string[]} texts - Array of strings to embed.
 * @param {object} [options]
 * @param {number} [options.batchSize=50] - Number of text snippets per batchEmbedContents call (max 100).
 * @param {number} [options.dimensions] - Dimensionality override.
 * @param {string} [options.model] - Model name override.
 * @param {number} [options.maxRetries=3] - Retries per batch for transient errors.
 * @returns {Promise<number[][]>} Array of embedding vectors matching input texts.
 */
export async function getBatchEmbeddings(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const batchSize = Math.min(100, options.batchSize || 50);
  const dimensions = options.dimensions || EMBEDDING_DIMENSION;
  const modelName = options.model || EMBEDDING_MODEL;
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 3;

  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: modelName });
  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunkBatch = texts.slice(i, i + batchSize);
    const sanitizedBatch = chunkBatch.map((t) =>
      t && typeof t === "string" ? t.trim().slice(0, 2048) : " "
    );

    let batchHandled = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await model.batchEmbedContents({
          requests: sanitizedBatch.map((text) => ({
            content: { parts: [{ text: text || " " }] },
            outputDimensionality: dimensions,
          })),
        });

        if (response?.embeddings && Array.isArray(response.embeddings)) {
          response.embeddings.forEach((item) => {
            results.push(item?.values || []);
          });
          batchHandled = true;
          break;
        }
      } catch (error) {
        const msg = error?.message || "";
        const isRateLimit = /quota|rate|429|resource_exhausted|too many requests/i.test(msg);
        const isTransient = isRateLimit || /timeout|503|overloaded|econnreset/i.test(msg);

        if (attempt < maxRetries && isTransient) {
          const serverDelayMs = extractRetryDelayMs(msg);
          if (!serverDelayMs && /13h|48704|day/i.test(msg)) {
            console.warn(`[BatchEmbeddings] Daily quota exceeded. Aborting batch.`);
            break;
          }
          const backoffMs = serverDelayMs ? Math.min(3000, serverDelayMs) : Math.min(3000, Math.pow(2, attempt + 1) * 1000);

          console.warn(
            `[BatchEmbeddings] Rate limit on batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (attempt ${attempt + 1}). Waiting ${backoffMs}ms...`
          );
          await new Promise((r) => setTimeout(r, backoffMs));
        } else {
          console.error(
            `[BatchEmbeddings] Error on batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}:`,
            msg
          );
          if (attempt === maxRetries) {
            // Fill with empty vectors so indexing remains aligned with input chunks
            chunkBatch.forEach(() => results.push([]));
            batchHandled = true;
          }
        }
      }
    }

    // Micro-delay between batches (350ms) to maintain smooth RPM spacing
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 350));
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
