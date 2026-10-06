"use client";
// components/SearchModal.jsx — Cmd+K / Ctrl+K Semantic Search Command Palette (Baby Pink Edition)
import { useState, useEffect, useRef, useCallback } from "react";
import { formatSessionDisplayTitle } from "@/lib/firestore";
import {
  Search,
  X,
  Sparkles,
  Command,
  ArrowRight,
  Flame,
  CornerDownLeft,
  Clock,
  Tag,
  Loader2,
  Ticket,
} from "lucide-react";

const SUGGESTED_QUERIES = [
  "CSS centering nightmares",
  "React useEffect loop",
  "Git merge disaster",
  "Database query without where clause",
  "Python package manager chaos",
];

export default function SearchModal({
  isOpen,
  onClose,
  sessions = [],
  onSelectSession,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Auto-focus input when opened & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Ctrl+K, Cmd+K, Escape, Arrow navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle modal with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const count = results.length > 0 ? results.length : Math.min(sessions.length, 5);
          return count === 0 ? 0 : (prev + 1) % count;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const count = results.length > 0 ? results.length : Math.min(sessions.length, 5);
          return count === 0 ? 0 : (prev - 1 + count) % count;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeList = results.length > 0 ? results : sessions.slice(0, 5);
        if (activeList[selectedIndex]) {
          handleSelect(activeList[selectedIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, results, sessions, selectedIndex]);

  // Debounced semantic search query to /api/search
  const executeSearch = useCallback(
    async (searchQuery) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: trimmed,
            candidates: sessions,
            limit: 8,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Semantic search failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [sessions]
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 280);
  };

  const handleSelect = (sid) => {
    onSelectSession(sid);
    onClose();
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    executeSearch(text);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-24 px-3 sm:px-4">
      {/* Dim Stage Overlay */}
      <div
        className="fixed inset-0 bg-[#2D1C24]/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Command Palette Modal — Liquid Glass Monolith */}
      <div className="relative w-full max-w-2xl liquid-glass rounded-3xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 text-[#2D1C24]">
        {/* Top Search Bar — Liquid Glass */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/70 liquid-glass-subtle">
          <div className="w-9 h-9 rounded-2xl liquid-glass-pink flex items-center justify-center shrink-0 shadow-xs">
            <Search className="w-4 h-4 text-white" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search past roast sets by meaning (e.g. 'flexbox fails')..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#2D1C24] placeholder-[#A47F90] outline-none font-medium"
            autoComplete="off"
            spellCheck="false"
          />

          {loading ? (
            <Loader2 className="w-5 h-5 text-[#EC4899] animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 text-[#836270] hover:text-[#2D1C24] hover:bg-white/70 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/70">
            <kbd className="px-2 py-1 text-[10px] font-mono font-bold text-[#BE185D] bg-white/80 border border-white/90 rounded-lg shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* AI Semantic Engine Indicator Pill — Liquid Glass */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 liquid-glass-subtle border-b border-white/70 text-[11px] font-mono text-[#836270]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#EC4899] animate-pulse" />
            <span className="font-semibold text-[#BE185D]">Gemini Vector Semantic Search</span>
            <span className="text-[#A47F90] hidden sm:inline">• 768-dim embeddings</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#A47F90]">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </div>
        </div>

        {/* Modal Results & States Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-2">
          {/* State 1: Active Search Results */}
          {query.trim() && results.length > 0 && (
            <div className="space-y-2">
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#836270] uppercase tracking-wider">
                Matches ({results.length})
              </div>
              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const matchPercent = Math.round((item.similarityScore || 0) * 100);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group/item flex flex-col p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "liquid-glass-pink-soft !border-[#EC4899] shadow-xs"
                        : "liquid-glass-pill hover:liquid-glass"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#EC4899] text-white"
                              : "bg-[#FCE7F3] text-[#BE185D]"
                          }`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-[#2D1C24] truncate group-hover/item:text-[#BE185D]">
                          {formatSessionDisplayTitle(item)}
                        </span>
                      </div>

                      {/* Match Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.category && (
                          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-[#FCE7F3] text-[#BE185D] text-[10px] font-bold font-mono">
                            {item.category}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            matchPercent >= 60
                              ? "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]"
                              : "bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8]"
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{matchPercent}% Match</span>
                        </span>
                      </div>
                    </div>

                    {/* Roast Snippet */}
                    {item.snippet && (
                      <p className="mt-2 text-xs text-[#836270] line-clamp-2 italic pl-9 leading-relaxed">
                        "{item.snippet}"
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-[#FCE7F3]/70 flex items-center justify-between text-[11px] font-mono text-[#A47F90] pl-9">
                      <div className="flex items-center gap-3">
                        {item.messageCount != null && (
                          <span>{item.messageCount} roasts in set</span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-[#EC4899]">
                          {item.matchType === "hybrid" ? "🔥 Hybrid Match" : "🎯 Semantic Match"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#BE185D] opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold">Open Set</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* State 2: No Results Found */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center">
                <Flame className="w-6 h-6 text-[#E11D48]" />
              </div>
              <p className="font-extrabold text-[#2D1C24] text-sm mb-1">
                No matching roast sets in the vault
              </p>
              <p className="text-xs text-[#836270] max-w-sm mx-auto leading-relaxed">
                Even our standup AI couldn't find a burn matching "{query}". Try searching for concepts like "centering", "infinite loop", or "database".
              </p>
            </div>
          )}

          {/* State 3: Empty Query State — Suggestions & Recent Sets */}
          {!query.trim() && (
            <div className="space-y-4 py-2">
              {/* Suggested Themes */}
              <div>
                <div className="px-1 mb-2 text-[10px] font-mono font-bold text-[#836270] uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#EC4899]" />
                  <span>Try Semantic Concepts</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUERIES.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSuggestionClick(tag)}
                      className="px-3 py-1.5 rounded-xl liquid-glass-pill hover:liquid-glass text-[#BE185D] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-[#EC4899]" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Sets */}
              {sessions.length > 0 && (
                <div>
                  <div className="px-1 mb-2 text-[10px] font-mono font-bold text-[#836270] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#EC4899]" />
                    <span>Recent VIP Sets</span>
                  </div>
                  <div className="space-y-1.5">
                    {sessions.slice(0, 4).map((s, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelect(s.id)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "liquid-glass-pink-soft !border-[#EC4899] shadow-xs"
                              : "liquid-glass-pill hover:liquid-glass"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Ticket className="w-4 h-4 text-[#EC4899] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#2D1C24] truncate">
                                {formatSessionDisplayTitle(s)}
                              </p>
                              {s.snippet && (
                                <p className="text-[11px] text-[#836270] truncate max-w-md">
                                  {s.snippet}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-[#BE185D]">
                            <span className="hidden sm:inline text-[10px]">Open</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FFF0F4] border-t border-[#FBCFE8] flex items-center justify-between text-[11px] font-mono text-[#836270]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🔥</span>
            <span>RoastMaster AI Live Vault</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-white border border-[#FBCFE8] rounded text-[#BE185D] font-bold">Esc</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
