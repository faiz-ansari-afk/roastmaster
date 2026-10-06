"use client";
// components/AuthModal.jsx — VIP Comedy Club Backstage Lounge Pass (Baby Pink Edition)
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, AlertCircle, Ticket, Lock, Mail, User } from "lucide-react";

export default function AuthModal({ onClose }) {
  const { signUpWithEmail, loginWithEmail } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getFriendlyError = (e) => {
    const code = e?.code || "";
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Switch to Log In.";
    }
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "Invalid email or password. Please verify your credentials.";
    }
    if (code === "auth/weak-password") {
      return "Password should be at least 6 characters long.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    const msg = e?.message || "Something went wrong. Please try again.";
    return msg.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)\.?/, "").trim() || "Authentication failed.";
  };

  const handle = async (fn) => {
    setError("");
    setLoading(true);
    try {
      await fn();
      onClose();
    } catch (e) {
      console.error("[Auth] Error:", e);
      setError(getFriendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    handle(
      mode === "login"
        ? () => loginWithEmail(email, password)
        : () => signUpWithEmail(email, password, displayName)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1C24]/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-8 text-[#2D1C24] max-h-[90dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9D7889] hover:text-[#2D1C24] liquid-glass-pill p-2 rounded-xl transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl liquid-glass-pink flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(236,72,153,0.3)]">
            <Ticket className="w-7 h-7 text-white" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/70 border border-white/90 text-[#BE185D] text-[10px] font-mono font-bold tracking-widest uppercase mb-1.5 shadow-2xs">
            VIP BACKSTAGE PASS
          </div>
          <h2 className="text-[#2D1C24] text-xl sm:text-2xl font-black tracking-wide uppercase font-mono">
            {mode === "login" ? "Claim Your Mic" : "Join The Lineup"}
          </h2>
          <p className="text-[#836270] text-xs mt-1.5 font-sans">
            {mode === "login"
              ? "Sign in to access your saved roast sets & comedy notes."
              : "Create an account to save your humiliation history forever."}
          </p>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC4899]" />
              <input
                type="text"
                placeholder="Heckler Name / Stage Alias"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/70 border border-white/90 focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/30 focus:bg-white text-[#2D1C24] placeholder-[#9D7889] pl-10 pr-4 py-3 rounded-xl outline-none transition-colors text-sm font-sans"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC4899]" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 border border-white/90 focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/30 focus:bg-white text-[#2D1C24] placeholder-[#9D7889] pl-10 pr-4 py-3 rounded-xl outline-none transition-colors text-sm font-sans"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EC4899]" />
            <input
              type="password"
              placeholder="Secret Passcode"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 border border-white/90 focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/30 focus:bg-white text-[#2D1C24] placeholder-[#9D7889] pl-10 pr-4 py-3 rounded-xl outline-none transition-colors text-sm font-sans"
            />
          </div>

          {error && (
            <p className="text-[#BE123C] text-xs mt-3 bg-[#FFE4E6]/90 border border-[#FDA4AF] rounded-xl px-3.5 py-2.5 leading-relaxed flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E11D48]" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-4 liquid-glass-pink hover:opacity-95 text-white font-black py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs sm:text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed active:scale-98 font-mono"
          >
            {loading ? "AUTHENTICATING..." : mode === "login" ? "ENTER VIP LOUNGE" : "CLAIM VIP PASS"}
          </button>
        </form>

        {/* Toggle Mode */}
        <p className="text-center text-[#836270] text-xs mt-6 font-mono">
          {mode === "login" ? "Need a ticket? " : "Already have a pass? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="text-[#EC4899] hover:text-[#BE185D] font-bold hover:underline cursor-pointer"
          >
            {mode === "login" ? "Sign Up Here" : "Log In Here"}
          </button>
        </p>
      </div>
    </div>
  );
}