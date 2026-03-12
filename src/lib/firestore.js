// lib/firestore.js — simple Firebase SDK (clean and straightforward)
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── SESSIONS ──────────────────────────────────────────────────────────────────

export async function createSession(userId) {
  console.log("[Firestore] Creating session for user:", userId);
  const ref = await addDoc(collection(db, "users", userId, "sessions"), {
    title: "New Roast Session 🔥",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0,
  });
  console.log("[Firestore] Session created with ID:", ref);
  return ref.id;
}

export async function getSessions(userId) {
  const q = query(
    collection(db, "users", userId, "sessions"),
    orderBy("updatedAt", "desc")
  );
  console.log("[Firestore] Getting sessions for user:", userId);
  const snap = await getDocs(q);
  console.log("[Firestore] Sessions found:", snap.docs.length);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSession(userId, sessionId) {
  const msgsSnap = await getDocs(
    collection(db, "users", userId, "sessions", sessionId, "messages")
  );
  await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "users", userId, "sessions", sessionId));
}

export async function updateSessionTitle(userId, sessionId, title) {
  await updateDoc(doc(db, "users", userId, "sessions", sessionId), {
    title: title.length > 40 ? title.slice(0, 40) + "..." : title,
    updatedAt: serverTimestamp(),
  });
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

// Saves both user + bot message only after a completed exchange
export async function saveCompletedExchange(userId, sessionId, userMsg, botMsg, isFirstMessage, title) {
  const msgsRef = collection(db, "users", userId, "sessions", sessionId, "messages");

  // Save user message
  await addDoc(msgsRef, {
    role: "user",
    content: userMsg,
    createdAt: serverTimestamp(),
  });

  // Save bot message
  await addDoc(msgsRef, {
    role: "assistant",
    content: botMsg,
    createdAt: serverTimestamp(),
  });

  // Update session metadata
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  await updateDoc(sessionRef, {
    updatedAt: serverTimestamp(),
    messageCount: (await getDocs(msgsRef)).size,
    ...(isFirstMessage && title
      ? { title: title.length > 40 ? title.slice(0, 40) + "..." : title }
      : {}),
  });
}

export async function getMessages(userId, sessionId) {
  const q = query(
    collection(db, "users", userId, "sessions", sessionId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    role: d.data().role,
    content: d.data().content,
  }));
}