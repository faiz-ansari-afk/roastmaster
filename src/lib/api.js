// src/lib/api.js — Complete PostgreSQL REST API Client (Zero Firestore Data Layer)

/**
 * Dispatches an event to instantly notify sidebar and stage to refresh sessions list
 */
export function triggerSessionsUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sessions-updated"));
  }
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

/**
 * Creates a new roast session in PostgreSQL
 */
export async function createSession(userId, initialTitle = null) {
  if (!userId) return null;
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: initialTitle || "New Roast Session",
      }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    const data = await res.json();
    triggerSessionsUpdate();
    return data.sessionId;
  } catch (err) {
    console.error("[API] createSession error:", err);
    return null;
  }
}

/**
 * Fetches all sessions for a user from PostgreSQL
 */
export async function getSessions(userId) {
  if (!userId) return [];
  try {
    const res = await fetch(`/api/sessions?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.sessions) ? data.sessions : [];
  } catch (err) {
    console.error("[API] getSessions error:", err);
    return [];
  }
}

/**
 * Subscribes to sessions with real-time UI synchronization via event-based updates
 */
export function subscribeToSessions(userId, callback) {
  if (!userId) return () => {};

  let isMounted = true;
  const load = () => {
    getSessions(userId).then((data) => {
      if (isMounted) callback(data);
    });
  };

  // Initial load
  load();

  // Instant re-fetch when any session is created, deleted, or updated
  const handler = () => load();
  if (typeof window !== "undefined") {
    window.addEventListener("sessions-updated", handler);
  }

  return () => {
    isMounted = false;
    if (typeof window !== "undefined") {
      window.removeEventListener("sessions-updated", handler);
    }
  };
}

/**
 * Deletes a session from PostgreSQL (cascades to messages & chunks)
 */
export async function deleteSession(userId, sessionId) {
  if (!sessionId) return false;
  try {
    const res = await fetch(
      `/api/sessions?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId || "")}`,
      { method: "DELETE" }
    );
    triggerSessionsUpdate();
    return res.ok;
  } catch (err) {
    console.error("[API] deleteSession error:", err);
    return false;
  }
}

/**
 * Renames a session title in PostgreSQL
 */
export async function updateSessionTitle(userId, sessionId, title) {
  if (!sessionId || !title) return false;
  try {
    const res = await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, title }),
    });
    triggerSessionsUpdate();
    return res.ok;
  } catch (err) {
    console.error("[API] updateSessionTitle error:", err);
    return false;
  }
}

/**
 * Shreds all sessions and messages for a user from PostgreSQL
 */
export async function deleteAllUserSessions(userId) {
  if (!userId) return { success: false, count: 0 };
  try {
    const res = await fetch(`/api/sessions?all=true&userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    triggerSessionsUpdate();
    return { success: true, count: data?.deletedSessions || 0 };
  } catch (err) {
    console.error("[API] deleteAllUserSessions error:", err);
    return { success: false, count: 0, error: err.message };
  }
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

/**
 * Fetches all messages for a session from PostgreSQL
 */
export async function getMessages(userId, sessionId) {
  if (!sessionId) return [];
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/messages`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.messages) ? data.messages : [];
    list.sessionTitle = data?.sessionTitle || data?.session?.title || null;
    return list;
  } catch (err) {
    console.error("[API] getMessages error:", err);
    return [];
  }
}

/**
 * Saves a completed user + bot message exchange in PostgreSQL
 */
export async function saveCompletedExchange(userId, sessionId, userMsg, botMsg, isFirstMessage, title, embedding = null) {
  if (!userId || !sessionId) return false;
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        userMsg,
        botMsg,
        isFirstMessage: Boolean(isFirstMessage),
        title: title || null,
        embedding: embedding || botMsg?.embedding || null,
      }),
    });
    triggerSessionsUpdate();
    return res.ok;
  } catch (err) {
    console.error("[API] saveCompletedExchange error:", err);
    return false;
  }
}

// ── USER PROFILES ────────────────────────────────────────────────────────────

/**
 * Fetches user profile from PostgreSQL
 */
export async function getUserProfile(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile || null;
  } catch (err) {
    console.error("[API] getUserProfile error:", err);
    return null;
  }
}

/**
 * Saves user profile to PostgreSQL
 */
export async function saveUserProfile(userId, profileData) {
  if (!userId) return false;
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ...profileData,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[API] saveUserProfile error:", err);
    return false;
  }
}

// ── DISPLAY HELPERS ──────────────────────────────────────────────────────────

/**
 * Derives or formats a punchy display title for a session
 */
export function formatSessionDisplayTitle(session) {
  if (!session) return "Standup Roast";
  const rawTitle = (session.title || "").trim();
  if (
    rawTitle &&
    rawTitle !== "New Roast Session"
  ) {
    return rawTitle;
  }

  if (rawTitle && rawTitle.startsWith("📄")) {
    return rawTitle;
  }

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

  if (session.category && typeof session.category === "string" && session.category.trim()) {
    return `${session.category.trim()} Set`;
  }

  return rawTitle || "Standup Roast";
}

export async function backfillHistoricalSessionTitles() {
  return;
}

export async function cleanEmptyOrphanSessions() {
  return;
}
