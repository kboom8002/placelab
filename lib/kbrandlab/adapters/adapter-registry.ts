// lib/kbrandlab/adapters/adapter-registry.ts
// 공급자 어댑터 등록소 및 검수 관리 (§8.2, §17.1)

import { ProviderAdapter } from './types';
import { GeminiSearchGroundingAdapter } from './gemini-sg';
import { OpenAIAdapter } from './openai';

export class AdapterRegistry {
  private static adapters: Map<string, ProviderAdapter> = new Map();

  static getAdapter(provider: 'gemini' | 'openai', model?: string): ProviderAdapter {
    const key = `${provider}:${model || 'default'}`;
    if (!this.adapters.has(key)) {
      if (provider === 'gemini') {
        this.adapters.set(key, new GeminiSearchGroundingAdapter(undefined, model || 'gemini-3.5-flash-lite'));
      } else if (provider === 'openai') {
        this.adapters.set(key, new OpenAIAdapter(undefined, model || 'gpt-5.6-luna'));
      } else {
        throw new Error(`미지원 공급자입니다: ${provider}`);
      }
    }
    return this.adapters.get(key)!;
  }

  static getVerifiedProviders(): string[] {
    return ['gemini:gemini-3.5-flash-lite', 'openai:gpt-5.6-luna'];
  }
}
