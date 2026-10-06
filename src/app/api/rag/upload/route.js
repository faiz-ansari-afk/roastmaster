// src/app/api/rag/upload/route.js — PDF Ingestion, Chunking, & pgvector Storage
import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import { splitTextIntoChunks } from "@/lib/chunking";
import { getBatchEmbeddings } from "@/lib/embeddings";
import {
  insertDocumentChunks,
  getSessionDocuments,
  deleteSessionDocuments,
} from "@/lib/db";

// Handle PDF file upload, text extraction, embedding generation, & vector DB insertion
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const sessionId = formData.get("sessionId");
    const userId = formData.get("userId") || null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter. Chat session must be active." },
        { status: 400 }
      );
    }

    // Basic MIME / extension validation
    const fileName = file.name || "document.pdf";
    const isPdf =
      file.type === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "Only PDF documents are supported for RAG indexing." },
        { status: 400 }
      );
    }

    // Size limit check (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 15MB limit. Please upload a smaller document." },
        { status: 400 }
      );
    }

    console.log(`[RAG Upload] Processing "${fileName}" (${(file.size / 1024).toFixed(1)} KB) for session: ${sessionId}`);

    // Read bytes into Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Extract text using unpdf (pure workerless build designed for Next.js / serverless)
    let rawText = "";
    let totalPages = 1;
    try {
      const result = await extractText(uint8Array, { mergePages: true });
      rawText = typeof result?.text === "string"
        ? result.text
        : Array.isArray(result?.text)
          ? result.text.join("\n\n")
          : "";
      totalPages = result?.totalPages || 1;
    } catch (parseErr) {
      console.error("[RAG Upload] Failed to parse PDF:", parseErr);
      return NextResponse.json(
        { error: `Unable to read PDF file: ${parseErr.message || "Corrupted or encrypted PDF"}` },
        { status: 422 }
      );
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json(
        {
          error:
            "No extractable text found in this PDF. It may be a scanned image or protected PDF without OCR text.",
        },
        { status: 422 }
      );
    }

    // Split raw text strictly at complete sentence boundaries with 1-sentence overlap
    const textChunks = splitTextIntoChunks(rawText, {
      targetChunkSize: 700,
      sentenceOverlap: 1,
    });

    if (textChunks.length === 0) {
      return NextResponse.json(
        { error: "Could not create text chunks from the document." },
        { status: 422 }
      );
    }

    console.log(`[RAG Upload] Generated ${textChunks.length} chunks across ${totalPages} pages. Generating embeddings...`);

    // Batch embedding generation (Gemini embedding API)
    // To avoid rate-limit spikes on large PDFs, process in batches of 10
    const BATCH_SIZE = 10;
    const chunksWithEmbeddings = [];

    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
      const batch = textChunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map((c) => c.content);

      const embeddings = await getBatchEmbeddings(batchTexts);

      batch.forEach((chunk, idx) => {
        const emb = embeddings[idx];
        if (Array.isArray(emb) && emb.length > 0) {
          chunksWithEmbeddings.push({
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding: emb,
          });
        }
      });
    }

    if (chunksWithEmbeddings.length === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to generate vector embeddings. Check your GEMINI_API_KEY quota.",
        },
        { status: 500 }
      );
    }

    // Insert chunks into Aiven PostgreSQL (pgvector)
    await insertDocumentChunks({
      sessionId,
      userId,
      fileName,
      chunks: chunksWithEmbeddings,
    });

    console.log(`[RAG Upload] Successfully stored ${chunksWithEmbeddings.length} vectors in Aiven PostgreSQL for "${fileName}".`);

    return NextResponse.json({
      success: true,
      fileName,
      totalPages,
      totalChunks: chunksWithEmbeddings.length,
      message: `Indexed "${fileName}" with ${chunksWithEmbeddings.length} chunks into Aiven pgvector.`,
    });
  } catch (error) {
    console.error("[RAG Upload] Uncaught error during PDF ingestion:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and index PDF." },
      { status: 500 }
    );
  }
}

// Retrieve active indexed documents for a chat session
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
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[RAG Upload] Error getting session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session documents." },
      { status: 500 }
    );
  }
}

// Delete document chunks for a session
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
    console.error("[RAG Upload] Error deleting session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete session documents." },
      { status: 500 }
    );
  }
}
