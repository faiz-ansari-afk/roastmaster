/**
 * src/lib/langchain/config.ts
 * Isolated configuration and factory utilities for LangChain.js.
 * Ensures zero interference with existing RoastMaster AI pipelines.
 */
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export interface LangChainConfig {
  geminiApiKey: string;
  chatModelName: string;
  embeddingModelName: string;
  embeddingDimension: number;
  databaseUrl?: string;
}

/**
 * Validates and retrieves environment configurations for LangChain execution.
 */
export function getLangChainConfig(): LangChainConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error(
      "[LangChain Config] Missing GEMINI_API_KEY in environment variables. Please check your .env file."
    );
  }

  const chatModelName = process.env.LANGCHAIN_CHAT_MODEL || "gemini-2.5-flash-lite";
  const embeddingModelName = process.env.LANGCHAIN_EMBEDDING_MODEL || "gemini-embedding-001";
  const embeddingDimension = parseInt(process.env.EMBEDDING_DIMENSION || "768", 10);
  const databaseUrl = process.env.DATABASE_URL;

  return {
    geminiApiKey,
    chatModelName,
    embeddingModelName,
    embeddingDimension,
    databaseUrl,
  };
}

/**
 * Factory for creating a configured ChatGoogleGenerativeAI instance.
 * @param temperature Sampling temperature (0.0 = deterministic, 1.0 = creative)
 */
export function createChatModel(temperature: number = 0.7): ChatGoogleGenerativeAI {
  const config = getLangChainConfig();
  return new ChatGoogleGenerativeAI({
    model: config.chatModelName,
    apiKey: config.geminiApiKey,
    temperature,
  });
}

/**
 * Factory for creating a configured GoogleGenerativeAIEmbeddings instance.
 * Explicitly sets outputDimensionality to match the pgvector 768-dim schema.
 */
export function createEmbeddings(): GoogleGenerativeAIEmbeddings {
  const config = getLangChainConfig();
  return new GoogleGenerativeAIEmbeddings({
    model: config.embeddingModelName,
    apiKey: config.geminiApiKey,
    outputDimensionality: config.embeddingDimension,
  });
}
