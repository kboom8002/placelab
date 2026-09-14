// app/api/measure/spec/route.ts
// 신규 measurement-spec 4칸 엔진 연동 API
// 기존 레거시 /api/measure/start와 병행 배치
// 파이프라인: collector → extractor → verifier → grid-analyzer → output-generator
//
// INV-7: 측정 조건 없는 관측 불가 — run_profile_id 필수
// judged_by: 'rule' 강제 (spec/04_판정_규칙.md)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCoreCommonQuestions } from '@/lib/measurement/questions';
import {
  findAgencyByHandle,
  getRunProfileRegistry,
} from '@/lib/measurement/registries';
import { collectSingleResponse, extractBodyUrls } from '@/lib/measurement/collector';
import { extractObservation } from '@/lib/measurement/extractor';
import { verifyObservation, type GroundTruthItem } from '@/lib/measurement/verifier';
import { buildGrid } from '@/lib/measurement/grid-analyzer';
import { buildOutput, type BuildOutputOptions } from '@/lib/measurement/output-generator';
import { populationBand, peerGroup, bandOf } from '@/lib/measurement/sealed-bridge';
import type { ResponseRecord, Question, Observation, Verdict } from '@/lib/types/measurement-spec';

const SpecMeasureSchema = z.object({
  agency_handle: z.string().min(1),
  run_profile_id: z.string().min(1),
  channel: z.enum(['national_report', 'agency_notice', 'anonymized_dataset']).default('agency_notice'),
  ledger_as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notified_at: z.string().optional(),
  review_closed_at: z.string().optional(),
  /** 시뮬레이션 모드: API 키 없이 규격 검증만 수행 */
  simulation: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SpecMeasureSchema.parse(body);

    // 1. 등록부에서 기관 및 프로필 확인
    const agency = findAgencyByHandle(parsed.agency_handle);
    if (!agency) {
      return NextResponse.json(
        { error: '등록부에 없는 기관 손잡이입니다', agency_handle: parsed.agency_handle },
        { status: 404 }
      );
    }

    const profileRegistry = getRunProfileRegistry();
    const profile = profileRegistry.profiles.find(
      (p) => p.run_profile_id === parsed.run_profile_id
    );
    if (!profile) {
      return NextResponse.json(
        { error: '등록부에 없는 관측 프로필입니다', run_profile_id: parsed.run_profile_id },
        { status: 404 }
      );
    }

    // 2. SSOT 문항 로드
    const questions = getCoreCommonQuestions();
    const windowNow = new Date().toISOString();

    // 3. 시뮬레이션 모드 — 규격 구조 검증만 수행
    if (parsed.simulation) {
      const observations: Observation[] = [];
      const verdicts: Verdict[] = [];

      for (const question of questions.slice(0, 5)) {
        // 시뮬레이션 응답 레코드
        const mockRecord: ResponseRecord = {
          response_id: `RSP-SIM-${question.id}`,
          question_id: question.id,
          agency_handle: agency.handle,
          run_profile_id: profile.run_profile_id,
          attempt: 1,
          observed_at: windowNow,
          outcome: 'answered',
          raw_text: `[시뮬레이션] ${question.text}에 대한 모의 응답입니다.`,
          body_urls: [],
          citation_urls: [],
        };

        // 추출
        const observation = await extractObservation({
          question,
          agencyHandle: agency.handle,
          runProfileId: profile.run_profile_id,
          windowStart: windowNow,
          windowEnd: windowNow,
          responseRecords: [mockRecord],
        });
        observations.push(observation);

        // 판정 (원장 없이 C0)
        const verdict = verifyObservation({
          question,
          observation,
          referenceDate: parsed.ledger_as_of,
        });
        verdicts.push(verdict);
      }

      // 격자
      const grid = buildGrid({
        questions: questions.slice(0, 5),
        agencyHandle: agency.handle,
        windowStart: windowNow,
        windowEnd: windowNow,
      });

      // 봉인 인터페이스
      const band = populationBand(agency.handle, parsed.ledger_as_of);
      const pg = peerGroup(agency.handle, parsed.ledger_as_of);

      // 산출물 조립
      const outputOptions: BuildOutputOptions = {
        channel: parsed.channel,
        agencyHandle: agency.handle,
        runProfileId: profile.run_profile_id,
        observedStart: windowNow,
        observedEnd: windowNow,
        ledgerAsOf: parsed.ledger_as_of,
        notifiedAt: parsed.notified_at,
        reviewClosedAt: parsed.review_closed_at,
        grid,
        verdicts,
        observations,
        peerGroupBand: band,
        peerGroupId: pg,
      };

      const output = buildOutput(outputOptions);

      return NextResponse.json({
        simulation: true,
        agency: { handle: agency.handle, display: agency.display, type: agency.type },
        profile: { id: profile.run_profile_id, model: profile.model_identifier },
        pipeline_stages: {
          questions_loaded: questions.length,
          observations_created: observations.length,
          verdicts_created: verdicts.length,
          grid_rows: grid.rows.length,
          canon_absent_count: grid.rows.filter((r) => r.row_verdict === 'canon_absent').length,
        },
        output,
        method_version: 'spec-v1.0',
        measured_at: windowNow,
      });
    }

    // 4. 실측 모드 (API 키 필요 — 추후 활성화)
    return NextResponse.json({
      error: '실측 모드는 API 키 설정 후 활성화됩니다. simulation: true로 규격 검증을 먼저 수행하세요.',
      required_env: ['OPENAI_API_KEY'],
    }, { status: 501 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
