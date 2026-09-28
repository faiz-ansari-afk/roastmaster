"use client";
// components/AuthModal.jsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, X, AlertCircle } from "lucide-react";

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
      return "This email is already registered. Please switch to Log In.";
    }
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Invalid email or password. Please check your credentials.";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241E1C]/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white border border-[#E8E0D5] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(36,30,28,0.15)] text-[#241E1C] max-h-[90dvh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C7E74] hover:text-[#241E1C] hover:bg-[#EFE8DE] p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Flame className="w-6 h-6 text-[#D97706]" />
          </div>
          <h2 className="text-[#92400E] text-xl sm:text-2xl font-black tracking-wider uppercase">
            {mode === "login" ? "Welcome Back" : "Join the Suffering"}
          </h2>
          <p className="text-[#786C63] text-xs mt-1.5 tracking-wide">
            {mode === "login"
              ? "Ready to get roasted again?"
              : "Create an account to save your humiliation history"}
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#DDD3C4] focus:border-[#D97706] focus:bg-white text-[#241E1C] placeholder-[#9C8F85] px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-colors text-sm"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#DDD3C4] focus:border-[#D97706] focus:bg-white text-[#241E1C] placeholder-[#9C8F85] px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-colors text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#DDD3C4] focus:border-[#D97706] focus:bg-white text-[#241E1C] placeholder-[#9C8F85] px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-colors text-sm"
          />

          {error && (
            <p className="text-[#B91C1C] text-xs mt-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 leading-relaxed flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-4 bg-gradient-to-tr from-[#D97706] to-[#F59E0B] hover:from-[#B45309] hover:to-[#D97706] text-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-xs sm:text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(217,119,6,0.25)] active:scale-98"
          >
            {loading ? "Processing..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-[#786C63] text-xs mt-5">
          {mode === "login" ? "No account yet? " : "Already suffering? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-[#D97706] font-semibold hover:underline cursor-pointer"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}