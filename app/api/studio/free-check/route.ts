// app/api/studio/free-check/route.ts
// MAPS 스토어프론트 무료 간극 점검 및 A원칙(이해충돌 방지) 적격성 심사 API
// 근거: ADR-0026, FR-97, INV-17, MAPS-INV-17

import { NextRequest, NextResponse } from 'next/server';
import {
  MAPS_NON_GUARANTEE_DISCLAIMER,
  buildMapsWorkspaceSnapshot,
  checkMapsEligibility,
  type MapsOrgType,
} from '@/lib/maps/core';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orgName?: string;
      orgType?: MapsOrgType;
      domain?: string;
      sponsorDisclosure?: string;
    };

    const orgName = (body.orgName ?? '').trim();
    const orgType = body.orgType ?? 'enterprise';
    const domain = (body.domain ?? '').trim();

    if (!orgName || !domain) {
      return NextResponse.json(
        {
          error: '기관/기업명(orgName)과 공식 도메인(domain)을 모두 입력해 주십시오.',
        },
        { status: 400 }
      );
    }

    const eligibility = checkMapsEligibility({
      orgName,
      orgType,
      domain,
      sponsorDisclosure: body.sponsorDisclosure ?? null,
    });

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          eligible: false,
          eligibility,
          nonGuaranteeNotice: MAPS_NON_GUARANTEE_DISCLAIMER,
        },
        { status: 403 }
      );
    }

    const snapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');

    return NextResponse.json({
      eligible: true,
      eligibility,
      preview: {
        orgName,
        domain,
        measuredRoundStamp: snapshot.metrics.measuredRoundStamp,
        metrics: snapshot.metrics,
        sampleJudgments: snapshot.judgments.slice(0, 3),
        topGapTasks: snapshot.gapTasks.slice(0, 2),
      },
      nonGuaranteeNotice: MAPS_NON_GUARANTEE_DISCLAIMER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
