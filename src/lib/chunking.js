// src/lib/chunking.js — Sentence-Level & Semantic Text Chunking Utilities
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Splits document text strictly at grammatical sentence boundaries.
 * Chunks are composed ONLY of whole, complete sentences and bullet points.
 * 
 * @param {string} text - Raw text extracted from document/PDF.
 * @param {object} [options]
 * @param {number} [options.targetChunkSize=700] - Target character budget per chunk (~120-160 words).
 * @param {number} [options.sentenceOverlap=1] - Number of complete sentences to overlap between chunks.
 * @returns {Array<{ chunkIndex: number, content: string }>}
 */
export function splitTextIntoSentenceChunks(text, options = {}) {
  const {
    targetChunkSize = 700,
    sentenceOverlap = 1,
    pageNumber = 1,
    startIndex = 0,
  } = options;
  if (!text || typeof text !== "string") return [];

  // Normalize line breaks & strip weird null bytes
  const clean = text
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!clean) return [];

  // 1. Break text into structural paragraphs / blocks
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  // 2. Extract atomic sentences & bullet points
  const atomicUnits = [];
  const segmenter =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? new Intl.Segmenter("en", { granularity: "sentence" })
      : null;

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);

    // If paragraph is a list of bullet points or short items, keep each bullet intact
    const isBulletList =
      lines.length > 1 &&
      lines.every((l) => l.length < 160 || /^[-*•\d+.)]/.test(l));

    if (isBulletList) {
      for (const line of lines) {
        if (line) atomicUnits.push(line);
      }
    } else if (segmenter) {
      // Grammatical sentence segmenter (respects abbreviations, quotes, and punctuation)
      const segments = Array.from(segmenter.segment(para))
        .map((s) => s.segment.trim())
        .filter(Boolean);
      atomicUnits.push(...segments);
    } else {
      // Regex sentence boundary fallback (. ! ? followed by space)
      const regexUnits = para.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
      atomicUnits.push(...regexUnits);
    }
  }

  if (atomicUnits.length === 0) return [];

  // 3. Assemble complete sentences into chunks up to targetChunkSize
  const chunks = [];
  let currentGroup = [];
  let currentLength = 0;
  let chunkIndex = typeof startIndex === "number" ? startIndex : 0;

  for (let i = 0; i < atomicUnits.length; i++) {
    const unit = atomicUnits[i];
    const unitLen = unit.length;

    // Handle rare case: an individual sentence is extraordinarily long (e.g. unpunctuated text)
    if (unitLen > targetChunkSize) {
      if (currentGroup.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          pageNumber,
          content: currentGroup.join(" "),
        });
        currentGroup = [];
        currentLength = 0;
      }

      // Split oversized sentence by clauses (commas, semicolons, dashes)
      const clauses = unit.split(/(?<=[,;:—])\s+/).filter(Boolean);
      let clauseBuf = [];
      let clauseLen = 0;

      for (const clause of clauses) {
        if (clauseLen + clause.length > targetChunkSize && clauseBuf.length > 0) {
          chunks.push({
            chunkIndex: chunkIndex++,
            pageNumber,
            content: clauseBuf.join(" "),
          });
          clauseBuf = [];
          clauseLen = 0;
        }
        clauseBuf.push(clause);
        clauseLen += clause.length + 1;
      }

      if (clauseBuf.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          pageNumber,
          content: clauseBuf.join(" "),
        });
      }
      continue;
    }

    // If adding this complete sentence exceeds the budget, finalize chunk
    if (currentLength + unitLen > targetChunkSize && currentGroup.length > 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        pageNumber,
        content: currentGroup.join(" "),
      });

      // Retain the last N complete sentences as overlap for semantic continuity
      if (sentenceOverlap > 0) {
        currentGroup = currentGroup.slice(-sentenceOverlap);
        currentLength = currentGroup.reduce((acc, s) => acc + s.length + 1, 0);
      } else {
        currentGroup = [];
        currentLength = 0;
      }
    }

    currentGroup.push(unit);
    currentLength += unitLen + 1;
  }

  if (currentGroup.length > 0) {
    chunks.push({
      chunkIndex: chunkIndex++,
      pageNumber,
      content: currentGroup.join(" "),
    });
  }

  return chunks;
}

/**
 * Splits document text using LangChain's RecursiveCharacterTextSplitter.
 * 
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.chunkSize=750]
 * @param {number} [options.chunkOverlap=120]
 * @param {number} [options.pageNumber=1]
 * @returns {Promise<Array<{ chunkIndex: number, pageNumber: number, content: string }>>}
 */
export async function splitTextWithLangChain(text, options = {}) {
  const { chunkSize = 750, chunkOverlap = 120, pageNumber = 1 } = options;
  if (!text || typeof text !== "string") return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
  });

  const rawChunks = await splitter.splitText(text);
  return rawChunks
    .map((content, idx) => ({
      chunkIndex: idx,
      pageNumber,
      content: content.trim(),
    }))
    .filter((c) => c.content.length > 20);
}

/**
 * Splits an array of page texts (one entry per page) into page-attributed sentence chunks.
 * Ensures chunks NEVER merge text across page boundaries, strictly preserving exact page numbers.
 *
 * @param {Array<string | { text: string, pageNumber: number }>} pages - Array of page texts or page objects.
 * @param {object} [options]
 * @param {number} [options.targetChunkSize=700]
 * @param {number} [options.sentenceOverlap=1]
 * @returns {Array<{ chunkIndex: number, pageNumber: number, content: string }>}
 */
export function splitPagesIntoChunks(pages, options = {}) {
  if (!Array.isArray(pages) || pages.length === 0) return [];

  const allChunks = [];
  let currentChunkIndex = 0;

  pages.forEach((pageItem, index) => {
    let pageText = "";
    let pageNumber = index + 1;

    if (typeof pageItem === "string") {
      pageText = pageItem;
    } else if (pageItem && typeof pageItem === "object") {
      pageText = pageItem.text || "";
      pageNumber = typeof pageItem.pageNumber === "number" ? pageItem.pageNumber : index + 1;
    }

    const clean = (pageText || "").trim();
    if (!clean) return;

    const pageChunks = splitTextIntoSentenceChunks(clean, {
      ...options,
      pageNumber,
      startIndex: currentChunkIndex,
    });

    for (const chunk of pageChunks) {
      allChunks.push(chunk);
      currentChunkIndex++;
    }
  });

  return allChunks;
}

/**
 * Main chunker function used by RAG upload pipeline.
 * Defaults to sentence-level chunking so no chunk ever breaks in the middle of a sentence.
 * If given an array of page texts, chunks each page independently, preserving page numbers.
 *
 * @param {string | string[]} textOrPages - Raw document text or array of page texts.
 * @param {object|number} [optionsOrSize] - Options object or legacy chunkSize number.
 * @param {number} [legacyOverlap] - Legacy overlap number.
 * @returns {Array<{ chunkIndex: number, pageNumber: number, content: string }>}
 */
export function splitTextIntoChunks(textOrPages, optionsOrSize = 700, legacyOverlap = 1) {
  let options = {};
  if (typeof optionsOrSize === "number") {
    options = {
      targetChunkSize: optionsOrSize,
      sentenceOverlap: typeof legacyOverlap === "number" ? Math.min(2, Math.max(1, Math.round(legacyOverlap / 100))) : 1,
    };
  } else if (typeof optionsOrSize === "object" && optionsOrSize !== null) {
    options = optionsOrSize;
  }

  if (Array.isArray(textOrPages)) {
    return splitPagesIntoChunks(textOrPages, options);
  }

  return splitTextIntoSentenceChunks(textOrPages, options);
}
