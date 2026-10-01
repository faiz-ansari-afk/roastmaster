"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createSession, getMessages, saveCompletedExchange } from "@/lib/firestore";
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
} from "lucide-react";

// ── Helpers for structured data parsing & severity metadata ───────────────────
function parseRoastData(raw) {
  if (!raw) return { roast: "", severity: null, category: null, suggestion: "", toolCall: null };

  if (typeof raw === "object") {
    return {
      roast: raw.roast || raw.reply || "",
      severity: typeof raw.severity === "number" ? raw.severity : null,
      category: raw.category || null,
      suggestion: raw.suggestion || "",
      toolCall: raw.toolCall || null,
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
            toolCall: parsed.toolCall || null,
          };
        }
      } catch {
        // Not a JSON string, fallback to raw text
      }
    }
    return {
      roast: raw,
      severity: null,
      category: null,
      suggestion: "",
      toolCall: null,
    };
  }

  return { roast: String(raw), severity: null, category: null, suggestion: "", toolCall: null };
}

function getSeverityBadge(severity) {
  if (severity == null) return null;
  const num = Math.min(10, Math.max(1, severity));
  if (num <= 3) {
    return {
      label: "Mild Singe",
      num,
      colorClass: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
      meterClass: "bg-[#D97706]",
      flameClass: "text-[#D97706]",
    };
  }
  if (num <= 7) {
    return {
      label: "Deep Burn",
      num,
      colorClass: "bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]",
      meterClass: "bg-[#EA580C]",
      flameClass: "text-[#EA580C]",
    };
  }
  return {
    label: "Brutal Roast",
    num,
    colorClass: "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]",
    meterClass: "bg-[#DC2626]",
    flameClass: "text-[#DC2626]",
  };
}

// ── Structured bot message card ──────────────────────────────────────────────
function BotMessageBubble({ content, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const data = parseRoastData(content);
  const severityInfo = getSeverityBadge(data.severity);

  const handleCopy = () => {
    let textToCopy = `🔥 Standup Roast:\n${data.roast}`;
    if (data.severity != null) {
      textToCopy += `\n\nRoast Heat: ${data.severity}/10`;
    }
    if (data.category) {
      textToCopy += `\nCategory: ${data.category}`;
    }
    if (data.suggestion) {
      textToCopy += `\n\n💡 Actually improve:\n${data.suggestion}`;
    }
    if (data.toolCall) {
      textToCopy += `\n\n🎤 Comedian Vault Tool: ${data.toolCall.tool}\nTopic: ${data.toolCall.topic || ""}\nAmmo: ${data.toolCall.ammo || ""}\nAngle: ${data.toolCall.angle || ""}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStructured = Boolean(data.category || data.suggestion || data.severity != null);

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 max-w-2xl sm:max-w-3xl">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs mt-1">
        <Flame className="w-4 h-4 text-[#D97706]" />
      </div>

      {/* Message Card */}
      <div className="flex-1 bg-white border border-[#E8DFD3] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-[0_2px_14px_rgba(36,30,28,0.05)] text-[#241E1C] overflow-hidden">
        {/* Header Section: Roast Title, Category, and Severity */}
        {isStructured && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#F0E8DD]">
            {/* Left: Flame + Roast Title */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-black tracking-wider uppercase">
              <Flame className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
              <span>Standup Roast</span>
            </div>

            {/* Right: Category + Severity */}
            <div className="flex items-center gap-2 flex-wrap">
              {data.category && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F4EFEA] border border-[#E2D8CD] text-[#63554D] text-xs font-semibold">
                  <Tag className="w-3 h-3 text-[#8C7E74]" />
                  <span>Category: {data.category}</span>
                </div>
              )}

              {severityInfo && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold ${severityInfo.colorClass}`}
                  title={`${severityInfo.label} (${data.severity}/10)`}
                >
                  <Gauge className="w-3 h-3" />
                  <span>Roast Heat: {data.severity}/10</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Severity Visual Meter Bar */}
        {severityInfo && (
          <div className="mb-3.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EFE8DE]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#786C63] mb-1.5">
              <span className="flex items-center gap-1">
                <Flame className={`w-3.5 h-3.5 ${severityInfo.flameClass}`} />
                <span>Damage Level: {severityInfo.label}</span>
              </span>
              <span className="font-mono text-xs">{data.severity}/10</span>
            </div>
            <div className="grid grid-cols-10 gap-1 h-1.5 w-full">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx < data.severity
                      ? severityInfo.meterClass
                      : "bg-[#E6DDD2]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Roast Text */}
        <div className="text-sm sm:text-[15px] leading-relaxed font-medium text-[#241E1C] whitespace-pre-wrap break-words">
          {data.roast}
          {isStreaming && (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 15,
                background: "#D97706",
                marginLeft: 4,
                verticalAlign: "middle",
                animation: "cursorBlink 0.6s steps(1) infinite",
              }}
            />
          )}
        </div>

        {/* 🎤 Standup Comedian's Comedy Vault Tool Call */}
        {data.toolCall && (
          <div className="mt-4 pt-3.5 border-t border-[#F0E8DD]">
            <div className="bg-[#241E1C] text-[#FAF7F2] rounded-xl p-3.5 sm:p-4 border border-[#3E342F] shadow-sm">
              {/* Header bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#3E342F]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#D97706]/20 border border-[#D97706]/40 flex items-center justify-center">
                    <Mic2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  </div>
                  <span className="text-[11px] font-black tracking-wider text-[#FCD34D] uppercase flex items-center gap-1.5 font-mono">
                    <span>TOOL EXECUTED:</span>
                    <span className="text-white bg-[#372E29] px-1.5 py-0.5 rounded border border-[#4F423B]">
                      {data.toolCall.tool || "fetch_roast_ammo"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#FBBF24] bg-[#78350F]/40 border border-[#B45309]/60 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                  <span>{data.toolCall.status || "AMMO_UNLOCKED"}</span>
                </div>
              </div>

              {/* Ammo Details */}
              <div className="space-y-2.5 text-xs">
                {data.toolCall.topic && (
                  <div className="bg-[#2E2724] p-2.5 rounded-lg border border-[#423731] flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#A89C90] flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#D97706]" />
                      <span>Researched Topic:</span>
                    </span>
                    <span className="font-semibold text-[#FDF9F4] font-mono text-[11px]">
                      {data.toolCall.topic}
                    </span>
                  </div>
                )}

                {data.toolCall.ammo && (
                  <div className="bg-[#2E2724] p-2.5 rounded-lg border border-[#423731]">
                    <div className="text-[10px] uppercase font-bold text-[#F59E0B] flex items-center gap-1 mb-1">
                      <BookOpen className="w-3 h-3 text-[#F59E0B]" />
                      <span>Comedy Vault Ammo</span>
                    </div>
                    <div className="text-[#E6DDD2] leading-relaxed">
                      {data.toolCall.ammo}
                    </div>
                  </div>
                )}

                {data.toolCall.angle && (
                  <div className="bg-[#332219]/60 border border-[#523526] rounded-lg p-2.5 flex items-start gap-2">
                    <Laugh className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#FBBF24] uppercase text-[10px] block">
                        Crowd-Work Angle:
                      </span>
                      <span className="text-[#E6DDD2] italic">
                        "{data.toolCall.angle}"
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actually Improve Box */}
        {data.suggestion && (
          <div className="mt-4 pt-3.5 border-t border-[#F0E8DD]">
            <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E] tracking-wide uppercase">
                  <Lightbulb className="w-4 h-4 text-[#D97706] fill-[#FEF3C7]" />
                  <span>Actually improve:</span>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#4E433C] leading-relaxed whitespace-pre-wrap break-words">
                {data.suggestion}
              </div>
            </div>
          </div>
        )}

        {/* Card Footer Actions */}
        {!isStreaming && data.roast && (
          <div className="flex justify-end mt-3 pt-2.5 border-t border-[#F5EFE8]">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#8C7E74] hover:text-[#241E1C] hover:bg-[#F5EFE8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Copy roast, suggestion and comedian notes"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span className="text-[#16A34A]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
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

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";

  if (!isUser) {
    return <BotMessageBubble content={message.content} isStreaming={isStreaming} />;
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-3 flex-row-reverse max-w-2xl sm:max-w-3xl ml-auto">
      <div className="w-8 h-8 rounded-full bg-[#EFE9DF] border border-[#DDD4C5] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <User className="w-4 h-4 text-[#786C63]" />
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-xs text-sm sm:text-[15px] leading-relaxed bg-[#28211E] text-[#FAF7F2] border border-[#3C322D] shadow-sm whitespace-pre-wrap break-words">
        {message.content}
      </div>
    </div>
  );
}

// ── Main ChatWindow ───────────────────────────────────────────────────────────
export default function ChatWindow({ sessionId, onSessionCreated, onShowAuth }) {
  const { user, isGuest } = useAuth();
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [isStreaming, setIsStreaming]         = useState(false);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const sessionCreatedLocallyRef = useRef(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const loadHistory = useCallback(async (sidToLoad) => {
    if (!user || isGuest || !sidToLoad) return;
    setLoadingHistory(true);
    try {
      const msgs = await getMessages(user.uid, sidToLoad);
      setMessages(msgs || []);
    } catch (e) {
      console.error("loadHistory:", e);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [user, isGuest]);

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
    }
  }, [sessionId, user, isGuest, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, loading, isStreaming]);

  const saveExchange = async (userText, botReply, isFirstMsg) => {
    if (!user || isGuest || !botReply) return;
    try {
      let sid = currentSessionId;
      if (!sid) {
        console.log("[Firestore] Creating session for:", user.uid);
        sid = await createSession(user.uid);
        console.log("[Firestore] Session created:", sid);
        if (sid) {
          sessionCreatedLocallyRef.current = sid;
          setCurrentSessionId(sid);
          onSessionCreated?.(sid);
        }
      }
      if (sid) {
        const ok = await saveCompletedExchange(
          user.uid,
          sid,
          userText,
          botReply,
          isFirstMsg,
          isFirstMsg ? userText : null
        );
        if (ok) {
          console.log("[Firestore] Saved exchange successfully ✅");
        }
      }
    } catch (e) {
      console.error("[Firestore] saveExchange error:", e?.code, e?.message);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || isStreaming) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const isFirst = messages.length === 0;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      setMessages((prev) => [...prev, { role: "assistant", content: data }]);
      saveExchange(text, data, isFirst);
    } catch (err) {
      console.error("sendMessage:", err);
      setLoading(false);
      setIsStreaming(false);

      const fallbackError = {
        roast: "Even my error handling gave up on you. That's a new low.",
        severity: 9,
        category: "Client / Network Error",
        suggestion: "Check your internet connection and try asking your question again.",
      };

      setMessages((prev) => [...prev, { role: "assistant", content: fallbackError }]);
    }
  }, [input, loading, isStreaming, messages, currentSessionId, user, isGuest, onSessionCreated]);

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
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] w-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center mt-20">
            <div className="text-[#8C7E74] text-xs sm:text-sm animate-pulse font-medium">Loading history...</div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onShowAuth={onShowAuth} user={user} isGuest={isGuest} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isStreaming={isStreaming && i === messages.length - 1}
            />
          ))
        )}

        {/* Loading state skeleton */}
        {loading && (
          <div className="flex items-start gap-2.5 sm:gap-3 max-w-2xl sm:max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs mt-1 animate-pulse">
              <Mic2 className="w-4 h-4 text-[#D97706] animate-bounce" />
            </div>
            <div className="flex-1 bg-white border border-[#E8DFD3] rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-[0_2px_14px_rgba(36,30,28,0.05)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
                <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                  Consulting Comedy Vault (calling fetch_roast_ammo)...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-[#F5EFEA] rounded-full w-3/4 animate-pulse" />
                <div className="h-3.5 bg-[#F5EFEA] rounded-full w-5/6 animate-pulse [animation-delay:150ms]" />
                <div className="h-3.5 bg-[#F5EFEA] rounded-full w-1/2 animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {user && isGuest && (
        <div className="mx-3.5 sm:mx-6 mb-2 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-xl px-4 py-2 flex items-center justify-between shadow-2xs">
          <p className="text-xs">Guest mode — history won't be saved</p>
          <button onClick={onShowAuth} className="text-[#B45309] text-xs font-bold hover:underline cursor-pointer flex items-center gap-1">
            <span>Save history</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="border-t border-[#E8E0D5] bg-[#FAF7F2]/95 backdrop-blur-md p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Paste your code or ask something stupid… I dare you"
            rows={1}
            className="flex-1 bg-white border border-[#DDD3C4] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 text-[#241E1C] placeholder-[#9C8F85] px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl outline-none transition-all text-base sm:text-sm resize-none overflow-hidden shadow-2xs leading-normal"
          />
          <button
            onClick={sendMessage}
            disabled={loading || isStreaming || !input.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] disabled:from-[#E2D8CC] disabled:to-[#E2D8CC] disabled:text-[#A89C90] text-white rounded-xl sm:rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(217,119,6,0.3)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed active:scale-95"
            aria-label="Send message"
          >
            {loading || isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[#9C8F85] text-[10px] sm:text-[11px] mt-2 font-medium">
          ENTER to send • SHIFT+ENTER for new line
        </p>
      </div>
    </div>
  );
}

function EmptyState({ user, onShowAuth }) {
  const starters = [
    { label: "Roast my choice of PHP in 2026", text: "Roast my decision to build our new enterprise SaaS with PHP in 2026." },
    { label: "Infinite loop in React useEffect", text: "Roast this React code: useEffect(() => { setCount(count + 1); }, [count]);" },
    { label: "Centering a div with margin: -9999px", text: "Roast my CSS: .center { position: absolute; margin: -9999px auto; }" },
    { label: "Storing password in plaintext localStorage", text: "Roast this: localStorage.setItem('user_password', '123456');" },
    { label: "Roast my 500-line single function", text: "I have a single JavaScript function that is 500 lines long with 12 nested if statements." },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center px-4 py-8">
      <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mb-4 shadow-xs">
        <Mic2 className="w-8 h-8 text-[#D97706]" />
      </div>
      <h2 className="text-[#92400E] text-lg sm:text-xl font-black tracking-wider uppercase mb-2">
        Take the front row. It's crowd work time.
      </h2>
      <p className="text-[#786C63] text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
        Submit code or questions. RoastMaster researches your topic via real-time tool calls to the Comedy Vault, roasts you like an open-mic heckler, and gives actual advice.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {starters.map((s, idx) => (
          <button
            key={idx}
            onClick={() => window.dispatchEvent(new CustomEvent("roast-starter", { detail: s.text }))}
            className="px-3.5 py-2 bg-white hover:bg-[#FDF9F4] border border-[#DDD3C4] hover:border-[#D97706]/50 text-[#5F544D] hover:text-[#92400E] rounded-xl text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-97 flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      {!user && (
        <p className="text-[#8C7E74] text-xs mt-8">
          <button onClick={onShowAuth} className="text-[#D97706] font-semibold hover:underline cursor-pointer">
            Sign in
          </button>{" "}
          to save your humiliation history
        </p>
      )}
    </div>
  );
}