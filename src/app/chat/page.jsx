"use client";
// app/chat/page.jsx
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, Menu, Plus } from "lucide-react";
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
    <div className="flex h-[100dvh] bg-[#FAF7F2] text-[#241E1C] overflow-hidden selection:bg-[#FEF3C7] selection:text-[#92400E]">
      {/* Sidebar */}
      <Sidebar
        activeSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onShowAuth={() => setShowAuth(true)}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b border-[#E8E0D5] bg-[#FAF7F2]/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-[#6B5F57] hover:text-[#241E1C] hover:bg-[#EFE8DE] rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand on mobile/tablet */}
            <div className="flex items-center gap-2 lg:hidden">
              <Flame className="w-5 h-5 text-[#D97706]" />
              <span className="font-extrabold tracking-tight text-sm sm:text-base text-[#241E1C]">
                RoastMaster
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              {sessionId ? "Active Session" : "New Session"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8C4A11] bg-[#F4ECE1] hover:bg-[#EAE0D3] border border-[#DDD3C4] rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Start new roast"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {!user && (
              <button
                onClick={() => setShowAuth(true)}
                className="text-xs font-semibold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden relative">
          <ChatWindow
            key={chatResetKey}
            sessionId={sessionId}
            onSessionCreated={handleSessionCreated}
            onShowAuth={() => setShowAuth(true)}
          />
        </div>
      </main>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}