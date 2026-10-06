"use client";
// app/page.jsx — The Live Roast Arena Entrance (Baby Pink Edition)
import { useRouter } from "next/navigation";
import {
  Flame,
  ArrowRight,
  Ticket,
  Mic2,
  Radio,
  BookOpen,
  Laugh,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleEnter = () => {
    router.push("/chat");
  };

  return (
    <main className="min-h-[100dvh] bg-[#FFF5F7] text-[#2D1C24] flex items-center justify-center p-4 sm:p-6 selection:bg-[#FCE7F3] selection:text-[#BE185D] relative overflow-hidden">
      {/* Animated Liquid Glass Background Blobs & Spotlight Beam */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.25)_0%,_rgba(236,72,153,0.06)_50%,_transparent_75%)] blur-3xl animate-spotlight" />
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-gradient-to-tr from-[#F472B6]/30 via-[#EC4899]/20 to-[#FDA4AF]/25 blur-3xl animate-liquid-1" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-gradient-to-bl from-[#EC4899]/22 via-[#F472B6]/25 to-[#FBCFE8]/35 blur-3xl animate-liquid-2" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-white/45 via-[#FCE7F3]/30 to-[#F472B6]/18 blur-2xl animate-liquid-3" />
      </div>

      <div className="relative z-10 w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-10 text-center">
        {/* Stage Mic Halo — Liquid Glass Pink */}
        <div className="relative w-20 h-20 rounded-3xl liquid-glass-pink flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(244,114,182,0.45)]">
          <Mic2 className="w-10 h-10 text-white" />
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E11D48]" />
          </div>
        </div>

        {/* Live Stage Marquee — Liquid Glass Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-glass-pill text-[#BE185D] text-[11px] font-mono font-bold tracking-widest uppercase mb-3">
          <Radio className="w-3.5 h-3.5 text-[#E11D48] animate-pulse" />
          <span>LIVE COMEDY CELLAR • VIP FRONT ROW</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2D1C24] uppercase font-mono">
          ROASTMASTER
        </h1>
        <p className="text-xs font-bold text-[#EC4899] tracking-widest uppercase mt-1 font-mono">
          Unfiltered Standup Roast • Powered by Comedy Vault AI
        </p>

        {/* Description */}
        <p className="text-sm text-[#836270] mt-4 leading-relaxed max-w-sm mx-auto font-sans">
          Step up to the stage mic. Our headliner uses real-time tool calls to query the Comedy Vault for verified technical quirks and roast you with zero mercy.
        </p>

        {/* Feature Stubs — Liquid Glass Subtle */}
        <div className="grid grid-cols-2 gap-2.5 my-7 text-left font-mono">
          <div className="liquid-glass-subtle rounded-2xl p-3 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Brutal Crowd Work</span>
          </div>
          <div className="liquid-glass-subtle rounded-2xl p-3 flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Comedy Vault Tool</span>
          </div>
          <div className="liquid-glass-subtle rounded-2xl p-3 flex items-center gap-2.5">
            <Ticket className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Green Room Sets</span>
          </div>
          <div className="liquid-glass-subtle rounded-2xl p-3 flex items-center gap-2.5">
            <Laugh className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Zero Mercy Policy</span>
          </div>
        </div>

        {/* CTA Take The Stage — Liquid Glass Pink */}
        <button
          onClick={handleEnter}
          className="w-full liquid-glass-pink hover:opacity-95 text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 font-mono"
        >
          <span>Claim Front Row Mic</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-[#9D7889] mt-3.5 font-mono">
          ENTRANCE AT YOUR OWN RISK • FEELINGS NOT COVERED
        </p>
      </div>
    </main>
  );
}