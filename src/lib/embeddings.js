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

/**
 * Generates an embedding vector for a given text snippet using Gemini.
 * Strictly uses EMBEDDING_MODEL ('gemini-embedding-2') and EMBEDDING_DIMENSION (768).
 * @param {string} text - The input text to embed.
 * @param {object} [options]
 * @param {number} [options.dimensions] - Desired output dimensionality (default: EMBEDDING_DIMENSION).
 * @param {string} [options.model] - Model name override (default: EMBEDDING_MODEL).
 * @param {number} [options.maxRetries=2] - Number of retries for transient errors.
 * @returns {Promise<number[]>} Array of floating-point numbers representing the embedding.
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const dimensions = options.dimensions || EMBEDDING_DIMENSION;
  const modelName = options.model || EMBEDDING_MODEL;
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 2;

  const sanitizedText = text.trim().slice(0, 2048);
  if (!sanitizedText) return [];

  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: modelName });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.embedContent({
        content: { parts: [{ text: sanitizedText }] },
        outputDimensionality: dimensions,
      });

      if (result?.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (error) {
      const isTransient = /quota|rate|timeout|503|429|overloaded/i.test(error?.message || "");
      if (attempt < maxRetries && isTransient) {
        const backoffMs = (attempt + 1) * 600;
        console.warn(
          `[Embeddings] Model ${modelName} transient issue on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${backoffMs}ms:`,
          error?.message
        );
        await new Promise((r) => setTimeout(r, backoffMs));
      } else {
        console.error(
          `[Embeddings] Model ${modelName} error on attempt ${attempt + 1}/${maxRetries + 1}:`,
          error?.message || error
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
 * Generates embeddings for multiple texts in parallel.
 * @param {string[]} texts - Array of strings to embed.
 * @param {object} [options]
 * @returns {Promise<number[][]>} Array of embedding vectors.
 */
export async function getBatchEmbeddings(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  try {
    const embeddings = await Promise.all(
      texts.map((t) => getEmbedding(t, options))
    );
    return embeddings;
  } catch (error) {
    console.error("[Embeddings] Batch embedding error:", error?.message || error);
    return [];
  }
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
 * @param {number} [options.minScore=0.4] - Minimum similarity threshold.
 * @param {number} [options.limit=10] - Max number of top results to return.
 * @returns {Array<object>} Items sorted by similarity score descending, with a `similarityScore` property attached.
 */
export function rankBySimilarity(queryVector, items, options = {}) {
  const {
    embeddingKey = "embedding",
    minScore = 0.4,
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
