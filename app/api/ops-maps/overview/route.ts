// app/api/ops-maps/overview/route.ts
// MAPS 운영 어드민 콘솔(/ops/maps) 통합 상태 및 리포트 금칙어 발행 게이트 API
// 근거: ADR-0026, ADR-0027, FR-102 ~ FR-106

import { NextRequest, NextResponse } from 'next/server';
import {
  buildMapsWorkspaceSnapshot,
  lintMapsCopy,
  MAPS_SKU_CATALOG,
} from '@/lib/maps/core';

export async function GET() {
  const snapshot = buildMapsWorkspaceSnapshot('ten-seoulmiso');
  return NextResponse.json({
    canaryStatus: snapshot.canaryStatus,
    raterAgreement: snapshot.raterAgreement,
    skuCatalog: MAPS_SKU_CATALOG,
    observationsCount: snapshot.observations.length,
    judgmentsCount: snapshot.judgments.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      reportText?: string;
      isFictionalSample?: boolean;
      isUnconfirmedPricingCopy?: boolean;
      hasValidControlGroup?: boolean;
    };

    const lintResult = lintMapsCopy(body.reportText ?? '', {
      isFictionalSample: body.isFictionalSample,
      isUnconfirmedPricingCopy: body.isUnconfirmedPricingCopy,
      hasValidControlGroup: body.hasValidControlGroup,
    });

    return NextResponse.json({
      publishAllowed: lintResult.passed,
      lintResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lint error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
