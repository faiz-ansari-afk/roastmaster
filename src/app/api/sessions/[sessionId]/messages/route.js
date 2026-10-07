// src/app/api/sessions/[sessionId]/messages/route.js — Messages API (PostgreSQL)
import { NextResponse } from "next/server";
import {
  getSessionMessagesFromDb,
  saveCompletedExchangeInDb,
} from "@/lib/db";

// GET /api/sessions/[sessionId]/messages — Get message history
export async function GET(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const sessionId = resolvedParams?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const messages = await getSessionMessagesFromDb(sessionId);
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("[Messages API GET error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch messages", messages: [] },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[sessionId]/messages — Save user + bot exchange
export async function POST(req, { params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const sessionId = resolvedParams?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const body = await req.json();
    const {
      userId,
      userMsg,
      botMsg,
      title = null,
      isFirstMessage = false,
      embedding = null,
    } = body;

    if (!userId || !userMsg || !botMsg) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userMsg, botMsg" },
        { status: 400 }
      );
    }

    const success = await saveCompletedExchangeInDb({
      sessionId,
      userId,
      userMsg,
      botMsg,
      title,
      isFirstMessage,
      embedding,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to persist exchange to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Messages API POST error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save message exchange" },
      { status: 500 }
    );
  }
}
