"use client";
// components/ChatWindow.jsx — The Live Standup Comedy Roast Stage Deck (Baby Pink Edition + Pure Text-by-Text Reveal)
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createSession,
  getMessages,
  saveCompletedExchange,
  updateSessionTitle,
  formatSessionDisplayTitle,
} from "@/lib/firestore";
import {
  Flame,
  User,
  Send,
  Loader2,
  ArrowRight,
  Tag,
  Gauge,
  Lightbulb,
  Copy,
  Check,
  Code2,
  Mic2,
  Sparkles,
  BookOpen,
  Laugh,
  Radio,
  Clock,
  Paperclip,
  FileText,
  X,
  FileCheck,
  ChevronDown,
  Pencil,
  Plus,
} from "lucide-react";

// ── Helpers for structured data parsing & severity metadata ───────────────────
function parseRoastData(raw) {
  if (!raw) return { roast: "", severity: null, category: null, suggestion: "", ragSources: null };

  if (typeof raw === "object") {
    return {
      roast: raw.roast || raw.reply || "",
      severity: typeof raw.severity === "number" ? raw.severity : null,
      category: raw.category || null,
      suggestion: raw.suggestion || "",
      ragSources: Array.isArray(raw.ragSources) ? raw.ragSources : null,
    };
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          return {
            roast: parsed.roast || parsed.reply || "",
            severity: typeof parsed.severity === "number" ? parsed.severity : null,
            category: parsed.category || null,
            suggestion: parsed.suggestion || "",
            ragSources: Array.isArray(parsed.ragSources) ? parsed.ragSources : null,
          };
        }
      } catch {
        // Fallback to raw text
      }
    }
    return {
      roast: raw,
      severity: null,
      category: null,
      suggestion: "",
      ragSources: null,
    };
  }

  return { roast: String(raw), severity: null, category: null, suggestion: "", ragSources: null };
}

function getSeverityBadge(severity) {
  if (severity == null) return null;
  const num = Math.min(10, Math.max(1, severity));
  if (num <= 3) {
    return {
      label: "Mild Singe",
      num,
      colorClass: "bg-[#FDF2F8] text-[#DB2777] border-[#FBCFE8]",
      meterClass: "bg-[#F472B6]",
      flameClass: "text-[#EC4899]",
    };
  }
  if (num <= 7) {
    return {
      label: "Third-Degree Burn",
      num,
      colorClass: "bg-[#FCE7F3] text-[#BE185D] border-[#F9A8D4]",
      meterClass: "bg-[#EC4899]",
      flameClass: "text-[#DB2777]",
    };
  }
  return {
    label: "Total Incineration",
    num,
    colorClass: "bg-[#FFE4E6] text-[#E11D48] border-[#FDA4AF]",
    meterClass: "bg-[#E11D48]",
    flameClass: "text-[#E11D48]",
  };
}

// ── Pure Text-By-Text (Hidden Ahead of Time) Reveal Hook ──────────────────────
function useCharacterReveal(text, isNew = false) {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);
  const [isSpeaking, setIsSpeaking] = useState(isNew);

  useEffect(() => {
    if (!isNew || !text) {
      setDisplayedText(text);
      setIsSpeaking(false);
      return;
    }

    setDisplayedText("");
    setIsSpeaking(true);
    let index = 0;

    const timer = setInterval(() => {
      index += 2; // reveals 2 characters per 18ms for fluid, natural speaking
      if (index >= text.length) {
        setDisplayedText(text);
        setIsSpeaking(false);
        clearInterval(timer);
      } else {
        setDisplayedText(text.slice(0, index));
      }
    }, 18);

    return () => clearInterval(timer);
  }, [text, isNew]);

  const skipReveal = () => {
    setDisplayedText(text);
    setIsSpeaking(false);
  };

  return { displayedText, isSpeaking, skipReveal };
}

// ── Collapsible RAG Sources Accordion (Initially Collapsed) ───────────────────
function RagSourcesAccordion({ sources }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3.5 border-t border-[#FCE7F3]/80 animate-in fade-in duration-400">
      <div className="liquid-glass-subtle text-[#2D1C24] rounded-2xl p-3 sm:p-3.5 transition-all">
        {/* Accordion Toggle Header — Collapsed by default */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="w-full flex items-center justify-between text-left cursor-pointer group focus:outline-none"
          aria-expanded={isExpanded}
          title={isExpanded ? "Click to collapse excerpts" : "Click to expand excerpts"}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-white/80 border border-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-3 h-3 text-[#EC4899]" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-[#BE185D] uppercase font-mono truncate">
              GROUNDED IN PDF (AIVEN PGVECTOR):
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-mono text-[#BE185D] bg-white/85 border border-white/90 px-2 py-0.5 rounded-full font-bold shadow-2xs">
              {sources.length} EXCERPTS RETRIEVED
            </span>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[#836270] group-hover:text-[#BE185D] group-hover:bg-white/80 transition-colors">
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#EC4899] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                  }`}
              />
            </div>
          </div>
        </button>

        {/* Collapsible Content — Initially Collapsed */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-white/70 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {sources.map((src, sIdx) => (
              <div
                key={sIdx}
                className="bg-white/85 backdrop-blur-xs p-2.5 rounded-xl border border-white/90 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 text-[#9D174D]">
                  <span className="flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-md">
                    <FileCheck className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
                    <span className="truncate">{src.fileName}</span>
                    <span className="text-[#836270] font-normal shrink-0">
                      (Chunk #{src.chunkIndex + 1})
                    </span>
                  </span>
                  <span className="bg-[#FDF2F8]/90 text-[#BE185D] border border-[#FBCFE8] px-1.5 py-0.5 rounded shrink-0">
                    {(src.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="text-[#4A2D3C] text-[11px] leading-relaxed italic line-clamp-3 pl-5">
                  "{src.snippet}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── On-Stage Headliner Roast Card (Baby Pink Edition + Text-by-Text Reveal) ───
function BotStageCard({ content, isStreaming, isNew = false }) {
  const [copied, setCopied] = useState(false);
  const [applauseCount, setApplauseCount] = useState(42);
  const [hasApplauded, setHasApplauded] = useState(false);
  const [tomatoCount, setTomatoCount] = useState(0);
  const [hasThrownTomato, setHasThrownTomato] = useState(false);

  const data = parseRoastData(content);
  const severityInfo = getSeverityBadge(data.severity);

  // Pure text-by-text progressive character reveal (completely hidden ahead of time)
  const { displayedText, isSpeaking, skipReveal } = useCharacterReveal(
    data.roast,
    isNew
  );

  const handleCopy = () => {
    let textToCopy = `🔥 RoastMaster Standup Roast:\n${data.roast}`;
    if (data.severity != null) {
      textToCopy += `\n\nRoast Heat: ${data.severity}/10 (${severityInfo?.label || "Brutal"})`;
    }
    if (data.category) {
      textToCopy += `\nCategory: ${data.category}`;
    }
    if (data.suggestion) {
      textToCopy += `\n\n💡 Backstage Real Talk:\n${data.suggestion}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplaud = () => {
    setApplauseCount((c) => c + 1);
    setHasApplauded(true);
  };

  const handleTomato = () => {
    setTomatoCount((c) => c + 1);
    setHasThrownTomato(true);
  };

  return (
    <div
      onClick={isSpeaking ? skipReveal : undefined}
      className={`relative group/card w-full max-w-3xl my-3 transition-all ${isSpeaking ? "cursor-pointer" : ""
        }`}
      title={isSpeaking ? "Click to reveal punchline immediately" : ""}
    >
      {/* Soft Baby Pink Stage Dais Halo & Caustic Refraction */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#F472B6]/25 via-[#EC4899]/20 to-[#FDA4AF]/25 rounded-3xl blur-xl opacity-80 group-hover/card:opacity-100 transition duration-500 -z-10" />

      {/* Main Stage Card Dais — Liquid Glass Monolith */}
      <div className="relative liquid-glass rounded-3xl p-4 sm:p-6 text-[#2D1C24] overflow-hidden">
        {/* Stage Header: Audio Frequency Equalizer + Mic Status + Burn Gauge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-white/70">
          {/* Left: Stage Mic + Live Dancing Audio Waves */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/80 border border-white/95 flex items-center justify-center shadow-2xs">
              <Mic2 className="w-4 h-4 text-[#EC4899]" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-[#BE185D] uppercase font-mono">
                    HEADLINER ON STAGE
                  </span>
                </div>
                <span className="text-[10px] text-[#836270] font-medium tracking-tight">
                  {isSpeaking ? (
                    <span className="text-[#EC4899] font-bold animate-pulse">
                      SPEAKING INTO MIC...
                    </span>
                  ) : (
                    "LIVE CROWD WORK"
                  )}
                </span>
              </div>

              {/* 5-Bar Dancing Audio Equalizer Visualizer — Liquid Glass */}
              <div className="flex items-end gap-0.5 h-4 ml-1 px-1.5 py-0.5 bg-white/60 rounded-md border border-white/80 backdrop-blur-xs">
                <span
                  className={`w-0.5 bg-[#F472B6] rounded-full ${isSpeaking ? "animate-sound-1" : "h-1"
                    }`}
                />
                <span
                  className={`w-0.5 bg-[#EC4899] rounded-full ${isSpeaking ? "animate-sound-2" : "h-2"
                    }`}
                />
                <span
                  className={`w-0.5 bg-[#F472B6] rounded-full ${isSpeaking ? "animate-sound-3" : "h-3"
                    }`}
                />
                <span
                  className={`w-0.5 bg-[#EC4899] rounded-full ${isSpeaking ? "animate-sound-4" : "h-1.5"
                    }`}
                />
                <span
                  className={`w-0.5 bg-[#F472B6] rounded-full ${isSpeaking ? "animate-sound-5" : "h-2"
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Right: Category Marquee & Heat Badge — Liquid Glass Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {data.category && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg liquid-glass-pill text-[#9D174D] text-[11px] font-mono font-bold">
                <Tag className="w-3 h-3 text-[#EC4899]" />
                <span className="uppercase">{data.category}</span>
              </div>
            )}

            {severityInfo && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black font-mono tracking-wider liquid-glass-pill ${severityInfo.colorClass}`}
              >
                <Flame className={`w-3.5 h-3.5 ${severityInfo.flameClass}`} />
                <span>
                  {severityInfo.label.toUpperCase()} • {data.severity}/10
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Severity Visual Bar — COMPLETELY HIDDEN until speech finishes */}
        {!isSpeaking && severityInfo && (
          <div className="mb-4 liquid-glass-subtle p-2.5 rounded-xl border border-white/80 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#836270] mb-1.5 font-mono">
              <span className="flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${severityInfo.flameClass}`} />
                <span>DAMAGE METER:</span>
                <span className="text-[#2D1C24] font-bold">
                  {severityInfo.label}
                </span>
              </span>
              <span className="text-[#BE185D] font-bold">
                {data.severity}/10 HEAT
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1 h-2 w-full">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-500 ${idx < data.severity
                    ? `${severityInfo.meterClass} shadow-[0_0_6px_rgba(236,72,153,0.35)]`
                    : "bg-[#FCE7F3]/70"
                    }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* The Standup Comedy Punchline: Revealed Text-by-Text (Hidden Ahead) */}
        <div className="relative pl-3.5 border-l-2 border-[#EC4899] my-3.5">
          <p className="text-[15px] sm:text-base leading-relaxed font-medium text-[#2D1C24] tracking-normal whitespace-pre-wrap break-words font-sans min-h-[28px]">
            "{displayedText}"
            {(isSpeaking || isStreaming) && (
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 18,
                  background: "#EC4899",
                  marginLeft: 4,
                  verticalAlign: "middle",
                  borderRadius: 2,
                  animation: "cursorBlink 0.6s steps(1) infinite",
                }}
              />
            )}
          </p>
          {isSpeaking && (
            <p className="text-[10px] text-[#9D7889] mt-1.5 font-mono italic">
              (click card to reveal punchline immediately)
            </p>
          )}
        </div>

        {/* 📄 The Grounding Sources from Aiven pgvector — Collapsible Accordion */}
        {!isSpeaking && data.ragSources && data.ragSources.length > 0 && (
          <RagSourcesAccordion sources={data.ragSources} />
        )}

        {/* Backstage Real Talk (Actually Improve) — Liquid Glass Pink Soft */}
        {!isSpeaking && data.suggestion && (
          <div className="mt-4 pt-3.5 border-t border-white/70 animate-in fade-in duration-400">
            <div className="liquid-glass-pink-soft rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#9D174D] tracking-wider uppercase font-mono mb-1.5">
                <Lightbulb className="w-4 h-4 text-[#EC4899]" />
                <span>Backstage Real Talk (Actually Improve):</span>
              </div>
              <div className="text-xs sm:text-sm text-[#4A2D3C] leading-relaxed whitespace-pre-wrap break-words">
                {data.suggestion}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Crowd Reactions Bar — Liquid Glass Controls */}
        {!isSpeaking && !isStreaming && data.roast && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-white/70 animate-in fade-in duration-300">
            {/* Left: Audience Reactions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplaud}
                className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${hasApplauded
                  ? "liquid-glass-pink text-white shadow-xs"
                  : "liquid-glass-pill text-[#836270] hover:text-[#2D1C24]"
                  }`}
                title="Applaud the roast!"
              >
                <span>👏</span>
                <span>{applauseCount}</span>
              </button>

              <button
                onClick={handleTomato}
                className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${hasThrownTomato
                  ? "bg-[#FFE4E6] border border-[#FDA4AF] text-[#E11D48] shadow-xs"
                  : "liquid-glass-pill text-[#836270] hover:text-[#2D1C24]"
                  }`}
                title="Throw a tomato at the stage!"
              >
                <span>🍅</span>
                <span>{tomatoCount > 0 ? `${tomatoCount} splats` : "Boo"}</span>
              </button>
            </div>

            {/* Right: Steal Joke (Copy) — Liquid Glass Pill */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#836270] hover:text-[#2D1C24] liquid-glass-pill px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              title="Copy roast & comedian notes"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">JOKE STOLEN!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#EC4899]" />
                  <span>Steal Joke</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ── Code Block & Language Detection Helpers ──────────────────────────────────
function detectLanguage(code) {
  if (!code) return "code";
  const trimmed = code.trim();
  if (/^(import|export|const|let|var|function|async|console\.)/m.test(trimmed) || /=>/.test(trimmed)) {
    if (/<[a-zA-Z]+/.test(trimmed)) return "jsx";
    return "javascript";
  }
  if (/^(def |class |print\(|elif |import numpy|import pandas)/m.test(trimmed)) return "python";
  if (/^(public class|System\.out\.println|private void)/m.test(trimmed)) return "java";
  if (/<(\!DOCTYPE|html|head|body|div|p|span|table)/i.test(trimmed)) return "html";
  if (/(\{|\})[\s\S]*([a-zA-Z-]+:\s*[^;]+;)/.test(trimmed)) return "css";
  if (/^(SELECT |INSERT INTO|UPDATE |DELETE FROM|CREATE TABLE)/im.test(trimmed)) return "sql";
  if (/^(go func|package main|func )/m.test(trimmed)) return "go";
  if (/^(#include |int main\()/m.test(trimmed)) return "c++";
  if (/^(docker|FROM |RUN |CMD )/m.test(trimmed)) return "dockerfile";
  if (/^(\$ |#!\/bin\/bash|npm |yarn |pnpm |git )/m.test(trimmed)) return "bash";
  if (/^(\{|\}|\[|\])/.test(trimmed) && trimmed.includes(":")) return "json";
  return "code";
}

function parseMessageWithCodeBlocks(text) {
  if (!text || typeof text !== "string") return [];

  // Matches ```lang\ncode``` or unclosed ```lang\ncode at end
  const regex = /```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)(?:```|$)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const normalText = text.slice(lastIndex, match.index);
      if (normalText) {
        parts.push({ type: "text", content: normalText });
      }
    }

    const rawLang = match[1]?.trim() || "";
    const rawCode = match[2] || "";

    if (match[0].includes("```")) {
      const trimmedCode = rawCode.replace(/\n$/, "");
      parts.push({
        type: "code",
        language: rawLang || detectLanguage(trimmedCode),
        code: trimmedCode,
      });
    }

    lastIndex = regex.lastIndex;
    if (!match[0].endsWith("```") && lastIndex === text.length) {
      break;
    }
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push({ type: "text", content: remaining });
    }
  }

  if (parts.length === 0 && text) {
    parts.push({ type: "text", content: text });
  }

  return parts;
}

function FormattedTextSegment({ content }) {
  if (!content) return null;
  const parts = content.split(/(`[^`\n]+`)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          const inline = part.slice(1, -1);
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-black/40 text-[#FFE4E6] font-mono text-[12px] sm:text-[13px] border border-white/20 font-semibold inline-block"
            >
              {inline}
            </code>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

function CodeBlock({ code, language = "", inBubble = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e?.stopPropagation?.();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = (language || "code").toLowerCase();

  return (
    <div
      className={`my-2 w-full max-w-full min-w-0 rounded-xl sm:rounded-2xl overflow-hidden border font-mono text-left shadow-lg transition-all ${inBubble
          ? "bg-[#181016] border-white/25 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
          : "bg-[#1C121A] border-[#F472B6]/30 shadow-[0_4px_16px_rgba(244,114,182,0.15)]"
        }`}
    >
      {/* Code Header Bar */}
      <div
        className={`flex items-center justify-between px-3 sm:px-4 py-1.5 border-b text-xs ${inBubble
            ? "bg-[#251522] border-white/15 text-[#FCE7F3]"
            : "bg-[#281724] border-[#F472B6]/25 text-[#F9A8D4]"
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
          <span className="text-[11px] font-bold tracking-wider uppercase font-mono text-[#F472B6] truncate">
            {displayLang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 text-[10px] font-mono font-medium transition-all cursor-pointer active:scale-95 shrink-0"
          title="Copy code to clipboard"
          aria-label="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#34D399]" />
              <span className="text-[#34D399] font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#F472B6]" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body — Smooth Horizontal Scrolling on Mobile */}
      <pre className="p-3 sm:p-4 overflow-x-auto max-w-full min-w-0 text-xs sm:text-[13px] leading-relaxed text-[#FDF2F8] font-mono selection:bg-[#EC4899] selection:text-white">
        <code className="block w-max min-w-full font-mono">{code}</code>
      </pre>
    </div>
  );
}

// ── VIP Front-Row Heckler Card (User Message with Rich Code Block Rendering) ──
function UserHecklerCard({ content }) {
  const parts = parseMessageWithCodeBlocks(content);
  const hasCode = parts.some((p) => p.type === "code");

  return (
    <div className="flex items-start gap-2 sm:gap-3 flex-row-reverse w-full max-w-[90%] sm:max-w-2xl ml-auto my-3 min-w-0">
      {/* Heckler Badge Icon — Liquid Glass Pink */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl liquid-glass-pink text-white flex items-center justify-center shrink-0 mt-0.5">
        <User className="w-4 h-4 text-white" />
      </div>

      {/* Heckler Speech Bubble — Liquid Glass Pink */}
      <div className="flex flex-col items-end flex-1 min-w-0 max-w-full">
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#BE185D] uppercase bg-white/50 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/80">
            VIP FRONT ROW • TABLE #01
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse" />
        </div>
        <div className="w-full max-w-full min-w-0 overflow-hidden px-3.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-xs text-sm sm:text-[15px] leading-relaxed liquid-glass-pink text-white break-words font-medium">
          {!hasCode ? (
            <div className="whitespace-pre-wrap leading-relaxed break-words">
              <FormattedTextSegment content={content} />
            </div>
          ) : (
            <div className="space-y-2 text-left w-full min-w-0 max-w-full">
              {parts.map((part, idx) => {
                if (part.type === "code") {
                  return (
                    <CodeBlock
                      key={idx}
                      code={part.code}
                      language={part.language}
                      inBubble={true}
                    />
                  );
                }
                const trimmed = part.content?.trim();
                if (!trimmed) return null;
                return (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed break-words">
                    <FormattedTextSegment content={part.content} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isStreaming, isNew = false }) {
  const isUser = message.role === "user";

  if (!isUser) {
    return (
      <BotStageCard
        content={message.content}
        isStreaming={isStreaming}
        isNew={isNew}
      />
    );
  }

  return <UserHecklerCard content={message.content} />;
}

// ── Main Stage Arena Deck (Baby Pink Theme) ───────────────────────────────────
export default function ChatWindow({ sessionId, onSessionCreated, onShowAuth }) {
  const { user, isGuest } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [sessionTitle, setSessionTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const editTitleInputRef = useRef(null);
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const sessionCreatedLocallyRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const mobileToolsRef = useRef(null);
  const mobileToolsBtnRef = useRef(null);

  // Close mobile action dropdown when clicking outside
  useEffect(() => {
    if (!mobileToolsOpen) return;
    const handleClickOutside = (e) => {
      if (
        mobileToolsRef.current &&
        !mobileToolsRef.current.contains(e.target) &&
        !mobileToolsBtnRef.current?.contains(e.target)
      ) {
        setMobileToolsOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [mobileToolsOpen]);

  // Check if code block is currently being typed in the textarea
  const hasCodeBlockInInput = useMemo(() => {
    return input.includes("```");
  }, [input]);

  const loadHistory = useCallback(async (sidToLoad) => {
    if (!user || isGuest || !sidToLoad) return;
    setLoadingHistory(true);
    try {
      const msgs = await getMessages(user.uid, sidToLoad);
      const loadedMsgs = (msgs || []).map((m) => ({ ...m, isNew: false }));
      setMessages(loadedMsgs);

      // Infer dynamic title from existing session messages
      if (loadedMsgs.length > 0) {
        const firstAssistant = loadedMsgs.find((m) => m.role === "assistant" && m.content);
        const firstUser = loadedMsgs.find((m) => m.role === "user" && m.content);

        if (firstAssistant?.content && typeof firstAssistant.content === "object" && firstAssistant.content.title) {
          setSessionTitle(firstAssistant.content.title);
        } else if (firstAssistant?.content && typeof firstAssistant.content === "object" && firstAssistant.content.category) {
          setSessionTitle(`${firstAssistant.content.category} Roast Set`);
        } else if (firstUser?.content && typeof firstUser.content === "string") {
          const clean = firstUser.content
            .replace(/```[a-zA-Z0-9_-]*/g, "")
            .replace(/```/g, "")
            .replace(/^(roast|can you roast|please roast|roast my|roast this|what is|how to)\s+/i, "")
            .trim();
          const derived = clean.length > 36 ? clean.slice(0, 36) + "..." : (clean || "Code Roast");
          setSessionTitle(derived ? derived.charAt(0).toUpperCase() + derived.slice(1) : "Standup Roast");
        }
      }
    } catch (e) {
      console.error("loadHistory:", e);
      setMessages([]);
      setSessionTitle("");
    } finally {
      setLoadingHistory(false);
    }
  }, [user, isGuest]);

  // Load existing indexed PDF documents whenever the active session changes
  useEffect(() => {
    if (!currentSessionId) {
      setAttachedDocs([]);
      return;
    }
    let isMounted = true;
    fetch(`/api/rag/upload?sessionId=${encodeURIComponent(currentSessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.documents)) {
          setAttachedDocs(data.documents);
          if (data.documents.length > 0) {
            setSessionTitle((prev) => prev || `📄 ${data.documents[0].fileName}`);
          }
        }
      })
      .catch((err) => {
        console.warn("[RAG] Failed to load session documents:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [currentSessionId]);

  useEffect(() => {
    if (sessionId && sessionCreatedLocallyRef.current === sessionId) {
      sessionCreatedLocallyRef.current = null;
      setCurrentSessionId(sessionId);
      return;
    }

    sessionCreatedLocallyRef.current = null;
    setCurrentSessionId(sessionId);
    setIsStreaming(false);

    if (sessionId && user && !isGuest) {
      loadHistory(sessionId);
    } else {
      setMessages([]);
      setInput("");
      setSessionTitle("");
      setIsEditingTitle(false);
    }
  }, [sessionId, user, isGuest, loadHistory]);

  const handleStartEditTitle = () => {
    setEditTitleValue(sessionTitle || "Standup Roast");
    setIsEditingTitle(true);
    setTimeout(() => {
      editTitleInputRef.current?.focus();
      editTitleInputRef.current?.select();
    }, 50);
  };

  const handleSaveTitle = async () => {
    const trimmed = editTitleValue.trim();
    if (!trimmed) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    setSessionTitle(trimmed);
    try {
      if (currentSessionId && user && !isGuest) {
        await updateSessionTitle(user.uid, currentSessionId, trimmed);
      }
    } catch (err) {
      console.error("Failed to update session title:", err);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, loading, isStreaming]);

  // Upload and index PDF into Aiven PostgreSQL (pgvector)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Only PDF documents are supported for RAG analysis.");
      return;
    }

    setUploadError(null);
    setUploadingPdf(true);

    const cleanDocName = file.name.replace(/\.[^/.]+$/, "");
    const docTitle = `📄 ${cleanDocName}`;
    setSessionTitle(docTitle);

    try {
      let sid = currentSessionId;
      if (!sid) {
        if (user && !isGuest) {
          sid = await createSession(user.uid, docTitle);
          if (sid) {
            sessionCreatedLocallyRef.current = sid;
            setCurrentSessionId(sid);
            onSessionCreated?.(sid);
          }
        } else {
          sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          setCurrentSessionId(sid);
        }
      } else if (user && !isGuest) {
        await updateSessionTitle(user.uid, sid, docTitle);
      }

      if (!sid) {
        throw new Error("Could not initialize chat session for document upload.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sid);
      if (user?.uid) {
        formData.append("userId", user.uid);
      }

      const res = await fetch("/api/rag/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload and index PDF.");
      }

      setAttachedDocs((prev) => {
        const filtered = prev.filter((d) => d.fileName !== data.fileName);
        return [
          ...filtered,
          {
            fileName: data.fileName,
            totalChunks: data.totalChunks,
            totalPages: data.totalPages,
          },
        ];
      });

      // Display real-time announcement in the comedy stage stream
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: {
            roast: `Aha! You uploaded "${data.fileName}" onto the stage (${data.totalPages} pages, ${data.totalChunks} chunks indexed in Aiven pgvector). The mic is hot — roast me, ask me for bugs, or let's critique this document!`,
            severity: 3,
            category: "PDF Ingested",
            suggestion: `Try asking: "Roast the biggest mistake in ${data.fileName}" or "What are the main takeaways in this PDF?".`,
          },
          isNew: true,
        },
      ]);
    } catch (err) {
      console.error("handleFileUpload error:", err);
      setUploadError(err.message || "Failed to process PDF.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleRemoveDoc = async () => {
    if (!currentSessionId) return;
    try {
      await fetch(`/api/rag/upload?sessionId=${encodeURIComponent(currentSessionId)}`, {
        method: "DELETE",
      });
      setAttachedDocs([]);
    } catch (err) {
      console.error("handleRemoveDoc error:", err);
    }
  };

  const saveExchange = async (userText, botReply, isFirstMsg) => {
    if (!user || isGuest || !botReply) return;
    try {
      let sid = currentSessionId;
      const dynamicTitle =
        botReply?.title ||
        (userText ? (userText.length > 40 ? userText.slice(0, 40) + "..." : userText) : "Standup Roast");

      if (!sid) {
        sid = await createSession(user.uid, dynamicTitle);
        if (sid) {
          sessionCreatedLocallyRef.current = sid;
          setCurrentSessionId(sid);
          onSessionCreated?.(sid);
        }
      }
      if (sid) {
        await saveCompletedExchange(
          user.uid,
          sid,
          userText,
          botReply,
          isFirstMsg,
          dynamicTitle
        );
      }
    } catch (e) {
      console.error("[Firestore] saveExchange error:", e?.code, e?.message);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || isStreaming) return;
    setInput("");
    setMobileToolsOpen(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const isFirst = messages.length === 0;

    let sid = currentSessionId;
    if (!sid && user && !isGuest) {
      const cleanForTitle = text.replace(/```[a-zA-Z0-9_-]*/g, "").replace(/```/g, "").trim();
      const preliminaryTitle = cleanForTitle.length > 40 ? cleanForTitle.slice(0, 40) + "..." : (cleanForTitle || "Code Roast");
      const cleanTitle = preliminaryTitle.charAt(0).toUpperCase() + preliminaryTitle.slice(1);
      setSessionTitle(cleanTitle);
      sid = await createSession(user.uid, cleanTitle);
      if (sid) {
        sessionCreatedLocallyRef.current = sid;
        setCurrentSessionId(sid);
        onSessionCreated?.(sid);
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid || currentSessionId,
          messages: updatedMessages.map((m) => {
            let contentText = "";
            if (typeof m.content === "object" && m.content !== null) {
              contentText = m.content.roast
                ? `${m.content.roast} (Tip: ${m.content.suggestion || ""})`
                : JSON.stringify(m.content);
            } else {
              contentText = String(m.content || "");
            }
            return { role: m.role, content: contentText };
          }),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      setLoading(false);
      if (data?.title) {
        setSessionTitle(data.title);
      }
      // Mark as isNew: true so the character-by-character reveal triggers
      setMessages((prev) => [...prev, { role: "assistant", content: data, isNew: true }]);
      saveExchange(text, data, isFirst);
    } catch (err) {
      console.error("sendMessage:", err);
      setLoading(false);
      setIsStreaming(false);

      const fallbackError = {
        roast: "Stage mic drop! The sound technician tripped over the cables. Even the AI couldn't survive that blunder.",
        severity: 9,
        category: "Mic Malfunction",
        suggestion: "Check your internet connection and heckle again.",
      };

      setMessages((prev) => [...prev, { role: "assistant", content: fallbackError, isNew: true }]);
    }
  }, [input, loading, isStreaming, messages, currentSessionId, user, isGuest, onSessionCreated, saveExchange]);

  const handleKey = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const nextValue = input.substring(0, start) + "  " + input.substring(end);
      setInput(nextValue);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      }, 0);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !isStreaming) sendMessage();
    }
  };

  const handleInsertCodeBlock = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = input.substring(start, end);

    let replacement = "";
    let newCursorPos = 0;

    if (selected) {
      replacement = `\`\`\`\n${selected}\n\`\`\``;
      const nextValue = input.substring(0, start) + replacement + input.substring(end);
      setInput(nextValue);
      newCursorPos = start + replacement.length;
    } else {
      replacement = "```\n\n```";
      const nextValue = input.substring(0, start) + replacement + input.substring(end);
      setInput(nextValue);
      newCursorPos = start + 4;
    }

    setMobileToolsOpen(false);

    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursorPos, newCursorPos);
      ta.style.height = "auto";
      const maxHeight = 160;
      ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
    }, 10);
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      const maxHeight = 160;
      const nextHeight = Math.min(ta.scrollHeight, maxHeight);
      ta.style.height = `${nextHeight}px`;
      ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* Stage Performance Arena Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-3">
            <Radio className="w-6 h-6 text-[#EC4899] animate-pulse" />
            <div className="text-[#836270] text-xs font-mono tracking-wider animate-pulse">
              RETRIEVING LIVE SET FROM THE VAULT...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyStageState onShowAuth={onShowAuth} user={user} isGuest={isGuest} />
        ) : (
          <>
            {/* Sticky Live Set Marquee & Manual Title Editor — Liquid Glass Capsule */}
            {sessionTitle && (
              <div className="sticky -top-4 md:-top-6 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 bg-gradient-to-b from-[#FFF5F7]/85 to-transparent backdrop-blur-md">
                {isEditingTitle ? (
                  <div className="flex items-center justify-between px-3 py-1.5 liquid-glass !border-[#EC4899] ring-2 ring-[#F472B6]/30 rounded-2xl transition-all">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 border border-white/90 text-[10px] font-mono font-bold text-[#BE185D] uppercase tracking-wider shrink-0 shadow-2xs">
                        <Flame className="w-3 h-3 text-[#EC4899]" />
                        <span>EDIT SET</span>
                      </span>
                      <input
                        ref={editTitleInputRef}
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveTitle();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleCancelEditTitle();
                          }
                        }}
                        disabled={isSavingTitle}
                        maxLength={60}
                        className="flex-1 min-w-0 bg-white/60 border border-white/80 focus:border-[#EC4899] text-xs sm:text-sm font-bold text-[#2D1C24] px-2.5 py-1 rounded-xl outline-none"
                        placeholder="Enter set title..."
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveTitle}
                        disabled={isSavingTitle}
                        className="p-1.5 text-white liquid-glass-pink rounded-xl cursor-pointer transition-colors shadow-2xs"
                        title="Save title (Enter)"
                        aria-label="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditTitle}
                        disabled={isSavingTitle}
                        className="p-1.5 text-[#836270] hover:text-[#2D1C24] hover:bg-white/70 rounded-xl cursor-pointer transition-colors"
                        title="Cancel (Esc)"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-2 liquid-glass rounded-2xl transition-all">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 border border-white/90 text-[10px] font-mono font-bold text-[#BE185D] uppercase tracking-wider shrink-0 shadow-2xs">
                        <Flame className="w-3 h-3 text-[#EC4899]" />
                        <span>LIVE SET</span>
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 group/title">
                        <h2
                          className="text-xs sm:text-sm font-extrabold text-[#2D1C24] truncate cursor-pointer hover:text-[#BE185D] transition-colors"
                          onClick={handleStartEditTitle}
                          title="Click to rename set"
                        >
                          {sessionTitle}
                        </h2>
                        <button
                          type="button"
                          onClick={handleStartEditTitle}
                          className="opacity-70 group-hover/title:opacity-100 hover:opacity-100 p-1 text-[#836270] hover:text-[#BE185D] hover:bg-white/70 rounded-lg transition-all cursor-pointer shrink-0"
                          title="Rename set"
                          aria-label="Rename set"
                        >
                          <Pencil className="w-3 h-3 text-[#EC4899]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#836270] shrink-0">
                      <span>{messages.length} {messages.length === 1 ? "EXCHANGE" : "EXCHANGES"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1}
                isNew={Boolean(msg.isNew)}
              />
            ))}
          </>
        )}

        {/* Loading / Comedian Teleprompter State — Liquid Glass */}
        {loading && (
          <div className="w-full max-w-3xl my-3">
            <div className="liquid-glass rounded-3xl p-5 animate-pulse">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/80 border border-white/95 flex items-center justify-center shadow-2xs">
                    <Mic2 className="w-4 h-4 text-[#EC4899] animate-bounce" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#BE185D] tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping" />
                    <span>LIVE HEADLINER PREPARING PUNCHLINE...</span>
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 py-1">
                <div className="h-3.5 bg-white/70 rounded-full w-4/5 animate-pulse" />
                <div className="h-3.5 bg-white/70 rounded-full w-2/3 animate-pulse [animation-delay:150ms]" />
                <div className="h-3.5 bg-white/70 rounded-full w-1/2 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Guest Mode VIP Banner — Liquid Glass */}
      {user && isGuest && (
        <div className="mx-2 sm:mx-4 mb-2 liquid-glass-subtle text-[#BE185D] rounded-2xl px-4 py-2 flex items-center justify-between">
          <p className="text-xs font-mono">Guest pass active — sets aren't saved to your permanent vault.</p>
          <button
            onClick={onShowAuth}
            className="text-[#EC4899] text-xs font-black uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Upgrade VIP</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* The Stage Podium Console (Input Deck) — Liquid Glass Dock */}
      <div className="p-2 sm:p-4 mb-2">
        <div className="relative max-w-3xl mx-auto liquid-glass-dock focus-within:ring-2 focus-within:ring-[#F472B6]/30 rounded-2xl sm:rounded-3xl p-2 sm:p-3 transition-all">
          {/* Active PDF Badge / Chip — Liquid Glass Pill */}
          {attachedDocs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-1.5 border-b border-white/70">
              {attachedDocs.map((doc, dIdx) => (
                <div
                  key={dIdx}
                  className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-pill text-xs font-mono text-[#BE185D] animate-in fade-in max-w-full"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
                    <span className="font-bold truncate max-w-[130px] sm:max-w-[220px]">
                      {doc.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="hidden sm:inline text-[10px] text-[#9D174D] bg-[#FCE7F3]/80 px-1.5 py-0.5 rounded-md font-semibold">
                      {doc.totalChunks} chunks in Aiven pgvector
                    </span>
                    <span className="sm:hidden text-[9px] text-[#9D174D] bg-[#FCE7F3]/80 px-1.5 py-0.2 rounded-md font-semibold">
                      {doc.totalChunks} chk
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.fileName)}
                      className="text-[#9D7889] hover:text-[#E11D48] transition-colors cursor-pointer p-0.5 rounded-md hover:bg-white/80"
                      title="Remove document from session"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress Indicator */}
          {uploadingPdf && (
            <div className="mb-2 px-3 py-1.5 rounded-xl liquid-glass-subtle text-[#BE185D] text-xs font-mono flex items-center gap-2 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EC4899]" />
              <span className="truncate">Extracting text & storing chunks in Aiven pgvector...</span>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#FFF1F2]/90 border border-[#FECDD3] text-[#BE123C] text-xs font-mono flex items-center justify-between">
              <span className="truncate">⚠️ {uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="cursor-pointer ml-2 text-[#BE123C] hover:text-[#9F1239]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="relative flex gap-1.5 sm:gap-3 items-end">
            {/* Desktop Only: Vintage Stage Mic Icon — Liquid Glass Pill */}
            <div className="hidden sm:flex w-10 h-10 rounded-2xl liquid-glass-subtle items-center justify-center shrink-0 mb-0.5">
              <Mic2 className="w-5 h-5 text-[#EC4899]" />
            </div>

            {/* Hidden PDF File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Mobile Only: Single Action Dropdown Trigger (+) */}
            <div className="relative sm:hidden shrink-0 mb-0.5">
              <button
                ref={mobileToolsBtnRef}
                type="button"
                onClick={() => setMobileToolsOpen((prev) => !prev)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${mobileToolsOpen
                    ? "liquid-glass-pink text-white rotate-45"
                    : "liquid-glass-pill text-[#BE185D]"
                  }`}
                title="Open tools menu"
                aria-label="Toggle actions"
              >
                <Plus className="w-4 h-4 transition-transform" />
              </button>

              {/* Mobile Action Dropdown Popup */}
              {mobileToolsOpen && (
                <div
                  ref={mobileToolsRef}
                  className="absolute bottom-11 left-0 z-40 liquid-glass rounded-2xl p-1.5 flex flex-col gap-1 min-w-[170px] animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingPdf || loading || isStreaming}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono font-bold text-[#BE185D] hover:bg-white/80 rounded-xl transition-colors cursor-pointer text-left disabled:opacity-50"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
                    <span>Upload PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileToolsOpen(false);
                      handleInsertCodeBlock();
                    }}
                    disabled={loading || isStreaming}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono font-bold text-[#BE185D] hover:bg-white/80 rounded-xl transition-colors cursor-pointer text-left disabled:opacity-50"
                  >
                    <Code2 className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
                    <span>Insert Code (```)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Only: Direct Paperclip PDF Button — Liquid Glass Pill */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPdf || loading || isStreaming}
              className="hidden sm:flex w-10 h-10 rounded-2xl liquid-glass-pill hover:border-[#EC4899] text-[#BE185D] items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Upload PDF for RAG Roast (Aiven pgvector)"
              aria-label="Upload PDF"
            >
              {uploadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#EC4899]" />
              ) : (
                <Paperclip className="w-4 h-4 text-[#EC4899] group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Desktop Only: Direct Insert Code Block Button — Liquid Glass Pill */}
            <button
              type="button"
              onClick={handleInsertCodeBlock}
              disabled={loading || isStreaming}
              className="hidden sm:flex w-10 h-10 rounded-2xl liquid-glass-pill hover:border-[#EC4899] text-[#BE185D] items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Insert or wrap code block (```)"
              aria-label="Insert Code Block"
            >
              <Code2 className="w-4 h-4 text-[#EC4899] group-hover:scale-110 transition-transform" />
            </button>

            {/* Textarea — Takes Full Available Width on Mobile! */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder={
                attachedDocs.length > 0
                  ? `Ask or roast...`
                  : "Step up to the mic..."
              }
              rows={1}
              style={{ maxHeight: "160px" }}
              className={`flex-1 min-w-0 bg-transparent text-[#2D1C24] placeholder-[#9D7889] px-2.5 py-2 sm:py-2.5 outline-none text-sm sm:text-[15px] resize-none overflow-y-auto leading-normal ${hasCodeBlockInInput
                  ? "font-mono text-xs sm:text-sm bg-white/70 border border-white/90 rounded-xl px-2.5 py-2 shadow-inner"
                  : "font-sans"
                }`}
            />

            {/* Fire At Stage Send Button — Liquid Glass Pink */}
            <button
              onClick={sendMessage}
              disabled={loading || isStreaming || !input.trim()}
              className="w-9 h-9 sm:w-11 sm:h-11 liquid-glass-pink disabled:opacity-40 disabled:pointer-events-none text-white font-black rounded-xl sm:rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95 mb-0.5"
              aria-label="Send to stage"
              title="Fire prompt at comedian"
            >
              {loading || isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] sm:text-[11px] font-mono text-[#836270] hidden md:block">
            <span>PRESS ENTER TO HECKLE • SHIFT+ENTER / TAB FOR CODE • MIC LIVE 🎙️</span>
            <span className="text-[#EC4899] font-bold">VIP CELLAR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── The Empty Stage State (Liquid Glass Edition) ─────────────────────────
function EmptyStageState({ user, onShowAuth }) {
  const coasters = [
    {
      label: "Roast my PDF Document",
      text: "Roast everything wrong with my uploaded document.",
      icon: "📄",
    },
    {
      label: "Roast my PHP in 2026",
      text: "Roast my decision to build our new enterprise SaaS with PHP in 2026.",
      icon: "🍸",
    },
    {
      label: "React useEffect Death Loop",
      text: "Roast this React code:\n```jsx\nuseEffect(() => {\n  setCount(count + 1);\n}, [count]);\n```",
      icon: "⚡",
    },
    {
      label: "margin: -9999px Centering",
      text: "Roast my CSS centering technique:\n```css\n.center {\n  position: absolute;\n  margin: -9999px auto;\n}\n```",
      icon: "💣",
    },
    {
      label: "Plaintext Passwords in localStorage",
      text: "Roast this auth implementation:\n```js\nlocalStorage.setItem('user_password', '123456');\n```",
      icon: "🔐",
    },
    {
      label: "500-Line Monster Function",
      text: "Roast this function architecture:\n```javascript\nfunction processEverything(data) {\n  if (data) {\n    if (data.user) {\n      if (data.user.role === 'admin') {\n        // 500 lines of nested logic\n      }\n    }\n  }\n}\n```",
      icon: "📜",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-[97%] min-h-[420px] text-center px-4 py-8">
      {/* Solitary Stage Spotlight on Vintage Mic — Liquid Glass Pink */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl liquid-glass-pink flex items-center justify-center shadow-[0_0_35px_rgba(244,114,182,0.4)]">
          <Mic2 className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E11D48]" />
        </div>
      </div>

      {/* Marquee Headline */}
      <h2 className="text-[#2D1C24] text-xl sm:text-2xl font-black tracking-wider uppercase font-mono mb-2">
        THE MIC IS HOT. DARE TO HECKLE?
      </h2>
      <p className="text-[#836270] text-xs sm:text-sm mb-7 max-w-md leading-relaxed font-sans">
        RoastMaster is on stage and ready to cook. Throw your code, tech stack, or bad habits at the stage.
      </p>

      {/* Front-Row Heckler Coasters (Starter Prompts) — Liquid Glass Coasters */}
      <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mb-8">
        {coasters.map((c, idx) => (
          <button
            key={idx}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("roast-starter", { detail: c.text })
              )
            }
            className="px-3.5 py-2.5 liquid-glass-pill hover:liquid-glass text-[#2D1C24] hover:text-[#BE185D] rounded-2xl text-xs font-mono font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {!user && (
        <p className="text-[#9D7889] text-xs font-mono">
          <button
            onClick={onShowAuth}
            className="text-[#EC4899] font-bold hover:underline cursor-pointer"
          >
            Sign in for VIP Pass
          </button>{" "}
          to save your roast sets to the permanent vault.
        </p>
      )}
    </div>
  );
}