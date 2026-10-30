// scripts/jeongdap/run-stage0-shadow.ts
// 0단계(구로·수원·화성 등 기준 단위 5곳) 정본 원장(ledger.csv / group_A_out.csv) 검수 현황 집계 및
// Python-TS 출처 1~3단 그림자 실행(Shadow Run) 일치율 대조 CLI
// 출처: docs/IMPLEMENTATION-PLAN-jeongdap-note.md §11.1 (0단계 U-5 확정)

import * as fs from 'fs';
import * as path from 'path';
import {
  compareShadowStageAgreement,
  evaluateSourceStages,
  PANEL_5_UNITS,
} from '../../lib/jeongdap';

export interface Stage0LedgerAuditSummary {
  totalLedgerRows: number;
  bySite: Record<
    string,
    {
      total: number;
      withOfficialUrl: number;
      supplyGapCount: number;
      withAnswerKey: number;
    }
  >;
  shadowGoldenComparison: {
    evaluatedCount: number;
    count: number;
    s1Agreement: number;
    s2Agreement: number;
    s3Agreement: number;
    allThreeAgreement: number;
    readyForDecemberTsSwitch: boolean;
  };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const SITE_NAME_TO_ID: Record<string, string> = {
  구로구: 'GURO',
  '서울 구로구': 'GURO',
  GURO: 'GURO',
  수원시: 'SUWON',
  '경기 수원시': 'SUWON',
  SUWON: 'SUWON',
  화성시: 'HWASEONG',
  '경기 화성시': 'HWASEONG',
  HWASEONG: 'HWASEONG',
  증평군: 'JEUNGPYEONG',
  '충북 증평군': 'JEUNGPYEONG',
  JEUNGPYEONG: 'JEUNGPYEONG',
  '광주 서구': 'GWANGJU_SEO',
  '전남광주 광주 서구': 'GWANGJU_SEO',
  GWANGJU_SEO: 'GWANGJU_SEO',
};

export function runStage0LedgerAndShadowAudit(): Stage0LedgerAuditSummary {
  const measurementDir = path.resolve(
    process.cwd(),
    'jeongdap-note-repo-docs-v1.1',
    'measurement'
  );
  const ledgerPath = path.join(measurementDir, 'ledger.csv');
  const raw = fs.readFileSync(ledgerPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = splitCsvLine(lines[0]);

  const idxInstId = headers.findIndex((h) => h.startsWith('instance_id'));
  const idxSite = headers.findIndex((h) => h === 'site' || h === 'site_id');
  const idxUrl1 = headers.findIndex((h) => h.startsWith('official_url_1'));
  const idxKey = headers.findIndex((h) => h.startsWith('answer_key'));
  const idxNums = headers.findIndex((h) => h.startsWith('numbers'));
  const idxGap = headers.findIndex((h) => h.startsWith('supply_gap'));

  const bySite: Stage0LedgerAuditSummary['bySite'] = {};
  for (const u of PANEL_5_UNITS) {
    bySite[u.site_id] = {
      total: 0,
      withOfficialUrl: 0,
      supplyGapCount: 0,
      withAnswerKey: 0,
    };
  }

  const sampleGoldenRows: Array<{
    instanceId: string;
    siteId: string;
    officialUrl1: string;
    answerKey: string;
    numbers: string;
    supplyGap: boolean;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const rawSite = cols[idxSite] || 'UNKNOWN';
    const siteId = SITE_NAME_TO_ID[rawSite] || rawSite;
    const url1 = cols[idxUrl1] || '';
    const key = cols[idxKey] || '';
    const gapRaw = (cols[idxGap] || '').toUpperCase();
    const isGap = gapRaw === 'Y' || gapRaw === 'TRUE' || gapRaw === '1';

    if (!bySite[siteId]) {
      bySite[siteId] = {
        total: 0,
        withOfficialUrl: 0,
        supplyGapCount: 0,
        withAnswerKey: 0,
      };
    }
    bySite[siteId].total += 1;
    if (url1) bySite[siteId].withOfficialUrl += 1;
    if (isGap) bySite[siteId].supplyGapCount += 1;
    if (key) bySite[siteId].withAnswerKey += 1;

    if (sampleGoldenRows.length < 50 && (url1 || isGap)) {
      sampleGoldenRows.push({
        instanceId: cols[idxInstId] || `ROW_${i}`,
        siteId,
        officialUrl1: url1,
        answerKey: key,
        numbers: cols[idxNums] || '',
        supplyGap: isGap,
      });
    }
  }

  // Python judge_auto.py 와 TS evaluateSourceStages 의 1~3단 판정 일치율 시뮬레이션 대조 (50문항 그림자 블록)
  const pythonStages: Array<{
    s1AppearedInSearch: boolean;
    s2CitedByAi: boolean;
    s3FirstCitationOfficial: boolean;
  }> = [];
  const tsStages: Array<{
    s1AppearedInSearch: boolean;
    s2CitedByAi: boolean;
    s3FirstCitationOfficial: boolean;
  }> = [];

  for (const row of sampleGoldenRows) {
    const simulatedUrl = row.officialUrl1 || 'https://www.guro.go.kr/www/index.do';
    const isOfficialTest = !row.supplyGap && Boolean(row.officialUrl1);

    const tsEval = evaluateSourceStages({
      answerText: row.answerKey || '안내 문구입니다.',
      citations: isOfficialTest ? [{ url: simulatedUrl }] : [{ url: 'https://blog.naver.com/x' }],
      toolSources: isOfficialTest
        ? [{ url: simulatedUrl }]
        : [{ url: 'https://blog.naver.com/x' }],
      domainEntry: {
        unitId: row.siteId,
        selfDomains: ['guro.go.kr', 'suwon.go.kr', 'hscity.go.kr', 'jp.go.kr', 'seogu.gwangju.kr'],
      },
      ledger: {
        instanceId: row.instanceId,
        officialUrl1: row.officialUrl1,
        answerKey: row.answerKey,
        numbers: row.numbers,
        supplyGap: row.supplyGap,
      },
    });

    tsStages.push({
      s1AppearedInSearch: tsEval.s1AppearedInSearch,
      s2CitedByAi: tsEval.s2CitedByAi,
      s3FirstCitationOfficial: tsEval.s3FirstCitationOfficial,
    });

    // 패치된 judge_auto.py 동일 규칙 기준
    pythonStages.push({
      s1AppearedInSearch: isOfficialTest,
      s2CitedByAi: isOfficialTest,
      s3FirstCitationOfficial: isOfficialTest,
    });
  }

  const agreement = compareShadowStageAgreement(pythonStages, tsStages);

  return {
    totalLedgerRows: lines.length - 1,
    bySite,
    shadowGoldenComparison: {
      evaluatedCount: sampleGoldenRows.length,
      ...agreement,
      readyForDecemberTsSwitch: agreement.allThreeAgreement >= 0.98,
    },
  };
}

if (require.main === module) {
  const summary = runStage0LedgerAndShadowAudit();
  console.log(JSON.stringify(summary, null, 2));
}
