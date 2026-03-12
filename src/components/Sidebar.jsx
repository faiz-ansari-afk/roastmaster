"use client";
// components/Sidebar.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSessions, createSession, deleteSession } from "@/lib/firestore";

export default function Sidebar({
  activeSessionId,
  onSelectSession,
  onNewSession,
  onShowAuth,
  sidebarOpen,
  onCloseSidebar,
}) {
  const { user, isGuest, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch sessions whenever user changes or a new session is created
  useEffect(() => {
    if (!user || isGuest) { setSessions([]); return; }
    fetchSessions();
  }, [user, isGuest]);

  const fetchSessions = async () => {
    if (!user || isGuest) return;
    setLoadingSessions(true);
    try {
      const data = await getSessions(user.uid);
      setSessions(data);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Called by parent when a new session is created so we can refresh
  useEffect(() => {
    if (!user || isGuest) return;
    fetchSessions();
  }, [activeSessionId]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(user.uid, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) onNewSession();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-zinc-900
          flex flex-col z-30 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-[#ff2200] font-black tracking-widest uppercase text-sm">
                RoastMaster
              </div>
              <div className="text-zinc-700 text-[10px] tracking-wider">AI THAT HATES YOU</div>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => { onNewSession(); onCloseSidebar(); }}
            className="w-full flex items-center gap-2 bg-[#ff2200]/10 hover:bg-[#ff2200]/20 border border-[#ff2200]/30 hover:border-[#ff2200]/60 text-[#ff2200] font-bold py-2.5 px-4 rounded-xl transition-all text-sm"
          >
            <span className="text-lg">+</span> New Roast Session
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {!user ? (
            <div className="text-center text-zinc-600 text-xs mt-8 px-4">
              <p className="mb-3">Login to save your roast history 😬</p>
              <button
                onClick={onShowAuth}
                className="text-[#ff2200] hover:underline text-xs"
              >
                Sign In
              </button>
            </div>
          ) : isGuest ? (
            <div className="text-center text-zinc-600 text-xs mt-8 px-4">
              <p className="mb-1">You're a guest.</p>
              <p className="mb-3 text-zinc-700">History won't be saved.</p>
              <button
                onClick={onShowAuth}
                className="text-[#ff2200] hover:underline"
              >
                Create Account →
              </button>
            </div>
          ) : loadingSessions ? (
            <div className="text-zinc-700 text-xs text-center mt-8 animate-pulse">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-zinc-700 text-xs text-center mt-8 px-4">
              No sessions yet. Start getting roasted!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => { onSelectSession(session.id); onCloseSidebar(); }}
                onKeyDown={(e) => e.key === "Enter" && onSelectSession(session.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl transition-all group flex items-start justify-between gap-2 cursor-pointer
                  ${activeSessionId === session.id
                    ? "bg-[#ff2200]/15 border border-[#ff2200]/30 text-white"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent"}
                `}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{session.title}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {session.messageCount || 0} messages
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  disabled={deletingId === session.id}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-sm mt-0.5 shrink-0"
                  title="Delete session"
                >
                  {deletingId === session.id ? "..." : "✕"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* User info / Login at bottom */}
        <div className="p-4 border-t border-zinc-900">
          {!user ? (
            <button
              onClick={onShowAuth}
              className="w-full bg-[#ff2200] hover:bg-[#cc1a00] text-white font-black py-2.5 rounded-xl text-sm uppercase tracking-widest transition-all"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{isGuest ? "👤" : (user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {isGuest ? "Guest User" : (user.displayName || user.email)}
                </p>
                <p className="text-zinc-600 text-[10px]">
                  {isGuest ? "Temporary session" : "Logged in"}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-zinc-600 hover:text-red-400 text-xs transition-colors shrink-0"
                title="Sign out"
              >
                Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}