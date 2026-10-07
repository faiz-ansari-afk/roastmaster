"use client";
// components/ChatStage.jsx — The Live Standup Comedy Roast Stage (Baby Pink Edition)
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
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

export default function ChatStage({ initialSessionId }) {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const routeSessionId =
    initialSessionId !== undefined
      ? initialSessionId
      : params?.chat_id
        ? Array.isArray(params.chat_id)
          ? params.chat_id[0]
          : params.chat_id
        : null;

  const [currentSessionId, setCurrentSessionId] = useState(routeSessionId);
  const [chatResetKey, setChatResetKey] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevRouteSessionIdRef = useRef(routeSessionId);

  // Sync state if route parameter changes (e.g. from sidebar clicks, Next router navigation, or direct navigation)
  useEffect(() => {
    if (prevRouteSessionIdRef.current !== routeSessionId) {
      prevRouteSessionIdRef.current = routeSessionId;
      setCurrentSessionId(routeSessionId);
      setChatResetKey((k) => k + 1);
    }
  }, [routeSessionId]);

  // Listen for browser navigation (back/forward) to keep stage in sync
  useEffect(() => {
    const handlePopState = () => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      if (pathname === "/chat" || pathname === "/chat/") {
        setCurrentSessionId(null);
        setChatResetKey((k) => k + 1);
      } else if (pathname.startsWith("/chat/")) {
        const sid = pathname.replace(/^\/chat\//, "").split("/")[0];
        if (sid) {
          setCurrentSessionId(sid);
          setChatResetKey((k) => k + 1);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Reset session on logout
  useEffect(() => {
    if (!user) {
      if (currentSessionId) {
        router.push("/chat");
      }
      setCurrentSessionId(null);
      setChatResetKey((k) => k + 1);
    }
  }, [user, currentSessionId, router]);

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
    if (pathname === '/chat') return;
    setCurrentSessionId(null);
    setChatResetKey((k) => k + 1);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/chat");
    }

    router.push("/chat");
  };

  const handleSelectSession = (sid) => {
    if (!sid) {
      handleNewSession();
    } else {
      setCurrentSessionId(sid);
      setChatResetKey((k) => k + 1);
      router.push(`/chat/${sid}`);
    }
  };

  const handleDeleteSession = (deletedId) => {
    if (currentSessionId === deletedId || !currentSessionId) {
      handleNewSession();
    }
  };

  const handleSessionCreated = (sid) => {
    // When a conversation is started on /chat, seamlessly update browser URL to /chat/[chat_id]
    // using replaceState so ongoing AI streaming and reveal are not interrupted by route unmounting
    if (sid) {
      setCurrentSessionId(sid);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/chat/${sid}`);
      }
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#FFF5F7] text-[#2D1C24] overflow-hidden selection:bg-[#FCE7F3] selection:text-[#BE185D]">
      {/* Backstage Green Room VIP Passes Drawer (Slide-out) */}
      <Sidebar
        activeSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onShowAuth={() => setShowAuth(true)}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* The Main Roast Stage */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Animated Liquid Glass Background Blobs & Caustic Refraction Engine */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          {/* Primary Top-Center Spotlight Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[340px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.22)_0%,_rgba(236,72,153,0.06)_50%,_transparent_75%)] blur-3xl" />

          {/* Morphing Liquid Pink Blob 1 (Top-Left) */}
          <div className="absolute -top-16 -left-16 w-96 h-96 bg-gradient-to-tr from-[#F472B6]/25 via-[#EC4899]/18 to-[#FDA4AF]/25 blur-3xl animate-liquid-1" />

          {/* Morphing Liquid Rose Blob 2 (Bottom-Right) */}
          <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-gradient-to-bl from-[#EC4899]/20 via-[#F472B6]/22 to-[#FBCFE8]/30 blur-3xl animate-liquid-2" />

          {/* Floating Liquid Highlight Blob 3 (Center Ambient) */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-r from-white/40 via-[#FCE7F3]/25 to-[#F472B6]/15 blur-2xl animate-liquid-3" />
        </div>

        {/* Theatrical Stage Top Marquee Bar — Liquid Glass Ribbon */}
        <header className="relative z-20 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 liquid-glass shrink-0 !border-x-0 !border-t-0 !rounded-none">
          {/* Left: Sets Trigger & Marquee Brand */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Backstage Drawer Trigger Button — Liquid Glass Pill */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 liquid-glass-pill hover:liquid-glass text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-bold font-mono cursor-pointer active:scale-95 shrink-0"
              title="Open Backstage Green Room & Past Sets"
              aria-label="Open Backstage Sets"
            >
              <Ticket className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="hidden sm:inline">BACKSTAGE SETS</span>
              <span className="sm:hidden font-mono text-[11px]">SETS</span>
            </button>

            {/* Semantic Search Quick Trigger Button — Liquid Glass Pill */}
            <button
              onClick={() => window.dispatchEvent(new Event("open-search"))}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 liquid-glass-pill hover:liquid-glass text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-bold font-mono cursor-pointer active:scale-95 shrink-0"
              title="Semantic Search Roast Sets (Ctrl + K)"
              aria-label="Search Roast Sets"
            >
              <Search className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="hidden md:inline">SEARCH</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] bg-white/80 border border-white/90 shadow-2xs rounded-md text-[#BE185D] font-bold">
                Ctrl K
              </kbd>
            </button>

            {/* Marquee Brand */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 group cursor-pointer" title="Back to Arena Entrance">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl liquid-glass-pink flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-black tracking-wider text-xs sm:text-sm text-[#2D1C24] uppercase font-mono truncate">
                    ROASTMASTER
                  </span>
                  <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#FFE4E6]/80 border border-[#FDA4AF]/60 text-[#E11D48] text-[9px] font-black tracking-widest uppercase shrink-0 backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <span>ON AIR</span>
                  </div>
                </div>
                <span className="hidden md:inline text-[10px] text-[#836270] font-medium tracking-tight">
                  LIVE AT THE CELLAR • VIP FRONT ROW
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Stage Crowd Heat Indicator (Desktop) — Liquid Glass Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs">
            <Radio className="w-3.5 h-3.5 text-[#EC4899] animate-pulse" />
            <span className="text-[#836270] text-[11px] font-medium">Stage Heat:</span>
            <span className="text-[#BE185D] font-mono font-bold text-xs">9.8/10 BRUTAL</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* New Set button — Glowing Liquid Pink Glass */}
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white liquid-glass-pink hover:opacity-95 rounded-xl cursor-pointer active:scale-95 font-mono uppercase tracking-wider"
              title="Start a new live set on stage"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Set</span>
            </button>

            {/* VIP Pass (Logged Out) or User Profile Pill (Logged In) on Big Screens */}
            {!user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden sm:inline-flex text-xs font-bold text-[#BE185D] hover:text-[#9D174D] liquid-glass-pill px-3.5 py-1.5 rounded-xl cursor-pointer font-mono"
              >
                VIP Pass
              </button>
            ) : (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl liquid-glass-pill group cursor-pointer"
                title="View & Edit VIP Heckler Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FCE7F3] border border-white/80 flex items-center justify-center text-xs font-bold text-[#BE185D] shadow-2xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
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
            sessionId={currentSessionId}
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
