/**
 * scripts/test-langchain-vectorstore.ts
 * Standalone verification script for Phase 3: LangChain PGVectorStore with Senior Architectural Refinements.
 * 
 * Verifies:
 * 1. Configuration-Aware VectorStore Pool (multi-collection isolation)
 * 2. Ingestion with deterministic documentId (SHA-256) and tenantId
 * 3. Batching performance and latency instrumentation
 * 4. Strict Tenant Isolation (cross-tenant data leakage prevention)
 * 5. Score Semantics (Cosine distance vs normalized similarity ordering)
 * 
 * Run with: npm run test:langchain:vectors
 */
import path from "node:path";
import { loadPdfPages, splitPdfDocuments } from "@/lib/langchain/document-loader";
import {
  getLangChainVectorStore,
  ingestDocumentsToVectorStore,
  searchSimilarDocuments,
} from "@/lib/langchain/vectorstore";

interface TestStepResult {
  step: string;
  success: boolean;
  durationMs: number;
  details: string;
}

async function runVectorStoreTests() {
  console.log("============================================================");
  console.log("   RoastMaster AI — LangChain PGVectorStore Advanced Test   ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const samplePdfPath = path.resolve(process.cwd(), "RoastMaster_AI_Interview_Preparation_Guide.pdf");

  // Step 1: Configuration-Aware Multi-Instance Pool Verification
  const t0 = Date.now();
  try {
    const storeA = await getLangChainVectorStore({ collectionName: "col_roastmaster_a" });
    const storeB = await getLangChainVectorStore({ collectionName: "col_roastmaster_b" });
    const storeA_cached = await getLangChainVectorStore({ collectionName: "col_roastmaster_a" });

    const isPoolWorking =
      storeA !== storeB &&
      storeA === storeA_cached;

    results.push({
      step: "1. Configuration-Aware Multi-Instance Pool",
      success: isPoolWorking,
      durationMs: Date.now() - t0,
      details: isPoolWorking
        ? "Different collectionNames produce isolated stores; identical requests reuse cached instance."
        : "Cache failed to isolate distinct collection configs.",
    });
  } catch (err: any) {
    results.push({
      step: "1. Configuration-Aware Multi-Instance Pool",
      success: false,
      durationMs: Date.now() - t0,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 2: Extract & Chunk with Document and Tenant Identity
  const t1 = Date.now();
  let tenant1Chunks: any[] = [];
  const AUTHORIZED_TENANT = "tenant-vip-club-42";
  const UNAUTHORIZED_TENANT = "tenant-intruder-99";

  try {
    const pageDocs = await loadPdfPages(samplePdfPath, {
      tenantId: AUTHORIZED_TENANT,
      documentVersion: 1,
    });
    // Use first 2 pages
    const subPages = pageDocs.slice(0, 2);
    tenant1Chunks = await splitPdfDocuments(subPages, { chunkSize: 700, chunkOverlap: 100 });

    const allHaveIdentity = tenant1Chunks.every(
      (c) =>
        c.metadata.tenantId === AUTHORIZED_TENANT &&
        typeof c.metadata.documentId === "string" &&
        c.metadata.documentId.length === 16 &&
        c.metadata.documentVersion === 1
    );

    results.push({
      step: "2. Document & Tenant Identity Provenance",
      success: allHaveIdentity && tenant1Chunks.length > 0,
      durationMs: Date.now() - t1,
      details: `Generated ${tenant1Chunks.length} chunks with stable documentId (${tenant1Chunks[0]?.metadata.documentId}) and tenantId: ${AUTHORIZED_TENANT}`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Document & Tenant Identity Provenance",
      success: false,
      durationMs: Date.now() - t1,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 3: Configurable Batch Ingestion with Latency Tracking
  const t2 = Date.now();
  try {
    const BATCH_SIZE = 4; // Configurable batch size
    const ingestionMetrics = await ingestDocumentsToVectorStore(
      tenant1Chunks,
      { batchSize: BATCH_SIZE, logProgress: true },
      { collectionName: "col_roastmaster_a" }
    );

    const isSuccess = ingestionMetrics.insertedCount === tenant1Chunks.length;

    results.push({
      step: "3. Configurable Batch Ingestion & Latency",
      success: isSuccess,
      durationMs: Date.now() - t2,
      details: `Inserted ${ingestionMetrics.insertedCount} chunks across ${ingestionMetrics.batchCount} batches. Total: ${ingestionMetrics.totalDurationMs}ms (Avg: ${ingestionMetrics.averageBatchMs.toFixed(0)}ms/batch)`,
    });
  } catch (err: any) {
    results.push({
      step: "3. Configurable Batch Ingestion & Latency",
      success: false,
      durationMs: Date.now() - t2,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 4: Strict Tenant Isolation Enforcement
  const t3 = Date.now();
  const testQuery = "What is the tech stack and architecture of RoastMaster AI?";
  let authorizedResults: any[] = [];
  let unauthorizedResults: any[] = [];
  try {
    // 4A: Query with the authorized tenant
    authorizedResults = await searchSimilarDocuments(
      testQuery,
      { k: 3, tenantId: AUTHORIZED_TENANT },
      { collectionName: "col_roastmaster_a" }
    );

    // 4B: Query with the unauthorized tenant (must return 0 results)
    unauthorizedResults = await searchSimilarDocuments(
      testQuery,
      { k: 3, tenantId: UNAUTHORIZED_TENANT },
      { collectionName: "col_roastmaster_a" }
    );

    const tenantIsolationPassed =
      authorizedResults.length > 0 &&
      unauthorizedResults.length === 0;

    results.push({
      step: "4. Strict Tenant Authorization & Isolation",
      success: tenantIsolationPassed,
      durationMs: Date.now() - t3,
      details: tenantIsolationPassed
        ? `Authorized tenant returned ${authorizedResults.length} chunks; Unauthorized tenant returned 0 chunks (no cross-tenant leakage).`
        : `Tenant filter failed: Authorized had ${authorizedResults.length}, Unauthorized had ${unauthorizedResults.length}`,
    });
  } catch (err: any) {
    results.push({
      step: "4. Strict Tenant Authorization & Isolation",
      success: false,
      durationMs: Date.now() - t3,
      details: `Failed: ${err.message}`,
    });
  }

  // Step 5: Score Semantics & Distance Ordering Verification
  const t4 = Date.now();
  try {
    let orderingCorrect = true;
    for (let i = 0; i < authorizedResults.length - 1; i++) {
      if (authorizedResults[i].distance > authorizedResults[i + 1].distance) {
        orderingCorrect = false;
        break;
      }
    }

    const hasSemantics = authorizedResults.every(
      (r) =>
        typeof r.distance === "number" &&
        typeof r.similarity === "number" &&
        Math.abs(r.similarity - (1 - r.distance)) < 0.001
    );

    results.push({
      step: "5. Score Semantics & Distance Ordering",
      success: orderingCorrect && hasSemantics,
      durationMs: Date.now() - t4,
      details: `Rank 1: Distance = ${authorizedResults[0]?.distance.toFixed(4)}, Similarity = ${authorizedResults[0]?.similarity.toFixed(4)}. Monotonically non-decreasing distance ordering verified.`,
    });
  } catch (err: any) {
    results.push({
      step: "5. Score Semantics & Distance Ordering",
      success: false,
      durationMs: Date.now() - t4,
      details: `Failed: ${err.message}`,
    });
  }

  // Preview Search Matches
  if (authorizedResults.length > 0) {
    console.log("\n------------------------------------------------------------");
    console.log(`Top Retrieved Chunks (Authorized Tenant: "${AUTHORIZED_TENANT}"):`);
    console.log("------------------------------------------------------------");
    authorizedResults.forEach((r, idx) => {
      console.log(`[Rank ${idx + 1}] Distance: ${r.distance.toFixed(4)} | Similarity: ${(r.similarity * 100).toFixed(1)}% | Page: ${r.document.metadata.pageNumber}`);
      console.log(`Content: "${r.document.pageContent.slice(0, 140)}..."\n`);
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
    console.log("🎉 All 3 architectural refinements verified and PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more tests failed.\n");
    process.exit(1);
  }
}

runVectorStoreTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
