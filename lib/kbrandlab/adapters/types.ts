// lib/kbrandlab/adapters/types.ts
// K-Brand Lab 공급자 어댑터 추상화 인터페이스 (§8.2, §8.3, FR-11)

export interface AdapterConfig {
  apiKey?: string;
  model: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  searchGrounding?: boolean;
}

export interface GroundingChunk {
  uri?: string;
  title?: string;
}

export interface RawAttemptResult {
  modelReturned: string;
  latencyMs: number;
  costUsd: number;
  rawResponse: string;
  rawResponseHash: string;
  errorCode?: string;
  errorMessage?: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: GroundingChunk[];
  };
  citedUrls: string[];
  sentAt: string;
}

export interface ProviderAdapter {
  readonly providerId: string;
  readonly modelId: string;
  readonly isVerified: boolean;
  execute(prompt: string, config?: Partial<AdapterConfig>): Promise<RawAttemptResult>;
}
