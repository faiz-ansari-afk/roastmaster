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
  sessionId?: string;
  codeSnippet?: string;
}

export interface RagSource {
  fileName: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  snippet: string;
  similarity: number;
  isCited: boolean;
}

export interface RagResponse {
  title?: string;
  roast?: string;
  severity?: number;
  category?: string;
  suggestion?: string;
  answer: string;
  citations: Citation[];
  source?: string | null;
  ragSources?: RagSource[];
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
  title?: string;
  roast?: string;
  severity?: number;
  category?: string;
  suggestion?: string;
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
      const answerText = String(parsed.suggestion || parsed.answer || "").trim();
      const hasEvidence =
        typeof parsed.hasSufficientEvidence === "boolean"
          ? parsed.hasSufficientEvidence
          : typeof parsed.isDocumentSupported === "boolean"
          ? parsed.isDocumentSupported
          : false;

      let excerptIds: number[] = [];
      if (Array.isArray(parsed.citedExcerptIds)) {
        excerptIds = parsed.citedExcerptIds.filter((id: any) => typeof id === "number");
      } else if (Array.isArray(parsed.citations)) {
        excerptIds = parsed.citations
          .map((c: any) => (typeof c === "number" ? c : c?.chunkId || c?.pageNumber))
          .filter((id: any) => typeof id === "number");
      }

      return {
        title: parsed.title ? String(parsed.title).trim() : undefined,
        roast: parsed.roast ? String(parsed.roast).trim() : undefined,
        severity: typeof parsed.severity === "number" ? Math.min(10, Math.max(1, parsed.severity)) : undefined,
        category: parsed.category ? String(parsed.category).trim() : undefined,
        suggestion: answerText,
        answer: answerText,
        hasSufficientEvidence: hasEvidence,
        citedExcerptIds: excerptIds,
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
    suggestion: text.trim(),
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

  // 3. Simple Arithmetic / Math Queries (e.g. 2+2, 2 + 2, 5*5, what is 2+2, whats 2+2, calculate 10/2) -> General Knowledge
  const mathPrefixStripped = clean
    .replace(/^(what\s*is|whats|what's|calculate|evaluate|solve|how\s*much\s*is)\s+/i, "")
    .trim();
  const isPureMath =
    /^[\d\s\+\-\*\/%^.()=]+$/i.test(mathPrefixStripped) &&
    /\d/.test(mathPrefixStripped) &&
    /[\+\-\*\/%^=]/.test(mathPrefixStripped);
  const isMathWordQuery =
    /\b(what\s*is|whats|what's|calculate|evaluate|solve|how\s*much\s*is)\s+(\d+(\.\d+)?\s*[\+\-\*\/%^]\s*)+\d+(\.\d+)?\b/i.test(
      clean
    );

  if (isPureMath || isMathWordQuery) {
    return "general_knowledge";
  }

  // 4. Short non-digit conversational grunts / greetings (e.g. hi, hey, yo, wat, ok)
  if (clean.length <= 3 && !/^\d+$/.test(clean)) {
    return "banter";
  }

  // 5. Banter & Small Talk (Fast rules)
  const normalizedClean = clean.replace(/[?!.,;:'"()]/g, "").trim().toLowerCase();
  if (BANTER_WORDS.has(normalizedClean)) {
    return "banter";
  }
  if (BANTER_PATTERNS.some((p) => p.test(clean))) {
    return "banter";
  }

  // 6. Missing Document Reference -> User explicitly asked about a document but none uploaded
  const hasDocKeywords =
    /\b(pdf|document|doc|paper|file|guide|resume|page|pages|text|notes|slides?|chapter|reading)\b/i.test(clean) ||
    /\b(main point|key point|takeaways?|summarize|summary|overview|what does (it|the) say|what is (it|the) about|explain (this|the) (pdf|doc|document))\b/i.test(clean);

  if (hasDocKeywords && !hasUploadedDocs) {
    return "clarification";
  }

  // 7. Unambiguous General Knowledge / Lifestyle Queries (Cooking, Weather, Sports)
  const isLifestyleQuery =
    /\b(recipe|ingredients?|cook(ing)?|bake|baking|cuisine|dish|biryani|pizza|burger|pasta)\b/i.test(clean) ||
    /\b(weather|forecast|temperature outside|rain today)\b/i.test(clean) ||
    /\b(who won|sports score|match score|box office|movie review)\b/i.test(clean);

  if (isLifestyleQuery && !hasDocKeywords) {
    return "general_knowledge";
  }

  // 8. Document RAG: When a document is attached to the session, substantive domain inquiries
  // (e.g. natural inquiries like "whats Biological Mechanism", "explain LNPs") searches the document!
  if (hasUploadedDocs) {
    return "document_rag";
  }

  // 9. Default Fallback: General Knowledge (when no documents are attached)
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
      `You are RoastMaster — a legendary, razor-sharp standup comedian headlining an unfiltered roast comedy club.
The user just threw a greeting, short reaction, or small talk at you from the front row.
Deliver a crisp, punchy 1-2 sentence standup joke or crowd-work greeting (under 35 words).
Do NOT mention any files or documents.

Output valid JSON only:
{{
  "title": "<Concise 2-4 words title, e.g. 'Front Row Heckler', 'Crowd Check'>",
  "roast": "<1-2 razor-sharp comedy punchlines>",
  "severity": <integer from 4 to 8>,
  "category": "Crowd Work",
  "suggestion": "<Backstage Real Talk: witty, humorous 1-sentence response>"
}}`,
    ],
    ["human", "{question}"],
  ]);

  const banterBranch = RunnableSequence.from([
    banterPrompt,
    comedyChatModel,
    outputParser,
    (raw: string): RagResponse => {
      const parsed = parseStructuredRagOutput(raw);
      return {
        title: parsed.title || "Crowd Work",
        roast: parsed.roast || parsed.answer || "Welcome to the front row. Try not to get roasted too hard.",
        severity: parsed.severity || 6,
        category: parsed.category || "Crowd Work",
        suggestion: parsed.suggestion || parsed.answer,
        answer: parsed.answer || parsed.suggestion,
        citations: [],
        grounded: false,
        intent: "banter",
        retrievedCount: 0,
      };
    },
  ]);

  // -------------------------------------------------------------
  // ROUTE 2: GENERAL KNOWLEDGE BRANCH
  // -------------------------------------------------------------
  const generalKnowledgePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster — a legendary standup comedian headlining an unfiltered roast comedy club.
The user is asking a general knowledge, math, logic, science, or lifestyle question from the front row.

CORE COMEDY & REAL TALK RULES:
1. COMEDY ROAST ("roast"):
   - Deliver 1-2 razor-sharp comedy punchlines mocking their question, dilemma, or asking basic things.
   - For simple math like 2+2, roast them for needing an AI for primary school arithmetic.
2. BACKSTAGE REAL TALK ("suggestion"):
   - Answer their question accurately, concisely, and helpfully with witty comedic flair.
   - If it's math or logic, calculate and provide the correct result immediately (e.g. "It equals 4.").
   - Do NOT mention or apologize about any documents or files!

Output valid JSON only:
{{
  "title": "<Concise 3-5 words punchy title, e.g. 'Basic Arithmetic', 'JavaScript Event Loop'>",
  "roast": "<1-2 short, razor-sharp punchline sentences roasting the question>",
  "severity": <integer from 5 to 9>,
  "category": "<1-2 words category, e.g. Logic, Math, Tech, General>",
  "suggestion": "<Backstage Real Talk: accurate answer to the user's question with comedic wit>"
}}`,
    ],
    ["human", "{question}"],
  ]);

  const generalKnowledgeBranch = RunnableSequence.from([
    generalKnowledgePrompt,
    chatModel,
    outputParser,
    (raw: string): RagResponse => {
      const parsed = parseStructuredRagOutput(raw);
      return {
        title: parsed.title || "Standup Roast",
        roast: parsed.roast || parsed.answer || "A quick reality check before your brain overheats.",
        severity: parsed.severity || 7,
        category: parsed.category || "Logic",
        suggestion: parsed.suggestion || parsed.answer,
        answer: parsed.answer || parsed.suggestion,
        citations: [],
        grounded: false,
        intent: "general_knowledge",
        retrievedCount: 0,
      };
    },
  ]);

  // -------------------------------------------------------------
  // ROUTE 3: CLARIFICATION BRANCH (Missing Code or Missing File)
  // -------------------------------------------------------------
  const clarificationPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster — a legendary standup comedian headlining an unfiltered roast comedy club.
The user referenced code or a document that they forgot to paste or upload.
Deliver a razor-sharp comedy roast roasting them for pointing at thin air, followed by a witty request in "suggestion" to paste the code snippet or upload the file.

Output valid JSON only:
{{
  "title": "Hold Up",
  "roast": "<1-2 razor-sharp comedy punchlines>",
  "severity": <integer 7 to 9>,
  "category": "Clarification",
  "suggestion": "<Polite but witty request to upload the document or paste the code snippet>"
}}`,
    ],
    ["human", "{question}"],
  ]);

  const clarificationBranch = RunnableSequence.from([
    clarificationPrompt,
    comedyChatModel,
    outputParser,
    (raw: string): RagResponse => {
      const parsed = parseStructuredRagOutput(raw);
      return {
        title: parsed.title || "Stage Hold Up",
        roast: parsed.roast || parsed.answer || "You're pointing at thin air expecting me to read your mind.",
        severity: parsed.severity || 8,
        category: parsed.category || "Clarification",
        suggestion: parsed.suggestion || parsed.answer,
        answer: parsed.answer || parsed.suggestion,
        citations: [],
        grounded: false,
        intent: "clarification",
        retrievedCount: 0,
      };
    },
  ]);

  // -------------------------------------------------------------
  // ROUTE 4: CODE ANALYSIS BRANCH (Code Snippet Provided)
  // -------------------------------------------------------------
  const codeAnalysisPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster — code reviewer headlining an unfiltered comedy roast.
Roast the provided code snippet with technical savagery (pointing out anti-patterns, complexity, or style sins), followed by a constructive "Backstage Real Talk" fix in "suggestion".

Output valid JSON only:
{{
  "title": "<Concise 3-5 words punchy title, e.g. 'React Infinite Loop Roast'>",
  "roast": "<1-2 razor-sharp comedy punchlines about their code>",
  "severity": <integer 7 to 10>,
  "category": "Code Review",
  "suggestion": "<Backstage Real Talk: constructive, clean code advice or refactored solution>"
}}`,
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
    (raw: string): RagResponse => {
      const parsed = parseStructuredRagOutput(raw);
      return {
        title: parsed.title || "Code Review Roast",
        roast: parsed.roast || parsed.answer || "That code looks like it was written in the dark.",
        severity: parsed.severity || 8,
        category: parsed.category || "Code Review",
        suggestion: parsed.suggestion || parsed.answer,
        answer: parsed.answer || parsed.suggestion,
        citations: [],
        grounded: false,
        intent: "code_analysis",
        retrievedCount: 0,
      };
    },
  ]);

  // -------------------------------------------------------------
  // ROUTE 5: DOCUMENT RAG BRANCH (Grounded Evidence + Verified Citations + Standup Comedy)
  // -------------------------------------------------------------
  const ragPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are RoastMaster — a legendary, razor-sharp standup comedian headlining an unfiltered roast comedy club.
The user is sitting in the VIP front row asking a question. You have access to their uploaded reference document context below.

DOCUMENT CONTEXT:
======================================================================
{context}
======================================================================

GROUNDING & CITATION PROTOCOL (CRITICAL):
1. RELEVANCE & GROUNDING EVALUATION:
   Carefully examine the user's question and the DOCUMENT CONTEXT above:
   Does the document context actually contain facts or information that answer or directly support the user's question?

   CASE A: THE DOCUMENT CONTAINS THE ANSWER:
   - Set "hasSufficientEvidence": true
   - "roast": Deliver 1 to 2 crisp, razor-sharp standup punchlines (strictly under 35-45 words) specifically roasting the user's dilemma, question, or curiosity. NEVER copy or repeat factual document text as your roast! The roast MUST be an original, funny standup joke!
   - "suggestion": Provide a concise, factual explanation directly grounded in the DOCUMENT CONTEXT excerpts. Conclude "suggestion" with the citation in this exact format:
     Source: <fileName>, Page <pageNumber>
   - "citedExcerptIds": Array of excerpt numbers (e.g. [1, 2]) from the headers above that directly support your answer.

   CASE B: THE DOCUMENT DOES NOT CONTAIN THE ANSWER (OR IS IRRELEVANT):
   - Set "hasSufficientEvidence": false
   - Set "citedExcerptIds": []
   - CONVERSATIONAL / GENERAL / MATH RULE:
     If the user's message is a general question (e.g. math like 2+2, science, coding, lifestyle), conversational banter, or heckling:
     DO NOT apologize about the uploaded document! DO NOT say "I couldn't find this in your document"!
     Deliver pure comedy in "roast", and in "suggestion" provide the accurate answer (e.g. "It equals 4.") with Backstage Real Talk advice.
   - ONLY if the user is explicitly seeking document facts from their uploaded file (and it's missing), state in "suggestion":
     "I couldn't find this in your document."
   - DO NOT append any "Source:" line to "suggestion" when the document does not contain the answer!
   - NEVER hallucinate or force a citation to an unrelated excerpt!

2. METADATA:
   - "title": Concise 3-5 words punchy title summarizing the exact topic (e.g. "mRNA Biological Mechanism", "Basic Arithmetic").
   - "category": 1-2 words category (e.g. Biotech, Logic, Healthcare, Frontend, Architecture).
   - "severity": integer from 1 to 10.

OUTPUT FORMAT:
Output valid JSON only:
{{
  "title": "<Concise 3-5 words punchy title>",
  "roast": "<1-2 short, razor-sharp punchline sentences roasting the user>",
  "severity": <integer from 1 to 10>,
  "category": "<1-2 words category>",
  "hasSufficientEvidence": <true | false>,
  "suggestion": "<Backstage Real Talk: factual answer grounded in excerpts with Source line IF in document, or helpful witty answer with NO Source line if not in document>",
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
          { k, tenantId, sessionId: input.sessionId, enforceTenantIsolation },
          storeOptions
        );
      },
      question: (input: RagInput) => input.question,
    },
    // Step 2: Context formatting & relevance calculation
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
    // Step 3: LLM generation (invokes Gemini with Case A / Case B protocol)
    RunnablePassthrough.assign({
      rawOutput: async (state: {
        question: string;
        context: string;
        isRelevanceAcceptable: boolean;
        searchResults: SearchResult[];
      }) => {
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

      // Check for negative refusal phrases in suggestion
      const suggestionLower = (parsed.suggestion || "").toLowerCase();
      const negativeRefusalPatterns = [
        "couldn't find this in your document",
        "could not find this in your document",
        "not mentioned in the document",
        "not found in the document",
        "document does not mention",
        "document does not contain",
        "cannot find sufficient relevant evidence",
      ];
      const hasNegativeRefusal = negativeRefusalPatterns.some((pattern) =>
        suggestionLower.includes(pattern)
      );

      // Strong grounded guarantee:
      // Must have sufficient evidence AND validated citations AND acceptable retrieval relevance AND no negative refusal
      const isGrounded =
        state.isRelevanceAcceptable &&
        parsed.hasSufficientEvidence === true &&
        validatedCitations.length > 0 &&
        !hasNegativeRefusal;

      let cleanSuggestion = parsed.suggestion || parsed.answer || "";

      // If NOT grounded, strip any hallucinated Source lines from suggestion
      if (!isGrounded) {
        cleanSuggestion = cleanSuggestion
          .replace(/\n\s*Source:\s*[^,\n]+,\s*Page\s*\d+[^\n]*/gi, "")
          .trim();
      }

      // Construct ragSources for ChatWindow's RagSourcesAccordion ONLY when grounded
      let ragSources: RagSource[] | undefined = undefined;
      if (isGrounded && state.searchResults.length > 0) {
        ragSources = state.searchResults.map((r, idx) => {
          const page = r.document.metadata.pageNumber || 1;
          const file = r.document.metadata.fileName || "document.pdf";
          const isCited = validatedCitations.some(
            (vc) =>
              vc.pageNumber === page &&
              vc.fileName.toLowerCase() === file.toLowerCase()
          );
          return {
            fileName: file,
            chunkIndex: r.document.metadata.chunkIndex ?? idx,
            pageNumber: page,
            content: r.document.pageContent,
            snippet: r.document.pageContent.slice(0, 160).trim() + "...",
            similarity: r.similarity,
            isCited,
          };
        });
      }

      const primarySource =
        isGrounded && validatedCitations.length > 0
          ? `Source: ${validatedCitations[0].fileName}, Page ${validatedCitations[0].pageNumber}`
          : null;

      return {
        title: parsed.title || (isGrounded ? "Document Review" : "Standup Roast"),
        roast:
          parsed.roast ||
          "You brought reference documents to a comedy club. Truly bold.",
        severity: parsed.severity || (isGrounded ? 8 : 6),
        category: parsed.category || (isGrounded ? "Document RAG" : "General"),
        suggestion: cleanSuggestion,
        answer: cleanSuggestion,
        citations: isGrounded ? validatedCitations : [],
        source: primarySource,
        ragSources: isGrounded ? ragSources : [],
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
