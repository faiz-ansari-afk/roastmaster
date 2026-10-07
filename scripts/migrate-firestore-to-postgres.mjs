// scripts/migrate-firestore-to-postgres.mjs
// One-time migration script: Copies user profiles, chat sessions, and message history
// from Google Cloud Firestore into PostgreSQL (Aiven).
//
// Usage:
//   node --env-file=.env scripts/migrate-firestore-to-postgres.mjs
//   node --env-file=.env scripts/migrate-firestore-to-postgres.mjs --email=user@example.com --password=secret
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getDbPool } from "../src/lib/db.js";

async function main() {
  console.log("=============================================================");
  console.log(" RoastMaster AI: Firestore -> PostgreSQL Data Migration");
  console.log("=============================================================\n");

  const pool = getDbPool();
  if (!pool) {
    console.error("❌ Error: Missing DATABASE_URL in environment.");
    process.exit(1);
  }

  // 1. Initialize Firebase App
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Optional sign-in if rules require authenticated user
  const emailArg = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];
  const passArg = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1];

  if (emailArg && passArg) {
    try {
      console.log(`🔐 Authenticating as ${emailArg}...`);
      await signInWithEmailAndPassword(auth, emailArg, passArg);
      console.log("✓ Authenticated successfully.\n");
    } catch (authErr) {
      console.warn("⚠️ Auth note:", authErr.message);
    }
  }

  let migratedProfiles = 0;
  let migratedSessions = 0;
  let migratedMessages = 0;

  try {
    console.log("🔍 Scanning Firestore for chat sessions...");
    const sessionsSnap = await getDocs(collectionGroup(db, "sessions"));
    console.log(`Found ${sessionsSnap.docs.length} total session documents in Firestore.\n`);

    for (const sessionDoc of sessionsSnap.docs) {
      const sData = sessionDoc.data();
      const sessionId = sessionDoc.id;

      // Extract userId from Firestore document path: users/{userId}/sessions/{sessionId}
      const pathSegments = sessionDoc.ref.path.split("/");
      const userId = pathSegments[1] || sData.userId || "anonymous";

      const title = sData.title || "New Roast Session";
      const snippet = sData.snippet || null;
      const category = sData.category || null;
      const messageCount = typeof sData.messageCount === "number" ? sData.messageCount : 0;
      const createdAt = sData.createdAt?.toDate ? sData.createdAt.toDate() : new Date();
      const updatedAt = sData.updatedAt?.toDate ? sData.updatedAt.toDate() : new Date();

      // Upsert Session into PostgreSQL
      await pool.query(
        `INSERT INTO sessions (id, user_id, title, snippet, category, message_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           snippet = EXCLUDED.snippet,
           category = EXCLUDED.category,
           message_count = EXCLUDED.message_count,
           updated_at = EXCLUDED.updated_at`,
        [sessionId, userId, title, snippet, category, messageCount, createdAt, updatedAt]
      );
      migratedSessions++;

      // Fetch messages for this session
      try {
        const msgsSnap = await getDocs(
          collection(db, "users", userId, "sessions", sessionId, "messages")
        );

        for (const msgDoc of msgsSnap.docs) {
          const mData = msgDoc.data();
          const role = mData.role || "user";
          let cleanContent = mData.content;

          // Strip any heavy embedding vectors from content
          if (cleanContent && typeof cleanContent === "object") {
            const { embedding: _ignored, ...rest } = cleanContent;
            cleanContent = rest;
          }

          const msgCreatedAt = mData.createdAt?.toDate ? mData.createdAt.toDate() : new Date();

          await pool.query(
            `INSERT INTO messages (session_id, user_id, role, content, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, userId, role, JSON.stringify(cleanContent), msgCreatedAt]
          );
          migratedMessages++;
        }
      } catch (msgErr) {
        console.warn(`  ⚠️ Could not read messages for session ${sessionId}:`, msgErr.message);
      }

      // Check if user has a profile document in Firestore
      try {
        const profileSnap = await getDoc(doc(db, "users", userId, "profile", "info"));
        const rootUserSnap = await getDoc(doc(db, "users", userId));
        const pData = profileSnap.exists() ? profileSnap.data() : rootUserSnap.exists() ? rootUserSnap.data() : null;

        if (pData) {
          await pool.query(
            `INSERT INTO user_profiles (user_id, display_name, photo_url, stage_title, bio, roast_level, favorite_topic, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
               photo_url = COALESCE(EXCLUDED.photo_url, user_profiles.photo_url),
               stage_title = COALESCE(EXCLUDED.stage_title, user_profiles.stage_title),
               bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
               roast_level = COALESCE(EXCLUDED.roast_level, user_profiles.roast_level),
               favorite_topic = COALESCE(EXCLUDED.favorite_topic, user_profiles.favorite_topic),
               updated_at = NOW()`,
            [
              userId,
              pData.displayName || null,
              pData.photoURL || null,
              pData.stageTitle || null,
              pData.bio || null,
              pData.roastLevel || "sarcastic",
              pData.favoriteTopic || null,
            ]
          );
          migratedProfiles++;
        }
      } catch (profErr) {
        // Silently skip if no profile document
      }

      console.log(`✓ Migrated set: "${title}" (${sessionId}) for user: ${userId}`);
    }
  } catch (err) {
    console.error("Migration error reading from Firestore:", err.message);
    if (err.message.includes("NOT_FOUND") || err.message.includes("offline")) {
      console.log("\n💡 Note: Firestore database is either empty, unprovisioned, or requires authenticated login.");
      console.log("   Existing sessions already stored in PostgreSQL will continue to work normally.");
    }
  }

  console.log("\n=============================================================");
  console.log(" Migration Complete Summary");
  console.log("=============================================================");
  console.log(`• Profiles migrated: ${migratedProfiles}`);
  console.log(`• Sessions migrated: ${migratedSessions}`);
  console.log(`• Messages migrated: ${migratedMessages}`);
  console.log("=============================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
