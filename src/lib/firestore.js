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

export async function createSession(userId, initialTitle = null) {
  if (!userId) return null;
  console.log("[Firestore] Creating session for user:", userId);
  try {
    const title = initialTitle || "New Roast Session";
    const sessionPromise = addDoc(collection(db, "users", userId, "sessions"), {
      title,
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
    const cleanTitle = title.length > 50 ? title.slice(0, 50) + "..." : title;
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

// Helper to format or derive a punchy display title for any session
export function formatSessionDisplayTitle(session) {
  if (!session) return "Standup Roast";
  const rawTitle = (session.title || "").trim();
  if (
    rawTitle &&
    rawTitle !== "New Roast Session" &&
    rawTitle !== "Roast Session" &&
    rawTitle !== "Standup Roast"
  ) {
    return rawTitle;
  }

  // If title has a document emoji prefix, preserve it
  if (rawTitle && rawTitle.startsWith("📄")) {
    return rawTitle;
  }

  // Derive from snippet if available
  if (session.snippet && typeof session.snippet === "string") {
    const clean = session.snippet
      .replace(/^["'\s]+|["'\s]+$/g, "")
      .replace(/^(Bhai|Bro|Matlab|Look|So|Well|Listen|Aha|Dekh)\s*[,:]?\s*/i, "")
      .trim();
    const firstSentence = clean.split(/[.?!]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 4) {
      const formatted = firstSentence.length > 38 ? firstSentence.slice(0, 38) + "..." : firstSentence;
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
  }

  // Derive from category if available
  if (session.category && typeof session.category === "string" && session.category.trim()) {
    return `${session.category.trim()} Set`;
  }

  return rawTitle || "Standup Roast";
}

let isBackfillingTitles = false;
// Auto-backfills older historical sessions in Firestore that have placeholder titles
export async function backfillHistoricalSessionTitles(userId, sessions) {
  if (!userId || !Array.isArray(sessions) || sessions.length === 0 || isBackfillingTitles) return;

  const staleSessions = sessions.filter((s) => {
    const t = (s.title || "").trim();
    return !t || t === "New Roast Session" || t === "Roast Session";
  });

  if (staleSessions.length === 0) return;

  isBackfillingTitles = true;
  try {
    for (const session of staleSessions.slice(0, 8)) {
      let derived = null;

      if (session.snippet) {
        const clean = session.snippet
          .replace(/^["'\s]+|["'\s]+$/g, "")
          .replace(/^(Bhai|Bro|Matlab|Look|So|Well|Listen|Aha|Dekh)\s*[,:]?\s*/i, "")
          .trim();
        const firstSentence = clean.split(/[.?!]/)[0]?.trim();
        if (firstSentence && firstSentence.length > 4) {
          derived = firstSentence.length > 38 ? firstSentence.slice(0, 38) + "..." : firstSentence;
        }
      }

      if (!derived && session.category) {
        derived = `${session.category} Set`;
      }

      if (!derived) {
        try {
          const msgs = await getMessages(userId, session.id);
          if (msgs && msgs.length > 0) {
            const assistantMsg = msgs.find((m) => m.role === "assistant" && m.content);
            const userMsg = msgs.find((m) => m.role === "user" && m.content);

            if (assistantMsg?.content && typeof assistantMsg.content === "object") {
              if (assistantMsg.content.title) {
                derived = assistantMsg.content.title;
              } else if (assistantMsg.content.category) {
                derived = `${assistantMsg.content.category} Roast`;
              } else if (assistantMsg.content.roast) {
                const clean = assistantMsg.content.roast
                  .replace(/^["'\s]+|["'\s]+$/g, "")
                  .replace(/^(Bhai|Bro|Matlab|Look|So|Well|Listen|Aha|Dekh)\s*[,:]?\s*/i, "")
                  .trim();
                const first = clean.split(/[.?!]/)[0]?.trim();
                if (first) derived = first.length > 38 ? first.slice(0, 38) + "..." : first;
              }
            }

            if (!derived && userMsg?.content && typeof userMsg.content === "string") {
              const clean = userMsg.content
                .replace(/^(roast|can you roast|please roast|roast my|roast this|what is|how to)\s+/i, "")
                .trim();
              if (clean) derived = clean.length > 38 ? clean.slice(0, 38) + "..." : clean;
            }
          }
        } catch {
          // ignore error fetching messages
        }
      }

      if (derived && derived.trim()) {
        const finalTitle = derived.trim().charAt(0).toUpperCase() + derived.trim().slice(1);
        await updateSessionTitle(userId, session.id, finalTitle);
      }
    }
  } catch (err) {
    console.error("[Firestore] backfillHistoricalSessionTitles error:", err);
  } finally {
    isBackfillingTitles = false;
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

    // Dynamic title preference: AI-generated botMsg.title > custom title > userMsg
    const rawDynamicTitle =
      (typeof botMsg === "object" && botMsg?.title) ||
      title ||
      (typeof userMsg === "string" ? userMsg : null);

    let cleanTitle = null;
    if (rawDynamicTitle && typeof rawDynamicTitle === "string" && rawDynamicTitle.trim()) {
      const t = rawDynamicTitle.trim();
      cleanTitle = t.length > 50 ? t.slice(0, 50) + "..." : t;
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    const sessionUpdate = {
      updatedAt: serverTimestamp(),
      messageCount: increment(2),
    };

    if (cleanTitle) {
      if (isFirstMessage) {
        sessionUpdate.title = cleanTitle;
      } else {
        // If not first message, check if current session title was placeholder
        try {
          const currentSnap = await withTimeout(getDoc(sessionRef), 2000);
          const existingTitle = (currentSnap?.data?.()?.title || "").trim();
          if (
            !existingTitle ||
            existingTitle === "New Roast Session" ||
            existingTitle === "Roast Session" ||
            existingTitle === "Standup Roast"
          ) {
            sessionUpdate.title = cleanTitle;
          }
        } catch {
          // If getDoc failed or timed out, do not block
        }
      }
    }

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