// lib/jeongdap/source-stages.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §3.1, §10 source-stages.ts, page-match.ts, denominator.ts
// - jeongdap-note-repo-docs-v1.1/measurement/judge_auto.py L44-76

import { TOOL_SOURCES_MISSING_HOLD_RATE } from './constants';
import { classifyDomainKind, isOfficialDomain, OfficialDomainRegistryEntry } from './official-domain';
import { AutoStage4Candidate, OfficialDomainKind } from './types';

export interface LedgerEntryForCheck {
  instanceId: string;
  numbers?: string;        // 숫자·날짜 핵심 값
  answerKey?: string;      // 정답 요지 키워드 (; , · 구분)
  supplyGap?: boolean;     // 원장 작성자가 판정한 공급 공백
  notApplicable?: boolean; // 해당 단위에 적용되지 않는 문항 (D101)
  officialUrl1?: string;
  officialUrl2?: string;
}

export interface StageEvaluationInput {
  answerText: string;
  citations: { url: string; title?: string }[];
  toolSources?: { url: string }[]; // web_search_call.action.sources 전체 반환 목록
  domainEntry?: OfficialDomainRegistryEntry;
  ledger?: LedgerEntryForCheck;
}

export interface StageEvaluationResult {
  s1AppearedInSearch: boolean;
  s2CitedByAi: boolean;
  s3FirstCitationOfficial: boolean;
  s4Candidate: AutoStage4Candidate;
  firstCitationKind: OfficialDomainKind | null;
  supplyGap: boolean;
  notApplicable: boolean;
}

function normalizeCompact(text: string): string {
  return (text || '').replace(/[\s,]/g, '');
}

/**
 * 한 자리 숫자('1', '2' 등)는 단위 문맥(원·일·회·명·세·%·층·번·개월·시간 등)이 없을 때
 * 우연 일치로 오판하지 않도록 문맥 패턴으로만 검사한다 (§10 page-match.ts).
 */
export function matchesNumberToken(answer: string, numToken: string): boolean {
  const cleanToken = normalizeCompact(numToken);
  if (!cleanToken) return false;

  if (cleanToken.length === 1 && /^\d$/.test(cleanToken)) {
    const unitRegex = new RegExp(
      `(?:^|[^\\d])${cleanToken}\\s*(?:원|만원|천원|일|영업일|회|건|명|세|살|%|퍼센트|층|번|개월|주|시간|시|분|종|곳)`
    );
    return unitRegex.test(answer);
  }

  return normalizeCompact(answer).includes(cleanToken);
}

export function evaluateContentCandidate(
  answerText: string,
  ledger?: LedgerEntryForCheck
): AutoStage4Candidate {
  if (!ledger) return 'pending';
  if (ledger.notApplicable) return 'not_applicable';
  if (ledger.supplyGap) return 'supply_gap';

  const rawNums = (ledger.numbers || '').match(/\d[\d,./:~\-]*/g) || [];
  const nums = rawNums.map((n) => n.trim()).filter((n) => n.length >= 1);
  const keys = (ledger.answerKey || '')
    .split(/[;,·]/)
    .map((k) => k.trim())
    .filter(Boolean);

  const compactAnswer = normalizeCompact(answerText);
  const hitNums = nums.filter((n) => matchesNumberToken(answerText, n)).length;
  const hitKeys = keys.filter((k) => compactAnswer.includes(normalizeCompact(k))).length;

  if (nums.length > 0 && hitNums === nums.length && (keys.length === 0 || hitKeys >= Math.max(1, Math.floor(keys.length / 2)))) {
    return 'match_candidate';
  }
  if (nums.length > 0 && hitNums === 0) {
    return 'mismatch_candidate';
  }
  if (nums.length === 0 && keys.length > 0 && hitKeys >= Math.max(1, Math.floor((keys.length + 1) / 2))) {
    return 'match_candidate';
  }
  return 'pending';
}

/**
 * 출처 4단 판정:
 * - 1단(검색에 뜸): 도구 반환 목록(toolSources)에 공식 도메인이 있음 (toolSources 미제공 시 인용 목록 기준 폴백)
 * - 2단(AI가 읽음): 인용 목록(citations) 중 공식 도메인이 있음
 * - 3단(첫 근거가 됨): 첫 인용(citations[0])이 공식 도메인임
 * - 4단(내용이 맞음 후보): 공급 공백·해당 없음 분리 후 숫자·핵심어 대조
 */
export function evaluateSourceStages(input: StageEvaluationInput): StageEvaluationResult {
  const mergedEntry: OfficialDomainRegistryEntry | undefined = input.domainEntry || input.ledger
    ? {
        unitId: input.domainEntry?.unitId || '',
        selfDomains: input.domainEntry?.selfDomains || [],
        metroDomains: input.domainEntry?.metroDomains,
        linkedAgencyDomains: input.domainEntry?.linkedAgencyDomains,
        cultureDomains: input.domainEntry?.cultureDomains,
        ledgerDomains: [
          ...(input.domainEntry?.ledgerDomains || []),
          ...(input.ledger?.officialUrl1 ? [input.ledger.officialUrl1] : []),
          ...(input.ledger?.officialUrl2 ? [input.ledger.officialUrl2] : []),
        ],
      }
    : undefined;

  const searchPool = input.toolSources && input.toolSources.length > 0 ? input.toolSources : input.citations;
  const s1AppearedInSearch = searchPool.some((s) => isOfficialDomain(s.url, mergedEntry));
  const s2CitedByAi = input.citations.some((c) => isOfficialDomain(c.url, mergedEntry));
  const s3FirstCitationOfficial =
    input.citations.length > 0 && isOfficialDomain(input.citations[0].url, mergedEntry);

  const firstCitationKind =
    input.citations.length > 0 ? classifyDomainKind(input.citations[0].url, mergedEntry) : null;

  const notApplicable = Boolean(input.ledger?.notApplicable);
  const supplyGap = !notApplicable && Boolean(input.ledger?.supplyGap);
  const s4Candidate = evaluateContentCandidate(input.answerText, input.ledger);

  return {
    s1AppearedInSearch,
    s2CitedByAi,
    s3FirstCitationOfficial,
    s4Candidate,
    firstCitationKind,
    supplyGap,
    notApplicable,
  };
}

/**
 * 중단 규칙 검사: 도구 반환 목록이 없는 회차가 5%를 넘으면 1단 집계를 보류한다 (§10 source-stages.ts).
 */
export function shouldHoldStage1ForMissingToolSources(
  totalRuns: number,
  missingToolSourcesCount: number
): boolean {
  if (totalRuns <= 0) return false;
  return missingToolSourcesCount / totalRuns > TOOL_SOURCES_MISSING_HOLD_RATE;
}

/**
 * 이중 분모 계산: 공급 공백과 해당 없음을 제외한 "정비 가능 회차" 분모와
 * "작성 필요(공급 공백) 회차"를 분리해 공식 근거율을 산출한다 (§3.1, §10 denominator.ts).
 */
export function computeOfficialSourceRate(results: StageEvaluationResult[]) {
  const supplyGapCount = results.filter((r) => r.supplyGap).length;
  const notApplicableCount = results.filter((r) => r.notApplicable).length;
  const validDenominator = results.filter((r) => !r.supplyGap && !r.notApplicable);
  const s3Numerator = validDenominator.filter((r) => r.s3FirstCitationOfficial).length;
  const denominator = validDenominator.length;
  const rate = denominator > 0 ? s3Numerator / denominator : 0;

  return {
    rate,
    numerator: s3Numerator,
    denominator,
    supplyGapCount,
    notApplicableCount,
    totalReps: results.length,
  };
}
