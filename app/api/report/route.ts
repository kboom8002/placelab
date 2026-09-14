// app/api/report/route.ts
// 시민 제보(Floor Hunter) 접수 및 공개 목록 API (INV-6, INV-7, INV-4)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCitizenReport,
  getAllCitizenReports,
} from '@/lib/crowdsource/report-aggregator';
import {
  evaluatePromotionCandidates,
  queuePromotionCandidate,
} from '@/lib/crowdsource/promotion-engine';

const reportSchema = z.object({
  unitId: z.string().min(1, '대상 지자체는 필수입니다.'),
  promptUsed: z.string().min(3, '프롬프트 내용을 최소 3자 이상 입력해 주세요.'),
  aiResponseSummary: z
    .string()
    .min(5, 'AI 응답 내용을 5자 이상 요약해 주세요.')
    .max(2000, 'AI 응답 요약은 2000자 이하여야 합니다 (INV-6: 원문 전문 게시 금지).'),
  aiService: z.string().min(1, 'AI 서비스명은 필수입니다 (INV-7).'),
  modelVersion: z.string().optional(),
  webSearch: z.boolean({ required_error: '웹 검색 여부는 필수 조건입니다 (INV-7).' }),
  language: z.string().default('ko'),
  measuredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '측정 일자는 YYYY-MM-DD 형식이어야 합니다 (INV-7).'),
  verdictSelf: z.enum(['accurate', 'partial', 'inaccurate', 'absent']),
  syndromeSelf: z
    .enum(['confabulation', 'stale_fact', 'generic_drift', 'cross_unit', 'wrong_number', 'other'])
    .optional(),
  isConfabulation: z.boolean().default(false),
  screenshotUrl: z.string().optional(),
  evidenceNote: z.string().optional(),
  submitterType: z.enum(['resident', 'official', 'researcher', 'press', 'unknown']).default('unknown'),
  anonymous: z.boolean().default(true),
  submitterEmail: z.string().email().optional().or(z.literal('')),
});

/**
 * GET: 공개용 시민 제보 목록 조회 (PII 마스킹 및 승인된 건만 노출)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId') || undefined;

    const reports = await getAllCitizenReports({
      unitId,
      onlyPiiChecked: true,
    });

    // 민감 정보 제거 후 반환
    const publicReports = reports.map((r) => ({
      id: r.id,
      unitId: r.unit_id,
      promptUsed: r.prompt_used,
      aiResponseSummary: r.ai_response_summary,
      aiService: r.ai_service,
      modelVersion: r.model_version,
      webSearch: r.web_search,
      language: r.language,
      measuredOn: r.measured_on,
      verdictSelf: r.verdict_self,
      syndromeSelf: r.syndrome_self,
      isConfabulation: r.is_confabulation,
      screenshotUrl: r.screenshot_url,
      evidenceNote: r.evidence_note,
      status: r.status,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      count: publicReports.length,
      reports: publicReports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: 시민 제보 접수
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값 유효성 검증 실패', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 제보 생성
    const report = await createCitizenReport({
      unitId: data.unitId,
      promptUsed: data.promptUsed,
      aiResponseSummary: data.aiResponseSummary,
      aiService: data.aiService,
      modelVersion: data.modelVersion,
      webSearch: data.webSearch,
      language: data.language,
      measuredOn: data.measuredOn,
      verdictSelf: data.verdictSelf,
      syndromeSelf: data.syndromeSelf,
      isConfabulation: data.isConfabulation,
      screenshotUrl: data.screenshotUrl,
      evidenceNote: data.evidenceNote,
      submitterType: data.submitterType,
      anonymous: data.anonymous,
      submitterEmail: data.submitterEmail,
    });

    // 승격 조건 평가 (비동기 자동 큐잉 검사)
    let autoQualified = false;
    try {
      const candidates = await evaluatePromotionCandidates();
      const match = candidates.find((c) => c.triggerReports.includes(report.id));
      if (match) {
        await queuePromotionCandidate(match);
        autoQualified = true;
      }
    } catch {
      // 자동 큐잉 평가 실패는 제보 등록 자체를 취소하지 않음
    }

    return NextResponse.json({
      success: true,
      message: 'AI 오답 제보가 안전하게 접수되었습니다. 연구 및 검증 프로브로 활용됩니다.',
      reportId: report.id,
      autoQualified,
      status: report.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '제보 접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
