// src/app/api/auth/me/route.js — Get Current Logged-in User from PostgreSQL
import { NextResponse } from "next/server";
import {
  verifySessionToken,
  findUserById,
  formatUserForClient,
} from "@/lib/auth";
import { getUserProfileFromDb } from "@/lib/db";

export async function GET(req) {
  try {
    const cookieToken = req.cookies.get("roastmaster_token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = verifySessionToken(token);
    if (!payload?.uid) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await findUserById(payload.uid);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const profile = await getUserProfileFromDb(user.id);
    const clientUser = formatUserForClient(user, profile);

    return NextResponse.json({ user: clientUser }, { status: 200 });
  } catch (error) {
    console.error("[Auth /me Error]:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
