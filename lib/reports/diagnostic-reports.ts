// lib/reports/diagnostic-reports.ts
// K-Place Lab 지자체 AI 가시성 심화 진단 보고서 (Layer 2 Reports) 메타데이터 카탈로그

export interface DiagnosticReportMeta {
  slug: string;
  title: string;
  subtitle: string;
  unitId?: string; // e.g. 'lg-44230'
  unitName: string;
  region: string;
  date: string;
  slots: number;
  sovRate: string;
  controllabilityRate: string;
  groundingRate: string;
  keyStrengths: string;
  negativeAlert: string;
  reportPath: string; // relative to project root
  jsonPath?: string;   // relative to project root
  category: 'all' | 'industry_military' | 'tourism_healing' | 'metropolitan_admin' | 'strategy_playbook';
  tags: string[];
}

export const DIAGNOSTIC_REPORTS: DiagnosticReportMeta[] = [
  {
    slug: 'nonsan-2026-09',
    title: '논산시 AI 가시성 심화 진단 보고서',
    subtitle: '국방산단의 미래 비전과 10만 영외면회객의 현실 — "비무기 군수와 딸기는 압도적이나, 출처 통제율 0.95%로 사설 블로그에 종속"',
    unitId: 'lg-44230',
    unitName: '논산시',
    region: '충청남도',
    date: '2026-09-11',
    slots: 135,
    sovRate: '66.7%',
    controllabilityRate: '0.95%',
    groundingRate: '100.0%',
    keyStrengths: '비무기군수산단 · 최고급 딸기 · 선샤인랜드 100% 독점',
    negativeAlert: '면회 바가지요금 및 대전 이탈 현상 지적',
    reportPath: 'docs/L2-논산-국방산업과생활인구-AI가시성진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260911-nonsan-deep.json',
    category: 'industry_military',
    tags: ['국방국가산단', '육군훈련소', '영외면회', '딸기엑스포', '선샤인랜드', '돈암서원'],
  },
  {
    slug: 'wando-2026-09',
    title: '완도군 AI 가시성 심화 진단 보고서',
    subtitle: '해양치유 단독 독점과 수산 브랜드 — "사설 포털 의존 속에서 해양치유 SoV 94.4% 달성"',
    unitId: 'lg-46890',
    unitName: '완도군',
    region: '전라남도',
    date: '2026-09-09',
    slots: 120,
    sovRate: '94.4%',
    controllabilityRate: '20.1%',
    groundingRate: '99.2%',
    keyStrengths: '해양치유센터 · 전복 및 다시마 수산 독점',
    negativeAlert: '한국관광공사 및 사설 포털 의존',
    reportPath: 'docs/L2-완도-해양치유-AI가시성진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260909-wando-deep.json',
    category: 'tourism_healing',
    tags: ['해양치유', '완도전복', '청산도', '신지명사십리'],
  },
  {
    slug: 'yeosu-2026-09',
    title: '여수시 AI 가시성 심화 진단 보고서',
    subtitle: '대한민국 해양관광 수도와 야경 브랜드 — "밤바다 가시성은 높으나 교통체증과 바가지요금 반복 지적"',
    unitId: 'lg-46130',
    unitName: '여수시',
    region: '전라남도',
    date: '2026-09-09',
    slots: 135,
    sovRate: '61.1%',
    controllabilityRate: '8.7%',
    groundingRate: '100.0%',
    keyStrengths: '밤바다 · 낭만포차 · 돌산대교 미식',
    negativeAlert: '주말 교통체증 · 숙박 바가지요금',
    reportPath: 'docs/L2-여수-해양관광-AI가시성진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260909-yeosu-deep.json',
    category: 'tourism_healing',
    tags: ['여수밤바다', '해양관광', '오동도', '낭만포차'],
  },
  {
    slug: 'gwangyang-2026-09',
    title: '광양시 AI 가시성 심화 진단 보고서',
    subtitle: '세계 최대 제철소와 친환경 그린스틸 전환 — "포스코에 가려진 도시 브랜드와 공식 출처 통제율 2.0%"',
    unitId: 'lg-46230',
    unitName: '광양시',
    region: '전라남도',
    date: '2026-09-09',
    slots: 126,
    sovRate: '39.4%',
    controllabilityRate: '2.0%',
    groundingRate: '100.0%',
    keyStrengths: '포스코 광양제철소 · 매화축제',
    negativeAlert: '대기오염 환경 우려 · 포스코 종속',
    reportPath: 'docs/L2-광양-철강산업도시-AI가시성진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260909-gwangyang-deep.json',
    category: 'industry_military',
    tags: ['광양제철소', '그린스틸', '매화축제', '광양불고기'],
  },
  {
    slug: 'mokpo-2026-09',
    title: '목포시 AI 가시성 심화 진단 보고서',
    subtitle: '근대문화유산과 맛의 도시 — "역사·미식 경쟁력은 인정받았으나 인구 20만 붕괴와 관광 단조로움 고착"',
    unitId: 'lg-46110',
    unitName: '목포시',
    region: '전라남도',
    date: '2026-09-09',
    slots: 150,
    sovRate: '39.6%',
    controllabilityRate: '7.6%',
    groundingRate: '99.3%',
    keyStrengths: '목포9미 · 근대역사거리 · 해상케이블카',
    negativeAlert: '원도심 공동화 · 인구 20만 붕괴',
    reportPath: 'docs/L2-목포-근대문화미식-AI가시성진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260909-mokpo-deep.json',
    category: 'tourism_healing',
    tags: ['맛의도시', '목포9미', '근대역사거리', '해상케이블카'],
  },
  {
    slug: 'suwon-2026-09',
    title: '수원특례시 AI 가시성 심화 진단 보고서',
    subtitle: '120만 특례시 행정·복지 전달력과 수원화성 — "높은 정보 안정성과 복지 목욕권 환각 위험 공존"',
    unitId: 'lg-41110',
    unitName: '수원특례시',
    region: '경기도',
    date: '2026-09-07',
    slots: 270,
    sovRate: '75.0%',
    controllabilityRate: '12.5%',
    groundingRate: '100.0%',
    keyStrengths: '수원화성 · 청년기본소득 · 소상공인 특례보증',
    negativeAlert: '어르신 목욕권 복지 환각(Confabulation) 위험',
    reportPath: 'docs/L2-수원시-v22-종합진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260907-41110.json',
    category: 'metropolitan_admin',
    tags: ['수원특례시', '수원화성', '청년기본소득', '복지행정'],
  },
  {
    slug: 'hwaseong-2026-09',
    title: '화성시 AI 가시성 심화 진단 보고서',
    subtitle: '인구 100만 대도시 진입과 반도체·모빌리티 산업 — "첨단 신산업 인지도 대비 동서 격차와 교통 인프라 한계"',
    unitId: 'lg-41590',
    unitName: '화성시',
    region: '경기도',
    date: '2026-09-08',
    slots: 135,
    sovRate: '68.2%',
    controllabilityRate: '9.1%',
    groundingRate: '100.0%',
    keyStrengths: '동탄신도시 · 현대기아차 연구소 · 첨단반도체',
    negativeAlert: '동서 균형발전 격차 · 대중교통 부족',
    reportPath: 'docs/L2-화성시-v22-종합진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260908-41590.json',
    category: 'metropolitan_admin',
    tags: ['화성특례시', '동탄', '첨단반도체', '모빌리티'],
  },
  {
    slug: 'jeungpyeong-2026-09',
    title: '증평군 AI 가시성 심화 진단 보고서',
    subtitle: '군 개청 20년 스마트 자치와 휴양 벨포레 — "작은 면적을 극복한 웰빙 휴양 브랜드"',
    unitId: 'lg-43745',
    unitName: '증평군',
    region: '충청북도',
    date: '2026-09-07',
    slots: 135,
    sovRate: '52.4%',
    controllabilityRate: '15.8%',
    groundingRate: '100.0%',
    keyStrengths: '좌구산자연휴양림 · 에듀팜특구 벨포레',
    negativeAlert: '협소한 행정구역 · 광역 인지도 부족',
    reportPath: 'docs/L2-증평군-v22-종합진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260907-43745.json',
    category: 'tourism_healing',
    tags: ['증평군', '좌구산', '벨포레', '인삼축제'],
  },
  {
    slug: 'jeju-2026-09',
    title: '제주특별자치도 AI 가시성 심화 진단 보고서',
    subtitle: '글로벌 관광수도와 한·영 언어 간 가시성 격차 — "한국어 관광 독점 대비 영문 글로벌 SoV 격차 존재"',
    unitId: 'lg-50000',
    unitName: '제주특별자치도',
    region: '제주특별자치도',
    date: '2026-09-08',
    slots: 510,
    sovRate: '88.5%',
    controllabilityRate: '14.2%',
    groundingRate: '100.0%',
    keyStrengths: '유네스코 세계자연유산 · 사계절 힐링 관광',
    negativeAlert: '오버투어리즘 · 물가 및 렌터카 바가지',
    reportPath: 'docs/L2-제주특별자치도-v22-종합진단-2026-09.md',
    jsonPath: 'docs/aeo-measurements/m-20260908-jeju.json',
    category: 'tourism_healing',
    tags: ['제주도', '유네스코', '글로벌관광', '영문화분석'],
  },
  {
    slug: 'strategy-2026-09',
    title: '지방자치단체 AEO/GEO 대응 종합 전략 보고서',
    subtitle: '인공지능 검색 시대, 지역 경쟁력과 디지털 정보주권 확보를 위한 종합 전략 (2026년 9월판)',
    unitName: '전국 5개 도시 실측 종합',
    region: '전국 공통',
    date: '2026-09-09',
    slots: 1062,
    sovRate: '도시별 비교',
    controllabilityRate: '0.95% ~ 20.1%',
    groundingRate: '100.0%',
    keyStrengths: '방치 시 -288억 손실 vs 대응 시 +316.8억 효익 시나리오',
    negativeAlert: '인공지능 검색 보편화 시 디지털 소외 위험',
    reportPath: 'docs/AEO-GEO-지자체대응-종합전략보고서-2026-09.md',
    category: 'strategy_playbook',
    tags: ['종합전략', 'AEO', 'GEO', '경제효과추정', '3분브리핑'],
  },
  {
    slug: 'playbook-2026-09',
    title: '지방자치단체 AEO/GEO 실전 대응 통합 실행 매뉴얼',
    subtitle: '인공지능 검색 시대의 디지털 정보주권 확보 및 도시 브랜드 선점 전략 (실행 플레이북)',
    unitName: '실전 대응 매뉴얼',
    region: '전국 공통',
    date: '2026-09-09',
    slots: 531,
    sovRate: '실천 지침',
    controllabilityRate: '비용 0원 처방',
    groundingRate: '표준 규격',
    keyStrengths: '3단계 로드맵 (D+7/30/90) · Schema.org 4종 · 10개조 표준 조례안',
    negativeAlert: '이미지·PDF 중심 누리집의 기계 가독성 붕괴',
    reportPath: 'docs/지자체-AEO-GEO-실전대응-통합매뉴얼.md',
    category: 'strategy_playbook',
    tags: ['실전매뉴얼', '표준조례안', 'Schema.org', 'robots.txt', '3단계로드맵'],
  },
];

export function getReportBySlug(slug: string): DiagnosticReportMeta | undefined {
  return DIAGNOSTIC_REPORTS.find(r => r.slug === slug);
}

export function getReportByUnitId(unitId: string): DiagnosticReportMeta | undefined {
  return DIAGNOSTIC_REPORTS.find(r => r.unitId === unitId);
}

export function getReportsByCategory(category: string): DiagnosticReportMeta[] {
  if (category === 'all') return DIAGNOSTIC_REPORTS;
  return DIAGNOSTIC_REPORTS.filter(r => r.category === category);
}
