/**
 * scripts/test-langchain-upload-route.ts
 * Verification script for dedicated LangChain PDF upload and document management route.
 * 
 * Verifies:
 * 1. POST /api/langchain/rag/upload processes and indexes PDF into langchain_pdf_vectors.
 * 2. GET /api/langchain/rag/upload lists indexed session documents.
 * 3. Isolation: Manual RAG table (document_chunks) remains completely untouched!
 * 4. DELETE /api/langchain/rag/upload cleans up session chunks.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { POST, GET, DELETE } from "../src/app/api/langchain/rag/upload/route";
import { getSessionDocuments } from "../src/lib/db";

async function testUploadRoute() {
  console.log("============================================================");
  console.log("   Testing Dedicated LangChain PDF Upload & Isolation Route  ");
  console.log("============================================================\n");

  const testSessionId = `test_lc_upload_${Date.now()}`;
  const pdfPath = path.resolve(process.cwd(), "RoastMaster_AI_Interview_Preparation_Guide.pdf");

  console.log(`[Setup] Reading test PDF: ${path.basename(pdfPath)}`);
  const fileBuffer = await fs.readFile(pdfPath);
  const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });

  // ── Step 1: POST /api/langchain/rag/upload ─────────────────────────────────
  console.log(`\n[Step 1] Ingesting PDF via POST /api/langchain/rag/upload for session: ${testSessionId}...`);
  const formData = new FormData();
  formData.append("file", fileBlob, "RoastMaster_AI_Interview_Preparation_Guide.pdf");
  formData.append("sessionId", testSessionId);
  formData.append("userId", "test-mentor-user");

  const postReq = new Request("http://localhost:3000/api/langchain/rag/upload", {
    method: "POST",
    body: formData,
  });

  const postRes = await POST(postReq);
  const postData = await postRes.json();

  console.log(`Status: ${postRes.status}`);
  console.log("Response:", JSON.stringify(postData, null, 2));

  if (postRes.status !== 200 || !postData.success || postData.engine !== "langchain" || postData.totalChunks <= 0) {
    console.error("❌ Step 1 FAILED: Could not upload and index PDF into LangChain vector store.");
    process.exit(1);
  }
  console.log(`✅ Step 1 PASSED: Successfully indexed ${postData.totalChunks} chunks across ${postData.totalPages} pages into langchain_pdf_vectors.`);

  // ── Step 2: GET /api/langchain/rag/upload?sessionId=... ────────────────────
  console.log(`\n[Step 2] Fetching indexed documents via GET /api/langchain/rag/upload...`);
  const getReq = new Request(`http://localhost:3000/api/langchain/rag/upload?sessionId=${testSessionId}`);
  const getRes = await GET(getReq);
  const getData = await getRes.json();

  console.log(`Status: ${getRes.status}`);
  console.log("Documents:", JSON.stringify(getData.documents, null, 2));

  const foundDoc = getData.documents?.find((d: any) => d.fileName === "RoastMaster_AI_Interview_Preparation_Guide.pdf");
  if (!foundDoc || foundDoc.totalChunks !== postData.totalChunks) {
    console.error("❌ Step 2 FAILED: Indexed document not found in LangChain session query.");
    process.exit(1);
  }
  console.log(`✅ Step 2 PASSED: LangChain document listing returned ${getData.documents.length} document with ${foundDoc.totalChunks} chunks.`);

  // ── Step 3: Isolation Verification (Manual DB Must Have ZERO Chunks) ───────
  console.log(`\n[Step 3] Verifying Complete Pipeline Isolation (Manual document_chunks table)...`);
  const manualDocs = await getSessionDocuments(testSessionId);
  console.log(`Manual document_chunks count for session ${testSessionId}: ${manualDocs.length}`);

  if (manualDocs.length !== 0) {
    console.error("❌ Step 3 FAILED: Isolation leak! LangChain upload wrote into manual document_chunks table.");
    process.exit(1);
  }
  console.log("✅ Step 3 PASSED: Total isolation verified! Manual table has 0 chunks for this LangChain session.");

  // ── Step 4: DELETE /api/langchain/rag/upload?sessionId=... ────────────────
  console.log(`\n[Step 4] Cleaning up session documents via DELETE /api/langchain/rag/upload...`);
  const delReq = new Request(`http://localhost:3000/api/langchain/rag/upload?sessionId=${testSessionId}`, {
    method: "DELETE",
  });
  const delRes = await DELETE(delReq);
  const delData = await delRes.json();

  console.log(`Delete Status: ${delRes.status}`);

  const postDeleteReq = new Request(`http://localhost:3000/api/langchain/rag/upload?sessionId=${testSessionId}`);
  const postDeleteRes = await GET(postDeleteReq);
  const postDeleteData = await postDeleteRes.json();

  if (postDeleteData.documents?.length !== 0) {
    console.error("❌ Step 4 FAILED: Document deletion failed.");
    process.exit(1);
  }
  console.log("✅ Step 4 PASSED: LangChain session documents successfully shredded and cleaned up.");

  console.log("\n============================================================");
  console.log("🎉 All Dedicated LangChain Upload & Isolation Tests PASSED!");
  console.log("============================================================\n");
}

testUploadRoute().catch((err) => {
  console.error("Unhandled test failure:", err);
  process.exit(1);
});
