"use client";
// app/page.jsx — Roastmaster Glassmorphic Developer Portal
// Featuring Poppins typography, Dual RAG Engine Architecture (LangChain LCEL & Manual), and official npm CLI showcase
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  ArrowRight,
  Radio,
  Terminal,
  Cpu,
  Database,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Zap,
  BookOpen,
  ShieldCheck,
  GitBranch,
  Package,
  Boxes,
  Code2,
  Bot,
} from "lucide-react";

// Curated interactive CLI scenarios
const PREVIEW_SCENARIOS = [
  {
    id: "repo",
    tab: "roastmaster -r",
    badge: "Repo Audit",
    cmd: "npx roastmaster-ai --roast-repo",
    title: "DUAL ICON SET IDENTITY CRISIS",
    category: "Frontend",
    severity: 6,
    severityTag: "6/10 BRUTAL",
    roast:
      "“Importing both Phosphor and Lucide icons in the same project is like wearing two different wristwatches to tell the exact same wrong time. Your bundle size thanks you for the extra baggage.”",
    realTalk:
      "Pick a single icon suite (Lucide is plenty) and tree-shake your imports. Redundant icon dependencies inflate bundle size and slow initial page loads.",
  },
  {
    id: "diff",
    tab: "roastmaster --diff",
    badge: "Pre-Commit",
    cmd: "npx roastmaster-ai --diff",
    title: "MARKDOWN OVER-ENGINEERING PANIC",
    category: "Git Sins",
    severity: 4,
    severityTag: "4/10 MILD",
    roast:
      "“Bro spent more time styling README badges than writing application logic, treating GitHub like a digital pageant. Even your documentation has an identity crisis.”",
    realTalk:
      "Keep the README focused on quick install instructions, core API endpoints, and clean architecture diagrams instead of badge inflation.",
  },
  {
    id: "file",
    tab: "roastmaster -f",
    badge: "File Inspect",
    cmd: "npx roastmaster-ai -f src/components/App.tsx",
    title: "USEEFFECT RECURSIVE SYNAPSE COLLAPSE",
    category: "React State",
    severity: 8,
    severityTag: "8/10 SAVAGE",
    roast:
      "“Your useEffect dependency array has so many reactive references it looks like a Thanksgiving family drama. One re-render and your browser tab surrenders.”",
    realTalk:
      "Derive computed state inline during render or extract external synchronization into clean custom event handlers rather than cascading reactive effects.",
  },
  {
    id: "prompt",
    tab: "npx roastmaster",
    badge: "Freestyle",
    cmd: 'npx roastmaster-ai "I store plain text JWTs in localStorage"',
    title: "LOCAL STORAGE SESSION SUICIDE",
    category: "Security",
    severity: 9,
    severityTag: "9/10 FATAL",
    roast:
      "“Storing raw JWTs in localStorage is basically hanging your house keys with your home address on the front gate. Any script will treat your auth token like a free buffet.”",
    realTalk:
      "Store access tokens in httpOnly, secure cookies with SameSite=Lax to completely shield credentials from malicious client-side XSS exploits.",
  },
];

// Dual Engine Comparison Data
const ENGINE_COMPARISON = {
  langchain: {
    id: "langchain",
    title: "🦜 LangChain.js LCEL Engine",
    subtitle: "Declarative Composable Pipeline Architecture",
    badge: "Enterprise Orchestration",
    tagline:
      "Built with LangChain Expression Language (LCEL), RunnableSequence branching, and standardized metadata vector stores.",
    keyFeatures: [
      {
        icon: GitBranch,
        label: "Dynamic Runnable Routing",
        desc: "Routes incoming queries into 4 specialized branches: Banter, Code Analysis, General Knowledge, and Grounded PDF RAG.",
      },
      {
        icon: Boxes,
        label: "Recursive Character Splitting",
        desc: "Token-aware document slicing with 800-character chunks and 150-character overlap for high-precision semantic boundaries.",
      },
      {
        icon: ShieldCheck,
        label: "Multi-Turn Structured Synthesis",
        desc: "Strict JSON output parser enforcing standup comedy punchlines, severity ratings, and formal citation footnotes.",
      },
      {
        icon: Database,
        label: "PGVectorStore Abstraction",
        desc: "Interchangeable vector store interface with tenant & session isolation filters powered by Aiven PostgreSQL.",
      },
    ],
    pipelineSteps: [
      { step: "01", name: "User Input & History", detail: "Query + recent conversation context" },
      { step: "02", name: "Intent Classification", detail: "LCEL prompt evaluates routing branch" },
      { step: "03", name: "VectorStore Retrieval", detail: "Similarity search with cosine distance & tenant filter" },
      { step: "04", name: "Prompt Template LCEL", detail: "Dynamic injection of citations & roast heuristics" },
      { step: "05", name: "Structured JSON Parser", detail: "Guarantees title, roast, severity & real-talk fix" },
    ],
    codeSnippet: `// src/lib/langchain/rag-chain.ts
const ragBranch = RunnableSequence.from([
  {
    question: (input) => input.question,
    chat_history: (input) => input.chat_history,
    context: async (input) => {
      const docs = await vectorStore.similaritySearch(input.question, 4, {
        sessionId: input.sessionId,
      });
      return formatDocumentsAsString(docs);
    },
  },
  ragPromptTemplate,
  geminiModel,
  new StringOutputParser(),
]);`,
  },
  manual: {
    id: "manual",
    title: "⚡ Manual Custom Engine",
    subtitle: "Bare-Metal SQL & Reciprocal Rank Fusion",
    badge: "Maximum Performance & Control",
    tagline:
      "Handcrafted zero-overhead architecture with direct PostgreSQL pgvector HNSW indexing, BM25 full-text search, and manual RRF scoring.",
    keyFeatures: [
      {
        icon: Zap,
        label: "Reciprocal Rank Fusion (RRF)",
        desc: "Combines PostgreSQL tsvector keyword rankings with 768-dim vector embeddings using custom mathematical rank fusion (k=60).",
      },
      {
        icon: Database,
        label: "Direct HNSW pgvector Queries",
        desc: "Custom parameterized SQL queries with zero ORM overhead, querying cosine distance directly on Aiven cloud databases.",
      },
      {
        icon: Cpu,
        label: "Ultra-Low Latency Streaming",
        desc: "Direct Google Generative AI streaming pipeline with custom standup timing heuristics and zero framework baggage.",
      },
      {
        icon: Code2,
        label: "Sliding Window Document Ingestion",
        desc: "Raw PDF text extraction via unpdf with deterministic sliding-window offsets tailored for raw technical specs.",
      },
    ],
    pipelineSteps: [
      { step: "01", name: "Query Ingestion", detail: "Raw prompt + session identification" },
      { step: "02", name: "768-dim Embedding", detail: "gemini-embedding-2 vector generation" },
      { step: "03", name: "Hybrid Search (RRF)", detail: "Simultaneous SQL tsquery + HNSW cosine vector search" },
      { step: "04", name: "Rank Fusion Scoring", detail: "RRF score = 1/(60 + rank_bm25) + 1/(60 + rank_vector)" },
      { step: "05", name: "Direct Gemini Stream", detail: "Live token streaming with custom comedy prompts" },
    ],
    codeSnippet: `// src/lib/db.js — Manual Hybrid RRF Search
const rrfQuery = \`
  WITH vector_matches AS (
    SELECT id, document_id, content, page_number,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1) as rank_vec
    FROM document_chunks
    WHERE session_id = $2
    LIMIT 20
  ),
  text_matches AS (
    SELECT id, document_id, content, page_number,
           ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', $3)) DESC) as rank_txt
    FROM document_chunks
    WHERE session_id = $2 AND tsv @@ plainto_tsquery('english', $3)
    LIMIT 20
  )
  SELECT COALESCE(v.id, t.id) AS chunk_id,
         (COALESCE(1.0 / (60 + v.rank_vec), 0.0) +
          COALESCE(1.0 / (60 + t.rank_txt), 0.0)) AS rrf_score
  FROM vector_matches v FULL OUTER JOIN text_matches t ON v.id = t.id
  ORDER BY rrf_score DESC LIMIT 5;\`;`,
  },
};

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState("langchain");
  const [copiedHero, setCopiedHero] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedTab, setCopiedTab] = useState(false);
  const [cliMode, setCliMode] = useState("npx"); // 'npx' | 'npm'

  const scenario = PREVIEW_SCENARIOS[activeTab];
  const engine = ENGINE_COMPARISON[selectedEngine];

  const handleCopy = (text, setFn) => {
    navigator.clipboard?.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <main className="min-h-[100dvh] bg-[#FFF5F7] text-[#2D1C24] relative overflow-hidden font-sans selection:bg-[#FCE7F3] selection:text-[#BE185D]">
      {/* ── Soft Ambient Liquid Glass Atmosphere (Matching /chat) ───────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Top-Center Spotlight Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.22)_0%,_rgba(236,72,153,0.06)_50%,_transparent_75%)] blur-3xl" />

        {/* Morphing Liquid Pink Blob (Top-Left) */}
        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-gradient-to-tr from-[#F472B6]/22 via-[#EC4899]/16 to-[#FDA4AF]/22 blur-3xl animate-liquid-1" />

        {/* Morphing Liquid Rose Blob (Bottom-Right) */}
        <div className="absolute -bottom-24 -right-24 w-[480px] h-[480px] bg-gradient-to-bl from-[#EC4899]/18 via-[#F472B6]/20 to-[#FBCFE8]/25 blur-3xl animate-liquid-2" />

        {/* Center Ambient Highlight */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gradient-to-r from-white/40 via-[#FCE7F3]/25 to-[#F472B6]/15 blur-2xl animate-liquid-3" />

        {/* Subtle Cyber Dot Matrix */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(244,114,182,0.18)_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      {/* ── Minimal Floating Navigation Bar ───────────────────────────────── */}
      <header className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        <nav className="liquid-glass rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl liquid-glass-pink flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-sm sm:text-base tracking-wider text-[#2D1C24] uppercase">
                ROASTMASTER
              </span>
              <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFE4E6]/90 border border-[#FDA4AF]/70 text-[#E11D48] text-[9px] font-black tracking-widest uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                <span>ON AIR</span>
              </div>
            </div>
          </Link>

          {/* Quick Nav Badges & Primary Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* npm Published Badge */}
            <a
              href="https://www.npmjs.com/package/roastmaster-ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 liquid-glass-pill hover:liquid-glass text-[#836270] hover:text-[#BE185D] rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer group"
              title="View roastmaster-ai on npm Registry"
            >
              <Package className="w-3.5 h-3.5 text-[#EC4899] group-hover:scale-110 transition-transform" />
              <span>npm v1.0.0</span>
              <ExternalLink className="w-3 h-3 text-[#EC4899]/70 group-hover:text-[#EC4899]" />
            </a>

            {/* Stage Mic Button */}
            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white rounded-xl px-4 py-1.5 sm:py-2 text-xs font-bold font-sans tracking-wider uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <span>Take The Mic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        {/* ── Hero Section (Minimal & Simple) ─────────────────────────────── */}
        <section className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-[#BE185D] text-xs font-sans font-bold tracking-wider uppercase">
              <Radio className="w-3.5 h-3.5 text-[#E11D48] animate-pulse" />
              <span>UNFILTERED AI DEV STANDUP</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#FBCFE8] text-[#836270] text-xs font-mono font-semibold">
              <Sparkles className="w-3 h-3 text-[#EC4899]" />
              <span>Dual RAG: 🦜 LangChain + ⚡ Manual Engine</span>
            </div>
          </div>

          {/* Headline in Plus Jakarta Sans */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading tracking-tight text-[#2D1C24] uppercase leading-[1.14]">
            Your code has sins. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#BE185D] via-[#EC4899] to-[#E11D48] bg-clip-text text-transparent">
              We roast them on stage.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-[#836270] max-w-2xl mx-auto font-sans leading-relaxed">
            Tired of diplomatic PR comments? Roastmaster reviews your commits, dependencies, and architecture with razor-sharp standup comedy — paired with senior-staff constructive truth. Run directly via the official <strong className="text-[#BE185D] font-semibold">npm package</strong> or test both <strong className="text-[#BE185D] font-semibold">LangChain LCEL &amp; Manual pgvector engines</strong> on the live web stage.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Primary /chat CTA */}
            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-sans text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all shadow-[0_8px_25px_rgba(236,72,153,0.32)]"
            >
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>Step Up To Stage Mic</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick CLI Pill */}
            <button
              onClick={() => handleCopy("npx roastmaster-ai --roast-repo", setCopiedHero)}
              className="liquid-glass-pill hover:liquid-glass px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-mono text-[#2D1C24] font-semibold flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              title="Copy CLI command"
            >
              <Terminal className="w-4 h-4 text-[#EC4899]" />
              <span>npx roastmaster-ai --roast-repo</span>
              {copiedHero ? (
                <Check className="w-4 h-4 text-emerald-600 animate-scale-in" />
              ) : (
                <Copy className="w-4 h-4 text-[#836270]" />
              )}
            </button>
          </div>

          {copiedHero && (
            <p className="mt-2.5 text-xs font-mono text-emerald-700 font-semibold tracking-wide">
              ✓ Copied to clipboard! Run in any git repo on your machine with zero local install.
            </p>
          )}
        </section>

        {/* ── Official npm Package Showcase ─────────────────────────────────── */}
        <section className="max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="liquid-glass rounded-3xl p-5 sm:p-7 shadow-xs border border-white/80">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#FBCFE8]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl liquid-glass-pink flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-black text-base sm:text-lg text-[#2D1C24] uppercase tracking-wide">
                      Published On npm Registry
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                      ● Live v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-[#836270] font-sans">
                    Standup code review &amp; git diff critique directly in your terminal. Zero setup.
                  </p>
                </div>
              </div>

              {/* npm Link */}
              <a
                href="https://www.npmjs.com/package/roastmaster-ai"
                target="_blank"
                rel="noreferrer"
                className="liquid-glass-pill hover:liquid-glass px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#BE185D] hover:text-[#9D174D] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>npmjs.com/package/roastmaster-ai</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#EC4899]" />
              </a>
            </div>

            {/* Install Box & Quick Switches */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left Column: Command Box */}
              <div className="md:col-span-7 bg-white/80 rounded-2xl p-4 border border-[#FBCFE8]/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-[#FBCFE8]/50">
                    <button
                      onClick={() => setCliMode("npx")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        cliMode === "npx"
                          ? "bg-white text-[#BE185D] shadow-2xs font-bold"
                          : "text-[#836270] hover:text-[#2D1C24]"
                      }`}
                    >
                      Instant (npx)
                    </button>
                    <button
                      onClick={() => setCliMode("npm")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        cliMode === "npm"
                          ? "bg-white text-[#BE185D] shadow-2xs font-bold"
                          : "text-[#836270] hover:text-[#2D1C24]"
                      }`}
                    >
                      Global Install (npm)
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        cliMode === "npx"
                          ? "npx roastmaster-ai --roast-repo"
                          : "npm install -g roastmaster-ai",
                        setCopiedInstall
                      )
                    }
                    className="liquid-glass-pill px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#BE185D] hover:text-[#9D174D] flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    {copiedInstall ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#EC4899]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-xs sm:text-sm bg-[#2D1C24] text-[#FDF2F8] p-3 rounded-xl flex items-center justify-between select-all overflow-x-auto">
                  <span className="text-[#FDA4AF] select-none mr-2">$</span>
                  <span className="flex-1 font-semibold text-emerald-300">
                    {cliMode === "npx"
                      ? "npx roastmaster-ai --roast-repo"
                      : "npm install -g roastmaster-ai"}
                  </span>
                </div>
              </div>

              {/* Right Column: Quick Stats / Badges */}
              <div className="md:col-span-5 grid grid-cols-2 gap-2 text-left">
                <div className="bg-white/70 p-3 rounded-xl border border-[#FBCFE8]/60">
                  <div className="text-[10px] font-mono text-[#836270] uppercase font-bold">Bundle Size</div>
                  <div className="text-sm font-sans font-black text-[#2D1C24] mt-0.5">&lt; 15 KB (Pure CLI)</div>
                </div>
                <div className="bg-white/70 p-3 rounded-xl border border-[#FBCFE8]/60">
                  <div className="text-[10px] font-mono text-[#836270] uppercase font-bold">Platforms</div>
                  <div className="text-sm font-sans font-black text-[#2D1C24] mt-0.5">macOS • Linux • Win</div>
                </div>
                <div className="bg-white/70 p-3 rounded-xl border border-[#FBCFE8]/60">
                  <div className="text-[10px] font-mono text-[#836270] uppercase font-bold">Git Audit</div>
                  <div className="text-sm font-sans font-black text-[#2D1C24] mt-0.5">Status, Diff &amp; Commits</div>
                </div>
                <div className="bg-white/70 p-3 rounded-xl border border-[#FBCFE8]/60">
                  <div className="text-[10px] font-mono text-[#836270] uppercase font-bold">License</div>
                  <div className="text-sm font-sans font-black text-[#2D1C24] mt-0.5">MIT Open Source</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Minimalist CLI Preview Card ─────────────────────── */}
        <section className="max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="liquid-glass rounded-3xl p-4 sm:p-6 shadow-sm border border-white/80">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-[#FBCFE8]/60 overflow-x-auto">
              {PREVIEW_SCENARIOS.map((item, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? "liquid-glass-pink text-white shadow-2xs"
                        : "liquid-glass-pill text-[#836270] hover:text-[#2D1C24]"
                    }`}
                  >
                    <span>{item.tab}</span>
                    <span className="text-[10px] opacity-80 font-normal">
                      [{item.badge}]
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Terminal Command Header */}
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/70 border border-[#FBCFE8]/60 text-xs font-mono mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#EC4899] font-bold">●</span>
                <span className="text-[#836270] font-medium hidden sm:inline">Terminal:</span>
                <span className="text-[#2D1C24] font-bold truncate">{scenario.cmd}</span>
              </div>
              <button
                onClick={() => handleCopy(scenario.cmd, setCopiedTab)}
                className="liquid-glass-pill px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#BE185D] hover:text-[#9D174D] flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                title="Copy command"
              >
                {copiedTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#EC4899]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Roast Output Card (Clean Light Glass Card) */}
            <div className="rounded-2xl border border-[#FDA4AF]/70 bg-gradient-to-br from-white/95 to-[#FFF5F7]/95 p-4 sm:p-5 shadow-2xs space-y-3.5">
              {/* Card Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎙️</span>
                  <span className="font-heading font-black text-xs sm:text-sm text-[#2D1C24] uppercase tracking-wide">
                    {scenario.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#FCE7F3] text-[#BE185D] text-[10px] font-mono font-bold">
                    {scenario.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-[10px] font-mono font-black tracking-wider">
                    🔥 {scenario.severityTag}
                  </span>
                </div>
              </div>

              {/* Punchline Roast */}
              <p className="text-xs sm:text-sm text-[#2D1C24] font-medium leading-relaxed italic bg-white/60 p-3 rounded-xl border border-white/80">
                {scenario.roast}
              </p>

              {/* Backstage Real Talk */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#F0FDF4]/90 border border-[#BBF7D0] text-xs leading-relaxed">
                <div className="font-mono font-bold text-[#166534] mb-1 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <span>💡</span>
                  <span>BACKSTAGE REAL TALK:</span>
                </div>
                <p className="text-[#14532D] font-sans font-medium">
                  {scenario.realTalk}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual RAG Engine Architecture Showcase ─────────────────────────── */}
        <section className="max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE4E6] border border-[#FDA4AF]/70 text-[#BE185D] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Dual RAG Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading uppercase tracking-tight text-[#2D1C24]">
              Two Engines. One Unfiltered Stage.
            </h2>
            <p className="text-xs sm:text-sm text-[#836270] max-w-xl mx-auto mt-2 font-sans">
              Compare our standardized <strong className="text-[#BE185D]">LangChain.js LCEL</strong> orchestration against our high-throughput <strong className="text-[#BE185D]">Manual SQL pgvector</strong> pipeline.
            </p>
          </div>

          {/* Engine Selector Toggle */}
          <div className="liquid-glass rounded-3xl p-5 sm:p-7 shadow-xs border border-white/80">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 p-1.5 bg-[#FFF5F7] rounded-2xl border border-[#FBCFE8]/60 mb-6">
              <button
                onClick={() => setSelectedEngine("langchain")}
                className={`flex-1 w-full sm:w-auto px-5 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedEngine === "langchain"
                    ? "liquid-glass-pink text-white shadow-xs"
                    : "text-[#836270] hover:text-[#2D1C24] hover:bg-white/60"
                }`}
              >
                <span className="text-base">🦜</span>
                <span>LangChain LCEL Engine</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white font-normal hidden sm:inline">
                  Enterprise
                </span>
              </button>

              <button
                onClick={() => setSelectedEngine("manual")}
                className={`flex-1 w-full sm:w-auto px-5 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  selectedEngine === "manual"
                    ? "liquid-glass-pink text-white shadow-xs"
                    : "text-[#836270] hover:text-[#2D1C24] hover:bg-white/60"
                }`}
              >
                <span className="text-base">⚡</span>
                <span>Manual Custom Engine</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white font-normal hidden sm:inline">
                  Bare-Metal SQL
                </span>
              </button>
            </div>

            {/* Selected Engine Content */}
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#FBCFE8]/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black font-heading text-[#2D1C24]">
                      {engine.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FCE7F3] text-[#BE185D] text-[10px] font-mono font-bold">
                      {engine.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#836270] font-sans mt-1">
                    {engine.tagline}
                  </p>
                </div>

                <button
                  onClick={() => router.push("/chat")}
                  className="liquid-glass-pill hover:liquid-glass px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#BE185D] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Test in /chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {engine.keyFeatures.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={i}
                      className="bg-white/75 p-4 rounded-2xl border border-[#FBCFE8]/70 text-left space-y-1 hover:border-[#FDA4AF] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#BE185D]">
                        <Icon className="w-4 h-4 text-[#EC4899]" />
                        <h4 className="font-sans font-bold text-xs text-[#2D1C24] uppercase tracking-wide">
                          {feat.label}
                        </h4>
                      </div>
                      <p className="text-xs text-[#836270] font-sans leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Visual Pipeline Steps */}
              <div className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-[#FBCFE8]/70">
                <div className="text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#EC4899]" />
                  <span>Execution Pipeline Flow:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                  {engine.pipelineSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FFF5F7] p-2.5 rounded-xl border border-[#FBCFE8]/50 flex flex-col justify-center"
                    >
                      <span className="font-mono text-[10px] text-[#EC4899] font-bold">
                        {step.step}
                      </span>
                      <span className="font-sans font-bold text-xs text-[#2D1C24] mt-0.5">
                        {step.name}
                      </span>
                      <span className="text-[10px] text-[#836270] font-sans mt-0.5 leading-tight">
                        {step.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="rounded-2xl bg-[#2D1C24] text-[#FDF2F8] p-4 font-mono text-xs overflow-x-auto border border-[#836270]/30">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-[#FDA4AF]">
                  <span>Source Implementation Snippet</span>
                  <span>{selectedEngine === "langchain" ? "TypeScript (LCEL)" : "Node.js (SQL)"}</span>
                </div>
                <pre className="text-emerald-300 whitespace-pre leading-relaxed text-[11px]">
                  {engine.codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Core Pillars ────────────────────────────────────────────────── */}
        <section className="mb-16 sm:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Feature 1 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <Terminal className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-heading font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                Instant npm Package
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Run <code className="px-1.5 py-0.5 rounded bg-white/80 border border-[#FBCFE8]/70 text-[#BE185D] font-mono font-semibold text-[11px]">npx roastmaster-ai</code> in any repository with zero local installs. Audit git diffs before your team lead reviews them.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-heading font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                Dual RAG Engines
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Seamlessly toggle between <strong className="text-[#BE185D]">🦜 LangChain LCEL</strong> for structured orchestration and <strong className="text-[#BE185D]">⚡ Manual Engine</strong> for raw PostgreSQL RRF hybrid search.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <ShieldCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-heading font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                Senior-Staff Real Talk
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Every savage standup comedy roast is paired with genuine, constructive engineering fixes and architectural remedies so you actually learn and improve.
              </p>
            </div>
          </div>
        </section>

        {/* ── Bottom Call to Action ─────────────────────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto liquid-glass rounded-3xl p-7 sm:p-10 shadow-xs border border-white/80">
          <div className="w-12 h-12 rounded-2xl liquid-glass-pink flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <Flame className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-heading uppercase text-[#2D1C24] tracking-tight">
            Ready for your review?
          </h2>

          <p className="text-xs sm:text-sm text-[#836270] max-w-md mx-auto mt-2 mb-6 font-sans">
            Step up to the live web stage or roast your uncommitted git diff right from your local terminal via npm.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white px-6 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              <span>Enter The Web Stage (/chat)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleCopy("npx roastmaster-ai", setCopiedHero)}
              className="liquid-glass-pill hover:liquid-glass text-[#2D1C24] px-4 py-3 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-[#EC4899]" />
              <span>npx roastmaster-ai</span>
              <Copy className="w-3.5 h-3.5 text-[#836270]" />
            </button>
          </div>
        </section>
      </div>

      {/* ── Minimal Clean Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#FBCFE8]/60 bg-white/40 backdrop-blur-md py-6 text-xs font-mono text-[#836270]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#2D1C24] font-bold">
            <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>ROASTMASTER AI</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/chat" className="hover:text-[#BE185D] transition-colors">
              Web Stage (/chat)
            </Link>
            <a
              href="https://www.npmjs.com/package/roastmaster-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#BE185D] transition-colors flex items-center gap-1 font-bold text-[#BE185D]"
            >
              <span>npm package</span>
              <ExternalLink className="w-3 h-3 text-[#EC4899]" />
            </a>
            <span className="text-[#FDA4AF]">•</span>
            <span className="font-sans font-medium text-[11px]">LangChain LCEL • Manual pgvector • Gemini 2.5</span>
          </div>
        </div>
      </footer>
    </main>
  );
}