"use client";
// app/page.jsx — Roastmaster Minimal Glassmorphic Developer Portal
// Theme: Clean Baby Pink Liquid Glassmorphism matching /chat stage (Venom Goo removed)
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
} from "lucide-react";

// Curated scenarios for the minimal interactive preview
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

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [copiedHero, setCopiedHero] = useState(false);
  const [copiedTab, setCopiedTab] = useState(false);

  const scenario = PREVIEW_SCENARIOS[activeTab];

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
      <header className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        <nav className="liquid-glass rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl liquid-glass-pink flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm sm:text-base tracking-wider text-[#2D1C24] uppercase">
                ROASTMASTER
              </span>
              <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFE4E6]/90 border border-[#FDA4AF]/70 text-[#E11D48] text-[9px] font-black tracking-widest uppercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                <span>ON AIR</span>
              </div>
            </div>
          </Link>

          {/* Nav Items & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://www.npmjs.com/package/roastmaster-ai"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 liquid-glass-pill hover:liquid-glass text-[#836270] hover:text-[#BE185D] rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-[#EC4899]" />
              <span>npm v1.0.0</span>
            </a>

            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white rounded-xl px-4 py-1.5 sm:py-2 text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <span>Take The Mic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        {/* ── Hero Section (Minimal & Simple) ─────────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-[#BE185D] text-xs font-mono font-bold tracking-wider uppercase mb-5">
            <Radio className="w-3.5 h-3.5 text-[#E11D48] animate-pulse" />
            <span>UNFILTERED AI DEV STANDUP • CLI &amp; WEB</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-[#2D1C24] uppercase leading-[1.12]">
            Your code has sins. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#BE185D] via-[#EC4899] to-[#E11D48] bg-clip-text text-transparent">
              We roast them on stage.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-[#836270] max-w-xl mx-auto font-sans leading-relaxed">
            Tired of diplomatic PR comments? Roastmaster reviews your commits, dependencies, and architecture with razor-sharp standup comedy — paired with senior-staff constructive truth.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Primary /chat CTA */}
            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl font-mono text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all shadow-[0_8px_25px_rgba(236,72,153,0.32)]"
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
              ✓ Copied to clipboard! Run in any git repo on your machine.
            </p>
          )}
        </section>

        {/* ── Interactive Minimalist Preview Card ─────────────────────────── */}
        <section className="max-w-3xl mx-auto mb-16 sm:mb-20">
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
                  <span className="font-mono font-black text-xs sm:text-sm text-[#2D1C24] uppercase tracking-wide">
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

        {/* ── 3 Minimal Core Pillars ────────────────────────────────────────── */}
        <section className="mb-16 sm:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Feature 1 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <Terminal className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-mono font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                Instant CLI
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Run <code className="px-1.5 py-0.5 rounded bg-white/80 border border-[#FBCFE8]/70 text-[#BE185D] font-mono font-semibold text-[11px]">npx roastmaster-ai</code> in any repository with zero local installs. Audit git diffs before your team lead reviews them.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <Database className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-mono font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                RAG Document Analysis
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Upload architecture PDFs and specs in <code className="px-1.5 py-0.5 rounded bg-white/80 border border-[#FBCFE8]/70 text-[#BE185D] font-mono font-semibold text-[11px]">/chat</code>. Backed by PostgreSQL pgvector for grounded, context-aware roasts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="liquid-glass rounded-2xl p-5 sm:p-6 text-left shadow-xs">
              <div className="w-9 h-9 rounded-xl liquid-glass-pink flex items-center justify-center text-white mb-3.5 shadow-2xs">
                <Cpu className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-mono font-black text-sm text-[#2D1C24] uppercase tracking-wide">
                Gemini 2.5 Logic
              </h3>
              <p className="text-xs text-[#836270] mt-1.5 font-sans leading-relaxed">
                Dual-brain comedy engine delivering razor-sharp comedic timing paired with genuine senior-staff engineering architecture solutions.
              </p>
            </div>
          </div>
        </section>

        {/* ── Minimal Bottom Call to Action ─────────────────────────────────── */}
        <section className="text-center max-w-2xl mx-auto liquid-glass rounded-3xl p-7 sm:p-10 shadow-xs border border-white/80">
          <div className="w-12 h-12 rounded-2xl liquid-glass-pink flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <Flame className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-mono uppercase text-[#2D1C24] tracking-tight">
            Ready for your review?
          </h2>

          <p className="text-xs sm:text-sm text-[#836270] max-w-md mx-auto mt-2 mb-6 font-sans">
            Step up to the live web stage or roast your uncommitted git diff right from your local terminal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="liquid-glass-pink hover:opacity-95 text-white px-6 py-3 rounded-xl font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm"
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#2D1C24] font-bold">
            <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>ROASTMASTER AI</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/chat" className="hover:text-[#BE185D] transition-colors">
              Web Stage
            </Link>
            <a
              href="https://www.npmjs.com/package/roastmaster-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#BE185D] transition-colors flex items-center gap-1"
            >
              <span>npm</span>
              <ExternalLink className="w-3 h-3 text-[#EC4899]" />
            </a>
            <span className="text-[#FDA4AF]">•</span>
            <span>Next.js + pgvector + Gemini</span>
          </div>
        </div>
      </footer>
    </main>
  );
}