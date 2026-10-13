/**
 * src/lib/langchain/rag-chain.ts
 * Multi-Route Context-Aware LCEL RAG Chain for RoastMaster AI.
 * 
 * Features:
 * 1. 5-Route Intent Router (Banter, General Knowledge, Clarification, Code Analysis, Document RAG)
 * 2. Retrieval Relevance Filtering (Refuses weak retrieval before prompting LLM)
 * 3. Structured Evidence Attribution (LLM identifies supporting excerpt IDs)
 * 4. Trusted Citation Validation (Metadata derived strictly from verified Document instances)
 * 5. Strong Grounding Evaluation (grounded === true only when claims are proven by evidence)
 */
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableBranch,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import {
  getLangChainVectorStore,
  searchSimilarDocuments,
  SearchResult,
  VectorStoreOptions,
} from "./vectorstore";
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
  enforceTenantIsolation?: boolean;
  temperature?: number;
  minSimilarity?: number;
  storeOptions?: VectorStoreOptions;
}

export interface StructuredRagOutput {
  hasSufficientEvidence: boolean;
  answer: string;
  citedExcerptIds: number[];
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
 * Parses structured JSON response from the LLM or falls back deterministically.
 */
export function parseStructuredRagOutput(text: string): StructuredRagOutput {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        hasSufficientEvidence: Boolean(parsed.hasSufficientEvidence),
        answer: String(parsed.answer || "").trim(),
        citedExcerptIds: Array.isArray(parsed.citedExcerptIds)
          ? parsed.citedExcerptIds.filter((id: any) => typeof id === "number")
          : [],
      };
    }
  } catch {
    // Non-JSON fallback
  }

  const isRefusal =
    /cannot find|not mentioned|not found|no information|insufficient evidence|does not state|does not specify/i.test(
      text
    );

  return {
    hasSufficientEvidence: !isRefusal,
    answer: text.trim(),
    citedExcerptIds: [],
  };
}

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

  // 6. Default Fallback: General Knowledge (React, Biryani, DSA, etc.)
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
 * Constructs an intelligent 5-route LCEL Chain with Context-Aware Intent Routing,
 * Relevance Thresholds, and Grounded Citation Verification.
 */
export async function createRagChain(options: RagChainOptions = {}) {
  const {
    k = 4,
    tenantId,
    enforceTenantIsolation = true,
    temperature = 0.2,
    minSimilarity = 0.50, // Minimum relevance threshold (cosine similarity)
    storeOptions = {},
  } = options;

  // Verify vector store connection
  await getLangChainVectorStore(storeOptions);

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
  // ROUTE 5: DOCUMENT RAG BRANCH (Grounded Evidence + Verified Citations)
  // -------------------------------------------------------------
  const ragPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster's backstage AI technical expert and document reviewer.
Answer the user's question accurately using ONLY the provided document excerpts below.

DOCUMENT CONTEXT:
======================================================================
{context}
======================================================================

GROUNDING & EVIDENCE RULES (STRICT):
1. Evaluate whether the provided excerpts contain sufficient facts to answer the question.
2. If the excerpts do NOT contain enough information, set "hasSufficientEvidence": false, explain what is missing in "answer", and set "citedExcerptIds": []. Do NOT invent or speculate.
3. In "citedExcerptIds", include ONLY the excerpt numbers (e.g. [1, 2]) that directly prove your answer.
4. Output valid JSON only matching the schema below.

JSON OUTPUT SCHEMA:
{{
  "hasSufficientEvidence": <true | false>,
  "answer": "<concise, technically accurate answer grounded in excerpts>",
  "citedExcerptIds": [<array of supporting excerpt numbers>]
}}`,
    ],
    ["human", "{question}"],
  ]);

  const documentRagBranch = RunnableSequence.from([
    // Step 1: Perform vector search with distance and similarity metrics
    {
      searchResults: async (input: RagInput) => {
        return searchSimilarDocuments(
          input.question,
          { k, tenantId, enforceTenantIsolation },
          storeOptions
        );
      },
      question: (input: RagInput) => input.question,
    },
    // Step 2: Relevance threshold & context formatting
    RunnablePassthrough.assign({
      context: (state: { searchResults: SearchResult[] }) => {
        const docs = state.searchResults.map((r) => r.document);
        return formatDocumentsForContext(docs);
      },
      isRelevanceAcceptable: (state: { searchResults: SearchResult[] }) => {
        if (state.searchResults.length === 0) return false;
        const bestSimilarity = state.searchResults[0]?.similarity ?? 0;
        return bestSimilarity >= minSimilarity;
      },
    }),
    // Step 3: LLM generation (only if relevance threshold is satisfied)
    RunnablePassthrough.assign({
      rawOutput: async (state: {
        question: string;
        context: string;
        isRelevanceAcceptable: boolean;
        searchResults: SearchResult[];
      }) => {
        if (!state.isRelevanceAcceptable) {
          return JSON.stringify({
            hasSufficientEvidence: false,
            answer:
              "I cannot find sufficient relevant evidence in the uploaded document to answer this question.",
            citedExcerptIds: [],
          });
        }

        const formatted = await ragPrompt.format({
          question: state.question,
          context: state.context,
        });
        const res = await chatModel.invoke(formatted);
        return outputParser.invoke(res);
      },
    }),
    // Step 4: Validate citations and evaluate true semantic groundedness
    (state: {
      searchResults: SearchResult[];
      rawOutput: string;
      isRelevanceAcceptable: boolean;
    }): RagResponse => {
      const parsed = parseStructuredRagOutput(state.rawOutput);

      // Validate citations strictly against trusted Document metadata
      const validatedCitations: Citation[] = [];
      if (parsed.hasSufficientEvidence && Array.isArray(parsed.citedExcerptIds)) {
        for (const id of parsed.citedExcerptIds) {
          const docIndex = id - 1; // 1-indexed to 0-indexed
          if (docIndex >= 0 && docIndex < state.searchResults.length) {
            const doc = state.searchResults[docIndex].document;
            const alreadyCited = validatedCitations.some(
              (c) =>
                c.documentId === doc.metadata.documentId &&
                c.pageNumber === doc.metadata.pageNumber &&
                c.chunkIndex === doc.metadata.chunkIndex
            );
            if (!alreadyCited) {
              validatedCitations.push({
                source: doc.metadata.source,
                fileName: doc.metadata.fileName,
                pageNumber: doc.metadata.pageNumber,
                documentId: doc.metadata.documentId,
                chunkIndex: doc.metadata.chunkIndex,
                excerpt: doc.pageContent.slice(0, 160).trim(),
              });
            }
          }
        }
      }

      // Strong grounded guarantee:
      // Must have sufficient evidence AND validated citations AND acceptable retrieval relevance
      const isGrounded =
        state.isRelevanceAcceptable &&
        parsed.hasSufficientEvidence === true &&
        validatedCitations.length > 0;

      return {
        answer: parsed.answer,
        citations: isGrounded ? validatedCitations : [],
        grounded: isGrounded,
        intent: "document_rag",
        retrievedCount: state.searchResults.length,
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
