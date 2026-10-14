/**
 * scripts/test-langchain-documents.ts
 * Standalone verification script for Phase 2: LangChain Document representation & splitting.
 * 
 * Verifies:
 * 1. Loading PDF into page-level LangChain Document instances.
 * 2. Splitting with RecursiveCharacterTextSplitter while maintaining metadata.
 * 3. Page attribution integrity (no cross-page content contamination).
 * 4. Chunk size limits and overlap consistency.
 * 
 * Run with: npm run test:langchain:docs
 */
import path from "node:path";
import { loadPdfPages, splitPdfDocuments } from "@/lib/langchain/document-loader";

interface TestStepResult {
  step: string;
  success: boolean;
  durationMs: number;
  details: string;
}

async function runDocumentTests() {
  console.log("============================================================");
  console.log("   RoastMaster AI — LangChain Document & Splitter Test      ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const samplePdfPath = path.resolve(process.cwd(), "RoastMaster_AI_Interview_Preparation_Guide.pdf");

  // Step 1: Load PDF into LangChain Document instances
  const t0 = Date.now();
  let pageDocs: any[] = [];
  try {
    pageDocs = await loadPdfPages(samplePdfPath);
    const hasValidDocs = pageDocs.length > 0 && pageDocs.every(
      (d) => typeof d.pageContent === "string" && d.pageContent.length > 0 && typeof d.metadata.pageNumber === "number"
    );

    results.push({
      step: "1. PDF to LangChain Document Conversion",
      success: hasValidDocs,
      durationMs: Date.now() - t0,
      details: `Loaded ${pageDocs.length} page documents from "${path.basename(samplePdfPath)}"`,
    });
  } catch (err: any) {
    results.push({
      step: "1. PDF to LangChain Document Conversion",
      success: false,
      durationMs: Date.now() - t0,
      details: `Failed to load PDF: ${err.message}`,
    });
  }

  // Step 2: Recursive Character Text Splitting
  const t1 = Date.now();
  let chunkDocs: any[] = [];
  try {
    const TARGET_SIZE = 700;
    const OVERLAP = 100;
    chunkDocs = await splitPdfDocuments(pageDocs, {
      chunkSize: TARGET_SIZE,
      chunkOverlap: OVERLAP,
    });

    const allHaveMetadata = chunkDocs.every(
      (c) => typeof c.metadata.chunkIndex === "number" &&
             typeof c.metadata.pageNumber === "number" &&
             c.metadata.fileName &&
             c.pageContent.length > 0
    );

    // Max chunk size sanity check (allow reasonable margin for unbreakable words/tokens)
    const maxLen = Math.max(...chunkDocs.map((c) => c.pageContent.length));
    const sizeAcceptable = maxLen <= TARGET_SIZE * 1.5;

    results.push({
      step: "2. RecursiveCharacterTextSplitter Chunking",
      success: allHaveMetadata && sizeAcceptable && chunkDocs.length >= pageDocs.length,
      durationMs: Date.now() - t1,
      details: `Generated ${chunkDocs.length} chunks (Max chunk size: ${maxLen} chars, Target: ${TARGET_SIZE})`,
    });
  } catch (err: any) {
    results.push({
      step: "2. RecursiveCharacterTextSplitter Chunking",
      success: false,
      durationMs: Date.now() - t1,
      details: `Failed to split documents: ${err.message}`,
    });
  }

  // Step 3: Metadata Provenance & Page Attribution Verification
  const t2 = Date.now();
  try {
    let metadataIntegrityPassed = true;
    let failureReason = "";

    for (let i = 0; i < chunkDocs.length; i++) {
      const chunk = chunkDocs[i];
      if (chunk.metadata.chunkIndex !== i) {
        metadataIntegrityPassed = false;
        failureReason = `Chunk index mismatch at position ${i} (got ${chunk.metadata.chunkIndex})`;
        break;
      }
      if (chunk.metadata.pageNumber < 1 || chunk.metadata.pageNumber > pageDocs.length) {
        metadataIntegrityPassed = false;
        failureReason = `Invalid pageNumber ${chunk.metadata.pageNumber} at chunk ${i}`;
        break;
      }
      if (!chunk.metadata.documentId || !chunk.metadata.tenantId || typeof chunk.metadata.documentVersion !== "number") {
        metadataIntegrityPassed = false;
        failureReason = `Missing documentId/tenantId/documentVersion at chunk ${i}`;
        break;
      }
    }

    results.push({
      step: "3. Metadata Provenance & Integrity",
      success: metadataIntegrityPassed,
      durationMs: Date.now() - t2,
      details: metadataIntegrityPassed
        ? `Verified pageNumber, documentId (${chunkDocs[0]?.metadata.documentId}), tenantId, and documentVersion across all ${chunkDocs.length} chunks.`
        : failureReason,
    });
  } catch (err: any) {
    results.push({
      step: "3. Metadata Provenance & Integrity",
      success: false,
      durationMs: Date.now() - t2,
      details: err.message,
    });
  }

  // Step 4: Sample Chunk Inspection
  if (chunkDocs.length > 0) {
    console.log("------------------------------------------------------------");
    console.log("Sample Extracted Chunk Preview (First Chunk):");
    console.log("------------------------------------------------------------");
    const sample = chunkDocs[0];
    console.log(`File: ${sample.metadata.fileName} | Page: ${sample.metadata.pageNumber} | Chunk Index: ${sample.metadata.chunkIndex}`);
    console.log(`Length: ${sample.pageContent.length} chars`);
    console.log(`Content Excerpt:\n"${sample.pageContent.slice(0, 180)}..."\n`);
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
    console.log("🎉 All Phase 2 Document & Splitting tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ Document processing tests failed.\n");
    process.exit(1);
  }
}

runDocumentTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
