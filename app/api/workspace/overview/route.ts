// app/api/workspace/overview/route.ts
// MAPS 고객사 워크스페이스 스냅샷 조회 및 이원 시간 정본 개정 API
// 근거: ADR-0026, FR-98 ~ FR-102, MAPS-INV-03, MAPS-INV-04

import { NextRequest, NextResponse } from 'next/server';
import {
  appendFactVersionRevision,
  buildMapsWorkspaceSnapshot,
  MAPS_SEED_FACT_VERSIONS,
} from '@/lib/maps/core';

export async function GET(req: NextRequest) {
  const tenantId =
    req.nextUrl.searchParams.get('tenantId') ?? 'ten-seoulmiso';
  const snapshot = buildMapsWorkspaceSnapshot(tenantId);
  return NextResponse.json(snapshot);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: 'append_fact_revision';
      previousFactVersionId?: string;
      newValueNorm?: string | number | boolean;
      newValueRaw?: string;
      effectiveFromIso?: string;
      sourceUrl?: string;
      confirmedBy?: string;
    };

    const prev =
      MAPS_SEED_FACT_VERSIONS.find(
        (f) => f.factVersionId === body.previousFactVersionId
      ) ?? MAPS_SEED_FACT_VERSIONS[1];

    const updatedLedger = appendFactVersionRevision(MAPS_SEED_FACT_VERSIONS, {
      newFactVersionId: `fv-rev-${Date.now()}`,
      previousFact: prev,
      newValueNorm: body.newValueNorm ?? prev.valueNorm,
      newValueRaw: body.newValueRaw ?? prev.valueRaw,
      effectiveFromIso: body.effectiveFromIso ?? '2026-11-01T00:00:00Z',
      recordedAtIso: new Date().toISOString(),
      sourceUrl: body.sourceUrl ?? prev.sourceUrl,
      confirmLevel: 'owner_signed',
      confirmedBy: body.confirmedBy ?? '워크스페이스 담당자',
    });

    return NextResponse.json({
      ok: true,
      appendedCount: updatedLedger.length - MAPS_SEED_FACT_VERSIONS.length,
      latestFact: updatedLedger[updatedLedger.length - 1],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
