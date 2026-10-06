"use client";
// components/ChatWindow.jsx — The Live Standup Comedy Roast Stage Deck (Baby Pink Edition + Pure Text-by-Text Reveal)
import { useState, useRef, useEffect, useCallback } from "react";
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
    <div className="mt-3.5 pt-3.5 border-t border-[#FCE7F3] animate-in fade-in duration-400">
      <div className="bg-[#FFF5F7] text-[#2D1C24] rounded-2xl p-3 sm:p-3.5 border border-[#FBCFE8] transition-all">
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
            <div className="w-5 h-5 rounded-md bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center shrink-0">
              <FileText className="w-3 h-3 text-[#EC4899]" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-[#BE185D] uppercase font-mono truncate">
              GROUNDED IN PDF (AIVEN PGVECTOR):
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-mono text-[#BE185D] bg-[#FCE7F3] px-2 py-0.5 rounded-full font-bold">
              {sources.length} EXCERPTS RETRIEVED
            </span>
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[#836270] group-hover:text-[#BE185D] group-hover:bg-[#FCE7F3] transition-colors">
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#EC4899] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                  }`}
              />
            </div>
          </div>
        </button>

        {/* Collapsible Content — Initially Collapsed */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-[#FCE7F3] space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {sources.map((src, sIdx) => (
              <div
                key={sIdx}
                className="bg-white p-2.5 rounded-xl border border-[#FCE7F3] text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 text-[#9D174D]">
                  <span className="flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-md">
                    <FileCheck className="w-3.5 h-3.5 text-[#EC4899] shrink-0" />
                    <span className="truncate">{src.fileName}</span>
                    <span className="text-[#836270] font-normal shrink-0">
                      (Chunk #{src.chunkIndex + 1})
                    </span>
                  </span>
                  <span className="bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8] px-1.5 py-0.5 rounded shrink-0">
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
      {/* Soft Baby Pink Stage Dais Halo */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F472B6]/20 via-[#EC4899]/15 to-[#FBCFE8]/25 rounded-3xl blur-md opacity-70 group-hover/card:opacity-100 transition duration-500 -z-10" />

      {/* Main Stage Card Dais — Crisp White with Baby Pink Accents */}
      <div className="relative bg-white border border-[#FBCFE8] rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_rgba(244,114,182,0.07)] text-[#2D1C24] overflow-hidden">
        {/* Stage Header: Audio Frequency Equalizer + Mic Status + Burn Gauge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-[#FCE7F3]">
          {/* Left: Stage Mic + Live Dancing Audio Waves */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center shadow-2xs">
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

              {/* 5-Bar Dancing Audio Equalizer Visualizer — Baby Pink */}
              <div className="flex items-end gap-0.5 h-4 ml-1 px-1.5 py-0.5 bg-[#FDF2F8] rounded-md border border-[#FCE7F3]">
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

          {/* Right: Category Marquee & Heat Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {data.category && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDF2F8] border border-[#FBCFE8] text-[#9D174D] text-[11px] font-mono font-bold">
                <Tag className="w-3 h-3 text-[#EC4899]" />
                <span className="uppercase">{data.category}</span>
              </div>
            )}

            {severityInfo && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black font-mono tracking-wider ${severityInfo.colorClass}`}
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
          <div className="mb-4 bg-[#FDF2F8] p-2.5 rounded-xl border border-[#FCE7F3] animate-in fade-in duration-300">
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
                    : "bg-[#FCE7F3]"
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

        {/* Backstage Real Talk (Actually Improve) — COMPLETELY HIDDEN until finished speaking */}
        {!isSpeaking && data.suggestion && (
          <div className="mt-4 pt-3.5 border-t border-[#FCE7F3] animate-in fade-in duration-400">
            <div className="bg-[#FFF8FA] border border-[#FBCFE8] rounded-2xl p-3.5 sm:p-4">
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

        {/* Interactive Crowd Reactions Bar — COMPLETELY HIDDEN until finished speaking */}
        {!isSpeaking && !isStreaming && data.roast && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#FCE7F3] animate-in fade-in duration-300">
            {/* Left: Audience Reactions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplaud}
                className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${hasApplauded
                  ? "bg-[#FCE7F3] border-[#FBCFE8] text-[#BE185D]"
                  : "bg-white border-[#FCE7F3] text-[#836270] hover:text-[#2D1C24] hover:bg-[#FDF2F8]"
                  }`}
                title="Applaud the roast!"
              >
                <span>👏</span>
                <span>{applauseCount}</span>
              </button>

              <button
                onClick={handleTomato}
                className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${hasThrownTomato
                  ? "bg-[#FFE4E6] border-[#FDA4AF] text-[#E11D48]"
                  : "bg-white border-[#FCE7F3] text-[#836270] hover:text-[#2D1C24] hover:bg-[#FDF2F8]"
                  }`}
                title="Throw a tomato at the stage!"
              >
                <span>🍅</span>
                <span>{tomatoCount > 0 ? `${tomatoCount} splats` : "Boo"}</span>
              </button>
            </div>

            {/* Right: Steal Joke (Copy) */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#836270] hover:text-[#2D1C24] bg-white hover:bg-[#FDF2F8] border border-[#FCE7F3] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
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

// ── VIP Front-Row Heckler Card (User Message) ─────────────────────────────────
function UserHecklerCard({ content }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 flex-row-reverse max-w-2xl sm:max-w-3xl ml-auto my-3">
      {/* Heckler Badge Icon — Baby Pink */}
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] text-white flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(236,72,153,0.3)] mt-0.5">
        <User className="w-4 h-4 text-white" />
      </div>

      {/* Heckler Speech Bubble — Baby Pink */}
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#BE185D] uppercase">
            VIP FRONT ROW • TABLE #01
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
        </div>
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-xs text-sm sm:text-[15px] leading-relaxed bg-gradient-to-tr from-[#F472B6] to-[#EC4899] text-white border border-[#F472B6] shadow-[0_4px_18px_rgba(236,72,153,0.22)] whitespace-pre-wrap break-words font-medium">
          "{content}"
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
          const clean = firstUser.content.replace(/^(roast|can you roast|please roast|roast my|roast this|what is|how to)\s+/i, "").trim();
          const derived = clean.length > 36 ? clean.slice(0, 36) + "..." : clean;
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
      const preliminaryTitle = text.length > 40 ? text.slice(0, 40) + "..." : text;
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !isStreaming) sendMessage();
    }
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
    <div className="flex flex-col h-full bg-[#FFF5F7] w-full max-w-4xl mx-auto px-2 sm:px-4">
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
            {/* Sticky Live Set Marquee & Manual Title Editor */}
            {sessionTitle && (
              <div className="sticky -top-4 md:-top-6 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 bg-[#FFF5F7]/95 backdrop-blur-md">
                {isEditingTitle ? (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-[#EC4899] ring-2 ring-[#F472B6]/25 rounded-2xl shadow-xs transition-all">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCE7F3] border border-[#FBCFE8] text-[10px] font-mono font-bold text-[#BE185D] uppercase tracking-wider shrink-0">
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
                        className="flex-1 min-w-0 bg-[#FFF5F7] border border-[#FBCFE8] focus:border-[#EC4899] text-xs sm:text-sm font-bold text-[#2D1C24] px-2.5 py-1 rounded-xl outline-none"
                        placeholder="Enter set title..."
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveTitle}
                        disabled={isSavingTitle}
                        className="p-1.5 text-white bg-[#EC4899] hover:bg-[#DB2777] rounded-xl cursor-pointer transition-colors shadow-2xs"
                        title="Save title (Enter)"
                        aria-label="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditTitle}
                        disabled={isSavingTitle}
                        className="p-1.5 text-[#836270] hover:text-[#2D1C24] hover:bg-[#FCE7F3] rounded-xl cursor-pointer transition-colors"
                        title="Cancel (Esc)"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 py-2 bg-white/95 border border-[#FBCFE8] rounded-2xl shadow-xs backdrop-blur-xs transition-all">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCE7F3] border border-[#FBCFE8] text-[10px] font-mono font-bold text-[#BE185D] uppercase tracking-wider shrink-0">
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
                          className="opacity-70 group-hover/title:opacity-100 hover:opacity-100 p-1 text-[#836270] hover:text-[#BE185D] hover:bg-[#FCE7F3] rounded-lg transition-all cursor-pointer shrink-0"
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

        {/* Loading / Comedian Teleprompter State — Baby Pink */}
        {loading && (
          <div className="w-full max-w-3xl my-3">
            <div className="bg-white border border-[#FBCFE8] rounded-3xl p-5 shadow-[0_4px_20px_rgba(244,114,182,0.06)] animate-pulse">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#FCE7F3]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-[#EC4899] animate-bounce" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#BE185D] tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-ping" />
                    <span>LIVE HEADLINER PREPARING PUNCHLINE...</span>
                  </span>
                </div>
              </div>
              <div className="space-y-2.5 py-1">
                <div className="h-3.5 bg-[#FDF2F8] rounded-full w-4/5 animate-pulse" />
                <div className="h-3.5 bg-[#FDF2F8] rounded-full w-2/3 animate-pulse [animation-delay:150ms]" />
                <div className="h-3.5 bg-[#FDF2F8] rounded-full w-1/2 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Guest Mode VIP Banner — Baby Pink */}
      {user && isGuest && (
        <div className="mx-2 sm:mx-4 mb-2 bg-[#FDF2F8] border border-[#FBCFE8] text-[#BE185D] rounded-2xl px-4 py-2 flex items-center justify-between shadow-2xs">
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

      {/* The Stage Podium Console (Input Deck) — Baby Pink */}
      <div className="p-2 sm:p-4 mb-2">
        <div className="relative max-w-3xl mx-auto bg-white/95 backdrop-blur-md border border-[#FBCFE8] focus-within:border-[#EC4899] focus-within:ring-2 focus-within:ring-[#F472B6]/25 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-[0_8px_30px_rgba(244,114,182,0.08)] transition-all">
          {/* Active PDF Badge / Chip */}
          {attachedDocs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-[#FCE7F3]">
              {attachedDocs.map((doc, dIdx) => (
                <div
                  key={dIdx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#FDF2F8] border border-[#FBCFE8] text-xs font-mono text-[#BE185D] shadow-2xs animate-in fade-in"
                >
                  <FileText className="w-3.5 h-3.5 text-[#EC4899]" />
                  <span className="font-bold truncate max-w-[170px] sm:max-w-[240px]">
                    {doc.fileName}
                  </span>
                  <span className="text-[10px] text-[#9D174D] bg-[#FCE7F3] px-1.5 py-0.5 rounded-md font-semibold">
                    {doc.totalChunks} chunks in Aiven pgvector
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.fileName)}
                    className="text-[#9D7889] hover:text-[#E11D48] transition-colors cursor-pointer p-0.5 rounded-md hover:bg-white"
                    title="Remove document from session"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress Indicator */}
          {uploadingPdf && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#FDF2F8] border border-[#FBCFE8] text-[#BE185D] text-xs font-mono flex items-center gap-2 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EC4899]" />
              <span>Extracting text, chunking & storing 768-dim embeddings in Aiven pgvector...</span>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-mono flex items-center justify-between">
              <span>⚠️ {uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="cursor-pointer ml-2 text-[#BE123C] hover:text-[#9F1239]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 items-end">
            {/* Vintage Stage Mic Icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center shrink-0 mb-0.5">
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

            {/* Paperclip PDF Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPdf || loading || isStreaming}
              className="w-10 h-10 rounded-2xl bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] hover:border-[#EC4899] text-[#BE185D] flex items-center justify-center shrink-0 mb-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
              title="Upload PDF for RAG Roast (Aiven pgvector)"
              aria-label="Upload PDF"
            >
              {uploadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#EC4899]" />
              ) : (
                <Paperclip className="w-4 h-4 text-[#EC4899] group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              placeholder={
                attachedDocs.length > 0
                  ? `Ask about or roast ${attachedDocs[0].fileName}...`
                  : "Step up to the mic..."
              }
              rows={1}
              style={{ maxHeight: "160px" }}
              className="flex-1 bg-transparent text-[#2D1C24] placeholder-[#9D7889] px-2 py-2 sm:py-2.5 outline-none text-sm sm:text-[15px] resize-none overflow-y-auto leading-normal font-sans"
            />

            {/* Fire At Stage Send Button */}
            <button
              onClick={sendMessage}
              disabled={loading || isStreaming || !input.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] disabled:from-[#FCE7F3] disabled:to-[#FCE7F3] disabled:text-[#D1B8C4] text-white font-black rounded-xl sm:rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(236,72,153,0.35)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed active:scale-95"
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
            <span>PRESS ENTER TO HECKLE • SHIFT+ENTER FOR MULTILINE</span>
            <span className="text-[#EC4899] font-bold ">MIC LIVE 🎙️</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── The Empty Stage State (Baby Pink Edition) ─────────────────────────────────
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
      text: "Roast this React code: useEffect(() => { setCount(count + 1); }, [count]);",
      icon: "⚡",
    },
    {
      label: "margin: -9999px Centering",
      text: "Roast my CSS: .center { position: absolute; margin: -9999px auto; }",
      icon: "💣",
    },
    {
      label: "Plaintext Passwords in localStorage",
      text: "Roast this: localStorage.setItem('user_password', '123456');",
      icon: "🔐",
    },
    {
      label: "500-Line Monster Function",
      text: "I have a single JavaScript function that is 500 lines long with 12 nested if statements.",
      icon: "📜",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-[97%] min-h-[420px] text-center px-4 py-8">
      {/* Solitary Stage Spotlight on Vintage Mic */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.35)]">
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

      {/* Front-Row Heckler Coasters (Starter Prompts) */}
      <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl mb-8">
        {coasters.map((c, idx) => (
          <button
            key={idx}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("roast-starter", { detail: c.text })
              )
            }
            className="px-3.5 py-2.5 bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] hover:border-[#EC4899] text-[#2D1C24] hover:text-[#BE185D] rounded-2xl text-xs font-mono font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center gap-2"
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