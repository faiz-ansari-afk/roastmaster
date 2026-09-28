"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flame, BookmarkCheck, User, Zap } from "lucide-react";

const DEMO_SCRIPT = [
  { role: "user",  text: "Yaar itni garmi kyun ho rahi hai aajkal?", delay: 700 },
  { role: "bot",   text: "Itni dikkat hai toh Pakistan chale jaa —", delay: 1600 },
  { role: "user",  text: "Bhai seriously, global warming ka koi solution bata na", delay: 1100 },
  { role: "bot",   text: "Tum log AC full blast karte ho, fir poochte ho garmi kyun hai. Pehle apna IQ globally warm karo bhai, phir baat karte hain.", delay: 1700 },
  { role: "user",  text: "Abe tu toh bahut bura hai yaar", delay: 900 },
  { role: "bot",   text: "Aur tu bahut bekar sawal poochta hai — phir bhi dono yahin hain. Toh kaun zyada bekar hai? Soch le.", delay: 1800 },
];

const FEATURES = [
  { icon: Flame, label: "Roasts every answer" },
  { icon: BookmarkCheck, label: "Saves humiliation history" },
  { icon: User, label: "Guest or account login" },
  { icon: Zap, label: "Powered by Claude AI" },
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
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isBot ? "#FEF3C7" : "#EFE8DE",
        border: isBot ? "1px solid #FDE68A" : "1px solid #DDD3C4",
        boxShadow: isBot ? "0 2px 8px rgba(217,119,6,0.15)" : "none",
      }}>
        {isBot ? <Flame className="w-3.5 h-3.5 text-[#D97706]" /> : <User className="w-3.5 h-3.5 text-[#786C63]" />}
      </div>

      <div style={{
        maxWidth: "82%", padding: "9px 13px", borderRadius: 14,
        fontSize: 12.5, lineHeight: 1.65,
        fontFamily: "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 500,
        background: isBot ? "#FFFFFF" : "#28211E",
        color: isBot ? "#241E1C" : "#FAF7F2",
        border: isBot ? "1px solid #EAE3D8" : "none",
        borderBottomLeftRadius: isBot ? 3 : 14,
        borderBottomRightRadius: !isBot ? 3 : 14,
        boxShadow: isBot ? "0 2px 10px rgba(36,30,28,0.05)" : "0 3px 12px rgba(40,33,30,0.12)",
      }}>
        {displayed}
        {active && !done && (
          <span style={{
            display: "inline-block", width: 6, height: 12,
            background: isBot ? "#D97706" : "#FAF7F2",
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
      hue:  Math.round(Math.random() * 25 + 32),
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
      minHeight: "100dvh", background: "#FAF7F2",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", overflow: "hidden", position: "relative",
      fontFamily: "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
      opacity: exiting ? 0 : 1,
      transform: exiting ? "scale(0.96)" : "scale(1)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>

      {/* Background warm radial glow */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 860, height: 860, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217,119,6,0.07) 0%, rgba(254,243,199,0.25) 45%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Warm Golden Embers */}
      {embers.map((e) => (
        <div key={e.id} style={{
          position: "fixed", bottom: -8, left: e.left + "%",
          width: e.size + "px", height: e.size + "px", borderRadius: "50%",
          background: `hsl(${e.hue},90%,55%)`,
          boxShadow: `0 0 6px 1px hsla(${e.hue},90%,50%,0.35)`,
          animation: `floatUp ${e.dur}s ${e.delay}s infinite ease-in`,
          opacity: 0, zIndex: 1,
        }} />
      ))}

      {/* ── Card ── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 440,
        display: "flex", flexDirection: "column", gap: 20,
        animation: "fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "#FEF3C7", border: "1px solid #FDE68A",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 8,
            boxShadow: "0 4px 16px rgba(217,119,6,0.2)",
            animation: "popIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
          }}>
            <Flame className="w-7 h-7 text-[#D97706]" />
          </div>

          <div style={{ position: "relative" }}>
            <h1 style={{
              margin: 0,
              background: "linear-gradient(135deg, #241E1C 20%, #78350F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "clamp(26px, 7vw, 38px)",
              fontWeight: 900, letterSpacing: 5, textTransform: "uppercase",
              animation: "revealTitle 0.6s 0.35s both",
            }}>ROASTMASTER</h1>
          </div>

          <div style={{
            color: "#8C7E74", fontSize: 9.5, letterSpacing: 5,
            textTransform: "uppercase", marginTop: 6, fontWeight: 700,
            animation: "fadeIn 0.5s 1s both",
          }}>AI THAT HATES YOU • DESI EDITION</div>
        </div>

        {/* ── Demo chat ── */}
        {started && (
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E8E0D5",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 16px 36px -10px rgba(36,30,28,0.08), 0 0 0 1px rgba(232,224,213,0.6)",
            animation: "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Window chrome */}
            <div style={{
              background: "#F7F3ED", borderBottom: "1px solid #E8E0D5",
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#FDA4AF","#FDE68A","#A7F3D0"].map((c, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, border: "1px solid rgba(0,0,0,0.06)" }} />
                ))}
              </div>
              <span style={{ flex: 1, textAlign: "center", color: "#8C7E74", fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>
                LIVE DEMO — DESI EDITION
              </span>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#D97706", boxShadow: "0 0 6px rgba(217,119,6,0.6)",
                animation: "pulse 1.3s infinite",
              }} />
            </div>

            {/* ── Scrollable messages container ─────────────────────────── */}
            <div
              ref={chatContainerRef}
              style={{
                padding: "14px 12px",
                display: "flex", flexDirection: "column", gap: 10,
                height: 220,
                overflowY: "auto",
                background: "#FAF7F2",
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
              <div style={{ height: 4, flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* ── Features ── */}
        {showFeatures && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  background: "#FFFFFF", border: "1px solid #E8E0D5",
                  borderRadius: 12, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 2px 8px rgba(36,30,28,0.03)",
                  animation: `fadeUp 0.35s ${i * 0.07}s cubic-bezier(0.34,1.4,0.64,1) both`,
                }}>
                  <Icon className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span style={{ color: "#5F544D", fontSize: 11.5, fontWeight: 600 }}>{f.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CTA ── */}
        {showCTA && (
          <div style={{ animation: "fadeUp 0.45s cubic-bezier(0.34,1.4,0.64,1) both" }}>
            <button
              onClick={enter}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02) translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(217,119,6,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(217,119,6,0.25)";
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #D97706, #F59E0B)",
                color: "#FFFFFF",
                fontFamily: "var(--font-sans), 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 800, fontSize: 13, letterSpacing: 3,
                textTransform: "uppercase", border: "none", borderRadius: 14,
                padding: "15px 24px", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(217,119,6,0.25)",
                transition: "transform 0.18s, box-shadow 0.18s",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Flame style={{ width: 16, height: 16 }} />
                <span>HIMMAT HAI TOH ANDAR AA</span>
              </span>
            </button>
            <p style={{ textAlign: "center", color: "#8C7E74", fontSize: 9.5, marginTop: 9, letterSpacing: 2, fontWeight: 600 }}>
              MAAKE LAADLE FEELINGS NHI BACHEGI • GUARANTEED
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn     { from{opacity:0;transform:scale(0.25) rotate(-18deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes revealTitle { from{opacity:0;letter-spacing:16px} to{opacity:1;letter-spacing:5px} }
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