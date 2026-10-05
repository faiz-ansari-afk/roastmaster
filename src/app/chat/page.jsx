"use client";
// app/chat/page.jsx — The Live Standup Comedy Roast Stage (Baby Pink Edition)
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Flame,
  Plus,
  Ticket,
  Radio,
  User,
  Search,
} from "lucide-react";

export default function ChatPage() {
  const { user, isGuest } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [chatResetKey, setChatResetKey] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reset session on logout
  useEffect(() => {
    if (!user) {
      setSessionId(null);
      setChatResetKey((k) => k + 1);
    }
  }, [user]);

  // Listen for starter prompt events from ChatWindow empty state
  useEffect(() => {
    const handler = (e) => {
      const input = document.querySelector("textarea");
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(input, e.detail);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      }
    };
    window.addEventListener("roast-starter", handler);
    return () => window.removeEventListener("roast-starter", handler);
  }, []);

  const handleNewSession = () => {
    setSessionId(null);
    setChatResetKey((k) => k + 1);
  };

  const handleDeleteSession = (deletedId) => {
    if (sessionId === deletedId || !sessionId) {
      handleNewSession();
    }
  };

  const handleSessionCreated = (sid) => {
    setSessionId(sid);
  };

  return (
    <div className="flex h-[100dvh] bg-[#FFF5F7] text-[#2D1C24] overflow-hidden selection:bg-[#FCE7F3] selection:text-[#BE185D]">
      {/* Backstage Green Room VIP Passes Drawer (Slide-out) */}
      <Sidebar
        activeSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onShowAuth={() => setShowAuth(true)}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* The Main Roast Stage */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Soft Baby Pink Spotlight Glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.18)_0%,_rgba(236,72,153,0.04)_50%,_transparent_75%)] blur-2xl z-0" />

        {/* Theatrical Stage Top Marquee Bar — Baby Pink Theme */}
        <header className="relative z-10 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#FBCFE8] bg-white/85 backdrop-blur-md shrink-0 shadow-[0_2px_14px_rgba(244,114,182,0.06)]">
          {/* Left: Sets Trigger & Marquee Brand */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Backstage Drawer Trigger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FDF2F8] hover:bg-[#FCE7F3] border border-[#FBCFE8] hover:border-[#F472B6] text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Open Backstage Green Room & Past Sets"
              aria-label="Open Backstage Sets"
            >
              <Ticket className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="hidden sm:inline">BACKSTAGE SETS</span>
              <span className="sm:hidden font-mono text-[11px]">SETS</span>
            </button>

            {/* Semantic Search Quick Trigger Button — Desktop only, on mobile it's inside the sidebar drawer! */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-search"))}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FFF0F4] hover:bg-[#FCE7F3] border border-[#FBCFE8] hover:border-[#F472B6] text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Semantic Search Roast Sets (Ctrl + K)"
              aria-label="Search Roast Sets"
            >
              <Search className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="hidden md:inline">SEARCH</span>
              <kbd className="hidden lg:inline-flex items-center px-1 py-0.2 text-[9px] bg-white border border-[#FBCFE8] rounded text-[#BE185D]">
                Ctrl K
              </kbd>
            </button>

            {/* Marquee Brand */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] flex items-center justify-center shadow-[0_0_12px_rgba(244,114,182,0.3)] shrink-0">
                <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-black tracking-wider text-xs sm:text-sm text-[#2D1C24] uppercase font-mono truncate">
                    ROASTMASTER
                  </span>
                  <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#FFE4E6] border border-[#FDA4AF] text-[#E11D48] text-[9px] font-black tracking-widest uppercase shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <span>ON AIR</span>
                  </div>
                </div>
                <span className="hidden md:inline text-[10px] text-[#836270] font-medium tracking-tight">
                  LIVE AT THE CELLAR • VIP FRONT ROW
                </span>
              </div>
            </div>
          </div>

          {/* Center: Stage Crowd Heat Indicator (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] text-xs">
            <Radio className="w-3.5 h-3.5 text-[#EC4899] animate-pulse" />
            <span className="text-[#836270] text-[11px] font-medium">Stage Heat:</span>
            <span className="text-[#BE185D] font-mono font-bold text-xs">9.8/10 BRUTAL</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* New Set button */}
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] rounded-xl shadow-[0_2px_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer active:scale-95 font-mono uppercase tracking-wider"
              title="Start a new live set on stage"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Set</span>
            </button>

            {/* VIP Pass (Logged Out) or User Profile Pill (Logged In) on Big Screens */}
            {!user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden sm:inline-flex text-xs font-bold text-[#BE185D] hover:text-[#9D174D] bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-mono shadow-2xs"
              >
                VIP Pass
              </button>
            ) : (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] hover:border-[#F472B6] transition-all shadow-2xs group cursor-pointer"
                title="View & Edit VIP Heckler Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center text-xs font-bold text-[#BE185D] shadow-2xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono text-xs font-black text-[#EC4899]">
                      {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left min-w-0 max-w-[120px] md:max-w-[160px]">
                  <span className="text-xs font-bold text-[#2D1C24] truncate group-hover:text-[#BE185D] transition-colors leading-tight">
                    {user.displayName || (user.email ? user.email.split("@")[0] : "VIP Heckler")}
                  </span>
                  <span className="text-[9px] font-mono text-[#EC4899] font-bold tracking-wider uppercase leading-none">
                    {isGuest ? "GUEST PASS" : "VIP PROFILE"}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </header>

        {/* The Live Roast Arena Window */}
        <div className="flex-1 overflow-hidden relative">
          <ChatWindow
            key={chatResetKey}
            sessionId={sessionId}
            onSessionCreated={handleSessionCreated}
            onShowAuth={() => setShowAuth(true)}
          />
        </div>
      </main>

      {/* VIP Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}