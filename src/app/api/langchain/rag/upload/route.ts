// src/app/api/langchain/rag/upload/route.ts — Dedicated LangChain PDF Ingestion & Retrieval API
import { NextResponse } from "next/server";
import {
  loadPdfPages,
  splitPdfDocuments,
} from "@/lib/langchain/document-loader";
import {
  ingestDocumentsToVectorStore,
  getLangChainSessionDocuments,
  deleteLangChainSessionDocuments,
} from "@/lib/langchain/vectorstore";

export const runtime = "nodejs";

/**
 * POST /api/langchain/rag/upload
 * Dedicated PDF upload endpoint for sessions using LangChain RAG.
 * Extracts text, chunks via RecursiveCharacterTextSplitter, and indexes into langchain_pdf_vectors.
 */
export async function POST(req: Request) {
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

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing sessionId parameter. Chat session must be active." },
        { status: 400 }
      );
    }

    const fileName = (file as File).name || "document.pdf";
    const isPdf =
      (file as File).type === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "Only PDF documents are supported for RAG indexing." },
        { status: 400 }
      );
    }

    // Size limit check (max 2.5MB)
    const MAX_SIZE = 2.5 * 1024 * 1024;
    if ((file as File).size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `File size (${((file as File).size / (1024 * 1024)).toFixed(
            1
          )}MB) exceeds the 2MB limit. For this learning project tier, please upload a PDF under 2MB.`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[LangChain Upload] Processing "${fileName}" (${((file as File).size / 1024).toFixed(
        1
      )} KB) for session: ${sessionId}`
    );

    const arrayBuffer = await (file as File).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 1. Load PDF into page-level LangChain Documents
    let pageDocs;
    try {
      pageDocs = await loadPdfPages(uint8Array, {
        fileName,
        sessionId,
        tenantId: (userId as string) || sessionId,
      });
    } catch (parseErr: any) {
      console.error("[LangChain Upload] PDF parse error:", parseErr);
      return NextResponse.json(
        { error: `Unable to read PDF file: ${parseErr.message || "Corrupted or encrypted PDF"}` },
        { status: 422 }
      );
    }

    const totalPages = pageDocs.length > 0 ? pageDocs[0].metadata.totalPages : 0;
    if (totalPages > 40) {
      return NextResponse.json(
        {
          error: `Document has ${totalPages} pages. For this learning tier project, maximum limit is 40 pages.`,
        },
        { status: 400 }
      );
    }

    const totalExtractedLength = pageDocs.reduce(
      (sum, p) => sum + (p.pageContent ? p.pageContent.trim().length : 0),
      0
    );
    if (totalExtractedLength < 30) {
      return NextResponse.json(
        {
          error:
            "No extractable text found in this PDF. It may be a scanned image or protected PDF without OCR text.",
        },
        { status: 422 }
      );
    }

    // 2. Split page-level Documents using RecursiveCharacterTextSplitter
    const chunkedDocs = await splitPdfDocuments(pageDocs, {
      chunkSize: 700,
      chunkOverlap: 100,
    });

    if (chunkedDocs.length === 0) {
      return NextResponse.json(
        { error: "Could not create text chunks from the document." },
        { status: 422 }
      );
    }

    // Clear any previous chunks for this file in this session
    await deleteLangChainSessionDocuments(sessionId, fileName);

    // 3. Ingest chunked LangChain Documents into pgvector store
    await ingestDocumentsToVectorStore(chunkedDocs, {
      batchSize: 25,
      logProgress: false,
    });

    console.log(
      `[LangChain Upload] Successfully indexed ${chunkedDocs.length} chunks across ${totalPages} pages for "${fileName}" into langchain_pdf_vectors.`
    );

    return NextResponse.json({
      success: true,
      fileName,
      totalPages,
      totalChunks: chunkedDocs.length,
      engine: "langchain",
      message: `Indexed "${fileName}" with ${chunkedDocs.length} chunks into LangChain pgvector store.`,
    });
  } catch (error: any) {
    console.error("[LangChain Upload] Uncaught error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process and index PDF in LangChain." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/langchain/rag/upload?sessionId=...
 * Retrieves indexed documents for a specific LangChain session.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    const documents = await getLangChainSessionDocuments(sessionId);
    return NextResponse.json({
      success: true,
      sessionId,
      engine: "langchain",
      documents,
    });
  } catch (error: any) {
    console.error("[LangChain Upload] Error retrieving session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session documents." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/langchain/rag/upload?sessionId=...&fileName=...
 * Deletes indexed documents for a session from LangChain's vector store.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const fileName = searchParams.get("fileName") || undefined;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 }
      );
    }

    await deleteLangChainSessionDocuments(sessionId, fileName);
    return NextResponse.json({
      success: true,
      message: fileName
        ? `Deleted "${fileName}" from session ${sessionId}.`
        : `Deleted all documents for session ${sessionId}.`,
    });
  } catch (error: any) {
    console.error("[LangChain Upload] Error deleting session documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete session documents." },
      { status: 500 }
    );
  }
}
