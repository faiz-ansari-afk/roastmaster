// scripts/migrate-embeddings.mjs
// Embedding Migration Script: Standardizes all vector embeddings across PostgreSQL (Aiven pgvector)
// strictly to a single, explicit model ('gemini-embedding-2') and dimension (768).
//
// Usage:
//   node --env-file=.env scripts/migrate-embeddings.mjs

import { getDbPool, ensureVectorSchema, formatVectorForPg } from "../src/lib/db.js";
import {
  getEmbedding,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  EMBEDDING_PROVIDER,
} from "../src/lib/embeddings.js";

async function main() {
  console.log("===================================================================");
  console.log(" 🚀 RoastMaster AI: Vector Index & Embedding Migration Tool");
  console.log("===================================================================");
  console.log(`• Target Provider : ${EMBEDDING_PROVIDER}`);
  console.log(`• Target Model    : ${EMBEDDING_MODEL}`);
  console.log(`• Target Dimension: ${EMBEDDING_DIMENSION}`);
  console.log("===================================================================\n");

  const pool = getDbPool();
  if (!pool) {
    console.error("❌ Error: Missing DATABASE_URL in environment.");
    process.exit(1);
  }

  const force = process.argv.includes("--force") || process.argv.includes("-f");

  // 1. Ensure Schema
  console.log("1️⃣ Ensuring vector columns (embedding_model, embedding_dimension) exist...");
  await ensureVectorSchema();
  console.log("   ✓ Schema verified.\n");

  // 2. Migrate document_chunks
  console.log(`2️⃣ Scanning document_chunks for embeddings (force=${force})...`);
  const chunkRes = await pool.query(
    force
      ? `SELECT id, file_name, chunk_index, content, embedding_model, embedding_dimension
         FROM document_chunks
         ORDER BY id ASC;`
      : `SELECT id, file_name, chunk_index, content, embedding_model, embedding_dimension
         FROM document_chunks
         WHERE embedding_model IS NULL 
            OR embedding_model != $1
            OR embedding_dimension != $2
            OR embedding IS NULL
         ORDER BY id ASC;`,
    force ? [] : [EMBEDDING_MODEL, EMBEDDING_DIMENSION]
  );

  const chunksToMigrate = chunkRes.rows;
  console.log(`   Found ${chunksToMigrate.length} chunks requiring migration to ${EMBEDDING_MODEL}.\n`);

  let migratedChunks = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < chunksToMigrate.length; i += BATCH_SIZE) {
    const batch = chunksToMigrate.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   Processing chunks ${i + 1} to ${Math.min(i + BATCH_SIZE, chunksToMigrate.length)} of ${chunksToMigrate.length}... `);

    for (const chunk of batch) {
      if (!chunk.content || !chunk.content.trim()) continue;

      const vector = await getEmbedding(chunk.content, {
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSION,
      });

      if (!vector || vector.length !== EMBEDDING_DIMENSION) {
        console.warn(`\n   ⚠️ Warning: failed to generate embedding for chunk ID ${chunk.id}`);
        continue;
      }

      const vectorLiteral = formatVectorForPg(vector);
      await pool.query(`
        UPDATE document_chunks
        SET embedding = $1::vector,
            embedding_model = $2,
            embedding_dimension = $3
        WHERE id = $4;
      `, [vectorLiteral, EMBEDDING_MODEL, EMBEDDING_DIMENSION, chunk.id]);

      migratedChunks++;
    }

    console.log("✓ Done");
    // Brief throttle to be gentle on Gemini API rate limits
    if (i + BATCH_SIZE < chunksToMigrate.length) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`\n   ✓ Total document chunks migrated: ${migratedChunks}/${chunksToMigrate.length}\n`);

  // 3. Migrate session_embeddings
  console.log(`3️⃣ Scanning session_embeddings for embeddings (force=${force})...`);
  const sessionEmbRes = await pool.query(
    force
      ? `SELECT id, session_id, user_id, title, snippet, category, embedding_model, embedding_dimension
         FROM session_embeddings
         ORDER BY id ASC;`
      : `SELECT id, session_id, user_id, title, snippet, category, embedding_model, embedding_dimension
         FROM session_embeddings
         WHERE embedding_model IS NULL 
            OR embedding_model != $1
            OR embedding_dimension != $2
            OR embedding IS NULL
         ORDER BY id ASC;`,
    force ? [] : [EMBEDDING_MODEL, EMBEDDING_DIMENSION]
  );

  const sessionsToMigrate = sessionEmbRes.rows;
  console.log(`   Found ${sessionsToMigrate.length} session embeddings requiring migration.\n`);

  let migratedSessions = 0;
  for (const s of sessionsToMigrate) {
    const textToEmbed = `Title: ${s.title || ""}. Snippet: ${s.snippet || ""}. Category: ${s.category || ""}`.trim();
    if (!textToEmbed) continue;

    const vector = await getEmbedding(textToEmbed, {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSION,
    });

    if (!vector || vector.length !== EMBEDDING_DIMENSION) {
      console.warn(`   ⚠️ Warning: failed to generate embedding for session ${s.session_id}`);
      continue;
    }

    const vectorLiteral = formatVectorForPg(vector);

    // Update session_embeddings
    await pool.query(`
      UPDATE session_embeddings
      SET embedding = $1::vector,
          embedding_model = $2,
          embedding_dimension = $3,
          updated_at = NOW()
      WHERE id = $4;
    `, [vectorLiteral, EMBEDDING_MODEL, EMBEDDING_DIMENSION, s.id]);

    // Also update sessions table
    await pool.query(`
      UPDATE sessions
      SET embedding = $1::vector,
          embedding_model = $2,
          embedding_dimension = $3,
          updated_at = NOW()
      WHERE id = $4;
    `, [vectorLiteral, EMBEDDING_MODEL, EMBEDDING_DIMENSION, s.session_id]).catch(() => {});

    migratedSessions++;
    console.log(`   ✓ Migrated session "${s.title || s.session_id}" (${s.session_id})`);
    await new Promise((r) => setTimeout(r, 200));
  }

  // 4. Update any remaining sessions with embeddings
  await pool.query(`
    UPDATE sessions s
    SET embedding = se.embedding,
        embedding_model = se.embedding_model,
        embedding_dimension = se.embedding_dimension
    FROM session_embeddings se
    WHERE s.id = se.session_id
      AND (s.embedding_model IS NULL OR s.embedding_model != $1);
  `, [EMBEDDING_MODEL]);

  // 5. Audit & Verification
  console.log("\n===================================================================");
  console.log(" 🔍 Post-Migration Vector Index Audit");
  console.log("===================================================================");

  const chunkAudit = await pool.query(`
    SELECT 
      COALESCE(embedding_model, 'UNSET') as model, 
      COALESCE(embedding_dimension::text, 'UNSET') as dim, 
      COUNT(*) as count
    FROM document_chunks
    GROUP BY embedding_model, embedding_dimension;
  `);
  console.log("• document_chunks breakdown:");
  console.table(chunkAudit.rows);

  const sessionAudit = await pool.query(`
    SELECT 
      COALESCE(embedding_model, 'UNSET') as model, 
      COALESCE(embedding_dimension::text, 'UNSET') as dim, 
      COUNT(*) as count
    FROM session_embeddings
    GROUP BY embedding_model, embedding_dimension;
  `);
  console.log("• session_embeddings breakdown:");
  console.table(sessionAudit.rows);

  console.log("\n===================================================================");
  console.log(" 🎉 Embedding Migration Complete & Verified!");
  console.log(`   All vectors are unified under '${EMBEDDING_MODEL}' (${EMBEDDING_DIMENSION} dims).`);
  console.log("===================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed with fatal error:", err);
  process.exit(1);
});
