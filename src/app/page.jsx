"use client";
// app/page.jsx — Roastmaster Developer Portal & Live Roast Arena Entrance
// Featuring Blackish-Pink Venom Goo Liquid Symbiote Background & Glassmorphism UI
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  ArrowRight,
  Mic2,
  Radio,
  BookOpen,
  Laugh,
  Code2,
  Cpu,
  Database,
  Sparkles,
  Copy,
  Check,
  Terminal,
  Layers,
  FileText,
  ShieldAlert,
  Zap,
} from "lucide-react";

// Interactive Code Snippet Previews to entice developers
const CODE_PREVIEWS = [
  {
    id: "react-loop",
    title: "useEffect.tsx",
    language: "typescript",
    label: "Frontend State Trap",
    severity: 9.8,
    category: "React / Architecture",
    code: `// Junior's "clean" reactive dashboard
useEffect(() => {
  fetchDashboardMetrics().then(data => {
    setMetrics(data);
    setRefreshCount(refreshCount + 1); // 💀 Infinite re-render loop
  });
}, [refreshCount]);`,
    roast:
      "You put `refreshCount` in the dependency array of a `useEffect` that increments `refreshCount`? That's not reactive architecture, that's a DDOS attack on your own browser dressed up in TypeScript.",
    realTalk:
      "Use a functional state updater `setRefreshCount(prev => prev + 1)` with an empty dependency array or extract the trigger to an explicit user event handler instead of coupling side effects.",
  },
  {
    id: "go-error",
    title: "billing_worker.go",
    language: "go",
    label: "Silent Payment Failure",
    severity: 10.0,
    category: "Backend / Golang",
    code: `func ProcessStripeCharge(ctx context.Context, order Order) error {
    res, err := stripe.Charges.Create(order.Payload)
    if err != nil {
        // TODO: fix in prod before Monday standup
        return nil // 💸 Money vanished into the void
    }
    return nil
}`,
    roast:
      "Returning `nil` on a failed Stripe charge with a `// TODO: fix in prod` comment? You didn't write defensive backend code, you just committed accidental corporate embezzlement.",
    realTalk:
      "Wrap errors with `fmt.Errorf('stripe charge failed: %w', err)` and implement an idempotent dead-letter retry queue instead of swallowing exceptions into the void.",
  },
  {
    id: "microservices",
    title: "docker-compose.yml",
    language: "yaml",
    label: "Microservice Overkill",
    severity: 9.2,
    category: "DevOps / Infra",
    code: `# Single-user personal todo app
services:
  auth-microservice:
    image: node:20
  todo-crud-service:
    image: rust:latest
  kafka-event-bus:
    image: confluentinc/cp-kafka:7.4.0
  k8s-istio-mesh:
    image: istio/proxyv2:1.20`,
    roast:
      "Four microservices, Apache Kafka, and an Istio service mesh for a personal todo app with 1 active user? You're not scaling for enterprise, you're cosplaying as Netflix with negative revenue.",
    realTalk:
      "Start with a boring SQLite monolith. You cannot out-architect an absence of users with distributed tracing overhead.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0);
  const [copiedCli, setCopiedCli] = useState(false);

  const activeSnippet = CODE_PREVIEWS[activeSnippetIndex];

  const handleEnterStage = () => {
    router.push("/chat");
  };

  const handleCopyCli = () => {
    navigator.clipboard?.writeText("npx roastmaster-ai --roast-repo");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2200);
  };

  return (
    <main className="min-h-[100dvh] bg-[#12030C] text-[#FCE7F3] relative overflow-hidden font-sans selection:bg-[#BE185D] selection:text-white">
      {/* ── SVG Filter for Viscous Metaball Venom Goo Effect ─────────────────── */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="venom-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="26" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -13"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* ── Flowing Venom Goo Background (Blackish-Pink Viscous Symbiote) ───── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep blackish-pink base vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#3B0A26_0%,_#200516_40%,_#0F020A_100%)] opacity-95" />

        {/* Ambient cyber dot matrix grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(244,114,182,0.08)_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />

        {/* Viscous Venom Goo Metaball Container */}
        <div
          className="absolute inset-0 opacity-85"
          style={{ filter: "url(#venom-goo)" }}
        >
          {/* Main Top-Right Venom Blob (Rich Blackish-Pink to Magenta) */}
          <div className="absolute -top-24 right-[-10%] w-[580px] h-[580px] bg-gradient-to-br from-[#2D061E] via-[#5C0F3A] to-[#DB2777] rounded-[45%_55%_65%_35%] animate-venom-1" />

          {/* Bottom-Left Venom Tendril (Deep Obsidian Fuchsia to Hot Pink) */}
          <div className="absolute -bottom-36 left-[-12%] w-[680px] h-[680px] bg-gradient-to-tr from-[#1E0313] via-[#4C0B2F] to-[#E11D48] rounded-[55%_45%_40%_60%] animate-venom-2" />

          {/* Central Pulsing Liquid Goo Pocket */}
          <div className="absolute top-[32%] left-[28%] w-[420px] h-[420px] bg-gradient-to-bl from-[#701042] via-[#9D174D] to-[#EC4899] rounded-[38%_62%_52%_48%] animate-venom-3 opacity-75" />

          {/* Elongated Drifting Venom Tendril */}
          <div className="absolute top-[60%] right-[15%] w-[380px] h-[480px] bg-gradient-to-tl from-[#2B051C] via-[#831843] to-[#F472B6] rounded-[60%_40%_70%_30%] animate-venom-1 opacity-70" />

          {/* High-frequency viscous bubble */}
          <div className="absolute top-[18%] left-[8%] w-[260px] h-[260px] bg-gradient-to-r from-[#4F0C33] via-[#DB2777] to-[#FDA4AF] rounded-full animate-venom-2 opacity-65" />
        </div>

        {/* Subtle Caustic Highlight Sheen */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-[radial-gradient(ellipse_at_center,_rgba(244,114,182,0.18)_0%,_transparent_70%)] blur-3xl pointer-events-none" />
      </div>

      {/* ── Glassmorphic Top Navigation ────────────────────────────────────── */}
      <header className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <nav className="dark-liquid-glass rounded-2xl px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F472B6] via-[#EC4899] to-[#9D174D] flex items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.5)] border border-white/30">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base sm:text-lg tracking-wider text-white uppercase">
                  ROASTMASTER
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/30">
                  v2.5 LIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#F472B6]/80 tracking-widest uppercase">
                Zero Mercy AI Code Stand-up
              </p>
            </div>
          </div>

          {/* Tech Stack Indicator Pills (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
            <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#FBCFE8] flex items-center gap-1.5 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-[#F472B6]" />
              Gemini 2.5 AI
            </span>
            <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#FBCFE8] flex items-center gap-1.5 border border-white/10">
              <Database className="w-3.5 h-3.5 text-[#F472B6]" />
              pgvector RAG
            </span>
            <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#FBCFE8] flex items-center gap-1.5 border border-white/10">
              <Layers className="w-3.5 h-3.5 text-[#F472B6]" />
              LangChain Splitter
            </span>
          </div>

          {/* Enter Stage Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleEnterStage}
              className="relative group overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#BE185D] hover:opacity-95 shadow-[0_0_24px_rgba(236,72,153,0.45)] border border-white/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Take The Mic</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Landing Body ──────────────────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          {/* Live Marquee Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full dark-liquid-glass-pill border border-[#F472B6]/40 text-[#FDA4AF] text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_25px_rgba(244,114,182,0.25)]">
            <Radio className="w-3.5 h-3.5 text-[#F43F5E] animate-pulse" />
            <span>UNFILTERED DEV STAND-UP • NO MERCY CODE REVIEWS</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase font-mono text-white leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            YOUR CODE{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] via-[#FB7185] to-[#FDA4AF] animate-pulse">
              SUCKS.
            </span>
            <br />
            LET&apos;S ROAST IT LIVE.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-[#FBCFE8]/90 max-w-2xl mx-auto font-sans leading-relaxed">
            Tired of gentle PR reviews and diplomatic feedback? Roastmaster
            combines <span className="text-white font-bold">Google Gemini AI</span> with{" "}
            <span className="text-white font-bold">Aiven pgvector RAG</span> to turn your
            questionable architecture, recursive state bugs, and midnight commits into savage standup routines — plus senior-staff constructive truth.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleEnterStage}
              className="px-7 py-4 rounded-2xl font-mono text-sm sm:text-base font-black tracking-wider uppercase text-white bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#BE185D] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] border border-white/40 transition-all cursor-pointer flex items-center gap-3 active:scale-95 shadow-[0_8px_30px_rgba(236,72,153,0.35)]"
            >
              <Flame className="w-5 h-5 text-amber-200 fill-amber-200 animate-bounce" />
              <span>Step Up To Stage Mic</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick CLI Copy Pill */}
            <button
              onClick={handleCopyCli}
              className="px-5 py-3.5 rounded-2xl dark-liquid-glass-card hover:bg-white/10 text-xs sm:text-sm font-mono text-[#FBCFE8] border border-white/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
              title="Copy terminal command"
            >
              <Terminal className="w-4 h-4 text-[#F472B6]" />
              <span>npx roastmaster --roast-repo</span>
              {copiedCli ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-[#FDA4AF]/70" />
              )}
            </button>
          </div>

          {copiedCli && (
            <p className="mt-3 text-xs font-mono text-emerald-400 tracking-wide">
              ✓ CLI command copied to clipboard!
            </p>
          )}
        </div>

        {/* ── Interactive "Taste The Roast" Playground ─────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark-liquid-glass-pill text-[#F472B6] text-[11px] font-mono font-bold tracking-widest uppercase mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>LIVE INTERACTIVE PREVIEW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-white uppercase tracking-tight">
              TASTE THE ROAST
            </h2>
            <p className="text-xs sm:text-sm text-[#FBCFE8]/75 font-sans mt-1">
              Select a developer horror story below and see how Roastmaster shreds it.
            </p>
          </div>

          {/* Playground Deck Card */}
          <div className="dark-liquid-glass rounded-3xl p-4 sm:p-7 max-w-5xl mx-auto shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/15">
            {/* Snippet Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 mb-6">
              {CODE_PREVIEWS.map((snippet, idx) => {
                const isActive = activeSnippetIndex === idx;
                return (
                  <button
                    key={snippet.id}
                    onClick={() => setActiveSnippetIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#EC4899] to-[#BE185D] text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] border border-white/30"
                        : "dark-liquid-glass-pill text-[#FBCFE8]/80 hover:text-white hover:border-white/30"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{snippet.title}</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 font-normal">
                      ({snippet.label})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Split View: Left Code, Right Roast Output */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: The Suspect Code */}
              <div className="lg:col-span-6 bg-[#0E020A]/90 rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between font-mono">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs text-[#FDA4AF]/70">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="ml-2 font-bold text-white">
                        {activeSnippet.title}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#F472B6]">
                      {activeSnippet.category}
                    </span>
                  </div>

                  <pre className="text-xs sm:text-[13px] text-[#FDF2F8] font-mono leading-relaxed overflow-x-auto p-1">
                    <code>{activeSnippet.code}</code>
                  </pre>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#FDA4AF]/70">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Detected Anti-Pattern</span>
                  </span>
                  <span className="font-bold text-[#F472B6]">
                    Severity: {activeSnippet.severity}/10
                  </span>
                </div>
              </div>

              {/* Right Column: Roastmaster Savage Verdict */}
              <div className="lg:col-span-6 dark-liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-[#F472B6]/30">
                <div>
                  {/* Verdict Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#E11D48] flex items-center justify-center text-white">
                        <Flame className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-black uppercase text-white tracking-wider">
                        HEADLINER ROAST VERDICT
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-[#E11D48]/25 text-[#FDA4AF] border border-[#E11D48]/40">
                      🔥 {activeSnippet.severity} / 10 SAVAGE
                    </span>
                  </div>

                  {/* The Roast Quote */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-sm sm:text-base font-sans font-medium text-white leading-relaxed mb-4">
                    &ldquo;{activeSnippet.roast}&rdquo;
                  </div>

                  {/* Backstage Real Talk (Constructive Advice) */}
                  <div className="p-3.5 rounded-xl bg-[#2D061E]/70 border border-[#F472B6]/30 text-xs font-sans text-[#FCE7F3] leading-relaxed">
                    <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-[#F472B6] mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Backstage Real Talk (Constructive Fix)</span>
                    </div>
                    <p>{activeSnippet.realTalk}</p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#FDA4AF]/70">
                    Ready to roast your own repository?
                  </span>
                  <button
                    onClick={handleEnterStage}
                    className="font-mono text-xs font-bold text-[#F472B6] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer uppercase"
                  >
                    <span>Try on stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Real Tech Stack Showcase (Luring Developers) ──────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full dark-liquid-glass-pill text-[#F472B6] text-[11px] font-mono font-bold tracking-widest uppercase mb-2">
              <Cpu className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>UNDER THE HOOD ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-mono text-white uppercase tracking-tight">
              ENGINEERED FOR TECHNICAL HUMILIATION
            </h2>
            <p className="text-sm sm:text-base text-[#FBCFE8]/80 font-sans max-w-xl mx-auto mt-2">
              We didn&apos;t just slap an LLM on a chat box. Here is the battle-tested distributed stack powering every punchline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tech Card 1 */}
            <div className="dark-liquid-glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#9D174D] flex items-center justify-center text-white mb-5 shadow-[0_0_20px_rgba(236,72,153,0.35)] border border-white/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-mono font-black text-lg text-white uppercase">
                  Google Gemini 2.5
                </h3>
                <p className="font-mono text-xs text-[#F472B6] mt-0.5 mb-3 font-semibold">
                  Multi-Turn Comedy Logic
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Structured JSON generation adhering to strict comic timing, severity scoring from 1 to 10, and dual-brain outputs (savage punchline + constructive technical fix).
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[10px] text-[#FDA4AF]/70 flex items-center justify-between">
                <span>Latency: &lt; 850ms</span>
                <span>Type: Structured Output</span>
              </div>
            </div>

            {/* Tech Card 2 */}
            <div className="dark-liquid-glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white mb-5 shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-white/20">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-mono font-black text-lg text-white uppercase">
                  Aiven pgvector
                </h3>
                <p className="font-mono text-xs text-[#C4B5FD] mt-0.5 mb-3 font-semibold">
                  PostgreSQL Vector Engine
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  1536-dimensional semantic embeddings stored in hosted PostgreSQL with cosine distance similarity search, empowering instant RAG over attached PDF specs and RFCs.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[10px] text-[#FDA4AF]/70 flex items-center justify-between">
                <span>Index: HNSW Cosine</span>
                <span>Storage: Persistent Postgres</span>
              </div>
            </div>

            {/* Tech Card 3 */}
            <div className="dark-liquid-glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white mb-5 shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-white/20">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-mono font-black text-lg text-white uppercase">
                  LangChain Chunking
                </h3>
                <p className="font-mono text-xs text-amber-300 mt-0.5 mb-3 font-semibold">
                  Sentence Boundary Splitting
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Recursive character text splitters respecting punctuation, code syntax, and sentence boundaries. Eliminates mid-sentence truncation and context bleeding.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[10px] text-[#FDA4AF]/70 flex items-center justify-between">
                <span>Chunk Size: 500-1000 tokens</span>
                <span>Overlap: Context-Preserving</span>
              </div>
            </div>

            {/* Tech Card 4 */}
            <div className="dark-liquid-glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#F43F5E] flex items-center justify-center text-white mb-5 shadow-[0_0_20px_rgba(244,63,94,0.35)] border border-white/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-mono font-black text-lg text-white uppercase">
                  Venom Glass UI
                </h3>
                <p className="font-mono text-xs text-[#FDA4AF] mt-0.5 mb-3 font-semibold">
                  VisionOS Specular Refraction
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Pure hardware-accelerated CSS keyframe fluid caustics, SVG metaball goo filters, horizontal overflow-safe codeblock rendering, and live teleprompter text streams.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-white/10 font-mono text-[10px] text-[#FDA4AF]/70 flex items-center justify-between">
                <span>Blur: 24px - 32px</span>
                <span>Color: Blackish-Pink Venom</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Comparison / Why Roastmaster ─────────────────────────── */}
        <section className="mb-24 max-w-5xl mx-auto">
          <div className="dark-liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#F472B6] text-xs font-mono font-bold uppercase tracking-wider">
                  THE COMEDY CELLAR GUARANTEE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black font-mono text-white uppercase mt-3 mb-4 leading-tight">
                  WHY CONVENTIONAL CODE REVIEWS FAIL
                </h3>
                <p className="text-xs sm:text-sm text-[#FBCFE8]/80 font-sans leading-relaxed mb-6">
                  Senior engineers write polite PR comments like &ldquo;Consider refactoring this.&rdquo; You ignore them. Roastmaster makes fun of your lineage and your RAM usage so you never write an unmemoized callback again.
                </p>
                <button
                  onClick={handleEnterStage}
                  className="px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#EC4899] to-[#BE185D] hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                >
                  <span>Experience The Roast</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 text-[#EF4444] text-xs font-bold mb-2">
                    <Flame className="w-4 h-4" />
                    <span>Zero Corporate Fluff</span>
                  </div>
                  <p className="text-[11px] text-[#FBCFE8]/75 font-sans">
                    No &ldquo;Great job on this PR! Just one small nit.&rdquo; Direct punches that hit the actual flaw.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 text-[#EC4899] text-xs font-bold mb-2">
                    <FileText className="w-4 h-4" />
                    <span>RAG Document Ingestion</span>
                  </div>
                  <p className="text-[11px] text-[#FBCFE8]/75 font-sans">
                    Upload your architecture RFC or sprint brief as PDF. We quote your own documentation against you.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 text-[#10B981] text-xs font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Backstage Real Talk</span>
                  </div>
                  <p className="text-[11px] text-[#FBCFE8]/75 font-sans">
                    Every savage roast is paired with a real, battle-tested architectural fix written like senior staff advice.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-2">
                    <Laugh className="w-4 h-4" />
                    <span>100% Unique Jokes</span>
                  </div>
                  <p className="text-[11px] text-[#FBCFE8]/75 font-sans">
                    Strict system prompts ban stock clichés and internet tropes. Tailored uniquely to your exact syntax.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials / Developer Wall of Fame ────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-white uppercase tracking-tight">
              DEVELOPERS SURVIVING THE MIC
            </h2>
            <p className="text-xs sm:text-sm text-[#FBCFE8]/75 font-sans mt-1">
              Real reactions from engineers who dared to share their production repositories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <div className="dark-liquid-glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-[#FDF2F8] font-sans italic leading-relaxed">
                &ldquo;It called my Redux slice an &apos;emotional baggage carousel&apos; and then explained how to rewrite it using Zustand in 8 lines. My ego is hurt, but my bundle size dropped 40%.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#F472B6]">
                <span className="font-bold">@alex_frontend</span>
                <span className="text-[#FDA4AF]/60">Staff Engineer</span>
              </div>
            </div>

            <div className="dark-liquid-glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-[#FDF2F8] font-sans italic leading-relaxed">
                &ldquo;I attached a 30-page security RFC PDF. Roastmaster cited page 14 where I allowed `0.0.0.0/0` on port 22 and roasted me in front of my entire platform engineering team.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#F472B6]">
                <span className="font-bold">@karan_devops</span>
                <span className="text-[#FDA4AF]/60">Infra Architect</span>
              </div>
            </div>

            <div className="dark-liquid-glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-[#FDF2F8] font-sans italic leading-relaxed">
                &ldquo;Better than my tech lead. The roast made me laugh out loud in the office, and the Backstage Real Talk actually pinpointed the database connection pool leak.&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#F472B6]">
                <span className="font-bold">@sarah_go</span>
                <span className="text-[#FDA4AF]/60">Backend Specialist</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final Hero Call to Action ────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto rounded-3xl dark-liquid-glass p-8 sm:p-12 text-center border border-white/25 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC4899] via-[#F43F5E] to-[#BE185D] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-white/30">
            <Mic2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono uppercase text-white tracking-tight leading-tight">
            STOP WRITING BAD CODE IN SECRET.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] to-[#FDA4AF]">
              TAKE THE STAGE.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#FBCFE8]/80 max-w-lg mx-auto mt-4 mb-8 font-sans">
            Free VIP front-row seating. Instant dynamic titles, real-time audio teleprompter streams, and vector-backed document roasts.
          </p>

          <button
            onClick={handleEnterStage}
            className="w-full sm:w-auto px-10 py-5 rounded-2xl font-mono text-base font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#BE185D] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-all cursor-pointer inline-flex items-center justify-center gap-3 active:scale-95 border border-white/40 shadow-[0_10px_35px_rgba(236,72,153,0.4)]"
          >
            <span>Enter The Roast Arena Mic</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-[11px] font-mono text-[#FDA4AF]/70 uppercase tracking-widest mt-4">
            NO SIGN-UP REQUIRED TO START • FEELINGS NOT REFUNDABLE
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 border-t border-white/10 bg-[#0B0207]/80 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#FDA4AF]/70">
          <div className="flex items-center gap-2 text-white font-bold">
            <Mic2 className="w-4 h-4 text-[#F472B6]" />
            <span>ROASTMASTER // NOMERCY DEV PORTAL</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/chat")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Stage Mic
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              VIP Pass
            </button>
            <span className="text-[#FDA4AF]/40">•</span>
            <span>Next.js 16 + pgvector + Gemini</span>
          </div>
        </div>
      </footer>
    </main>
  );
}