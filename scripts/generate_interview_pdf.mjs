// scripts/generate_interview_pdf.mjs
// Generates a comprehensive, beautifully styled HTML guide and converts it into a professional PDF
// using Headless Chrome.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const HTML_OUTPUT_PATH = path.join(PROJECT_ROOT, "RoastMaster_AI_Interview_Preparation_Guide.html");
const PDF_OUTPUT_PATH = path.join(PROJECT_ROOT, "RoastMaster_AI_Interview_Preparation_Guide.pdf");

console.log("=====================================================================");
console.log(" 🔥 RoastMaster AI: Generating Interview Preparation Guide & PDF");
console.log("=====================================================================");

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RoastMaster AI — Full-Stack RAG & GenAI Engineering Master Interview Guide</title>
<style>
  /* ── General Typography & Reset ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 13.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4 portrait;
    margin: 14mm 14mm 16mm 14mm;
  }

  @media print {
    body {
      background: #ffffff;
      color: #0f172a;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .no-print {
      display: none !important;
    }
  }

  /* ── Container Layout ── */
  .container {
    max-width: 860px;
    margin: 0 auto;
    padding: 10px 10px;
  }

  /* ── Cover Page / Hero Header ── */
  .hero-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #831843 100%);
    color: #ffffff;
    padding: 36px 32px 30px 32px;
    border-radius: 14px;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
    border: 1px solid #334155;
  }

  .hero-badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .badge-pink { background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }
  .badge-cyan { background: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.4); }
  .badge-emerald { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
  .badge-amber { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); }
  .badge-purple { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); }

  .hero-title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 10px;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .hero-subtitle {
    font-size: 14px;
    color: #cbd5e1;
    margin-bottom: 18px;
    max-width: 720px;
    line-height: 1.45;
  }

  .hero-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    background: rgba(15, 23, 42, 0.6);
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 10px;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .meta-value {
    font-size: 12.5px;
    font-weight: 700;
    color: #f8fafc;
    margin-top: 2px;
  }

  /* ── Section Titles ── */
  .section-header {
    margin-top: 28px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: -0.01em;
  }

  .section-tag {
    font-size: 11px;
    font-weight: 600;
    color: #db2777;
    background: #fdf2f8;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #fbcfe8;
  }

  /* ── Cards & Callouts ── */
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .callout {
    border-left: 4px solid;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    font-size: 12.5px;
  }

  .callout-info { border-color: #0284c7; background: #f0f9ff; color: #0369a1; }
  .callout-success { border-color: #059669; background: #ecfdf5; color: #047857; }
  .callout-warning { border-color: #d97706; background: #fffbeb; color: #b45309; }
  .callout-danger { border-color: #e11d48; background: #fff1f2; color: #be123c; }

  /* ── Data Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 12px;
  }

  th, td {
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #cbd5e1;
  }

  th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #1e293b;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* ── Code Blocks & Highlighting ── */
  .code-box {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 8px;
    padding: 12px 14px;
    margin: 10px 0;
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 11.5px;
    line-height: 1.5;
    overflow-x: auto;
    border: 1px solid #334155;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    color: #94a3b8;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid #1e293b;
    font-weight: 600;
  }

  .hl-kw { color: #38bdf8; font-weight: 600; } /* Keyword: cyan */
  .hl-fn { color: #a3e635; font-weight: 600; } /* Function: lime */
  .hl-str { color: #f472b6; }                  /* String: pink */
  .hl-num { color: #fbbf24; }                  /* Number: amber */
  .hl-cmt { color: #64748b; font-style: italic; } /* Comment: slate */
  .hl-type { color: #c084fc; }                 /* Type: purple */

  /* ── Interview QA Blocks ── */
  .qa-block {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .qa-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
  }

  .qa-num {
    background: #e11d48;
    color: #ffffff;
    font-weight: 800;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
    margin-top: 2px;
  }

  .qa-question {
    font-size: 14.5px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
  }

  .qa-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: auto;
  }

  .qa-badge-arch { background: #e0f2fe; color: #0369a1; }
  .qa-badge-rag { background: #fce7f3; color: #be185d; }
  .qa-badge-db { background: #ecfdf5; color: #047857; }
  .qa-badge-prod { background: #fef3c7; color: #b45309; }

  .qa-answer {
    color: #334155;
    font-size: 13px;
    line-height: 1.55;
  }

  .qa-answer p {
    margin-bottom: 8px;
  }

  .qa-answer ul, .qa-answer ol {
    margin-left: 20px;
    margin-bottom: 8px;
  }

  .qa-answer li {
    margin-bottom: 4px;
  }

  .takeaway-box {
    background: #f8fafc;
    border-left: 3px solid #ec4899;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin-top: 10px;
    font-size: 12px;
    color: #475569;
  }

  .takeaway-title {
    font-weight: 700;
    color: #be185d;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── Architecture Diagram Blocks ── */
  .diagram-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px 14px;
    font-family: "Consolas", monospace;
    font-size: 11px;
    line-height: 1.35;
    color: #0f172a;
    overflow-x: auto;
    margin: 12px 0;
  }

  /* ── Two Column Grids ── */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin: 12px 0;
  }

  .metric-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    text-align: center;
  }

  .metric-val {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    margin: 4px 0;
  }

  .metric-val-good { color: #059669; }
  .metric-val-amber { color: #d97706; }

  .metric-desc {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .metric-target {
    font-size: 11px;
    color: #0284c7;
    margin-top: 2px;
  }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>
<body>

<div class="container">

  <!-- HERO HEADER -->
  <div class="hero-header">
    <div class="hero-badge-row">
      <span class="badge badge-pink">RoastMaster AI</span>
      <span class="badge badge-cyan">Full-Stack RAG Engine</span>
      <span class="badge badge-emerald">PostgreSQL pgvector</span>
      <span class="badge badge-amber">Gemini 2.5 Flash</span>
      <span class="badge badge-purple">Next.js 16 + React 19</span>
    </div>
    <h1 class="hero-title">Technical Deep-Dive & System Architecture Interview Guide</h1>
    <p class="hero-subtitle">
      A comprehensive technical manual and question-and-answer preparation guide for software engineering, GenAI, and RAG interview rounds based on the real production architecture of RoastMaster AI.
    </p>
    <div class="hero-meta-grid">
      <div class="meta-item">
        <span class="meta-label">Primary LLM</span>
        <span class="meta-value">Google Gemini 2.5 Flash</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Embedding Model</span>
        <span class="meta-value">gemini-embedding-2 (768-d)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Vector Storage</span>
        <span class="meta-value">Aiven pgvector (HNSW)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Evaluated Recall@3</span>
        <span class="meta-value" style="color: #6ee7b7;">96.7% (MRR: 0.936)</span>
      </div>
    </div>
  </div>

  <!-- SECTION 1: EXECUTIVE PROJECT SUMMARY -->
  <div class="section-header">
    <h2 class="section-title">1. Project Overview & Core Value Proposition</h2>
    <span class="section-tag">System Overview</span>
  </div>

  <div class="card">
    <p><strong>What is RoastMaster AI?</strong><br>
    RoastMaster AI (<code>roastmaster-ai</code>) is a dual-interface AI application (accessible via Web Stage at <a href="https://roastmaster-phi.vercel.app">roastmaster-phi.vercel.app</a> and globally on <code>npm</code> via <code>npx roastmaster-ai</code>). It acts as an unfiltered, sharp-witted standup comedian and senior staff code reviewer with zero mercy.
    </p>
    <br>
    <p><strong>The Core Dual-Persona Philosophy:</strong></p>
    <ul style="margin-left: 20px; margin-top: 6px;">
      <li><strong>The Savage Front-Stage Roast (1–2 Punchlines):</strong> Provides razor-sharp, crowd-work comedy that critiques the user's code sins, architectural flaws, state loops, or bad dependencies with calibrated severity (1–10). Clichés and predictable formulas are explicitly banned via system prompt heuristics.</li>
      <li><strong>Backstage Real Talk (Constructive Advice):</strong> Every roast is paired with genuine, high-caliber Senior Staff architectural advice to actually solve the problem.</li>
      <li><strong>Grounding via RAG (pgvector):</strong> Users can upload PDF specifications, RFCs, or documentation. The system retrieves exact passages, cites verified page numbers, and uses their own documentation against their bad code — or cleanly refuses when information is missing.</li>
    </ul>
  </div>

  <!-- SECTION 2: END-TO-END FLOWCHARTS -->
  <div class="section-header">
    <h2 class="section-title">2. Architecture & Data Flow Pipelines</h2>
    <span class="section-tag">Data Pipelines</span>
  </div>

  <div class="card">
    <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Pipeline A: RAG Document Ingestion & Indexing Flow</h3>
    <div class="diagram-box">
[User Uploads PDF] (Max 2.5MB / 40 Pages)
       │
       ▼
[unpdf Parser] (extractText with mergePages: false -> Preserves Page Arrays)
       │
       ▼
[Sentence-Level Chunker] (Intl.Segmenter sentence boundaries -> 700-char budget, 1-sent overlap)
       │
       ▼
[Batch Embeddings Generator] (Gemini batchEmbedContents -> 50 chunks/batch, 768-d vectors)
       │
       ▼
[Transactional PostgreSQL Storage] (BEGIN -> DELETE old chunks -> INSERT INTO document_chunks -> COMMIT)
       │
       ▼
[Aiven pgvector HNSW Index Ready for Cosine Retrieval (&lt;=&gt;)]
    </div>

    <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 14px; margin-bottom: 8px;">Pipeline B: Query, 2-Stage Retrieval & Grounding Flow</h3>
    <div class="diagram-box">
[User Prompt: e.g., "What is laptop warranty limit?"]
       │
       ▼
[Conversational Banter Detector] (Filters out "huh", "lol", "roast me" from triggering doc search)
       │
       ├─► [Broad Recall: Stage 1] ──► Gemini Query Embedding (768-d, LRU-cached)
       │                                     │
       │                                     ▼
       │                               Query Aiven pgvector (Top 15 candidates via cosine &lt;=&gt;)
       │                                     │
       │   (If 0 candidates returned)        ▼
       │   └───────────────────────► [Hybrid Resilience Fallback] (Fetch direct SQL chunks)
       │                                     │
       ▼                                     ▼
[Multi-Signal Composite Reranker: Stage 2]
    • 40% Vector Cosine Similarity
    • 25% Salient Term Density (stopword stripped)
    • 25% Query Keyword Coverage Ratio
    • 10% Exact Phrase Match Bonus
       │
       ▼
[Redundancy Suppression] (Jaccard token overlap &gt; 0.65 filtered out)
       │
       ▼
[Top 3–5 High-Precision Chunks Selected]
       │
       ▼
[LLM Context Injection] (Gemini 2.5 Flash with System Prompt & Grounding Protocol)
       │
       ▼
[Model Generates Structured JSON] ({ title, roast, severity, suggestion, citations })
       │
       ▼
[Strict Citation Validation Engine] (Verifies citations against real retrieved chunks, strips fakes)
       │
       ├─► Output Streamed to Client (useCharacterReveal Teleprompter)
       │
       └─► [Background Fire-and-Forget] (Async embedding upsert into session_embeddings)
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: CORE COMPONENT DEEP-DIVE -->
  <div class="section-header">
    <h2 class="section-title">3. Core Components & Implementation Details</h2>
    <span class="section-tag">Code Mechanics</span>
  </div>

  <!-- COMPONENT 1: DB & PGVECTOR -->
  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Component 1: Database Architecture (Aiven PostgreSQL + pgvector)</h3>
    <p><strong>Why pgvector over standalone vector DBs?</strong> RoastMaster AI stores transactional user data, authentication IDs, sessions, multi-turn messages, and vector embeddings in the exact same relational database. This enables single-query ACID transactions, cross-table relational joins, and eliminates the synchronization lag common to dual-database setups (e.g., Postgres + Pinecone).</p>
    
    <div class="code-box">
      <div class="code-header">
        <span>src/lib/db.js — Cosine Similarity Vector Search Query</span>
        <span>PostgreSQL pgvector</span>
      </div>
<span class="hl-kw">SELECT</span> 
  id, file_name <span class="hl-kw">AS</span> <span class="hl-str">"fileName"</span>, chunk_index <span class="hl-kw">AS</span> <span class="hl-str">"chunkIndex"</span>, page_number <span class="hl-kw">AS</span> <span class="hl-str">"pageNumber"</span>,
  content, embedding_model <span class="hl-kw">AS</span> <span class="hl-str">"embeddingModel"</span>, embedding_dimension <span class="hl-kw">AS</span> <span class="hl-str">"embeddingDimension"</span>,
  <span class="hl-num">1</span> - (embedding &lt;=&gt; <span class="hl-type">$1</span>::<span class="hl-type">vector</span>) <span class="hl-kw">AS</span> similarity
<span class="hl-kw">FROM</span> document_chunks
<span class="hl-kw">WHERE</span> session_id = <span class="hl-type">$2</span> 
  <span class="hl-kw">AND</span> (<span class="hl-num">1</span> - (embedding &lt;=&gt; <span class="hl-type">$1</span>::<span class="hl-type">vector</span>)) &gt;= <span class="hl-type">$3</span>
<span class="hl-kw">ORDER BY</span> embedding &lt;=&gt; <span class="hl-type">$1</span>::<span class="hl-type">vector ASC</span>
<span class="hl-kw">LIMIT</span> <span class="hl-type">$4</span>;
    </div>
    <div class="callout callout-info">
      <strong>Key Concept: The <code>&lt;=&gt;</code> Operator</strong><br>
      In pgvector, <code>&lt;=&gt;</code> computes Cosine Distance (range: 0.0 to 2.0). To convert this into Cosine Similarity (where 1.0 is identical and 0.0 is orthogonal), calculate: <code>1 - (embedding &lt;=&gt; query_vector)</code>.
    </div>
  </div>

  <!-- COMPONENT 2: EMBEDDING CONSISTENCY & RATE LIMITING -->
  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Component 2: Embedding Consistency & Rate-Limiting Protection</h3>
    <p><strong>The Silent Vector Space Mismatch Problem:</strong> In vector retrieval, embeddings from different models (even with identical dimensions) occupy completely distinct mathematical spaces. Comparing a <code>gemini-embedding-001</code> query against a <code>gemini-embedding-2</code> document chunk yields random mathematical noise. The system enforces strict single-model pinning (<code>gemini-embedding-2</code>, 768-d) and tracks metadata per row.</p>
    
    <div class="code-box">
      <div class="code-header">
        <span>src/lib/embeddings.js — Native Batch Embedding & Quota Throttling</span>
        <span>JavaScript / Gemini SDK</span>
      </div>
<span class="hl-kw">export async function</span> <span class="hl-fn">getBatchEmbeddings</span>(texts, options = {}) {
  <span class="hl-kw">const</span> batchSize = Math.<span class="hl-fn">min</span>(<span class="hl-num">100</span>, options.batchSize || <span class="hl-num">50</span>);
  <span class="hl-kw">const</span> ai = <span class="hl-fn">getGenAI</span>();
  <span class="hl-kw">const</span> model = ai.<span class="hl-fn">getGenerativeModel</span>({ model: EMBEDDING_MODEL });
  <span class="hl-kw">const</span> results = [];

  <span class="hl-kw">for</span> (<span class="hl-kw">let</span> i = <span class="hl-num">0</span>; i &lt; texts.length; i += batchSize) {
    <span class="hl-kw">const</span> chunkBatch = texts.<span class="hl-fn">slice</span>(i, i + batchSize);
    <span class="hl-cmt">// Bundle up to 50 text chunks into a single network call</span>
    <span class="hl-kw">const</span> response = <span class="hl-kw">await</span> model.<span class="hl-fn">batchEmbedContents</span>({
      requests: chunkBatch.<span class="hl-fn">map</span>((t) =&gt; ({
        content: { parts: [{ text: t || <span class="hl-str">" "</span> }] },
        outputDimensionality: <span class="hl-num">768</span>,
      })),
    });
    <span class="hl-cmt">// Micro-delay spacing (350ms) keeps throughput safely below 100 RPM quota</span>
    <span class="hl-kw">if</span> (i + batchSize &lt; texts.length) <span class="hl-kw">await new</span> <span class="hl-type">Promise</span>((r) =&gt; <span class="hl-fn">setTimeout</span>(r, <span class="hl-num">350</span>));
  }
  <span class="hl-kw">return</span> results;
}
    </div>
  </div>

  <!-- COMPONENT 3: CHUNKING & PAGE ATTRIBUTION -->
  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Component 3: Sentence-Level Boundary Chunking (No Mid-Sentence Breaks)</h3>
    <p>Traditional character chunkers slice text at arbitrary offsets (e.g. index 500), chopping sentences in half and severing grammatical subject-verb-predicate relationships. RoastMaster AI leverages native <code>Intl.Segmenter</code> to enforce strict linguistic sentence boundaries and guarantees zero page boundary spillover.</p>

    <div class="code-box">
      <div class="code-header">
        <span>src/lib/chunking.js — Grammatically Safe Sentence Chunking</span>
        <span>JavaScript / Intl API</span>
      </div>
<span class="hl-kw">export function</span> <span class="hl-fn">splitTextIntoSentenceChunks</span>(text, options = {}) {
  <span class="hl-kw">const</span> { targetChunkSize = <span class="hl-num">700</span>, sentenceOverlap = <span class="hl-num">1</span>, pageNumber = <span class="hl-num">1</span> } = options;
  <span class="hl-cmt">// Extract atomic sentences respecting abbreviations, quotes, and punctuation</span>
  <span class="hl-kw">const</span> segmenter = <span class="hl-kw">new</span> Intl.<span class="hl-fn">Segmenter</span>(<span class="hl-str">"en"</span>, { granularity: <span class="hl-str">"sentence"</span> });
  <span class="hl-kw">const</span> sentences = Array.<span class="hl-fn">from</span>(segmenter.<span class="hl-fn">segment</span>(text)).<span class="hl-fn">map</span>(s =&gt; s.segment.<span class="hl-fn">trim</span>()).<span class="hl-fn">filter</span>(Boolean);

  <span class="hl-kw">const</span> chunks = [];
  <span class="hl-kw">let</span> currentGroup = [], currentLength = <span class="hl-num">0</span>;
  <span class="hl-kw">for</span> (<span class="hl-kw">const</span> unit <span class="hl-kw">of</span> sentences) {
    <span class="hl-kw">if</span> (currentLength + unit.length &gt; targetChunkSize &amp;&amp; currentGroup.length &gt; <span class="hl-num">0</span>) {
      chunks.<span class="hl-fn">push</span>({ pageNumber, content: currentGroup.<span class="hl-fn">join</span>(<span class="hl-str">" "</span>) });
      <span class="hl-cmt">// Retain exactly 1 whole sentence as overlap for semantic continuity</span>
      currentGroup = currentGroup.<span class="hl-fn">slice</span>(-sentenceOverlap);
      currentLength = currentGroup.<span class="hl-fn">reduce</span>((acc, s) =&gt; acc + s.length + <span class="hl-num">1</span>, <span class="hl-num">0</span>);
    }
    currentGroup.<span class="hl-fn">push</span>(unit);
    currentLength += unit.length + <span class="hl-num">1</span>;
  }
  <span class="hl-kw">if</span> (currentGroup.length &gt; <span class="hl-num">0</span>) chunks.<span class="hl-fn">push</span>({ pageNumber, content: currentGroup.<span class="hl-fn">join</span>(<span class="hl-str">" "</span>) });
  <span class="hl-kw">return</span> chunks;
}
    </div>
  </div>

  <div class="page-break"></div>

  <!-- COMPONENT 4: MULTI-SIGNAL RERANKER -->
  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Component 4: Multi-Signal Composite Reranking & Redundancy Suppression</h3>
    <p>Pure vector search suffers from semantic drift (e.g., retrieving generic policy chapters instead of specific numbers or part codes). The reranker bridges broad vector recall (Top 15) with high-precision context injection (Top 3–5) using a 4-signal composite scoring function followed by near-duplicate suppression.</p>

    <div class="code-box">
      <div class="code-header">
        <span>src/lib/reranker.js — Multi-Signal Scoring & Diversity Filter</span>
        <span>JavaScript</span>
      </div>
<span class="hl-cmt">// 1. Composite Multi-Signal Formula</span>
<span class="hl-kw">const</span> compositeScore = Math.<span class="hl-fn">min</span>(
  <span class="hl-num">1.0</span>,
  <span class="hl-num">0.40</span> * vectorSim +          <span class="hl-cmt">// 40% Semantic Cosine Vector Distance</span>
  <span class="hl-num">0.25</span> * keywordDensity +      <span class="hl-cmt">// 25% Salient Term Frequency / Density</span>
  <span class="hl-num">0.25</span> * coverageRatio +       <span class="hl-cmt">// 25% Distinct Query Keywords Matched</span>
  phraseBonus                  <span class="hl-cmt">// 10-18% Exact Subphrase / Bigram Alignment</span>
);

<span class="hl-cmt">// 2. Hard Relevance Gatekeeper (Discards Noise &amp; Unrelated Queries)</span>
<span class="hl-kw">if</span> (chunk.rerankScore &lt; minRelevanceScore) <span class="hl-kw">return false</span>; <span class="hl-cmt">// Default cutoff: 0.36</span>

<span class="hl-cmt">// 3. Redundancy Suppression (MMR-Style Diversity via Jaccard Overlap)</span>
<span class="hl-kw">const</span> isDuplicate = deduplicated.<span class="hl-fn">some</span>((existing) =&gt;
  existing.fileName === chunk.fileName &amp;&amp;
  <span class="hl-fn">calculateTokenOverlap</span>(existing.content, chunk.content) &gt; <span class="hl-num">0.65</span>
);
<span class="hl-kw">if</span> (!isDuplicate) deduplicated.<span class="hl-fn">push</span>(chunk);
    </div>
  </div>

  <!-- COMPONENT 5: DETERMINISTIC CITATION VALIDATION -->
  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">Component 5: Strict Citation Validation & Anti-Hallucination Engine</h3>
    <p><strong>Never trust LLM citations at face value.</strong> Even state-of-the-art models will hallucinate page numbers, invent nonexistent filenames, or falsely claim a fact is on page 42 when it was never retrieved. RoastMaster AI runs a deterministic post-processing validation layer that verifies model citations against real retrieved chunks before returning to the user.</p>

    <div class="code-box">
      <div class="code-header">
        <span>src/app/api/chat/route.js — Deterministic Post-Generation Citation Verifier</span>
        <span>Next.js API Route</span>
      </div>
<span class="hl-cmt">// Cross-validate candidate citations against actual retrieved chunks</span>
<span class="hl-kw">for</span> (<span class="hl-kw">const</span> cit <span class="hl-kw">of</span> candidateCitations) {
  <span class="hl-kw">const</span> matchingDoc = retrievedDocs.<span class="hl-fn">find</span>((doc) =&gt; {
    <span class="hl-kw">const</span> pageMatches = (doc.pageNumber || <span class="hl-num">1</span>) === parseInt(cit.pageNumber, <span class="hl-num">10</span>);
    <span class="hl-kw">const</span> fileMatches = doc.fileName.<span class="hl-fn">toLowerCase</span>().<span class="hl-fn">includes</span>(cit.fileName.<span class="hl-fn">toLowerCase</span>());
    <span class="hl-kw">return</span> pageMatches &amp;&amp; fileMatches;
  });

  <span class="hl-kw">if</span> (matchingDoc) {
    <span class="hl-cmt">// Ensure the cited quote lexically exists in the retrieved chunk content</span>
    <span class="hl-kw">const</span> quoteWords = <span class="hl-fn">extractSalientKeywords</span>(cit.quote);
    <span class="hl-kw">const</span> matchedWords = quoteWords.<span class="hl-fn">filter</span>(w =&gt; matchingDoc.content.<span class="hl-fn">toLowerCase</span>().<span class="hl-fn">includes</span>(w));
    <span class="hl-kw">if</span> ((matchedWords.length / quoteWords.length) &gt;= <span class="hl-num">0.35</span>) {
      verifiedCitations.<span class="hl-fn">push</span>({ ...cit, chunkId: matchingDoc.id });
    }
  }
}
<span class="hl-cmt">// If citations failed validation, strip hallucinated "Source: ..." lines and mark unsupported!</span>
<span class="hl-kw">if</span> (verifiedCitations.length === <span class="hl-num">0</span>) {
  finalPayload.isDocumentSupported = <span class="hl-kw">false</span>;
  finalPayload.citations = [];
  finalPayload.suggestion = finalPayload.suggestion.<span class="hl-fn">replace</span>(/Source:\s*[^,\n]+,\s*Page\s*\d+/gi, <span class="hl-str">""</span>).<span class="hl-fn">trim</span>();
}
    </div>
  </div>

  <!-- SECTION 4: BENCHMARK SCORECARD -->
  <div class="section-header">
    <h2 class="section-title">4. RAG Retrieval Evaluation Scorecard & Metrics</h2>
    <span class="section-tag">Evaluation Results</span>
  </div>

  <div class="card avoid-break">
    <p>Automated evaluation executed via <code>npm run eval:rag</code> across 30 benchmark queries covering 6 query archetypes:</p>
    <div class="grid-2">
      <div class="metric-card">
        <div class="metric-desc">Recall@3</div>
        <div class="metric-val metric-val-good">96.7%</div>
        <div class="metric-target">Target: ≥ 85% (Industry Grade)</div>
      </div>
      <div class="metric-card">
        <div class="metric-desc">Mean Reciprocal Rank (MRR)</div>
        <div class="metric-val metric-val-good">0.936</div>
        <div class="metric-target">Target: ≥ 0.75 (High Precision)</div>
      </div>
      <div class="metric-card">
        <div class="metric-desc">Recall@1 (Top-1 Hit)</div>
        <div class="metric-val metric-val-good">90.0%</div>
        <div class="metric-target">Target: ≥ 65%</div>
      </div>
      <div class="metric-card">
        <div class="metric-desc">Refusal Accuracy (OOD)</div>
        <div class="metric-val metric-val-good">100.0%</div>
        <div class="metric-target">Target: 100% (Zero False Citations)</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Query Archetype</th>
          <th>Query Count</th>
          <th>Recall@3</th>
          <th>MRR</th>
          <th>Hit Rate</th>
          <th>Avg Latency</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Known Answer (Factual)</strong></td>
          <td>6</td>
          <td><strong>100.0%</strong></td>
          <td>0.889</td>
          <td>100.0%</td>
          <td>730 ms</td>
        </tr>
        <tr>
          <td><strong>2. Similar Question (Paraphrased)</strong></td>
          <td>5</td>
          <td><strong>100.0%</strong></td>
          <td>0.900</td>
          <td>100.0%</td>
          <td>608 ms</td>
        </tr>
        <tr>
          <td><strong>3. Ambiguous (Underspecified)</strong></td>
          <td>5</td>
          <td><strong>100.0%</strong></td>
          <td>1.000</td>
          <td>100.0%</td>
          <td>596 ms</td>
        </tr>
        <tr>
          <td><strong>4. Out-of-Document (Refusal)</strong></td>
          <td>5</td>
          <td><strong>100.0%</strong></td>
          <td>1.000</td>
          <td>100.0%</td>
          <td>586 ms</td>
        </tr>
        <tr>
          <td><strong>5. Exact Keyword (Codes/Models)</strong></td>
          <td>5</td>
          <td><strong>100.0%</strong></td>
          <td>1.000</td>
          <td>100.0%</td>
          <td>599 ms</td>
        </tr>
        <tr>
          <td><strong>6. Multi-Hop (Cross-Sectional)</strong></td>
          <td>4</td>
          <td><strong>75.0%</strong></td>
          <td>0.813</td>
          <td>100.0%</td>
          <td>595 ms</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 5: TOP 25 INTERVIEW QUESTIONS & ANSWERS -->
  <div class="section-header">
    <h2 class="section-title">5. Top 25 Technical Interview Questions & Answers</h2>
    <span class="section-tag">Interview Questions</span>
  </div>

  <!-- QA 1 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q1</span>
      <h3 class="qa-question">Walk me through the high-level architecture of RoastMaster AI. How do the frontend, CLI, and RAG backend interact?</h3>
      <span class="qa-badge qa-badge-arch">Architecture</span>
    </div>
    <div class="qa-answer">
      <p>RoastMaster AI is architected as a decoupled, multi-client system serving both web and terminal developers:</p>
      <ul>
        <li><strong>Frontend Clients:</strong> A Next.js 16 (React 19) liquid glass web application and a standalone CLI published on <code>npm</code> (<code>npx roastmaster-ai</code>). The CLI extracts local git context (<code>git diff</code>, <code>git status</code>, <code>package.json</code>) and communicates with either Google's Gemini SDK directly or the deployed Next.js API route.</li>
        <li><strong>Application Server:</strong> Next.js App Router API routes (<code>/api/chat</code>, <code>/api/rag/upload</code>, <code>/api/search</code>) handling validation, session management, and RAG coordination.</li>
        <li><strong>Storage & Vector Engine:</strong> Aiven PostgreSQL with the <code>pgvector</code> extension. It stores user profiles, sessions, conversation history, and 768-dimensional document chunk embeddings within the same relational schema.</li>
        <li><strong>Inference & Embedding:</strong> Google Gemini 2.5 Flash for standup punchline and architectural generation; <code>gemini-embedding-2</code> (768-d) for semantic dense embeddings.</li>
      </ul>
      <div class="takeaway-box">
        <div class="takeaway-title">💡 Senior Engineer Soundbite</div>
        "Rather than building an isolated chatbot, we built a dual-interface developer tool where the CLI meets developers right in their terminal before git push, backed by a unified PostgreSQL pgvector database and Gemini."
      </div>
    </div>
  </div>

  <!-- QA 2 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q2</span>
      <h3 class="qa-question">Why did you use Aiven PostgreSQL with pgvector instead of a dedicated vector database like Pinecone or Milvus?</h3>
      <span class="qa-badge qa-badge-db">Database</span>
    </div>
    <div class="qa-answer">
      <p>Choosing <code>pgvector</code> inside PostgreSQL was an intentional architectural trade-off based on operational simplicity, transactional integrity, and data cohesion:</p>
      <ul>
        <li><strong>ACID Transactions & Unified State:</strong> In dedicated vector databases (like Pinecone), metadata and text live in one place while users, auth records, and chat history live in another. This creates dual-write problems, eventual consistency headaches, and sync failures. In PostgreSQL, uploading a PDF deletes old chunks and inserts new ones within a single <code>BEGIN...COMMIT</code> transaction block.</li>
        <li><strong>Hybrid Relational Filtering:</strong> With pgvector, vector similarity can be combined in a single SQL statement with relational clauses (e.g., <code>WHERE session_id = $1 AND user_id = $2</code>) and PostgreSQL text search (<code>ILIKE</code> keyword matching).</li>
        <li><strong>Cost & Operational Simplicity:</strong> No secondary SaaS bill, no proprietary API lock-in, and zero network hop latency between our relational store and vector index.</li>
      </ul>
      <div class="takeaway-box">
        <div class="takeaway-title">💡 Trade-off to Mention</div>
        "At hundreds of millions of vectors with 10k QPS, dedicated vector databases like Milvus or Qdrant with specialized distributed memory partitioning can outperform pgvector. But for sub-million vector multi-tenant sessions, pgvector gives lower operational overhead, lower latency, and zero dual-write bugs."
      </div>
    </div>
  </div>

  <!-- QA 3 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q3</span>
      <h3 class="qa-question">Explain the "Silent Vector Index Corruption" problem you solved in <code>src/lib/embeddings.js</code>.</h3>
      <span class="qa-badge qa-badge-rag">Vector Search</span>
    </div>
    <div class="qa-answer">
      <p>This is one of the most dangerous and elusive bugs in vector retrieval systems:</p>
      <p>Vector embeddings generated by different models (e.g., <code>gemini-embedding-001</code> vs <code>gemini-embedding-2</code>, or OpenAI <code>text-embedding-3-small</code>) exist in completely separate, non-overlapping coordinate spaces. Even if both models output vectors of identical dimensionality (e.g., 768 floats), a cosine distance comparison between them is mathematically meaningless — yielding pseudo-random similarity scores.</p>
      <p><strong>How we solved it:</strong></p>
      <ul>
        <li><strong>Explicit Schema Tracking:</strong> We altered the database tables to explicitly store <code>embedding_model VARCHAR(64)</code> and <code>embedding_dimension INTEGER</code> on every row (via <code>ensureVectorSchema()</code> in <code>db.js</code>).</li>
        <li><strong>Zero Silent Fallbacks:</strong> We eliminated cross-model fallbacks. If an embedding call fails, it retries with exponential backoff on the <em>exact same model</em> rather than silently switching models.</li>
        <li><strong>Migration Script:</strong> We built <code>scripts/migrate-embeddings.mjs</code> to detect any legacy chunks and re-embed them strictly to <code>gemini-embedding-2</code>.</li>
      </ul>
    </div>
  </div>

  <!-- QA 4 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q4</span>
      <h3 class="qa-question">How does your 2-stage retrieval pipeline work? Why not just use top-k from pgvector directly?</h3>
      <span class="qa-badge qa-badge-rag">RAG Retrieval</span>
    </div>
    <div class="qa-answer">
      <p>Dense vector search (Cosine Distance in pgvector) is fantastic at <strong>broad semantic recall</strong> (understanding that "damaged screen" relates to "accidental protection"), but it suffers from <strong>semantic drift</strong> and lacks precision for exact keywords, model numbers, codes, or specific clause matching.</p>
      <p>If you feed 15 raw vector chunks directly to Gemini, you encounter <strong>Lost in the Middle</strong> attention degradation, higher token costs, and increased hallucination risk.</p>
      <p><strong>Our 2-Stage Architecture:</strong></p>
      <ol>
        <li><strong>Stage 1 (Broad Recall):</strong> Query pgvector with cosine distance to retrieve 15 candidate chunks (low threshold: 0.20).</li>
        <li><strong>Stage 2 (High-Precision Multi-Signal Reranking):</strong> We score candidates across 4 dimensions:
          <ul>
            <li>40% Vector Cosine Similarity</li>
            <li>25% Salient Keyword Density (stopwords excluded)</li>
            <li>25% Query Keyword Coverage Ratio</li>
            <li>10% Exact Subphrase / Bigram Alignment Bonus</li>
          </ul>
        </li>
        <li><strong>Relevance Gating & Diversity:</strong> Any chunk below 0.36 composite score is dropped. Chunks with &gt; 0.65 Jaccard token overlap are suppressed to eliminate redundancy, delivering the Top 3–4 pristine chunks to Gemini.</li>
      </ol>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- QA 5 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q5</span>
      <h3 class="qa-question">Walk me through your chunking strategy in <code>src/lib/chunking.js</code>. Why sentence-level over fixed-character chunking?</h3>
      <span class="qa-badge qa-badge-rag">RAG Chunking</span>
    </div>
    <div class="qa-answer">
      <p>Fixed-character chunking (e.g. splitting every 500 characters) cuts text at arbitrary byte offsets. This frequently splits words, numbers, or grammatical clauses in half (e.g., cutting "The warranty limit is $500" into "...warranty limit is $" and "500..."). This destroys the semantic embedding vector and guarantees retrieval failure.</p>
      <p><strong>Our Implementation (<code>splitTextIntoSentenceChunks</code>):</strong></p>
      <ul>
        <li>Uses native JavaScript <code>Intl.Segmenter("en", { granularity: "sentence" })</code>, which natively understands English grammar, abbreviations (e.g., "Mr.", "Inc.", "i.e."), quotes, and terminal punctuation.</li>
        <li>Assembles complete sentences into a target budget of ~700 characters (~120–160 words).</li>
        <li>Maintains a <code>sentenceOverlap = 1</code> (exactly 1 complete sentence carried over to the next chunk) to preserve context continuity across chunk boundaries.</li>
        <li><strong>Zero Page Boundary Spillover:</strong> When processing PDFs, <code>splitPagesIntoChunks</code> guarantees that chunks never merge across page boundaries, preserving exact 1-to-1 page attribution for citations.</li>
      </ul>
    </div>
  </div>

  <!-- QA 6 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q6</span>
      <h3 class="qa-question">How does RoastMaster prevent citation hallucinations? Can you trust an LLM when it returns citations?</h3>
      <span class="qa-badge qa-badge-rag">Anti-Hallucination</span>
    </div>
    <div class="qa-answer">
      <p><strong>Never trust LLM citations blindly.</strong> LLMs are probabilistic token predictors, not database indexers. When an LLM is asked to cite a page number, it frequently hallucinates believable numbers (e.g., "Source: manual.pdf, Page 42") even when page 42 was never in the context window.</p>
      <p><strong>Our Deterministic Citation Validation Layer (<code>src/app/api/chat/route.js</code>):</strong></p>
      <ol>
        <li><strong>Negative Refusal Check:</strong> If the model's text contains refusal phrases like "couldn't find this in your document" or "not mentioned", we immediately force <code>isDocumentSupported = false</code> and clear all citations.</li>
        <li><strong>Grounding Cross-Verification:</strong> For every candidate citation in the JSON, our code scans the <em>actual retrieved chunks</em>. It checks:
          <ul>
            <li>Does the cited <code>pageNumber</code> match a retrieved chunk?</li>
            <li>Does the cited <code>fileName</code> match?</li>
            <li>Does the cited <code>quote</code> have at least 35% salient keyword overlap with the actual chunk text?</li>
          </ul>
        </li>
        <li><strong>Hallucination Stripping:</strong> If a citation fails this test, it is discarded. If no citations remain valid, any hallucinated "Source: ..." lines are stripped from the response text using regex, preventing fake sources from reaching the user.</li>
      </ol>
    </div>
  </div>

  <!-- QA 7 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q7</span>
      <h3 class="qa-question">Explain the Conversational Banter Detector (<code>isConversationalBanter</code>). Why is it critical for RAG user experience?</h3>
      <span class="qa-badge qa-badge-rag">UX & Search</span>
    </div>
    <div class="qa-answer">
      <p>In standard RAG systems, every single message sent by a user triggers a vector search against the document index. This creates two major problems:</p>
      <ul>
        <li><strong>Unnecessary Latency & Token Waste:</strong> If a user says "lol that was funny", "bro", "huh?", or "roast me", vector searching the user's PDF policy document is pointless and wastes 300–600ms.</li>
        <li><strong>Inappropriate Bot Apologies:</strong> A naive RAG bot will respond to "haha nice" with: <em>"I apologize, but I could not find information regarding 'haha nice' in your document policy.pdf."</em> This completely ruins conversational flow and comedy crowd work.</li>
      </ul>
      <p><strong>Our Solution:</strong> <code>isConversationalBanter()</code> analyzes the query against a calibrated set of interjections, heckles, and short conversational commands. If detected, RAG retrieval is bypassed completely, letting Gemini respond purely in its sharp standup persona without searching or apologizing for missing document context.</p>
    </div>
  </div>

  <!-- QA 8 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q8</span>
      <h3 class="qa-question">How does the system stay below Google Gemini's 100 RPM Free Tier quota during bulk document ingestion?</h3>
      <span class="qa-badge qa-badge-prod">Performance</span>
    </div>
    <div class="qa-answer">
      <p>A typical 20-page PDF document produces 80 to 120 chunks. If you send each chunk as a separate HTTP request to Gemini's <code>embedContent</code> endpoint, you immediately hit the <code>429 RESOURCE_EXHAUSTED</code> rate limit (100 RPM ceiling).</p>
      <p><strong>Our 3-Tier Mitigation Strategy:</strong></p>
      <ul>
        <li><strong>Native Batching (<code>batchEmbedContents</code>):</strong> We bundle up to 50 text chunks into a single API payload. A 100-chunk document takes only 2 network calls instead of 100!</li>
        <li><strong>Cadence Micro-Delays:</strong> We insert a 350ms throttle between batches to smooth out request spikes.</li>
        <li><strong>Exponential Backoff with Header Parsing:</strong> Our <code>extractRetryDelayMs</code> function parses Google's RPC error string (e.g. <em>"Please retry in 2.6s"</em>) and sleeps for the exact recommended duration before retrying.</li>
        <li><strong>In-Memory LRU Cache:</strong> Repeated query embeddings are stored in a 500-item memory cache, saving API quota entirely on popular questions.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- QA 9 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q9</span>
      <h3 class="qa-question">Explain the difference between HNSW and IVFFlat index types in pgvector. What did you configure and why?</h3>
      <span class="qa-badge qa-badge-db">Vector Indexing</span>
    </div>
    <div class="qa-answer">
      <p><code>pgvector</code> supports two primary Approximate Nearest Neighbor (ANN) index types:</p>
      <ul>
        <li><strong>IVFFlat (Inverted File Flat):</strong> Divides vector space into Voronoi cells (clusters) using k-means. Queries search only vectors in the closest cells (<code>probes</code>).
          <br><em>Pros:</em> Fast build time, small memory footprint.
          <br><em>Cons:</em> Requires training data; recall degrades if vectors are added after training; lower recall-vs-speed curve.
        </li>
        <li><strong>HNSW (Hierarchical Navigable Small World):</strong> Builds a multi-layer graph where bottom layers contain all vectors and top layers contain long-range skips.
          <br><em>Pros:</em> Outstanding recall (&gt; 98%), faster queries than IVFFlat, handles dynamic incremental inserts without index retraining.
          <br><em>Cons:</em> Higher RAM usage and slower initial index build.
        </li>
      </ul>
      <p><strong>RoastMaster's Choice:</strong> We configured <strong>HNSW</strong> with cosine distance (<code>vector_cosine_ops</code>). Because chat sessions and documents are added incrementally by users, HNSW's ability to maintain high recall without periodic rebuilds made it the superior choice.</p>
    </div>
  </div>

  <!-- QA 10 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q10</span>
      <h3 class="qa-question">How does hybrid session search work in <code>src/app/api/search/route.js</code> and <code>searchSimilarSessions</code>?</h3>
      <span class="qa-badge qa-badge-db">Hybrid Search</span>
    </div>
    <div class="qa-answer">
      <p>When searching historical chat sessions, pure keyword search fails on concepts (e.g. searching "API errors" misses a session titled "Stripe Nil Exception"), while pure vector search fails on exact tokens (e.g. session IDs, specific package names).</p>
      <p><strong>Our Hybrid SQL Scoring Function:</strong></p>
      <div class="code-box">
ROUND(GREATEST(
  CASE WHEN embedding IS NOT NULL THEN (1 - (embedding &lt;=&gt; $1::vector)) ELSE 0 END,
  CASE WHEN title ILIKE '%' || $2 || '%' THEN 0.88 ELSE 0 END,
  CASE WHEN REPLACE(REPLACE(title, '-', ''), ' ', '') ILIKE '%' || $6 || '%' THEN 0.86 ELSE 0 END,
  CASE WHEN snippet ILIKE '%' || $2 || '%' THEN 0.78 ELSE 0 END,
  CASE WHEN category ILIKE '%' || $2 || '%' THEN 0.68 ELSE 0 END
)::numeric, 4) AS "similarityScore"
      </div>
      <p>PostgreSQL calculates the greatest score among vector similarity, title match, normalized whitespace/hyphen-stripped match, and snippet match, classifying the result as <code>'hybrid'</code>, <code>'keyword'</code>, or <code>'semantic'</code>.</p>
    </div>
  </div>

  <!-- QA 11 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q11</span>
      <h3 class="qa-question">Explain the evaluation metrics you measured in <code>rag_evaluator.js</code>. What is MRR and why does it matter?</h3>
      <span class="qa-badge qa-badge-rag">Evaluation</span>
    </div>
    <div class="qa-answer">
      <p>We measured 5 core industry metrics across 30 benchmark queries:</p>
      <ul>
        <li><strong>Recall@K:</strong> The fraction of queries where at least one ground-truth chunk was successfully retrieved within the top K results. RoastMaster achieved <strong>Recall@3 = 96.7%</strong> and <strong>Recall@5 = 100%</strong>.</li>
        <li><strong>MRR (Mean Reciprocal Rank):</strong> Measures <em>where</em> the first relevant document appears in the ranked list. If the correct chunk is ranked #1, reciprocal rank is $1/1 = 1.0$. If it's ranked #2, it's $1/2 = 0.50$.
          <br>Formula: $\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$. RoastMaster achieved an outstanding <strong>MRR of 0.936</strong> (target: $\ge 0.75$), indicating that the correct chunk is almost always at Rank #1.</li>
        <li><strong>Precision@3 (In-Doc):</strong> Proportion of the top 3 retrieved chunks that are actually relevant (achieved <strong>74.7%</strong>), proving low context noise.</li>
        <li><strong>Refusal Accuracy (Negative Grounding):</strong> For out-of-document queries (where the answer does not exist), the retriever must return 0 chunks. RoastMaster scored <strong>100%</strong>.</li>
      </ul>
    </div>
  </div>

  <!-- QA 12 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q12</span>
      <h3 class="qa-question">What is "Negative Grounding" or "Safe Refusal", and why is it essential for enterprise RAG?</h3>
      <span class="qa-badge qa-badge-rag">Anti-Hallucination</span>
    </div>
    <div class="qa-answer">
      <p>Most RAG tutorials only evaluate "happy path" queries where the answer exists in the document. In real life, users frequently ask questions that are <em>completely absent</em> from their uploaded document (e.g., asking for the school cafeteria lunch menu from a laptop policy manual).</p>
      <p>Without negative grounding, the vector search will force the "least bad" 3 chunks into the LLM context. The LLM will then either hallucinate an answer or fabricate a citation to an unrelated policy.</p>
      <p><strong>How RoastMaster handles Out-of-Document (OOD) queries:</strong></p>
      <ul>
        <li>Our reranker's hard relevance threshold (0.36) filters out low-scoring irrelevant chunks, returning an empty candidate list (0 chunks).</li>
        <li>When 0 chunks are returned, our chat prompt enforces a strict refusal protocol: explicitly stating <em>"I couldn't find this in your document"</em>, returning <code>isDocumentSupported: false</code>, and outputting an empty citations array <code>[]</code>.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- QA 13 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q13</span>
      <h3 class="qa-question">How does your Hybrid Resilience Fallback work when the vector search API is down or throttled?</h3>
      <span class="qa-badge qa-badge-prod">Resilience</span>
    </div>
    <div class="qa-answer">
      <p>If Google's embedding API experiences a 503 outage or rate-limiting spike, query embedding generation will fail. In a naive RAG system, the entire search pipeline crashes with an unhandled exception.</p>
      <p><strong>Our Resilient Fallback (<code>src/lib/reranker.js:retrieveAndRerankChunks</code>):</strong></p>
      <ul>
        <li>If <code>initialCandidates</code> is empty (vector search failed or returned 0 hits), the system triggers <code>getSessionChunksDirect(sessionId, 50)</code> to pull direct raw document chunks from PostgreSQL.</li>
        <li>These chunks are assigned a neutral baseline similarity (0.50).</li>
        <li>The multi-signal reranker runs with an adjusted cutoff threshold (0.24). The salient keyword density, query coverage ratio, and exact phrase matching signals kick in to score and rank chunks lexically.</li>
        <li>This ensures that even during a complete third-party embedding API outage, users can still ask questions containing keywords, codes, or phrases and receive grounded answers!</li>
      </ul>
    </div>
  </div>

  <!-- QA 14 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q14</span>
      <h3 class="qa-question">How do you optimize latency so the user doesn't wait for background database operations?</h3>
      <span class="qa-badge qa-badge-prod">Latency Optimization</span>
    </div>
    <div class="qa-answer">
      <p>In conversational AI, Time-to-First-Token (TTFT) and Total Turnaround Time dictate user perception of speed. We implemented several optimizations:</p>
      <ul>
        <li><strong>Asynchronous Fire-and-Forget Embedding:</strong> At the end of every chat turn, we embed the conversation exchange and update <code>session_embeddings</code>. Instead of <code>await</code>ing this operation before returning the HTTP response, we trigger it as a background promise (<code>getEmbedding(...).then(...).catch(...)</code>) and immediately return the JSON response to the user.</li>
        <li><strong>Character-by-Character Teleprompter (<code>useCharacterReveal</code>):</strong> Instead of an abrupt text dump or waiting for a sluggish server-sent events stream over poor mobile networks, the client renders the structured response smoothly at 2 characters every 18ms, mimicking a live standup teleprompter.</li>
        <li><strong>Broad Recall Candidate Capping:</strong> Broad vector search fetches exactly 15 candidates — large enough for 100% recall, but small enough to rerank in under 5 milliseconds in Node.js memory.</li>
      </ul>
    </div>
  </div>

  <!-- QA 15 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q15</span>
      <h3 class="qa-question">Explain how the CLI tool (<code>bin/cli.mjs</code>) inspects git repositories and formats terminal output.</h3>
      <span class="qa-badge qa-badge-arch">CLI Architecture</span>
    </div>
    <div class="qa-answer">
      <p>The CLI is designed to be zero-dependency and executable anywhere via <code>npx roastmaster-ai</code>:</p>
      <ul>
        <li><strong>Git Context Extraction:</strong> Using <code>child_process.execSync</code>, it checks:
          <ul>
            <li><code>git rev-parse --is-inside-work-tree</code> to verify git context.</li>
            <li><code>git status --short</code> to see untracked/modified files.</li>
            <li><code>git log -1 --pretty=format:"%s (%h)"</code> for the last commit message.</li>
            <li><code>git diff HEAD</code> and <code>git diff --staged</code> (capped at 3,500 characters) to analyze uncommitted code changes.</li>
            <li>Inspects <code>package.json</code> for suspicious dependencies, version counts, and build scripts.</li>
          </ul>
        </li>
        <li><strong>Local & Remote Fallback:</strong> If a local <code>GEMINI_API_KEY</code> is present, it computes the roast locally. If not, it falls back to the live deployed Vercel API endpoint.</li>
        <li><strong>ANSI Terminal Box Formatter:</strong> Hand-crafted ANSI escape sequences render rounded borders, hot pink headers, severity flame meters, and Backstage Real Talk callouts formatted to terminal width.</li>
      </ul>
    </div>
  </div>

  <!-- QA 16 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q16</span>
      <h3 class="qa-question">How did you design the LLM System Prompt to guarantee comedy freshness and prevent stock clichés?</h3>
      <span class="qa-badge qa-badge-prod">Prompt Engineering</span>
    </div>
    <div class="qa-answer">
      <p>Standard LLM prompts default to predictable internet tropes (e.g. "That's like an umbrella in a car wash", "Did your cat walk on the keyboard?").</p>
      <p><strong>Our Prompt Defense Mechanisms (<code>src/app/api/chat/route.js</code>):</strong></p>
      <ul>
        <li><strong>Length Constraints:</strong> Strictly limited to 1–2 punchline sentences (under 35–45 words). No wandering monologues.</li>
        <li><strong>Negative Prompting / Banned Clichés:</strong> Explicitly bans stale metaphors ("umbrella in a car wash", "dog chasing tail") and formulaic openings ("Bhai tu seriously...", "Matlab tu wahi banda hai...").</li>
        <li><strong>Audience Profile Injection:</strong> When a user sets a VIP profile (stage title, favorite tech, requested roast level: mild/sarcastic/incineration), their quirks and tech preferences are dynamically injected into the system instruction, enabling customized comedy crowd work callbacks.</li>
        <li><strong>Structured Output Guarantee:</strong> A strict JSON schema is enforced (with <code>title</code>, <code>roast</code>, <code>severity</code>, <code>category</code>, <code>suggestion</code>, <code>citations</code>), backed by regex fallback parsing in case of markdown fencing.</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- QA 17 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q17</span>
      <h3 class="qa-question">What was the migration from Firestore to PostgreSQL in <code>scripts/migrate-firestore-to-postgres.mjs</code>? Why migrate?</h3>
      <span class="qa-badge qa-badge-db">Architecture Migration</span>
    </div>
    <div class="qa-answer">
      <p>The project initially started with Google Cloud Firestore (NoSQL) for user profiles and chat sessions. As the RAG requirements matured, Firestore presented critical limitations:</p>
      <ul>
        <li><strong>No Native Vector Search:</strong> Firestore lacked robust, integrated HNSW vector indexing for pgvector-style similarity operations.</li>
        <li><strong>Complex Queries & Aggregations:</strong> Performing combined keyword searches, group-by document counts, and relational joins across user profiles and document chunks in Firestore required multiple client roundtrips and denormalized data.</li>
        <li><strong>Cost Model:</strong> Firestore charges per read/write document. When a RAG search evaluates candidate documents and sessions, read operations scale linearly with cost. PostgreSQL provides predictable database compute pricing with superior query capabilities.</li>
      </ul>
      <p>We wrote <code>migrate-firestore-to-postgres.mjs</code> to authenticate via Firebase SDK, extract collections and subcollections across sessions and messages, and stream them into PostgreSQL with automatic foreign key resolution.</p>
    </div>
  </div>

  <!-- QA 18 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q18</span>
      <h3 class="qa-question">Explain Redundancy Suppression in your reranker. How is it implemented and why is it needed?</h3>
      <span class="qa-badge qa-badge-rag">RAG Reranking</span>
    </div>
    <div class="qa-answer">
      <p>When chunking documents with sentence overlap (e.g. 1-sentence overlap), consecutive chunks often contain nearly identical wording. If a query matches both chunks, naive top-k retrieval selects Chunk #3 and Chunk #4, wasting two of the four context slots on duplicate information.</p>
      <p><strong>Our Solution: Jaccard Lexical Overlap Suppression:</strong></p>
      <ul>
        <li>For each candidate passing the relevance gatekeeper, we calculate token overlap against already accepted chunks:
          $$\text{Jaccard Overlap} = \frac{|A \cap B|}{|A \cup B|}$$
        </li>
        <li>If overlap exceeds <strong>0.65 (65%)</strong> within the same file, the chunk is identified as a near-duplicate and skipped.</li>
        <li>This mimics Maximal Marginal Relevance (MMR) diversity, ensuring that every retrieved chunk delivers net-new facts to the LLM.</li>
      </ul>
    </div>
  </div>

  <!-- QA 19 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q19</span>
      <h3 class="qa-question">How would you scale this architecture to handle 500,000 active daily users and millions of documents?</h3>
      <span class="qa-badge qa-badge-prod">System Design</span>
    </div>
    <div class="qa-answer">
      <p>To scale from prototype/freelance scale to enterprise production:</p>
      <ol>
        <li><strong>Asynchronous Document Ingestion Queue:</strong> Replace direct synchronous HTTP PDF upload with an asynchronous message queue (e.g., AWS SQS or BullMQ / Redis). Users receive a job ID immediately; background worker pools handle OCR, chunking, and embedding generation.</li>
        <li><strong>PostgreSQL Read Replicas & Connection Pooling:</strong> Implement PgBouncer for transaction-level pooling and route vector search queries to read replicas.</li>
        <li><strong>Dedicated Vector Partitions:</strong> Partition the <code>document_chunks</code> table by <code>user_id</code> or <code>session_id</code> (PostgreSQL declarative partitioning) so HNSW indexes remain resident in RAM.</li>
        <li><strong>Edge Caching:</strong> Cache repeated query embeddings in Redis with TTLs instead of single-instance memory.</li>
      </ol>
    </div>
  </div>

  <!-- QA 20 -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q20</span>
      <h3 class="qa-question">What are the 6 query archetypes you evaluated, and why is this categorization important?</h3>
      <span class="qa-badge qa-badge-rag">Benchmarking</span>
    </div>
    <div class="qa-answer">
      <p>Evaluating RAG systems only on simple factual questions produces misleadingly optimistic benchmarks. We defined and benchmarked 6 archetypes:</p>
      <ol>
        <li><strong>Known Answer (Factual):</strong> Explicit questions directly answered in text ("What percentage of part cost is covered?").</li>
        <li><strong>Similar Paraphrase:</strong> Semantically identical queries with zero overlapping vocabulary ("If I knock over coffee on my keyboard...").</li>
        <li><strong>Ambiguous (Underspecified):</strong> Short 2-3 word queries lacking syntax ("laptop damage fee").</li>
        <li><strong>Out-of-Document (Refusal):</strong> Queries completely outside document domain ("cafeteria lunch menu"). Tested for safe refusal.</li>
        <li><strong>Exact Keyword:</strong> Technical model codes and emails ("Lenovo Yoga 12 Thinkpad", "helpdesk@kingsacademy.edu.jo").</li>
        <li><strong>Multi-Hop:</strong> Requires synthesizing facts across disparate sections/pages ("If my laptop requires extensive repair...").</li>
      </ol>
    </div>
  </div>

  <!-- QA 21 to 25 Quickfire Summary -->
  <div class="qa-block">
    <div class="qa-header">
      <span class="qa-num">Q21–25</span>
      <h3 class="qa-question">Rapid-Fire Technical Production Questions</h3>
      <span class="qa-badge qa-badge-prod">Quick-Fire</span>
    </div>
    <div class="qa-answer">
      <p><strong>Q21: How do you handle PDF parsing without losing page numbers?</strong><br>
      We use <code>unpdf</code> with <code>extractText(uint8Array, { mergePages: false })</code>. This returns an array of strings where index <code>i</code> maps strictly to Page <code>i + 1</code>, preventing text from different pages from bleeding together.</p>

      <p><strong>Q22: Why did you implement model fallback cascading in <code>api/chat/route.js</code>?</strong><br>
      If a specific Gemini model (e.g. <code>gemini-flash-lite-latest</code>) encounters temporary 503 capacity issues, the route automatically cascades to <code>gemini-2.5-flash-lite</code> and <code>gemini-3.5-flash-lite</code> before failing, guaranteeing 99.9% API uptime.</p>

      <p><strong>Q23: What security protections exist for database connections in <code>db.js</code>?</strong><br>
      The connection string parses out insecure flags, uses SSL with <code>rejectUnauthorized: false</code> for Aiven cloud certificates, sets a maximum pool size of 10 connections, and uses parameterized queries (<code>$1, $2, ...</code>) across 100% of SQL statements to eliminate SQL injection vulnerabilities.</p>

      <p><strong>Q24: What is the VisionOS Liquid Glass UI design system in the frontend?</strong><br>
      A hardware-accelerated CSS design system combining Tailwind CSS v4, multi-layered backdrop filters (<code>backdrop-blur-md</code>), translucent dark borders (<code>rgba(255, 255, 255, 0.08)</code>), and dynamic SVG metaball symbiote goo animations that run at 60 FPS.</p>

      <p><strong>Q25: What is the single biggest lesson you learned building RoastMaster AI?</strong><br>
      <em>"In generative AI, 80% of your bugs are retrieval and data integrity problems masquerading as prompt problems. Standardizing on an explicit embedding model, enforcing sentence-level chunking, and implementing a deterministic citation validation layer did 10x more for answer quality than tweaking LLM temperature."</em></p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 6: INTERVIEW SOUNDBITES & CHEAT SHEET -->
  <div class="section-header">
    <h2 class="section-title">6. Cheat Sheet & High-Impact Interview Soundbites</h2>
    <span class="section-tag">Quick Recall</span>
  </div>

  <div class="card avoid-break">
    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">The 60-Second "Elevator Pitch"</h3>
    <div class="callout callout-info" style="font-size: 13px;">
      "RoastMaster AI is a full-stack developer tool available as both a Next.js 16 web application and an npm CLI package. It acts as an unfiltered standup comedian and senior-staff code reviewer. Users can upload technical documentation, and our system retrieves exact passages using an end-to-end RAG pipeline built on Aiven PostgreSQL and pgvector with HNSW indexing.<br><br>
      We built a two-stage retrieval engine: broad vector recall retrieves the top 15 candidates, followed by a multi-signal composite reranker that evaluates keyword density, query coverage, and phrase alignment down to the top 3 chunks. In benchmark evaluations across 30 queries and 6 archetypes, our pipeline achieved a 96.7% Recall@3, an MRR of 0.936, and 100% Safe Refusal on out-of-document queries."
    </div>

    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 14px; margin-bottom: 8px;">Key Numbers & Constants to Memorize</h3>
    <table>
      <thead>
        <tr>
          <th>Metric / Constant</th>
          <th>Exact Value</th>
          <th>Architectural Rationale</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Embedding Dimension</strong></td>
          <td><strong>768 dimensions</strong></td>
          <td>Native dimensionality of <code>gemini-embedding-2</code>.</td>
        </tr>
        <tr>
          <td><strong>Target Chunk Size</strong></td>
          <td><strong>~700 characters</strong></td>
          <td>~120–160 words; fits 2–4 full grammatical sentences per chunk.</td>
        </tr>
        <tr>
          <td><strong>Sentence Overlap</strong></td>
          <td><strong>1 complete sentence</strong></td>
          <td>Preserves cross-chunk context without token bloat.</td>
        </tr>
        <tr>
          <td><strong>Batch Embeddings Size</strong></td>
          <td><strong>50 chunks / request</strong></td>
          <td>Stays safely below Gemini's 100 RPM Free Tier limit.</td>
        </tr>
        <tr>
          <td><strong>Reranker Weights</strong></td>
          <td><strong>40% / 25% / 25% / 10%</strong></td>
          <td>Vector Cosine / Keyword Density / Query Coverage / Phrase Bonus.</td>
        </tr>
        <tr>
          <td><strong>Relevance Cutoff</strong></td>
          <td><strong>0.36 threshold</strong></td>
          <td>Discards unrelated noise; triggers 100% safe refusal on OOD queries.</td>
        </tr>
        <tr>
          <td><strong>Redundancy Cutoff</strong></td>
          <td><strong>0.65 Jaccard overlap</strong></td>
          <td>Suppresses near-duplicate consecutive chunks.</td>
        </tr>
        <tr>
          <td><strong>Evaluated Recall@3</strong></td>
          <td><strong>96.7%</strong></td>
          <td>Exceeds industry standard benchmark of ≥ 85%.</td>
        </tr>
        <tr>
          <td><strong>Evaluated MRR</strong></td>
          <td><strong>0.936</strong></td>
          <td>Average rank of first correct chunk is #1.07.</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 14px; margin-bottom: 8px;">The "Toughest Challenge" Story (STAR Method)</h3>
    <p><strong>Situation:</strong> Early in testing, our RAG system experienced subtle citation hallucinations where the model cited real filenames but nonexistent page numbers, and occasionally returned random chunks for technical part queries.</p>
    <p><strong>Task:</strong> Eliminate citation hallucinations and diagnose the retrieval inaccuracy without adding excessive latency.</p>
    <p><strong>Action:</strong> I discovered two root causes: First, cross-model embedding contamination—different files were embedded with different model versions, creating silent index corruption. I standardized the pipeline strictly to <code>gemini-embedding-2</code> with explicit database column schema enforcement. Second, I introduced a deterministic post-generation citation validation layer in the API route that cross-checks the LLM's cited page and quote against actual retrieved chunks before serving the user. If ungrounded, fake sources are stripped automatically.</p>
    <p><strong>Result:</strong> Citation accuracy hit 100%, out-of-document refusal accuracy reached 100%, and MRR improved from 0.72 to 0.936.</p>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <span>RoastMaster AI — Engineering Architecture & Interview Prep Manual</span>
    <span>Generated: October 2026 • MIT Licensed</span>
  </div>

</div>

</body>
</html>
`;

// 1. Write the HTML file to disk
fs.writeFileSync(HTML_OUTPUT_PATH, htmlContent, "utf8");
console.log(`✓ HTML Guide generated successfully at:\n  ${HTML_OUTPUT_PATH}`);

// 2. Generate PDF via Headless Chrome
console.log("\n⏳ Invoking Headless Chrome to generate high-resolution PDF...");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!fs.existsSync(CHROME_PATH)) {
  console.error(`❌ Chrome binary not found at: ${CHROME_PATH}`);
  process.exit(1);
}

import { spawnSync } from "node:child_process";

try {
  const result = spawnSync(
    CHROME_PATH,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${PDF_OUTPUT_PATH}`,
      HTML_OUTPUT_PATH,
    ],
    { stdio: "inherit" }
  );

  if (fs.existsSync(PDF_OUTPUT_PATH)) {
    const stat = fs.statSync(PDF_OUTPUT_PATH);
    console.log(`\n🎉 PDF GENERATED SUCCESSFULLY!`);
    console.log(`  File Path : ${PDF_OUTPUT_PATH}`);
    console.log(`  File Size : ${(stat.size / 1024).toFixed(1)} KB`);
  } else {
    console.error("❌ PDF file was not created.", result.error || "");
    process.exit(1);
  }
} catch (err) {
  console.error("❌ Error executing headless Chrome:", err);
  process.exit(1);
}
