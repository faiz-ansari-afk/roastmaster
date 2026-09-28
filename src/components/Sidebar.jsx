"use client";
// components/Sidebar.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToSessions, deleteSession } from "@/lib/firestore";
import { Flame, X, Plus, MessageSquare, Trash2, User, LogOut } from "lucide-react";

export default function Sidebar({
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onShowAuth,
  sidebarOpen,
  onCloseSidebar,
}) {
  const { user, isGuest, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sessionToDelete && !deletingId) {
        setSessionToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionToDelete, deletingId]);

  // Real-time Firestore listener for user sessions
  useEffect(() => {
    if (!user || isGuest) {
      setSessions([]);
      setLoadingSessions(false);
      return;
    }

    setLoadingSessions(true);
    const unsubscribe = subscribeToSessions(user.uid, (data) => {
      setSessions(data || []);
      setLoadingSessions(false);
    });

    return () => unsubscribe();
  }, [user, isGuest]);

  const handleLogout = async () => {
    try {
      await logout();
      setSessions([]);
      onNewSession();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDeleteClick = (e, session) => {
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete || !user) return;
    const deletedId = sessionToDelete.id;
    setDeletingId(deletedId);
    try {
      await deleteSession(user.uid, deletedId);
      setSessions((prev) => prev.filter((s) => s.id !== deletedId));
      if (onDeleteSession) {
        onDeleteSession(deletedId);
      } else if (activeSessionId === deletedId) {
        onNewSession();
      }
      setSessionToDelete(null);
    } catch (err) {
      console.error("Delete session error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Overlay for mobile & tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#241E1C]/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-[100dvh] w-72 sm:w-80 bg-[#F7F3ED] border-r border-[#E6DDD0]
          flex flex-col z-50 transition-transform duration-300 shadow-xl lg:shadow-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 border-b border-[#E6DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shadow-2xs">
              <Flame className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="text-[#92400E] font-black tracking-wider text-sm uppercase">
                RoastMaster
              </div>
              <div className="text-[#8C7E74] text-[10px] font-medium tracking-wider">AI THAT HATES YOU</div>
            </div>
          </div>
          <button
            onClick={onCloseSidebar}
            className="lg:hidden p-1.5 text-[#8C7E74] hover:text-[#241E1C] hover:bg-[#EAE2D5] rounded-lg transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => { onNewSession(); onCloseSidebar(); }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs sm:text-sm cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Roast Session</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {!user ? (
            <div className="text-center text-[#8C7E74] text-xs mt-10 px-4">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#EFE8DE] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#8C7E74]" />
              </div>
              <p className="mb-3 text-[#5F544D]">Sign in to save your roast history</p>
              <button
                onClick={onShowAuth}
                className="text-[#D97706] font-semibold hover:underline text-xs cursor-pointer"
              >
                Sign In →
              </button>
            </div>
          ) : isGuest ? (
            <div className="text-center text-[#8C7E74] text-xs mt-10 px-4">
              <p className="mb-1 text-[#5F544D] font-medium">Guest mode active</p>
              <p className="mb-3 text-[#8C7E74] text-[11px]">History won't be saved permanently</p>
              <button
                onClick={onShowAuth}
                className="text-[#D97706] font-semibold hover:underline text-xs cursor-pointer"
              >
                Create Free Account →
              </button>
            </div>
          ) : loadingSessions ? (
            <div className="text-[#8C7E74] text-xs text-center mt-10 animate-pulse">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-[#8C7E74] text-xs text-center mt-10 px-4">
              No past sessions yet. Ask your first question!
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
                    ? "bg-[#EFE8DE] border border-[#DDD0C0] text-[#241E1C] font-medium shadow-2xs"
                    : "hover:bg-[#EFE8DE]/60 text-[#5F544D] hover:text-[#241E1C] border border-transparent"}
                `}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">{session.title}</p>
                  <p className="text-[10px] text-[#8C7E74] mt-1 flex items-center gap-1">
                    <span>{session.messageCount || 0} messages</span>
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(e, session)}
                  disabled={deletingId === session.id}
                  className="opacity-0 group-hover:opacity-100 text-[#8C7E74] hover:text-[#DC2626] transition-all p-1.5 rounded-md hover:bg-[#E2D6C7] shrink-0 cursor-pointer"
                  title="Delete session"
                  aria-label={`Delete session ${session.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User info / Login at bottom */}
        <div className="p-3.5 border-t border-[#E6DDD0] bg-[#EFE9E1]/50">
          {!user ? (
            <button
              onClick={onShowAuth}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E2D7C8] border border-[#DDD0BF] flex items-center justify-center text-xs font-bold text-[#5F544D] shrink-0 overflow-hidden shadow-2xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : isGuest ? (
                  <User className="w-4 h-4 text-[#5F544D]" />
                ) : (
                  <span>{(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#241E1C] text-xs font-semibold truncate">
                  {isGuest ? "Guest User" : (user.displayName || user.email)}
                </p>
                <p className="text-[#8C7E74] text-[10px]">
                  {isGuest ? "Temporary session" : "Logged in"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#8C7E74] hover:text-[#DC2626] text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 hover:underline"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div
          className="fixed inset-0 bg-[#241E1C]/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 transition-all"
          onClick={() => !deletingId && setSessionToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="relative w-full max-w-sm bg-white border border-[#E8E0D5] rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(36,30,28,0.2)] text-[#241E1C]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mx-auto mb-3.5 text-[#DC2626] shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3 id="delete-modal-title" className="text-base sm:text-lg font-bold text-[#241E1C]">
                Delete Roast Session?
              </h3>
              <p className="text-xs text-[#786C63] mt-1.5 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[#241E1C]">
                  "{sessionToDelete.title || "this session"}"
                </span>
                ? All roasts and messages in this session will be permanently erased.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 px-3 border border-[#DDD3C4] hover:bg-[#F6F0E6] text-[#5F544D] hover:text-[#241E1C] font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-98"
              >
                {deletingId ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}