// src/app/api/auth/logout/route.js — Logout & Clear Session Cookie
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" }, { status: 200 });
  response.cookies.set("roastmaster_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
