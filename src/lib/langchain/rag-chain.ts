/**
 * src/lib/langchain/rag-chain.ts
 * Declarative LCEL RAG Chain with Intelligent Query Routing (Banter vs Document RAG).
 * 
 * Pipeline:
 * [Input: { question }]
 *          │
 *          ▼
 *    RunnableBranch (Query Intent Router)
 *          │
 *    ┌─────┴────────────────────────────────┐
 *    │ BANTER BRANCH                        │ DOCUMENT RAG BRANCH
 *    ▼                                      ▼
 *  Zero DB Vector Queries                 pgvector Similarity Search
 *  Comedy Club System Prompt              Document Grounding System Prompt
 *  Citations: []                          Verified Citations with Page Numbers
 *  Grounded: false                        Grounded: true
 */
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableBranch,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { getLangChainVectorStore, VectorStoreOptions } from "./vectorstore";
import { createChatModel } from "./config";
import { DocumentMetadata } from "./document-loader";

export interface Citation {
  source: string;
  fileName: string;
  pageNumber: number;
  documentId: string;
  chunkIndex?: number;
  excerpt: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  intent: "banter" | "document_rag";
  retrievedCount: number;
}

export interface RagChainOptions {
  k?: number;
  tenantId?: string;
  temperature?: number;
  storeOptions?: VectorStoreOptions;
  ragSystemInstruction?: string;
  banterSystemInstruction?: string;
}

// Common conversational banter words and crowdwork phrases
const BANTER_WORDS = new Set([
  "hi", "hello", "hey", "yo", "sup", "howdy", "hola",
  "what's up", "whats up", "how are you", "who are you",
  "tell me a joke", "make me laugh", "roast me", "roast this",
  "good morning", "good evening", "good night", "bye", "goodbye",
  "lol", "lmao", "rofl", "haha", "hahaha", "cool", "nice", "ok", "okay",
  "thanks", "thank you", "cheers", "bro", "dude", "man"
]);

const BANTER_PATTERNS = [
  /\broast (me|this|my|us)\b/i,
  /\b(tell me a joke|make me laugh|say something funny)\b/i,
  /\bwhat'?s up\b/i,
  /\bhow are you\b/i,
  /\bwho are you\b/i,
  /\b(shut up|you suck|not funny|be serious)\b/i,
];

/**
 * Fast sub-millisecond intent classifier to detect conversational small talk,
 * jokes, or crowd-work greetings that should never incur database vector searches.
 */
export function isConversationalBanter(text: string): boolean {
  if (!text || typeof text !== "string") return true;
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, "")
    .trim();

  if (!clean) return true;
  if (BANTER_WORDS.has(clean)) return true;
  if (clean.length <= 3 && !/^\d+$/.test(clean)) return true;

  // Regex word-boundary checks for banter phrases (e.g. "roast me", "what's up")
  // Ensures "RoastMaster" is NEVER misclassified as banter
  if (BANTER_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  // Greeting patterns without technical keywords
  if (
    /^(yo|hi|hello|hey|sup)\b/i.test(clean) &&
    !/architecture|tech stack|database|pgvector|embedding|file|document|function|system|flow/i.test(clean)
  ) {
    return true;
  }

  return false;
}

const DEFAULT_RAG_SYSTEM_PROMPT = `You are RoastMaster's backstage AI technical expert and code reviewer.
Answer the user's question accurately using ONLY the provided document context below.

DOCUMENT CONTEXT:
======================================================================
{context}
======================================================================

GROUNDING RULES:
1. Ground your answer strictly and exclusively in the provided document excerpts.
2. If the context does not contain enough information to answer the question, clearly state: "I cannot find this information in the uploaded document." Do NOT invent or speculate.
3. Be concise, punchy, and technically accurate.`;

const DEFAULT_BANTER_SYSTEM_PROMPT = `You are RoastMaster — a legendary, quick-witted standup comedian headlining an unfiltered comedy club.
The user just threw a casual greeting, heckle, or banter command at you.
Respond with a crisp, punchy, razor-sharp 1-2 sentence standup joke or witty greeting.
Do NOT mention any reference documents or apologize about missing context! Keep the comedy vibe alive!`;

/**
 * Formats retrieved LangChain Document chunks into a clean, numbered context block
 * with page and file provenance for prompt injection.
 */
export function formatDocumentsForContext(docs: Document<DocumentMetadata>[]): string {
  if (!docs || docs.length === 0) {
    return "NO RELEVANT DOCUMENT CONTEXT FOUND.";
  }

  return docs
    .map((doc, idx) => {
      const page = doc.metadata.pageNumber || 1;
      const file = doc.metadata.fileName || "document.pdf";
      return `[EXCERPT ${idx + 1} | File: ${file} | Page: ${page}]:\n"${doc.pageContent}"`;
    })
    .join("\n\n");
}

/**
 * Constructs an intelligent LCEL Chain with semantic intent routing:
 * - Banter/Greetings -> Banter Branch (0 DB vector queries, 0 citations, Standup Persona)
 * - Technical Questions -> Document RAG Branch (pgvector retrieval, grounding, exact citations)
 */
export async function createRagChain(options: RagChainOptions = {}) {
  const {
    k = 4,
    tenantId,
    temperature = 0.2,
    storeOptions = {},
    ragSystemInstruction = DEFAULT_RAG_SYSTEM_PROMPT,
    banterSystemInstruction = DEFAULT_BANTER_SYSTEM_PROMPT,
  } = options;

  const store = await getLangChainVectorStore(storeOptions);
  const retriever = store.asRetriever({
    k,
    filter: tenantId ? { tenantId } : undefined,
  });

  const chatModel = createChatModel(temperature);
  const banterChatModel = createChatModel(0.8); // Higher temperature for creative standup banter
  const outputParser = new StringOutputParser();

  // -------------------------------------------------------------
  // BRANCH 1: Banter / Conversational Branch (Zero Vector Queries)
  // -------------------------------------------------------------
  const banterPrompt = ChatPromptTemplate.fromMessages([
    ["system", banterSystemInstruction],
    ["human", "{question}"],
  ]);

  const banterBranch = RunnableSequence.from([
    banterPrompt,
    banterChatModel,
    outputParser,
    (answerText: string): RagResponse => ({
      answer: answerText.trim(),
      citations: [],           // Guaranteed zero false citations
      grounded: false,
      intent: "banter",
      retrievedCount: 0,       // Zero database queries
    }),
  ]);

  // -------------------------------------------------------------
  // BRANCH 2: Document RAG Branch (pgvector + Citations)
  // -------------------------------------------------------------
  const ragPrompt = ChatPromptTemplate.fromMessages([
    ["system", ragSystemInstruction],
    ["human", "{question}"],
  ]);

  const documentRagBranch = RunnableSequence.from([
    // Step 1: Vector retrieval
    {
      documents: async (input: { question: string }) => {
        const rawDocs = await retriever.invoke(input.question);
        return rawDocs as Document<DocumentMetadata>[];
      },
      question: (input: { question: string }) => input.question,
    },
    // Step 2: Format context for prompt
    RunnablePassthrough.assign({
      context: (input: { documents: Document<DocumentMetadata>[] }) =>
        formatDocumentsForContext(input.documents),
    }),
    // Step 3: LLM generation
    RunnablePassthrough.assign({
      answer: RunnableSequence.from([
        (input: { question: string; context: string }) => ({
          question: input.question,
          context: input.context,
        }),
        ragPrompt,
        chatModel,
        outputParser,
      ]),
    }),
    // Step 4: Map into strongly-typed RagResponse with citations
    (input: { documents: Document<DocumentMetadata>[]; answer: string }): RagResponse => {
      const isRefusal =
        input.documents.length === 0 ||
        /cannot find|not mentioned|not found|no information/i.test(input.answer);

      const citations: Citation[] = isRefusal
        ? []
        : input.documents.map((d) => ({
            source: d.metadata.source,
            fileName: d.metadata.fileName,
            pageNumber: d.metadata.pageNumber,
            documentId: d.metadata.documentId,
            chunkIndex: d.metadata.chunkIndex,
            excerpt: d.pageContent.slice(0, 160).trim(),
          }));

      return {
        answer: input.answer.trim(),
        citations,
        grounded: !isRefusal && citations.length > 0,
        intent: "document_rag",
        retrievedCount: input.documents.length,
      };
    },
  ]);

  // -------------------------------------------------------------
  // Assembled Routing Pipeline: RunnableBranch
  // -------------------------------------------------------------
  const routerChain = RunnableBranch.from([
    [
      (input: { question: string }) => isConversationalBanter(input.question),
      banterBranch,
    ],
    documentRagBranch, // Default fallback
  ]);

  return routerChain;
}
