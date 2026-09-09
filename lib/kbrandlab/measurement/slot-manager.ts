// lib/kbrandlab/measurement/slot-manager.ts
// K-Brand Lab 슬롯·시도 분리 및 비용 한도 통제 엔진 (§8.4, §8.9, NFR-05, INV-09, AC-16, AC-28)

import { ProviderAdapter } from '../adapters/types';
import { CaptureStatus, ResponseSemantic } from '../types';

export interface SlotPlanConfig {
  runId: string;
  probeIds: string[];
  languages: ('ko' | 'en')[];
  providers: { provider: 'openai' | 'gemini'; model: string; searchGrounding: boolean }[];
  reps: number;
  timepoint: string;
  budgetLimitUsd: number;
}

export interface SlotExecutionState {
  slotId: string;
  runId: string;
  probeId: string;
  language: 'ko' | 'en';
  provider: string;
  model: string;
  searchGrounding: boolean;
  rep: number;
  captureStatus: CaptureStatus;
  started: boolean;
  attemptsCount: number;
  finalAttempt?: {
    attemptNumber: number;
    rawResponse: string;
    rawResponseHash: string;
    latencyMs: number;
    costUsd: number;
    citedUrls: string[];
    errorCode?: string;
  };
}

export class SlotManager {
  /**
   * 측정 계획으로부터 모든 논리적 관찰 슬롯 생성 (§8.4)
   * 계획 슬롯 수 = 질문 수 × 언어 수 × 환경 수 × 반복 수
   */
  static generateSlots(config: SlotPlanConfig): SlotExecutionState[] {
    const slots: SlotExecutionState[] = [];
    let seq = 1;

    for (const probeId of config.probeIds) {
      for (const lang of config.languages) {
        for (const env of config.providers) {
          for (let rep = 1; rep <= config.reps; rep++) {
            slots.push({
              slotId: `slot-${config.runId}-${seq++}`,
              runId: config.runId,
              probeId,
              language: lang,
              provider: env.provider,
              model: env.model,
              searchGrounding: env.searchGrounding,
              rep,
              captureStatus: 'unattempted',
              started: false,
              attemptsCount: 0,
            });
          }
        }
      }
    }

    return slots;
  }

  /**
   * 단일 슬롯 실행 (최대 2회 자동 재시도, 거절/미언급은 성공으로 처리하여 재시도 금지, AC-17)
   */
  static async executeSlot(
    slot: SlotExecutionState,
    prompt: string,
    adapter: ProviderAdapter,
    costTracker: { currentSpendUsd: number; budgetLimitUsd: number; addCost: (c: number) => void }
  ): Promise<SlotExecutionState> {
    const MAX_RETRIES = 2;
    slot.started = true;

    for (let attemptNum = 1; attemptNum <= 1 + MAX_RETRIES; attemptNum++) {
      // 비용 한도 도달 확인 (AC-28, NFR-05)
      const estimatedCost = 0.0001; // 안전 마진
      if (costTracker.currentSpendUsd + estimatedCost > costTracker.budgetLimitUsd) {
        slot.captureStatus = 'cancelled';
        return slot;
      }

      slot.attemptsCount++;
      const result = await adapter.execute(prompt, {
        model: slot.model,
        searchGrounding: slot.searchGrounding,
      });

      costTracker.addCost(result.costUsd);

      if (result.errorCode) {
        // 일시적 오류(500, 429 등)일 때만 재시도
        slot.finalAttempt = {
          attemptNumber: attemptNum,
          rawResponse: '',
          rawResponseHash: '',
          latencyMs: result.latencyMs,
          costUsd: result.costUsd,
          citedUrls: [],
          errorCode: result.errorCode,
        };

        if (attemptNum <= MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * attemptNum));
          continue;
        } else {
          slot.captureStatus = 'technical_failed';
          return slot;
        }
      }

      // 정상 수집 성공 (답변이 불만족스럽거나 브랜드가 없어도 재시도 금지! AC-17)
      slot.captureStatus = 'captured';
      slot.finalAttempt = {
        attemptNumber: attemptNum,
        rawResponse: result.rawResponse,
        rawResponseHash: result.rawResponseHash,
        latencyMs: result.latencyMs,
        costUsd: result.costUsd,
        citedUrls: result.citedUrls,
      };
      return slot;
    }

    return slot;
  }
}
