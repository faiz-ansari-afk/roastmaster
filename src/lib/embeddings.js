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

// Preferred embedding models in order of priority
const EMBEDDING_MODELS = [
  "gemini-embedding-001",
  "gemini-embedding-2",
];

// 768 dimensions provides optimal balance of accuracy, speed, and compact Firestore storage (~6KB)
export const DEFAULT_EMBEDDING_DIM = 768;

/**
 * Generates an embedding vector for a given text snippet using Gemini.
 * @param {string} text - The input text to embed.
 * @param {object} [options]
 * @param {number} [options.dimensions=768] - Desired output dimensionality (default: 768).
 * @returns {Promise<number[]>} Array of floating-point numbers representing the embedding.
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const dimensions = options.dimensions || DEFAULT_EMBEDDING_DIM;
  const sanitizedText = text.trim().slice(0, 2048);
  if (!sanitizedText) return [];

  const ai = getGenAI();

  for (const modelName of EMBEDDING_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.embedContent({
        content: { parts: [{ text: sanitizedText }] },
        outputDimensionality: dimensions,
      });

      if (result?.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (error) {
      console.warn(`[Embeddings] Model ${modelName} failed, trying next:`, error?.message || error);
    }
  }

  console.error("[Embeddings] All embedding models failed for query:", sanitizedText.slice(0, 50));
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
