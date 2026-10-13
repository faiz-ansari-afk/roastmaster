/**
 * scripts/test-langchain-chain.ts
 * Standalone verification script for Phase 4: Declarative LCEL RAG Chain & Citations.
 * 
 * Verifies:
 * 1. Building the LCEL Runnable pipeline (Retriever -> Prompt -> Gemini -> OutputParser)
 * 2. Answering a document question with exact citations and page attribution
 * 3. Refusal / Hallucination resistance test (asking an out-of-domain question)
 * 4. Tenant isolation enforcement within the LCEL chain
 * 
 * Run with: npm run test:langchain:chain
 */
import { createRagChain, RagResponse } from "@/lib/langchain/rag-chain";

interface TestStepResult {
  step: string;
  success: boolean;
  durationMs: number;
  details: string;
}

async function runChainTests() {
  console.log("============================================================");
  console.log("   RoastMaster AI — LangChain LCEL RAG Chain Test Harness   ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const TENANT_ID = "tenant-vip-club-42";

  // Step 1: Initialize the LCEL RAG Chain
  const t0 = Date.now();
  let ragChain: any;
  try {
    ragChain = await createRagChain({
      k: 3,
      tenantId: TENANT_ID,
      temperature: 0.1,
      storeOptions: { collectionName: "col_roastmaster_a" },
    });

    results.push({
      step: "1. LCEL Pipeline Assembly",
      success: !!ragChain && typeof ragChain.invoke === "function",
      durationMs: Date.now() - t0,
      details: "Constructed RunnableSequence with retriever, ChatPromptTemplate, Gemini, and citations mapper.",
    });
  } catch (err: any) {
    results.push({
      step: "1. LCEL Pipeline Assembly",
      success: false,
      durationMs: Date.now() - t0,
      details: `Assembly failed: ${err.message}`,
    });
  }

  // Step 2: Grounded Document Question Answering with Citations
  const t1 = Date.now();
  const testQuestion = "What is the core tech stack and architecture of RoastMaster AI?";
  let groundedResponse: RagResponse | null = null;

  try {
    console.log(`Executing LCEL Chain for Question: "${testQuestion}"...`);
    groundedResponse = (await ragChain.invoke({
      question: testQuestion,
    })) as RagResponse;

    const hasAnswer =
      typeof groundedResponse.answer === "string" &&
      groundedResponse.answer.length > 30;

    const hasKeywords =
      /Gemini|pgvector|PostgreSQL|Next\.js|React/i.test(groundedResponse.answer);

    const hasCitations =
      groundedResponse.citations.length > 0 &&
      groundedResponse.citations.every(
        (c) => typeof c.pageNumber === "number" && c.fileName && c.documentId
      );

    const isSuccess = hasAnswer && hasKeywords && hasCitations && groundedResponse.grounded;

    results.push({
      step: "2. Grounded Q&A with Exact Citations",
      success: isSuccess,
      durationMs: Date.now() - t1,
      details: `Retrieved ${groundedResponse.retrievedCount} chunks. Answered in ${Date.now() - t1}ms with ${groundedResponse.citations.length} verified citations.`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Grounded Q&A with Exact Citations",
      success: false,
      durationMs: Date.now() - t1,
      details: `Execution failed: ${err.message}`,
    });
  }

  // Step 3: Refusal / Hallucination Defense Test
  const t2 = Date.now();
  const irrelevantQuestion = "What is the airspeed velocity of an unladen swallow carrying a coconut?";
  let refusalResponse: RagResponse | null = null;

  try {
    console.log(`Testing Hallucination Defense for: "${irrelevantQuestion}"...`);
    refusalResponse = (await ragChain.invoke({
      question: irrelevantQuestion,
    })) as RagResponse;

    const didRefuse =
      /cannot find|not found|no information|does not contain|not mentioned/i.test(
        refusalResponse.answer
      );

    const citationsEmpty = refusalResponse.citations.length === 0;

    results.push({
      step: "3. Hallucination Defense & Refusal Protocol",
      success: didRefuse && citationsEmpty && !refusalResponse.grounded,
      durationMs: Date.now() - t2,
      details: `LLM refused correctly without hallucinations: "${refusalResponse.answer.slice(0, 70)}..." (Citations: ${refusalResponse.citations.length})`,
    });
  } catch (err: any) {
    results.push({
      step: "3. Hallucination Defense & Refusal Protocol",
      success: false,
      durationMs: Date.now() - t2,
      details: `Refusal test failed: ${err.message}`,
    });
  }

  // Step 4: Cross-Tenant Isolation in LCEL Chain
  const t3 = Date.now();
  try {
    const unauthorizedChain = await createRagChain({
      k: 3,
      tenantId: "tenant-unauthorized-stranger",
      temperature: 0.1,
      storeOptions: { collectionName: "col_roastmaster_a" },
    });

    const crossTenantResponse = (await unauthorizedChain.invoke({
      question: testQuestion,
    })) as RagResponse;

    const correctlyDenied =
      crossTenantResponse.retrievedCount === 0 &&
      crossTenantResponse.citations.length === 0;

    results.push({
      step: "4. Cross-Tenant Isolation in LCEL",
      success: correctlyDenied,
      durationMs: Date.now() - t3,
      details: correctlyDenied
        ? "Unauthorized tenant chain retrieved 0 chunks and returned 0 citations."
        : "Cross-tenant leak detected!",
    });
  } catch (err: any) {
    results.push({
      step: "4. Cross-Tenant Isolation in LCEL",
      success: false,
      durationMs: Date.now() - t3,
      details: `Failed: ${err.message}`,
    });
  }

  // Print Grounded Q&A Preview
  if (groundedResponse) {
    console.log("\n------------------------------------------------------------");
    console.log("LCEL Grounded Response Output Preview:");
    console.log("------------------------------------------------------------");
    console.log(`Answer:\n"${groundedResponse.answer}"\n`);
    console.log(`Citations (${groundedResponse.citations.length}):`);
    groundedResponse.citations.forEach((c, idx) => {
      console.log(`  [Citation ${idx + 1}] Source: ${c.fileName} (Page ${c.pageNumber}, Doc ID: ${c.documentId})`);
      console.log(`  Excerpt: "${c.excerpt}..."`);
    });
    console.log("------------------------------------------------------------\n");
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
    console.log("🎉 All Phase 4 LCEL RAG Chain tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more LCEL tests failed.\n");
    process.exit(1);
  }
}

runChainTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
