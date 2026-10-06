"use client";
// components/SignOutModal.jsx — Confirmation Modal for Signing Out (Baby Pink Edition)
import { useEffect, useState } from "react";
import { LogOut, X, Loader2 } from "lucide-react";

export default function SignOutModal({ isOpen, onClose, onConfirm, isGuest = false }) {
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#2D1C24]/40 backdrop-blur-xs z-[110] flex items-center justify-center p-4 transition-all"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        className="relative w-full max-w-sm bg-white border border-[#FBCFE8] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(236,72,153,0.18)] text-[#2D1C24]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 text-[#836270] hover:text-[#2D1C24] hover:bg-[#FCE7F3] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center mx-auto mb-3.5 text-[#E11D48] shadow-2xs">
          <LogOut className="w-6 h-6" />
        </div>

        {/* Text Details */}
        <div className="text-center mb-5">
          <h3
            id="signout-modal-title"
            className="text-base sm:text-lg font-black text-[#2D1C24] uppercase tracking-tight font-mono"
          >
            Leave The Stage?
          </h3>
          <p className="text-xs text-[#836270] mt-2 leading-relaxed">
            {isGuest ? (
              <>
                You are currently in front row with a{" "}
                <span className="font-bold text-[#BE185D]">Guest Pass</span>. Any unsaved roast sets will disappear once you leave.
              </>
            ) : (
              <>
                Are you sure you want to sign out? Your saved roast sets, crowd burns, and comedy notes will remain safely in the vault.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 py-2.5 px-3 border border-[#FBCFE8] hover:bg-[#FDF2F8] text-[#836270] hover:text-[#2D1C24] font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Stay On Stage
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-98 font-mono"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
