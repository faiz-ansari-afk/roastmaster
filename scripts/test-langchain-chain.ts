/**
 * scripts/test-langchain-chain.ts
 * Standalone verification script for Multi-Route Intent Routing in LCEL.
 * 
 * Tests the user's real-world matrix:
 * 1. "Hey, how are you?" -> BANTER (0 DB queries, 0 citations)
 * 2. "Explain ReactJS." -> GENERAL_KNOWLEDGE (0 DB queries, answered from LLM knowledge)
 * 3. "Explain this code." (no code attached) -> CLARIFICATION (asks user to paste code)
 * 4. "Give me the ingredients for biryani." -> GENERAL_KNOWLEDGE (0 DB queries)
 * 5. "What does my PDF say about the tech stack of RoastMaster?" -> DOCUMENT_RAG (pgvector search, citations attached)
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

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function runMultiRouteTests() {
  console.log("============================================================");
  console.log("   RoastMaster AI — Multi-Route LCEL Chain Test Harness     ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const TENANT_ID = "tenant-vip-club-42";

  // Step 1: Assembly
  const t0 = Date.now();
  let pipeline: any;
  try {
    pipeline = await createRagChain({
      k: 3,
      tenantId: TENANT_ID,
      temperature: 0.1,
      storeOptions: { collectionName: "col_roastmaster_a" },
    });

    results.push({
      step: "1. Multi-Route LCEL Assembly",
      success: !!pipeline,
      durationMs: Date.now() - t0,
      details: "Assembled 5-route RunnableBranch pipeline.",
    });
  } catch (err: any) {
    results.push({
      step: "1. Multi-Route LCEL Assembly",
      success: false,
      durationMs: Date.now() - t0,
      details: `Assembly failed: ${err.message}`,
    });
  }

  // Route 1 Test: Casual Banter ("Hey, how are you?")
  await delay(600);
  const t1 = Date.now();
  try {
    console.log("[Route 1] Testing Banter: \"Hey, how are you?\"...");
    const res = (await pipeline.invoke({
      question: "Hey, how are you?",
      hasUploadedDocs: true,
    })) as RagResponse;

    const pass =
      res.intent === "banter" &&
      res.retrievedCount === 0 &&
      res.citations.length === 0;

    results.push({
      step: "2. Banter Route (\"Hey, how are you?\")",
      success: pass,
      durationMs: Date.now() - t1,
      details: pass
        ? `Intent: "${res.intent}" | Retrieved: ${res.retrievedCount} | Answer: "${res.answer.slice(0, 55)}..."`
        : `Failed: intent=${res.intent}, retrieved=${res.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Banter Route (\"Hey, how are you?\")",
      success: false,
      durationMs: Date.now() - t1,
      details: `Failed: ${err.message}`,
    });
  }

  // Route 2 Test: General Knowledge ("Explain ReactJS.")
  await delay(600);
  const t2 = Date.now();
  try {
    console.log("[Route 2] Testing General Tech: \"Explain ReactJS.\" (with hasUploadedDocs=true)...");
    const res = (await pipeline.invoke({
      question: "Explain ReactJS.",
      hasUploadedDocs: true, // User has uploaded a PDF, but this is a general question!
    })) as RagResponse;

    const pass =
      res.intent === "general_knowledge" &&
      res.retrievedCount === 0 &&
      res.citations.length === 0 &&
      /component|UI|library|state|virtual DOM/i.test(res.answer);

    results.push({
      step: "3. General Knowledge Route (\"Explain ReactJS.\")",
      success: pass,
      durationMs: Date.now() - t2,
      details: pass
        ? `Intent: "${res.intent}" | Zero PDF queries | Answered from LLM knowledge without false citations.`
        : `Failed: intent=${res.intent}, retrieved=${res.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "3. General Knowledge Route (\"Explain ReactJS.\")",
      success: false,
      durationMs: Date.now() - t2,
      details: `Failed: ${err.message}`,
    });
  }

  // Route 3 Test: Clarification Needed ("Explain this code." without code)
  await delay(600);
  const t3 = Date.now();
  try {
    console.log("[Route 3] Testing Missing Code: \"Explain this code.\" (no code attached)...");
    const res = (await pipeline.invoke({
      question: "Explain this code.",
      hasUploadedDocs: true,
      codeSnippet: undefined,
    })) as RagResponse;

    const pass =
      res.intent === "clarification" &&
      res.retrievedCount === 0 &&
      res.citations.length === 0 &&
      /paste|where|code|provide|missing/i.test(res.answer);

    results.push({
      step: "4. Clarification Route (\"Explain this code.\" - missing code)",
      success: pass,
      durationMs: Date.now() - t3,
      details: pass
        ? `Intent: "${res.intent}" | Zero PDF queries | Answer: "${res.answer.slice(0, 65)}..."`
        : `Failed: intent=${res.intent}, retrieved=${res.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "4. Clarification Route (\"Explain this code.\" - missing code)",
      success: false,
      durationMs: Date.now() - t3,
      details: `Failed: ${err.message}`,
    });
  }

  // Route 4 Test: General Knowledge ("Give me the ingredients for biryani.")
  await delay(600);
  const t4 = Date.now();
  try {
    console.log("[Route 4] Testing Cooking Recipe: \"Give me the ingredients for biryani.\"...");
    const res = (await pipeline.invoke({
      question: "Give me the ingredients for biryani.",
      hasUploadedDocs: true,
    })) as RagResponse;

    const pass =
      res.intent === "general_knowledge" &&
      res.retrievedCount === 0 &&
      res.citations.length === 0 &&
      /rice|spice|chicken|mutton|masala|onion/i.test(res.answer);

    results.push({
      step: "5. General Knowledge Recipe (\"Give me the ingredients for biryani.\")",
      success: pass,
      durationMs: Date.now() - t4,
      details: pass
        ? `Intent: "${res.intent}" | Zero PDF queries | Recipe provided from LLM knowledge without complaining about missing PDF.`
        : `Failed: intent=${res.intent}, retrieved=${res.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "5. General Knowledge Recipe (\"Give me the ingredients for biryani.\")",
      success: false,
      durationMs: Date.now() - t4,
      details: `Failed: ${err.message}`,
    });
  }

  // Route 5 Test: Document RAG ("What does my PDF say about the core tech stack...?")
  await delay(600);
  const t5 = Date.now();
  try {
    console.log("[Route 5] Testing Document RAG: \"What does my PDF say about the core tech stack and architecture of RoastMaster AI?\"...");
    const res = (await pipeline.invoke({
      question: "What does my PDF say about the core tech stack and architecture of RoastMaster AI?",
      hasUploadedDocs: true,
    })) as RagResponse;

    const pass =
      res.intent === "document_rag" &&
      res.retrievedCount > 0 &&
      res.citations.length > 0 &&
      res.grounded &&
      /Gemini|pgvector|PostgreSQL|Next\.js/i.test(res.answer);

    results.push({
      step: "6. Document RAG Route (\"What does my PDF say about the tech stack...?\")",
      success: pass,
      durationMs: Date.now() - t5,
      details: pass
        ? `Intent: "${res.intent}" | Retrieved ${res.retrievedCount} chunks from pgvector with ${res.citations.length} verified citations from Page ${res.citations[0]?.pageNumber}.`
        : `Failed: intent=${res.intent}, retrieved=${res.retrievedCount}`,
    });
  } catch (err: any) {
    results.push({
      step: "6. Document RAG Route (\"What does my PDF say about the tech stack...?\")",
      success: false,
      durationMs: Date.now() - t5,
      details: `Failed: ${err.message}`,
    });
  }

  // Print Summary Table
  console.log("\n------------------------------------------------------------");
  console.log("Multi-Route Intent Router Test Results Summary:");
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
    console.log("🎉 All 5 Multi-Route Intent tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("⚠️ One or more routing tests failed.\n");
    process.exit(1);
  }
}

runMultiRouteTests().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
