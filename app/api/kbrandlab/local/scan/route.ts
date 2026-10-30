// app/api/kbrandlab/local/scan/route.ts
// 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 코호트 조회 및 스캔 API
// 근거: ADR-0025, PRD FR-93 ~ FR-96, INV-3 (점수 정렬 거부), INV-6 (원문 대신 해시)

import { NextRequest, NextResponse } from 'next/server';
import {
  buildNamedShopCohortTable,
  evaluateShopAllFacts,
  evaluateShopFact,
  extractNamedShopsFromDiscoveryResponse,
  HIGH_RISK_FACT_DEFINITIONS,
  LOCAL_COHORTS,
  LOCAL_DISCOVERY_PROBES,
  LOCAL_RADAR_BRAND_NAME,
  LOCAL_RADAR_METHOD_VERSION,
  LOCAL_RADAR_SUBTITLE,
  LOCAL_SHOPS,
  type LocalCohortId,
} from '@/lib/kbrandlab/local';

const VALID_COHORTS = new Set<LocalCohortId>([
  'SEOGWIPO_STAY',
  'GANGNAM_SMB',
  'EUNPYEONG_LOCAL',
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cohortParam = (searchParams.get('cohortId') ?? 'SEOGWIPO_STAY') as LocalCohortId;
  const sortBy = searchParams.get('sortBy') ?? 'name';

  if (!VALID_COHORTS.has(cohortParam)) {
    return NextResponse.json(
      { error: `지원하지 않는 상권 코호트입니다: ${cohortParam}` },
      { status: 400 },
    );
  }

  try {
    const cohort = LOCAL_COHORTS[cohortParam];
    const namedShopRows = buildNamedShopCohortTable({
      cohortId: cohortParam,
      sortBy,
    });
    const discoveryProbes = LOCAL_DISCOVERY_PROBES.filter(
      (p) => p.cohortId === cohortParam,
    );
    const shopsWithFacts = LOCAL_SHOPS.filter((s) => s.cohortId === cohortParam).map(
      (shop) => ({
        shopId: shop.shopId,
        shopCode: shop.shopCode,
        shopName: shop.shopName,
        category: shop.category,
        neighborhood: shop.neighborhood,
        canonicalDomain: shop.canonicalDomain,
        placeUrl: shop.placeUrl,
        bookingUrl: shop.bookingUrl,
        isMedicalRegulated: shop.isMedicalRegulated,
        evaluations: evaluateShopAllFacts(shop),
      }),
    );

    return NextResponse.json({
      brand: LOCAL_RADAR_BRAND_NAME,
      subtitle: LOCAL_RADAR_SUBTITLE,
      methodVersion: LOCAL_RADAR_METHOD_VERSION,
      measuredOn: '2026-10-17',
      cohort,
      namedShopRows,
      discoveryProbes,
      shopsWithFacts,
      highRiskFactDefinitions: HIGH_RISK_FACT_DEFINITIONS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body?.mode;

    if (mode === 'discovery_scan') {
      const cohortId = body?.cohortId as LocalCohortId;
      if (!VALID_COHORTS.has(cohortId)) {
        return NextResponse.json(
          { error: '유효한 cohortId(SEOGWIPO_STAY | GANGNAM_SMB | EUNPYEONG_LOCAL)가 필요합니다.' },
          { status: 400 },
        );
      }
      const responseText = String(body?.responseText ?? '');
      const searchUrls = Array.isArray(body?.searchUrls) ? body.searchUrls.map(String) : [];
      const citedUrls = Array.isArray(body?.citedUrls) ? body.citedUrls.map(String) : [];

      const matches = extractNamedShopsFromDiscoveryResponse({
        cohortId,
        responseText,
        searchUrls,
        citedUrls,
      });

      return NextResponse.json({
        brand: LOCAL_RADAR_BRAND_NAME,
        methodVersion: LOCAL_RADAR_METHOD_VERSION,
        cohortId,
        matches,
      });
    }

    if (mode === 'fact_check_preview') {
      const shopId = String(body?.shopId ?? 'shop-sgw-01');
      const shop = LOCAL_SHOPS.find((s) => s.shopId === shopId) ?? LOCAL_SHOPS[0];
      const fact = shop.facts[0];
      const responseText = String(body?.responseText ?? '');
      const searchUrls = Array.isArray(body?.searchUrls) ? body.searchUrls.map(String) : [];
      const citedUrls = Array.isArray(body?.citedUrls) ? body.citedUrls.map(String) : [];

      const evaluation = evaluateShopFact({
        shop,
        fact,
        responseText,
        searchUrls,
        citedUrls,
      });

      return NextResponse.json({
        brand: LOCAL_RADAR_BRAND_NAME,
        methodVersion: LOCAL_RADAR_METHOD_VERSION,
        evaluation,
      });
    }

    return NextResponse.json(
      { error: '지원하지 않는 mode 입니다 (discovery_scan | fact_check_preview)' },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '잘못된 요청 형식입니다.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
