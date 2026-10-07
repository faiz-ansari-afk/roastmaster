"use client";
// src/contexts/AuthContext.jsx — Native PostgreSQL Authentication Context (Zero Firebase)
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUserProfile, saveUserProfile } from "@/lib/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state on mount using local cache + /api/auth/me verification
  useEffect(() => {
    let isMounted = true;

    // 1. Instant restore from local cache to prevent UI flicker
    try {
      const cached = localStorage.getItem("roastmaster_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.uid) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn("[Auth] Error reading local user cache:", err);
    }

    // 2. Verify session with PostgreSQL backend
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("roastmaster_user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("roastmaster_user");
          setUser(null);
        }
      })
      .catch((err) => {
        console.warn("[Auth] Session check notice:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      const error = new Error(data?.error || "Login failed");
      error.code = "auth/invalid-credential";
      throw error;
    }
    setUser(data.user);
    localStorage.setItem("roastmaster_user", JSON.stringify(data.user));
    if (data.token) localStorage.setItem("roastmaster_token", data.token);
    return data;
  }, []);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      const error = new Error(data?.error || "Signup failed");
      if (res.status === 409) error.code = "auth/email-already-in-use";
      throw error;
    }
    setUser(data.user);
    localStorage.setItem("roastmaster_user", JSON.stringify(data.user));
    if (data.token) localStorage.setItem("roastmaster_token", data.token);
    return data;
  }, []);

  const loginAsGuest = useCallback(async () => {
    const res = await fetch("/api/auth/guest", {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok || !data.user) {
      throw new Error(data?.error || "Failed to create guest pass");
    }
    setUser(data.user);
    localStorage.setItem("roastmaster_user", JSON.stringify(data.user));
    if (data.token) localStorage.setItem("roastmaster_token", data.token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors during logout
    }
    localStorage.removeItem("roastmaster_user");
    localStorage.removeItem("roastmaster_token");
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    throw new Error("Direct PostgreSQL authentication active. Please use Email or Guest Pass.");
  }, []);

  const updateUserProfile = useCallback(
    async ({ displayName, photoURL, stageTitle, bio, roastLevel, favoriteTopic }) => {
      if (!user?.uid) return;

      const profilePayload = {
        displayName: displayName !== undefined ? displayName : user.displayName,
        photoURL: photoURL !== undefined ? photoURL : user.photoURL,
        stageTitle: stageTitle !== undefined ? stageTitle : user.stageTitle,
        bio: bio !== undefined ? bio : user.bio,
        roastLevel: roastLevel !== undefined ? roastLevel : user.roastLevel,
        favoriteTopic: favoriteTopic !== undefined ? favoriteTopic : user.favoriteTopic,
      };

      // Save to PostgreSQL via API
      await saveUserProfile(user.uid, profilePayload);

      // Update state and local cache
      setUser((prev) => {
        const updated = {
          ...(prev || {}),
          ...profilePayload,
        };
        localStorage.setItem("roastmaster_user", JSON.stringify(updated));
        return updated;
      });
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: Boolean(user?.isGuest),
        loginWithGoogle,
        loginWithEmail,
        loginAsGuest,
        logout,
        signUpWithEmail,
        updateUserProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);