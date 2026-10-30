// lib/kbrandlab/local/constants.ts
// 로컬레이다 (LocalRadar · 소상공인 AI 로컬 탐색 스캔) 상수 및 3대 초기 코호트 시드
// 근거: ADR-0025, PRD FR-93 ~ FR-96

import type {
  HighRiskFactKey,
  LocalCohort,
  LocalCohortId,
  LocalDiscoveryProbe,
  LocalLanguage,
  LocalShop,
} from './types';

export const LOCAL_RADAR_BRAND_NAME = '로컬레이다' as const;
export const LOCAL_RADAR_BRAND_NAME_EN = 'LocalRadar' as const;
export const LOCAL_RADAR_SUBTITLE = '소상공인 AI 로컬 탐색 스캔' as const;
export const LOCAL_RADAR_METHOD_VERSION = 'localradar-v1.0' as const;

export const LOCAL_LANGUAGES: readonly { code: LocalLanguage; label: string }[] = [
  { code: 'ko', label: '한국어 (KO)' },
  { code: 'en', label: 'English (EN)' },
  { code: 'ja', label: '日本語 (JA)' },
  { code: 'zh-Hans', label: '简体中文 (ZH)' },
] as const;

export const HIGH_RISK_FACT_DEFINITIONS: readonly {
  key: HighRiskFactKey;
  label: string;
  description: string;
  questionTemplate: string;
}[] = [
  {
    key: 'hours_holiday',
    label: '영업시간 · 정기휴무',
    description: '오픈·마감 시각, 브레이크타임, 정기휴무 요일 (오답 시 고객 헛걸음 직결)',
    questionTemplate: '{region} {shopName}의 정확한 영업시간과 정기휴무일, 브레이크타임을 알려주세요.',
  },
  {
    key: 'price_menu',
    label: '대표 가격 · 구성',
    description: '대표 메뉴·객실·체험·시술 기본 가격과 필수 추가 요금',
    questionTemplate: '{region} {shopName}의 대표 이용 가격(메뉴·객실·프로그램)과 기본 구성을 알려주세요.',
  },
  {
    key: 'booking_method',
    label: '예약 · 워크인 조건',
    description: '사전 예약 필수 여부, 당일 현장 방문(워크인) 가능 여부, 공식 예약 채널',
    questionTemplate: '{region} {shopName} 방문 시 사전 예약이 필수인가요, 당일 현장 방문이 가능한가요? 예약 방법도 알려주세요.',
  },
  {
    key: 'parking_access',
    label: '주차 · 대중교통 접근',
    description: '전용 주차장 유무, 인근 공영주차장 안내, 대중교통 도보 접근 시간',
    questionTemplate: '{region} {shopName}에 전용 주차장이 있나요? 대중교통이나 차량 방문 시 주차 방법을 알려주세요.',
  },
  {
    key: 'pet_kids_policy',
    label: '반려동물 · 아동 · 다국어 규정',
    description: '반려동물 동반 가능 여부, 영유아 동반 시설, 외국인 다국어 안내 여부',
    questionTemplate: '{region} {shopName}에 반려동물이나 영유아 동반이 가능한가요? 외국인 방문객 안내 여부도 알려주세요.',
  },
] as const;

/**
 * 3대 초기 상권 코호트 정의 (결정 1·2 반영: 서귀포 · 강남 · 은평구 + 향후 공기업·지역재단 스폰서십 허용)
 */
export const LOCAL_COHORTS: Record<LocalCohortId, LocalCohort> = {
  SEOGWIPO_STAY: {
    cohortId: 'SEOGWIPO_STAY',
    name: '서귀포 스테이·로컬체험 코호트',
    regionLabel: '제주 서귀포시',
    sectorLabel: '숙박 · 감귤/다도 체험 · 로컬 다이닝',
    description:
      '서귀포 독채 스테이, 감귤·다도 체험농장, 로컬 해산물 식탁·베이커리를 찾는 내·외국인 여행객의 AI 탐색 질문 스캔 코호트입니다.',
    sponsorStatus: 'self_funded',
    sponsorOrgName: null,
    allowFuturePublicCorpSponsor: true,
    disclosureNote:
      '민간 소상공인 구독 트랙입니다. 향후 공기업(JDC 등)·지역관광재단이 상권 코호트 스폰서로 참여할 경우 이해관계 공시(/disclosure)에 후원 주체와 범위를 투명하게 병기하며, 지자체 본청 공익 측정과는 데이터 방화벽으로 완전 분리됩니다.',
    monthlyPriceKrw: 39000,
    precisionPackPriceKrw: 149000,
  },
  GANGNAM_SMB: {
    cohortId: 'GANGNAM_SMB',
    name: '강남 뷰티·클리닉·웰니스 코호트',
    regionLabel: '서울 강남구',
    sectorLabel: 'K-뷰티 · 피부과/클리닉 · 웰니스 스튜디오',
    description:
      '방한 외국인과 국내 소비자의 로컬 탐색이 집중되는 강남 K-뷰티·피부과/클리닉·웰니스 소상공인 코호트입니다. 의료기관은 시술 효과 비교 없이 진료시간·다국어 응대·예약·면허 표기 등 객관 운영 사실만 대조합니다.',
    sponsorStatus: 'self_funded',
    sponsorOrgName: null,
    allowFuturePublicCorpSponsor: true,
    disclosureNote:
      '의료법 제56조 및 저장소 불변식(INV-3)에 따라 의료기관의 치료 효과 비교·서열 표시를 일절 하지 않으며, 진료시간·휴진일·외국어 코디네이터 상주 여부·공식 예약 채널 등 객관적 운영 정본만 스캔합니다.',
    monthlyPriceKrw: 49000,
    precisionPackPriceKrw: 190000,
  },
  EUNPYEONG_LOCAL: {
    cohortId: 'EUNPYEONG_LOCAL',
    name: '은평구 골목상권·생활밀착 소상공인 코호트',
    regionLabel: '서울 은평구',
    sectorLabel: '은평한옥마을 · 연서시장 · 불광천 골목상권',
    description:
      '은평한옥마을·연서시장·불광천·증산동 일대의 로컬 베이커리, 목공방, 독립서점, 전통 손두부·화덕요리 소상공인을 위한 생활밀착 AI 로컬 탐색 스캔 코호트입니다.',
    sponsorStatus: 'self_funded',
    sponsorOrgName: null,
    allowFuturePublicCorpSponsor: true,
    disclosureNote:
      '은평구 골목상권 민간 소상공인 트랙입니다. 향후 상권활성화재단·소상공인지원기관의 바우처·스폰서십 연계가 가능하며, 은평구청 행정 공익 측정(모두의 정답노트)과는 독립 운영됩니다.',
    monthlyPriceKrw: 29000,
    precisionPackPriceKrw: 99000,
  },
};

/**
 * 코호트별 공유 소비자 로컬 탐색 질문 (Layer A: 1:N 공유 스캔)
 */
export const LOCAL_DISCOVERY_PROBES: readonly LocalDiscoveryProbe[] = [
  // ── 1. 서귀포 코호트 (SEOGWIPO_STAY) ──
  {
    probeId: 'SGW-DISC-01',
    cohortId: 'SEOGWIPO_STAY',
    intentCategory: '독채 숙소 · 조용한 휴식',
    questions: {
      ko: '서귀포에서 가족이나 연인이 조용히 머물기 좋은 독채 스테이와 차 마시기 좋은 로컬 공간을 알려주세요.',
      en: 'What are some quiet private stay houses and local tea spaces in Seogwipo, Jeju for couples or families?',
      ja: '済州島の西帰浦（ソギポ）で静かに滞在できる一棟貸しステイやローカルのお茶空間を教えてください。',
      'zh-Hans': '请介绍济州岛西归浦适合安静入住的独栋民宿和当地茶室空间。',
    },
  },
  {
    probeId: 'SGW-DISC-02',
    cohortId: 'SEOGWIPO_STAY',
    intentCategory: '감귤 체험 · 로컬 베이커리',
    questions: {
      ko: '서귀포에서 우천 시에도 가능한 감귤·다도 체험 농장과 근처 로컬 감귤 베이커리를 추천해 주세요.',
      en: 'Can you suggest tangerine or tea experiences available on rainy days in Seogwipo, plus a local tangerine bakery nearby?',
      ja: '西帰浦で雨の日でも楽しめるみかん・茶道体験農園と、近くのローカルみかんベーカリーを教えてください。',
      'zh-Hans': '西归浦有哪些下雨天也能参加的柑橘茶道体验农场，以及附近的当地柑橘烘焙店？',
    },
  },
  {
    probeId: 'SGW-DISC-03',
    cohortId: 'SEOGWIPO_STAY',
    intentCategory: '로컬 해산물 · 예약 식탁',
    questions: {
      ko: '서귀포 법환동·보목동 인근에서 당일 해산물로 운영하는 로컬 식탁이나 예약제 식당이 어디인가요?',
      en: 'Where can I find reservation-based local seafood dining spots around Beophwan-dong or Bomok-dong in Seogwipo?',
      ja: '西帰浦の法還洞・甫木洞周辺で新鮮な海産物を使った予約制ローカル食堂はどこにありますか？',
      'zh-Hans': '西归浦法还洞或甫木洞附近有哪些使用当日海鲜的预约制本地餐厅？',
    },
  },

  // ── 2. 강남 코호트 (GANGNAM_SMB) ──
  {
    probeId: 'GNM-DISC-01',
    cohortId: 'GANGNAM_SMB',
    intentCategory: '외국인 친화 피부과 · 클리닉 운영 정보',
    questions: {
      ko: '서울 강남 신사·압구정 인근에서 영어·일본어 상담이 가능하고 사전 예약제로 운영하는 피부과 의원을 알려주세요.',
      en: 'Which dermatology clinics near Sinsa or Apgujeong in Gangnam offer English consultation and operate by appointment?',
      ja: 'ソウル江南（新沙・狎鴎亭）周辺で日本語・英語対応があり予約制で運営している皮膚科クリニックを教えてください。',
      'zh-Hans': '首尔江南新沙、狎鸥亭附近有哪些支持外语咨询且实行预约制的皮肤科诊所？',
    },
  },
  {
    probeId: 'GNM-DISC-02',
    cohortId: 'GANGNAM_SMB',
    intentCategory: 'K-뷰티 헤어·메이크업 · 웨딩/여행객',
    questions: {
      ko: '강남 청담동에서 외국인 여행객도 예약 가능한 K-뷰티 헤어·메이크업 살롱과 영업시간을 알려주세요.',
      en: 'What K-beauty hair and makeup salons in Cheongdam-dong, Gangnam accept foreign visitor bookings, and what are their hours?',
      ja: '江南・清潭洞で外国人旅行者も予約できるKビューティーのヘアメイクサロンと営業時間を教えてください。',
      'zh-Hans': '请介绍江南清潭洞支持外国游客预约的K-Beauty美发化妆沙龙及营业时间。',
    },
  },
  {
    probeId: 'GNM-DISC-03',
    cohortId: 'GANGNAM_SMB',
    intentCategory: '웰니스 스파 · 체형교정 필라테스',
    questions: {
      ko: '강남 역삼·삼성동 근처에서 직장인이나 방문객이 1:1로 이용할 수 있는 프라이빗 스파와 필라테스 스튜디오를 알려주세요.',
      en: 'Where are private wellness spas and 1-on-1 pilates studios near Yeoksam or Samseong-dong in Gangnam?',
      ja: '江南の駅三・三成洞近くで1対1で利用できるプライベートスパやピラティススタジオを教えてください。',
      'zh-Hans': '江南驿三洞、三成洞附近有哪些提供一对一服务的私密水疗和普拉提工作室？',
    },
  },

  // ── 3. 은평구 코호트 (EUNPYEONG_LOCAL) ──
  {
    probeId: 'EPG-DISC-01',
    cohortId: 'EUNPYEONG_LOCAL',
    intentCategory: '은평한옥마을 베이커리 · 공방 체험',
    questions: {
      ko: '서울 은평한옥마을과 진관동 인근에서 주차가 가능하고 북한산 전망을 볼 수 있는 베이커리 카페와 목공 체험공방을 알려주세요.',
      en: 'What bakery cafes with Bukhansan views and woodworking craft studios with parking are near Eunpyeong Hanok Village?',
      ja: 'ソウル恩平韓屋村（津寛洞）周辺で駐車場があり北漢山の景色が見えるベーカリーカフェや木工体験工房を教えてください。',
      'zh-Hans': '首尔恩平韩屋村附近有哪些可以停车、能看到北汉山景色的烘焙咖啡馆和木工体验工坊？',
    },
  },
  {
    probeId: 'EPG-DISC-02',
    cohortId: 'EUNPYEONG_LOCAL',
    intentCategory: '연서시장 전통 손두부 · 로컬 외식',
    questions: {
      ko: '은평구 연서시장이나 증산동 골목에서 국산 콩 수제 손두부 매장이나 가족 외식하기 좋은 화덕피자 식당을 알려주세요.',
      en: 'Where can I find handmade tofu shops in Yeonseo Market or family-friendly wood-fired pizza restaurants in Eunpyeong-gu?',
      ja: '恩平区の延曙市場の手作り豆腐店や、繒山洞周辺で家族で食事しやすい石窯ピザ食堂を教えてください。',
      'zh-Hans': '恩平区延曙市场有哪些手工豆腐店，或者缯山洞胡同里适合家庭聚餐的窑烤披萨餐厅？',
    },
  },
  {
    probeId: 'EPG-DISC-03',
    cohortId: 'EUNPYEONG_LOCAL',
    intentCategory: '불광천 산책 · 독립서점 북카페',
    questions: {
      ko: '은평구 불광천 산책로 근처에서 늦은 저녁까지 여는 독립책방이나 조용히 책 읽기 좋은 로컬 서점이 어디인가요?',
      en: 'Which independent bookshops or quiet local book cafes near Bulgwangcheon Stream in Eunpyeong-gu stay open into the evening?',
      ja: '恩平区の仏光川散策路の近くで夜まで営業している独立書店や静かなブックカフェはどこですか？',
      'zh-Hans': '恩平区佛光川步道附近有哪些营业到晚上的独立书店或安静的本地书吧？',
    },
  },
];

/**
 * 3대 코호트 소속 가게 실명 시드 (결정 4 반영: 가게 실명까지 표시하되 코호트 내 가나다순 고정)
 */
export const LOCAL_SHOPS: readonly LocalShop[] = [
  // =========================================================================
  // 1. 서귀포 코호트 (SEOGWIPO_STAY) — 가나다순 5곳
  // =========================================================================
  {
    shopId: 'shop-sgw-01',
    cohortId: 'SEOGWIPO_STAY',
    shopCode: 'SGW-001',
    shopName: '감귤꽃다락',
    category: '감귤·다도 체험농장',
    neighborhood: '서귀포시 남원읍',
    aliases: ['감귤꽃 다락', '서귀포 감귤꽃다락', 'Gamgyul Flower Attic'],
    disambiguationTokens: ['서귀포', '남원읍', '제주', '감귤'],
    canonicalDomain: 'gamgyulattic.kr',
    placeUrl: 'https://place.map.kakao.com/sgw-gamgyulattic',
    bookingUrl: 'https://gamgyulattic.kr/reserve',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '10:00~18:00 (매주 수요일 정기휴무, 우천 시 실내 다도 체험 정상 운영)',
        acceptableTokens: ['10:00', '18:00', '수요일'],
        forbiddenTokens: ['연중무휴', '화요일 휴무', '20:00'],
        sourceUrl: 'https://gamgyulattic.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '감귤청·다도 클래스 1인 28,000원 (어린이 18,000원)',
        acceptableTokens: ['28,000원', '28000'],
        forbiddenTokens: ['무료', '10,000원'],
        sourceUrl: 'https://gamgyulattic.kr/program',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '공식 누리집 및 네이버 예약 필수 (정원 잔여 시 당일 전화 후 워크인 가능)',
        acceptableTokens: ['예약', '누리집'],
        forbiddenTokens: ['예약 불가'],
        sourceUrl: 'https://gamgyulattic.kr/reserve',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '농장 앞 전용 무료 주차장 12대 가능',
        acceptableTokens: ['전용', '주차', '무료'],
        forbiddenTokens: ['주차 불가', '유료 주차만'],
        sourceUrl: 'https://gamgyulattic.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '영유아 동반 환영(유아의자 구비), 야외 정원 케이지·목줄 착용 시 반려견 동반 가능, 영·일 안내문 비치',
        acceptableTokens: ['영유아', '반려견', '영어'],
        forbiddenTokens: ['노키즈존', '반려동물 절대 불가'],
        sourceUrl: 'https://gamgyulattic.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, true, false, true, true, true, true, true, true], // 11/12 -> 안정
      en: [false, false, false, false, false, false, true, true, true, false, true, false], // 전반0, 후반4 -> 신규
      ja: [false, true, false, true, false, false, true, false, true, false, true, false], // 5/12 -> 가끔
      'zh-Hans': [false, false, false, false, false, false, true, false, false, true, false, false], // 2/12 -> 드묾
    },
  },
  {
    shopId: 'shop-sgw-02',
    cohortId: 'SEOGWIPO_STAY',
    shopCode: 'SGW-002',
    shopName: '동백숲독채스테이',
    category: '프라이빗 독채 숙소',
    neighborhood: '서귀포시 안덕면',
    aliases: ['동백숲 독채스테이', '서귀포 동백숲스테이', 'Camellia Forest Stay Seogwipo'],
    disambiguationTokens: ['서귀포', '안덕면', '제주', '독채'],
    canonicalDomain: 'camelliastay-jeju.kr',
    placeUrl: 'https://place.map.kakao.com/sgw-camelliastay',
    bookingUrl: 'https://camelliastay-jeju.kr/booking',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '체크인 16:00 / 체크아웃 11:00 (연중 운영, 매월 둘째 화요일 시설 점검 휴무)',
        acceptableTokens: ['16:00', '11:00'],
        forbiddenTokens: ['체크인 14:00', '체크아웃 13:00'],
        sourceUrl: 'https://camelliastay-jeju.kr/guide',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '기준 2인(최대 4인) 주중 1박 240,000원, 주말 280,000원 (인원 추가 1인 30,000원)',
        acceptableTokens: ['240,000원', '280,000원'],
        forbiddenTokens: ['100,000원', '무료 조식 뷔페'],
        sourceUrl: 'https://camelliastay-jeju.kr/rates',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '100% 사전 온라인 예약제 (당일 현장 워크인 입실 불가)',
        acceptableTokens: ['사전', '예약'],
        forbiddenTokens: ['당일 현장 워크인 가능'],
        sourceUrl: 'https://camelliastay-jeju.kr/booking',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '독채 마당 전용 주차 2대 가능 (완속 전기차 충전기 구비)',
        acceptableTokens: ['전용 주차', '전기차'],
        forbiddenTokens: ['주차장 없음'],
        sourceUrl: 'https://camelliastay-jeju.kr/guide',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '전 연령 아동 숙박 가능(아기침대 대여), 알레르기 예방을 위해 반려동물 동반 불가, 영·일·중 체크인 가이드 제공',
        acceptableTokens: ['아동', '반려동물 동반 불가'],
        forbiddenTokens: ['반려견 동반 가능 숙소'],
        sourceUrl: 'https://camelliastay-jeju.kr/guide',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, true, true, true, true, true, true, true, true], // 12/12 -> 안정
      en: [true, true, false, true, true, false, true, true, true, true, false, true], // 9/12 -> 안정
      ja: [true, false, true, true, false, true, true, true, false, true, true, true], // 9/12 -> 안정
      'zh-Hans': [false, true, false, false, true, false, true, false, true, false, true, false], // 5/12 -> 가끔
    },
  },
  {
    shopId: 'shop-sgw-03',
    cohortId: 'SEOGWIPO_STAY',
    shopCode: 'SGW-003',
    shopName: '법환바당식탁',
    category: '로컬 해산물 다이닝',
    neighborhood: '서귀포시 법환동',
    aliases: ['법환 바당식탁', '서귀포 법환바당식탁', 'Beophwan Badang Table'],
    disambiguationTokens: ['서귀포', '법환동', '제주', '바당'],
    canonicalDomain: 'badangtable.kr',
    placeUrl: 'https://place.map.kakao.com/sgw-badangtable',
    bookingUrl: 'https://badangtable.kr/reserve',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '11:30~21:00 (브레이크타임 15:00~17:30, 매주 월요일 정기휴무)',
        acceptableTokens: ['11:30', '21:00', '월요일'],
        forbiddenTokens: ['브레이크타임 없음', '일요일 휴무'],
        sourceUrl: 'https://badangtable.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '법환 해녀 뿔소라 솥밥 정식 22,000원, 제철 선어 한상 38,000원',
        acceptableTokens: ['22,000원', '38,000원'],
        forbiddenTokens: ['12,000원'],
        sourceUrl: 'https://badangtable.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '저녁 타임 캐치테이블·전화 예약 권장, 점심은 현장 대기(워크인) 병행',
        acceptableTokens: ['예약', '현장 대기'],
        forbiddenTokens: ['100% 워크인 불가'],
        sourceUrl: 'https://badangtable.kr/reserve',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '법환포구 공영주차장 무료 이용 (매장까지 도보 2분)',
        acceptableTokens: ['법환포구', '공영주차장'],
        forbiddenTokens: ['발렛파킹 전용'],
        sourceUrl: 'https://badangtable.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '아동 동반 가능(유아 식기 제공), 실내 반려동물 동반 불가(야외 테라스만 가능), 영·일·중 사진 메뉴판 구비',
        acceptableTokens: ['유아 식기', '테라스'],
        forbiddenTokens: ['실내 대형견 가능'],
        sourceUrl: 'https://badangtable.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, false, true, true, true, true, true, false, true, true, true], // 10/12 -> 안정
      en: [false, true, false, false, true, false, true, false, true, false, false, true], // 5/12 -> 가끔
      ja: [false, false, false, false, false, false, true, false, true, true, false, true], // 전반0, 후반4 -> 신규
      'zh-Hans': [false, false, false, false, false, false, false, true, false, false, true, false], // 2/12 -> 드묾
    },
  },
  {
    shopId: 'shop-sgw-04',
    cohortId: 'SEOGWIPO_STAY',
    shopCode: 'SGW-004',
    shopName: '서귀포파도소리차방',
    category: '로컬 티하우스',
    neighborhood: '서귀포시 보목동',
    aliases: ['파도소리차방', '서귀포 파도소리 차방', 'Padosori Tea Room'],
    disambiguationTokens: ['서귀포', '보목동', '제주', '차방'],
    canonicalDomain: 'padosoritea.kr',
    placeUrl: 'https://place.map.kakao.com/sgw-padosoritea',
    bookingUrl: 'https://padosoritea.kr/book',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '12:00~19:00 (매주 화·수요일 정기휴무)',
        acceptableTokens: ['12:00', '19:00', '화·수요일'],
        forbiddenTokens: ['09:00 오픈', '연중무휴'],
        sourceUrl: 'https://padosoritea.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '제주 유기농 세작·호지차 다과 코스 1인 19,000원',
        acceptableTokens: ['19,000원'],
        forbiddenTokens: ['8,000원'],
        sourceUrl: 'https://padosoritea.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '창가 다도석은 타임별 사전 예약제, 일반 바 좌석은 현장 워크인 가능',
        acceptableTokens: ['사전 예약', '워크인'],
        forbiddenTokens: ['전 좌석 예약 불가'],
        sourceUrl: 'https://padosoritea.kr/book',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '보목포구 공영주차장 이용 (도보 3분, 골목 내 주정차 불가)',
        acceptableTokens: ['보목포구', '공영주차장'],
        forbiddenTokens: ['매장 앞 20대 주차장'],
        sourceUrl: 'https://padosoritea.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '초등학생 이상 이용 권장(뜨거운 다기 취급 주의), 이동가방 동반 시 소형견 입장 가능, 영·일 다도 안내문 제공',
        acceptableTokens: ['다기', '소형견'],
        forbiddenTokens: ['대형견 오프리쉬 가능'],
        sourceUrl: 'https://padosoritea.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [false, true, false, true, false, true, true, false, true, false, true, false], // 6/12 -> 가끔
      en: [false, false, false, false, false, false, true, false, true, false, true, false], // 전반0, 후반3 -> 신규
      ja: [false, false, true, false, false, true, false, true, false, true, false, false], // 4/12 -> 가끔
      'zh-Hans': [false, false, false, false, false, false, false, false, true, false, false, false], // 1/12 -> 드묾
    },
  },
  {
    shopId: 'shop-sgw-05',
    cohortId: 'SEOGWIPO_STAY',
    shopCode: 'SGW-005',
    shopName: '하효감귤베이커리',
    category: '로컬 베이커리·카페',
    neighborhood: '서귀포시 하효동',
    aliases: ['하효 감귤베이커리', '서귀포 하효감귤빵집', 'Hahyo Tangerine Bakery'],
    disambiguationTokens: ['서귀포', '하효동', '쇠소깍', '감귤'],
    canonicalDomain: 'hahyobakery.kr',
    placeUrl: 'https://place.map.kakao.com/sgw-hahyobakery',
    bookingUrl: 'https://hahyobakery.kr/order',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '09:00~18:30 (빵 소진 시 조기 마감, 매주 목요일 정기휴무)',
        acceptableTokens: ['09:00', '18:30', '목요일'],
        forbiddenTokens: ['22:00 마감', '연중무휴'],
        sourceUrl: 'https://hahyobakery.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '하효 감귤 발효 소금빵 4,500원, 감귤 브리오슈 선물세트(6구) 26,000원',
        acceptableTokens: ['4,500원', '26,000원'],
        forbiddenTokens: ['1,500원'],
        sourceUrl: 'https://hahyobakery.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '상시 워크인 구매 가능, 선물세트는 전날 17시까지 스마트스토어·전화 픽업 예약 가능',
        acceptableTokens: ['워크인', '픽업 예약'],
        forbiddenTokens: ['예약 없이는 입장 불가'],
        sourceUrl: 'https://hahyobakery.kr/order',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '매장 옆 전용 주차장 8대 및 쇠소깍 공영주차장 도보 4분',
        acceptableTokens: ['전용 주차장', '쇠소깍'],
        forbiddenTokens: ['주차 불가'],
        sourceUrl: 'https://hahyobakery.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '전 연령 동반 가능, 야외 감귤밭 정원 좌석 반려동물 동반 가능, 영·중 알레르기 성분표 비치',
        acceptableTokens: ['전 연령', '정원 좌석'],
        forbiddenTokens: ['노키즈존'],
        sourceUrl: 'https://hahyobakery.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, false, true, true, true, true, true, true, false, true], // 10/12 -> 안정
      en: [false, true, false, true, false, false, true, false, true, true, false, false], // 5/12 -> 가끔
      ja: [false, false, false, true, false, false, false, true, false, false, true, false], // 3/12 -> 드묾
      'zh-Hans': [false, false, false, false, false, false, true, true, false, true, false, false], // 전반0, 후반3 -> 신규
    },
  },

  // =========================================================================
  // 2. 강남 코호트 (GANGNAM_SMB) — 가나다순 5곳
  // =========================================================================
  {
    shopId: 'shop-gnm-01',
    cohortId: 'GANGNAM_SMB',
    shopCode: 'GNM-001',
    shopName: '도산온더스킨의원',
    category: '피부과/클리닉 (의료법 준수)',
    neighborhood: '강남구 신사동',
    aliases: ['도산 온더스킨의원', '강남 도산온더스킨', 'Dosan OnTheSkin Clinic'],
    disambiguationTokens: ['강남', '신사동', '도산대로', '의원'],
    canonicalDomain: 'dosanontheskin.kr',
    placeUrl: 'https://place.map.kakao.com/gnm-dosanontheskin',
    bookingUrl: 'https://dosanontheskin.kr/appointment',
    isMedicalRegulated: true,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '진료시간 · 정기휴진',
        canonicalValue: '평일 10:30~20:00, 토요일 10:00~16:00 (일요일·공휴일 정기휴진, 점심시간 13:30~14:30)',
        acceptableTokens: ['10:30', '20:00', '일요일'],
        forbiddenTokens: ['일요일 정상진료', '24시간 운영'],
        sourceUrl: 'https://dosanontheskin.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '비급여 가격 고시 · 안내',
        canonicalValue: '비급여 진료비용 표 공식 누리집 및 원내 게시 (초진 피부진단 상담비 및 부가세 별도 규정 명시)',
        acceptableTokens: ['비급여', '누리집'],
        forbiddenTokens: ['전 시술 무료'],
        sourceUrl: 'https://dosanontheskin.kr/non-covered-fee',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '사전 예약제 운영 (공식 홈페이지·라인·왓츠앱 다국어 예약 지원, 당일 방문 시 대기 발생)',
        acceptableTokens: ['사전 예약제', '왓츠앱', '라인'],
        forbiddenTokens: ['예약제 미운영'],
        sourceUrl: 'https://dosanontheskin.kr/appointment',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '압구정로데오역 5번 출구 도보 6분, 건물 기계식 발렛 주차 가능 (SUV 대형차는 인근 공영주차장 안내)',
        acceptableTokens: ['압구정로데오역', '발렛'],
        forbiddenTokens: ['자주식 대형버스 주차 가능'],
        sourceUrl: 'https://dosanontheskin.kr/location',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '영어·일본어·중국어 전담 코디네이터 상주 및 택스리펀 단말기 구비, 의료기관 위생 규정상 반려동물 동반 불가',
        acceptableTokens: ['영어', '일본어', '중국어', '택스리펀'],
        forbiddenTokens: ['외국어 상담 불가'],
        sourceUrl: 'https://dosanontheskin.kr/global',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, false, true, true, true, true, true, true, true], // 11/12 -> 안정
      en: [true, true, false, true, true, true, true, true, false, true, true, true], // 10/12 -> 안정
      ja: [true, false, true, true, true, false, true, true, true, true, false, true], // 9/12 -> 안정
      'zh-Hans': [false, true, false, true, false, true, true, false, true, true, false, true], // 7/12 -> 가끔
    },
  },
  {
    shopId: 'shop-gnm-02',
    cohortId: 'GANGNAM_SMB',
    shopCode: 'GNM-002',
    shopName: '삼성코어필라테스랩',
    category: '체형교정·웰니스 스튜디오',
    neighborhood: '강남구 삼성동',
    aliases: ['삼성 코어필라테스랩', '강남 삼성코어필라테스', 'Samseong Core Pilates Lab'],
    disambiguationTokens: ['강남', '삼성동', '봉은사로', '필라테스'],
    canonicalDomain: 'corepilateslab.kr',
    placeUrl: 'https://place.map.kakao.com/gnm-corepilateslab',
    bookingUrl: 'https://corepilateslab.kr/trial',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '평일 07:00~22:00, 토요일 09:00~17:00 (일요일·공휴일 정기휴무)',
        acceptableTokens: ['07:00', '22:00', '일요일'],
        forbiddenTokens: ['일요일 정상수업'],
        sourceUrl: 'https://corepilateslab.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '1:1 프라이빗 체형분석 체험 1회(50분) 66,000원, 정규 10회권 770,000원',
        acceptableTokens: ['66,000원', '770,000원'],
        forbiddenTokens: ['1회 10,000원'],
        sourceUrl: 'https://corepilateslab.kr/pricing',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '전 수업 100% 사전 예약제 (수업 시작 12시간 전까지 앱·누리집 변경 가능, 현장 워크인 수업 불가)',
        acceptableTokens: ['100% 사전 예약제', '12시간'],
        forbiddenTokens: ['예약 없이 현장 수업 가능'],
        sourceUrl: 'https://corepilateslab.kr/trial',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '삼성중앙역 5번 출구 도보 3분, 빌딩 지하 자주식 주차장 2시간 무료 지원',
        acceptableTokens: ['삼성중앙역', '2시간 무료'],
        forbiddenTokens: ['주차 지원 불가'],
        sourceUrl: 'https://corepilateslab.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '키즈·주니어 성장 필라테스 전용 타임 운영, 영어 진행 강사 배정 가능, 반려동물 동반 불가',
        acceptableTokens: ['영어 진행', '주니어'],
        forbiddenTokens: ['외국어 수업 불가'],
        sourceUrl: 'https://corepilateslab.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, false, true, true, false, true, true, true, false, true, true, false], // 8/12 -> 가끔
      en: [false, false, false, false, false, false, true, true, false, true, false, true], // 전반0, 후반4 -> 신규
      ja: [false, false, true, false, false, false, false, true, false, false, false, false], // 2/12 -> 드묾
      'zh-Hans': [false, false, false, false, false, false, false, false, false, false, false, false], // 0/12 -> 미등장
    },
  },
  {
    shopId: 'shop-gnm-03',
    cohortId: 'GANGNAM_SMB',
    shopCode: 'GNM-003',
    shopName: '압구정글로우메디의원',
    category: '피부과/클리닉 (의료법 준수)',
    neighborhood: '강남구 압구정동',
    aliases: ['압구정 글로우메디의원', '글로우메디클리닉', 'Apgujeong GlowMedi Clinic'],
    disambiguationTokens: ['강남', '압구정동', '논현로', '글로우메디'],
    canonicalDomain: 'glowmediclinic.kr',
    placeUrl: 'https://place.map.kakao.com/gnm-glowmedi',
    bookingUrl: 'https://glowmediclinic.kr/booking',
    isMedicalRegulated: true,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '진료시간 · 정기휴진',
        canonicalValue: '월·화·목·금 10:00~19:30, 토요일 10:00~15:30 (수요일·일요일 정기휴진)',
        acceptableTokens: ['10:00', '19:30', '수요일·일요일'],
        forbiddenTokens: ['수요일 야간진료', '연중무휴'],
        sourceUrl: 'https://glowmediclinic.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '비급여 가격 고시 · 안내',
        canonicalValue: '비급여 항목별 정찰 가격표 홈페이지 상시 공개 (내·외국인 동일 수가 정책 명시)',
        acceptableTokens: ['비급여', '동일 수가'],
        forbiddenTokens: ['가격 비공개'],
        sourceUrl: 'https://glowmediclinic.kr/fee-schedule',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '공식 예약 페이지·네이버 예약·위챗/라인 사전 예약제 운영',
        acceptableTokens: ['사전 예약제', '네이버 예약'],
        forbiddenTokens: ['온라인 예약 불가'],
        sourceUrl: 'https://glowmediclinic.kr/booking',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '압구정역 3번 출구 도보 4분, 건물 자주식 지하주차장 1시간 30분 무료',
        acceptableTokens: ['압구정역', '자주식'],
        forbiddenTokens: ['주차장 없음'],
        sourceUrl: 'https://glowmediclinic.kr/location',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '영·일·중 통역 코디네이터 상주, 미성년자 진료 시 법정대리인 동반 필수, 반려동물 동반 불가',
        acceptableTokens: ['통역', '법정대리인'],
        forbiddenTokens: ['미성년자 단독 시술 가능'],
        sourceUrl: 'https://glowmediclinic.kr/global',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, false, true, true, true, true, true, false, true, true], // 10/12 -> 안정
      en: [false, true, true, false, true, false, true, false, true, true, false, true], // 7/12 -> 가끔
      ja: [true, true, false, true, true, true, true, true, false, true, true, true], // 10/12 -> 안정
      'zh-Hans': [true, false, true, true, true, false, true, true, true, false, true, true], // 9/12 -> 안정
    },
  },
  {
    shopId: 'shop-gnm-04',
    cohortId: 'GANGNAM_SMB',
    shopCode: 'GNM-004',
    shopName: '청담루미에르헤어살롱',
    category: 'K-뷰티 헤어·메이크업',
    neighborhood: '강남구 청담동',
    aliases: ['청담 루미에르헤어', '루미에르헤어살롱 청담', 'Cheongdam Lumiere Hair Salon'],
    disambiguationTokens: ['강남', '청담동', '도산대로', '루미에르'],
    canonicalDomain: 'lumierecheongdam.kr',
    placeUrl: 'https://place.map.kakao.com/gnm-lumierehair',
    bookingUrl: 'https://lumierecheongdam.kr/reserve',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '10:00~19:30 (매주 월요일 정기휴무, 웨딩·촬영 얼리버드 예약은 07:00부터 가능)',
        acceptableTokens: ['10:00', '19:30', '월요일'],
        forbiddenTokens: ['월요일 정상영업', '24시간 영업'],
        sourceUrl: 'https://lumierecheongdam.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '퍼스널 헤어컷·스타일링 55,000원, K-아이돌 데일리 메이크업+헤어 패키지 165,000원',
        acceptableTokens: ['55,000원', '165,000원'],
        forbiddenTokens: ['15,000원'],
        sourceUrl: 'https://lumierecheongdam.kr/price',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '디자이너 지정 예약제 (공식 누리집·인스타그램 영/일/중 예약 링크 운영, 메이크업은 100% 사전 예약 필수)',
        acceptableTokens: ['사전 예약', '디자이너'],
        forbiddenTokens: ['메이크업 당일 워크인 상시 가능'],
        sourceUrl: 'https://lumierecheongdam.kr/reserve',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '청담역 9번 출구 도보 7분, 건물 1층 발렛파킹 지원 (발렛비 4,000원 별도)',
        acceptableTokens: ['청담역', '발렛파킹', '4,000원'],
        forbiddenTokens: ['무료 자주식 주차 5시간'],
        sourceUrl: 'https://lumierecheongdam.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '영·일·중 스타일북 및 통역 매니저 지원, 프라이빗 룸 예약 시 반려견 이동장 동반 가능',
        acceptableTokens: ['스타일북', '프라이빗 룸'],
        forbiddenTokens: ['외국인 예약 불가'],
        sourceUrl: 'https://lumierecheongdam.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, true, true, true, false, true, true, true, true], // 11/12 -> 안정
      en: [true, true, false, true, true, true, true, true, true, false, true, true], // 10/12 -> 안정
      ja: [true, true, true, false, true, true, true, true, true, true, false, true], // 10/12 -> 안정
      'zh-Hans': [false, false, false, false, false, false, true, true, false, true, true, false], // 전반0, 후반4 -> 신규
    },
  },
  {
    shopId: 'shop-gnm-05',
    cohortId: 'GANGNAM_SMB',
    shopCode: 'GNM-005',
    shopName: '테헤란아로마스파',
    category: '프라이빗 웰니스 스파',
    neighborhood: '강남구 역삼동',
    aliases: ['테헤란 아로마스파', '강남 테헤란아로마스파', 'Teheran Aroma Spa'],
    disambiguationTokens: ['강남', '역삼동', '테헤란로', '아로마스파'],
    canonicalDomain: 'teheranaromaspa.kr',
    placeUrl: 'https://place.map.kakao.com/gnm-teheranspa',
    bookingUrl: 'https://teheranaromaspa.kr/book',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '11:00~22:30 (라스트오더 20:30, 매월 첫째·셋째 일요일 정기휴무)',
        acceptableTokens: ['11:00', '22:30', '일요일'],
        forbiddenTokens: ['24시간 연중무휴'],
        sourceUrl: 'https://teheranaromaspa.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '딥티슈 아로마 릴랙싱 70분 110,000원, 90분 145,000원 (1인 1실 프라이빗 룸 포함)',
        acceptableTokens: ['110,000원', '145,000원'],
        forbiddenTokens: ['30,000원'],
        sourceUrl: 'https://teheranaromaspa.kr/program',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '1인 1실 준비를 위해 최소 2시간 전 사전 예약제 운영',
        acceptableTokens: ['1인 1실', '사전 예약'],
        forbiddenTokens: ['예약 불가'],
        sourceUrl: 'https://teheranaromaspa.kr/book',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '역삼역 4번 출구 도보 3분, 오피스텔 빌딩 지하주차장 2시간 무료 등록',
        acceptableTokens: ['역삼역', '2시간 무료'],
        forbiddenTokens: ['주차 불가'],
        sourceUrl: 'https://teheranaromaspa.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '성인 및 만 14세 이상 이용 가능, 영·일·중 문진표 구비, 반려동물 동반 불가',
        acceptableTokens: ['문진표', '반려동물 동반 불가'],
        forbiddenTokens: ['영유아 키즈풀 운영'],
        sourceUrl: 'https://teheranaromaspa.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [false, true, true, false, true, false, true, false, true, true, false, true], // 7/12 -> 가끔
      en: [false, true, false, false, true, false, true, false, true, false, true, false], // 5/12 -> 가끔
      ja: [false, false, false, false, false, false, true, true, false, true, false, false], // 전반0, 후반3 -> 신규
      'zh-Hans': [false, false, false, false, false, false, false, true, false, false, false, false], // 1/12 -> 드묾
    },
  },

  // =========================================================================
  // 3. 은평구 코호트 (EUNPYEONG_LOCAL) — 가나다순 5곳
  // =========================================================================
  {
    shopId: 'shop-epg-01',
    cohortId: 'EUNPYEONG_LOCAL',
    shopCode: 'EPG-001',
    shopName: '구파발나무공방결',
    category: '목공·생활공예 체험공방',
    neighborhood: '은평구 진관동',
    aliases: ['구파발 나무공방 결', '은평 나무공방결', 'Gupabal Wood Studio Gyeol'],
    disambiguationTokens: ['은평구', '진관동', '구파발', '목공방'],
    canonicalDomain: 'woodgyeol-ep.kr',
    placeUrl: 'https://place.map.kakao.com/epg-woodgyeol',
    bookingUrl: 'https://woodgyeol-ep.kr/class',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '10:30~19:30 (매주 월·화요일 정기휴무, 주말 원데이클래스 정상 운영)',
        acceptableTokens: ['10:30', '19:30', '월·화요일'],
        forbiddenTokens: ['주말 휴무', '24시간 운영'],
        sourceUrl: 'https://woodgyeol-ep.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '원목 도마·트레이 원데이클래스 1인 55,000원 (호두나무·체리목 재료비 및 각인 포함)',
        acceptableTokens: ['55,000원', '원데이클래스'],
        forbiddenTokens: ['무료 체험'],
        sourceUrl: 'https://woodgyeol-ep.kr/class',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '목재 재단 준비를 위해 최소 하루 전 네이버 예약·전화 예약 필수 (소품 쇼룸 구경은 워크인 가능)',
        acceptableTokens: ['하루 전', '예약 필수'],
        forbiddenTokens: ['예약 없이 당일 목공 수업 가능'],
        sourceUrl: 'https://woodgyeol-ep.kr/class',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '구파발역 3번 출구 버스 5분(은평한옥마을 입구 하차), 공방 앞 전용 주차 3대 가능',
        acceptableTokens: ['구파발역', '전용 주차 3대'],
        forbiddenTokens: ['주차 불가'],
        sourceUrl: 'https://woodgyeol-ep.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '초등학생 이상 보호자 동반 체험 가능, 톱밥·공구 안전상 반려동물 작업실 입장 불가, 영문 안전수칙 카드 비치',
        acceptableTokens: ['초등학생', '보호자 동반'],
        forbiddenTokens: ['반려견 작업실 동반 가능'],
        sourceUrl: 'https://woodgyeol-ep.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, false, true, true, true, true, true, true, false, true, true], // 10/12 -> 안정
      en: [false, false, false, false, false, false, true, false, true, true, false, false], // 전반0, 후반3 -> 신규
      ja: [false, false, false, false, false, false, false, true, false, false, true, false], // 2/12 -> 드묾
      'zh-Hans': [false, false, false, false, false, false, false, false, false, true, false, false], // 1/12 -> 드묾
    },
  },
  {
    shopId: 'shop-epg-02',
    cohortId: 'EUNPYEONG_LOCAL',
    shopCode: 'EPG-002',
    shopName: '불광천독립책방새벽',
    category: '독립서점·북카페',
    neighborhood: '은평구 응암동',
    aliases: ['불광천 독립책방 새벽', '책방새벽 응암', 'Bulgwangcheon Dawn Bookshop'],
    disambiguationTokens: ['은평구', '응암동', '불광천', '새벽'],
    canonicalDomain: 'dawnbookshop-ep.kr',
    placeUrl: 'https://place.map.kakao.com/epg-dawnbookshop',
    bookingUrl: 'https://dawnbookshop-ep.kr/reading-club',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '화~토 13:00~21:30, 일요일 13:00~19:00 (매주 월요일 정기휴무)',
        acceptableTokens: ['13:00', '21:30', '월요일'],
        forbiddenTokens: ['오전 9시 오픈', '일요일 휴무'],
        sourceUrl: 'https://dawnbookshop-ep.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '독립출판물 정가 판매, 심야 독서석+핸드드립 커피 이용권 9,000원',
        acceptableTokens: ['9,000원', '핸드드립'],
        forbiddenTokens: ['입장료 30,000원'],
        sourceUrl: 'https://dawnbookshop-ep.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '서점 열람·카페 이용은 상시 워크인 가능, 금요일 저녁 북토크는 사전 신청제',
        acceptableTokens: ['워크인', '북토크'],
        forbiddenTokens: ['예약 없이는 서점 입장 불가'],
        sourceUrl: 'https://dawnbookshop-ep.kr/reading-club',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '새절역 2번 출구 불광천 산책로 도보 4분 (전용 주차장 없음, 인근 응암 공영주차장 이용)',
        acceptableTokens: ['새절역', '전용 주차장 없음'],
        forbiddenTokens: ['서점 전용 대형 주차장 완비'],
        sourceUrl: 'https://dawnbookshop-ep.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '어린이 그림책 코너 운영, 불광천 산책 중 리드줄·매너벨트 착용 시 반려견 동반 입장 가능',
        acceptableTokens: ['그림책', '반려견 동반'],
        forbiddenTokens: ['반려동물 출입 엄금'],
        sourceUrl: 'https://dawnbookshop-ep.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, false, true, true, true, true, true, true, false], // 10/12 -> 안정
      en: [false, true, false, false, true, false, true, false, true, false, true, false], // 5/12 -> 가끔
      ja: [false, false, false, false, false, false, true, true, false, true, false, false], // 전반0, 후반3 -> 신규
      'zh-Hans': [false, false, false, false, false, false, false, false, false, false, false, false], // 0/12 -> 미등장
    },
  },
  {
    shopId: 'shop-epg-03',
    cohortId: 'EUNPYEONG_LOCAL',
    shopCode: 'EPG-003',
    shopName: '연서시장손두부공방',
    category: '전통시장 수제두부·한식',
    neighborhood: '은평구 갈현동',
    aliases: ['연서시장 손두부공방', '갈현동 연서손두부', 'Yeonseo Market Handmade Tofu'],
    disambiguationTokens: ['은평구', '갈현동', '연서시장', '손두부'],
    canonicalDomain: 'yeonseotofu.kr',
    placeUrl: 'https://place.map.kakao.com/epg-yeonseotofu',
    bookingUrl: 'https://yeonseotofu.kr/order',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '08:30~20:00 (두부 가마솥 출고 09:00 / 14:00, 매월 둘째·넷째 화요일 정기휴무)',
        acceptableTokens: ['08:30', '20:00', '화요일'],
        forbiddenTokens: ['매주 일요일 휴무'],
        sourceUrl: 'https://yeonseotofu.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '100% 파주 장단콩 수제 모두부 1모 5,000원, 하얀 순두부 백반 9,500원 (온누리상품권 결제 가능)',
        acceptableTokens: ['5,000원', '9,500원', '온누리상품권'],
        forbiddenTokens: ['온누리상품권 불가'],
        sourceUrl: 'https://yeonseotofu.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '식사 및 포장 상시 워크인 가능 (명절·단체 두부 10모 이상은 전날 전화 예약 필수)',
        acceptableTokens: ['워크인', '전화 예약'],
        forbiddenTokens: ['100% 사전 예약제 식당'],
        sourceUrl: 'https://yeonseotofu.kr/order',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '연신내역 3번 출구 도보 3분, 연서시장 공영주차장 이용 시 1시간 주차권 제공',
        acceptableTokens: ['연신내역', '연서시장 공영주차장'],
        forbiddenTokens: ['주차권 미제공'],
        sourceUrl: 'https://yeonseotofu.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '어린이 순한 순두부 메뉴 및 유아의자 구비, 포장 시 반려동물 동반 가능(실내 식사 공간은 불가), 영·중 메뉴판 비치',
        acceptableTokens: ['유아의자', '영·중 메뉴판'],
        forbiddenTokens: ['노키즈존'],
        sourceUrl: 'https://yeonseotofu.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, true, true, true, true, true, true, true, false], // 11/12 -> 안정
      en: [false, true, false, true, false, true, false, true, false, true, false, true], // 6/12 -> 가끔
      ja: [false, false, true, false, false, false, true, false, false, true, false, false], // 3/12 -> 드묾
      'zh-Hans': [false, false, false, false, false, false, true, false, true, true, false, false], // 전반0, 후반3 -> 신규
    },
  },
  {
    shopId: 'shop-epg-04',
    cohortId: 'EUNPYEONG_LOCAL',
    shopCode: 'EPG-004',
    shopName: '은평한옥마을소나무빵집',
    category: '한옥 베이커리 카페',
    neighborhood: '은평구 진관동',
    aliases: ['은평한옥마을 소나무빵집', '진관동 소나무빵집', 'Eunpyeong Hanok Pine Bakery'],
    disambiguationTokens: ['은평구', '진관동', '은평한옥마을', '소나무빵집'],
    canonicalDomain: 'pinebakery-hanok.kr',
    placeUrl: 'https://place.map.kakao.com/epg-pinebakery',
    bookingUrl: 'https://pinebakery-hanok.kr/reserve',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '09:30~21:00 (라스트오더 20:15, 연중무휴 · 명절 당일만 12:00 오픈)',
        acceptableTokens: ['09:30', '21:00', '연중무휴'],
        forbiddenTokens: ['17:00 마감', '매주 월요일 휴무'],
        sourceUrl: 'https://pinebakery-hanok.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '북한산 솔잎 천연발효 깜빠뉴 7,800원, 흑임자 크림라떼 6,800원',
        acceptableTokens: ['7,800원', '6,800원'],
        forbiddenTokens: ['20,000원'],
        sourceUrl: 'https://pinebakery-hanok.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '1·2층 한옥 홀은 상시 워크인 이용, 2층 북한산 전망 다실(4~6인석)만 네이버 사전 시간제 예약 가능',
        acceptableTokens: ['워크인', '다실', '네이버'],
        forbiddenTokens: ['전 좌석 예약 필수'],
        sourceUrl: 'https://pinebakery-hanok.kr/reserve',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '한옥 마당 옆 전용 주차장 15대 무료 및 은평역사한옥박물관 공영주차장 도보 2분',
        acceptableTokens: ['전용 주차장 15대', '은평역사한옥박물관'],
        forbiddenTokens: ['주차장 없음'],
        sourceUrl: 'https://pinebakery-hanok.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '유모차 경사로·수유실 완비, 한옥 마당 야외 좌석 반려견 동반 가능, 영·일·중 메뉴 키오스크 운영',
        acceptableTokens: ['유모차', '한옥 마당', '키오스크'],
        forbiddenTokens: ['유모차 진입 불가', '노키즈존'],
        sourceUrl: 'https://pinebakery-hanok.kr/info',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [true, true, true, true, true, true, true, true, true, true, true, true], // 12/12 -> 안정
      en: [true, false, true, true, true, true, true, true, false, true, true, true], // 10/12 -> 안정
      ja: [true, true, false, true, false, true, true, true, true, false, true, true], // 9/12 -> 안정
      'zh-Hans': [false, true, true, false, true, false, true, true, false, true, true, false], // 7/12 -> 가끔
    },
  },
  {
    shopId: 'shop-epg-05',
    cohortId: 'EUNPYEONG_LOCAL',
    shopCode: 'EPG-005',
    shopName: '증산골목화덕피자',
    category: '가족 외식 화덕요리 식당',
    neighborhood: '은평구 증산동',
    aliases: ['증산 골목화덕피자', '은평 증산화덕피자', 'Jeungsan Alley Wood-Fired Pizza'],
    disambiguationTokens: ['은평구', '증산동', '증산역', '화덕피자'],
    canonicalDomain: 'jeungsanpizza.kr',
    placeUrl: 'https://place.map.kakao.com/epg-jeungsanpizza',
    bookingUrl: 'https://jeungsanpizza.kr/reserve',
    isMedicalRegulated: false,
    licenseVerified: true,
    facts: [
      {
        factKey: 'hours_holiday',
        factLabel: '영업시간 · 정기휴무',
        canonicalValue: '11:30~21:30 (브레이크타임 평일 15:00~17:00, 주말 브레이크타임 없음, 매주 수요일 정기휴무)',
        acceptableTokens: ['11:30', '21:30', '수요일'],
        forbiddenTokens: ['주말 브레이크타임 있음', '수요일 정상영업'],
        sourceUrl: 'https://jeungsanpizza.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'price_menu',
        factLabel: '대표 가격 · 구성',
        canonicalValue: '참나무 화덕 마르게리따 19,500원, 은평 로컬 루꼴라 프로슈토 피자 24,000원',
        acceptableTokens: ['19,500원', '24,000원'],
        forbiddenTokens: ['39,000원'],
        sourceUrl: 'https://jeungsanpizza.kr/menu',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'booking_method',
        factLabel: '예약 · 워크인 조건',
        canonicalValue: '네이버 예약·전화 예약 및 현장 워크인 모두 가능 (주말 가족석 6인 이상은 사전 예약 권장)',
        acceptableTokens: ['네이버 예약', '워크인'],
        forbiddenTokens: ['워크인 절대 불가'],
        sourceUrl: 'https://jeungsanpizza.kr/reserve',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'parking_access',
        factLabel: '주차 · 대중교통 접근',
        canonicalValue: '디지털미디어시티역·증산역 도보 5분, 매장 앞 주차 2대 가능 (만차 시 증산 공영주차장 1시간 지원)',
        acceptableTokens: ['증산역', '증산 공영주차장'],
        forbiddenTokens: ['주차 지원 전혀 없음'],
        sourceUrl: 'https://jeungsanpizza.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
      {
        factKey: 'pet_kids_policy',
        factLabel: '반려동물 · 아동 · 다국어 규정',
        canonicalValue: '유아의자 4개·어린이 식기 구비, 1층 창가 테라스석 반려견 동반 가능, 영문 메뉴판 제공',
        acceptableTokens: ['유아의자', '테라스석'],
        forbiddenTokens: ['노키즈존'],
        sourceUrl: 'https://jeungsanpizza.kr/hours',
        ownerVerifiedAt: '2026-10-15',
      },
    ],
    recentDiscoveryHistoryByLang: {
      ko: [false, true, true, false, true, true, true, false, true, true, false, true], // 8/12 -> 가끔
      en: [false, false, false, false, false, false, true, false, true, true, false, false], // 전반0, 후반3 -> 신규
      ja: [false, false, false, false, false, false, false, true, false, false, false, false], // 1/12 -> 드묾
      'zh-Hans': [false, false, false, false, false, false, false, false, false, false, false, false], // 0/12 -> 미등장
    },
  },
];
