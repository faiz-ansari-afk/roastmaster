/**
 * scripts/test-langchain-vectorstore.ts
 * Standalone verification script for Phase 3: LangChain PGVectorStore & Embeddings.
 * 
 * Verifies:
 * 1. Initializing isolated PGVectorStore table ('langchain_pdf_vectors')
 * 2. Ingesting sample PDF chunks with Gemini embeddings (768 dimensions)
 * 3. Performing Cosine Similarity Search
 * 4. Verifying document retrieval with scores and metadata
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
  console.log("   RoastMaster AI — LangChain PGVectorStore Test Harness    ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const samplePdfPath = path.resolve(process.cwd(), "RoastMaster_AI_Interview_Preparation_Guide.pdf");

  // Step 1: Initialize PGVectorStore
  const t0 = Date.now();
  try {
    const store = await getLangChainVectorStore();
    results.push({
      step: "1. Isolated PGVectorStore Table Initialization",
      success: !!store,
      durationMs: Date.now() - t0,
      details: "Connected to PostgreSQL and verified 'langchain_pdf_vectors' table schema.",
    });
  } catch (err: any) {
    results.push({
      step: "1. Isolated PGVectorStore Table Initialization",
      success: false,
      durationMs: Date.now() - t0,
      details: `Failed to initialize vector store: ${err.message}`,
    });
  }

  // Step 2: Extract & Chunk Sample Documents
  const t1 = Date.now();
  let sampleChunks: any[] = [];
  try {
    const pageDocs = await loadPdfPages(samplePdfPath);
    // Take first 2 pages to keep embedding quota minimal
    const subPages = pageDocs.slice(0, 2);
    sampleChunks = await splitPdfDocuments(subPages, { chunkSize: 700, chunkOverlap: 100 });

    results.push({
      step: "2. Document Preparation (First 2 Pages)",
      success: sampleChunks.length > 0,
      durationMs: Date.now() - t1,
      details: `Prepared ${sampleChunks.length} chunks from first 2 pages for ingestion.`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Document Preparation (First 2 Pages)",
      success: false,
      durationMs: Date.now() - t1,
      details: `Preparation failed: ${err.message}`,
    });
  }

  // Step 3: Ingest Documents into pgvector with Gemini Embeddings
  const t2 = Date.now();
  try {
    const { insertedCount } = await ingestDocumentsToVectorStore(sampleChunks);
    results.push({
      step: "3. Gemini Embeddings & pgvector Ingestion",
      success: insertedCount === sampleChunks.length,
      durationMs: Date.now() - t2,
      details: `Embedded and stored ${insertedCount} chunks with 768-dim vectors.`,
    });
  } catch (err: any) {
    results.push({
      step: "3. Gemini Embeddings & pgvector Ingestion",
      success: false,
      durationMs: Date.now() - t2,
      details: `Ingestion failed: ${err.message}`,
    });
  }

  // Step 4: Cosine Similarity Search Test
  const t3 = Date.now();
  const testQuery = "What is the tech stack and architecture of RoastMaster AI?";
  let searchResults: any[] = [];
  try {
    searchResults = await searchSimilarDocuments(testQuery, 3);
    const validSearch =
      searchResults.length > 0 &&
      searchResults.every(
        (r) =>
          r.document &&
          typeof r.document.pageContent === "string" &&
          typeof r.score === "number" &&
          r.document.metadata.fileName
      );

    results.push({
      step: "4. Similarity Search Retrieval (Top 3)",
      success: validSearch,
      durationMs: Date.now() - t3,
      details: `Retrieved ${searchResults.length} relevant chunks for query: "${testQuery}"`,
    });
  } catch (err: any) {
    results.push({
      step: "4. Similarity Search Retrieval (Top 3)",
      success: false,
      durationMs: Date.now() - t3,
      details: `Search failed: ${err.message}`,
    });
  }

  // Preview Search Matches
  if (searchResults.length > 0) {
    console.log("------------------------------------------------------------");
    console.log(`Top Retrieved Chunks for: "${testQuery}"`);
    console.log("------------------------------------------------------------");
    searchResults.forEach((r, idx) => {
      console.log(`[Rank ${idx + 1}] Score (Distance): ${r.score.toFixed(4)} | Page: ${r.document.metadata.pageNumber}`);
      console.log(`Content: "${r.document.pageContent.slice(0, 150)}..."\n`);
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
    console.log("🎉 All Phase 3 VectorStore & Embedding tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more VectorStore tests failed.\n");
    process.exit(1);
  }
}

runVectorStoreTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
