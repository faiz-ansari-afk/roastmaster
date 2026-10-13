/**
 * src/lib/langchain/rag-chain.ts
 * Multi-Route Context-Aware LCEL RAG Chain for RoastMaster AI.
 * 
 * Routes:
 * 1. BANTER: Casual greetings, heckles, and standup small talk (0 DB hits, 0 citations)
 * 2. GENERAL_KNOWLEDGE: Broad tech questions, recipes, concepts (0 DB hits, answered from LLM knowledge)
 * 3. CLARIFICATION: Prompts referencing missing code or missing files (0 DB hits, requests missing artifacts)
 * 4. CODE_ANALYSIS: Dedicated code review when a snippet is provided (0 DB hits, reviews snippet)
 * 5. DOCUMENT_RAG: Queries specifically targeting uploaded PDF evidence (pgvector search, citations attached)
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

export type QueryIntent =
  | "banter"
  | "general_knowledge"
  | "clarification"
  | "code_analysis"
  | "document_rag";

export interface Citation {
  source: string;
  fileName: string;
  pageNumber: number;
  documentId: string;
  chunkIndex?: number;
  excerpt: string;
}

export interface RagInput {
  question: string;
  hasUploadedDocs?: boolean;
  codeSnippet?: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  grounded: boolean;
  intent: QueryIntent;
  retrievedCount: number;
}

export interface RagChainOptions {
  k?: number;
  tenantId?: string;
  temperature?: number;
  storeOptions?: VectorStoreOptions;
}

const BANTER_PATTERNS = [
  /\broast (me|this|my|us)\b/i,
  /\b(tell me a joke|make me laugh|say something funny)\b/i,
  /\bwhat'?s up\b/i,
  /\bhow are you\b/i,
  /\bwho are you\b/i,
  /\b(shut up|you suck|not funny|be serious)\b/i,
];

const BANTER_WORDS = new Set([
  "hi", "hello", "hey", "yo", "sup", "howdy", "hola",
  "good morning", "good evening", "good night", "bye", "goodbye",
  "lol", "lmao", "rofl", "haha", "hahaha", "cool", "nice", "ok", "okay",
  "thanks", "thank you", "cheers", "bro", "dude", "man"
]);

/**
 * Multi-signal Context-Aware Intent Router.
 * Classifies query into: banter | general_knowledge | clarification | code_analysis | document_rag
 */
export function classifyQueryIntent(input: RagInput): QueryIntent {
  const { question, hasUploadedDocs = false, codeSnippet } = input;
  const clean = (question || "").trim().toLowerCase();

  // 1. Explicit code snippet attached or embedded in markdown code blocks
  if (codeSnippet && codeSnippet.trim().length > 0) {
    return "code_analysis";
  }
  if (/```[\s\S]*```/.test(question)) {
    return "code_analysis";
  }

  // 2. Missing Code Reference -> Clarification needed
  if (
    !codeSnippet &&
    /\b(explain|review|check|fix|debug|roast)\s+(this|my|the)\s+(code|script|function|snippet|error|stack trace)\b/i.test(
      clean
    )
  ) {
    return "clarification";
  }

  // 3. Banter & Small Talk
  if (BANTER_WORDS.has(clean.replace(/[?!.,;:'"()]/g, "").trim())) {
    return "banter";
  }
  if (BANTER_PATTERNS.some((p) => p.test(clean))) {
    return "banter";
  }

  // 4. Missing Document Reference -> Clarification needed
  const isAskingAboutDocument =
    /\b(in|from|according to|based on|what does|summarize)\s+(the|my|this)\s+(pdf|document|file|guide|resume|page)\b/i.test(
      clean
    ) || /\bpage\s+\d+\b/i.test(clean);

  if (isAskingAboutDocument && !hasUploadedDocs) {
    return "clarification";
  }

  // 5. Document RAG (User has uploaded docs AND asks about them, or query targets document specifics)
  if (hasUploadedDocs && isAskingAboutDocument) {
    return "document_rag";
  }

  // 6. Default Fallback for non-banter queries: General Knowledge (React, Biryani, DSA, etc.)
  // If the user has a document uploaded but simply asks "Explain ReactJS", we do NOT search the document!
  return "general_knowledge";
}

/**
 * Formats retrieved LangChain Document chunks into a clean, numbered context block.
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
 * Constructs an intelligent 5-route LCEL Chain with Context-Aware Intent Routing.
 */
export async function createRagChain(options: RagChainOptions = {}) {
  const {
    k = 4,
    tenantId,
    temperature = 0.2,
    storeOptions = {},
  } = options;

  const store = await getLangChainVectorStore(storeOptions);
  const retriever = store.asRetriever({
    k,
    filter: tenantId ? { tenantId } : undefined,
  });

  const chatModel = createChatModel(temperature);
  const comedyChatModel = createChatModel(0.8);
  const outputParser = new StringOutputParser();

  // -------------------------------------------------------------
  // ROUTE 1: BANTER BRANCH
  // -------------------------------------------------------------
  const banterPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are RoastMaster — a legendary, unfiltered standup comedian. Deliver a crisp, punchy 1-2 sentence crowd-work joke or greeting. Do NOT mention any files or documents.",
    ],
    ["human", "{question}"],
  ]);

  const banterBranch = RunnableSequence.from([
    banterPrompt,
    comedyChatModel,
    outputParser,
    (answer: string): RagResponse => ({
      answer: answer.trim(),
      citations: [],
      grounded: false,
      intent: "banter",
      retrievedCount: 0,
    }),
  ]);

  // -------------------------------------------------------------
  // ROUTE 2: GENERAL KNOWLEDGE BRANCH
  // -------------------------------------------------------------
  const generalKnowledgePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are RoastMaster — a witty, world-class AI developer and mentor. Answer the user's general knowledge or technical question thoroughly and helpfully, seasoned with smart comedic flair. You have complete freedom to use your pre-trained knowledge. Do NOT complain about missing documents.",
    ],
    ["human", "{question}"],
  ]);

  const generalKnowledgeBranch = RunnableSequence.from([
    generalKnowledgePrompt,
    chatModel,
    outputParser,
    (answer: string): RagResponse => ({
      answer: answer.trim(),
      citations: [],
      grounded: false,
      intent: "general_knowledge",
      retrievedCount: 0,
    }),
  ]);

  // -------------------------------------------------------------
  // ROUTE 3: CLARIFICATION BRANCH (Missing Code or Missing File)
  // -------------------------------------------------------------
  const clarificationPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are RoastMaster. The user referenced code or a document that they forgot to paste or upload. Witty roast them for pointing at thin air, and politely ask them to paste their code snippet or upload their document so you can review it.",
    ],
    ["human", "{question}"],
  ]);

  const clarificationBranch = RunnableSequence.from([
    clarificationPrompt,
    comedyChatModel,
    outputParser,
    (answer: string): RagResponse => ({
      answer: answer.trim(),
      citations: [],
      grounded: false,
      intent: "clarification",
      retrievedCount: 0,
    }),
  ]);

  // -------------------------------------------------------------
  // ROUTE 4: CODE ANALYSIS BRANCH (Code Snippet Provided)
  // -------------------------------------------------------------
  const codeAnalysisPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are RoastMaster — code reviewer headlining an unfiltered comedy roast. Roast the provided code snippet with technical savagery (pointing out anti-patterns, complexity, or style sins), followed by a constructive 'Backstage Real Talk' fix.",
    ],
    ["human", "User Question: {question}\n\nAttached Code:\n{codeSnippet}"],
  ]);

  const codeAnalysisBranch = RunnableSequence.from([
    (input: RagInput) => ({
      question: input.question,
      codeSnippet: input.codeSnippet || "(Code included in question)",
    }),
    codeAnalysisPrompt,
    chatModel,
    outputParser,
    (answer: string): RagResponse => ({
      answer: answer.trim(),
      citations: [],
      grounded: false,
      intent: "code_analysis",
      retrievedCount: 0,
    }),
  ]);

  // -------------------------------------------------------------
  // ROUTE 5: DOCUMENT RAG BRANCH (Vector Retrieval + Evidence)
  // -------------------------------------------------------------
  const ragPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster's backstage AI technical expert and document reviewer.
Answer the user's question accurately using ONLY the provided document context below.

DOCUMENT CONTEXT:
======================================================================
{context}
======================================================================

GROUNDING RULES:
1. Ground your answer strictly and exclusively in the provided document excerpts.
2. If the context does not contain enough information to answer the question, clearly state: "I cannot find this information in the uploaded document." Do NOT invent or speculate.
3. Be concise, punchy, and technically accurate.`,
    ],
    ["human", "{question}"],
  ]);

  const documentRagBranch = RunnableSequence.from([
    // Step 1: Vector retrieval
    {
      documents: async (input: RagInput) => {
        const rawDocs = await retriever.invoke(input.question);
        return rawDocs as Document<DocumentMetadata>[];
      },
      question: (input: RagInput) => input.question,
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
  // Declarative Multi-Route Assembly: RunnableBranch
  // -------------------------------------------------------------
  const multiRoutePipeline = RunnableSequence.from([
    // Step 1: Compute Intent from input and context
    (input: RagInput) => ({
      ...input,
      intent: classifyQueryIntent(input),
    }),
    // Step 2: Route dynamically based on resolved intent
    RunnableBranch.from([
      [(input: RagInput & { intent: QueryIntent }) => input.intent === "banter", banterBranch],
      [
        (input: RagInput & { intent: QueryIntent }) => input.intent === "clarification",
        clarificationBranch,
      ],
      [
        (input: RagInput & { intent: QueryIntent }) => input.intent === "code_analysis",
        codeAnalysisBranch,
      ],
      [
        (input: RagInput & { intent: QueryIntent }) => input.intent === "document_rag",
        documentRagBranch,
      ],
      // Default Fallback: General Knowledge
      generalKnowledgeBranch,
    ]),
  ]);

  return multiRoutePipeline;
}
