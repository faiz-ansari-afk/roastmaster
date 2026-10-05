// lib/firestore.js — robust Firestore client helpers
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
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
      title: "New Roast Session",
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

    const assistantDoc = {
      role: "assistant",
      content: botMsg,
      createdAt: serverTimestamp(),
    };

    if (Array.isArray(botMsg?.embedding) && botMsg.embedding.length > 0) {
      assistantDoc.embedding = botMsg.embedding;
    }

    // Save both messages in parallel
    const writePromise = Promise.all([
      addDoc(msgsRef, {
        role: "user",
        content: userMsg,
        createdAt: serverTimestamp(),
      }),
      addDoc(msgsRef, assistantDoc),
    ]);

    await withTimeout(writePromise, 6000);

    // Update session metadata safely using setDoc with merge: true
    const sessionRef = doc(db, "users", userId, "sessions", sessionId);
    const cleanTitle = title && title.length > 40 ? title.slice(0, 40) + "..." : title;

    const sessionUpdate = {
      updatedAt: serverTimestamp(),
      messageCount: increment(2),
      ...(isFirstMessage && cleanTitle ? { title: cleanTitle } : {}),
    };

    // Store embedding and snippet on session doc for fast, lightweight vault search
    if (Array.isArray(botMsg?.embedding) && botMsg.embedding.length > 0) {
      sessionUpdate.embedding = botMsg.embedding;
    }
    const roastText = typeof botMsg === "object" ? botMsg?.roast : String(botMsg || "");
    if (roastText) {
      sessionUpdate.snippet = roastText.slice(0, 160);
    }
    if (botMsg?.category) {
      sessionUpdate.category = botMsg.category;
    }

    await withTimeout(
      setDoc(sessionRef, sessionUpdate, { merge: true }),
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
      embedding: d.data().embedding || null,
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
        embedding: d.data().embedding || null,
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

// ── USER PROFILE & DATA MANAGEMENT ───────────────────────────────────────────

export async function getUserProfile(userId) {
  if (!userId) return null;
  try {
    // 1. Check subcollection /users/{userId}/profile/info (always passes /users/{userId}/{document=**} rule)
    try {
      const subDocSnap = await withTimeout(
        getDoc(doc(db, "users", userId, "profile", "info")),
        4000
      );
      if (subDocSnap && subDocSnap.exists()) {
        return subDocSnap.data();
      }
    } catch (subErr) {
      console.warn("[Firestore] getUserProfile subcollection check:", subErr.code || subErr.message);
    }

    // 2. Check root doc /users/{userId}
    const userDocSnap = await withTimeout(getDoc(doc(db, "users", userId)), 4000);
    if (userDocSnap && userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;
  } catch (err) {
    console.error("[Firestore] getUserProfile error:", err.code || err.message);
    return null;
  }
}

export async function saveUserProfile(userId, profileData) {
  if (!userId) return false;
  const payload = {
    ...profileData,
    updatedAt: serverTimestamp(),
  };

  let saved = false;

  // 1. Write to subcollection /users/{userId}/profile/info (guaranteed to match /users/{userId}/{document=**})
  try {
    await withTimeout(
      setDoc(doc(db, "users", userId, "profile", "info"), payload, { merge: true }),
      5000
    );
    saved = true;
  } catch (subErr) {
    console.warn("[Firestore] saveUserProfile subcollection write failed:", subErr.code || subErr.message);
  }

  // 2. Also write to root doc /users/{userId} for backwards compatibility
  try {
    await withTimeout(
      setDoc(doc(db, "users", userId), payload, { merge: true }),
      5000
    );
    saved = true;
  } catch (rootErr) {
    console.warn("[Firestore] saveUserProfile root doc write failed:", rootErr.code || rootErr.message);
  }

  return saved;
}

export async function deleteAllUserSessions(userId) {
  if (!userId) return { success: false, count: 0 };
  try {
    const sessionsSnap = await withTimeout(
      getDocs(collection(db, "users", userId, "sessions")),
      8000
    );
    let count = 0;
    for (const sessionDoc of sessionsSnap.docs) {
      const sessionId = sessionDoc.id;
      try {
        const msgsSnap = await withTimeout(
          getDocs(collection(db, "users", userId, "sessions", sessionId, "messages")),
          5000
        );
        await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch (msgErr) {
        console.warn("[Firestore] Failed deleting messages for session", sessionId, msgErr);
      }
      await deleteDoc(sessionDoc.ref);
      count++;
    }
    return { success: true, count };
  } catch (err) {
    console.error("[Firestore] deleteAllUserSessions error:", err.code || err.message);
    return { success: false, count: 0, error: err.message };
  }
}