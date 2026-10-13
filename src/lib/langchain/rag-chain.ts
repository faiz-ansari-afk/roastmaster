/**
 * src/lib/langchain/rag-chain.ts
 * Declarative LCEL (LangChain Expression Language) RAG Chain for RoastMaster AI.
 * 
 * Pipeline:
 * [Input: { question }]
 *    │
 *    ├─▶ VectorStoreRetriever ──▶ Document[] (Retrieved Chunks)
 *    │
 *    ▼
 * Format Context with Citations
 *    │
 *    ▼
 * ChatPromptTemplate ──▶ ChatGoogleGenerativeAI ──▶ StringOutputParser
 *    │
 *    ▼
 * [Structured Output: { answer, citations, grounded, retrievedCount }]
 */
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
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
  retrievedCount: number;
}

export interface RagChainOptions {
  k?: number;
  tenantId?: string;
  temperature?: number;
  storeOptions?: VectorStoreOptions;
  systemInstruction?: string;
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
 * Factory that constructs and returns a fully composable LCEL RAG Chain.
 *
 * Employs `RunnablePassthrough.assign` to run retrieval, context formatting,
 * LLM generation, and citation extraction within a single declarative pipeline.
 *
 * @param options - Chain options (k, tenantId, temperature, storeOptions, systemInstruction)
 */
export async function createRagChain(options: RagChainOptions = {}) {
  const {
    k = 4,
    tenantId,
    temperature = 0.2,
    storeOptions = {},
    systemInstruction = DEFAULT_RAG_SYSTEM_PROMPT,
  } = options;

  const store = await getLangChainVectorStore(storeOptions);
  const retriever = store.asRetriever({
    k,
    filter: tenantId ? { tenantId } : undefined,
  });

  const chatModel = createChatModel(temperature);
  const outputParser = new StringOutputParser();

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemInstruction],
    ["human", "{question}"],
  ]);

  // Construct the Declarative LCEL Pipeline
  const chain = RunnableSequence.from([
    // Step 1: Receive input question, invoke retriever in parallel while preserving question
    {
      documents: async (input: { question: string }) => {
        const rawDocs = await retriever.invoke(input.question);
        return rawDocs as Document<DocumentMetadata>[];
      },
      question: (input: { question: string }) => input.question,
    },
    // Step 2: Format context for prompt template while retaining original documents
    RunnablePassthrough.assign({
      context: (input: { documents: Document<DocumentMetadata>[] }) =>
        formatDocumentsForContext(input.documents),
    }),
    // Step 3: Run the (Prompt -> Gemini LLM -> StringOutputParser) generation chain
    RunnablePassthrough.assign({
      answer: RunnableSequence.from([
        (input: { question: string; context: string }) => ({
          question: input.question,
          context: input.context,
        }),
        promptTemplate,
        chatModel,
        outputParser,
      ]),
    }),
    // Step 4: Map raw outputs into strongly-typed RagResponse with citations
    (input: { documents: Document<DocumentMetadata>[]; answer: string }) => {
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
        retrievedCount: input.documents.length,
      } as RagResponse;
    },
  ]);

  return chain;
}
