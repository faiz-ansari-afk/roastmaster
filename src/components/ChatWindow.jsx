"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createSession, getMessages, saveCompletedExchange } from "@/lib/firestore";

// ── Word-by-word animated bot message ────────────────────────────────────────
function AnimatedBotMessage({ content, isNew }) {
  const [visibleCount, setVisibleCount] = useState(isNew ? 0 : Infinity);
  const words = content.split(" ");

  useEffect(() => {
    if (!isNew) return;
    setVisibleCount(0);
    let i = 0;
    // Speed varies: short words faster, punctuation has slight pause
    const tick = () => {
      i++;
      setVisibleCount(i);
      if (i < words.length) {
        const word = words[i - 1];
        const hasPunct = /[.!?,;]$/.test(word);
        const delay = hasPunct ? 120 : 42;
        setTimeout(tick, delay);
      }
    };
    // Small initial delay so dots disappear first
    const t = setTimeout(tick, 80);
    return () => clearTimeout(t);
  }, [content, isNew]);

  return (
    <div className="flex items-end gap-3 max-w-2xl">
      <div className="w-8 h-8 rounded-full bg-[#1a0000] border border-[#ff2200]/30 flex items-center justify-center text-sm shrink-0">
        🔥
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed font-mono bg-[#1c1c1c] border border-zinc-700/60 text-zinc-100">
        {words.slice(0, visibleCount).map((word, i) => (
          <span
            key={i}
            style={{
              display: "inline",
              opacity: i === visibleCount - 1 && visibleCount < words.length ? 0.5 : 1,
              transition: "opacity 0.1s",
            }}
          >
            {word}{i < visibleCount - 1 || visibleCount >= words.length ? " " : ""}
          </span>
        ))}
        {/* Blinking cursor while typing */}
        {visibleCount < words.length && (
          <span style={{
            display: "inline-block", width: 6, height: 12,
            background: "#ff2200", marginLeft: 2, verticalAlign: "middle",
            animation: "cursorBlink 0.5s steps(1) infinite",
          }} />
        )}
      </div>
      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

function MessageBubble({ message, isNew }) {
  const isUser = message.role === "user";

  if (!isUser) return <AnimatedBotMessage content={message.content} isNew={isNew} />;

  return (
    <div className="flex items-end gap-3 flex-row-reverse max-w-2xl ml-auto">
      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">
        😬
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
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
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  // Track which message index is "new" (should animate)
  const [animatingIdx, setAnimatingIdx]       = useState(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setCurrentSessionId(sessionId);
    setMessages([]);
    setAnimatingIdx(null);
  }, [sessionId]);

  useEffect(() => {
    if (!currentSessionId || !user || isGuest) return;
    loadHistory();
  }, [currentSessionId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const msgs = await getMessages(user.uid, currentSessionId);
      setMessages(msgs);
    } catch (e) {
      console.error("loadHistory:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    setAnimatingIdx(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.reply || "You broke me. Congrats, I guess.";
      const botMsg = { role: "assistant", content: reply };

      setMessages((prev) => {
        const next = [...prev, botMsg];
        setAnimatingIdx(next.length - 1); // mark last message as new
        return next;
      });
      setLoading(false);

      // Save in background
      if (user && !isGuest) {
        const isFirst = messages.length === 0;
        (async () => {
          try {
            let sid = currentSessionId;
            if (!sid) {
              console.log("[Firestore] Creating session for:", user.uid);
              sid = await createSession(user.uid);
              console.log("[Firestore] Session created:", sid);
              setCurrentSessionId(sid);
              onSessionCreated?.(sid);
            }
            if (sid) {
              await saveCompletedExchange(user.uid, sid, text, reply, isFirst, isFirst ? text : null);
              console.log("[Firestore] Saved successfully ✅");
            }
          } catch (e) {
            console.error("[Firestore] FAILED ❌ code:", e.code, "message:", e.message);
          }
        })();
      }
    } catch (err) {
      console.error("sendMessage:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Even my error handling gave up on you. That's a new low." }]);
      setLoading(false);
    }
  }, [input, loading, messages, currentSessionId, user, isGuest, onSessionCreated]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] md:w-4xl md:mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center mt-20">
            <div className="text-zinc-600 text-sm animate-pulse">Loading history...</div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onShowAuth={onShowAuth} user={user} isGuest={isGuest} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} isNew={i === animatingIdx} />
          ))
        )}

        {loading && (
          <div className="flex items-end gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-[#1a0000] border border-[#ff2200]/30 flex items-center justify-center text-sm shrink-0">🔥</div>
            <div className="bg-[#1c1c1c] border border-zinc-700/60 rounded-2xl rounded-bl-sm px-5 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-[#ff2200] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-[#ff2200] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-[#ff2200] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {user && isGuest && (
        <div className="mx-4 mb-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 flex items-center justify-between">
          <p className="text-zinc-500 text-xs">Guest mode — history won't be saved</p>
          <button onClick={onShowAuth} className="text-[#ff2200] text-xs font-bold hover:underline">Save history →</button>
        </div>
      )}

      <div className="border-t border-zinc-900 p-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Say something stupid… I dare you"
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#ff2200]/50 text-white placeholder-zinc-600 px-4 py-3 rounded-xl outline-none transition-colors text-sm resize-none overflow-hidden font-mono"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-[#ff2200] hover:bg-[#cc1a00] disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all flex items-center justify-center text-lg shrink-0 shadow-[0_0_20px_rgba(255,34,0,0.3)] disabled:shadow-none"
          >
            {loading ? <span className="animate-spin text-sm">◌</span> : "🔥"}
          </button>
        </div>
        <p className="text-center text-zinc-500 text-[10px] mt-2 font-mono">
          ENTER to send • SHIFT+ENTER for new line
        </p>
      </div>
    </div>
  );
}

function EmptyState({ user, isGuest, onShowAuth }) {
  const starters = ["What is 2+2?", "Am I smart?", "Give me life advice", "Tell me I'm doing great", "How do I get rich?"];
  return (
    <div className="flex flex-col items-center justify-center h-[95%] text-center px-4">
      <div className="text-6xl mb-4 animate-bounce">🎤</div>
      <h2 className="text-[#ff2200] text-xl font-black tracking-widest uppercase mb-2">Drop the mic. I'll pick it up.</h2>
      <p className="text-zinc-600 text-sm mb-8 max-w-sm">Ask me anything. I'll answer it — buried under a mountain of roasting.</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {starters.map((s) => (
          <button key={s}
            onClick={() => window.dispatchEvent(new CustomEvent("roast-starter", { detail: s }))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-[#ff2200]/40 text-zinc-400 hover:text-white rounded-lg text-xs transition-all font-mono"
          >{s}</button>
        ))}
      </div>
      {!user && (
        <p className="text-zinc-700 text-xs mt-10">
          <button onClick={onShowAuth} className="text-[#ff2200] hover:underline">Sign in</button>{" "}to save your humiliation history
        </p>
      )}
    </div>
  );
}