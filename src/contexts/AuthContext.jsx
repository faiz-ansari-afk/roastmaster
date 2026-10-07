"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInAnonymously, signOut, updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        let mergedUser = u;
        try {
          const profile = await getUserProfile(u.uid);
          if (profile) {
            mergedUser = {
              ...u,
              displayName: profile.displayName || u.displayName,
              photoURL: profile.photoURL || u.photoURL,
              stageTitle: profile.stageTitle || null,
              bio: profile.bio || null,
              favoriteTopic: profile.favoriteTopic || null,
              roastLevel: profile.roastLevel || null,
            };
          }
        } catch (profileErr) {
          console.warn("[Auth] Failed fetching initial profile:", profileErr);
        }
        setUser(mergedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle    = () => signInWithPopup(auth, new GoogleAuthProvider());
  const loginWithEmail     = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
  const loginAsGuest       = () => signInAnonymously(auth);
  const logout             = async () => {
    await signOut(auth);
    setUser(null);
  };
  const signUpWithEmail    = async (email, pw, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
      setUser({ ...cred.user, displayName });
    }
    return cred;
  };

  const updateUserProfile = async ({ displayName, photoURL, stageTitle, bio, roastLevel, favoriteTopic }) => {
    if (!auth.currentUser) return;
    const authUpdates = {};
    if (displayName !== undefined && displayName !== null) {
      authUpdates.displayName = displayName;
    }
    // Only pass http/https URLs to Firebase Auth (data URLs cause auth/invalid-photo-url)
    if (
      photoURL !== undefined &&
      (photoURL === null || photoURL === "" || photoURL.startsWith("http://") || photoURL.startsWith("https://"))
    ) {
      authUpdates.photoURL = photoURL || null;
    }

    try {
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
      }
    } catch (authErr) {
      console.warn("[Auth] Firebase Auth updateProfile notice:", authErr.code || authErr.message);
    }

    setUser((prev) => ({
      ...(auth.currentUser || {}),
      ...(prev || {}),
      displayName: displayName !== undefined ? displayName : prev?.displayName,
      photoURL: photoURL !== undefined ? photoURL : prev?.photoURL,
      stageTitle: stageTitle !== undefined ? stageTitle : prev?.stageTitle,
      bio: bio !== undefined ? bio : prev?.bio,
      roastLevel: roastLevel !== undefined ? roastLevel : prev?.roastLevel,
      favoriteTopic: favoriteTopic !== undefined ? favoriteTopic : prev?.favoriteTopic,
    }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest: user?.isAnonymous ?? false,
      loginWithGoogle, loginWithEmail, loginAsGuest, logout, signUpWithEmail, updateUserProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);