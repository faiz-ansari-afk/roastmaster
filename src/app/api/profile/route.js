// src/app/api/profile/route.js — User Profile API (PostgreSQL)
import { NextResponse } from "next/server";
import { getUserProfileFromDb, upsertUserProfileInDb } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const profile = await getUserProfileFromDb(userId);
    return NextResponse.json({ profile: profile || null }, { status: 200 });
  } catch (error) {
    console.error("[Profile API GET error]:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userId,
      displayName,
      photoURL,
      stageTitle,
      bio,
      roastLevel,
      favoriteTopic,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const success = await upsertUserProfileInDb({
      userId,
      displayName,
      photoURL,
      stageTitle,
      bio,
      roastLevel,
      favoriteTopic,
    });

    if (!success) {
      return NextResponse.json({ error: "Failed to save profile in database" }, { status: 500 });
    }

    const updatedProfile = await getUserProfileFromDb(userId);
    return NextResponse.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error("[Profile API POST error]:", error);
    return NextResponse.json({ error: error?.message || "Failed to update profile" }, { status: 500 });
  }
}
