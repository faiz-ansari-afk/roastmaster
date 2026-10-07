// src/app/api/auth/signup/route.js — Native PostgreSQL Signup (Zero Firebase)
import { NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  createSessionToken,
  formatUserForClient,
} from "@/lib/auth";
import { upsertUserProfileInDb } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, displayName } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPw = (password || "").trim();
    const cleanName = (displayName || "").trim() || (cleanEmail ? cleanEmail.split("@")[0] : "VIP Heckler");

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!cleanPw || cleanPw.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in instead." },
        { status: 409 }
      );
    }

    // Create user in PostgreSQL
    const user = await createUser({
      email: cleanEmail,
      password: cleanPw,
      displayName: cleanName,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user account." },
        { status: 500 }
      );
    }

    // Create user profile in PostgreSQL
    await upsertUserProfileInDb({
      userId: user.id,
      displayName: cleanName,
    });

    const token = createSessionToken(user);
    const clientUser = formatUserForClient(user, { displayName: cleanName });

    const response = NextResponse.json(
      { success: true, user: clientUser, token },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set("roastmaster_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Signup API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create account." },
      { status: 500 }
    );
  }
}
