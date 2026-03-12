"use client";
// app/chat/page.jsx
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { createSession } from "@/lib/firestore";

export default function ChatPage() {
  const { user, isGuest } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  };

  const handleSessionCreated = (sid) => {
    setSessionId(sid);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSessionId={sessionId}
        onSelectSession={setSessionId}
        onNewSession={handleNewSession}
        onShowAuth={() => setShowAuth(true)}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900 bg-[#0a0a0a]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-500 hover:text-white transition-colors text-xl w-8"
          >
            ☰
          </button>
          <div className="flex-1">
            <span className="text-zinc-500 text-xs font-mono tracking-wider">
              {sessionId ? "ACTIVE SESSION" : "NEW SESSION"}
            </span>
          </div>
          {!user && (
            <button
              onClick={() => setShowAuth(true)}
              className="text-xs text-[#ff2200] border border-[#ff2200]/30 hover:border-[#ff2200] px-3 py-1.5 rounded-lg transition-all font-mono"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
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