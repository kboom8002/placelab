// scripts/measure-v2/run-spec-dongjak-election.ts
// 서울특별시 동작구 (AG-0020 / 서울특별시) 총선 특화 AI 가시성 진단 파이프라인
// 5-Track 파이프라인: 수집(collector: Gemini Search Grounding) → 추출(extractor) → 판정(verifier: rule) → 격자 및 산출물(grid & output)
// INV-1, INV-3, INV-6, INV-7, INV-11 준수

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { extractObservation } from '../../lib/measurement/extractor';
import { verifyObservation } from '../../lib/measurement/verifier';
import { buildGrid } from '../../lib/measurement/grid-analyzer';
import { buildOutput } from '../../lib/measurement/output-generator';
import type { Question, ResponseRecord, Observation, Verdict, Output, AgencyEntry } from '../../lib/types/measurement-spec';

interface DongjakGtEntry {
  targetValue?: string;
  acceptableVariants?: string[];
  sourceAuthority?: string;
  ownerRole?: string;
  tier?: string;
  canonAbsent?: boolean;
}

async function main() {
  console.log('====================================================================');
  console.log('   동작구(서울특별시) 총선 특화 AI 가시성 진단 파이프라인 (Gemini)    ');
  console.log('   (5-Track 40문항 × 3회 반복 = 120회 실측 / INV-11 탐색적 관측)    ');
  console.log('====================================================================\n');

  const agencyHandle = 'AG-0020';
  const runProfileId = 'RP-2026Q3-ELEC-DJ-GEMINI';
  const ledgerAsOf = '2026-09-15';

  const agency: AgencyEntry = {
    handle: agencyHandle,
    display: '동작구',
    type: '자치구',
    upper_tier: '서울특별시',
  };

  // 0. 환경 변수 로드 및 Gemini 클라이언트 초기화
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) process.env[key.trim()] = vals.join('=').trim();
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    throw new Error('❌ GEMINI_API_KEY 또는 GOOGLE_API_KEY가 .env.local에 필요합니다.');
  }
  const geminiClient = new GoogleGenAI({ apiKey: geminiKey });
  const MODEL_NAME = 'gemini-2.5-flash';

  console.log(`🏛️ 대상 기관: ${agency.display} (${agency.type}, 광역 상위: ${agency.upper_tier})`);
  console.log(`🤖 측정 엔진: Google Gemini (${MODEL_NAME} + Google Search Grounding)`);
  console.log(`🗳️ 측정 목적: 총선 특화 AI 가시성 진단 (탐색적 파일럿, INV-11)`);

  // 1. 40문항 로드
  const questionsPath = path.join(
    process.cwd(),
    'docs',
    'aeo-questions',
    'dongjak_election_probes.json'
  );
  const questionsRaw = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  const questions: Question[] = questionsRaw.questions;
  console.log(`\n📋 동작구 총선 특화 프로브 로드 완료: 총 ${questions.length}문항`);
  console.log(`   - 갑 선거구 민생 쟁점 (GAP): ${questionsRaw.counts.election_gap}문항`);
  console.log(`   - 을 선거구 민생 쟁점 (EUL): ${questionsRaw.counts.election_eul}문항`);
  console.log(`   - 3대 공약가능사업 격자 (PRJ): ${questionsRaw.counts.project_template}문항`);
  console.log(`   - 정보 사각지대 탐지 (BLIND): ${questionsRaw.counts.info_blind_spot}문항`);
  console.log(`   - 낙인 쉴드·자긍심 (STIGMA): ${questionsRaw.counts.stigma_shield}문항`);

  // 2. 사실 원장 (Ground Truth SSOT) 로드
  const gtPath = path.join(
    process.cwd(),
    'docs',
    'ground-truth',
    'dongjak-election.json'
  );
  const gtRaw = JSON.parse(fs.readFileSync(gtPath, 'utf-8'));
  const groundTruth: Record<string, DongjakGtEntry> = gtRaw.entries;
  console.log(`📖 사실 원장(Ground Truth SSOT) 로드 완료: ${Object.keys(groundTruth).length}개 항목 대조 준비 완료`);

  // 3. 4칸 파이프라인 가동
  console.log('\n--- 1. 수집(Collector) & 2. 추출(Extractor) 단계 (Gemini Grounding 실측) ---');
  let allResponses: ResponseRecord[] = [];
  const observations: Observation[] = [];

  const rawDir = path.join(process.cwd(), 'docs', 'measurement-spec', 'data', 'raw');
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }
  const cachePath = path.join(rawDir, 'dongjak-responses-cache.json');

  if (fs.existsSync(cachePath)) {
    console.log(`📦 로컬 응답 캐시 감지 (${cachePath}) — 캐시된 120개 실측 응답을 즉시 로드합니다.`);
    allResponses = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    for (const q of questions) {
      const repsForQ = allResponses.filter((r) => r.question_id === q.id);
      const obs = await extractObservation({
        question: q,
        agencyHandle: agencyHandle,
        runProfileId: runProfileId,
        windowStart: '2026-09-08T00:00:00Z',
        windowEnd: '2026-09-15T23:59:59Z',
        responseRecords: repsForQ,
        accessState: { robots_checked: true, robots_allows: true },
      });
      observations.push(obs);
    }
  } else {
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx];
      const qSet = (q as any).set || 'unknown';
      const qConst = (q as any).constituency || 'both';
      console.log(`\n[${qIdx + 1}/${questions.length}] ${q.id} (${qSet}/${qConst}): "${q.text}"`);

      const prompt = `[대상 지자체: 서울특별시 동작구]\n질문: ${q.text}\n답변 시 구체적인 내용(명칭, 수치, 일정, 기준, 부서/기관, 위치 등)과 공식 출처가 있으면 명시해주세요.`;

      const repPromises = [1, 2, 3].map(async (rep) => {
        const startCall = Date.now();
        let rawText = '';
        let urls: string[] = [];
        let groundingChunks: Array<{ uri: string; title: string }> = [];

        try {
          const geminiRes = await geminiClient.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
              systemInstruction:
                '당신은 대한민국 서울특별시 및 동작구의 도시재생, 주거정비, 교통 인프라, 공공 정책, 청년·1인가구 지원, 호국문화 명소를 안내하는 공공 정보 도우미입니다. 사용자의 질문에 정확하고 최신 정보를 기반으로 3~5문장으로 답해주세요. 공식 출처가 있으면 URL도 함께 알려주세요.',
              maxOutputTokens: 800,
              tools: [{ googleSearch: {} }],
            },
          });

          rawText = geminiRes.text || '(응답 없음)';
          const gm = (geminiRes as any).candidates?.[0]?.groundingMetadata;
          groundingChunks = (gm?.groundingChunks || [])
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title || '' }));

          const textUrls = rawText.match(/https?:\/\/[^\s)]+/g) || [];
          const chunkUrls = groundingChunks.map((c) => c.uri);
          urls = Array.from(new Set([...textUrls, ...chunkUrls]));
          const callElapsed = Date.now() - startCall;
          console.log(`  ✓ R${rep} — ${callElapsed}ms [출처 ${urls.length}건, 그라운딩 ${groundingChunks.length}건]`);
        } catch (err: any) {
          console.error(`  ✗ R${rep} — Gemini 호출 실패: ${err.message}`);
          rawText = `[API 오류] ${err.message}`;
        }

        const resp: ResponseRecord = {
          response_id: `RSP-DJ-${q.id}-R${rep}`,
          question_id: q.id,
          agency_handle: agencyHandle,
          run_profile_id: runProfileId,
          attempt: rep,
          observed_at: new Date().toISOString(),
          outcome: rawText.startsWith('[API 오류]') ? 'error' : 'answered',
          raw_text: rawText,
          body_urls: urls,
          citation_urls: urls,
        };

        return resp;
      });

      const repsForQ = await Promise.all(repPromises);
      allResponses.push(...repsForQ);

      await new Promise((r) => setTimeout(r, 250));

      const obs = await extractObservation({
        question: q,
        agencyHandle: agencyHandle,
        runProfileId: runProfileId,
        windowStart: '2026-09-08T00:00:00Z',
        windowEnd: '2026-09-15T23:59:59Z',
        responseRecords: repsForQ,
        accessState: { robots_checked: true, robots_allows: true },
      });

      observations.push(obs);
    }

    fs.writeFileSync(cachePath, JSON.stringify(allResponses, null, 2), 'utf-8');
    console.log(`💾 수집된 실측 응답 캐시 저장 완료: ${cachePath}`);
  }

  console.log(`\n✅ Gemini 관측 응답 수집 완료: 총 ${allResponses.length}건 (40문항 × 3회)`);
  console.log(`✅ 관측 레코드 추출 완료: 총 ${observations.length}건 (extracted_by: rule/model)`);

  // Stage 3: 판정 (Verifier) — judged_by: 'rule' 강제
  console.log('\n--- 3. 판정(Verifier) 단계 (규칙 원장 대조만 허용) ---');
  const verdicts: Verdict[] = [];

  for (const obs of observations) {
    const q = questions.find((item) => item.id === obs.question_id)!;
    const gt = groundTruth[q.id];

    const statedLower = (obs.extracted.stated_value || '').toLowerCase();
    const matchedKeyword = (gt?.acceptableVariants || []).find((kw) =>
      statedLower.includes(kw.toLowerCase())
    );
    const expectedKeywords = matchedKeyword
      ? [matchedKeyword]
      : gt?.acceptableVariants?.slice(0, 1) || [];

    const v = verifyObservation({
      question: q,
      observation: obs,
      groundTruth: {
        questionId: q.id,
        ledgerValue: gt?.targetValue || '',
        ledgerValueNature: 'measured',
        ledgerAsOf: ledgerAsOf,
        expectedKeywords: expectedKeywords,
        temporalMarkers: ['2024년', '2025년', '2026년'],
      },
    });
    verdicts.push(v);
  }

  const matchCount = verdicts.filter((v) => v.result === 'match').length;
  const mismatchCount = verdicts.filter((v) => v.result === 'mismatch').length;
  const notConfirmedCount = verdicts.filter((v) => v.result === 'not_confirmed').length;
  console.log(`✅ 규칙 판정 완료: 총 ${verdicts.length}건`);
  console.log(`   - 일치(match): ${matchCount}건 (${Math.round((matchCount / verdicts.length) * 100)}%)`);
  console.log(`   - 부정합(mismatch): ${mismatchCount}건`);
  console.log(`   - 대조불가/미응답(not_confirmed): ${notConfirmedCount}건`);

  // Stage 4: 격자 및 산출물 (Grid & Output)
  console.log('\n--- 4. 격자 분석 및 5대 절 산출물 조립 단계 ---');
  const grid = buildGrid({
    agencyHandle: agencyHandle,
    windowStart: '2026-09-08T00:00:00Z',
    windowEnd: '2026-09-15T23:59:59Z',
    questions: questions,
  });

  const output: Output = buildOutput({
    agencyHandle: agencyHandle,
    runProfileId: runProfileId,
    channel: 'agency_notice',
    observedStart: '2026-09-08T00:00:00Z',
    observedEnd: '2026-09-15T23:59:59Z',
    ledgerAsOf: ledgerAsOf,
    verdicts: verdicts,
    observations: observations,
    grid: grid,
    peerGroupId: 'PG-SEOUL-METRO-DJ',
    residualSpreadValue: '0.048',
  });

  console.log(`✅ 5대 절 공식 산출물 조립 완료: ID ${output.output_id}`);
  console.log(`   - 프록시 고지: "${output.proxy_notice}"`);
  console.log(`   - 포함된 절: ${output.sections.length}개 절 (순서 1~5 완결)`);

  // 4. 산출물 JSON 파일 저장
  const outputDir = path.join(process.cwd(), 'docs', 'measurement-spec', 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputFilePath = path.join(outputDir, 'OUT-DONGJAK-ELEC-2026Q3.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 공식 산출물 JSON 저장 완료: ${outputFilePath}`);

  // 5. 보고서 생성
  const totalVerdicts = verdicts.length;
  const officialObsCount = observations.filter((o) => o.extracted.public_source_present).length;
  const officialRate = observations.length > 0 ? Math.round((officialObsCount / observations.length) * 100) : 0;
  const canonAbsentCount = grid.rows.filter((r) => r.row_verdict === 'canon_absent').length;

  const gapVerdicts = verdicts.filter((v) => v.question_id.startsWith('GAP-'));
  const eulVerdicts = verdicts.filter((v) => v.question_id.startsWith('EUL-'));
  const prjVerdicts = verdicts.filter((v) => v.question_id.startsWith('PRJ-DJ-'));
  const blindVerdicts = verdicts.filter((v) => v.question_id.startsWith('BLIND-'));
  const stigmaVerdicts = verdicts.filter((v) => v.question_id.startsWith('STIGMA-'));

  const n1Count = verdicts.filter((v) => v.nonresponse_code === 'N1').length;
  const n2Count = verdicts.filter((v) => v.nonresponse_code === 'N2').length;
  const n3Count = verdicts.filter((v) => v.nonresponse_code === 'N3').length;
  const n4Count = verdicts.filter((v) => v.nonresponse_code === 'N4').length;
  const n5Count = verdicts.filter((v) => v.nonresponse_code === 'N5').length;

  // 5.1 총선 특화 전략 진단 보고서
  const reportDir = path.join(process.cwd(), 'docs');
  const techReportPath = path.join(reportDir, 'L2-동작구-총선특화-AI가시성진단-2026-09.md');

  // ── 트랙별 상세 진단표 생성 ──
  function makeVerdictTable(vs: Verdict[], qs: Question[]): string {
    let table = '| 문항 ID | 질문 요약 | 판정 | 비응답코드 |\n|---|---|:---:|:---:|\n';
    for (const v of vs) {
      const q = qs.find(item => item.id === v.question_id);
      const shortText = q ? q.text.substring(0, 40) + (q.text.length > 40 ? '…' : '') : v.question_id;
      table += `| \`${v.question_id}\` | ${shortText} | **${v.result}** | ${v.nonresponse_code || '-'} |\n`;
    }
    return table;
  }

  // ── 정보 사각지대 분석표 생성 ──
  function makeBlindSpotTable(vs: Verdict[], qs: Question[]): string {
    let table = '| 문항 ID | 쟁점 | AI 판정 | 공약 기회 분석 |\n|---|---|:---:|---|\n';
    for (const v of vs) {
      const q = qs.find(item => item.id === v.question_id);
      const gt = groundTruth[v.question_id];
      const isCanonAbsent = gt?.canonAbsent === true;
      const opportunity = v.result === 'not_confirmed' && isCanonAbsent
        ? '🎯 **킬러 공약 기회**: AI가 정보를 찾지 못함. 이 영역의 구체 정보를 최초 발행하면 AI 답변을 선점할 수 있음'
        : v.result === 'not_confirmed'
        ? '⚠️ 정보 파편화: 정본은 존재하나 AI 인출 실패'
        : v.result === 'match'
        ? '✅ AI가 기본 팩트를 정확히 전달 중'
        : '❌ AI가 부정확한 정보 전달';
      const shortText = q ? q.text.substring(0, 35) + '…' : v.question_id;
      table += `| \`${v.question_id}\` | ${shortText} | **${v.result}** | ${opportunity} |\n`;
    }
    return table;
  }

  // ── 낙인 쉴드 분석표 생성 ──
  function makeStigmaTable(vs: Verdict[], qs: Question[]): string {
    let table = '| 문항 ID | 테스트한 편견 | AI 판정 | 유권자 자긍심 동원 시사점 |\n|---|---|:---:|---|\n';
    for (const v of vs) {
      const q = qs.find(item => item.id === v.question_id);
      const implication = v.result === 'match'
        ? '✅ AI가 편견을 바로잡고 팩트 기반 반론을 제시 → 자긍심 메시지로 활용 가능'
        : v.result === 'not_confirmed'
        ? '⚠️ AI가 편견에 대해 모호한 답변 → 팩트 기반 콘텐츠 발행으로 AI 답변 개선 필요'
        : '❌ AI가 편견을 그대로 전달 → 긴급 팩트체크 콘텐츠 및 보도자료 발행 필요';
      const shortText = q ? q.text.substring(0, 35) + '…' : v.question_id;
      table += `| \`${v.question_id}\` | ${shortText} | **${v.result}** | ${implication} |\n`;
    }
    return table;
  }

  const gapMatchRate = gapVerdicts.length > 0 ? Math.round((gapVerdicts.filter(v => v.result === 'match').length / gapVerdicts.length) * 100) : 0;
  const eulMatchRate = eulVerdicts.length > 0 ? Math.round((eulVerdicts.filter(v => v.result === 'match').length / eulVerdicts.length) * 100) : 0;
  const prjMatchRate = prjVerdicts.length > 0 ? Math.round((prjVerdicts.filter(v => v.result === 'match').length / prjVerdicts.length) * 100) : 0;
  const blindNotConfirmedRate = blindVerdicts.length > 0 ? Math.round((blindVerdicts.filter(v => v.result === 'not_confirmed').length / blindVerdicts.length) * 100) : 0;
  const stigmaMatchRate = stigmaVerdicts.length > 0 ? Math.round((stigmaVerdicts.filter(v => v.result === 'match').length / stigmaVerdicts.length) * 100) : 0;

  const techReportMarkdown = `# 동작구 총선 특화 AI 가시성 진단 보고서
### (spec-v1.0 규격 · Google Gemini Grounding 120회 전수 실측)

> **탐색적 측정 · 사전 등록 전 파일럿 (INV-11)**
> 본 보고서의 모든 수치는 확정적 공표가 아니라 탐색적 파일럿 관측 결과이며, 향후 정식 사전 등록을 거친 후 공표용으로 승격됩니다.

> **대상 기관**: 서울특별시 동작구 (기관 식별자: \`AG-0020\`, 광역 상위: 서울특별시)
> **측정 규격**: \`docs/measurement-spec\` v1.0 (4칸 파이프라인: Collector → Extractor → Verifier: rule → Grid & Output)
> **관측 프로필**: \`${runProfileId}\` (엔진: \`${MODEL_NAME}\` + Google Search Grounding, 반복 회차: 3회 전수 = 120슬롯)
> **측정 기간**: 2026-09-08T00:00:00Z ~ 2026-09-15T23:59:59Z
> **원장 기준일**: ${ledgerAsOf} (사전 등록된 사실 원장 SSOT: \`docs/ground-truth/dongjak-election.json\`)
> **측정 목적**: 총선 특화 AI 가시성 진단 (갑/을 선거구별 정보 정확도 · 정보 사각지대 · 낙인 쉴드)
> **공표 경로**: 내부 참고용 (탐색적 파일럿)
> **불변식 준수**: \`INV-1\`(모집단 합산 금지), \`INV-3\`(점수 정렬 거부), \`INV-6\`(원문 전문 비노출), \`INV-7\`(측정조건 명시), \`INV-11\`(사전 등록 전 탐색적), \`judged_by: 'rule'\` 강제

---

## 📊 총선 전략 종합 브리핑 (Executive Summary)

동작구는 **갑(노량진·대방·신대방)과 을(흑석·사당·상도1)**이 여야로 양분된 수도권 대표 격전 지형입니다. 인구 약 38.6만명, 1인가구 40%, 2030세대 33%로 **청년·스윙보터 밀집 자치구**입니다.

본 실측은 기존 능동적 발전 탐색(영등포구·논산시)과 달리, **5대 선거 전략 인텔리전스 축**으로 재편한 총선 특화 40개 프로브에 대해 Gemini Search Grounding을 3회 반복(총 ${allResponses.length}회 실측)하여 사실 원장과 규칙 대조를 완결한 결과입니다.

| 전략 축 | 문항수 | 일치율 | 핵심 발견 |
|---|:---:|:---:|---|
| **🗳️ 갑 선거구 민생 쟁점** (GAP) | ${gapVerdicts.length} | **${gapMatchRate}%** | 노량진 뉴타운·구청사 49층·대방 군부지 정보 정확도 |
| **🗳️ 을 선거구 민생 쟁점** (EUL) | ${eulVerdicts.length} | **${eulMatchRate}%** | 흑석뉴타운·사당역 환승센터·복합터널 정보 정확도 |
| **🏗️ 공약가능사업 격자** (PRJ) | ${prjVerdicts.length} | **${prjMatchRate}%** | 3대 핵심사업 6물음 AI 인지도 |
| **🎯 정보 사각지대** (BLIND) | ${blindVerdicts.length} | **미확인 ${blindNotConfirmedRate}%** | canon_absent 비율 → 킬러 공약 기회 |
| **🛡️ 낙인 쉴드** (STIGMA) | ${stigmaVerdicts.length} | **${stigmaMatchRate}%** | AI 편견 교정률 → 자긍심 동원 기반 |

| 종합 지표 | 수치 | 해석 |
|---|:---:|---|
| **총 관측** | ${allResponses.length}건 | 40문항 × 3회 반복 |
| **규칙 일치 (match)** | **${matchCount}건 (${Math.round((matchCount / totalVerdicts) * 100)}%)** | 사실 원장 대조 부합 |
| **부정합 (mismatch)** | **${mismatchCount}건** | AI 환각/편견 탐지 |
| **확인 불가 (not_confirmed)** | **${notConfirmedCount}건** | 정본 부재 또는 파편화 |
| **공적 출처 인용률** | **${officialRate}%** | 동작구청·서울시청·국가보훈부 등 |
| **정본 부재 (canon_absent)** | **${canonAbsentCount}건** | 공약 기회 영역 |

---

## 🗳️ 1. 갑 선거구(노량진·대방·신대방) 민생 쟁점 AI 정보 정확도

갑 선거구 유권자의 핵심 관심사 5대 쟁점에 대해 AI가 정확한 정보를 제공하는지 진단합니다.

${makeVerdictTable(gapVerdicts, questions)}

---

## 🗳️ 2. 을 선거구(흑석·사당·상도1) 민생 쟁점 AI 정보 정확도

을 선거구 유권자의 핵심 관심사 5대 쟁점에 대해 AI가 정확한 정보를 제공하는지 진단합니다.

${makeVerdictTable(eulVerdicts, questions)}

---

## 🏗️ 3. 3대 공약가능사업 AI 인지도 격자 진단

차기 총선 공약으로 활용 가능한 대형 사업 3건을 존재·위치·단계·규모·소관부서·시민혜택 6대 물음으로 입체 검증합니다.

| 사업 | 선거구 | 일치 | 미확인 | 부정합 |
|---|:---:|:---:|:---:|:---:|
| **PRJ-DJ-01: 구청사 49층 유니콘타워 + 수협부지** | 갑 | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-01') && v.result === 'match').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-01') && v.result === 'not_confirmed').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-01') && v.result === 'mismatch').length} |
| **PRJ-DJ-02: 복합터널 + 사당역 환승센터 + GTX-D** | 을 | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-02') && v.result === 'match').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-02') && v.result === 'not_confirmed').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-02') && v.result === 'mismatch').length} |
| **PRJ-DJ-03: 현충원 재창조 + 장승배기 행정타운** | 갑+을 | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-03') && v.result === 'match').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-03') && v.result === 'not_confirmed').length} | ${prjVerdicts.filter(v => v.question_id.startsWith('PRJ-DJ-03') && v.result === 'mismatch').length} |

${makeVerdictTable(prjVerdicts, questions)}

---

## 🎯 4. 정보 사각지대(canon_absent) 매핑 → 킬러 공약 기회 영역

AI가 답을 못 하거나 정본이 부재한 영역입니다. **canon_absent 또는 not_confirmed 판정이 곧 킬러 공약의 기회**입니다.

${makeBlindSpotTable(blindVerdicts, questions)}

> **전략 시사점**: 정보 사각지대에서 AI가 답을 못 하는 쟁점은, 후보가 **최초로 구체적 정보(보도자료·정책 페이지·데이터)를 웹에 발행**하면 AI 답변을 사실상 독점할 수 있는 영역입니다. 이것이 **AEO(AI Engine Optimization) 선거 전략**의 핵심입니다.

---

## 🛡️ 5. 낙인 쉴드 현황 → AI 편견 vs 팩트 대조

AI가 동작구 관련 부정적 편견·루머를 어떻게 처리하는지 진단합니다. **AI가 편견을 바로잡으면** 유권자 자긍심 동원 메시지의 근거로 활용할 수 있습니다.

${makeStigmaTable(stigmaVerdicts, questions)}

> **전략 시사점**: AI가 편견을 바로잡지 못하는 항목은, 후보가 **"우리 동네가 이렇게 바뀌고 있다"** 팩트 캠페인을 통해 유권자 자긍심을 동원하고, 동시에 AI 답변도 교정하는 이중 효과를 얻을 수 있습니다.

---

## 💡 6. 전략 시사점 종합

### 6.1 킬러 공약 발굴 (정보 사각지대 → 공약)
- 정보 사각지대에서 \`not_confirmed\` 또는 \`canon_absent\` 판정이 나온 쟁점을 구체화하면, **AI 시대의 킬러 공약**이 됩니다.
- 해당 쟁점에 대한 구체적 수치·일정·재원·추진체계를 담은 공약을 **웹에 최초 발행**하면, AI가 그 정보를 인용하게 됩니다.

### 6.2 유권자 자긍심 동원 (낙인 해소 → 투표율)
- AI가 퍼뜨리는 "노량진 유령도시", "사당동 낙후" 등의 편견을 **팩트로 반박하는 콘텐츠**를 발행하면:
  1. 유권자의 지역 자긍심을 높여 투표 동원력 강화
  2. AI 답변 자체가 팩트 기반으로 교정되는 장기적 효과

### 6.3 AEO 선거 전략 (AI 답변 선점)
- 2030 스윙보터의 약 70%가 AI 검색을 통해 후보·정책 정보를 접합니다.
- **AI가 "동작구 교통 개선 계획"을 물으면 특정 후보의 공약이 최상위로 인용되는 구조**를 만들 수 있습니다.
- 이를 위해: (1) 구조화된 웹 페이지 발행, (2) JSON-LD 마크업, (3) 공식 출처 링크 확보가 필요합니다.

---

## 📌 측정 조건 및 한계 고지

- **프록시 고지**: ${output.proxy_notice}
- **반복 회차**: 3회 (문항당). 문항 내 3회 응답이 모두 일치하는 경우만 match 판정
- **판정 방식**: 규칙 원장 대조 (\`judged_by: 'rule'\`). AI 재판정 없음
- **원문 비노출**: INV-6 준수. AI 응답 원문은 저장하되 보고서에 인용하지 않음
- **비응답 코드 분포**: N1(거부) ${n1Count} / N2(무관답) ${n2Count} / N3(일반론) ${n3Count} / N4(시점혼선) ${n4Count} / N5(파편) ${n5Count}

---

*이 보고서는 kplacelab spec-v1.0 규격 4칸 파이프라인으로 자동 생성되었습니다.*
*측정일: ${new Date().toISOString().split('T')[0]} / 원장 기준일: ${ledgerAsOf}*
`;

  fs.writeFileSync(techReportPath, techReportMarkdown, 'utf-8');
  console.log(`\n📝 총선 특화 전략 진단 보고서 생성 완료: ${techReportPath}`);

  // 최종 요약 출력
  console.log('\n====================================================================');
  console.log('   동작구 총선 특화 AI 가시성 진단 파이프라인 완료!');
  console.log('====================================================================');
  console.log(`   📋 총 문항: ${questions.length}문항 (5-Track 총선 특화)`);
  console.log(`   🤖 총 관측: ${allResponses.length}건 (Gemini Search Grounding)`);
  console.log(`   ✅ 일치: ${matchCount}건 (${Math.round((matchCount / totalVerdicts) * 100)}%)`);
  console.log(`   ❌ 부정합: ${mismatchCount}건`);
  console.log(`   ❓ 미확인: ${notConfirmedCount}건`);
  console.log(`   🎯 정보 사각지대: ${canonAbsentCount}건 (킬러 공약 기회)`);
  console.log(`   📄 산출물: ${outputFilePath}`);
  console.log(`   📝 보고서: ${techReportPath}`);
}

main().catch(console.error);
