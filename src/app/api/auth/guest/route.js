// src/app/api/auth/guest/route.js — Anonymous Guest Pass in PostgreSQL (Zero Firebase)
import { NextResponse } from "next/server";
import {
  createUser,
  createSessionToken,
  formatUserForClient,
} from "@/lib/auth";

export async function POST() {
  try {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const guest = await createUser({
      id: guestId,
      displayName: "VIP Guest",
      isGuest: true,
    });

    const token = createSessionToken(guest);
    const clientUser = formatUserForClient(guest);

    const response = NextResponse.json(
      { success: true, user: clientUser, token },
      { status: 201 }
    );

    response.cookies.set("roastmaster_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days for guests
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Guest Auth Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create guest session" },
      { status: 500 }
    );
  }
}
