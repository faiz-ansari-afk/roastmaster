/**
 * src/lib/langchain/vectorstore.ts
 * Isolated PostgreSQL + pgvector VectorStore integration using LangChain.js.
 * 
 * Uses an isolated table ('langchain_pdf_vectors') to avoid touching or altering
 * the production 'document_chunks' table.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { createEmbeddings, getLangChainConfig } from "./config";
import { DocumentMetadata } from "./document-loader";
import { getDbPool } from "@/lib/db";

export interface VectorStoreOptions {
  tableName?: string;
  collectionTableName?: string;
  collectionName?: string;
}

export interface SearchResult {
  document: Document<DocumentMetadata>;
  score: number;
}

const DEFAULT_TABLE_NAME = "langchain_pdf_vectors";
const DEFAULT_COLLECTION_TABLE = "langchain_pdf_collections";
const DEFAULT_COLLECTION_NAME = "roastmaster_knowledge";

let vectorStoreInstance: PGVectorStore | null = null;

/**
 * Initializes and returns a singleton LangChain PGVectorStore instance.
 * Automatically verifies schema and creates isolated tables if they don't exist.
 */
export async function getLangChainVectorStore(
  options: VectorStoreOptions = {}
): Promise<PGVectorStore> {
  const {
    tableName = DEFAULT_TABLE_NAME,
    collectionTableName = DEFAULT_COLLECTION_TABLE,
    collectionName = DEFAULT_COLLECTION_NAME,
  } = options;

  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const pool = getDbPool();
  if (!pool) {
    throw new Error(
      "[LangChain VectorStore] DATABASE_URL is not set or database pool could not be initialized."
    );
  }

  const config = getLangChainConfig();
  const embeddings = createEmbeddings();

  // Initialize PGVectorStore with explicit 768 dimensions matching our Gemini embeddings
  vectorStoreInstance = await PGVectorStore.initialize(embeddings, {
    pool,
    tableName,
    collectionTableName,
    collectionName,
    dimensions: config.embeddingDimension,
    distanceStrategy: "cosine",
  });

  return vectorStoreInstance;
}

/**
 * Ingests an array of chunked LangChain Documents into the pgvector store.
 * Batches inserts into chunks of 25 to respect Gemini embedding rate limits.
 *
 * @param documents - Array of chunked Documents to embed and store
 * @param batchSize - Batch size for embedding and inserting (default: 25)
 * @returns Promise<{ insertedCount: number }>
 */
export async function ingestDocumentsToVectorStore(
  documents: Document<DocumentMetadata>[],
  batchSize: number = 25
): Promise<{ insertedCount: number }> {
  if (!documents || documents.length === 0) {
    return { insertedCount: 0 };
  }

  const store = await getLangChainVectorStore();
  let totalInserted = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await store.addDocuments(batch);
    totalInserted += batch.length;
  }

  return { insertedCount: totalInserted };
}

/**
 * Performs a vector similarity search using cosine distance in pgvector.
 *
 * @param query - User question or query string to search against
 * @param k - Number of top documents to retrieve (default: 4)
 * @param filter - Optional metadata filter
 * @returns Promise<SearchResult[]> Array of matching documents with similarity scores
 */
export async function searchSimilarDocuments(
  query: string,
  k: number = 4,
  filter?: Record<string, any>
): Promise<SearchResult[]> {
  const store = await getLangChainVectorStore();

  // similaritySearchWithScore returns: [Document, score][]
  const rawResults = await store.similaritySearchWithScore(query, k, filter);

  return rawResults.map(([doc, score]) => ({
    document: doc as Document<DocumentMetadata>,
    score,
  }));
}
