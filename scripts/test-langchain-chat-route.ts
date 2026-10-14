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

  console.log("============================================================");
  console.log("🎉 All /api/langchain/chat endpoint tests PASSED!");
  console.log("============================================================\n");
}

testLangChainChatRoute();
