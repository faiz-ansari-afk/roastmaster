// src/lib/db.js — Aiven PostgreSQL + pgvector Client & Utilities
import { Pool } from "pg";

let pool;

export function getDbPool() {
  if (!pool) {
    let rawConnectionString = process.env.DATABASE_URL;
    if (!rawConnectionString) {
      console.warn("[DB] DATABASE_URL is not defined in environment variables.");
      return null;
    }

    // Ensure connection points to roastmaster database where document_chunks was created
    if (rawConnectionString.includes("/defaultdb")) {
      rawConnectionString = rawConnectionString.replace("/defaultdb", "/roastmaster");
    }

    // Strip sslmode from URI query params so node-postgres doesn't override rejectUnauthorized
    const connectionString = rawConnectionString
      .replace(/([?&])sslmode=[^&]*(&|$)/, "$1")
      .replace(/[?&]$/, "");

    if (!global._pgAivenPoolV3) {
      global._pgAivenPoolV3 = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      global._pgAivenPoolV3.on("error", (err) => {
        console.error("[DB Pool Error]", err);
      });
    }
    pool = global._pgAivenPoolV3;
  }
  return pool;
}

/**
 * Format a Javascript number array into pgvector literal format: '[0.123, 0.456, ...]'
 * @param {number[]} vector
 * @returns {string}
 */
export function formatVectorForPg(vector) {
  if (!Array.isArray(vector) || vector.length === 0) {
    return "[]";
  }
  return `[${vector.join(",")}]`;
}

/**
 * Inserts an array of text chunks with their embedding vectors into Aiven Postgres.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} [params.userId]
 * @param {string} params.fileName
 * @param {Array<{ content: string, chunkIndex: number, pageNumber?: number, embedding: number[] }>} params.chunks
 */
export async function insertDocumentChunks({ sessionId, userId = null, fileName, chunks }) {
  const db = getDbPool();
  if (!db) {
    throw new Error("Database connection is not configured (missing DATABASE_URL).");
  }

  if (!chunks || chunks.length === 0) {
    return { count: 0 };
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Optional: clear existing chunks for this file in the session if re-uploading
    await client.query(
      "DELETE FROM document_chunks WHERE session_id = $1 AND file_name = $2",
      [sessionId, fileName]
    );

    const insertQuery = `
      INSERT INTO document_chunks (session_id, user_id, file_name, chunk_index, page_number, content, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
    `;

    for (const chunk of chunks) {
      const vectorLiteral = formatVectorForPg(chunk.embedding);
      await client.query(insertQuery, [
        sessionId,
        userId,
        fileName,
        chunk.chunkIndex,
        chunk.pageNumber || 1,
        chunk.content,
        vectorLiteral,
      ]);
    }

    await client.query("COMMIT");
    return { count: chunks.length, fileName };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error inserting document chunks:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Searches for the top-k most similar document chunks for a given query vector using pgvector cosine distance.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {number[]} params.queryVector
 * @param {number} [params.limit=4]
 * @param {number} [params.minSimilarity=0.35]
 * @returns {Promise<Array<{ id: number, fileName: string, chunkIndex: number, pageNumber: number, content: string, similarity: number }>>}
 */
export async function searchSimilarChunks({
  sessionId,
  queryVector,
  limit = 4,
  minSimilarity = 0.35,
}) {
  const db = getDbPool();
  if (!db) {
    console.warn("[DB] Database connection unavailable for vector search.");
    return [];
  }

  if (!queryVector || queryVector.length === 0) {
    return [];
  }

  const vectorLiteral = formatVectorForPg(queryVector);

  // pgvector: 1 - (embedding <=> $1::vector) gives cosine similarity from 0 to 1
  const searchQuery = `
    SELECT 
      id,
      file_name AS "fileName",
      chunk_index AS "chunkIndex",
      page_number AS "pageNumber",
      content,
      1 - (embedding <=> $1::vector) AS similarity
    FROM document_chunks
    WHERE session_id = $2
      AND (1 - (embedding <=> $1::vector)) >= $3
    ORDER BY embedding <=> $1::vector ASC
    LIMIT $4;
  `;

  try {
    const res = await db.query(searchQuery, [
      vectorLiteral,
      sessionId,
      minSimilarity,
      limit,
    ]);

    return res.rows.map((row) => ({
      ...row,
      pageNumber: row.pageNumber || 1,
      similarity: Number(parseFloat(row.similarity).toFixed(4)),
    }));
  } catch (err) {
    console.error("[DB] Error executing vector search:", err.message);
    return [];
  }
}

/**
 * Retrieves the list of documents indexed for a specific chat session.
 * @param {string} sessionId
 * @returns {Promise<Array<{ fileName: string, totalChunks: number, totalPages: number }>>}
 */
export async function getSessionDocuments(sessionId) {
  const db = getDbPool();
  if (!db || !sessionId) return [];

  const query = `
    SELECT 
      file_name AS "fileName", 
      COUNT(*) AS "totalChunks",
      COALESCE(MAX(page_number), 1) AS "totalPages"
    FROM document_chunks
    WHERE session_id = $1
    GROUP BY file_name
    ORDER BY file_name ASC;
  `;

  try {
    const res = await db.query(query, [sessionId]);
    return res.rows.map((r) => ({
      fileName: r.fileName,
      totalChunks: parseInt(r.totalChunks, 10),
      totalPages: parseInt(r.totalPages, 10) || 1,
    }));
  } catch (err) {
    console.error("[DB] Error fetching session documents:", err.message);
    return [];
  }
}

/**
 * Deletes all document chunks for a session.
 * @param {string} sessionId
 */
export async function deleteSessionDocuments(sessionId) {
  const db = getDbPool();
  if (!db || !sessionId) return;

  try {
    await db.query("DELETE FROM document_chunks WHERE session_id = $1", [sessionId]);
  } catch (err) {
    console.error("[DB] Error deleting session documents:", err.message);
  }
}
