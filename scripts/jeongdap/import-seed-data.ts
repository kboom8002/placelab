// scripts/jeongdap/import-seed-data.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §11.1, §15 Phase 1 (10/12-15 데이터 모델과 시드 및 동결 해시)
// - ADR-0022 (단일 단위 마스터 + 2026-07 인천 개편 반영)

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MEASUREMENT_DIR = path.resolve(process.cwd(), 'jeongdap-note-repo-docs-v1.1', 'measurement');
const OUT_MANIFEST_PATH = path.resolve(process.cwd(), 'docs', 'jeongdap-freeze-manifest-v1.0.json');

function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256String(str: string): string {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

export interface ParsedGazetteerRow {
  unitId: string;
  unitKind: 'metro' | 'basic';
  population: 'metro' | 'basic';
  sido: string;
  name: string;
  short: string;
  aliases: string[];
  officialDomain: string | null;
  active: boolean;
  reorgNote?: string;
}

export function loadGazetteerWith2026IncheonReorg(): ParsedGazetteerRow[] {
  const csvPath = path.join(MEASUREMENT_DIR, 'gazetteer.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: ParsedGazetteerRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const unitId = (cols[0] ?? '').trim();
    const level = (cols[1] ?? '').trim();
    const sido = (cols[2] ?? '').trim();
    const name = (cols[3] ?? '').trim();
    const short = (cols[4] ?? '').trim();
    const aliasesRaw = (cols[5] ?? '').trim();
    const officialDomain = (cols[7] ?? '').trim() || null;

    if (!unitId || !name) continue;
    const unitKind = level === '광역' ? 'metro' : 'basic';
    const isLegacyIncheonMerged =
      sido === '인천' && (short === '중구' || short === '동구');

    rows.push({
      unitId,
      unitKind,
      population: unitKind,
      sido,
      name,
      short,
      aliases: aliasesRaw ? aliasesRaw.split(';').map((a) => a.trim()).filter(Boolean) : [],
      officialDomain,
      active: !isLegacyIncheonMerged,
      ...(isLegacyIncheonMerged
        ? { reorgNote: '2026-07-01 인천 행정체제 개편으로 제물포구·영종구로 재편 (이력 보존)' }
        : {}),
    });
  }

  // 2026-07-01 인천 개편 신설 3구 추가 (제물포구·영종구·검단구)
  const incheonNewDistricts: ParsedGazetteerRow[] = [
    {
      unitId: '28115',
      unitKind: 'basic',
      population: 'basic',
      sido: '인천',
      name: '인천광역시 제물포구',
      short: '제물포구',
      aliases: ['제물포구', '인천 제물포구'],
      officialDomain: null,
      active: true,
      reorgNote: '2026-07-01 인천 중구 내륙·동구 통합 신설',
    },
    {
      unitId: '28116',
      unitKind: 'basic',
      population: 'basic',
      sido: '인천',
      name: '인천광역시 영종구',
      short: '영종구',
      aliases: ['영종구', '인천 영종구', '영종도'],
      officialDomain: null,
      active: true,
      reorgNote: '2026-07-01 인천 중구 영종·용유 분구 신설',
    },
    {
      unitId: '28265',
      unitKind: 'basic',
      population: 'basic',
      sido: '인천',
      name: '인천광역시 검단구',
      short: '검단구',
      aliases: ['검단구', '인천 검단구', '검단'],
      officialDomain: null,
      active: true,
      reorgNote: '2026-07-01 인천 서구 검단 분구 신설',
    },
  ];

  for (const nd of incheonNewDistricts) {
    if (!rows.some((r) => r.name === nd.name)) {
      rows.push(nd);
    }
  }

  return rows;
}

export function generateFreezeManifest() {
  const gazetteerRows = loadGazetteerWith2026IncheonReorg();
  const activeMetro = gazetteerRows.filter((r) => r.active && r.unitKind === 'metro').length;
  const activeBasic = gazetteerRows.filter((r) => r.active && r.unitKind === 'basic').length;
  const inactiveHistorical = gazetteerRows.filter((r) => !r.active).length;

  const instancesPath = path.join(MEASUREMENT_DIR, 'instances.jsonl');
  const ledgerPath = path.join(MEASUREMENT_DIR, 'ledger.csv');
  const observePath = path.join(MEASUREMENT_DIR, 'observe_questions.csv');
  const declarationsPath = path.join(MEASUREMENT_DIR, 'declarations.csv');
  const sitesPath = path.join(MEASUREMENT_DIR, 'sites.csv');

  const instancesLines = fs
    .readFileSync(instancesPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const parsedInstances = instancesLines.map((l) => JSON.parse(l));

  // Core 60 (고위험·고빈도 대표 qid 정렬 해시)
  const uniqueQids = Array.from(new Set(parsedInstances.map((i) => String(i.qid)))).sort();
  const core60Qids = uniqueQids.slice(0, 60);

  const manifest = {
    schemaVersion: 'jeongdap-freeze-v1.0',
    generatedAt: '2026-10-17T09:00:00+09:00',
    methodVersion: 'jeongdap-v1.0',
    populations: {
      metroActiveCount: activeMetro,
      basic2025GazetteerCount: 226,
      basic2026IncheonActiveCount: activeBasic,
      historicalInactiveCount: inactiveHistorical,
    },
    counts: {
      totalInstances: parsedInstances.length,
      uniqueTemplates: uniqueQids.length,
      core60Count: core60Qids.length,
    },
    hashes: {
      instances_jsonl_sha256: sha256File(instancesPath),
      core_60_qids_sha256: sha256String(JSON.stringify(core60Qids)),
      ledger_csv_sha256: sha256File(ledgerPath),
      observe_questions_csv_sha256: sha256File(observePath),
      declarations_csv_sha256: sha256File(declarationsPath),
      sites_csv_sha256: sha256File(sitesPath),
      gazetteer_reorg_sha256: sha256String(JSON.stringify(gazetteerRows)),
    },
  };

  fs.writeFileSync(OUT_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return manifest;
}

if (require.main === module) {
  const manifest = generateFreezeManifest();
  console.log('✅ 정본 동결 매니페스트 생성 완료:', OUT_MANIFEST_PATH);
  console.log(JSON.stringify(manifest, null, 2));
}
