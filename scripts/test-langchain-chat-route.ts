/**
 * scripts/test-langchain-chat-route.ts
 * End-to-End Verification Test for the new dedicated /api/langchain/chat endpoint.
 */

async function testLangChainChatRoute() {
  console.log("============================================================");
  console.log("  Testing Dedicated LangChain Route (/api/langchain/chat)   ");
  console.log("============================================================\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Banter Query
  console.log("[Test 1] Testing Banter Query via /api/langchain/chat...");
  try {
    const res = await fetch(`${baseUrl}/api/langchain/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hey, what's up?" }],
        userId: "test-user-langchain",
        sessionId: "test-session-lc-1",
      }),
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category}`);
    console.log(`Engine: ${data.engine}`);
    console.log(`Roast: "${data.roast}"`);
    console.log(`Grounded: ${data.isDocumentSupported}\n`);

    if (res.status === 200 && data.engine === "langchain" && data.intent === "banter") {
      console.log("✅ Test 1 PASSED: Banter routed cleanly through LangChain.\n");
    } else {
      console.error("❌ Test 1 FAILED unexpected response format.", data);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ Error reaching server (is dev server running?):", err.message);
    process.exit(1);
  }

  // Test 2: General Knowledge Query
  console.log("[Test 2] Testing General Knowledge via /api/langchain/chat...");
  try {
    const res = await fetch(`${baseUrl}/api/langchain/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Explain React 19 server components in one sentence." }],
        userId: "test-user-langchain",
        sessionId: "test-session-lc-1",
      }),
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category}`);
    console.log(`Engine: ${data.engine}`);
    console.log(`Roast: "${data.roast}"\n`);

    if (res.status === 200 && data.engine === "langchain") {
      console.log("✅ Test 2 PASSED: General knowledge answered cleanly via LangChain.\n");
    } else {
      console.error("❌ Test 2 FAILED.", data);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ Error in Test 2:", err.message);
    process.exit(1);
  }

  // Test 3: The exact user query on real uploaded PDF session
  console.log("[Test 3] Testing: 'whats the main point of the whole pdf' on session roast_1791953053410_q5dm2lu...");
  try {
    const res = await fetch(`${baseUrl}/api/langchain/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "whats the main point of the whole pdf" }],
        userId: "test-user-langchain",
        sessionId: "roast_1791953053410_q5dm2lu",
      }),
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Title: ${data.title}`);
    console.log(`Intent: ${data.intent}`);
    console.log(`Category: ${data.category}`);
    console.log(`Engine: ${data.engine}`);
    console.log(`Retrieved Count: ${data.retrievedCount}`);
    console.log(`Grounded: ${data.isDocumentSupported}`);
    console.log(`Citations: ${data.citations?.length || 0}`);
    console.log(`Answer / Suggestion: "${data.suggestion?.slice(0, 180)}..."\n`);

    if (
      res.status === 200 &&
      data.engine === "langchain" &&
      data.intent === "document_rag" &&
      data.retrievedCount > 0
    ) {
      console.log("✅ Test 3 PASSED: 'whats the main point of the whole pdf' correctly routed to document_rag with retrieved chunks and citations!\n");
    } else {
      console.error("❌ Test 3 FAILED.", data);
      process.exit(1);
    }
  } catch (err: any) {
    console.error("❌ Error in Test 3:", err.message);
    process.exit(1);
  }

  console.log("============================================================");
  console.log("🎉 All /api/langchain/chat endpoint tests PASSED!");
  console.log("============================================================\n");
}

testLangChainChatRoute();
