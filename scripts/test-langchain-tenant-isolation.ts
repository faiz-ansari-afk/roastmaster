/**
 * scripts/test-langchain-tenant-isolation.ts
 * Rigorous Multi-Tenant Isolation & "Fail-Closed" Security Test Suite.
 *
 * Verifies:
 * 1. Ingestion guard: Reject un-tenanted documents at ingestion time.
 * 2. Multi-tenant partitioning: Tenant A and Tenant B data isolated in same table.
 * 3. Cross-Tenant query immunity: Tenant B cannot retrieve Tenant A's secrets.
 * 4. Reverse cross-tenant immunity: Tenant A cannot retrieve Tenant B's financials.
 * 5. Fail-Closed retrieval: Missing or empty tenantId throws TenantIsolationError.
 */
import { Document } from "@langchain/core/documents";
import {
  ingestDocumentsToVectorStore,
  searchSimilarDocuments,
  TenantIsolationError,
  VectorStoreOptions,
} from "../src/lib/langchain/vectorstore";
import { DocumentMetadata } from "../src/lib/langchain/document-loader";

interface TestStepResult {
  step: string;
  success: boolean;
  durationMs: number;
  details: string;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function runTenantIsolationTests() {
  console.log("============================================================");
  console.log("   RoastMaster AI — Multi-Tenant Isolation Test Harness     ");
  console.log("============================================================\n");

  const results: TestStepResult[] = [];
  const testStoreOpts: VectorStoreOptions = {
    tableName: "langchain_pdf_vectors_tenant_test",
    collectionTableName: "langchain_pdf_collections_tenant_test",
    collectionName: "tenant_security_audit",
  };

  const TENANT_APOLLO = "tenant-apollo-101";
  const TENANT_ZEUS = "tenant-zeus-202";

  // -------------------------------------------------------------
  // Test 1: Ingestion Guard (Fail-Closed on Missing Tenant ID)
  // -------------------------------------------------------------
  const t1 = Date.now();
  try {
    const unauthenticatedDoc = new Document<DocumentMetadata>({
      pageContent: "Orphan chunk without tenant ownership.",
      metadata: {
        source: "untenanted.pdf",
        fileName: "untenanted.pdf",
        pageNumber: 1,
        totalPages: 1,
        chunkIndex: 0,
        charCount: 38,
        documentId: "doc-orphan-000",
        tenantId: "" as any, // Deliberately missing/empty
        documentVersion: 1,
      },
    });

    let threwExpected = false;
    try {
      await ingestDocumentsToVectorStore([unauthenticatedDoc], {}, testStoreOpts);
    } catch (err: any) {
      if (err instanceof TenantIsolationError || err.name === "TenantIsolationError") {
        threwExpected = true;
      } else {
        throw err;
      }
    }

    if (!threwExpected) {
      throw new Error("Ingestion accepted an un-tenanted document instead of failing closed!");
    }

    results.push({
      step: "1. Ingestion Fail-Closed Guard",
      success: true,
      durationMs: Date.now() - t1,
      details: "Correctly rejected document with missing tenantId before writing to database.",
    });
  } catch (err: any) {
    results.push({
      step: "1. Ingestion Fail-Closed Guard",
      success: false,
      durationMs: Date.now() - t1,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 2: Ingest Distinct Multi-Tenant Datasets
  // -------------------------------------------------------------
  const t2 = Date.now();
  try {
    const apolloDocs = [
      new Document<DocumentMetadata>({
        pageContent:
          "Project Apollo Confidential: The master override credentials for the quantum core are APOLLO-OMEGA-9921. Never disclose to outside tenants.",
        metadata: {
          source: "apollo_secrets.pdf",
          fileName: "apollo_secrets.pdf",
          pageNumber: 1,
          totalPages: 1,
          chunkIndex: 0,
          charCount: 145,
          documentId: "doc-apollo-secrets-1",
          tenantId: TENANT_APOLLO,
          documentVersion: 1,
        },
      }),
    ];

    const zeusDocs = [
      new Document<DocumentMetadata>({
        pageContent:
          "Project Zeus Financial Audit: Total Q3 offshore liquid reserves stand at exactly $42,000,000 USD secured in Zurich Vault 7.",
        metadata: {
          source: "zeus_financials.pdf",
          fileName: "zeus_financials.pdf",
          pageNumber: 1,
          totalPages: 1,
          chunkIndex: 0,
          charCount: 122,
          documentId: "doc-zeus-financials-1",
          tenantId: TENANT_ZEUS,
          documentVersion: 1,
        },
      }),
    ];

    await ingestDocumentsToVectorStore(apolloDocs, { logProgress: false }, testStoreOpts);
    await delay(300);
    await ingestDocumentsToVectorStore(zeusDocs, { logProgress: false }, testStoreOpts);

    results.push({
      step: "2. Multi-Tenant Dual Ingestion",
      success: true,
      durationMs: Date.now() - t2,
      details: `Indexed Apollo docs (${TENANT_APOLLO}) and Zeus docs (${TENANT_ZEUS}) in shared table.`,
    });
  } catch (err: any) {
    results.push({
      step: "2. Multi-Tenant Dual Ingestion",
      success: false,
      durationMs: Date.now() - t2,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 3: Authorized Tenant Retrieval (Apollo queries Apollo)
  // -------------------------------------------------------------
  const t3 = Date.now();
  try {
    const searchRes = await searchSimilarDocuments(
      "What are the master override credentials for Apollo?",
      { k: 4, tenantId: TENANT_APOLLO },
      testStoreOpts
    );

    const match = searchRes.find((r) =>
      r.document.pageContent.includes("APOLLO-OMEGA-9921")
    );
    const hasZeusLeak = searchRes.some(
      (r) => r.document.metadata.tenantId !== TENANT_APOLLO
    );

    if (!match || hasZeusLeak) {
      throw new Error(
        `Authorized search failed: match=${!!match}, crossTenantLeak=${hasZeusLeak}`
      );
    }

    results.push({
      step: "3. Authorized Tenant-A Retrieval",
      success: true,
      durationMs: Date.now() - t3,
      details: `Tenant Apollo retrieved its own secret (similarity: ${match.similarity}) with zero leaks.`,
    });
  } catch (err: any) {
    results.push({
      step: "3. Authorized Tenant-A Retrieval",
      success: false,
      durationMs: Date.now() - t3,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 4: Cross-Tenant Probe (Zeus attacks Apollo's secret)
  // -------------------------------------------------------------
  const t4 = Date.now();
  try {
    // Tenant Zeus intentionally searches with the exact secret keywords of Apollo
    const crossTenantRes = await searchSimilarDocuments(
      "master override credentials quantum core APOLLO-OMEGA-9921",
      { k: 4, tenantId: TENANT_ZEUS },
      testStoreOpts
    );

    const leakedApolloDoc = crossTenantRes.some(
      (r) => r.document.pageContent.includes("APOLLO-OMEGA-9921")
    );

    if (leakedApolloDoc) {
      throw new Error(
        "CRITICAL LEAK: Tenant Zeus was able to retrieve Tenant Apollo's secret vector!"
      );
    }

    results.push({
      step: "4. Cross-Tenant Attack Probe (Zeus -> Apollo)",
      success: true,
      durationMs: Date.now() - t4,
      details: `Tenant Zeus searched for exact Apollo secret keywords: 0 leaked chunks returned.`,
    });
  } catch (err: any) {
    results.push({
      step: "4. Cross-Tenant Attack Probe (Zeus -> Apollo)",
      success: false,
      durationMs: Date.now() - t4,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 5: Reverse Cross-Tenant Probe (Apollo attacks Zeus's financials)
  // -------------------------------------------------------------
  const t5 = Date.now();
  try {
    const reverseRes = await searchSimilarDocuments(
      "offshore liquid reserves Zurich Vault 7 42000000",
      { k: 4, tenantId: TENANT_APOLLO },
      testStoreOpts
    );

    const leakedZeusDoc = reverseRes.some(
      (r) => r.document.pageContent.includes("42,000,000")
    );

    if (leakedZeusDoc) {
      throw new Error(
        "CRITICAL LEAK: Tenant Apollo was able to retrieve Tenant Zeus's financial records!"
      );
    }

    results.push({
      step: "5. Reverse Cross-Tenant Probe (Apollo -> Zeus)",
      success: true,
      durationMs: Date.now() - t5,
      details: `Tenant Apollo searched for exact Zeus financial figures: 0 leaked chunks returned.`,
    });
  } catch (err: any) {
    results.push({
      step: "5. Reverse Cross-Tenant Probe (Apollo -> Zeus)",
      success: false,
      durationMs: Date.now() - t5,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 6: Fail-Closed Retrieval (Missing tenantId throws error)
  // -------------------------------------------------------------
  const t6 = Date.now();
  try {
    let threwExpected = false;
    try {
      // Call with no tenantId and enforceTenantIsolation defaulting to true
      await searchSimilarDocuments(
        "Show me all documents across all tenants",
        { k: 10 } as any,
        testStoreOpts
      );
    } catch (err: any) {
      if (err instanceof TenantIsolationError || err.name === "TenantIsolationError") {
        threwExpected = true;
      } else {
        throw err;
      }
    }

    if (!threwExpected) {
      throw new Error("Retrieval without tenantId executed rather than failing closed!");
    }

    results.push({
      step: "6. Retrieval Fail-Closed Guard",
      success: true,
      durationMs: Date.now() - t6,
      details: "Attempted unpartitioned retrieval threw TenantIsolationError immediately.",
    });
  } catch (err: any) {
    results.push({
      step: "6. Retrieval Fail-Closed Guard",
      success: false,
      durationMs: Date.now() - t6,
      details: `Failed: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Summary Reporting
  // -------------------------------------------------------------
  console.log("------------------------------------------------------------");
  console.log("Multi-Tenant Isolation Test Results Summary:");
  console.log("------------------------------------------------------------");

  let allPassed = true;
  for (const r of results) {
    const status = r.success ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${status} ${r.step} (${r.durationMs}ms)`);
    console.log(`         ${r.details}`);
    if (!r.success) allPassed = false;
  }

  console.log("------------------------------------------------------------");
  if (allPassed) {
    console.log("🎉 All 6 Multi-Tenant Isolation & Fail-Closed tests PASSED successfully!\n");
    process.exit(0);
  } else {
    console.error("❌ Some tenant isolation tests failed.\n");
    process.exit(1);
  }
}

runTenantIsolationTests().catch((err) => {
  console.error("Fatal error running tenant isolation test harness:", err);
  process.exit(1);
});
