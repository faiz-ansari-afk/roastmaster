/**
 * src/lib/langchain/document-loader.ts
 * Isolated PDF Loading & Semantic Chunking utilities using LangChain.js primitives.
 * 
 * Standardizes raw PDF documents into LangChain `Document` objects with rich metadata
 * for pgvector indexing and citations.
 */
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractText } from "unpdf";
import fs from "node:fs/promises";
import path from "node:path";

export interface PdfChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  keepSeparator?: boolean;
}

export interface DocumentMetadata {
  source: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  chunkIndex?: number;
  charCount?: number;
  [key: string]: any;
}

/**
 * Loads a PDF file from a filesystem path or Uint8Array buffer and converts each page
 * into an individual LangChain `Document` object.
 *
 * @param input - File path string or Uint8Array of the PDF
 * @param originalFileName - Optional filename override for metadata
 * @returns Promise<Document[]> Array of page-level LangChain Documents
 */
export async function loadPdfPages(
  input: string | Uint8Array,
  originalFileName?: string
): Promise<Document<DocumentMetadata>[]> {
  let uint8Array: Uint8Array;
  let fileName = originalFileName || "document.pdf";

  if (typeof input === "string") {
    fileName = path.basename(input);
    const buffer = await fs.readFile(input);
    uint8Array = new Uint8Array(buffer);
  } else {
    uint8Array = input;
  }

  // Extract page-by-page using unpdf (mergePages: false preserves page granularity)
  const extraction = await extractText(uint8Array, { mergePages: false });
  const totalPages = extraction.totalPages || 1;

  let pageTexts: string[] = [];
  if (Array.isArray(extraction.text)) {
    pageTexts = extraction.text;
  } else if (typeof extraction.text === "string") {
    pageTexts = [extraction.text];
  }

  const documents: Document<DocumentMetadata>[] = [];

  pageTexts.forEach((text, index) => {
    const cleanText = (text || "").replace(/\0/g, "").trim();
    if (!cleanText) return; // Skip empty pages

    const pageNumber = index + 1;
    documents.push(
      new Document({
        pageContent: cleanText,
        metadata: {
          source: fileName,
          fileName,
          pageNumber,
          totalPages,
          charCount: cleanText.length,
        },
      })
    );
  });

  return documents;
}

/**
 * Splits page-level LangChain Documents into semantically cohesive chunks
 * using `RecursiveCharacterTextSplitter`.
 *
 * Preserves page numbers and original metadata on every resulting chunk,
 * adding `chunkIndex` and updated `charCount`.
 *
 * @param documents - Array of page-level Documents
 * @param options - Chunk size and overlap options
 * @returns Promise<Document[]> Array of chunked LangChain Documents
 */
export async function splitPdfDocuments(
  documents: Document<DocumentMetadata>[],
  options: PdfChunkOptions = {}
): Promise<Document<DocumentMetadata>[]> {
  const {
    chunkSize = 700,
    chunkOverlap = 100,
    keepSeparator = true,
  } = options;

  // Hierarchical separators: double-newline (paragraphs), single-newline, periods, spaces
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    keepSeparator,
    separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
  });

  const chunkedDocuments: Document<DocumentMetadata>[] = [];
  let globalChunkIndex = 0;

  for (const doc of documents) {
    // Split each page's document individually to strictly preserve pageNumber metadata
    const rawChunks = await splitter.splitDocuments([doc]);

    for (const chunk of rawChunks) {
      const trimmedContent = chunk.pageContent.trim();
      if (trimmedContent.length < 20) continue; // Filter out trivial fragments

      const chunkMetadata: DocumentMetadata = {
        source: doc.metadata.source,
        fileName: doc.metadata.fileName,
        pageNumber: doc.metadata.pageNumber,
        totalPages: doc.metadata.totalPages,
        ...chunk.metadata,
        chunkIndex: globalChunkIndex++,
        charCount: trimmedContent.length,
      };

      chunkedDocuments.push(
        new Document<DocumentMetadata>({
          pageContent: trimmedContent,
          metadata: chunkMetadata,
        })
      );
    }
  }

  return chunkedDocuments;
}

