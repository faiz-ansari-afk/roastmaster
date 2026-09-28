// lib/firestore.js — robust Firestore client helpers
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// Helper with timeout to prevent hanging when Firestore is unprovisioned/unreachable
async function withTimeout(promise, ms = 6000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error("Firestore operation timed out. Ensure Firestore database is created in Firebase Console.");
      err.code = "timeout";
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

export async function createSession(userId) {
  if (!userId) return null;
  console.log("[Firestore] Creating session for user:", userId);
  try {
    const sessionPromise = addDoc(collection(db, "users", userId, "sessions"), {
      title: "New Roast Session 🔥",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
    });
    const ref = await withTimeout(sessionPromise, 5000);
    console.log("[Firestore] Session created with ID:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("[Firestore] Failed to create session:", err.code || err.message);
    return null;
  }
}

export function subscribeToSessions(userId, callback) {
  if (!userId) return () => {};
  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(data);
      },
      (err) => {
        console.error("[Firestore] subscribeToSessions onSnapshot error:", err.code || err.message);
        // Fallback to one-time getDocs
        getSessions(userId).then(callback);
      }
    );
  } catch (err) {
    console.error("[Firestore] subscribeToSessions setup error:", err);
    getSessions(userId).then(callback);
    return () => {};
  }
}

export async function getSessions(userId) {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, "users", userId, "sessions"),
      orderBy("updatedAt", "desc")
    );
    console.log("[Firestore] Getting sessions for user:", userId);
    const snap = await withTimeout(getDocs(q), 5000);
    console.log("[Firestore] Sessions found:", snap.docs.length);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[Firestore] getSessions error:", err.code || err.message);
    return [];
  }
}

export async function deleteSession(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    const msgsSnap = await withTimeout(
      getDocs(collection(db, "users", userId, "sessions", sessionId, "messages")),
      5000
    );
    await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "users", userId, "sessions", sessionId));
  } catch (err) {
    console.error("[Firestore] deleteSession error:", err.code || err.message);
  }
}

export async function updateSessionTitle(userId, sessionId, title) {
  if (!userId || !sessionId) return;
  try {
    const cleanTitle = title.length > 40 ? title.slice(0, 40) + "..." : title;
    await setDoc(
      doc(db, "users", userId, "sessions", sessionId),
      {
        title: cleanTitle,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("[Firestore] updateSessionTitle error:", err.code || err.message);
  }
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

// Saves both user + bot message after an exchange
export async function saveCompletedExchange(userId, sessionId, userMsg, botMsg, isFirstMessage, title) {
  if (!userId || !sessionId) return false;
  try {
    const msgsRef = collection(db, "users", userId, "sessions", sessionId, "messages");

    // Save both messages in parallel
    const writePromise = Promise.all([
      addDoc(msgsRef, {
        role: "user",
        content: userMsg,
        createdAt: serverTimestamp(),
      }),
      addDoc(msgsRef, {
        role: "assistant",
        content: botMsg,
        createdAt: serverTimestamp(),
      }),
    ]);

    await withTimeout(writePromise, 6000);

    // Update session metadata safely using setDoc with merge: true
    const sessionRef = doc(db, "users", userId, "sessions", sessionId);
    const cleanTitle = title && title.length > 40 ? title.slice(0, 40) + "..." : title;

    await withTimeout(
      setDoc(
        sessionRef,
        {
          updatedAt: serverTimestamp(),
          messageCount: increment(2),
          ...(isFirstMessage && cleanTitle ? { title: cleanTitle } : {}),
        },
        { merge: true }
      ),
      5000
    );
    return true;
  } catch (err) {
    console.error("[Firestore] saveCompletedExchange error:", err.code || err.message);
    return false;
  }
}

export async function getMessages(userId, sessionId) {
  if (!userId || !sessionId) return [];
  try {
    const q = query(
      collection(db, "users", userId, "sessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    );
    const snap = await withTimeout(getDocs(q), 5000);
    return snap.docs.map((d) => ({
      id: d.id,
      role: d.data().role,
      content: d.data().content,
    }));
  } catch (err) {
    console.warn("[Firestore] getMessages with orderBy failed, falling back to manual sort:", err.code || err.message);
    try {
      const fallbackSnap = await withTimeout(
        getDocs(collection(db, "users", userId, "sessions", sessionId, "messages")),
        5000
      );
      const docs = fallbackSnap.docs.map((d) => ({
        id: d.id,
        role: d.data().role,
        content: d.data().content,
        createdAt: d.data().createdAt?.toMillis?.() || 0,
      }));
      docs.sort((a, b) => a.createdAt - b.createdAt);
      return docs;
    } catch (fallbackErr) {
      console.error("[Firestore] getMessages fallback error:", fallbackErr);
      return [];
    }
  }
}