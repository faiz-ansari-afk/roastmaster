"use client";
// app/page.jsx — Roastmaster Developer Portal & Live Roast Arena Entrance
// Featuring Blackish-Pink Venom Goo Liquid Symbiote Background, Glassmorphism UI & Interactive Real CLI Simulator
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
  GitCommit,
  GitPullRequest,
  PackageCheck,
  Download,
} from "lucide-react";

// Real CLI Terminal Scenarios based on actual screenshots
const CLI_SCENARIOS = [
  {
    id: "roast-repo",
    tabTitle: "roastmaster -r",
    badge: "Repository Audit",
    command: "roastmaster -r",
    subtitle: "📦 Scanning Repository Context...",
    scannedDetails:
      'Project "roastmaster-ai" v1.0.0. Dependencies (18): [@anthropic-ai/sdk, @google/generative-ai, @langchain/textsplitters, @phosphor-icons/react, class-variance-authority, clsx, firebase, lucide-react, next, pdf-parse, pg, radix-ui, react, react-dom, shadcn...]. DevDependencies (8): [@tailwindcss/postcss, @types/node, @types/react, @types/react-dom, eslint, eslint-config-next, tailwindcss, typescript]. Scripts: [dev, build, start, lint].\nRecent commit: UI basic change (be14337)',
    cardTitle: "DUAL ICON SET IDENTITY CRISIS",
    category: "Frontend",
    severity: 6,
    severityBar: "██████░░░░",
    roast:
      "“Importing both Phosphor and Lucide icons in the same project is like wearing two different wristwatches to tell the exact same wrong time. Your bundle size thanks you for the extra weight.”",
    realTalk:
      "Pick a single icon library (Lucide is plenty) and tree-shake your imports. Keeping redundant icon suites wastes precious bundle budget and slows initial load times.",
  },
  {
    id: "roast-diff",
    tabTitle: "roastmaster --diff",
    badge: "Git Diff Pre-Commit",
    command: "roastmaster --diff",
    subtitle: "🔍 Analyzing Git Diff: 3 files touched",
    scannedDetails: null,
    cardTitle: "MARKDOWN OVER-ENGINEERING PANIC",
    category: "Git Sins",
    severity: 4,
    severityBar: "████░░░░░░",
    roast:
      "“Bro spent more time styling README badges than writing code, treating GitHub like a digital beauty pageant. Even your documentation has an identity crisis.”",
    realTalk:
      "Keep the README concise with quick install instructions and actual architecture diagrams instead of inflating badge counts.",
  },
  {
    id: "roast-file",
    tabTitle: "roastmaster -f package.json",
    badge: "Single File Inspect",
    command: "roastmaster -f package.json",
    subtitle: "📂 Inspecting file: package.json (65 lines)",
    scannedDetails: null,
    cardTitle: "NEXT.JS CLI IDENTITY CRISIS",
    category: "Dependencies",
    severity: 8,
    severityBar: "████████░░",
    roast:
      "“Bro crammed a Next.js web framework, Firebase, and a CLI binary into one package.json like he's stuffing a suitcase with bricks for a spirit airline flight.”",
    realTalk:
      "Separate your Next.js frontend and your CLI tool into a monorepo or two independent packages so your CLI users aren't downloading a massive React UI library just to run a terminal command.",
  },
  {
    id: "roast-jwt",
    tabTitle: "npx roastmaster [prompt]",
    badge: "Freestyle Query",
    command: 'npx roastmaster "I store plain text JWTs in localStorage"',
    subtitle: '🎯 Topic: "I store plain text JWTs in localStorage"',
    scannedDetails: null,
    cardTitle: "LOCAL STORAGE SESSION SUICIDE",
    category: "Security",
    severity: 9,
    severityBar: "█████████░",
    roast:
      "“Storing raw JWTs in localStorage is basically hanging your house keys with your home address on the front gate. Even a junior XSS script is going to treat your session tokens like a free buffet.”",
    realTalk:
      "Move your tokens to httpOnly, secure cookies so client-side JavaScript can't touch them, preventing catastrophic XSS credential theft.",
  },
  {
    id: "roast-help",
    tabTitle: "roastmaster --help",
    badge: "CLI Manual",
    command: "roastmaster --help",
    isManual: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeCliIndex, setActiveCliIndex] = useState(0);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedNpx, setCopiedNpx] = useState(false);

  const activeScenario = CLI_SCENARIOS[activeCliIndex];

  const handleEnterStage = () => {
    router.push("/chat");
  };

  const handleCopyCommand = (cmdText, setFn) => {
    navigator.clipboard?.writeText(cmdText);
    setFn(true);
    setTimeout(() => setFn(false), 2200);
  };

  const scrollToTerminal = () => {
    document
      .getElementById("cli-terminal-section")
      ?.scrollIntoView({ behavior: "smooth" });
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
                  v2.5 CLI &amp; WEB
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
              <Terminal className="w-3.5 h-3.5 text-[#F472B6]" />
              npm: roastmaster-ai
            </span>
            <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#FBCFE8] flex items-center gap-1.5 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-[#F472B6]" />
              Gemini 2.5 AI
            </span>
            <span className="px-3 py-1 rounded-full dark-liquid-glass-pill text-[#FBCFE8] flex items-center gap-1.5 border border-white/10">
              <Database className="w-3.5 h-3.5 text-[#F472B6]" />
              pgvector RAG
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
          {/* Live Marquee Badge with npm indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full dark-liquid-glass-pill border border-[#F472B6]/40 text-[#FDA4AF] text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_25px_rgba(244,114,182,0.25)]">
            <Radio className="w-3.5 h-3.5 text-[#F43F5E] animate-pulse" />
            <span>NOW ON NPM • TERMINAL CLI + LIVE COMEDY CELLAR</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase font-mono text-white leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            YOUR CODE{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F472B6] via-[#FB7185] to-[#FDA4AF] animate-pulse">
              SUCKS.
            </span>
            <br />
            ROAST IT IN YOUR TERMINAL.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-[#FBCFE8]/90 max-w-2xl mx-auto font-sans leading-relaxed">
            Tired of polite PR comments and passive-aggressive code reviews? Roastmaster is the unfiltered developer comedian powered by <span className="text-white font-bold">Google Gemini</span> &amp; <span className="text-white font-bold">pgvector RAG</span>. Run it in any repo to roast your commits before you push — plus senior-staff constructive truth.
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
              onClick={() => handleCopyCommand("npx roastmaster-ai --roast-repo", setCopiedCli)}
              className="px-5 py-4 rounded-2xl dark-liquid-glass-card hover:bg-white/10 text-xs sm:text-sm font-mono text-[#FBCFE8] border border-white/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              title="Copy terminal command"
            >
              <Terminal className="w-4 h-4 text-[#F472B6]" />
              <span>npx roastmaster-ai --roast-repo</span>
              {copiedCli ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-[#FDA4AF]/70" />
              )}
            </button>

            {/* Jump to Terminal Simulator */}
            <button
              onClick={scrollToTerminal}
              className="px-4 py-4 rounded-2xl dark-liquid-glass-pill hover:text-white text-xs sm:text-sm font-mono text-[#FDA4AF]/80 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>See CLI Screenshots ↓</span>
            </button>
          </div>

          {copiedCli && (
            <p className="mt-3 text-xs font-mono text-emerald-400 tracking-wide animate-pulse">
              ✓ Copied to clipboard! Run in any folder on your machine.
            </p>
          )}
        </div>

        {/* ── LIVE CLI TERMINAL SIMULATOR SECTION (From Real Screenshots) ────── */}
        <section id="cli-terminal-section" className="mb-24 scroll-mt-24">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full dark-liquid-glass-pill text-[#F472B6] text-[11px] font-mono font-bold tracking-widest uppercase mb-2">
              <Terminal className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>INTERACTIVE CLI TERMINAL ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-mono text-white uppercase tracking-tight">
              ROASTMASTER IN YOUR SHELL
            </h2>
            <p className="text-xs sm:text-sm text-[#FBCFE8]/80 font-sans max-w-xl mx-auto mt-1">
              Select a command below to preview the actual real-time terminal outputs produced by the CLI.
            </p>
          </div>

          {/* Terminal Window Container */}
          <div className="max-w-4xl mx-auto rounded-3xl dark-liquid-glass p-1.5 sm:p-2 border border-white/20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Window Title Bar */}
            <div className="bg-[#190412]/90 rounded-2xl p-3 sm:px-4 sm:py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              {/* Traffic Lights + Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block" />
                </div>
                <span className="font-mono text-xs text-[#FDA4AF]/70 font-bold hidden sm:inline">
                  PowerShell — roastmaster-ai v2.5 CLI
                </span>
              </div>

              {/* Quick Copy Command for Active Tab */}
              <button
                onClick={() => handleCopyCommand(activeScenario.command, setCopiedNpx)}
                className="px-3 py-1.5 rounded-lg dark-liquid-glass-pill text-[11px] font-mono text-[#FBCFE8] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-white/15"
              >
                <Terminal className="w-3 h-3 text-[#F472B6]" />
                <span className="font-bold">{activeScenario.command}</span>
                {copiedNpx ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#FDA4AF]/60" />
                )}
              </button>
            </div>

            {/* Terminal Command Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 sm:p-3 bg-[#11020C]/90 border-b border-white/10 overflow-x-auto">
              {CLI_SCENARIOS.map((sc, idx) => {
                const isActive = activeCliIndex === idx;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setActiveCliIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-gradient-to-r from-[#EC4899] to-[#BE185D] text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-white/30"
                        : "dark-liquid-glass-pill text-[#FDA4AF]/70 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span>{sc.tabTitle}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      [{sc.badge}]
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Terminal Body Screen */}
            <div className="bg-[#0B0207]/95 p-4 sm:p-7 font-mono text-xs sm:text-sm text-[#FCE7F3] leading-relaxed overflow-x-auto rounded-b-2xl">
              {/* Command Prompt Line */}
              <div className="flex items-center gap-2 text-white mb-4">
                <span className="text-[#38BDF8]">●</span>
                <span className="text-white font-bold">PS D:\Faiz\freelance\nomercy&gt;</span>
                <span className="text-[#F472B6] font-bold">{activeScenario.command}</span>
              </div>

              {/* ASCII Logo in Glowing Neon Pink */}
              <pre className="text-[10px] sm:text-[11px] leading-[1.15] text-[#F472B6] font-bold select-none drop-shadow-[0_0_12px_rgba(244,114,182,0.4)] my-3">
{`  ____   ___     _    ____ _____ __  __    _    ____ _____ _____ ____
 |  _ \\ / _ \\   / \\  / ___|_   _|  \\/  |  / \\  / ___|_   _| ____|  _ \\
 | |_) | | | | / _ \\ \\___ \\ | | | |\\/| | / _ \\ \\___ \\ | | |  _| | |_) |
 |  _ <| |_| |/ ___ \\ ___) || | | |  | |/ ___ \\ ___) || | | |___|  _ <
 |_| \\_\\\\___//_/   \\_\\____/ |_| |_|  |_/_/   \\_\\____/ |_| |_____|_| \\_\\`}
              </pre>

              {/* Sub-header */}
              <div className="text-[11px] font-bold tracking-wider my-3 flex items-center gap-2">
                <span className="text-[#E11D48]">LIVE DEV STANDUP</span>
                <span className="text-white/40">•</span>
                <span className="text-[#EC4899]">ZERO MERCY CODE CRITIQUE</span>
                <span className="text-white/40">•</span>
                <span className="text-amber-300">v2.5 CLI</span>
              </div>

              {/* Special View for Help Manual */}
              {activeScenario.isManual ? (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-4 text-xs">
                  <div>
                    <div className="text-[#FDA4AF] font-bold uppercase mb-1">USAGE:</div>
                    <div className="text-[#F472B6]">npx roastmaster [options]</div>
                    <div className="text-[#F472B6]">npx roastmaster-ai --roast-repo</div>
                    <div className="text-white">roastmaster -f src/components/App.tsx</div>
                  </div>

                  <div>
                    <div className="text-[#FDA4AF] font-bold uppercase mb-1">COMMANDS &amp; FLAGS:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 text-xs">
                      <div className="sm:col-span-4 text-[#38BDF8]">-r, --roast-repo</div>
                      <div className="sm:col-span-8 text-[#FBCFE8]/80">Inspect git status, recent commit, and package.json to roast repository</div>
                      <div className="sm:col-span-4 text-[#38BDF8]">-d, --diff</div>
                      <div className="sm:col-span-8 text-[#FBCFE8]/80">Roast uncommitted/staged git diff changes before pushing</div>
                      <div className="sm:col-span-4 text-[#38BDF8]">-f, --file &lt;path&gt;</div>
                      <div className="sm:col-span-8 text-[#FBCFE8]/80">Roast a specific code file directly</div>
                      <div className="sm:col-span-4 text-[#38BDF8]">-h, --help</div>
                      <div className="sm:col-span-8 text-[#FBCFE8]/80">Show this comedy manual and exit</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[#FDA4AF] font-bold uppercase mb-1">EXAMPLES:</div>
                    <div className="text-white/60"># Roast the current repository</div>
                    <div className="text-[#F472B6]">$ npx roastmaster --roast-repo</div>
                    <div className="text-white/60 mt-1"># Roast your pending git diff before code review</div>
                    <div className="text-[#F472B6]">$ npx roastmaster --diff</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Context Subtitle & Scanned info */}
                  {activeScenario.subtitle && (
                    <div className="my-3 text-xs sm:text-[13px] text-[#38BDF8] font-bold flex items-center gap-2">
                      <span>{activeScenario.subtitle}</span>
                    </div>
                  )}

                  {activeScenario.scannedDetails && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-[#FBCFE8]/75 leading-relaxed my-3 font-mono">
                      {activeScenario.scannedDetails}
                    </div>
                  )}

                  {/* The Exact Boxed ANSI Card matching the screenshots */}
                  <div className="mt-5 rounded-2xl border-2 border-[#F472B6] bg-[#160311]/90 shadow-[0_0_30px_rgba(244,114,182,0.25)] overflow-hidden">
                    {/* Header inside Card */}
                    <div className="p-3 sm:p-4 border-b border-[#F472B6]/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎙️</span>
                        <span className="font-mono font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                          {activeScenario.cardTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#FDA4AF] font-bold flex items-center gap-1">
                          🏷️ {activeScenario.category}
                        </span>
                        <span className="text-white/30">•</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>🔥</span>
                          <span className="text-[#E11D48] tracking-tighter">
                            {activeScenario.severityBar}
                          </span>
                          <span className="text-[#F472B6]">
                            {activeScenario.severity}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Savage Roast Punchline */}
                    <div className="p-4 sm:p-5 text-xs sm:text-sm font-sans font-semibold text-white leading-relaxed border-b border-[#F472B6]/40 bg-black/30">
                      {activeScenario.roast}
                    </div>

                    {/* Backstage Real Talk (Constructive Fix) */}
                    <div className="p-4 sm:p-5 bg-[#200518]/90 text-xs sm:text-sm leading-relaxed">
                      <div className="font-mono font-bold text-[#FBBF24] mb-1.5 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                        <span>💡</span>
                        <span>BACKSTAGE REAL TALK (CONSTRUCTIVE FIX):</span>
                      </div>
                      <p className="text-[#34D399] font-sans">
                        {activeScenario.realTalk}
                      </p>
                    </div>
                  </div>

                  {/* Terminal Footer */}
                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#FDA4AF]/60 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                      <span>Web Stage:</span>
                      <a
                        href="https://roastmaster-phi.vercel.app/chat"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#F472B6] hover:underline font-bold"
                      >
                        https://roastmaster-phi.vercel.app/chat
                      </a>
                    </span>
                    <span>Roastmaster CLI v2.5</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── 4 Core CLI Workflows Feature Grid ─────────────────────────────── */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-white uppercase tracking-tight">
              HOW TO USE IT IN YOUR WORKFLOW
            </h2>
            <p className="text-xs sm:text-sm text-[#FBCFE8]/75 font-sans mt-1">
              From pre-commit Git checks to full repository architecture roasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 */}
            <div className="dark-liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#BE185D] flex items-center justify-center text-white mb-4 shadow-[0_0_15px_rgba(236,72,153,0.35)]">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <h3 className="font-mono font-black text-base text-white uppercase">
                  Repo Audit (`-r`)
                </h3>
                <p className="font-mono text-xs text-[#F472B6] mt-0.5 mb-2 font-semibold">
                  `roastmaster --roast-repo`
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Scans dependencies, package bloat, recent commits, and dirty files to critique your whole project architecture.
                </p>
              </div>
              <button
                onClick={() => handleCopyCommand("roastmaster --roast-repo", setCopiedCli)}
                className="mt-4 pt-3 border-t border-white/10 font-mono text-[11px] text-[#FDA4AF] hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Copy Command</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="dark-liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white mb-4 shadow-[0_0_15px_rgba(139,92,246,0.35)]">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <h3 className="font-mono font-black text-base text-white uppercase">
                  Pre-Commit Diff (`-d`)
                </h3>
                <p className="font-mono text-xs text-[#C4B5FD] mt-0.5 mb-2 font-semibold">
                  `roastmaster --diff`
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Roasts only your uncommitted or staged changes so you can clean up embarrassing hacks before opening a PR.
                </p>
              </div>
              <button
                onClick={() => handleCopyCommand("roastmaster --diff", setCopiedCli)}
                className="mt-4 pt-3 border-t border-white/10 font-mono text-[11px] text-[#C4B5FD] hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Copy Command</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="dark-liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white mb-4 shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-mono font-black text-base text-white uppercase">
                  Single File Deep Dive
                </h3>
                <p className="font-mono text-xs text-amber-300 mt-0.5 mb-2 font-semibold">
                  `roastmaster -f &lt;file&gt;`
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Target a specific 600-line React component, messy SQL migration, or suspicious utility script directly.
                </p>
              </div>
              <button
                onClick={() => handleCopyCommand("roastmaster -f src/app/page.jsx", setCopiedCli)}
                className="mt-4 pt-3 border-t border-white/10 font-mono text-[11px] text-amber-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Copy Command</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4 */}
            <div className="dark-liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white mb-4 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-mono font-black text-base text-white uppercase">
                  Zero Install NPX
                </h3>
                <p className="font-mono text-xs text-emerald-300 mt-0.5 mb-2 font-semibold">
                  `npx roastmaster-ai`
                </p>
                <p className="text-xs text-[#FBCFE8]/80 font-sans leading-relaxed">
                  Runs instantly with 0 local dependencies. Downloads a lightweight 10.4 kB tarball and exits immediately.
                </p>
              </div>
              <button
                onClick={() => handleCopyCommand("npm install -g roastmaster-ai", setCopiedCli)}
                className="mt-4 pt-3 border-t border-white/10 font-mono text-[11px] text-emerald-300 hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span>Global Install</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Real Tech Stack Showcase ─────────────────────────────────────── */}
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

        {/* ── Final Call to Action ─────────────────────────────────────────── */}
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
            Available as an instant CLI or interactive web stage. Free VIP front-row seating, dynamic titles, and vector-backed document roasts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleEnterStage}
              className="px-10 py-5 rounded-2xl font-mono text-base font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#BE185D] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-all cursor-pointer inline-flex items-center justify-center gap-3 active:scale-95 border border-white/40 shadow-[0_10px_35px_rgba(236,72,153,0.4)]"
            >
              <span>Enter The Web Stage (/chat)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleCopyCommand("npx roastmaster-ai --roast-repo", setCopiedCli)}
              className="px-8 py-5 rounded-2xl dark-liquid-glass-card hover:bg-white/10 font-mono text-sm text-[#FBCFE8] border border-white/30 transition-all cursor-pointer inline-flex items-center gap-2.5 active:scale-95"
            >
              <Terminal className="w-4 h-4 text-[#F472B6]" />
              <span>npx roastmaster-ai --roast-repo</span>
              <Copy className="w-4 h-4 text-[#FDA4AF]/60" />
            </button>
          </div>

          <p className="text-[11px] font-mono text-[#FDA4AF]/70 uppercase tracking-widest mt-5">
            NO SIGN-UP REQUIRED • COMPATIBLE WITH MACOS, LINUX, AND WINDOWS
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 border-t border-white/10 bg-[#0B0207]/80 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#FDA4AF]/70">
          <div className="flex items-center gap-2 text-white font-bold">
            <Mic2 className="w-4 h-4 text-[#F472B6]" />
            <span>ROASTMASTER // NOMERCY DEV PORTAL &amp; CLI</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/chat")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Web Stage
            </button>
            <a
              href="https://www.npmjs.com/package/roastmaster-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors cursor-pointer"
            >
              npm: roastmaster-ai
            </a>
            <span className="text-[#FDA4AF]/40">•</span>
            <span>Next.js 16 + pgvector + Gemini 2.5</span>
          </div>
        </div>
      </footer>
    </main>
  );
}