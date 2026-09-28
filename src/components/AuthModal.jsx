"use client";
// components/AuthModal.jsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthModal({ onClose }) {
  const { loginWithGoogle, signUpWithEmail, loginWithEmail, loginAsGuest } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getFriendlyError = (e) => {
    const code = e?.code || "";
    if (code === "auth/admin-restricted-operation") {
      return "Anonymous guest login is not enabled in Firebase Console. Please sign up or log in with Email/Google.";
    }
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
    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in popup was closed before completion.";
    }
    if (code === "auth/cancelled-popup-request") {
      return "Sign-in was cancelled.";
    }
    if (code === "auth/unauthorized-domain") {
      return "Domain is not authorized in Firebase Console (Authentication → Settings → Authorized domains).";
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
          className="absolute top-4 right-4 text-[#8C7E74] hover:text-[#241E1C] hover:bg-[#EFE8DE] p-1.5 rounded-lg text-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >✕</button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
            🔥
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

        {/* Google */}
        <button
          type="button"
          onClick={() => handle(loginWithGoogle)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] border border-[#DDD3C4] text-[#241E1C] font-semibold py-2.5 sm:py-3 px-4 rounded-xl mb-4 shadow-2xs transition-all text-xs sm:text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#E8E0D5]" />
          <span className="text-[#9C8F85] text-xs">or</span>
          <div className="flex-1 h-px bg-[#E8E0D5]" />
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
            <p className="text-[#B91C1C] text-xs mt-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 leading-relaxed">
              ⚠️ {error}
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
        <p className="text-center text-[#786C63] text-xs mt-4">
          {mode === "login" ? "No account yet? " : "Already suffering? "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-[#D97706] font-semibold hover:underline cursor-pointer"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#E8E0D5]" />
          <span className="text-[#9C8F85] text-xs">too scared to commit?</span>
          <div className="flex-1 h-px bg-[#E8E0D5]" />
        </div>

        {/* Guest */}
        <button
          type="button"
          onClick={() => handle(loginAsGuest)}
          disabled={loading}
          className="w-full border border-[#DDD3C4] hover:border-[#9C8F85] hover:bg-[#F6F0E6] text-[#5F544D] hover:text-[#241E1C] font-semibold py-2.5 sm:py-3 rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          👤 Continue as Guest
        </button>
        <p className="text-center text-[#8C7E74] text-xs mt-2">
          Guest sessions are temporary — history won't be saved
        </p>
      </div>
    </div>
  );
}