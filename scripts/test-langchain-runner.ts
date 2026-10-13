/**
 * scripts/test-langchain-runner.ts
 * Standalone test runner harness for verifying Phase 1 LangChain environment.
 * 
 * Verifies:
 * 1. Environment and configuration loading
 * 2. LangChain ChatGoogleGenerativeAI invocation
 * 3. LangChain GoogleGenerativeAIEmbeddings dimension matching (768)
 * 4. PostgreSQL and pgvector database readiness
 * 
 * Run with: npm run test:langchain
 */
import { getLangChainConfig, createChatModel, createEmbeddings } from "@/lib/langchain/config";
import { getDbPool } from "@/lib/db";
import { HumanMessage } from "@langchain/core/messages";

interface TestStepResult {
  step: string;
  success: boolean;
  durationMs: number;
  details: string;
}

async function runTestSuite() {
  console.log("============================================================");
  console.log("   RoastMaster AI — LangChain.js Test Runner Harness        ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];

  // Step 1: Environment & Config Validation
  const t0 = Date.now();
  try {
    const config = getLangChainConfig();
    results.push({
      step: "1. Configuration & Environment",
      success: true,
      durationMs: Date.now() - t0,
      details: `Chat Model: ${config.chatModelName} | Embed Model: ${config.embeddingModelName} | Target Dims: ${config.embeddingDimension}`,
    });
  } catch (err: any) {
    results.push({
      step: "1. Configuration & Environment",
      success: false,
      durationMs: Date.now() - t0,
      details: err.message,
    });
  }

  // Step 2: ChatGoogleGenerativeAI Smoke Test
  const t1 = Date.now();
  try {
    const chat = createChatModel(0.1);
    const response = await chat.invoke([
      new HumanMessage("Reply with the exact word 'ROASTMASTER_LANGCHAIN_READY' and nothing else.")
    ]);
    const responseText = String(response.content).trim();
    results.push({
      step: "2. LangChain Chat Model (Gemini)",
      success: responseText.includes("ROASTMASTER_LANGCHAIN_READY"),
      durationMs: Date.now() - t1,
      details: `Response: "${responseText.slice(0, 60)}"`,
    });
  } catch (err: any) {
    results.push({
      step: "2. LangChain Chat Model (Gemini)",
      success: false,
      durationMs: Date.now() - t1,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 3: GoogleGenerativeAIEmbeddings Dimension Test
  const t2 = Date.now();
  try {
    const embeddings = createEmbeddings();
    const testText = "RoastMaster AI Standup Comedian and RAG Code Reviewer";
    const vector = await embeddings.embedQuery(testText);
    const config = getLangChainConfig();
    const isCorrectDim = vector.length === config.embeddingDimension;

    results.push({
      step: "3. LangChain Embeddings (pgvector compatible)",
      success: isCorrectDim,
      durationMs: Date.now() - t2,
      details: `Vector dimensions returned: ${vector.length} (Expected: ${config.embeddingDimension})`,
    });
  } catch (err: any) {
    results.push({
      step: "3. LangChain Embeddings (pgvector compatible)",
      success: false,
      durationMs: Date.now() - t2,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 4: PostgreSQL & pgvector Extension Verification
  const t3 = Date.now();
  try {
    const pool = getDbPool();
    if (!pool) {
      throw new Error("DATABASE_URL is not configured or pool could not be initialized.");
    }
    const client = await pool.connect();
    try {
      const extRes = await client.query(
        "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
      );
      if (extRes.rows.length === 0) {
        throw new Error("pgvector extension ('vector') is not installed in the database.");
      }
      const ext = extRes.rows[0];
      results.push({
        step: "4. PostgreSQL & pgvector Database",
        success: true,
        durationMs: Date.now() - t3,
        details: `Connected to Aiven Postgres. Extension 'vector' version ${ext.extversion} is active.`,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    results.push({
      step: "4. PostgreSQL & pgvector Database",
      success: false,
      durationMs: Date.now() - t3,
      details: `Database check note: ${err.message}`,
    });
  }

  // Print Summary Table
  console.log("------------------------------------------------------------");
  console.log("Test Results Summary:");
  console.log("------------------------------------------------------------");
  let allPassed = true;
  for (const r of results) {
    const icon = r.success ? "✅ [PASS]" : "❌ [FAIL]";
    if (!r.success) allPassed = false;
    console.log(`${icon} ${r.step} (${r.durationMs}ms)`);
    console.log(`         ${r.details}`);
  }
  console.log("------------------------------------------------------------");

  if (allPassed) {
    console.log("🎉 All Phase 1 LangChain environment tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more tests failed. Check error logs above.\n");
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
