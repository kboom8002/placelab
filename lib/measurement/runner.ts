// lib/measurement/runner.ts
// 통합 측정 러너 — 4칸 파이프라인(수집 → 추출 → 판정 → 격자/산출물) 오케스트레이터 (§8.2, INV-3, INV-7)

import type {
  Question,
  ResponseRecord,
  Observation,
  Verdict,
  Output,
  PublicationChannel,
  AgencyEntry,
} from '@/lib/types/measurement-spec';
import { findAgencyByHandle, findAgencyByDisplay } from './registries';
import { getCoreCommonQuestions } from './questions';
import { getMeasurementAdapter, collectWithAdapter } from './provider-bridge';
import { extractObservation } from './extractor';
import { verifyObservation } from './verifier';
import { buildGrid } from './grid-analyzer';
import { buildOutput } from './output-generator';
import {
  loadGroundTruth,
  adaptGroundTruthForStatedValue,
  GroundTruthLoadResult,
} from './ground-truth-loader';
import {
  ProviderMeasurementSummary,
  renderVIPReportText,
  renderTechnicalReportText,
} from './report-renderer';

export interface ProgressEvent {
  phase: 'init' | 'collecting' | 'extracting' | 'verifying' | 'gridding' | 'outputting' | 'reporting' | 'done';
  provider: 'gemini' | 'openai';
  currentQuestionIndex: number;
  totalQuestions: number;
  currentAttempt: number;
  totalAttempts: number;
  questionId?: string;
  questionText?: string;
  verdictResult?: 'match' | 'mismatch' | 'not_confirmed';
  detail?: string;
}

export interface RunnerConfig {
  agencyKey: string; // 'AG-0076' 또는 '수원시' 또는 'lg-41110'
  providers: ('gemini' | 'openai')[];
  models?: Record<string, string>; // { gemini?: 'gemini-2.5-flash', openai?: 'gpt-5.6-luna' }
  questionSet?: 'core' | 'custom';
  customQuestions?: Question[];
  groundTruthPath?: string;
  repetitions?: number; // 기본 3
  channel?: PublicationChannel; // 기본 'agency_notice'
  simulation?: boolean; // 모의 실행 여부
  onProgress?: (event: ProgressEvent) => void;
}

export interface MeasurementRunnerResult {
  agency: {
    handle: string;
    display: string;
    type: string;
    upper_tier?: string;
  };
  providers: string[];
  summaries: ProviderMeasurementSummary[];
  vipReport: string;
  technicalReport: string;
  totalApiCalls: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

/**
 * 측정 실행 메인 함수
 */
export async function runMeasurement(
  config: RunnerConfig
): Promise<MeasurementRunnerResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const repetitions = config.repetitions || 3;
  const channel = config.channel || 'agency_notice';
  const providers: ('gemini' | 'openai')[] =
    config.providers && config.providers.length > 0 ? config.providers : ['gemini'];

  // 1. 기관 식별
  let agency = findAgencyByHandle(config.agencyKey) || findAgencyByDisplay(config.agencyKey);
  if (!agency) {
    // 식별되지 않은 경우 기본 엔트리 생성 (예: 서귀포시 등 행정시)
    agency = {
      handle: config.agencyKey.startsWith('AG-') ? config.agencyKey : `AG-${Math.floor(Math.random() * 9000 + 1000)}`,
      display: config.agencyKey,
      type: '시',
      upper_tier: '해당 광역지자체',
    };
  }

  // 2. 문항 로드
  const questions: Question[] =
    config.customQuestions && config.customQuestions.length > 0
      ? config.customQuestions
      : getCoreCommonQuestions();

  // 3. 사실 원장(Ground Truth) 로드
  const gtResult: GroundTruthLoadResult = loadGroundTruth(
    agency.handle,
    config.groundTruthPath
  );

  const summaries: ProviderMeasurementSummary[] = [];
  let totalApiCalls = 0;

  // .env.local 자동 로드 (독립 실행/CLI/스크립트 환경 지원)
  const envPath = require('path').resolve(process.cwd(), '.env.local');
  if (require('fs').existsSync(envPath)) {
    try {
      const envContent = require('fs').readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0 && !process.env[key.trim()]) {
            process.env[key.trim()] = vals.join('=').trim();
          }
        }
      }
    } catch {}
  }

  // 4. 모델별 파이프라인 순차 실행
  for (const provider of providers) {
    const modelId =
      config.models?.[provider] ||
      (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-5.6-luna');

    const runProfileId =
      provider === 'gemini'
        ? modelId.includes('lite')
          ? 'RP-2026Q3-GEMINI-LITE'
          : 'RP-2026Q3-GEMINI-FLASH'
        : 'RP-2026Q3-A';

    // 시뮬레이션이 아닐 때만 실제 어댑터 생성
    const adapter = !config.simulation
      ? getMeasurementAdapter(provider as 'gemini' | 'openai', modelId)
      : null;

    const providerObservations: Observation[] = [];
    const providerVerdicts: Verdict[] = [];

    config.onProgress?.({
      phase: 'init',
      provider,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      currentAttempt: 0,
      totalAttempts: repetitions,
      detail: `${provider.toUpperCase()} (${modelId}) 측정 시작`,
    });

    // 각 질문별 수집, 추출, 판정
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const records: ResponseRecord[] = [];

      // 반복 회차 수집
      for (let attempt = 1; attempt <= repetitions; attempt++) {
        config.onProgress?.({
          phase: 'collecting',
          provider,
          currentQuestionIndex: qIdx + 1,
          totalQuestions: questions.length,
          currentAttempt: attempt,
          totalAttempts: repetitions,
          questionId: q.id,
          questionText: q.text,
          detail: `[${qIdx + 1}/${questions.length}] ${q.id} 회차 ${attempt} 수집 중...`,
        });

        if (config.simulation) {
          // 시뮬레이션 모의 레코드
          records.push({
            response_id: `RSP-SIM-${q.id}-${attempt}`,
            question_id: q.id,
            agency_handle: agency.handle,
            run_profile_id: runProfileId,
            attempt,
            observed_at: new Date().toISOString(),
            outcome: 'answered',
            raw_text: `[모의 응답] ${agency.display}의 ${q.text}에 관한 공식 안내입니다.`,
            body_urls: ['https://www.example.go.kr/info'],
            citation_urls: ['https://www.example.go.kr'],
          });
        } else {
          // 실제 API 호출
          const record = await collectWithAdapter({
            adapter: adapter!,
            question: q,
            agencyHandle: agency.handle,
            agencyName: agency.display,
            attempt,
            runProfileId,
          });
          records.push(record);
          totalApiCalls++;

          // API 레이트 리밋 완화용 최소 딜레이 (INV-5: 200ms)
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      // Stage 2: 추출
      config.onProgress?.({
        phase: 'extracting',
        provider,
        currentQuestionIndex: qIdx + 1,
        totalQuestions: questions.length,
        currentAttempt: repetitions,
        totalAttempts: repetitions,
        questionId: q.id,
        detail: `[${qIdx + 1}/${questions.length}] ${q.id} 사실 추출 중...`,
      });

      const now = new Date().toISOString();
      const obs = await extractObservation({
        question: q,
        agencyHandle: agency.handle,
        runProfileId,
        windowStart: startedAt,
        windowEnd: now,
        responseRecords: records,
      });
      providerObservations.push(obs);

      // Stage 3: 판정 (judged_by: 'rule' 강제)
      const gtItem = gtResult.items.get(q.id);
      const adaptedGt = gtItem
        ? adaptGroundTruthForStatedValue(gtItem, obs.extracted.stated_value || '')
        : undefined;

      const verdict = verifyObservation({
        question: q,
        observation: obs,
        groundTruth: adaptedGt,
      });
      providerVerdicts.push(verdict);

      config.onProgress?.({
        phase: 'verifying',
        provider,
        currentQuestionIndex: qIdx + 1,
        totalQuestions: questions.length,
        currentAttempt: repetitions,
        totalAttempts: repetitions,
        questionId: q.id,
        verdictResult: verdict.result,
        detail: `[${qIdx + 1}/${questions.length}] ${q.id} 판정 완료: ${verdict.result}`,
      });
    }

    // Stage 4: 격자 및 산출물 조립
    config.onProgress?.({
      phase: 'gridding',
      provider,
      currentQuestionIndex: questions.length,
      totalQuestions: questions.length,
      currentAttempt: repetitions,
      totalAttempts: repetitions,
      detail: `${provider.toUpperCase()} 격자 분석 및 정본 부재 판정 중...`,
    });

    const now = new Date().toISOString();
    const grid = buildGrid({
      agencyHandle: agency.handle,
      windowStart: startedAt,
      windowEnd: now,
      questions,
    });

    config.onProgress?.({
      phase: 'outputting',
      provider,
      currentQuestionIndex: questions.length,
      totalQuestions: questions.length,
      currentAttempt: repetitions,
      totalAttempts: repetitions,
      detail: `${provider.toUpperCase()} 5대 절 공식 산출물 조립 중...`,
    });

    const output = buildOutput({
      channel,
      agencyHandle: agency.handle,
      runProfileId,
      observedStart: startedAt,
      observedEnd: now,
      ledgerAsOf: startedAt.slice(0, 10),
      grid,
      verdicts: providerVerdicts,
      observations: providerObservations,
      peerGroupBand: 'BAND-B',
      peerGroupId: `PG-${agency.handle}`,
    });

    // 통계 계산
    const matchCount = providerVerdicts.filter((v) => v.result === 'match').length;
    const mismatchCount = providerVerdicts.filter((v) => v.result === 'mismatch').length;
    const notConfirmedCount = providerVerdicts.filter((v) => v.result === 'not_confirmed').length;
    const publicCitations = providerObservations.filter((o) => o.extracted.public_source_present).length;
    const publicRate = Math.round((publicCitations / (providerObservations.length || 1)) * 100);
    const accuracyRate = Math.round((matchCount / (questions.length || 1)) * 100);

    summaries.push({
      provider,
      modelId,
      totalQuestions: questions.length,
      totalAttempts: questions.length * repetitions,
      matchCount,
      mismatchCount,
      notConfirmedCount,
      publicSourceRate: publicRate,
      accuracyRate,
      output,
      verdicts: providerVerdicts,
      observations: providerObservations,
    });
  }

  // 5. 보고서 생성
  config.onProgress?.({
    phase: 'reporting',
    provider: providers[0],
    currentQuestionIndex: questions.length,
    totalQuestions: questions.length,
    currentAttempt: repetitions,
    totalAttempts: repetitions,
    detail: 'VIP 경영진 보고서 및 기술 보고서 렌더링 중...',
  });

  const agencySummary = {
    handle: agency.handle,
    display: agency.display,
    type: agency.type,
    upper_tier: agency.upper_tier,
  };

  const vipReport = renderVIPReportText({
    agency: agencySummary,
    summaries,
    questions,
  });

  const technicalReport = renderTechnicalReportText({
    agency: agencySummary,
    summaries,
    questions,
  });

  config.onProgress?.({
    phase: 'done',
    provider: providers[0],
    currentQuestionIndex: questions.length,
    totalQuestions: questions.length,
    currentAttempt: repetitions,
    totalAttempts: repetitions,
    detail: '모든 측정 및 보고서 생성이 완료되었습니다.',
  });

  const completedAt = new Date().toISOString();

  return {
    agency: agencySummary,
    providers,
    summaries,
    vipReport,
    technicalReport,
    totalApiCalls,
    durationMs: Date.now() - startTime,
    startedAt,
    completedAt,
  };
}
