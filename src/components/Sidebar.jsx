"use client";
// components/Sidebar.jsx — Backstage Green Room & VIP Setlists (Baby Pink Edition)
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToSessions, deleteSession } from "@/lib/firestore";
import SearchModal from "./SearchModal";
import {
  Flame,
  X,
  Plus,
  Ticket,
  Trash2,
  User,
  LogOut,
  Radio,
  Clock,
  ChevronRight,
  Search,
  Sparkles,
} from "lucide-react";

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
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener & open-search event
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    const handleOpenSearchEvent = () => setSearchOpen(true);

    window.addEventListener("keydown", handleGlobalKey);
    window.addEventListener("open-search", handleOpenSearchEvent);
    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
      window.removeEventListener("open-search", handleOpenSearchEvent);
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (sessionToDelete && !deletingId) {
          setSessionToDelete(null);
        } else if (sidebarOpen) {
          onCloseSidebar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionToDelete, deletingId, sidebarOpen, onCloseSidebar]);

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
      {/* Dim Stage Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#2D1C24]/30 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
          onClick={onCloseSidebar}
        />
      )}

      {/* Backstage Green Room Slide-Out Drawer — Baby Pink Theme */}
      <aside
        className={`
          fixed top-0 left-0 h-[100dvh] w-80 sm:w-96
          bg-[#FFF5F7] text-[#2D1C24] border-r border-[#FBCFE8]
          flex flex-col z-50 transition-transform duration-300 ease-out shadow-[0_10px_40px_rgba(236,72,153,0.1)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Backstage Header */}
        <div className="p-4 sm:p-5 border-b border-[#FBCFE8] bg-[#FDF2F8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#BE185D] font-black tracking-widest text-xs uppercase font-mono">
                  BACKSTAGE
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              </div>
              <div className="text-[#2D1C24] font-extrabold text-sm tracking-tight flex items-center gap-1">
                <span>Green Room Setlists</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCloseSidebar}
            className="p-2 text-[#836270] hover:text-[#2D1C24] hover:bg-[#FCE7F3] rounded-xl transition-colors cursor-pointer"
            aria-label="Close Green Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Take The Stage Button (New Set) */}
        <div className="p-3.5 bg-[#FFF0F4] border-b border-[#FBCFE8]">
          <button
            onClick={() => {
              onNewSession();
              onCloseSidebar();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white font-bold py-3 px-4 rounded-xl shadow-[0_2px_12px_rgba(236,72,153,0.25)] hover:shadow-[0_4px_16px_rgba(236,72,153,0.35)] transition-all text-xs tracking-wider uppercase cursor-pointer active:scale-98 font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>Take The Stage (New Set)</span>
          </button>
        </div>

        {/* Semantic Search Quick Bar (Docs Style - Ctrl + K) */}
        <div className="p-3 bg-[#FFF8FA] border-b border-[#FBCFE8]">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] hover:border-[#F472B6] rounded-xl text-xs text-[#836270] hover:text-[#2D1C24] transition-all shadow-2xs group cursor-pointer"
            title="Search sets & past roasts with Semantic AI (Ctrl + K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#EC4899] group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-medium truncate text-[#836270] group-hover:text-[#2D1C24]">
                Search sets & roasts...
              </span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#BE185D] bg-[#FCE7F3] border border-[#FBCFE8] rounded-md shadow-2xs shrink-0">
              <span className="text-[9px]">Ctrl</span> K
            </kbd>
          </button>
        </div>

        {/* Gig Tickets / Sets List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#9D7889] uppercase tracking-wider font-mono">
            <span>VIP SETS ({sessions.length})</span>
            <span className="flex items-center gap-1 text-[#EC4899]">
              <Radio className="w-3 h-3 text-[#EC4899] animate-pulse" />
              <span>LIVE VAULT</span>
            </span>
          </div>

          {!user ? (
            <div className="text-center text-[#836270] text-xs mt-8 px-4 py-8 rounded-2xl bg-white border border-[#FBCFE8] shadow-2xs">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center shadow-2xs">
                <Ticket className="w-6 h-6 text-[#EC4899]" />
              </div>
              <p className="font-bold text-[#2D1C24] mb-1">VIP Passes Required</p>
              <p className="text-[11px] text-[#836270] mb-4">
                Sign in to save your roast sets, crowd burns, and punchlines permanently.
              </p>
              <button
                onClick={() => {
                  onShowAuth();
                  onCloseSidebar();
                }}
                className="w-full bg-[#EC4899] hover:bg-[#DB2777] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs font-mono"
              >
                Claim VIP Pass →
              </button>
            </div>
          ) : isGuest ? (
            <div className="text-center text-[#836270] text-xs mt-6 px-4 py-6 rounded-2xl bg-white border border-[#FBCFE8] shadow-2xs">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FCE7F3] border border-[#FBCFE8] text-[#BE185D] text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
                Guest Pass
              </span>
              <p className="text-xs text-[#2D1C24] font-semibold mb-1">
                Temporary Front Row Seat
              </p>
              <p className="text-[11px] text-[#836270] mb-3">
                Sets in guest mode disappear after closing the tab.
              </p>
              <button
                onClick={() => {
                  onShowAuth();
                  onCloseSidebar();
                }}
                className="text-[#EC4899] font-bold hover:underline text-xs cursor-pointer font-mono"
              >
                Save Sets Permanently →
              </button>
            </div>
          ) : loadingSessions ? (
            <div className="text-[#9D7889] text-xs text-center mt-12 space-y-2 animate-pulse">
              <div className="h-14 bg-white rounded-xl border border-[#FBCFE8]" />
              <div className="h-14 bg-white rounded-xl border border-[#FBCFE8]" />
              <p className="pt-2 text-[11px]">Unlocking Green Room sets...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-[#836270] text-xs mt-8 px-4 py-8 rounded-2xl bg-white border border-[#FBCFE8] shadow-2xs">
              <Flame className="w-8 h-8 text-[#F472B6]/60 mx-auto mb-2" />
              <p className="text-[#2D1C24] font-semibold text-xs">No Past Sets Yet</p>
              <p className="text-[11px] text-[#9D7889] mt-1">
                Heckle the comedian on stage to generate your first roast ticket!
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = activeSessionId === session.id;
              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseSidebar();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSelectSession(session.id);
                      onCloseSidebar();
                    }
                  }}
                  className={`
                    relative group w-full text-left p-3 rounded-xl transition-all cursor-pointer border
                    ${
                      isActive
                        ? "bg-[#FDF2F8] border-[#EC4899] text-[#9D174D] shadow-[0_2px_12px_rgba(236,72,153,0.15)]"
                        : "bg-white hover:bg-[#FDF2F8] border-[#FCE7F3] hover:border-[#FBCFE8] text-[#2D1C24] hover:text-[#9D174D]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Flame
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-[#EC4899]" : "text-[#F472B6]"
                          }`}
                        />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9D7889] truncate">
                          {isActive ? "CURRENT STAGE" : "STANDUP SET"}
                        </span>
                      </div>
                      <p className="text-xs font-bold truncate leading-tight">
                        {session.title || "Roast Session"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#836270]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.messageCount || 0} roasts</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteClick(e, session)}
                        disabled={deletingId === session.id}
                        className="opacity-0 group-hover:opacity-100 text-[#836270] hover:text-[#E11D48] transition-all p-1.5 rounded-lg hover:bg-[#FFE4E6] shrink-0 cursor-pointer"
                        title="Delete set"
                        aria-label={`Delete set ${session.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? "text-[#EC4899] translate-x-0.5"
                            : "text-[#D1B8C4] group-hover:text-[#836270]"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VIP Lounge Footer */}
        <div className="p-3.5 border-t border-[#FBCFE8] bg-[#FDF2F8]">
          {!user ? (
            <button
              onClick={() => {
                onShowAuth();
                onCloseSidebar();
              }}
              className="w-full bg-[#EC4899] hover:bg-[#DB2777] text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs font-mono"
            >
              Sign In To VIP Lounge
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center text-xs font-black text-[#BE185D] shrink-0 overflow-hidden shadow-2xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : isGuest ? (
                  <User className="w-4 h-4 text-[#EC4899]" />
                ) : (
                  <span>
                    {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#2D1C24] text-xs font-bold truncate">
                  {isGuest ? "VIP Front-Row Guest" : (user.displayName || user.email)}
                </p>
                <p className="text-[#836270] text-[10px] font-mono uppercase tracking-wider">
                  {isGuest ? "Temporary Pass" : "Verified Heckler"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#836270] hover:text-[#E11D48] text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1 hover:underline p-1.5 rounded-lg hover:bg-white"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Delete Set Confirmation Modal */}
      {sessionToDelete && (
        <div
          className="fixed inset-0 bg-[#2D1C24]/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 transition-all"
          onClick={() => !deletingId && setSessionToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="relative w-full max-w-sm bg-white border border-[#FBCFE8] rounded-3xl p-6 shadow-[0_20px_50px_rgba(236,72,153,0.15)] text-[#2D1C24]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center mx-auto mb-3.5 text-[#E11D48] shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3
                id="delete-modal-title"
                className="text-base sm:text-lg font-black text-[#2D1C24] uppercase tracking-tight font-mono"
              >
                Shred This Comedy Set?
              </h3>
              <p className="text-xs text-[#836270] mt-2 leading-relaxed">
                Are you sure you want to cancel{" "}
                <span className="font-bold text-[#EC4899]">
                  "{sessionToDelete.title || "this set"}"
                </span>
                ? All punchlines, roasts, and comedy notes will be permanently erased.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2.5 px-3 border border-[#FBCFE8] hover:bg-[#FDF2F8] text-[#836270] hover:text-[#2D1C24] font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-98 font-mono"
              >
                {deletingId ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Shredding...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Shred Set</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Search Command Palette Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        sessions={sessions}
        onSelectSession={(sid) => {
          onSelectSession(sid);
          onCloseSidebar();
        }}
      />
    </>
  );
}