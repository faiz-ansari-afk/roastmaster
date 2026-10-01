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
      {/* Overhead Stage Spotlight Beam — Soft Baby Pink Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.2)_0%,_rgba(236,72,153,0.05)_50%,_transparent_75%)] blur-2xl z-0 animate-spotlight" />

      <div className="relative z-10 w-full max-w-lg bg-white/95 border border-[#FBCFE8] rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(236,72,153,0.1)] text-center backdrop-blur-xl">
        {/* Stage Mic Halo */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(244,114,182,0.35)]">
          <Mic2 className="w-10 h-10 text-white" />
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E11D48]" />
          </div>
        </div>

        {/* Live Stage Marquee */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] text-[#BE185D] text-[11px] font-mono font-bold tracking-widest uppercase mb-3">
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

        {/* Feature Stubs */}
        <div className="grid grid-cols-2 gap-2.5 my-7 text-left font-mono">
          <div className="bg-[#FDF2F8] border border-[#FCE7F3] rounded-2xl p-3 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Brutal Crowd Work</span>
          </div>
          <div className="bg-[#FDF2F8] border border-[#FCE7F3] rounded-2xl p-3 flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Comedy Vault Tool</span>
          </div>
          <div className="bg-[#FDF2F8] border border-[#FCE7F3] rounded-2xl p-3 flex items-center gap-2.5">
            <Ticket className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Green Room Sets</span>
          </div>
          <div className="bg-[#FDF2F8] border border-[#FCE7F3] rounded-2xl p-3 flex items-center gap-2.5">
            <Laugh className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span className="text-xs font-bold text-[#2D1C24]">Zero Mercy Policy</span>
          </div>
        </div>

        {/* CTA Take The Stage */}
        <button
          onClick={handleEnter}
          className="w-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white font-black py-4 px-6 rounded-2xl text-sm sm:text-base tracking-wider uppercase shadow-[0_4px_20px_rgba(236,72,153,0.3)] hover:shadow-[0_6px_25px_rgba(236,72,153,0.45)] transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 font-mono"
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