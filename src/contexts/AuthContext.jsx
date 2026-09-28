"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInAnonymously, signOut, updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
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

  return (
    <AuthContext.Provider value={{ user, loading, isGuest: user?.isAnonymous ?? false,
      loginWithGoogle, loginWithEmail, loginAsGuest, logout, signUpWithEmail }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);