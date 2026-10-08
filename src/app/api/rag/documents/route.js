// src/app/api/rag/documents/route.js — Retrieve & Manage Indexed Session Documents
import { NextResponse } from "next/server";
import { getSessionDocuments, deleteSessionDocuments } from "@/lib/db";

// GET /api/rag/documents?sessionId=... — Fetch all indexed documents for a session
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    const documents = await getSessionDocuments(sessionId);
    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error("[RAG Documents] Error getting session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session documents.", documents: [] },
      { status: 500 }
    );
  }
}

// DELETE /api/rag/documents?sessionId=... — Shred document chunks for a session
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    await deleteSessionDocuments(sessionId);
    return NextResponse.json({
      success: true,
      message: `Deleted document chunks for session: ${sessionId}`,
    });
  } catch (error) {
    console.error("[RAG Documents] Error deleting session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete session documents." },
      { status: 500 }
    );
  }
}
