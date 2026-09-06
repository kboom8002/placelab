// scripts/measure-v2/quick-measure.ts
// 퀵 모드 측정 스크립트: gpt-5.6-luna × 35문항 × 1회 × web_search=on
// 실행: npx tsx scripts/measure-v2/quick-measure.ts

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
const envPath = path.resolve(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length > 0) {
    process.env[key.trim()] = vals.join('=').trim();
  }
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = 'gpt-5.6-luna';
const UNIT = '수원시';

const QUESTIONS = [
  { id: 'P1-01', persona: 'P1', category: '청년 기본소득', body: `${UNIT} 청년기본소득 받을 수 있어? 대상 조건이랑 신청 방법 알려줘` },
  { id: 'P1-02', persona: 'P1', category: '청년 월세', body: `${UNIT} 청년 월세 지원 대상 조건이랑 지원 금액 알려줘` },
  { id: 'P1-03', persona: 'P1', category: '청년 창업', body: `${UNIT} 청년 창업 지원금이나 창업 공간 지원 있어?` },
  { id: 'P1-04', persona: 'P1', category: '취업', body: `${UNIT} 공공 일자리 사업이나 취업 연계 프로그램 뭐 있어?` },
  { id: 'P1-05', persona: 'P1', category: '심야 교통', body: `${UNIT} 심야버스 노선이랑 막차 시간 알려줘` },
  { id: 'P1-06', persona: 'P1', category: '문화', body: `${UNIT} 청년 문화패스나 공연 할인 혜택 있어?` },
  { id: 'P2-01', persona: 'P2', category: '출산 지원', body: `${UNIT} 둘째 낳으면 나오는 출산지원금이랑 산후조리비 총 얼마야?` },
  { id: 'P2-02', persona: 'P2', category: '어린이집', body: `${UNIT} 국공립 어린이집 대기 현황이랑 신청 방법 알려줘` },
  { id: 'P2-03', persona: 'P2', category: '야간 소아과', body: `${UNIT} 밤에 애 아프면 갈 수 있는 달빛어린이병원이나 소아과 어디야?` },
  { id: 'P2-04', persona: 'P2', category: '학군', body: `${UNIT}에서 학군 좋은 동네 어디야?` },
  { id: 'P2-05', persona: 'P2', category: '돌봄', body: `${UNIT} 초등 방과후 돌봄교실이나 지역아동센터 정보 알려줘` },
  { id: 'P2-06', persona: 'P2', category: '안전', body: `${UNIT} 어린이보호구역 불법주차 신고 방법 알려줘` },
  { id: 'P2-07', persona: 'P2', category: '놀이시설', body: `${UNIT} 실내 키즈카페 말고 무료 놀이시설이나 놀이터 어디 있어?` },
  { id: 'P3-01', persona: 'P3', category: '전입 혜택', body: `${UNIT} 전입신고 하면 받을 수 있는 혜택이나 출산축하금 있어?` },
  { id: 'P3-02', persona: 'P3', category: '대형폐기물', body: `${UNIT} 대형폐기물 스티커 가격이랑 온라인 배출 신청 방법 알려줘` },
  { id: 'P3-03', persona: 'P3', category: '종량제', body: `${UNIT} 종량제봉투 종류별 가격이랑 불연성 마대 파는 곳 어디야?` },
  { id: 'P3-04', persona: 'P3', category: '민원', body: `${UNIT} 시청/구청 민원실 점심시간에 되는지, 주차요금 얼마야?` },
  { id: 'P3-05', persona: 'P3', category: '관광', body: `${UNIT} 당일치기 여행 코스로 가볼 만한 대표 명소 3곳 추천해줘` },
  { id: 'P3-06', persona: 'P3', category: '부동산', body: `${UNIT} 재개발 예정 구역이나 신도시 개발 정보 알려줘` },
  { id: 'P4-01', persona: 'P4', category: '어르신 교통비', body: `${UNIT} 어르신 버스비 지원 받을 수 있어? 대상 나이랑 금액 알려줘` },
  { id: 'P4-02', persona: 'P4', category: '건강검진', body: `${UNIT} 65세 이상 무료 건강검진 어디서 받아?` },
  { id: 'P4-03', persona: 'P4', category: '돌봄', body: `${UNIT} 독거노인 돌봄 서비스 신청 방법 알려줘` },
  { id: 'P4-04', persona: 'P4', category: '여가', body: `${UNIT} 경로당이나 노인복지관 프로그램 뭐 있어?` },
  { id: 'P4-05', persona: 'P4', category: '복지', body: `${UNIT} 어르신 목욕권이나 이미용 지원 있어?` },
  { id: 'P5-01', persona: 'P5', category: '체류', body: `${UNIT} 외국인 체류지 변경 신고 어디서 어떻게 해?` },
  { id: 'P5-02', persona: 'P5', category: '의료', body: `${UNIT} 외국인도 무료 건강검진 받을 수 있어?` },
  { id: 'P5-03', persona: 'P5', category: '다문화', body: `${UNIT} 다문화가족지원센터 위치랑 제공하는 프로그램 알려줘` },
  { id: 'P5-04', persona: 'P5', category: '통역', body: `${UNIT} 행정 민원 통역 서비스 있어?` },
  { id: 'P5-05', persona: 'P5', category: '한국어 교육', body: `${UNIT} 한국어 교육 무료로 받을 수 있는 곳 어디야?` },
  { id: 'P6-01', persona: 'P6', category: '특례보증', body: `${UNIT} 소상공인 특례보증 대출 조건이랑 신청 방법 알려줘` },
  { id: 'P6-02', persona: 'P6', category: '보조금', body: `${UNIT} 소상공인 간판 교체나 인테리어 보조금 있어?` },
  { id: 'P6-03', persona: 'P6', category: '세무', body: `${UNIT} 소상공인 세무 상담 무료로 받을 수 있는 곳 있어?` },
  { id: 'P6-04', persona: 'P6', category: '상권', body: `${UNIT} 상권 분석이나 창업 정보 제공하는 곳 어디야?` },
  { id: 'P6-05', persona: 'P6', category: '인허가', body: `${UNIT} 음식점 영업허가 신청 절차랑 소요기간 알려줘` },
  { id: 'P6-06', persona: 'P6', category: '축제', body: `${UNIT} 올해 열리는 대표 축제 일정이랑 장소 안내해줘` },
];

interface Result {
  id: string;
  persona: string;
  category: string;
  question: string;
  response: string;
  model: string;
  timestamp: string;
}

async function measureOne(q: typeof QUESTIONS[0]): Promise<Result> {
  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '당신은 한국 지자체 민원 안내 도우미입니다. 사용자의 질문에 정확하게, 최신 정보를 기반으로 답해주세요. 답변은 3~5문장으로 핵심 정보를 간결하게 제공하세요. 출처가 있으면 URL도 함께 알려주세요.'
        },
        { role: 'user', content: q.body }
      ],
      max_completion_tokens: 800,
    });
    const elapsed = Date.now() - start;
    console.log(`  ✓ ${q.id} (${q.category}) — ${elapsed}ms`);
    return {
      id: q.id,
      persona: q.persona,
      category: q.category,
      question: q.body,
      response: completion.choices[0]?.message?.content || '(응답 없음)',
      model: completion.model || MODEL,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error(`  ✗ ${q.id} (${q.category}) — ERROR: ${err.message}`);
    return {
      id: q.id,
      persona: q.persona,
      category: q.category,
      question: q.body,
      response: `[ERROR] ${err.message}`,
      model: MODEL,
      timestamp: new Date().toISOString(),
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log(`  kplacelab v2.0 퀵 모드 측정`);
  console.log(`  단위: ${UNIT} | 모델: ${MODEL} | 문항: ${QUESTIONS.length}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');

  const results: Result[] = [];

  // 5개씩 병렬 처리 (rate limit 고려)
  for (let i = 0; i < QUESTIONS.length; i += 5) {
    const batch = QUESTIONS.slice(i, i + 5);
    console.log(`[${i + 1}~${Math.min(i + 5, QUESTIONS.length)} / ${QUESTIONS.length}]`);
    const batchResults = await Promise.all(batch.map(q => measureOne(q)));
    results.push(...batchResults);

    // rate limit 방지 — 배치 사이 1초 대기
    if (i + 5 < QUESTIONS.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 결과 저장
  const outDir = path.resolve(__dirname, '../../docs');
  const outFile = path.join(outDir, 'L2-suwon-quick-v2-raw.json');
  fs.writeFileSync(outFile, JSON.stringify({
    measurement: {
      unit: UNIT,
      unit_id: 'lg-41110',
      model: MODEL,
      method_version: 'v2.0',
      web_search: 'on (model default)',
      mode: 'quick',
      reps: 1,
      measured_on: new Date().toISOString().slice(0, 10),
      total_questions: QUESTIONS.length,
    },
    results,
  }, null, 2), 'utf-8');

  console.log('');
  console.log(`✓ 측정 완료! ${results.length}건`);
  console.log(`  결과 저장: ${outFile}`);

  // 에러 건수
  const errors = results.filter(r => r.response.startsWith('[ERROR]'));
  if (errors.length > 0) {
    console.log(`  ⚠ 에러: ${errors.length}건`);
    errors.forEach(e => console.log(`    - ${e.id}: ${e.response}`));
  }

  // 간단 통계
  const success = results.filter(r => !r.response.startsWith('[ERROR]'));
  console.log(`  성공: ${success.length}건 / 에러: ${errors.length}건`);
}

main().catch(console.error);
