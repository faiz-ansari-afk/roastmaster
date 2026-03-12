"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const DEMO_SCRIPT = [
  { role: "user",  text: "Yaar itni garmi kyun ho rahi hai aajkal? 😩", delay: 700 },
  { role: "bot",   text: "Itni dikkat hai toh Pakistan chale jaa —🔥", delay: 1600 },
  { role: "user",  text: "Bhai seriously, global warming ka koi solution bata na", delay: 1100 },
  { role: "bot",   text: "Tum log AC full blast karte ho, fir poochte ho garmi kyun hai. Pehle apna IQ globally warm karo bhai, phir baat karte hain. 🙏", delay: 1700 },
  { role: "user",  text: "Abe tu toh bahut bura hai yaar 😭😭", delay: 900 },
  { role: "bot",   text: "Aur tu bahut bekar sawal poochta hai — phir bhi dono yahin hain. Toh kaun zyada bekar hai? Soch le. 🤌", delay: 1800 },
];

const FEATURES = [
  { icon: "🔥", label: "Roasts every answer" },
  { icon: "💾", label: "Saves your humiliation history" },
  { icon: "👤", label: "Guest or account login" },
  { icon: "⚡", label: "Powered by Claude AI" },
];

// ── Typewriter ───────────────────────────────────────────────────────────────
function useTypewriter(text, speed = 24, active = false, onTick) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      onTick?.();                                   // ← ping parent to scroll
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);

  return { displayed, done };
}

// ── Message bubble ───────────────────────────────────────────────────────────
function DemoMessage({ msg, active, onDone, onTick }) {
  const isBot = msg.role === "bot";
  const { displayed, done } = useTypewriter(msg.text, isBot ? 20 : 30, active, onTick);
  useEffect(() => { if (done) onDone?.(); }, [done]);
  if (!active && !displayed) return null;

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 8,
      flexDirection: isBot ? "row" : "row-reverse",
      animation: "msgIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        background: isBot ? "#ff2200" : "#2a2a3e",
        boxShadow: isBot ? "0 0 10px rgba(255,34,0,0.5)" : "none",
      }}>
        {isBot ? "🔥" : "😬"}
      </div>

      <div style={{
        maxWidth: "80%", padding: "9px 13px", borderRadius: 14,
        fontSize: 12.5, lineHeight: 1.65,
        fontFamily: "'Courier New', monospace", fontWeight: 500,
        background: isBot ? "#ff2200" : "#ffffff",
        color: isBot ? "#ffffff" : "#111111",
        borderBottomLeftRadius: isBot ? 3 : 14,
        borderBottomRightRadius: !isBot ? 3 : 14,
        boxShadow: isBot ? "0 4px 20px rgba(255,34,0,0.35)" : "0 2px 12px rgba(0,0,0,0.25)",
      }}>
        {displayed}
        {active && !done && (
          <span style={{
            display: "inline-block", width: 6, height: 12,
            background: isBot ? "rgba(255,255,255,0.8)" : "#333",
            marginLeft: 2, verticalAlign: "middle",
            animation: "blink 0.5s steps(1) infinite",
          }} />
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function IntroPage() {
  const router = useRouter();
  const [started, setStarted]       = useState(false);
  const [visible, setVisible]       = useState([]);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showCTA, setShowCTA]       = useState(false);
  const [exiting, setExiting]       = useState(false);
  const [glitch, setGlitch]         = useState(false);
  const chatContainerRef            = useRef(null);   // ← ref on scrollable div

  const [embers] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: (Math.random() * 98).toFixed(1),
      dur:  (Math.random() * 5 + 4).toFixed(1),
      delay:(Math.random() * 7).toFixed(1),
      size: (Math.random() * 3 + 1.5).toFixed(1),
      hue:  Math.round(Math.random() * 30 + 3),
    }))
  );

  // ── scroll helper — scrolls the CONTAINER, not the page ──────────────────
  const scrollToBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Periodic glitch on title
  useEffect(() => {
    const ids = [
      setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 120); }, 3800),
      setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 70);  }, 6500),
    ];
    return () => ids.forEach(clearInterval);
  }, []);

  // Kick off demo after 2 s
  useEffect(() => {
    const t = setTimeout(() => {
      setStarted(true);
      setVisible([DEMO_SCRIPT[0]]);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // Scroll whenever a new bubble appears
  useEffect(() => {
    scrollToBottom();
  }, [visible, scrollToBottom]);

  // Called when the active message finishes typing
  const handleDone = () => {
    const next = activeIdx + 1;
    if (next < DEMO_SCRIPT.length) {
      setTimeout(() => {
        setVisible((p) => [...p, DEMO_SCRIPT[next]]);
        setActiveIdx(next);
      }, DEMO_SCRIPT[next].delay);
    } else {
      setTimeout(() => setShowFeatures(true), 500);
      setTimeout(() => setShowCTA(true), 1100);
    }
  };

  const enter = () => {
    setExiting(true);
    setTimeout(() => router.push("/chat"), 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#060606",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px", overflow: "hidden", position: "relative",
      fontFamily: "'Courier New', monospace",
      opacity: exiting ? 0 : 1,
      transform: exiting ? "scale(0.96)" : "scale(1)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>

      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
        backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)",
      }} />

      {/* BG radial glow */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 860, height: 860, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(255,34,0,0.07) 0%,transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Embers */}
      {embers.map((e) => (
        <div key={e.id} style={{
          position: "fixed", bottom: -8, left: e.left + "%",
          width: e.size + "px", height: e.size + "px", borderRadius: "50%",
          background: `hsl(${e.hue},100%,60%)`,
          boxShadow: `0 0 5px 2px hsla(${e.hue},100%,50%,0.55)`,
          animation: `floatUp ${e.dur}s ${e.delay}s infinite ease-in`,
          opacity: 0, zIndex: 1,
        }} />
      ))}

      {/* ── Card ── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 430,
        display: "flex", flexDirection: "column", gap: 22,
        animation: "fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 50, marginBottom: 8, display: "inline-block",
            filter: "drop-shadow(0 0 22px rgba(255,60,0,0.95))",
            animation: "popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
          }}>🔥</div>

          <div style={{ position: "relative" }}>
            {glitch && <>
              <span style={{
                position: "absolute", left: 3, top: -2, color: "#00ffff", opacity: 0.6,
                clipPath: "inset(25% 0 50% 0)", fontWeight: 900,
                fontSize: "clamp(24px,6.5vw,38px)", letterSpacing: 6,
                width: "100%", textAlign: "center", pointerEvents: "none",
              }}>ROASTMASTER</span>
              <span style={{
                position: "absolute", left: -3, top: 3, color: "#ff00bb", opacity: 0.6,
                clipPath: "inset(58% 0 12% 0)", fontWeight: 900,
                fontSize: "clamp(24px,6.5vw,38px)", letterSpacing: 6,
                width: "100%", textAlign: "center", pointerEvents: "none",
              }}>ROASTMASTER</span>
            </>}
            <h1 style={{
              margin: 0, color: "#ff2200",
              fontSize: "clamp(24px,6.5vw,38px)",
              fontWeight: 900, letterSpacing: 6, textTransform: "uppercase",
              textShadow: "0 0 24px rgba(255,34,0,0.75),0 0 55px rgba(255,34,0,0.3)",
              animation: "revealTitle 0.6s 0.35s both",
            }}>ROASTMASTER</h1>
          </div>

          <div style={{
            color: "#2e2e2e", fontSize: 9, letterSpacing: 8,
            textTransform: "uppercase", marginTop: 5,
            animation: "fadeIn 0.5s 1s both",
          }}>AI THAT HATES YOU • DESI EDITION 🇮🇳</div>
        </div>

        {/* ── Demo chat ── */}
        {started && (
          <div style={{
            background: "#111", border: "1px solid #222", borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(255,34,0,0.08),0 20px 50px rgba(0,0,0,0.8)",
            animation: "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Window chrome */}
            <div style={{
              background: "#0e0e0e", borderBottom: "1px solid #1c1c1c",
              padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f56","#ffbd2e","#27c93f"].map((c, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <span style={{ flex: 1, textAlign: "center", color: "#2a2a2a", fontSize: 9, letterSpacing: 4 }}>
                LIVE DEMO — DESI EDITION
              </span>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#ff2200", boxShadow: "0 0 5px #ff2200",
                animation: "pulse 1.3s infinite",
              }} />
            </div>

            {/* ── Scrollable messages container ─────────────────────────── */}
            <div
              ref={chatContainerRef}           // ← attach ref here
              style={{
                padding: "14px 12px",
                display: "flex", flexDirection: "column", gap: 10,
                height: 220,                   // fixed height so it actually scrolls
                overflowY: "auto",
                background: "#111",
                scrollBehavior: "smooth",
              }}
            >
              {visible.map((msg, i) => (
                <DemoMessage
                  key={i} msg={msg}
                  active={i === activeIdx}
                  onDone={i === activeIdx ? handleDone : undefined}
                  onTick={i === activeIdx ? scrollToBottom : undefined}
                />
              ))}
              {/* spacer so last bubble isn't glued to bottom edge */}
              <div style={{ height: 4, flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* ── Features — English ── */}
        {showFeatures && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "#0e0e0e", border: "1px solid #1c1c1c",
                borderRadius: 10, padding: "9px 12px",
                display: "flex", alignItems: "center", gap: 8,
                animation: `fadeUp 0.35s ${i * 0.07}s cubic-bezier(0.34,1.4,0.64,1) both`,
              }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ color: "#555", fontSize: 14 }}>{f.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        {showCTA && (
          <div style={{ animation: "fadeUp 0.45s cubic-bezier(0.34,1.4,0.64,1) both" }}>
            <button
              onClick={enter}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 0 50px rgba(255,34,0,0.6),0 12px 40px rgba(255,34,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(255,34,0,0.35),0 8px 28px rgba(255,34,0,0.15)";
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg,#aa0000,#ff2200,#ff5500)",
                color: "#fff", fontFamily: "'Courier New', monospace",
                fontWeight: 900, fontSize: 13, letterSpacing: 4,
                textTransform: "uppercase", border: "none", borderRadius: 12,
                padding: "15px 28px", cursor: "pointer",
                boxShadow: "0 0 28px rgba(255,34,0,0.35),0 8px 28px rgba(255,34,0,0.15)",
                transition: "transform 0.18s, box-shadow 0.18s",
              }}
            >
              🔥 &nbsp; HIMMAT HAI TOH ANDAR AA
            </button>
            <p style={{ textAlign: "center", color: "gray", fontSize: 9, marginTop: 9, letterSpacing: 3 }}>
              MAAKE LAADLE FEELINGS NHI BACHEGI • GUARANTEED
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn     { from{opacity:0;transform:scale(0.25) rotate(-18deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes revealTitle { from{opacity:0;letter-spacing:20px} to{opacity:1;letter-spacing:6px} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes msgIn     { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.7)} }
        @keyframes floatUp   { 0%{opacity:0;transform:translateY(0) scale(1)} 8%{opacity:0.85} 88%{opacity:0.25} 100%{opacity:0;transform:translateY(-92vh) scale(0.15)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:0}
      `}</style>
    </div>
  );
}