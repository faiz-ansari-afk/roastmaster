// src/lib/db.js — Aiven PostgreSQL + pgvector Client & Utilities
import { Pool } from "pg";
import { EMBEDDING_MODEL, EMBEDDING_DIMENSION } from "./embeddings.js";

let pool;
let vectorSchemaEnsured = false;

/**
 * Ensures PostgreSQL tables have explicit embedding_model and embedding_dimension columns.
 * Prevents index corruption by guaranteeing that model and dimension metadata are tracked per row.
 */
export async function ensureVectorSchema(clientOrPool = null) {
  if (vectorSchemaEnsured && !clientOrPool) return;
  const db = clientOrPool || getDbPool();
  if (!db) return;

  try {
    await db.query(`
      ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(64) DEFAULT '${EMBEDDING_MODEL}';
      ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding_dimension INTEGER DEFAULT ${EMBEDDING_DIMENSION};

      ALTER TABLE session_embeddings ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(64) DEFAULT '${EMBEDDING_MODEL}';
      ALTER TABLE session_embeddings ADD COLUMN IF NOT EXISTS embedding_dimension INTEGER DEFAULT ${EMBEDDING_DIMENSION};

      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(64) DEFAULT '${EMBEDDING_MODEL}';
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS embedding_dimension INTEGER DEFAULT ${EMBEDDING_DIMENSION};
    `);
    vectorSchemaEnsured = true;
  } catch (err) {
    console.warn("[DB] ensureVectorSchema notice:", err.message);
  }
}

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
    await ensureVectorSchema(client);

    // Optional: clear existing chunks for this file in the session if re-uploading
    await client.query(
      "DELETE FROM document_chunks WHERE session_id = $1 AND file_name = $2",
      [sessionId, fileName]
    );

    const insertQuery = `
      INSERT INTO document_chunks (
        session_id, user_id, file_name, chunk_index, page_number, content, embedding, embedding_model, embedding_dimension
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9)
    `;

    for (const chunk of chunks) {
      const vectorLiteral = formatVectorForPg(chunk.embedding);
      const modelName = chunk.embeddingModel || EMBEDDING_MODEL;
      const dim = chunk.embeddingDimension || (Array.isArray(chunk.embedding) ? chunk.embedding.length : EMBEDDING_DIMENSION);
      await client.query(insertQuery, [
        sessionId,
        userId,
        fileName,
        chunk.chunkIndex,
        chunk.pageNumber || 1,
        chunk.content,
        vectorLiteral,
        modelName,
        dim,
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
  limit = 5,
  minSimilarity = 0.30,
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
      embedding_model AS "embeddingModel",
      embedding_dimension AS "embeddingDimension",
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

/**
 * Upserts a chat session vector into PostgreSQL session_embeddings.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} [params.userId]
 * @param {string} [params.title]
 * @param {string} [params.snippet]
 * @param {string} [params.category]
 * @param {number[]} params.embedding
 */
export async function upsertSessionEmbedding({
  sessionId,
  userId = null,
  title = null,
  snippet = null,
  category = null,
  embedding,
  embeddingModel = EMBEDDING_MODEL,
  embeddingDimension = null,
}) {
  const db = getDbPool();
  if (!db || !sessionId || !Array.isArray(embedding) || embedding.length === 0) return null;

  const vectorLiteral = formatVectorForPg(embedding);
  const dim = embeddingDimension || embedding.length || EMBEDDING_DIMENSION;

  const query = `
    INSERT INTO session_embeddings (session_id, user_id, title, snippet, category, embedding, embedding_model, embedding_dimension, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, NOW())
    ON CONFLICT (session_id) DO UPDATE SET
      user_id = COALESCE(EXCLUDED.user_id, session_embeddings.user_id),
      title = COALESCE(EXCLUDED.title, session_embeddings.title),
      snippet = COALESCE(EXCLUDED.snippet, session_embeddings.snippet),
      category = COALESCE(EXCLUDED.category, session_embeddings.category),
      embedding = EXCLUDED.embedding,
      embedding_model = EXCLUDED.embedding_model,
      embedding_dimension = EXCLUDED.embedding_dimension,
      updated_at = NOW()
    RETURNING id, session_id AS "sessionId";
  `;

  try {
    const res = await db.query(query, [
      sessionId,
      userId,
      title,
      snippet,
      category,
      vectorLiteral,
      embeddingModel,
      dim,
    ]);
    // Synchronize vector embedding to primary sessions table as well
    await db.query(
      `UPDATE sessions
       SET embedding = $1::vector,
           embedding_model = $2,
           embedding_dimension = $3,
           title = COALESCE($4, title),
           snippet = COALESCE($5, snippet),
           category = COALESCE($6, category),
           updated_at = NOW()
       WHERE id = $7`,
      [vectorLiteral, embeddingModel, dim, title, snippet, category, sessionId]
    ).catch((syncErr) => console.warn("[DB] Session table embedding sync notice:", syncErr.message));

    return res.rows[0];
  } catch (err) {
    console.error("[DB] Error upserting session embedding:", err.message);
    return null;
  }
}

/**
 * Batch upserts multiple session vectors into PostgreSQL session_embeddings.
 * @param {Array<object>} sessions
 * @param {string} [defaultUserId]
 * @returns {Promise<number>}
 */
export async function upsertBatchSessionEmbeddings(sessions, defaultUserId = null) {
  const db = getDbPool();
  if (!db || !Array.isArray(sessions) || sessions.length === 0) return 0;

  const valid = sessions.filter(
    (s) => (s?.id || s?.sessionId) && Array.isArray(s?.embedding) && s.embedding.length > 0
  );
  if (valid.length === 0) return 0;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await ensureVectorSchema(client);
    const query = `
      INSERT INTO session_embeddings (session_id, user_id, title, snippet, category, embedding, embedding_model, embedding_dimension, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, session_embeddings.user_id),
        title = COALESCE(EXCLUDED.title, session_embeddings.title),
        snippet = COALESCE(EXCLUDED.snippet, session_embeddings.snippet),
        category = COALESCE(EXCLUDED.category, session_embeddings.category),
        embedding = EXCLUDED.embedding,
        embedding_model = EXCLUDED.embedding_model,
        embedding_dimension = EXCLUDED.embedding_dimension,
        updated_at = NOW();
    `;
    const syncSessionQuery = `
      UPDATE sessions
      SET embedding = $1::vector,
          embedding_model = $2,
          embedding_dimension = $3,
          title = COALESCE($4, title),
          snippet = COALESCE($5, snippet),
          category = COALESCE($6, category),
          updated_at = NOW()
      WHERE id = $7;
    `;
    for (const s of valid) {
      const sid = s.id || s.sessionId;
      const vectorLiteral = formatVectorForPg(s.embedding);
      const uid = s.userId || defaultUserId || null;
      const model = s.embeddingModel || EMBEDDING_MODEL;
      const dim = s.embeddingDimension || s.embedding.length || EMBEDDING_DIMENSION;
      await client.query(query, [
        sid,
        uid,
        s.title || null,
        s.snippet || null,
        s.category || null,
        vectorLiteral,
        model,
        dim,
      ]);
      await client.query(syncSessionQuery, [
        vectorLiteral,
        model,
        dim,
        s.title || null,
        s.snippet || null,
        s.category || null,
        sid,
      ]);
    }
    await client.query("COMMIT");
    return valid.length;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error batch upserting session embeddings:", err.message);
    return 0;
  } finally {
    client.release();
  }
}

/**
 * Real Retrieval Engine: Executes hybrid semantic vector + keyword retrieval directly in PostgreSQL.
 * Uses HNSW index with cosine distance operator (<=>) combined with ILIKE keyword & normalization matching.
 *
 * Query flow:
 *   User query -> Gemini embedding (queryVector) + text (queryText) -> PostgreSQL
 *   Calculates GREATEST(vector cosine similarity, text keyword matches)
 *
 * @param {object} params
 * @param {number[]} [params.queryVector]
 * @param {string} [params.queryText=""]
 * @param {string} [params.userId]
 * @param {number} [params.limit=5]
 * @param {number} [params.minSimilarity=0.68] - Calibrated floor: Gemini 768-d random text noise floor is ~0.58-0.62
 * @returns {Promise<Array<object>>}
 */
export async function searchSimilarSessions({
  queryVector = null,
  queryText = "",
  userId = null,
  limit = 5,
  minSimilarity = 0.68,
}) {
  const db = getDbPool();
  if (!db) return [];

  const hasVector = Array.isArray(queryVector) && queryVector.length > 0;
  const rawText = (queryText || "").trim();
  const normalizedText = rawText.replace(/[-\s]/g, "");

  if (!hasVector && !rawText) {
    return [];
  }

  const vectorLiteral = hasVector ? formatVectorForPg(queryVector) : null;

  const query = `
    SELECT 
      id,
      id AS "sessionId",
      title,
      snippet,
      category,
      message_count AS "messageCount",
      embedding_model AS "embeddingModel",
      embedding_dimension AS "embeddingDimension",
      ROUND(GREATEST(
        CASE WHEN $1::text IS NOT NULL AND embedding IS NOT NULL THEN (1 - (embedding <=> $1::vector)) ELSE 0 END,
        CASE WHEN $2::text <> '' AND title ILIKE '%' || $2 || '%' THEN 0.88 ELSE 0 END,
        CASE WHEN $2::text <> '' AND $6::text <> '' AND REPLACE(REPLACE(title, '-', ''), ' ', '') ILIKE '%' || $6 || '%' THEN 0.86 ELSE 0 END,
        CASE WHEN $2::text <> '' AND snippet ILIKE '%' || $2 || '%' THEN 0.78 ELSE 0 END,
        CASE WHEN $2::text <> '' AND $6::text <> '' AND REPLACE(REPLACE(snippet, '-', ''), ' ', '') ILIKE '%' || $6 || '%' THEN 0.76 ELSE 0 END,
        CASE WHEN $2::text <> '' AND category ILIKE '%' || $2 || '%' THEN 0.68 ELSE 0 END
      )::numeric, 4) AS "similarityScore",
      CASE 
        WHEN $2::text <> '' AND (title ILIKE '%' || $2 || '%' OR snippet ILIKE '%' || $2 || '%' OR ($6::text <> '' AND REPLACE(REPLACE(snippet, '-', ''), ' ', '') ILIKE '%' || $6 || '%')) 
          AND $1::text IS NOT NULL AND embedding IS NOT NULL AND (1 - (embedding <=> $1::vector)) >= 0.68
        THEN 'hybrid'
        WHEN $2::text <> '' AND (title ILIKE '%' || $2 || '%' OR snippet ILIKE '%' || $2 || '%' OR ($6::text <> '' AND REPLACE(REPLACE(snippet, '-', ''), ' ', '') ILIKE '%' || $6 || '%'))
        THEN 'keyword'
        ELSE 'semantic'
      END AS "matchType"
    FROM sessions
    WHERE ($3::text IS NULL OR user_id = $3::text OR user_id IS NULL)
      AND (
        ($1::text IS NOT NULL AND embedding IS NOT NULL AND (1 - (embedding <=> $1::vector)) >= $4)
        OR ($2::text <> '' AND (
          title ILIKE '%' || $2 || '%'
          OR ($6::text <> '' AND REPLACE(REPLACE(title, '-', ''), ' ', '') ILIKE '%' || $6 || '%')
          OR snippet ILIKE '%' || $2 || '%'
          OR ($6::text <> '' AND REPLACE(REPLACE(snippet, '-', ''), ' ', '') ILIKE '%' || $6 || '%')
          OR category ILIKE '%' || $2 || '%'
        ))
      )
    ORDER BY "similarityScore" DESC
    LIMIT $5;
  `;

  try {
    const res = await db.query(query, [
      vectorLiteral,
      rawText,
      userId,
      minSimilarity,
      limit,
      normalizedText,
    ]);

    return res.rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      title: row.title,
      snippet: row.snippet,
      category: row.category,
      messageCount: row.messageCount,
      similarityScore: Number(parseFloat(row.similarityScore).toFixed(4)),
      matchType: row.matchType || "semantic",
    }));
  } catch (err) {
    console.error("[DB] Error executing PostgreSQL hybrid session retrieval:", err.message);
    return [];
  }
}

/**
 * Deletes a session's vector embedding and document chunks from PostgreSQL.
 * @param {string} sessionId
 */
export async function deleteSessionFromPostgres(sessionId) {
  const db = getDbPool();
  if (!db || !sessionId) return;
  try {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    await db.query("DELETE FROM session_embeddings WHERE session_id = $1", [sessionId]);
    await db.query("DELETE FROM document_chunks WHERE session_id = $1", [sessionId]);
  } catch (err) {
    console.error("[DB] Error deleting session from PostgreSQL:", err.message);
  }
}

/**
 * Shreds all session vectors and document chunks for a specific user from PostgreSQL.
 * @param {string} [userId]
 */
export async function deleteAllUserPostgresData(userId = null) {
  const db = getDbPool();
  if (!db) return { success: false, error: "Database unavailable" };
  try {
    let deletedSessions = 0;
    let deletedChunks = 0;
    if (userId) {
      const res1 = await db.query(
        "DELETE FROM sessions WHERE user_id = $1 OR user_id IS NULL",
        [userId]
      );
      deletedSessions = res1.rowCount;
      await db.query(
        "DELETE FROM session_embeddings WHERE user_id = $1 OR user_id IS NULL",
        [userId]
      );
      const res2 = await db.query(
        "DELETE FROM document_chunks WHERE user_id = $1 OR user_id IS NULL",
        [userId]
      );
      deletedChunks = res2.rowCount;
    } else {
      const res1 = await db.query("DELETE FROM sessions");
      deletedSessions = res1.rowCount;
      await db.query("DELETE FROM session_embeddings");
      const res2 = await db.query("DELETE FROM document_chunks");
      deletedChunks = res2.rowCount;
    }
    return { success: true, deletedSessions, deletedChunks };
  } catch (err) {
    console.error("[DB] Error shredding all user data from PostgreSQL:", err.message);
    return { success: false, error: err.message };
  }
}

// ── USER PROFILES ────────────────────────────────────────────────────────────

export async function getUserProfileFromDb(userId) {
  const db = getDbPool();
  if (!db || !userId) return null;
  try {
    const res = await db.query(
      `SELECT user_id, display_name, photo_url, stage_title, bio, roast_level, favorite_topic, updated_at
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      userId: r.user_id,
      displayName: r.display_name,
      photoURL: r.photo_url,
      stageTitle: r.stage_title,
      bio: r.bio,
      roastLevel: r.roast_level,
      favoriteTopic: r.favorite_topic,
      updatedAt: r.updated_at,
    };
  } catch (err) {
    console.error("[DB] getUserProfileFromDb error:", err.message);
    return null;
  }
}

export async function upsertUserProfileInDb({
  userId,
  displayName,
  photoURL,
  stageTitle,
  bio,
  roastLevel,
  favoriteTopic,
}) {
  const db = getDbPool();
  if (!db || !userId) return false;
  try {
    await db.query(
      `INSERT INTO user_profiles (user_id, display_name, photo_url, stage_title, bio, roast_level, favorite_topic, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
         photo_url = COALESCE(EXCLUDED.photo_url, user_profiles.photo_url),
         stage_title = COALESCE(EXCLUDED.stage_title, user_profiles.stage_title),
         bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
         roast_level = COALESCE(EXCLUDED.roast_level, user_profiles.roast_level),
         favorite_topic = COALESCE(EXCLUDED.favorite_topic, user_profiles.favorite_topic),
         updated_at = NOW()`,
      [
        userId,
        displayName || null,
        photoURL || null,
        stageTitle || null,
        bio || null,
        roastLevel || "sarcastic",
        favoriteTopic || null,
      ]
    );
    return true;
  } catch (err) {
    console.error("[DB] upsertUserProfileInDb error:", err.message);
    return false;
  }
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

export async function getUserSessionsFromDb(userId) {
  const db = getDbPool();
  if (!db || !userId) return [];
  try {
    const res = await db.query(
      `SELECT id, user_id, title, snippet, category, message_count, created_at, updated_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      snippet: r.snippet,
      category: r.category,
      messageCount: r.message_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.error("[DB] getUserSessionsFromDb error:", err.message);
    return [];
  }
}

export async function createSessionInDb({ sessionId, userId, title = null }) {
  const db = getDbPool();
  if (!db || !sessionId || !userId) return null;
  try {
    const res = await db.query(
      `INSERT INTO sessions (id, user_id, title, message_count, created_at, updated_at)
       VALUES ($1, $2, $3, 0, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
       RETURNING id, title`,
      [sessionId, userId, title || "New Roast Session"]
    );
    return res.rows[0]?.id || sessionId;
  } catch (err) {
    console.error("[DB] createSessionInDb error:", err.message);
    return null;
  }
}

export async function updateSessionTitleInDb(sessionId, title) {
  const db = getDbPool();
  if (!db || !sessionId || !title) return false;
  try {
    const cleanTitle = title.length > 60 ? title.slice(0, 60) + "..." : title;
    await db.query(
      `UPDATE sessions SET title = $2, updated_at = NOW() WHERE id = $1`,
      [sessionId, cleanTitle]
    );
    return true;
  } catch (err) {
    console.error("[DB] updateSessionTitleInDb error:", err.message);
    return false;
  }
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export async function getSessionMessagesFromDb(sessionId) {
  const db = getDbPool();
  if (!db || !sessionId) return [];
  try {
    const res = await db.query(
      `SELECT id, role, content, created_at
       FROM messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      role: r.role,
      content: r.content,
      createdAt: r.created_at,
    }));
  } catch (err) {
    console.error("[DB] getSessionMessagesFromDb error:", err.message);
    return [];
  }
}

export async function saveCompletedExchangeInDb({
  sessionId,
  userId,
  userMsg,
  botMsg,
  title = null,
  isFirstMessage = false,
  embedding = null,
}) {
  const db = getDbPool();
  if (!db || !sessionId || !userId) return false;
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Clean bot content to avoid storing embedding inside JSON
    let cleanBotContent = botMsg;
    if (botMsg && typeof botMsg === "object") {
      const rest = { ...botMsg };
      delete rest.embedding;
      cleanBotContent = rest;
    }

    // 1. Insert user message
    await client.query(
      `INSERT INTO messages (session_id, user_id, role, content, created_at)
       VALUES ($1, $2, 'user', $3, NOW())`,
      [sessionId, userId, JSON.stringify(userMsg)]
    );

    // 2. Insert assistant message
    await client.query(
      `INSERT INTO messages (session_id, user_id, role, content, created_at)
       VALUES ($1, $2, 'assistant', $3, NOW())`,
      [sessionId, userId, JSON.stringify(cleanBotContent)]
    );

    // 3. Derive dynamic title if appropriate
    const rawTitle = (typeof botMsg === "object" && botMsg?.title) || title;
    let cleanTitle = null;
    if (rawTitle && typeof rawTitle === "string" && rawTitle.trim()) {
      cleanTitle = rawTitle.trim().length > 60 ? rawTitle.trim().slice(0, 60) + "..." : rawTitle.trim();
    }

    const snippet =
      typeof botMsg === "object"
        ? (botMsg?.roast || "").slice(0, 160)
        : String(botMsg || "").slice(0, 160);

    const category = typeof botMsg === "object" ? botMsg?.category || null : null;
    const vectorLiteral = Array.isArray(embedding) && embedding.length > 0 ? formatVectorForPg(embedding) : null;
    const embModel = vectorLiteral ? EMBEDDING_MODEL : null;
    const embDim = vectorLiteral ? (embedding.length || EMBEDDING_DIMENSION) : null;

    // 4. Upsert session summary in sessions table
    await client.query(
      `INSERT INTO sessions (id, user_id, title, snippet, category, message_count, embedding, embedding_model, embedding_dimension, created_at, updated_at)
       VALUES ($1, $2, COALESCE($3, 'New Roast Session'), $4, $5, 2, $6::vector, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         user_id = COALESCE(sessions.user_id, EXCLUDED.user_id),
         title = CASE 
           WHEN $3::text IS NOT NULL AND ($9::boolean = true OR sessions.title = 'New Roast Session') THEN $3::text 
           ELSE sessions.title 
         END,
         snippet = COALESCE(EXCLUDED.snippet, sessions.snippet),
         category = COALESCE(EXCLUDED.category, sessions.category),
         message_count = sessions.message_count + 2,
         embedding = COALESCE(EXCLUDED.embedding, sessions.embedding),
         embedding_model = COALESCE(EXCLUDED.embedding_model, sessions.embedding_model),
         embedding_dimension = COALESCE(EXCLUDED.embedding_dimension, sessions.embedding_dimension),
         updated_at = NOW()`,
      [sessionId, userId, cleanTitle, snippet, category, vectorLiteral, embModel, embDim, isFirstMessage]
    );

    await client.query("COMMIT");

    if (!vectorLiteral && (cleanTitle || snippet)) {
      import("@/lib/embeddings")
        .then(({ getEmbedding }) => {
          const textToEmbed = `Title: ${cleanTitle || ""}. Snippet: ${snippet || ""}. Category: ${category || ""}`;
          return getEmbedding(textToEmbed);
        })
        .then((vec) => {
          if (vec && vec.length > 0) {
            upsertSessionEmbedding({
              sessionId,
              userId,
              title: cleanTitle,
              snippet,
              category,
              embedding: vec,
            });
          }
        })
        .catch((e) => console.warn("[DB] Background embedding sync notice:", e?.message));
    }

    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] saveCompletedExchangeInDb error:", err.message);
    return false;
  } finally {
    client.release();
  }
}

