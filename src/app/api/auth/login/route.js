// src/app/api/auth/login/route.js — Native PostgreSQL Login (Zero Firebase)
import { NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
  createSessionToken,
  formatUserForClient,
} from "@/lib/auth";
import { getUserProfileFromDb } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPw = (password || "").trim();

    if (!cleanEmail || !cleanPw) {
      return NextResponse.json(
        { error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    // Lookup user in PostgreSQL
    const user = await findUserByEmail(cleanEmail);
    if (!user || !user.password_hash || !user.salt) {
      return NextResponse.json(
        { error: "Invalid email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Verify password with PBKDF2 timing-safe comparison
    const valid = verifyPassword(cleanPw, user.password_hash, user.salt);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password. Please verify your credentials." },
        { status: 401 }
      );
    }

    // Load profile
    const profile = await getUserProfileFromDb(user.id);
    const token = createSessionToken(user);
    const clientUser = formatUserForClient(user, profile);

    const response = NextResponse.json(
      { success: true, user: clientUser, token },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set("roastmaster_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Login failed." },
      { status: 500 }
    );
  }
}
