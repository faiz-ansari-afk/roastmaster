// scripts/migrate-sessions-rag-engine.mjs
// Migration Script: Adds 'rag_engine' column to PostgreSQL sessions table
// and backfills all existing historical sessions to 'manual'.
//
// Usage:
//   node --env-file=.env scripts/migrate-sessions-rag-engine.mjs

import { getDbPool } from "../src/lib/db.js";

async function main() {
  console.log("===================================================================");
  console.log(" 🚀 RoastMaster AI: PostgreSQL Sessions Schema Migration");
  console.log("===================================================================");

  const pool = getDbPool();
  if (!pool) {
    console.error("❌ Error: Missing DATABASE_URL in environment.");
    process.exit(1);
  }

  try {
    // 1. Add column if it doesn't exist
    console.log("1️⃣ Adding 'rag_engine' column to 'sessions' table if not exists...");
    await pool.query(`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS rag_engine VARCHAR(32) DEFAULT 'manual';
    `);
    console.log("   ✓ Column 'rag_engine' verified.");

    // 2. Backfill existing null records to 'manual'
    console.log("2️⃣ Backfilling historical sessions to 'manual'...");
    const updateRes = await pool.query(`
      UPDATE sessions 
      SET rag_engine = 'manual' 
      WHERE rag_engine IS NULL;
    `);
    console.log(`   ✓ Backfilled ${updateRes.rowCount} historical sessions to 'manual'.`);

    // 3. Count distribution of sessions
    const statsRes = await pool.query(`
      SELECT rag_engine, COUNT(*) as count 
      FROM sessions 
      GROUP BY rag_engine;
    `);
    console.log("\n📊 Sessions Engine Distribution:");
    statsRes.rows.forEach((r) => {
      console.log(`   • ${r.rag_engine}: ${r.count} sessions`);
    });

    console.log("\n===================================================================");
    console.log("🎉 Migration completed successfully!");
    console.log("===================================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
}

main();
