// src/app/api/sessions/route.js — Session Management & Shredding (PostgreSQL + pgvector)
import { NextResponse } from "next/server";
import {
  deleteSessionFromPostgres,
  deleteAllUserPostgresData,
} from "@/lib/db";

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const shredAll = searchParams.get("all") === "true";

    if (shredAll) {
      console.log(`[Sessions API] Shredding all PostgreSQL vector data for user: ${userId || "all"}`);
      const res = await deleteAllUserPostgresData(userId || null);
      return NextResponse.json({
        success: true,
        message: "All PostgreSQL session vectors and document chunks shredded.",
        ...res,
      });
    }

    if (sessionId) {
      console.log(`[Sessions API] Deleting session ${sessionId} from PostgreSQL pgvector`);
      await deleteSessionFromPostgres(sessionId);
      return NextResponse.json({
        success: true,
        sessionId,
        message: `Session ${sessionId} shredded from PostgreSQL pgvector.`,
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
