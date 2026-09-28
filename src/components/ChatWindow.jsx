"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createSession, getMessages, saveCompletedExchange } from "@/lib/firestore";
import { Flame, User, Send, Loader2, ArrowRight, Sparkles } from "lucide-react";

// ── Streamed bot message ──────────────────────────────────────────────────
function BotMessageBubble({ content, isStreaming }) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 max-w-2xl sm:max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Flame className="w-4 h-4 text-[#D97706]" />
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tl-xs text-sm sm:text-[15px] leading-relaxed bg-white border border-[#E8DFD3] text-[#241E1C] shadow-[0_2px_12px_rgba(36,30,28,0.04)] whitespace-pre-wrap break-words">
        {content}
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
    // If sessionId changed because we just created it locally for the current conversation,
    // do not wipe messages or reload history!
    if (sessionCreatedLocallyRef.current === sessionId) {
      sessionCreatedLocallyRef.current = null;
      setCurrentSessionId(sessionId);
      return;
    }

    setCurrentSessionId(sessionId);
    setIsStreaming(false);

    if (sessionId && user && !isGuest) {
      loadHistory(sessionId);
    } else {
      setMessages([]);
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
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const contentType = res.headers.get("content-type") || "";

      // Fallback if backend returned JSON (e.g. error replies)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const reply = data.reply || "You broke me. Congrats, I guess.";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setLoading(false);
        saveExchange(text, reply, isFirst);
        return;
      }

      // Stream handling
      setLoading(false);
      setIsStreaming(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedReply = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedReply += chunk;
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
              next[lastIdx] = {
                ...next[lastIdx],
                content: accumulatedReply,
              };
            }
            return next;
          });
        }
      } finally {
        setIsStreaming(false);
      }

      if (accumulatedReply) {
        saveExchange(text, accumulatedReply, isFirst);
      }
    } catch (err) {
      console.error("sendMessage:", err);
      setLoading(false);
      setIsStreaming(false);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          next[next.length - 1] = {
            role: "assistant",
            content: "Even my error handling gave up on you. That's a new low.",
          };
          return next;
        }
        return [
          ...prev,
          { role: "assistant", content: "Even my error handling gave up on you. That's a new low." },
        ];
      });
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
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
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

        {loading && (
          <div className="flex items-center gap-2.5 sm:gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="bg-white border border-[#E8DFD3] rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce [animation-delay:300ms]" />
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
            placeholder="Say something stupid… I dare you"
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

function EmptyState({ user, isGuest, onShowAuth }) {
  const starters = [
    "What is 2+2?",
    "Am I smart?",
    "Give me life advice",
    "Tell me I'm doing great",
    "How do I get rich?",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center px-4 py-8">
      <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mb-4 shadow-xs">
        <Flame className="w-8 h-8 text-[#D97706]" />
      </div>
      <h2 className="text-[#92400E] text-lg sm:text-xl font-black tracking-wider uppercase mb-2">
        Drop the mic. I'll pick it up.
      </h2>
      <p className="text-[#786C63] text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
        Ask me anything. I'll answer it — buried under a mountain of savage roasting.
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {starters.map((s) => (
          <button
            key={s}
            onClick={() => window.dispatchEvent(new CustomEvent("roast-starter", { detail: s }))}
            className="px-3.5 py-2 bg-white hover:bg-[#FDF9F4] border border-[#DDD3C4] hover:border-[#D97706]/50 text-[#5F544D] hover:text-[#92400E] rounded-xl text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-97"
          >
            {s}
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