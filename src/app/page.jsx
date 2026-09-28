"use client";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, ShieldAlert, Sparkles, History, MessageSquare } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleEnter = () => {
    router.push("/chat");
  };

  return (
    <main className="min-h-[100dvh] bg-[#FAF7F2] text-[#241E1C] flex items-center justify-center p-4 sm:p-6 selection:bg-[#FEF3C7] selection:text-[#92400E]">
      <div className="w-full max-w-md bg-white border border-[#E8E0D5] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(36,30,28,0.06)] text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <Flame className="w-8 h-8 text-[#D97706]" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#241E1C] uppercase">
          RoastMaster
        </h1>
        <p className="text-xs font-bold text-[#D97706] tracking-widest uppercase mt-1">
          AI That Has Zero Chill • Desi Edition
        </p>

        {/* Description */}
        <p className="text-sm text-[#786C63] mt-3.5 leading-relaxed max-w-xs mx-auto">
          Ask anything and get savage, hilarious answers with zero mercy. Enter only if you can handle the heat.
        </p>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2.5 my-6 text-left">
          <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-xl p-3 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold text-[#5F544D]">Brutal Roasts</span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-xl p-3 flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold text-[#5F544D]">Saved Sessions</span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-xl p-3 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold text-[#5F544D]">Streaming AI</span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-xl p-3 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold text-[#5F544D]">Zero Feelings</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          className="w-full bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-bold py-3.5 px-6 rounded-2xl text-sm sm:text-base tracking-wide shadow-[0_6px_20px_rgba(217,119,6,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
        >
          <span>Dare to Enter</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-[#9C8F85] mt-3 font-medium">
          Himmat hai toh aao • Feelings ki guarantee nahi
        </p>
      </div>
    </main>
  );
}