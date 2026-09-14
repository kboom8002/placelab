// lib/measurement/ground-truth-loader.ts
// 지자체별 사실 원장(Ground Truth) 다형식 통합 로더 (§8.2, INV-7)

import fs from 'fs';
import path from 'path';
import type { GroundTruthItem } from './verifier';

export interface GroundTruthLoadResult {
  sourcePath: string | null;
  itemsCount: number;
  items: Map<string, GroundTruthItem>;
  rawEntries?: Record<string, any>;
}

const GT_DIR = path.resolve(process.cwd(), 'docs/ground-truth');

/**
 * 지자체 식별자(코드, 이름 등)를 표준 파일명으로 매핑
 */
function resolveGtFilename(agencyKey: string): string | null {
  const norm = agencyKey.trim().toLowerCase();

  // 수원시
  if (norm.includes('수원') || norm === 'ag-0076' || norm === 'lg-41110') {
    return 'lg-41110-core30.json';
  }
  // 서귀포시
  if (norm.includes('서귀포') || norm === 'ag-50130' || norm === 'seogwipo') {
    return 'seogwipo-development.json';
  }
  // 화성시
  if (norm.includes('화성') || norm === 'ag-0080' || norm === 'lg-41590') {
    return 'lg-41590.json';
  }
  // 증평군
  if (norm.includes('증평') || norm === 'ag-0171' || norm === 'lg-43745') {
    return 'lg-43745.json';
  }
  // 제주도
  if (norm.includes('제주') || norm === 'ag-50000' || norm === 'jeju') {
    return 'jeju.json';
  }

  // 커스텀 GT 파일 존재 확인
  const customFile = `custom-${norm}.json`;
  if (fs.existsSync(path.join(GT_DIR, customFile))) {
    return customFile;
  }

  return null;
}

/**
 * 사실 원장 파일 또는 커스텀 경로에서 GroundTruthItem 맵을 로드
 */
export function loadGroundTruth(
  agencyKey: string,
  customFilePath?: string
): GroundTruthLoadResult {
  const map = new Map<string, GroundTruthItem>();
  const rawEntries: Record<string, any> = {};

  let targetPath = customFilePath;
  if (!targetPath) {
    const filename = resolveGtFilename(agencyKey);
    if (filename) {
      targetPath = path.join(GT_DIR, filename);
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    return {
      sourcePath: null,
      itemsCount: 0,
      items: map,
    };
  }

  try {
    const content = fs.readFileSync(targetPath, 'utf-8');
    const data = JSON.parse(content);
    const ledgerAsOf = data.ledgerAsOf || '2026-09-14';

    // 포맷 1: { entries: { "CORE-001": { targetValue, acceptableVariants, ... } } }
    if (data.entries && typeof data.entries === 'object') {
      for (const [qId, entry] of Object.entries(data.entries)) {
        const e = entry as any;
        const variants: string[] = e.acceptableVariants || [];
        rawEntries[qId] = e;
        map.set(qId, {
          questionId: qId,
          ledgerValue: e.targetValue || null,
          ledgerValueNature: e.valueNature || 'measured',
          ledgerAsOf: e.ledgerAsOf || ledgerAsOf,
          expectedKeywords: variants.length > 0 ? variants : (e.targetValue ? [e.targetValue] : []),
          temporalMarkers: ['2021년', '2020년', '2019년'], // C3 판정용 구시점 마커
        });
      }
    }
    // 포맷 2: 표준 스키마 준수 배열 [ { questionId, value, acceptableVariants }, ... ]
    else if (Array.isArray(data)) {
      for (const item of data) {
        const qId = item.questionId || item.id;
        if (!qId) continue;
        const variants: string[] = item.acceptableVariants || [];
        rawEntries[qId] = item;
        map.set(qId, {
          questionId: qId,
          ledgerValue: String(item.value || ''),
          ledgerValueNature: 'measured',
          ledgerAsOf: item.verifiedAt || ledgerAsOf,
          expectedKeywords: variants.length > 0 ? variants : [String(item.value || '')],
          temporalMarkers: ['2021년', '2020년', '2019년'],
        });
      }
    }
    // 포맷 3: { facts: [ { id, claim, ... } ] } (jeju.json 형식)
    else if (data.facts && Array.isArray(data.facts)) {
      for (const fact of data.facts) {
        const qId = fact.id || fact.questionId;
        if (!qId) continue;
        rawEntries[qId] = fact;
        map.set(qId, {
          questionId: qId,
          ledgerValue: fact.claim || fact.value || null,
          ledgerValueNature: 'measured',
          ledgerAsOf: ledgerAsOf,
          expectedKeywords: fact.keywords || (fact.claim ? [fact.claim] : []),
          temporalMarkers: ['2021년', '2020년', '2019년'],
        });
      }
    }

    return {
      sourcePath: targetPath,
      itemsCount: map.size,
      items: map,
      rawEntries,
    };
  } catch (err) {
    console.error(`[GroundTruthLoader] 원장 파일 로드 실패 (${targetPath}):`, err);
    return {
      sourcePath: targetPath,
      itemsCount: 0,
      items: map,
    };
  }
}

/**
 * Verifier의 `every()` 키워드 매칭 규칙에 맞춰
 * statedValue에 포함된 변형어를 찾아 단일 원소 배열로 정규화한 GroundTruthItem 복사본 반환.
 */
export function adaptGroundTruthForStatedValue(
  gtItem: GroundTruthItem,
  statedValue: string
): GroundTruthItem {
  if (!gtItem.expectedKeywords || gtItem.expectedKeywords.length <= 1) {
    return gtItem;
  }

  const lowerStated = statedValue.toLowerCase();
  // statedValue에 포함된 첫 번째 허용 변형어 탐색
  const matchedVariant = gtItem.expectedKeywords.find((kw) =>
    lowerStated.includes(kw.toLowerCase())
  );

  if (matchedVariant) {
    return {
      ...gtItem,
      expectedKeywords: [matchedVariant],
    };
  }

  // 매칭된 변형어가 없으면 원본 그대로 반환하여 verifier가 mismatch 처리하도록 함
  return gtItem;
}

/**
 * 지자체에 등록된 원장이 존재하는지 확인
 */
export function hasGroundTruth(agencyKey: string): boolean {
  return resolveGtFilename(agencyKey) !== null;
}

/**
 * 웹 UI 또는 관리자 인터페이스에서 입력한 커스텀 Ground Truth를 저장
 */
export async function saveCustomGroundTruth(
  agencyHandle: string,
  entries: Record<string, { targetValue: string; acceptableVariants?: string[] }>
): Promise<string> {
  const norm = agencyHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `custom-${norm}.json`;
  const filePath = path.join(GT_DIR, filename);

  const payload = {
    unitId: agencyHandle,
    ledgerAsOf: new Date().toISOString().slice(0, 10),
    entries,
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  return filePath;
}
