// src/lib/rag_evaluator.js — Automated RAG Evaluation Engine
// Computes Recall@K, MRR (Mean Reciprocal Rank), Precision@K, and Refusal Accuracy
import { retrieveAndRerankChunks } from "./reranker.js";
import { RAG_BENCHMARK_DATASET, DEFAULT_EVAL_SESSION_ID } from "./rag_eval_dataset.js";

/**
 * Checks if a retrieved chunk matches ground truth expected pages or keywords.
 * @param {object} chunk - Retrieved chunk object from retrieveAndRerankChunks.
 * @param {object} testCase - Benchmark test case definition.
 * @returns {boolean}
 */
export function isChunkRelevant(chunk, testCase) {
  if (!chunk || testCase.isOutOfDocument) return false;

  const page = chunk.pageNumber || 1;
  if (Array.isArray(testCase.expectedPages) && testCase.expectedPages.includes(page)) {
    return true;
  }

  const contentLower = (chunk.content || "").toLowerCase();
  if (Array.isArray(testCase.expectedKeywords) && testCase.expectedKeywords.length > 0) {
    const hasKeyword = testCase.expectedKeywords.some((kw) =>
      contentLower.includes(kw.toLowerCase())
    );
    if (hasKeyword) return true;
  }

  return false;
}

/**
 * Evaluates a single test case query against the RAG retrieval pipeline.
 * @param {object} params
 * @param {object} params.testCase
 * @param {string} params.sessionId
 * @param {number} [params.topK=4]
 * @param {number} [params.broadLimit=15]
 * @returns {Promise<object>} Evaluation result for the test case.
 */
export async function evaluateSingleQuery({
  testCase,
  sessionId = DEFAULT_EVAL_SESSION_ID,
  topK = 4,
  broadLimit = 15,
}) {
  const startTime = Date.now();
  let retrievedChunks = [];
  let error = null;

  try {
    retrievedChunks = await retrieveAndRerankChunks({
      sessionId,
      query: testCase.query,
      broadLimit,
      topK,
      minInitialSimilarity: 0.20,
      minRelevanceScore: 0.36,
    });
  } catch (err) {
    error = err.message || String(err);
  }

  const durationMs = Date.now() - startTime;

  // ── Handling Out-of-Document (Negative Grounding / Refusal) Queries ──
  if (testCase.isOutOfDocument) {
    // PASS if retriever returned 0 chunks (safely filtered out noise)
    const passedRefusal = retrievedChunks.length === 0;
    return {
      testId: testCase.id,
      category: testCase.category,
      query: testCase.query,
      description: testCase.description,
      isOutOfDocument: true,
      expectedPages: [],
      retrievedCount: retrievedChunks.length,
      retrievedPages: retrievedChunks.map((c) => c.pageNumber || 1),
      retrievedChunks,
      passed: passedRefusal,
      recallAt1: passedRefusal ? 1.0 : 0.0,
      recallAt3: passedRefusal ? 1.0 : 0.0,
      recallAt5: passedRefusal ? 1.0 : 0.0,
      reciprocalRank: passedRefusal ? 1.0 : 0.0,
      precisionAt3: passedRefusal ? 1.0 : 0.0,
      firstRelevantRank: passedRefusal ? 1 : null,
      durationMs,
      error,
    };
  }

  // ── Handling In-Document Queries ──
  const relevantIndices = [];
  retrievedChunks.forEach((chunk, idx) => {
    if (isChunkRelevant(chunk, testCase)) {
      relevantIndices.push(idx + 1); // 1-based rank
    }
  });

  const firstRank = relevantIndices.length > 0 ? relevantIndices[0] : null;
  const reciprocalRank = firstRank ? 1 / firstRank : 0.0;
  const hit = firstRank !== null;

  const recallAt1 = firstRank === 1 ? 1.0 : 0.0;
  const recallAt3 = firstRank !== null && firstRank <= 3 ? 1.0 : 0.0;
  const recallAt5 = firstRank !== null && firstRank <= 5 ? 1.0 : 0.0;

  const relevantInTop3 = relevantIndices.filter((r) => r <= 3).length;
  const precisionAt3 = Number((relevantInTop3 / Math.min(3, Math.max(1, topK))).toFixed(4));

  return {
    testId: testCase.id,
    category: testCase.category,
    query: testCase.query,
    description: testCase.description,
    isOutOfDocument: false,
    expectedPages: testCase.expectedPages,
    retrievedCount: retrievedChunks.length,
    retrievedPages: retrievedChunks.map((c) => c.pageNumber || 1),
    retrievedChunks,
    relevantRanks: relevantIndices,
    firstRelevantRank: firstRank,
    passed: hit,
    recallAt1,
    recallAt3,
    recallAt5,
    reciprocalRank: Number(reciprocalRank.toFixed(4)),
    precisionAt3,
    durationMs,
    error,
  };
}

/**
 * Runs the full RAG benchmark suite and calculates aggregate metrics.
 * @param {object} [options]
 * @param {Array<object>} [options.dataset=RAG_BENCHMARK_DATASET]
 * @param {string} [options.sessionId=DEFAULT_EVAL_SESSION_ID]
 * @param {string} [options.categoryFilter=null]
 * @param {number} [options.topK=4]
 * @param {number} [options.broadLimit=15]
 * @param {function} [options.onProgress=null]
 * @returns {Promise<object>} Aggregate evaluation report and metrics.
 */
export async function runRagEvaluation(options = {}) {
  const {
    dataset = RAG_BENCHMARK_DATASET,
    sessionId = DEFAULT_EVAL_SESSION_ID,
    categoryFilter = null,
    topK = 4,
    broadLimit = 15,
    onProgress = null,
  } = options;

  const filteredTests = categoryFilter
    ? dataset.filter((tc) => tc.category === categoryFilter)
    : dataset;

  const results = [];
  const startSuiteTime = Date.now();

  for (let i = 0; i < filteredTests.length; i++) {
    const tc = filteredTests[i];
    if (onProgress) {
      onProgress(i + 1, filteredTests.length, tc);
    }
    const evalRes = await evaluateSingleQuery({
      testCase: tc,
      sessionId,
      topK,
      broadLimit,
    });
    results.push(evalRes);
  }

  const totalTimeMs = Date.now() - startSuiteTime;
  const totalQueries = results.length;

  // Separate in-doc vs out-of-doc for tailored metrics
  const inDocResults = results.filter((r) => !r.isOutOfDocument);
  const oodResults = results.filter((r) => r.isOutOfDocument);

  // Overall metrics
  const overallRecallAt1 = results.reduce((acc, r) => acc + r.recallAt1, 0) / (totalQueries || 1);
  const overallRecallAt3 = results.reduce((acc, r) => acc + r.recallAt3, 0) / (totalQueries || 1);
  const overallRecallAt5 = results.reduce((acc, r) => acc + r.recallAt5, 0) / (totalQueries || 1);
  const overallMRR = results.reduce((acc, r) => acc + r.reciprocalRank, 0) / (totalQueries || 1);
  const inDocPrecisionAt3 = inDocResults.reduce((acc, r) => acc + r.precisionAt3, 0) / (inDocResults.length || 1);
  const overallHitRate = results.filter((r) => r.passed).length / (totalQueries || 1);

  // Refusal accuracy on out-of-document queries
  const refusalAccuracy = oodResults.length > 0
    ? oodResults.filter((r) => r.passed).length / oodResults.length
    : 1.0;

  // Category breakdown
  const categoryNames = [
    "known_answer",
    "similar_paraphrase",
    "ambiguous",
    "out_of_document",
    "exact_keyword",
    "multi_hop",
  ];

  const categoryBreakdown = {};
  categoryNames.forEach((cat) => {
    const catItems = results.filter((r) => r.category === cat);
    if (catItems.length > 0) {
      const catRecallAt3 = catItems.reduce((acc, r) => acc + r.recallAt3, 0) / catItems.length;
      const catMRR = catItems.reduce((acc, r) => acc + r.reciprocalRank, 0) / catItems.length;
      const catHitRate = catItems.filter((r) => r.passed).length / catItems.length;
      const catAvgLatency = catItems.reduce((acc, r) => acc + r.durationMs, 0) / catItems.length;
      categoryBreakdown[cat] = {
        count: catItems.length,
        recallAt3: Number(catRecallAt3.toFixed(4)),
        mrr: Number(catMRR.toFixed(4)),
        hitRate: Number(catHitRate.toFixed(4)),
        avgLatencyMs: Math.round(catAvgLatency),
      };
    }
  });

  // Latency metrics
  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p50Latency = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;

  return {
    sessionId,
    totalQueries,
    inDocCount: inDocResults.length,
    outOfDocCount: oodResults.length,
    overallRecallAt1: Number(overallRecallAt1.toFixed(4)),
    overallRecallAt3: Number(overallRecallAt3.toFixed(4)),
    overallRecallAt5: Number(overallRecallAt5.toFixed(4)),
    overallMRR: Number(overallMRR.toFixed(4)),
    inDocPrecisionAt3: Number(inDocPrecisionAt3.toFixed(4)),
    overallHitRate: Number(overallHitRate.toFixed(4)),
    refusalAccuracy: Number(refusalAccuracy.toFixed(4)),
    latency: {
      avgMs: Math.round(avgLatency),
      p50Ms: p50Latency,
      p95Ms: p95Latency,
      totalSuiteMs: totalTimeMs,
    },
    categoryBreakdown,
    results,
  };
}

/**
 * Generates an executive Markdown report from evaluation results.
 * @param {object} evalData
 * @returns {string}
 */
export function generateMarkdownReport(evalData) {
  const {
    sessionId,
    totalQueries,
    overallRecallAt1,
    overallRecallAt3,
    overallRecallAt5,
    overallMRR,
    inDocPrecisionAt3,
    overallHitRate,
    refusalAccuracy,
    latency,
    categoryBreakdown,
    results,
  } = evalData;

  const dateStr = new Date().toISOString().replace("T", " ").slice(0, 19);

  let md = `# 🎯 RAG Retrieval Evaluation Report\n\n`;
  md += `**Evaluation Date:** \`${dateStr} UTC\`  \n`;
  md += `**Target Session:** \`${sessionId}\`  \n`;
  md += `**Total Queries Evaluated:** **${totalQueries}**  \n\n`;

  md += `## 📊 Executive Summary Scorecard\n\n`;
  md += `| Core Retrieval Metric | Score | Industry Target | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Recall@3** | **${(overallRecallAt3 * 100).toFixed(1)}%** | $\\ge 85\\%$ | ${overallRecallAt3 >= 0.85 ? "🟢 Excellent" : overallRecallAt3 >= 0.70 ? "🟡 Acceptable" : "🔴 Needs Improvement"} |\n`;
  md += `| **MRR (Mean Reciprocal Rank)** | **${overallMRR.toFixed(3)}** | $\\ge 0.75$ | ${overallMRR >= 0.75 ? "🟢 High Precision" : overallMRR >= 0.60 ? "🟡 Moderate" : "🔴 Low Rank"} |\n`;
  md += `| **Recall@1 (Top-1 Hit)** | **${(overallRecallAt1 * 100).toFixed(1)}%** | $\\ge 65\\%$ | ${overallRecallAt1 >= 0.65 ? "🟢 High Top-1 Accuracy" : "🟡 Acceptable"} |\n`;
  md += `| **Recall@5** | **${(overallRecallAt5 * 100).toFixed(1)}%** | $\\ge 90\\%$ | ${overallRecallAt5 >= 0.90 ? "🟢 Optimal Recall" : "🟡 Acceptable"} |\n`;
  md += `| **Precision@3 (In-Doc)** | **${(inDocPrecisionAt3 * 100).toFixed(1)}%** | $\\ge 50\\%$ | ${inDocPrecisionAt3 >= 0.50 ? "🟢 Clean Context" : "🟡 Moderate Noise"} |\n`;
  md += `| **Refusal / Negative Grounding** | **${(refusalAccuracy * 100).toFixed(1)}%** | $100\\%$ | ${refusalAccuracy >= 0.90 ? "🟢 Safe (Zero False Citations)" : "🔴 Hallucination Risk"} |\n`;
  md += `| **Average Retrieval Latency** | **${latency.avgMs} ms** | $< 350\\text{ ms}$ | ${latency.avgMs < 350 ? "🟢 Fast (p95: " + latency.p95Ms + "ms)" : "🟡 Moderate"} |\n\n`;

  md += `## 🔍 Breakdown by Query Archetype\n\n`;
  md += `| Query Archetype | Queries | Recall@3 | MRR | Hit Rate | Avg Latency |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const labels = {
    known_answer: "1. Known Answer (Factual)",
    similar_paraphrase: "2. Similar Question (Paraphrased)",
    ambiguous: "3. Ambiguous (Underspecified)",
    out_of_document: "4. Out-of-Document (Refusal)",
    exact_keyword: "5. Exact Keyword (Codes/Models)",
    multi_hop: "6. Multi-Hop (Cross-Sectional)",
  };

  for (const [key, label] of Object.entries(labels)) {
    const data = categoryBreakdown[key];
    if (data) {
      md += `| **${label}** | ${data.count} | **${(data.recallAt3 * 100).toFixed(1)}%** | **${data.mrr.toFixed(3)}** | ${(data.hitRate * 100).toFixed(1)}% | ${data.avgLatencyMs} ms |\n`;
    }
  }

  md += `\n## 📋 Detailed Query Results\n\n`;
  md += `| ID | Archetype | Query | Expected Page | Top-3 Retrieved | Rank 1 | MRR | Result |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  results.forEach((r) => {
    const expStr = r.isOutOfDocument ? "*None (OOD)*" : r.expectedPages.join(", ");
    const retStr = r.retrievedPages.length > 0 ? r.retrievedPages.slice(0, 3).join(", ") : "*None*";
    const rankStr = r.firstRelevantRank ? `#${r.firstRelevantRank}` : "-";
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    md += `| \`${r.testId}\` | ${r.category} | "${r.query.length > 40 ? r.query.slice(0, 38) + "..." : r.query}" | ${expStr} | ${retStr} | ${rankStr} | ${r.reciprocalRank.toFixed(2)} | ${status} |\n`;
  });

  return md;
}
