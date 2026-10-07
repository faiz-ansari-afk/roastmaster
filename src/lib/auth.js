// src/lib/auth.js — PostgreSQL Native Authentication Engine (Zero Firebase)
import crypto from "crypto";
import { getDbPool } from "./db.js";

const AUTH_SECRET = process.env.AUTH_SECRET || "roastmaster_jwt_secret_salt_2026_super_secure";
const TOKEN_MAX_AGE_DAYS = 30;

/**
 * Ensures the PostgreSQL users table and index exist
 */
export async function ensureUsersTable() {
  const db = getDbPool();
  if (!db) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        salt TEXT,
        display_name TEXT,
        photo_url TEXT,
        is_guest BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
  } catch (err) {
    console.error("[Auth DB] ensureUsersTable error:", err.message);
  }
}

/**
 * Hashes a plaintext password using cryptographically secure PBKDF2 with a random salt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { hash, salt };
}

/**
 * Verifies a plaintext password against the stored PBKDF2 hash and salt
 */
export function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export function createSessionToken(user) {
  const payloadObj = {
    uid: user.id || user.uid,
    email: user.email || null,
    isGuest: Boolean(user.is_guest || user.isGuest),
    displayName: user.display_name || user.displayName || null,
    iat: Date.now(),
    exp: Date.now() + TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 session token
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  try {
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (data.exp && Date.now() > data.exp) {
      return null; // Expired
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Finds user by lowercase email address in PostgreSQL
 */
export async function findUserByEmail(email) {
  const db = getDbPool();
  if (!db || !email) return null;
  try {
    await ensureUsersTable();
    const res = await db.query(
      `SELECT id, email, password_hash, salt, display_name, photo_url, is_guest, created_at, updated_at
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("[Auth DB] findUserByEmail error:", err.message);
    return null;
  }
}

/**
 * Finds user by ID in PostgreSQL
 */
export async function findUserById(id) {
  const db = getDbPool();
  if (!db || !id) return null;
  try {
    await ensureUsersTable();
    const res = await db.query(
      `SELECT id, email, display_name, photo_url, is_guest, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("[Auth DB] findUserById error:", err.message);
    return null;
  }
}

/**
 * Registers a new user in PostgreSQL
 */
export async function createUser({
  id,
  email,
  password,
  displayName = null,
  photoURL = null,
  isGuest = false,
}) {
  const db = getDbPool();
  if (!db) return null;
  try {
    await ensureUsersTable();
    const userId = id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let hash = null;
    let salt = null;

    if (password) {
      const p = hashPassword(password);
      hash = p.hash;
      salt = p.salt;
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const res = await db.query(
      `INSERT INTO users (id, email, password_hash, salt, display_name, photo_url, is_guest, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, display_name, photo_url, is_guest, created_at`,
      [userId, cleanEmail, hash, salt, displayName || null, photoURL || null, isGuest]
    );

    return res.rows[0] || null;
  } catch (err) {
    console.error("[Auth DB] createUser error:", err.message);
    throw err;
  }
}

/**
 * Updates basic user auth info
 */
export async function updateUserAuth(id, { displayName, photoURL }) {
  const db = getDbPool();
  if (!db || !id) return false;
  try {
    await ensureUsersTable();
    await db.query(
      `UPDATE users
       SET display_name = COALESCE($2, display_name),
           photo_url = COALESCE($3, photo_url),
           updated_at = NOW()
       WHERE id = $1`,
      [id, displayName || null, photoURL || null]
    );
    return true;
  } catch (err) {
    console.error("[Auth DB] updateUserAuth error:", err.message);
    return false;
  }
}

/**
 * Formats a database user object into the frontend User shape
 */
export function formatUserForClient(u, profile = null) {
  if (!u) return null;
  return {
    uid: u.id || u.uid,
    email: u.email || null,
    displayName: profile?.displayName || u.display_name || u.displayName || (u.email ? u.email.split("@")[0] : "VIP Heckler"),
    photoURL: profile?.photoURL || u.photo_url || u.photoURL || null,
    stageTitle: profile?.stageTitle || null,
    bio: profile?.bio || null,
    favoriteTopic: profile?.favoriteTopic || null,
    roastLevel: profile?.roastLevel || "sarcastic",
    isGuest: Boolean(u.is_guest || u.isGuest),
  };
}
