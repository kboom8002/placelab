// lib/jeongdap/constants.ts
// 출처:
// - jeongdap-note-repo-docs-v1.1/CHANGES-v1.1.md (D93, D94, D103, D108, D110)
// - jeongdap-note-repo-docs-v1.1/docs/methodology/01_measurement-methodology-v1.0.md ~ 04_active-outcome-measurement-and-weekly-diagnosis.md
// - jeongdap-note-repo-docs-v1.1/measurement/judge_auto.py, observe_weekly.py
// - docs/adr/0014 ~ 0024

export const JEONGDAP_METHOD_VERSION = 'jeongdap-v1.0' as const;
export const JEONGDAP_PRECISION_PROFILE_ID = 'jeongdap-precision-v1' as const;
export const JEONGDAP_PRECISION_MODEL = 'gpt-5' as const;

// ─── 모집단 정본 상수 (ADR-0022, D110, U-2) ───
export const METRO_UNIT_COUNT = 16; // 2026-07-01 전남광주통합특별시 출범 반영
export const BASIC_UNIT_COUNT_2025 = 226; // gazetteer.csv 기준
export const BASIC_UNIT_COUNT_2026_INCHEON = 227; // 2026-07 인천 개편(제물포·영종·검단 신설, 중구·동구 폐지) 반영 잠정
export const SPECIAL_ZONE_COUNT = 6; // A형 특별구역 (기술 접근성 전용)

export const JEONGDAP_POPULATIONS = ['metro', 'basic', 'special_zone'] as const;
export const JEONGDAP_UNIT_KINDS = ['national', 'metro', 'basic', 'emd', 'special_zone'] as const;

// ─── 측정 층 및 패널 규모 (methodology/03 골디락스, D109) ───
export const PANEL_TOTAL_QUESTIONS = 550;
export const PANEL_COMPOSITION = {
  national_rep: 100, // 국가 대표 100
  civic_admin: 200,  // 생활 행정 200
  local_culture: 200, // 지역 문화 200
  placebo: 30,       // 위약 30
  anchor: 20,        // 고정 20
} as const;

export const CORE_SCAN_QUESTIONS = 60; // 고위험 30 + 고빈도 30
export const CORE_SCAN_REPS = 3;
export const PANEL_REPS_PER_DAY = 3;
export const PANEL_DAYS_PER_BLOCK = 3;
export const PANEL_TOTAL_REPS = 9; // 3회 × 3일 = 9회

// ─── 안정성 및 주 결과 임계값 (ADR-0024, methodology/01·02, judge_auto.py L80-86) ───
export const ITEM_PRIMARY_SUCCESS_MIN_REPS = 2; // 3회 중 2회 이상 공식 첫 인용 시 문항 성공
export const ITEM_PRIMARY_BLOCK_REPS = 3;
export const PANEL_STABILITY_MAX_DIFF_REPS = 2; // 9회 중 다수 판정과 다른 횟수 2회 이하 통과
export const H1_BLOCK_AGREEMENT_MIN = 0.8;      // 독립 3일 블록 간 일치도 0.8 미만 시 재검토
export const H3_AUTO_HUMAN_KAPPA_MIN = 0.7;     // 자동-사람 4단 판정 카파 0.7 이상
export const H5_CREW_OPS_AGREEMENT_MIN = 0.8;   // 시민 확인단 2인 합의 vs 운영팀 일치율 0.8 이상
export const H5_MIN_CREW_COUNT = 15;            // 확인단 15명 미만 시 H5 보류

// ─── 위약(Placebo) 거짓 양성 중단 규칙 (methodology/01·02, H2) ───
export const PLACEBO_CATEGORY_HOLD_RATE = 0.05; // 종류별 거짓 양성 5% 이상 시 해당 해석 보류
export const PLACEBO_GLOBAL_STOP_RATE = 0.10;   // 위약 거짓 양성 10% 이상 시 등장 판정 전체 보류

// ─── 도구 반환 목록 누락 중단 규칙 (methodology/02, §10 source-stages) ───
export const TOOL_SOURCES_MISSING_HOLD_RATE = 0.05; // 도구 반환 목록 누락 5% 초과 시 1단 보류

// ─── 상시 관측 4주 12회 창 상태 임계값 (ADR-0024, methodology/04 L205-207, observe_weekly.py L157-161) ───
export const WINDOW_WEEKS = 4;
export const WINDOW_MAX_OBSERVATIONS = 12; // 월·수·금 × 4주
export const WINDOW_STABLE_MIN_HITS = 9;   // 안정: 4주 12회 중 9회 이상
export const WINDOW_OCCASIONAL_MIN_HITS = 3; // 가끔: 3–8회
export const WINDOW_NEW_THIS_WEEK_MIN_HITS = 2; // 신규: 지난 3주 0회 ∧ 이번 주 2회 이상
export const WINDOW_VANISHED_PREV3W_MIN_HITS = 6; // 소멸: 이전 3주 합계 6회 이상 ∧ 최근 2주 연속 0회
export const WINDOW_VANISHED_ZERO_WEEKS = 2;

// ─── 지명 사전 매칭 문맥 창 (observe_weekly.py L123) ───
export const GAZETTEER_CONTEXT_CHARS = 20; // 동명(중구·서구 등) 해소용 앞 20자 시·도 문맥

// ─── 전국 공식 근거 3구간(밴드) 정본 이름 및 예시 경계 (ADR-0018, D94, methodology/01) ───
export const BAND_LABELS = {
  high: '공식 근거 많음',
  mid: '보통',
  low: '공식 근거 적음',
} as const;

export const DEFAULT_BAND_THRESHOLDS = {
  highMinRate: 0.70, // 70% 이상 (2027-01 2차 사전 등록으로 최종 잠금 전 예시 경계)
  midMinRate: 0.40,  // 40% 이상 ~ 70% 미만
} as const;

// ─── 공개 시점 게이트 (INV-17, methodology/02 공표 약속) ───
export const NAMED_UNIT_PUBLICATION_EARLIEST_DATE = '2027-03-01' as const;

// ─── 정비·알리기 사건 유형 코드 (product/05 L64, methodology/04) ───
export const REPAIR_EVENT_DEFENSE_CODES = {
  F: '본문 형식 (표·목록·기계 가독 구조화)',
  T: '제목·첫 문단 핵심 요약 배치',
  Q: '자주 묻는 질문(FAQ) 요약 추가',
  D: '중복·상충 문서 정합화',
  U: '오래된 수치·기한·연락처 갱신',
  A: '고정 주소(퍼머링크) 부여',
  S: '사이트 기술 접근성(robots·사이트맵) 개선',
  L: '외부 안내·산하 기관 협조 요청',
  N: '공급 공백 항목 신규 문서 작성',
} as const;

export const REPAIR_EVENT_ACTIVE_CODES = {
  M: '지역 핵심 소개 메시지 정리',
  E: '축제·행사 공식 안내 페이지 개설',
  P: '주요 정책·지원 사업 전용 페이지 개설',
  G: '다국어(영·일·중) 공식 안내 추가',
  R: '공공 포털·관광 데이터 등재',
  W: '공개 지식베이스·위키 근거 연결',
} as const;

// ─── 신고판 범위 제외 카테고리 (INV-18, methodology/01 L112, L226) ───
export const OUT_OF_SCOPE_REPORT_CATEGORIES = [
  'government_stance', // 정부·지자체 정치적 입장·평가 영역
  'disaster_emergency', // 재난·응급 실시간 상황 (공개 지표·신고판 제외)
  'private_business',   // 개별 영리 업소·상점 홍보/분쟁
] as const;

// ─── 공개 화면(Phase 1) 표시용 정본 메타데이터 상수 ───
export const STABILITY_TOTAL_RUNS = PANEL_TOTAL_REPS;
export const STABILITY_MAX_DIFF_FROM_MODE = PANEL_STABILITY_MAX_DIFF_REPS;

export const POPULATION_COUNTS = {
  metro: METRO_UNIT_COUNT,
  basic_2025_gazetteer: BASIC_UNIT_COUNT_2025,
  basic_2026_07: BASIC_UNIT_COUNT_2026_INCHEON,
  special_zone: SPECIAL_ZONE_COUNT,
} as const;

export const QUESTION_PANEL_COUNTS = {
  total_panel: PANEL_TOTAL_QUESTIONS,
  national_rep: PANEL_COMPOSITION.national_rep,
  living_admin: PANEL_COMPOSITION.civic_admin,
  local_culture: PANEL_COMPOSITION.local_culture,
  placebo: PANEL_COMPOSITION.placebo,
  fixed: PANEL_COMPOSITION.anchor,
  core_60: CORE_SCAN_QUESTIONS,
} as const;

export const WEEKLY_OBSERVATION_COUNTS = {
  mon_wed_fri_per_day: 270,
  tue_identity_named: 243,
  window_weeks: WINDOW_WEEKS,
  window_runs: WINDOW_MAX_OBSERVATIONS,
} as const;

export const PANEL_5_UNITS = [
  { site_id: 'GURO', sgg_code: '11530', name_ko: '서울 구로구', stratum: '수도권 대도시 자치구 (16개 동)' },
  { site_id: 'SUWON', sgg_code: '41110', name_ko: '경기 수원시', stratum: '수도권 특례시 (44개 동)' },
  { site_id: 'HWASEONG', sgg_code: '41590', name_ko: '경기 화성시', stratum: '100만 도농복합 신도시 (28개 읍·면·동)' },
  { site_id: 'JEUNGPYEONG', sgg_code: '43745', name_ko: '충북 증평군', stratum: '비수도권 소규모 군 (2개 읍·면)' },
  { site_id: 'GWANGJU_SEO', sgg_code: '29140', name_ko: '전남광주 광주 서구', stratum: '통합특별시 자치구 (18개 동)' },
] as const;

export const BAND_META = {
  high: {
    id: 'high',
    label_ko: BAND_LABELS.high,
    shape: '●',
    description: '1차 측정 고정 경계선 이상 구간. 구간 내부는 순위 없이 가나다순으로만 표기합니다.',
  },
  mid: {
    id: 'mid',
    label_ko: BAND_LABELS.mid,
    shape: '▲',
    description: '1차 측정 고정 경계선 중간 구간. 구간 내부는 순위 없이 가나다순으로만 표기합니다.',
  },
  low: {
    id: 'low',
    label_ko: BAND_LABELS.low,
    shape: '◆',
    description: '1차 측정 고정 경계선 미만 구간. 공식 문서 보강 또는 접근성 점검이 필요한 구간입니다.',
  },
} as const;

export const WINDOW_STATE_META = {
  안정: {
    state: '안정',
    label: '안정',
    shape: '●',
    rule_summary: '최근 4주 12회 중 9회 이상 등장',
    public_list_allowed: true,
  },
  신규: {
    state: '신규',
    label: '신규',
    shape: '◆',
    rule_summary: '이번 주 2회 이상 등장 & 이전 3주 0회',
    public_list_allowed: true,
  },
  가끔: {
    state: '가끔',
    label: '가끔',
    shape: '▲',
    rule_summary: '최근 4주 12회 중 3~8회 등장',
    public_list_allowed: false,
  },
  소멸: {
    state: '소멸',
    label: '소멸',
    shape: '○',
    rule_summary: '이전 3주 6회 이상 등장 후 최근 2주 연속 0회',
    public_list_allowed: false,
  },
  드묾: {
    state: '드묾',
    label: '드묾',
    shape: '·',
    rule_summary: '최근 4주 12회 중 1~2회 단발 등장 (공개 카드 제외)',
    public_list_allowed: false,
  },
} as const;

export const ACTIVE_CATEGORIES_12 = [
  { code: 'ACT-01', label_ko: '아이와 주말 나들이·체험', examples: '아이와 주말에 당일치기로 가볼 만한 과학·생태 체험지가 있는 지역은?' },
  { code: 'ACT-02', label_ko: '계절 축제·전통 장터', examples: '가을에 지역 특산물 축제가 열리는 고장은 어디인가요?' },
  { code: 'ACT-03', label_ko: '귀농·귀촌 정착 지원', examples: '초보 귀농인을 위한 임시 주거와 영농 교육 지원이 잘 되어 있는 군은?' },
  { code: 'ACT-04', label_ko: '청년 창업·주거 지원', examples: '청년 1인 가구 월세 지원과 창업 공간 지원이 활발한 지자체는?' },
  { code: 'ACT-05', label_ko: '출산·육아 돌봄 혜택', examples: '첫째·둘째 출산장려금과 공공 산후조리 지원이 있는 시·군은?' },
  { code: 'ACT-06', label_ko: '워케이션·원격근무 체류', examples: '바다나 숲 근처에서 한 달 살기·워케이션 지원 프로그램을 운영하는 지역은?' },
  { code: 'ACT-07', label_ko: '반려동물 동반 여행', examples: '반려견과 함께 갈 수 있는 공공 놀이터와 해변·산책로가 잘 갖춰진 지역은?' },
  { code: 'ACT-08', label_ko: '무장애(배리어프리) 관광', examples: '휠체어나 유모차로 이동하기 편한 무장애 산책길과 관광지가 있는 도시는?' },
  { code: 'ACT-09', label_ko: '역사·국가유산 답사', examples: '성곽이나 고택 등 야간 국가유산 답사 프로그램이 유명한 지역은?' },
  { code: 'ACT-10', label_ko: '향토 음식·로컬 미식', examples: '지리적 표시제 특산물과 전통 시장 먹거리가 유명한 바닷가 고장은?' },
  { code: 'ACT-11', label_ko: '걷기길·자전거 코스', examples: '해안 둘레길이나 강변 자전거도로가 잘 정비된 지자체는?' },
  { code: 'ACT-12', label_ko: '고향사랑기부제 답례품', examples: '고향사랑기부제 답례품으로 지역 농수산물 구성이 알찬 지자체는?' },
] as const;

export const PUBLICATION_STATE_LABELS = {
  before_measurement: '측정 전',
  measuring: '측정 중',
  published: '발행됨',
  corrected: '정정됨',
} as const;

export const UNMEASURED_REGION_NOTICE =
  '전국 243개 지방자치단체 전수 코어 60문항 정밀 측정은 2027년 3월 공개 예정이며, 측정 완료 전까지 해당 지역은 「측정 전」 상태로 정직하게 표기합니다 (INV-17).' as const;

export const CULTURE_TRACK_DISCLAIMER =
  '이 트랙은 탐색적 민간 공익 측정이며, 정부 공식 인증이나 순위가 아닙니다.' as const;

export const CITIZEN_VERIFIER_POLICY = {
  min_age: 19,
  hourly_wage_krw: 15000,
  max_monthly_hours: 15,
  sample_ratio: 0.02,
} as const;

export const SCOPE_EXCLUSION_NOTICE =
  '정치인·선출직 후보자·정당 평가, 개별 상업 업소(식당·숙박·병원) 평점 및 순위, 의학적 진단·법률 자문, 실시간 재난·응급 경보는 본 플랫폼의 측정 및 제보 대상에서 엄격히 제외합니다 (INV-18).' as const;

export const PRINCIPLE_A_DISCLOSURE =
  '모두의 정답노트(Jeongdap Note)는 측정의 독립성을 지키기 위해 측정 대상 지자체·공공기관에 정비·컨설팅·개선 대행·VIP 진단 상품을 유상으로 판매하거나 무상으로 제공하지 않습니다 (A원칙 · D76 · INV-14).' as const;

