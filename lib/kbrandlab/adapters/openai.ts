// lib/kbrandlab/adapters/openai.ts
// OpenAI 공급자 어댑터 (FR-11)

import OpenAI from 'openai';
import * as crypto from 'crypto';
import { ProviderAdapter, AdapterConfig, RawAttemptResult } from './types';

export class OpenAIAdapter implements ProviderAdapter {
  readonly providerId = 'openai';
  readonly modelId: string;
  readonly isVerified = true;
  private client: OpenAI;
  private defaultInstruction =
    '당신은 한국 브랜드 및 제품 전문 분석가입니다. 질문에 대해 객관적 사실과 공식 정보를 바탕으로 간결하게 3~5문장으로 답하세요.';

  constructor(apiKey?: string, modelId: string = 'gpt-5.6-luna') {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    this.client = new OpenAI({ apiKey: key });
    this.modelId = modelId;
  }

  async execute(prompt: string, config?: Partial<AdapterConfig>): Promise<RawAttemptResult> {
    const start = Date.now();
    const model = config?.model || this.modelId;
    const systemInstruction = config?.systemInstruction || this.defaultInstruction;
    const maxTokens = config?.maxOutputTokens || 800;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        max_completion_tokens: maxTokens,
      });

      const elapsed = Date.now() - start;
      const text = response.choices[0]?.message?.content || '';
      const textUrls = text.match(/https?:\/\/[^\s)]+/g) || [];
      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

      // 대략적 비용 계산
      const usage = response.usage;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const costUsd = (promptTokens * 0.0000025) + (completionTokens * 0.00001);

      return {
        modelReturned: response.model || model,
        latencyMs: elapsed,
        costUsd,
        rawResponse: text,
        rawResponseHash: hash,
        citedUrls: Array.from(new Set(textUrls)),
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
