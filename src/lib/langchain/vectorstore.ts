/**
 * src/lib/langchain/vectorstore.ts
 * Isolated PostgreSQL + pgvector VectorStore integration using LangChain.js.
 * 
 * Features:
 * 1. Configuration-aware multi-instance cache (handles distinct collections/tables safely).
 * 2. Strict tenant-level authorization and filtering.
 * 3. Unambiguous score semantics (returns both raw distance and normalized similarity).
 * 4. Configurable, latency-monitored batch ingestion.
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
  distanceStrategy?: "cosine" | "innerProduct" | "euclidean";
}

export interface IngestionOptions {
  batchSize?: number;
  logProgress?: boolean;
}

export interface IngestionResult {
  insertedCount: number;
  batchCount: number;
  totalDurationMs: number;
  averageBatchMs: number;
}

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(`[Tenant Isolation Violation] ${message}`);
    this.name = "TenantIsolationError";
  }
}

export interface SearchOptions {
  k?: number;
  tenantId?: string;
  documentId?: string;
  enforceTenantIsolation?: boolean; // Defaults to true in multi-tenant environments
  filter?: Record<string, any>;
}

export interface SearchResult {
  document: Document<DocumentMetadata>;
  distance: number;    // Raw pgvector distance (for cosine: 0.0 = identical, 1.0 = orthogonal)
  similarity: number;  // Normalized similarity score (1 - distance)
}

const DEFAULT_TABLE_NAME = "langchain_pdf_vectors";
const DEFAULT_COLLECTION_TABLE = "langchain_pdf_collections";
const DEFAULT_COLLECTION_NAME = "roastmaster_knowledge";

// Configuration-aware vector store cache: keyed by `${tableName}:${collectionTableName}:${collectionName}`
const vectorStorePool = new Map<string, PGVectorStore>();

/**
 * Builds a deterministic cache key from vector store configuration options.
 */
function getStoreCacheKey(options: VectorStoreOptions): string {
  const table = options.tableName || DEFAULT_TABLE_NAME;
  const colTable = options.collectionTableName || DEFAULT_COLLECTION_TABLE;
  const colName = options.collectionName || DEFAULT_COLLECTION_NAME;
  const strategy = options.distanceStrategy || "cosine";
  return `${table}:${colTable}:${colName}:${strategy}`;
}

/**
 * Retrieves or initializes a LangChain PGVectorStore instance.
 * Cache is configuration-aware: requests with different table or collection names
 * receive isolated, correctly configured store instances.
 */
export async function getLangChainVectorStore(
  options: VectorStoreOptions = {}
): Promise<PGVectorStore> {
  const cacheKey = getStoreCacheKey(options);

  if (vectorStorePool.has(cacheKey)) {
    return vectorStorePool.get(cacheKey)!;
  }

  const pool = getDbPool();
  if (!pool) {
    throw new Error(
      "[LangChain VectorStore] DATABASE_URL is not set or database pool could not be initialized."
    );
  }

  const config = getLangChainConfig();
  const embeddings = createEmbeddings();

  const store = await PGVectorStore.initialize(embeddings, {
    pool,
    tableName: options.tableName || DEFAULT_TABLE_NAME,
    collectionTableName: options.collectionTableName || DEFAULT_COLLECTION_TABLE,
    collectionName: options.collectionName || DEFAULT_COLLECTION_NAME,
    dimensions: config.embeddingDimension,
    distanceStrategy: options.distanceStrategy || "cosine",
  });

  vectorStorePool.set(cacheKey, store);
  return store;
}

/**
 * Ingests an array of chunked LangChain Documents into pgvector.
 * Ingestion is batched with configurable size and latency tracking.
 *
 * @param documents - Array of chunked Documents to embed and store
 * @param options - Ingestion options (batchSize, logProgress)
 * @param storeOptions - Target vector store configuration
 * @returns Promise<IngestionResult> Ingestion performance and count metrics
 */
export async function ingestDocumentsToVectorStore(
  documents: Document<DocumentMetadata>[],
  options: IngestionOptions = {},
  storeOptions: VectorStoreOptions = {}
): Promise<IngestionResult> {
  if (!documents || documents.length === 0) {
    return {
      insertedCount: 0,
      batchCount: 0,
      totalDurationMs: 0,
      averageBatchMs: 0,
    };
  }

  // Validate tenantId integrity across all documents to prevent un-tenanted chunks
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const tId = doc.metadata?.tenantId;
    if (!tId || typeof tId !== "string" || tId.trim().length === 0) {
      throw new TenantIsolationError(
        `Cannot ingest document chunk at index ${i}: missing or empty 'tenantId' metadata.`
      );
    }
  }

  const { batchSize = 25, logProgress = true } = options;
  const store = await getLangChainVectorStore(storeOptions);

  const startTime = Date.now();
  let totalInserted = 0;
  let batchCount = 0;
  const batchDurations: number[] = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    batchCount++;
    const bStart = Date.now();

    await store.addDocuments(batch);

    const bDuration = Date.now() - bStart;
    batchDurations.push(bDuration);
    totalInserted += batch.length;

    if (logProgress) {
      console.log(
        `[LangChain VectorStore Ingestion] Batch ${batchCount} (${batch.length} chunks) indexed in ${bDuration}ms`
      );
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const averageBatchMs =
    batchDurations.reduce((acc, d) => acc + d, 0) / (batchDurations.length || 1);

  return {
    insertedCount: totalInserted,
    batchCount,
    totalDurationMs,
    averageBatchMs,
  };
}

/**
 * Performs a vector similarity search with explicit tenant authorization and score metrics.
 * Implements FAIL-CLOSED security: if enforceTenantIsolation is true (default) and tenantId
 * is missing or empty, execution aborts immediately before any database query is issued.
 *
 * @param query - User question or query string
 * @param searchOpts - Options including top-K, tenantId, documentId, enforceTenantIsolation, and raw filter
 * @param storeOpts - Target vector store configuration
 * @returns Promise<SearchResult[]> Array of matching documents with distance and similarity scores
 */
export async function searchSimilarDocuments(
  query: string,
  searchOpts: SearchOptions = {},
  storeOpts: VectorStoreOptions = {}
): Promise<SearchResult[]> {
  const {
    k = 4,
    tenantId,
    documentId,
    enforceTenantIsolation = true,
    filter = {},
  } = searchOpts;

  // Fail-Closed Security Assertion: Reject unpartitioned queries
  if (enforceTenantIsolation) {
    if (!tenantId || typeof tenantId !== "string" || tenantId.trim().length === 0) {
      throw new TenantIsolationError(
        "Multi-tenant vector retrieval requires a valid, non-empty tenantId. Unpartitioned global searches are blocked."
      );
    }
  }

  const store = await getLangChainVectorStore(storeOpts);

  // Construct compound metadata filter
  const effectiveFilter: Record<string, any> = { ...filter };
  if (tenantId) {
    effectiveFilter.tenantId = tenantId.trim();
  }
  if (documentId) {
    effectiveFilter.documentId = documentId.trim();
  }

  const hasFilter = Object.keys(effectiveFilter).length > 0;
  const rawResults = await store.similaritySearchWithScore(
    query,
    k,
    hasFilter ? effectiveFilter : undefined
  );

  return rawResults.map(([doc, distanceScore]) => {
    // For cosine distance: distance = 1 - cosine_similarity
    // Clamp similarity between 0.0 and 1.0 for safety
    const normalizedSimilarity = Math.max(0, Math.min(1, 1 - distanceScore));

    return {
      document: doc as Document<DocumentMetadata>,
      distance: distanceScore,
      similarity: Number(normalizedSimilarity.toFixed(4)),
    };
  });
}
