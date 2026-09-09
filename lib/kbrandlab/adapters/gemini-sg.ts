// lib/kbrandlab/adapters/gemini-sg.ts
// Google Gemini + Search Grounding 공급자 어댑터 (FR-11)

import { GoogleGenAI } from '@google/genai';
import * as crypto from 'crypto';
import { ProviderAdapter, AdapterConfig, RawAttemptResult } from './types';

export class GeminiSearchGroundingAdapter implements ProviderAdapter {
  readonly providerId = 'gemini';
  readonly modelId: string;
  readonly isVerified = true;
  private client: GoogleGenAI;
  private defaultInstruction =
    '당신은 한국 브랜드 및 제품 전문 분석가입니다. 질문에 대해 최신 검색 결과를 바탕으로 객관적 사실과 출처를 명시하여 답하세요.';

  constructor(apiKey?: string, modelId: string = 'gemini-3.5-flash-lite') {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.modelId = modelId;
  }

  async execute(prompt: string, config?: Partial<AdapterConfig>): Promise<RawAttemptResult> {
    const start = Date.now();
    const model = config?.model || this.modelId;
    const searchGrounding = config?.searchGrounding ?? true;
    const systemInstruction = config?.systemInstruction || this.defaultInstruction;
    const maxOutputTokens = config?.maxOutputTokens || 1000;

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          maxOutputTokens,
          ...(searchGrounding ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });

      const elapsed = Date.now() - start;
      const text = response.text || '';
      const textUrls = text.match(/https?:\/\/[^\s)]+/g) || [];

      const gm = (response as any).candidates?.[0]?.groundingMetadata || null;
      const chunks = (gm?.groundingChunks || []).map((c: any) => ({
        uri: c.web?.uri,
        title: c.web?.title,
      }));
      const chunkUrls = chunks.filter((c: any) => c.uri).map((c: any) => c.uri as string);
      const searchQueries = gm?.webSearchQueries || [];
      const allUrls = Array.from(new Set([...textUrls, ...chunkUrls]));
      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

      // 대략적 비용 추산 (gemini-3.5-flash-lite: $0.075 / 1M input, $0.30 / 1M output, search grounding: ~$0.035 / 1k queries)
      const costUsd = 0.00005 + (searchGrounding ? 0.000035 : 0);

      return {
        modelReturned: model,
        latencyMs: elapsed,
        costUsd,
        rawResponse: text,
        rawResponseHash: hash,
        groundingMetadata: {
          webSearchQueries: searchQueries,
          groundingChunks: chunks,
        },
        citedUrls: allUrls,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      const elapsed = Date.now() - start;
      return {
        modelReturned: model,
        latencyMs: elapsed,
        costUsd: 0,
        rawResponse: '',
        rawResponseHash: '',
        errorCode: err.status ? String(err.status) : 'UNKNOWN_ERROR',
        errorMessage: err.message,
        citedUrls: [],
        sentAt: new Date().toISOString(),
      };
    }
  }
}
