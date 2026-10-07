// src/app/api/sessions/route.js — Full Session Management (PostgreSQL + pgvector)
import { NextResponse } from "next/server";
import {
  getUserSessionsFromDb,
  createSessionInDb,
  updateSessionTitleInDb,
  deleteSessionFromPostgres,
  deleteAllUserPostgresData,
} from "@/lib/db";

// GET /api/sessions?userId=... — List all sessions for user
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const sessions = await getUserSessionsFromDb(userId);
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("[Sessions API GET error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sessions", sessions: [] },
      { status: 500 }
    );
  }
}

// POST /api/sessions — Create new session
export async function POST(req) {
  try {
    const body = await req.json();
    let { sessionId, userId, title } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      sessionId = `roast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const id = await createSessionInDb({
      sessionId,
      userId,
      title: title || "New Roast Session",
    });

    return NextResponse.json({ success: true, sessionId: id }, { status: 201 });
  } catch (error) {
    console.error("[Sessions API POST error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions — Rename session title
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { sessionId, title } = body;

    if (!sessionId || !title) {
      return NextResponse.json(
        { error: "Missing sessionId or title" },
        { status: 400 }
      );
    }

    const success = await updateSessionTitleInDb(sessionId, title);
    return NextResponse.json({ success }, { status: 200 });
  } catch (error) {
    console.error("[Sessions API PATCH error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update session title" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions?sessionId=... or ?all=true&userId=... — Shred session(s)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const shredAll = searchParams.get("all") === "true";

    if (shredAll) {
      console.log(`[Sessions API] Shredding all PostgreSQL data for user: ${userId || "all"}`);
      const res = await deleteAllUserPostgresData(userId || null);
      return NextResponse.json({
        success: true,
        message: "All PostgreSQL session data, messages, and document chunks shredded.",
        ...res,
      });
    }

    if (sessionId) {
      console.log(`[Sessions API] Deleting session ${sessionId} from PostgreSQL`);
      await deleteSessionFromPostgres(sessionId);
      return NextResponse.json({
        success: true,
        sessionId,
        message: `Session ${sessionId} shredded from PostgreSQL.`,
      });
    }

    return NextResponse.json(
      { error: "Missing sessionId or all=true parameter." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Sessions API] Error deleting sessions from PostgreSQL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to shred session data from database." },
      { status: 500 }
    );
  }
}
