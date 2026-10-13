/**
 * scripts/test-langchain-chain.ts
 * Standalone verification script for Phase 4: Declarative LCEL RAG Chain with Query Routing.
 * 
 * Verifies:
 * 1. Building the LCEL Runnable pipeline with RunnableBranch routing
 * 2. Answering a document question with exact citations (intent: "document_rag")
 * 3. Answering conversational banter/greetings with zero DB queries and zero false citations (intent: "banter")
 * 4. Refusal / Hallucination resistance test (asking an out-of-domain question)
 * 5. Tenant isolation enforcement within the LCEL chain
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

  // Step 1: Initialize the LCEL RAG Chain with Routing
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
      step: "1. LCEL RunnableBranch Pipeline Assembly",
      success: !!ragChain && typeof ragChain.invoke === "function",
      durationMs: Date.now() - t0,
      details: "Constructed RunnableBranch routing between Banter Branch and Document RAG Branch.",
    });
  } catch (err: any) {
    results.push({
      step: "1. LCEL RunnableBranch Pipeline Assembly",
      success: false,
      durationMs: Date.now() - t0,
      details: `Assembly failed: ${err.message}`,
    });
  }

  // Step 2: Grounded Document Question Answering with Citations
  const t1 = Date.now();
  const docQuestion = "What is the core tech stack and architecture of RoastMaster AI?";
  let groundedResponse: RagResponse | null = null;

  try {
    console.log(`[Test 2] Executing Document RAG Branch for: "${docQuestion}"...`);
    groundedResponse = (await ragChain.invoke({
      question: docQuestion,
    })) as RagResponse;

    const isSuccess =
      groundedResponse.intent === "document_rag" &&
      groundedResponse.retrievedCount > 0 &&
      groundedResponse.citations.length > 0 &&
      groundedResponse.grounded &&
      /Gemini|pgvector|PostgreSQL|Next\.js|React/i.test(groundedResponse.answer);

    results.push({
      step: "2. Grounded Q&A with Exact Citations",
      success: isSuccess,
      durationMs: Date.now() - t1,
      details: `Intent: "${groundedResponse.intent}" | Retrieved ${groundedResponse.retrievedCount} chunks with ${groundedResponse.citations.length} citations.`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Grounded Q&A with Exact Citations",
      success: false,
      durationMs: Date.now() - t1,
      details: `Execution failed: ${err.message}`,
    });
  }

  // Grace delay to protect free tier rate limits
  await new Promise((res) => setTimeout(res, 600));

  // Step 3: Banter / Greeting Query Routing (Zero DB Overhead)
  const t2 = Date.now();
  const banterQuestion = "Yo RoastMaster, what's up bro? Roast me!";
  let banterResponse: RagResponse | null = null;

  try {
    console.log(`[Test 3] Executing Banter Routing Branch for: "${banterQuestion}"...`);
    banterResponse = (await ragChain.invoke({
      question: banterQuestion,
    })) as RagResponse;

    const isBanterSuccess =
      banterResponse.intent === "banter" &&
      banterResponse.retrievedCount === 0 &&
      banterResponse.citations.length === 0 &&
      !banterResponse.grounded &&
      banterResponse.answer.length > 10;

    results.push({
      step: "3. Banter Routing (Zero Vector Queries & Zero Citations)",
      success: isBanterSuccess,
      durationMs: Date.now() - t2,
      details: isBanterSuccess
        ? `Routed to Banter Branch! Retrieved 0 chunks, attached 0 false citations. Comedy Answer: "${banterResponse.answer.slice(0, 60)}..."`
        : `Banter routing failed: intent=${banterResponse.intent}, retrievedCount=${banterResponse.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "3. Banter Routing (Zero Vector Queries & Zero Citations)",
      success: false,
      durationMs: Date.now() - t2,
      details: `Execution failed: ${err.message}`,
    });
  }

  // Step 4: Refusal / Hallucination Defense Test
  const t3 = Date.now();
  const irrelevantQuestion = "What is the airspeed velocity of an unladen swallow carrying a coconut?";
  let refusalResponse: RagResponse | null = null;

  try {
    console.log(`[Test 4] Testing Hallucination Defense for: "${irrelevantQuestion}"...`);
    refusalResponse = (await ragChain.invoke({
      question: irrelevantQuestion,
    })) as RagResponse;

    const didRefuse =
      /cannot find|not found|no information|does not contain|not mentioned/i.test(
        refusalResponse.answer
      );

    const citationsEmpty = refusalResponse.citations.length === 0;

    results.push({
      step: "4. Hallucination Defense & Refusal Protocol",
      success: didRefuse && citationsEmpty && !refusalResponse.grounded,
      durationMs: Date.now() - t3,
      details: `Refused correctly without hallucinations: "${refusalResponse.answer.slice(0, 65)}..." (Citations: ${refusalResponse.citations.length})`,
    });
  } catch (err: any) {
    results.push({
      step: "4. Hallucination Defense & Refusal Protocol",
      success: false,
      durationMs: Date.now() - t3,
      details: `Refusal test failed: ${err.message}`,
    });
  }

  // Step 5: Cross-Tenant Isolation in LCEL Chain
  const t4 = Date.now();
  try {
    const unauthorizedChain = await createRagChain({
      k: 3,
      tenantId: "tenant-unauthorized-stranger",
      temperature: 0.1,
      storeOptions: { collectionName: "col_roastmaster_a" },
    });

    const crossTenantResponse = (await unauthorizedChain.invoke({
      question: docQuestion,
    })) as RagResponse;

    const correctlyDenied =
      crossTenantResponse.retrievedCount === 0 &&
      crossTenantResponse.citations.length === 0;

    results.push({
      step: "5. Cross-Tenant Isolation in LCEL",
      success: correctlyDenied,
      durationMs: Date.now() - t4,
      details: correctlyDenied
        ? "Unauthorized tenant chain retrieved 0 chunks and returned 0 citations."
        : "Cross-tenant leak detected!",
    });
  } catch (err: any) {
    results.push({
      step: "5. Cross-Tenant Isolation in LCEL",
      success: false,
      durationMs: Date.now() - t4,
      details: `Failed: ${err.message}`,
    });
  }

  // Print Summary Table
  console.log("\n------------------------------------------------------------");
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
    console.log("🎉 All LCEL RAG Chain + Banter Routing tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more tests failed.\n");
    process.exit(1);
  }
}

runChainTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
