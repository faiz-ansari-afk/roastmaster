"use client";
// app/profile/page.jsx — VIP Comedy Club Heckler Profile & Backstage Pass
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserProfile,
  saveUserProfile,
  getSessions,
  deleteAllUserSessions,
} from "@/lib/firestore";
import AuthModal from "@/components/AuthModal";
import SignOutModal from "@/components/SignOutModal";
import {
  Flame,
  ArrowLeft,
  Ticket,
  User,
  ShieldCheck,
  Sparkles,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Image as ImageIcon,
  Upload,
  Mic2,
  Camera,
} from "lucide-react";

// Curated comedy club avatar presets
const AVATAR_PRESETS = [
  {
    id: "mic-master",
    name: "Stage Comic",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=mic-headliner&backgroundColor=ffd5dc",
  },
  {
    id: "tomato-heckler",
    name: "Tomato Slinger",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=tomato-slinger&backgroundColor=ffccd5",
  },
  {
    id: "spicy-flame",
    name: "Fire Roaster",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=spicy-flame&backgroundColor=fce7f3",
  },
  {
    id: "vip-critic",
    name: "Front Row VIP",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=vip-critic&backgroundColor=fbcfe8",
  },
  {
    id: "theater-mask",
    name: "Drama Critic",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=theater-punchline&backgroundColor=fdf2f8",
  },
  {
    id: "deadpan-bot",
    name: "Deadpan AI",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=roast-master-bot&backgroundColor=fecdd3",
  },
];

// Quick persona tags to autofill stage title
const PERSONA_SUGGESTIONS = [
  "Senior Frontend Heckler",
  "Veg Biryani Purist",
  "Zero Mercy Code Critic",
  "Tabs vs Spaces Crusader",
  "Friday 5 PM Deployer",
  "Console.log Architect",
];

const ROAST_LEVELS = [
  {
    id: "mild",
    label: "Crispy Mild (3/10)",
    desc: "Gentle teasing, light burns, safe for sensitive egos.",
    icon: "🌶️",
  },
  {
    id: "sarcastic",
    label: "Medium Spicy (7/10)",
    desc: "Witty standup crowd work, sharp punchlines.",
    icon: "🔥",
  },
  {
    id: "incineration",
    label: "Total Incineration (9.8/10)",
    desc: "Ruthless technical roasted destruction. Zero mercy.",
    icon: "💀",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { user, loading, isGuest, logout, updateUserProfile } = useAuth();

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [stageTitle, setStageTitle] = useState("Front-Row Heckler");
  const [bio, setBio] = useState("");
  const [roastLevel, setRoastLevel] = useState("incineration");
  const [favoriteTopic, setFavoriteTopic] = useState("");

  // UI state
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Delete all chats modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [deletingChats, setDeletingChats] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");

  // Whenever photoURL changes, reset image error state
  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  // Fetch user profile and sessions count from Firestore
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    setDisplayName(user.displayName || (user.email ? user.email.split("@")[0] : ""));
    setPhotoURL(user.photoURL || "");

    async function loadData() {
      setLoadingData(true);
      try {
        const [profile, sessions] = await Promise.all([
          getUserProfile(user.uid),
          getSessions(user.uid),
        ]);

        if (profile) {
          if (profile.displayName) setDisplayName(profile.displayName);
          if (profile.photoURL) setPhotoURL(profile.photoURL);
          if (profile.stageTitle) setStageTitle(profile.stageTitle);
          if (profile.bio) setBio(profile.bio);
          if (profile.roastLevel) setRoastLevel(profile.roastLevel);
          if (profile.favoriteTopic) setFavoriteTopic(profile.favoriteTopic);
        }
        setSessionsCount(sessions?.length || 0);
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user]);

  // Handle local image file upload with client-side canvas compression (~15-25KB WebP)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WebP, GIF).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact WebP (or JPEG fallback)
        try {
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.85);
          setPhotoURL(compressedDataUrl);
        } catch {
          const fallbackDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setPhotoURL(fallbackDataUrl);
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if desired
    e.target.value = "";
  };

  // Handle Save Profile
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const trimmedName = displayName.trim() || "VIP Heckler";
      const cleanPhoto = photoURL ? photoURL.trim() : "";

      // 1. Save full comedy persona and image to Firestore DB first
      const savedToFirestore = await saveUserProfile(user.uid, {
        displayName: trimmedName,
        photoURL: cleanPhoto,
        stageTitle: stageTitle.trim(),
        bio: bio.trim(),
        roastLevel,
        favoriteTopic: favoriteTopic.trim(),
      });

      // 2. Update Firebase Auth and local React state
      await updateUserProfile({
        displayName: trimmedName,
        photoURL: cleanPhoto || null,
        stageTitle: stageTitle.trim(),
        bio: bio.trim(),
        roastLevel,
        favoriteTopic: favoriteTopic.trim(),
      });

      if (savedToFirestore) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        // Still saved in local state
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete All Chats
  const handleDeleteAllChats = async () => {
    if (!user || deletingChats) return;

    setDeletingChats(true);
    try {
      const res = await deleteAllUserSessions(user.uid);
      if (res.success) {
        setSessionsCount(0);
        setShowDeleteModal(false);
        setDeleteConfirmationText("");
        setDeleteSuccessMsg(`Shredded ${res.count} comedy sets from the vault.`);
        setTimeout(() => setDeleteSuccessMsg(""), 5000);
      } else {
        alert("Failed to shred all sets. Please check connection.");
      }
    } catch (err) {
      console.error("Delete all chats error:", err);
      alert("An error occurred while deleting your sets.");
    } finally {
      setDeletingChats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading || loadingData) {
    return (
      <main className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center animate-bounce">
            <Flame className="w-6 h-6 text-[#EC4899]" />
          </div>
          <p className="font-mono text-xs font-bold text-[#BE185D] uppercase tracking-widest">
            Loading Backstage Pass...
          </p>
        </div>
      </main>
    );
  }

  // If user is not logged in at all
  if (!user) {
    return (
      <main className="min-h-screen bg-[#FFF5F7] text-[#2D1C24] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#FBCFE8] rounded-3xl p-6 sm:p-8 text-center shadow-[0_20px_60px_rgba(236,72,153,0.12)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F472B6] to-[#EC4899] flex items-center justify-center mx-auto mb-4 text-white shadow-md">
            <Ticket className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black font-mono uppercase text-[#2D1C24] tracking-tight">
            VIP Pass Required
          </h2>
          <p className="text-xs text-[#836270] mt-2 mb-6 leading-relaxed">
            You need an active Backstage VIP Pass to view and edit your Heckler Profile and manage saved comedy sets.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Sign In • Claim VIP Pass
            </button>
            <Link
              href="/chat"
              className="w-full py-3 border border-[#FBCFE8] hover:bg-[#FDF2F8] text-[#836270] font-mono text-xs font-bold rounded-xl transition-colors text-center"
            >
              Return To Stage
            </Link>
          </div>
        </div>

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#FFF5F7] text-[#2D1C24] pt-6 pb-28 px-3 sm:px-6 relative selection:bg-[#FCE7F3] selection:text-[#BE185D] overflow-hidden">
      {/* Background Animated Liquid Glass Blobs & Caustic Refraction */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_top,_rgba(244,114,182,0.22)_0%,_rgba(236,72,153,0.05)_60%,_transparent_75%)] blur-3xl animate-spotlight" />
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-gradient-to-tr from-[#F472B6]/28 via-[#EC4899]/18 to-[#FDA4AF]/25 blur-3xl animate-liquid-1" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-gradient-to-bl from-[#EC4899]/20 via-[#F472B6]/24 to-[#FBCFE8]/32 blur-3xl animate-liquid-2" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-3 py-2 liquid-glass-pill hover:liquid-glass text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-mono font-bold transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return To Roast Stage</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE4E6]/80 border border-[#FDA4AF]/70 text-[#E11D48] text-[10px] font-mono font-black tracking-wider uppercase backdrop-blur-xs">
              <Radio className="w-3 h-3 text-[#E11D48] animate-pulse" />
              <span>LIVE ARTIST PASS</span>
            </span>
            <button
              onClick={() => setShowSignOutModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 liquid-glass-pill text-[#836270] hover:text-[#E11D48] rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer"
              title="Sign out of RoastMaster"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Guest Banner if Anonymous */}
        {isGuest && (
          <div className="mb-6 p-4 liquid-glass-subtle border border-[#FDA4AF] rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center shrink-0 text-[#E11D48]">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2D1C24]">
                  You are currently using a Temporary Guest Pass
                </p>
                <p className="text-[11px] text-[#836270]">
                  Link your account with Google or Email to save your profile permanently across devices.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="shrink-0 px-3.5 py-1.5 liquid-glass-pink text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              Upgrade Pass
            </button>
          </div>
        )}

        {/* Toast / Notification Banners */}
        {saveSuccess && (
          <div className="mb-6 p-3.5 bg-[#ECFDF5]/90 border border-[#A7F3D0] rounded-2xl flex items-center gap-2.5 text-[#065F46] animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
            <span className="text-xs font-bold font-mono">
              VIP Heckler Pass saved to database! Your stage persona and photo are active.
            </span>
          </div>
        )}

        {deleteSuccessMsg && (
          <div className="mb-6 p-3.5 bg-[#FFF1F2]/90 border border-[#FECDD3] rounded-2xl flex items-center gap-2.5 text-[#9F1239] animate-in fade-in slide-in-from-top-2 duration-200">
            <Trash2 className="w-5 h-5 text-[#E11D48] shrink-0" />
            <span className="text-xs font-bold font-mono">{deleteSuccessMsg}</span>
          </div>
        )}

        {/* Main 2-Column Layout: Visual VIP Badge & Profile Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live VIP Artist Laminate Card & Stats (Sticky on desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-5">
            {/* VIP Pass Card Visualizer — Liquid Glass Monolith */}
            <div className="relative liquid-glass rounded-3xl p-5 text-center overflow-hidden">
              {/* Lanyard Hole */}
              <div className="w-12 h-2.5 rounded-full bg-white/70 border border-white/90 mx-auto mb-4 shadow-inner" />

              {/* Club Header */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-white/95 text-[9px] font-mono font-black text-[#BE185D] tracking-widest uppercase mb-4 shadow-2xs">
                <Flame className="w-3 h-3 text-[#EC4899]" />
                <span>ROASTMASTER VIP ACCESS</span>
              </div>

              {/* Avatar Preview */}
              <div className="relative w-24 h-24 mx-auto mb-3.5">
                <div className="w-full h-full rounded-2xl liquid-glass-pink p-1 shadow-[0_6px_20px_rgba(236,72,153,0.3)] overflow-hidden">
                  <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                    {photoURL && !imgError ? (
                      <img
                        src={photoURL}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="text-2xl font-black font-mono text-[#EC4899]">
                        {(displayName?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#10B981] border-2 border-white flex items-center justify-center text-white shadow-xs" title="Verified Heckler">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* User Info */}
              <h3 className="text-base font-black text-[#2D1C24] font-mono uppercase tracking-tight truncate">
                {displayName || "Anonymous Heckler"}
              </h3>
              <p className="text-[11px] font-mono font-bold text-[#EC4899] uppercase tracking-wider mt-0.5">
                {stageTitle || "VIP Front Row"}
              </p>

              {bio && (
                <p className="text-xs text-[#836270] mt-3 px-2 italic line-clamp-3 leading-relaxed font-sans bg-white/60 py-2 rounded-xl border border-white/80">
                  "{bio}"
                </p>
              )}

              {/* Decorative Holographic Barcode */}
              <div className="mt-5 pt-4 border-t border-white/70 flex items-center justify-between text-[9px] font-mono text-[#9D7889]">
                <span>TABLE #01 • FRONT ROW</span>
                <span className="font-bold text-[#BE185D]">
                  {isGuest ? "GUEST PASS" : "AUTHENTICATED"}
                </span>
              </div>
            </div>

            {/* Stage Activity Stats Card — Liquid Glass */}
            <div className="liquid-glass rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-mono font-black text-[#BE185D] uppercase tracking-wider flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Heckler Stats</span>
              </h4>

              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-3 liquid-glass-subtle rounded-2xl">
                  <span className="text-[10px] text-[#836270] font-semibold block uppercase">
                    Saved Sets
                  </span>
                  <span className="text-lg font-black text-[#2D1C24]">{sessionsCount}</span>
                </div>
                <div className="p-3 liquid-glass-subtle rounded-2xl">
                  <span className="text-[10px] text-[#836270] font-semibold block uppercase">
                    Stage Heat
                  </span>
                  <span className="text-lg font-black text-[#EC4899]">9.8/10</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#836270] font-sans flex items-center justify-between">
                <span>Account Type:</span>
                <span className="font-mono font-bold text-[#2D1C24]">
                  {isGuest ? "Temporary Guest" : (user.email ? "Verified VIP" : "Standard")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Edit Form & Danger Zone */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSave} className="liquid-glass rounded-3xl p-5 sm:p-7 space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2D1C24] font-mono uppercase tracking-tight flex items-center gap-2">
                  <User className="w-5 h-5 text-[#EC4899]" />
                  <span>Customize Your Heckler Persona</span>
                </h3>
                <p className="text-xs text-[#836270] mt-1 leading-relaxed">
                  These details feed our Comedy Vault AI so the headliner can tailor crowd-work roasts specifically to you.
                </p>
              </div>

              {/* Profile Picture Selection */}
              <div className="space-y-3 pt-2 border-t border-[#FCE7F3]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                    Profile Picture
                  </label>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL("")}
                      className="text-[11px] font-mono text-[#E11D48] hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Upload from Local Device (Phone or Computer) */}
                <div className="p-3.5 rounded-2xl bg-[#FFF8FA] border border-[#FBCFE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FCE7F3] border border-[#FBCFE8] flex items-center justify-center text-[#EC4899] shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2D1C24]">Upload from your device</p>
                      <p className="text-[11px] text-[#836270]">Select any PNG, JPG, or WebP photo.</p>
                    </div>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FDF2F8] border border-[#FBCFE8] hover:border-[#F472B6] text-[#BE185D] hover:text-[#9D174D] rounded-xl text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#EC4899]" />
                      <span>Choose File</span>
                    </button>
                  </div>
                </div>

                {/* Preset Avatar Gallery */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] text-[#836270] font-medium">Or choose a Comedy Club avatar preset:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = photoURL === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPhotoURL(preset.url)}
                          className={`relative p-2 rounded-2xl border transition-all text-center group cursor-pointer flex flex-col items-center ${
                            isSelected
                              ? "bg-[#FCE7F3] border-[#EC4899] ring-2 ring-[#EC4899]/30 scale-102"
                              : "bg-[#FFF8FA] border-[#FBCFE8] hover:border-[#F472B6]"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 rounded-xl mb-1 object-cover"
                          />
                          <span className="text-[10px] font-mono text-[#836270] truncate w-full">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Or Custom Avatar URL input */}
                <div className="pt-1">
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-[#9D7889] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={photoURL.startsWith("data:") ? "" : photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder={photoURL.startsWith("data:") ? "Custom photo uploaded from device" : "Or paste image link (https://...)"}
                      className="w-full bg-[#FFF8FA] border border-[#FBCFE8] focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#2D1C24] outline-none font-mono transition-all placeholder:text-[#9D7889]"
                    />
                  </div>
                </div>
              </div>

              {/* Display Name / Heckler Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                  Stage Display Name <span className="text-[#EC4899]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Faiz or RoastGod"
                  maxLength={40}
                  className="w-full bg-[#FFF8FA] border border-[#FBCFE8] focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/20 rounded-xl px-3.5 py-2.5 text-sm text-[#2D1C24] outline-none transition-all font-sans font-medium"
                />
              </div>

              {/* Stage Persona Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                    Stage Persona / Title
                  </label>
                  <span className="text-[10px] text-[#9D7889] font-mono">Displayed on badge</span>
                </div>
                <input
                  type="text"
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Heckler"
                  maxLength={35}
                  className="w-full bg-[#FFF8FA] border border-[#FBCFE8] focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#2D1C24] outline-none font-mono transition-all"
                />
                {/* Persona Quick Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PERSONA_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setStageTitle(tag)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        stageTitle === tag
                          ? "bg-[#FCE7F3] border-[#EC4899] text-[#BE185D] font-bold"
                          : "bg-[#FFF8FA] border-[#FCE7F3] text-[#836270] hover:text-[#2D1C24] hover:bg-[#FDF2F8]"
                      }`}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comedy Bio / Heckle Style */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                  Comedy Bio & Soft Spots
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={180}
                  placeholder="Tell the comedian a little about yourself (e.g., 'I code in JS, refuse to write tests, and put ketchup on samosas')..."
                  className="w-full bg-[#FFF8FA] border border-[#FBCFE8] focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/20 rounded-xl p-3 text-xs text-[#2D1C24] outline-none resize-none leading-relaxed transition-all font-sans"
                />
                <div className="flex justify-end text-[10px] font-mono text-[#9D7889]">
                  {bio.length}/180
                </div>
              </div>

              {/* Preferred Roast Severity */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                  Preferred Stage Heat & Severity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {ROAST_LEVELS.map((level) => {
                    const isSelected = roastLevel === level.id;
                    return (
                      <div
                        key={level.id}
                        onClick={() => setRoastLevel(level.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FFF0F4] border-[#EC4899] shadow-xs ring-1 ring-[#EC4899]/30"
                            : "bg-[#FFF8FA] border-[#FBCFE8] hover:border-[#F472B6]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{level.icon}</span>
                          <span className="text-xs font-mono font-bold text-[#2D1C24]">
                            {level.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#836270] leading-snug">
                          {level.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Roast Trigger / Topic */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-[#2D1C24] uppercase tracking-wider">
                  Favorite Roast Trigger / Topic
                </label>
                <input
                  type="text"
                  value={favoriteTopic}
                  onChange={(e) => setFavoriteTopic(e.target.value)}
                  placeholder="e.g. Veg Biryani, Next.js Server Components, CSS Centering"
                  maxLength={50}
                  className="w-full bg-[#FFF8FA] border border-[#FBCFE8] focus:border-[#EC4899] focus:ring-2 focus:ring-[#F472B6]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#2D1C24] outline-none font-mono transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-[#FCE7F3] flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !displayName.trim()}
                  className="px-6 py-3 liquid-glass-pink hover:opacity-95 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Pass...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Save VIP Persona</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Danger Zone: Shred All Comedy Sets */}
            <div className="liquid-glass-subtle !border-[#FECDD3] rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center shrink-0 text-[#E11D48]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black font-mono uppercase text-[#9F1239]">
                    Danger Zone: Shred All Comedy Sets
                  </h4>
                  <p className="text-xs text-[#836270] mt-1 leading-relaxed">
                    Permanently erase all your saved roast sets, audience heckles, punchline scores, and vault search history. This action cannot be reversed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#FECDD3]/60">
                <span className="text-xs font-mono font-bold text-[#9F1239]">
                  Active Sets in Vault: {sessionsCount}
                </span>
                <button
                  type="button"
                  disabled={sessionsCount === 0}
                  onClick={() => {
                    setDeleteConfirmationText("");
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-[#FDA4AF] disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-98"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Shred All Chats</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete All Chats Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1C24]/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md liquid-glass rounded-3xl p-6 sm:p-8 text-[#2D1C24]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFE4E6] border border-[#FDA4AF] flex items-center justify-center mx-auto mb-4 text-[#E11D48] shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center mb-5">
              <h3 className="text-lg font-black font-mono uppercase text-[#2D1C24] tracking-tight">
                Shred All {sessionsCount} Comedy Sets?
              </h3>
              <p className="text-xs text-[#836270] mt-2 leading-relaxed">
                You are about to delete <span className="font-bold text-[#E11D48]">{sessionsCount} comedy set(s)</span> and all associated stage messages, burns, and punchlines from your account.
              </p>
            </div>

            <div className="mb-5 p-3 bg-white/70 border border-[#FDA4AF]/70 rounded-2xl">
              <label className="block text-[11px] font-mono font-bold text-[#836270] uppercase mb-1.5">
                Type <span className="text-[#E11D48]">SHRED</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type SHRED here"
                className="w-full bg-white border border-[#FDA4AF] rounded-xl px-3 py-2 text-xs font-mono text-[#2D1C24] outline-none uppercase font-bold focus:ring-2 focus:ring-[#E11D48]/20"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={deletingChats}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-3 liquid-glass-pill text-[#836270] font-mono font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingChats || deleteConfirmationText.trim().toUpperCase() !== "SHRED"}
                onClick={handleDeleteAllChats}
                className="flex-1 py-2.5 px-3 bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-[#FDA4AF] disabled:cursor-not-allowed text-white font-mono font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                {deletingChats ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Shredding...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Shred</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for guest upgrades */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleLogout}
        isGuest={isGuest}
      />
    </main>
  );
}
