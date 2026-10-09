// scripts/evaluate_rag.mjs — CLI Benchmark Runner for RoastMaster RAG Evaluation
import fs from "fs";
import path from "path";
import { runRagEvaluation, generateMarkdownReport } from "../src/lib/rag_evaluator.js";
import { DEFAULT_EVAL_SESSION_ID } from "../src/lib/rag_eval_dataset.js";

// ANSI terminal color utilities
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const DIM = "\x1b[2m";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    sessionId: DEFAULT_EVAL_SESSION_ID,
    topK: 4,
    category: null,
    json: false,
    saveReport: true,
  };

  for (const arg of args) {
    if (arg.startsWith("--session=")) {
      options.sessionId = arg.split("=")[1];
    } else if (arg.startsWith("--topK=")) {
      options.topK = parseInt(arg.split("=")[1], 10) || 4;
    } else if (arg.startsWith("--category=")) {
      options.category = arg.split("=")[1];
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--no-report") {
      options.saveReport = false;
    }
  }

  return options;
}

async function main() {
  const opts = parseArgs();

  if (!opts.json) {
    console.log(`\n${BOLD}${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${MAGENTA}║      🔥 ROASTMASTER RAG BENCHMARK & EVALUATION ENGINE 🔥          ║${RESET}`);
    console.log(`${BOLD}${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${RESET}`);
    console.log(`Target Session: ${CYAN}${opts.sessionId}${RESET}`);
    console.log(`Top-K Evaluated: ${CYAN}${opts.topK}${RESET}`);
    if (opts.category) {
      console.log(`Category Filter: ${YELLOW}${opts.category}${RESET}`);
    }
    console.log(`\n${BOLD}Executing Benchmark Across 6 Query Archetypes...${RESET}\n`);
  }

  const results = await runRagEvaluation({
    sessionId: opts.sessionId,
    topK: opts.topK,
    categoryFilter: opts.category,
    onProgress: (current, total, tc) => {
      if (!opts.json) {
        process.stdout.write(
          `${DIM}[${String(current).padStart(2, "0")}/${total}]${RESET} Evaluating ${CYAN}${tc.id}${RESET} (${tc.category}): "${tc.query.slice(0, 48)}..." `
        );
      }
    },
  });

  if (!opts.json) {
    // Clear last line and print terminal header
    console.log(`\n\n${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${RESET}`);
    console.log(`${BOLD}🎯 BENCHMARK EXECUTIVE SCORECARD${RESET}`);
    console.log(`${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${RESET}`);

    const r3 = (results.overallRecallAt3 * 100).toFixed(1);
    const mrr = results.overallMRR.toFixed(3);
    const r1 = (results.overallRecallAt1 * 100).toFixed(1);
    const r5 = (results.overallRecallAt5 * 100).toFixed(1);
    const p3 = (results.inDocPrecisionAt3 * 100).toFixed(1);
    const refusal = (results.refusalAccuracy * 100).toFixed(1);

    console.log(`• ${BOLD}Recall@3:${RESET}               ${r3 >= 85 ? GREEN : YELLOW}${r3}%${RESET} (Target: ≥ 85%)`);
    console.log(`• ${BOLD}MRR (Mean Reciprocal):${RESET}  ${mrr >= 0.75 ? GREEN : YELLOW}${mrr}${RESET} (Target: ≥ 0.75)`);
    console.log(`• ${BOLD}Recall@1 (Top-1 Hit):${RESET}   ${r1 >= 65 ? GREEN : YELLOW}${r1}%${RESET} (Target: ≥ 65%)`);
    console.log(`• ${BOLD}Recall@5:${RESET}               ${r5 >= 90 ? GREEN : YELLOW}${r5}%${RESET} (Target: ≥ 90%)`);
    console.log(`• ${BOLD}Precision@3 (In-Doc):${RESET}   ${p3 >= 50 ? GREEN : YELLOW}${p3}%${RESET} (Target: ≥ 50%)`);
    console.log(`• ${BOLD}Refusal Accuracy (OOD):${RESET} ${refusal >= 90 ? GREEN : RED}${refusal}%${RESET} (Target: 100% - Safe Refusal)`);
    console.log(`• ${BOLD}Average Query Latency:${RESET}  ${CYAN}${results.latency.avgMs} ms${RESET} (p50: ${results.latency.p50Ms}ms, p95: ${results.latency.p95Ms}ms)`);

    console.log(`\n${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${RESET}`);
    console.log(`${BOLD}📊 BREAKDOWN BY QUERY ARCHETYPE${RESET}`);
    console.log(`${BOLD}${CYAN}───────────────────────────────────────────────────────────────────${RESET}`);
    console.log(
      `${BOLD}${"Archetype".padEnd(32)} ${"Count".padEnd(8)} ${"Recall@3".padEnd(12)} ${"MRR".padEnd(10)} ${"Hit Rate".padEnd(10)} ${"Avg Latency"}${RESET}`
    );

    const labels = {
      known_answer: "1. Known Answer (Factual)",
      similar_paraphrase: "2. Similar Question (Paraphrased)",
      ambiguous: "3. Ambiguous (Underspecified)",
      out_of_document: "4. Out-of-Doc (Refusal)",
      exact_keyword: "5. Exact Keyword (Codes/Models)",
      multi_hop: "6. Multi-Hop (Cross-Sectional)",
    };

    for (const [key, label] of Object.entries(labels)) {
      const data = results.categoryBreakdown[key];
      if (data) {
        const catR3 = `${(data.recallAt3 * 100).toFixed(1)}%`;
        const catMRR = data.mrr.toFixed(3);
        const catHit = `${(data.hitRate * 100).toFixed(1)}%`;
        const catLat = `${data.avgLatencyMs} ms`;
        console.log(
          `${label.padEnd(32)} ${String(data.count).padEnd(8)} ${catR3.padEnd(12)} ${catMRR.padEnd(10)} ${catHit.padEnd(10)} ${catLat}`
        );
      }
    }

    // Print Failed Queries if any
    const failed = results.results.filter((r) => !r.passed);
    if (failed.length > 0) {
      console.log(`\n${BOLD}${RED}───────────────────────────────────────────────────────────────────${RESET}`);
      console.log(`${BOLD}${RED}❌ FAILED QUERIES (${failed.length}/${results.totalQueries}):${RESET}`);
      console.log(`${BOLD}${RED}───────────────────────────────────────────────────────────────────${RESET}`);
      failed.forEach((f) => {
        console.log(`${RED}• [${f.testId}] ${f.category}:${RESET} "${f.query}"`);
        if (f.isOutOfDocument) {
          console.log(`  ${DIM}Expected safe refusal (0 chunks), but retriever returned ${f.retrievedCount} chunks (Pages: ${f.retrievedPages.join(", ") || "none"})${RESET}`);
        } else {
          console.log(`  ${DIM}Expected Pages: [${f.expectedPages.join(", ")}], but retrieved: [${f.retrievedPages.join(", ") || "none"}]${RESET}`);
        }
      });
    } else {
      console.log(`\n${GREEN}${BOLD}🎉 ALL ${results.totalQueries} TEST QUERIES PASSED WITH 100% SUCCESS RATE!${RESET}`);
    }
  }

  // Generate and save markdown report
  if (opts.saveReport) {
    const reportMd = generateMarkdownReport(results);
    const localReportPath = path.resolve(process.cwd(), "rag_evaluation_report.md");
    fs.writeFileSync(localReportPath, reportMd, "utf8");

    // Also persist into IDE Brain artifacts directory if present
    const brainDir = "C:\\Users\\faiz.afk\\.gemini\\antigravity-ide\\brain\\b5efde95-5f1b-4afc-a17f-5adf16bb63b4";
    if (fs.existsSync(brainDir)) {
      fs.writeFileSync(path.join(brainDir, "rag_evaluation_report.md"), reportMd, "utf8");
    }

    if (!opts.json) {
      console.log(`\n${DIM}📄 Evaluation Report saved to: ${CYAN}rag_evaluation_report.md${RESET}\n`);
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Evaluation failed with error:", err);
  process.exit(1);
});
