// lib/jeongdap/gazetteer-match.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §10 gazetteer-match.ts
// - jeongdap-note-repo-docs-v1.1/measurement/observe_weekly.py L89-130

import { GAZETTEER_CONTEXT_CHARS } from './constants';

export interface GazetteerUnit {
  unitId: string;
  level: '광역' | '기초';
  sido: string;
  name: string;   // 예: "광주광역시 서구" 또는 "인천광역시 제물포구"
  short: string;  // 예: "서구", "제물포구"
  aliases: string[];
  needsContextForShort: boolean; // 동명(중구·서구·동구·남구·북구·강서구·고성군·광주 등) 여부
}

export interface GazetteerMention {
  unitId: string;
  matchedTerm: string;
  position: number;
}

/**
 * 답변 원문에서 지자체 등장을 추출한다.
 * - 긴 이름부터 먼저 매칭한다.
 * - 동명 구·군(중구·서구 등)이나 모호한 짧은 별칭은 앞뒤 20자 이내에 시·도 문맥이 있을 때만 인정한다.
 * - INV-15: 등장 순위나 첫 셋(first_three) 플래그는 공개 타입에 포함하지 않는다.
 */
export function extractGazetteerMentions(
  text: string,
  units: readonly GazetteerUnit[]
): GazetteerMention[] {
  if (!text) return [];

  interface CandidatePattern {
    unitId: string;
    term: string;
    needsContext: boolean;
    sido: string;
  }

  const patterns: CandidatePattern[] = [];
  for (const u of units) {
    patterns.push({ unitId: u.unitId, term: u.name, needsContext: false, sido: u.sido });
    if (u.level === '기초') {
      patterns.push({ unitId: u.unitId, term: `${u.sido} ${u.short}`, needsContext: false, sido: u.sido });
      patterns.push({ unitId: u.unitId, term: `${u.sido}${u.short}`, needsContext: false, sido: u.sido });
      // §10 광주 서구 매칭 결함 수정: sido='전남광주' 인 구(동구·서구·남구·북구·광산구)가 '광주 서구' 등으로 등장할 때 매칭
      if (u.sido === '전남광주' && u.short.endsWith('구')) {
        patterns.push({ unitId: u.unitId, term: `광주광역시 ${u.short}`, needsContext: false, sido: u.sido });
        patterns.push({ unitId: u.unitId, term: `광주 ${u.short}`, needsContext: false, sido: u.sido });
        patterns.push({ unitId: u.unitId, term: `광주${u.short}`, needsContext: false, sido: u.sido });
      }
      patterns.push({
        unitId: u.unitId,
        term: u.short,
        needsContext: u.needsContextForShort,
        sido: u.sido,
      });
    }
    for (const alias of u.aliases) {
      if (alias) {
        patterns.push({
          unitId: u.unitId,
          term: alias,
          needsContext: u.needsContextForShort && alias === u.short,
          sido: u.sido,
        });
      }
    }
  }

  patterns.sort((a, b) => b.term.length - a.term.length);

  const foundByUnit = new Map<string, GazetteerMention>();
  const consumedSpans: Array<[number, number]> = [];

  const overlapsConsumed = (start: number, end: number) =>
    consumedSpans.some(([cs, ce]) => start < ce && end > cs);

  for (const p of patterns) {
    if (!p.term) continue;
    let idx = text.indexOf(p.term);
    while (idx !== -1) {
      const endIdx = idx + p.term.length;
      if (overlapsConsumed(idx, endIdx)) {
        idx = text.indexOf(p.term, endIdx);
        continue;
      }
      if (p.needsContext) {
        const startCtx = Math.max(0, idx - GAZETTEER_CONTEXT_CHARS);
        const contextSlice = text.slice(startCtx, idx);
        const validSidoTokens = p.sido === '전남광주' ? ['전남광주', '광주', '전남'] : [p.sido];
        if (!validSidoTokens.some((tok) => contextSlice.includes(tok))) {
          idx = text.indexOf(p.term, endIdx);
          continue;
        }
      }
      consumedSpans.push([idx, endIdx]);
      if (!foundByUnit.has(p.unitId)) {
        foundByUnit.set(p.unitId, {
          unitId: p.unitId,
          matchedTerm: p.term,
          position: idx,
        });
      }
      break;
    }
  }

  return Array.from(foundByUnit.values()).sort((a, b) => a.position - b.position);
}
