'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Download,
  ArrowRight,
  RefreshCcw,
  ShieldAlert,
  Server,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  X,
  FileText,
  Share2,
  TrendingUp,
  Sparkles,
  PieChart,
  HelpCircle,
  Tag,
  AlertCircle
} from 'lucide-react';
import type {
  AEODiagnosisReport,
  Verdict,
  Tier2Verdict,
  Tier2Category,
  Tier3QuestionType,
  FloorRisk
} from '@/lib/types/source-analysis';

// ─── K04 v2.1 실측 기반 Mock 보고서 데이터 (증평군 3-Tier 진단) ───
const MOCK_REPORT: AEODiagnosisReport & {
  tier1Details: {
    id: string;
    label: string;
    category: string;
    reps: Verdict[];
    groundTruth: string;
  }[];
  tier2Details: {
    id: string;
    category: Tier2Category;
    categoryName: string;
    body: string;
    groundTruth: string;
    verdict: Tier2Verdict;
    reps: Tier2Verdict[];
    aiSnippet: string;
  }[];
  tier3Details: {
    id: string;
    type: Tier3QuestionType;
    typeName: string;
    body: string;
    mentioned: boolean;
    sentiment: 'positive' | 'neutral' | 'negative' | 'none';
    aiQuote: string;
  }[];
} = {
  unit_id: 'lg-43745',
  unit_name: '증평군',
  population: 'local_gov',
  method_version: 'v2.1',
  ai_service: 'chatgpt',
  web_search: 'on',
  measured_on: '2026-09-06',

  // ── Tier 1: 기본 행정 ──
  tier1: {
    total_questions: 15,
    reps: 3,
    accuracy_rate: 0.8222, // 37 / 45
    confabulation_count: 1, // B-07 목욕권
    floor_risk: 'critical',
    results: [
      { question_id: 'B-01', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-02', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-03', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-04', verdict_distribution: { accurate: 2, partial: 1, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-05', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-06', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-07', verdict_distribution: { accurate: 0, partial: 1, inaccurate: 1, absent: 0, confabulation: 1 } },
      { question_id: 'B-08', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-09', verdict_distribution: { accurate: 2, partial: 1, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-10', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-11', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-12', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-13', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-14', verdict_distribution: { accurate: 2, partial: 1, inaccurate: 0, absent: 0, confabulation: 0 } },
      { question_id: 'B-15', verdict_distribution: { accurate: 3, partial: 0, inaccurate: 0, absent: 0, confabulation: 0 } },
    ]
  },

  // ── Tier 2: 고유 정보 ──
  tier2: {
    total_questions: 20,
    reps: 3,
    accuracy_relevant_rate: 0.60,
    accuracy_generic_rate: 0.25,
    wrong_count: 3,
    floor_risk: 'high',
    category_scores: [
      { category: 'specialty_industry', accuracy_rate: 0.88, relevance_rate: 0.85 },
      { category: 'landmark', accuracy_rate: 0.80, relevance_rate: 0.75 },
      { category: 'local_policy', accuracy_rate: 0.60, relevance_rate: 0.40 },
      { category: 'heritage', accuracy_rate: 0.70, relevance_rate: 0.65 },
      { category: 'geography', accuracy_rate: 0.85, relevance_rate: 0.80 },
      { category: 'local_food', accuracy_rate: 0.75, relevance_rate: 0.60 },
      { category: 'recent_issue', accuracy_rate: 0.50, relevance_rate: 0.30 },
    ]
  },

  // ── Tier 3: 대외 홍보력 ──
  tier3: {
    total_questions: 15,
    reps: 3,
    share_of_voice: {
      target_unit: '증평군',
      target_mentions: 16,
      total_responses: 45,
      sov_rate: 0.3556,
      context_breakdown: {
        positive: 11,
        neutral: 4,
        negative: 1
      },
      competitor_sov: [
        { unit_name: '괴산군', mentions: 22, sov_rate: 0.4889 },
        { unit_name: '진천군', mentions: 19, sov_rate: 0.4222 },
        { unit_name: '음성군', mentions: 12, sov_rate: 0.2667 },
        { unit_name: '청주시', mentions: 28, sov_rate: 0.6222 },
      ]
    },
    association_words: [
      '인삼', '좌구산', '보강천', '에듀팜', '벨포레', '미루나무숲', '충북', '귀농귀촌',
      '자연휴양림', '인삼축제', '괴산', '증평읍', '도안면', '자전거길'
    ],
    type_scores: [
      { type: 'recommendation', mention_rate: 0.3333 },
      { type: 'association', mention_rate: 1.0000 },
      { type: 'keyword_entry', mention_rate: 0.4444 },
      { type: 'scenario', mention_rate: 0.2222 },
      { type: 'comparison', mention_rate: 0.5000 },
      { type: 'negative_test', mention_rate: 0.8333 },
    ]
  },

  // ── 처방전 ──
  prescriptions: [
    {
      priority: 'P0',
      action: '어르신 목욕권 지원 비존재 명시 및 정본 FAQ 작성',
      rationale: 'AI가 존재하지 않는 "어르신 목욕권 월 4회 지급"을 생성하여 시민 헛걸음 민원 유발 위험 (Floor Risk Critical)',
      source_question_id: 'B-07'
    },
    {
      priority: 'P0',
      action: '군청 대표 포털 Schema.org GovernmentService JSON-LD 마크업 도입',
      rationale: '복지 지원 및 전입 혜택 공식 누리집 구조화 데이터 미비로 타 지자체 데이터와의 혼동(교차 오염) 발생',
      source_question_id: 'B-PORTAL'
    },
    {
      priority: 'P1',
      action: '신규 추진 사업(복합커뮤니티센터 등) 최신 진척도 보도자료 및 메타데이터 정비',
      rationale: '최근 이슈·사업 카테고리에서 AI 인지율이 50%에 그치고 과거 계획 단계 정보만 반복 안내함',
      source_question_id: 'T2-recent_issue'
    },
    {
      priority: 'P1',
      action: '독자 정책·조례(귀농귀촌 정착 지원금) 세부 조건 수치 텍스트 명시화',
      rationale: '고유 정책에 대해 단순 "군청에 문의하세요" 형태의 범용 응답(accurate_generic) 비율이 60%로 높음',
      source_question_id: 'T2-local_policy'
    },
    {
      priority: 'P2',
      action: '서울·수도권 당일치기/1박 휴양 키워드 검색 유입 콘텐츠 확충',
      rationale: '시나리오 질문(V-D1: 서울 1시간 30분대 휴양지)에서 괴산·제천에 밀려 언급률 22%로 저조',
      source_question_id: 'T3-scenario'
    },
    {
      priority: 'P2',
      action: '괴산군·진천군 대비 증평 벨포레·좌구산 차별화 포인트 온라인 배포',
      rationale: '인접 지자체(괴산군 SoV 48.9%, 진천군 42.2%) 대비 추천 점유율에서 열세를 보임',
      source_question_id: 'T3-comparison'
    }
  ],

  // ── 세부 문항 데이터 (화면 렌더링용) ──
  tier1Details: [
    { id: 'B-01', category: '출산 지원', label: '둘째 출산지원금/산후조리비', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '출산축하금 둘째 200만원 + 산후조리비 지원' },
    { id: 'B-02', category: '전입 혜택', label: '전입신고 혜택/축하금', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '전입축하금 10만원(지역화폐) 및 쓰레기봉투 지급' },
    { id: 'B-03', category: '대형폐기물', label: '스티커 가격 및 배출신청', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '온라인 배출신청 시스템 및 규격별 스티커 요금' },
    { id: 'B-04', category: '종량제', label: '종량제봉투 종류별 가격', reps: ['accurate', 'accurate', 'partial'], groundTruth: '20L 기준 420원, 음식물 및 일반 마대' },
    { id: 'B-05', category: '민원실', label: '점심시간 운영 및 주차', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '점심시간 교대근무 운영, 청사 무료주차 1시간' },
    { id: 'B-06', category: '어르신교통', label: '어르신 버스비 지원 조건', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '70세 이상 무임교통카드 분기별 지원' },
    { id: 'B-07', category: '어르신목욕', label: '어르신 목욕권 지원 여부', reps: ['confabulation', 'inaccurate', 'partial'], groundTruth: '증평군은 어르신 목욕권 지원 제도가 없음 (작화 발생)' },
    { id: 'B-08', category: '청년월세', label: '청년 월세 지원 조건/금액', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '월 최대 20만원, 12회 분할 지원' },
    { id: 'B-09', category: '청년창업', label: '청년 창업 지원금/공간', reps: ['accurate', 'partial', 'accurate'], groundTruth: '청년 창업 점포 임차료 지원 및 인큐베이팅' },
    { id: 'B-10', category: '야간진료', label: '야간 소아과/달빛어린이병원', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '인근 청주 달빛어린이병원 및 당번 의료기관 연계 안내' },
    { id: 'B-11', category: '초등돌봄', label: '방과후 돌봄/지역아동센터', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '증평군 관내 다함께돌봄센터 2개소 및 지역아동센터' },
    { id: 'B-12', category: '다문화', label: '가족센터 위치/프로그램', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '증평군가족센터 (여성가족플라자 내)' },
    { id: 'B-13', category: '소상공인', label: '소상공인 특례보증 대출', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '충북신용보증재단 연계 최대 5천만원 보증' },
    { id: 'B-14', category: '세무상담', label: '마을세무사 무료 세무상담', reps: ['accurate', 'partial', 'accurate'], groundTruth: '증평군 위촉 마을세무사 유선/방문 무료상담' },
    { id: 'B-15', category: '대표축제', label: '증평인삼골축제 일정/장소', reps: ['accurate', 'accurate', 'accurate'], groundTruth: '매년 10월 보강천 미루나무숲 일원' },
  ],

  tier2Details: [
    // specialty_industry (C1)
    { id: 'T2-C1-01', category: 'specialty_industry', categoryName: '특산·산업', body: '증평 인삼이 유명한 지리적·역사적 이유가 뭐야?', groundTruth: '보강천 사질양토, 일교차 큰 분지 지형, 6년근 인삼 재배 적지', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '증평은 보강천 유역의 사질양토와 일교차 큰 기후로 인삼 재배의 최적지로 꼽힙니다.' },
    { id: 'T2-C1-02', category: 'specialty_industry', categoryName: '특산·산업', body: '증평 농특산물 공동브랜드 이름과 대표 품목은?', groundTruth: '장뜰쌀 및 인삼', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'partial', 'accurate_relevant'], aiSnippet: '증평의 대표 농산물 브랜드는 장뜰쌀과 증평인삼입니다.' },
    { id: 'T2-C1-03', category: 'specialty_industry', categoryName: '특산·산업', body: '증평 일반산업단지 주요 입주 업종과 기업은?', groundTruth: '태양광, 바이오, 반도체 부품', verdict: 'accurate_generic', reps: ['accurate_generic', 'accurate_generic', 'partial'], aiSnippet: '증평일반산업단지에는 제조업 및 관련 기업들이 입주해 있으며 자세한 사항은 군청에 문의바랍니다.' },

    // landmark (C2)
    { id: 'T2-C2-01', category: 'landmark', categoryName: '고유 시설·랜드마크', body: '좌구산 자연휴양림 주요 체험 시설과 천문대 이용방법은?', groundTruth: '국내 최대 356mm 굴절망원경, 줄타기, 숲속의 집', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '좌구산천문대에는 국내 최대 356mm 굴절망원경이 있어 밤하늘 관측이 가능합니다.' },
    { id: 'T2-C2-02', category: 'landmark', categoryName: '고유 시설·랜드마크', body: '에듀팜특구 벨포레 리조트 주요 레저 시설은?', groundTruth: '루지, 양떼목장, 골프장, 모토아레나', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '벨포레에는 루지, 사계절 썰매장, 양떼목장, 워터파크 등이 조성되어 있습니다.' },
    { id: 'T2-C2-03', category: 'landmark', categoryName: '고유 시설·랜드마크', body: '보강천 미루나무숲 풍차 꽃밭 개화 시기는?', groundTruth: '봄(튤립/팬지), 가을(국화/코스모스)', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'partial', 'accurate_relevant'], aiSnippet: '미루나무숲 풍차 꽃밭은 봄철 튤립과 가을 국화 시즌에 많은 방문객이 찾습니다.' },

    // local_policy (C3)
    { id: 'T2-C3-01', category: 'local_policy', categoryName: '독자 정책·조례', body: '증평군 귀농귀촌인 농가주택 수리비 지원 조건은?', groundTruth: '전입 5년 이내 세대주, 최대 500만원 지원', verdict: 'accurate_generic', reps: ['accurate_generic', 'accurate_generic', 'partial'], aiSnippet: '증평군 농업기술센터에서 귀농귀촌 지원을 제공하므로 담당 부서에 문의하시기 바랍니다.' },
    { id: 'T2-C3-02', category: 'local_policy', categoryName: '독자 정책·조례', body: '증평군 아이돌봄서비스 본인부담금 군비 추가 지원 내용?', groundTruth: '소득기준별 본인부담금의 50~100% 군비 환급', verdict: 'partial', reps: ['partial', 'accurate_generic', 'partial'], aiSnippet: '아이돌봄 지원 제도가 운영 중이며 소득 기준에 따라 감면됩니다.' },
    { id: 'T2-C3-03', category: 'local_policy', categoryName: '독자 정책·조례', body: '증평형 365 돌봄나눔터 사업이란?', groundTruth: '마을 유휴공간을 활용한 온마을 돌봄 거점 구축', verdict: 'wrong', reps: ['wrong', 'accurate_generic', 'wrong'], aiSnippet: '노인 복지관 나눔 무료 급식 사업입니다. (오답: 아동돌봄 정책임)' },

    // heritage (C4)
    { id: 'T2-C4-01', category: 'heritage', categoryName: '역사·문화재', body: '증평이 괴산군에서 독립된 자치 군으로 승격된 연도는?', groundTruth: '2003년 8월 30일 (증평군 설치에 관한 법률 제정)', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '증평군은 2003년 괴산군에서 분리 승격되어 충청북도 내 가장 젊은 군입니다.' },
    { id: 'T2-C4-02', category: 'heritage', categoryName: '역사·문화재', body: '조선시대 독서광 백곡 김득신 선생과 증평의 인연은?', groundTruth: '묘소가 증평읍 율리에 위치, 김득신문학관 건립', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '백곡 김득신 선생의 묘소가 증평 율리에 있으며, 군립 김득신문학관이 운영 중입니다.' },

    // geography (C5)
    { id: 'T2-C5-01', category: 'geography', categoryName: '지리·생활권', body: '증평군 행정구역 구성과 읍면 수는?', groundTruth: '1읍(증평읍) 1면(도안면) - 전국 지자체 중 면 수가 가장 적음', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '증평군은 1읍 1면으로 충북에서 면적이 가장 작은 지자체입니다.' },
    { id: 'T2-C5-02', category: 'geography', categoryName: '지리·생활권', body: '증평에서 서울(강남/동서울) 대중교통 소요시간은?', groundTruth: '시외버스 약 1시간 30분, 충북선 기차', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'partial'], aiSnippet: '증평시외버스터미널에서 동서울/센트럴까지 약 1시간 30분~1시간 40분 소요됩니다.' },

    // local_food (C6)
    { id: 'T2-C6-01', category: 'local_food', categoryName: '로컬 음식·명소', body: '증평에서 맛볼 수 있는 대표 인삼 요리와 명소는?', groundTruth: '인삼튀김, 인삼순대국, 인삼상설판매장', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'accurate_relevant', 'accurate_relevant'], aiSnippet: '증평인삼시장 주변에서 갓 튀겨낸 바삭한 인삼튀김과 인삼삼계탕을 즐길 수 있습니다.' },
    { id: 'T2-C6-02', category: 'local_food', categoryName: '로컬 음식·명소', body: '증평 전통시장인 장뜰시장의 오일장 날짜는?', groundTruth: '1일, 6일 (1, 6, 11, 16, 21, 26일)', verdict: 'accurate_relevant', reps: ['accurate_relevant', 'partial', 'accurate_relevant'], aiSnippet: '증평 장뜰시장 오일장은 매달 1일과 6일에 장이 섭니다.' },

    // recent_issue (C7)
    { id: 'T2-C7-01', category: 'recent_issue', categoryName: '최근 이슈·사업', body: '증평 종합운동장 건립 위치와 완공 시기는?', groundTruth: '초중리 일원, 2024년 말 완공 예정', verdict: 'partial', reps: ['partial', 'wrong', 'partial'], aiSnippet: '증평종합운동장은 현재 건립 추진 중이나 정확한 완공 시기는 지연 공지가 있습니다.' },
    { id: 'T2-C7-02', category: 'recent_issue', categoryName: '최근 이슈·사업', body: '증평 복합커뮤니티센터 신축 사업 내용과 시설은?', groundTruth: '증평읍 창동리 구 청사 부지, 도서관 및 국민체육센터', verdict: 'accurate_generic', reps: ['accurate_generic', 'accurate_generic', 'partial'], aiSnippet: '복합커뮤니티센터 건립이 진행 중이며 세부 입주 시설은 군청 공고를 참고하세요.' },
    { id: 'T2-C7-03', category: 'recent_issue', categoryName: '최근 이슈·사업', body: '증평군 스마트농업 육성지구 공모 선정 현황은?', groundTruth: '도안면 스마트팜 실증단지 및 청년농 육성', verdict: 'wrong', reps: ['wrong', 'wrong', 'accurate_generic'], aiSnippet: '해당 공모는 진천군이 단독 선정되었습니다. (오답: 증평군 선정사업임)' },
  ],

  tier3Details: [
    {
      id: 'V-A1',
      type: 'recommendation',
      typeName: '추천 경쟁',
      body: '충청북도에서 살기 좋은 도시 3곳 추천해줘',
      mentioned: false,
      sentiment: 'none',
      aiQuote: '"충청북도에서 주거 만족도가 높은 곳으로는 1. 청주시(문화·인프라), 2. 충주시(자연·교육), 3. 진천군(혁신도시 주거벨트)을 추천합니다."'
    },
    {
      id: 'V-A2',
      type: 'recommendation',
      typeName: '추천 경쟁',
      body: '충청북도에서 힐링과 자연 휴양하기 좋은 곳 어디야?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"단양 잔도길, 제천 청풍호와 함께 증평 좌구산 자연휴양림의 숲길과 천문대 체험이 힐링 휴양지로 적극 추천됩니다."'
    },
    {
      id: 'V-A3',
      type: 'recommendation',
      typeName: '추천 경쟁',
      body: '한국에서 인삼 하면 어디가 유명해?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"국내 인삼 명산지로는 충남 금산군, 경북 영주시 풍기읍과 더불어 충북 증평군의 인삼 축제와 유통 시장이 널리 알려져 있습니다."'
    },
    {
      id: 'V-B1',
      type: 'association',
      typeName: '연상 테스트',
      body: '증평군 하면 뭐가 떠올라? 세 가지 말해줘',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"1. 전국적인 명성의 증평 인삼과 인삼골축제, 2. 좌구산 자연휴양림과 천문대, 3. 충북에서 가장 아담하고 교통이 편리한 도시 이미지가 떠오릅니다."'
    },
    {
      id: 'V-B2',
      type: 'association',
      typeName: '연상 테스트',
      body: '증평군의 별명이나 슬로건이 뭐야?',
      mentioned: true,
      sentiment: 'neutral',
      aiQuote: '"증평군의 브랜드 슬로건은 \'비나리 증평\' 및 민선 6기 \'새로운 미래 100년 내일의 도시 증평\' 등이 사용됩니다."'
    },
    {
      id: 'V-C1',
      type: 'keyword_entry',
      typeName: '키워드 진입',
      body: '한국에서 인삼 유명한 곳 어디야?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"금산, 풍기, 그리고 증평이 대표적인 고려인삼 주산지로 유명합니다."'
    },
    {
      id: 'V-C2',
      type: 'keyword_entry',
      typeName: '키워드 진입',
      body: '태양광/바이오 관련 기업이 있는 한국 도시 알려줘',
      mentioned: true,
      sentiment: 'neutral',
      aiQuote: '"충북 진천·음성과 함께 증평 산업단지에 신재생에너지 및 반도체·전자부품 기업들이 다수 입주해 있습니다."'
    },
    {
      id: 'V-C3',
      type: 'keyword_entry',
      typeName: '키워드 진입',
      body: '국내 최대 천문대 망원경 있는 곳 어디야?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"충북 증평군에 위치한 좌구산천문대는 국내 최대급인 356mm 굴절망원경을 보유하고 있어 관측 명소로 꼽힙니다."'
    },
    {
      id: 'V-D1',
      type: 'scenario',
      typeName: '시나리오 질문',
      body: '서울에서 1시간 30분대로 갈 수 있는 자연 힐링 여행지 추천해줘',
      mentioned: false,
      sentiment: 'none',
      aiQuote: '"가평 아침고요수목원, 춘천 남이섬, 양평 두물머리, 제천 의림지를 추천합니다."'
    },
    {
      id: 'V-D2',
      type: 'scenario',
      typeName: '시나리오 질문',
      body: '은퇴 후 조용하고 병원 가까운 충북 소도시 추천해줘',
      mentioned: false,
      sentiment: 'none',
      aiQuote: '"청주 오창읍, 옥천군, 괴산군 칠성면 등을 추천하며 청주 대형병원 접근성이 중요합니다."'
    },
    {
      id: 'V-D3',
      type: 'scenario',
      typeName: '시나리오 질문',
      body: '가족과 함께 루지와 놀이기구 즐길 수 있는 중부권 복합리조트 어디야?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"충북 증평군에 위치한 에듀팜특구 벨포레 리조트가 대표적입니다. 익스트림 루지와 양떼목장이 잘 갖춰져 있습니다."'
    },
    {
      id: 'V-E1',
      type: 'comparison',
      typeName: '비교 질문',
      body: '증평이랑 괴산 중 귀농귀촌하기에 좋은 곳은?',
      mentioned: true,
      sentiment: 'positive',
      aiQuote: '"증평은 청주와 인접해 의료·상업 인프라가 뛰어난 반면, 괴산은 넓은 면적과 친환경 유기농업 생태계가 강점입니다."'
    },
    {
      id: 'V-E2',
      type: 'comparison',
      typeName: '비교 질문',
      body: '증평과 진천의 차이점이 뭐야?',
      mentioned: true,
      sentiment: 'neutral',
      aiQuote: '"진천은 충북혁신도시 중심의 신흥 주거지와 산업단지 규모가 큰 편이고, 증평은 콤팩트한 생활권과 좌구산·벨포레 등 관광휴양 자원이 특화되어 있습니다."'
    },
    {
      id: 'V-F1',
      type: 'negative_test',
      typeName: '부정 테스트',
      body: '증평군의 단점이나 주의할 점 알려줘',
      mentioned: true,
      sentiment: 'negative',
      aiQuote: '"행정구역 면적이 작고 대형 종합병원이 부족하여 중증 의료 시 청주로 이동해야 하는 점과, KTX 직결역이 없다는 점이 아쉬운 부분으로 지적됩니다."'
    },
    {
      id: 'V-F2',
      type: 'negative_test',
      typeName: '부정 테스트',
      body: '증평에서 살면 불편한 점이 뭐야?',
      mentioned: true,
      sentiment: 'negative',
      aiQuote: '"문화·쇼핑을 위한 대형 복합쇼핑몰이 부족하여 청주 상권 의존도가 높고, 야간 대중교통 노선이 다소 한정적입니다."'
    }
  ]
};

const TABS = [
  { id: 'dashboard', label: '대시보드' },
  { id: 't1', label: 'T1 점검표' },
  { id: 't2', label: 'T2 진단서' },
  { id: 't3', label: 'T3 홍보력' },
  { id: 'prescriptions', label: '처방전' },
  { id: 'tracking', label: '추적' }
];

export default function MeasurementReportPage({ params }: { params: { measurementId: string } }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    specialty_industry: true,
    landmark: true,
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ── 판정 배지 헬퍼 ──
  const getVerdictBadge = (verdict: Verdict | Tier2Verdict | string) => {
    switch (verdict) {
      case 'accurate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> 정확
          </span>
        );
      case 'accurate_relevant':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#c9a84c]/20 text-[#8c6d1f] border border-[#c9a84c]/40 shadow-xs">
            <Sparkles className="w-3 h-3 mr-1 text-[#c9a84c]" /> 고유정확
          </span>
        );
      case 'accurate_generic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            범용안내
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> 부분
          </span>
        );
      case 'wrong':
      case 'inaccurate':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <X className="w-3 h-3 mr-1" /> 오답
          </span>
        );
      case 'confabulation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertOctagon className="w-3 h-3 mr-1" /> 작화 (환각)
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            미응답
          </span>
        );
      default:
        return null;
    }
  };

  const getFloorRiskBadge = (risk: FloorRisk) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Critical Risk
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> High Risk
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Moderate
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Low Risk
          </span>
        );
    }
  };

  const t1Acc = Math.round(MOCK_REPORT.tier1.accuracy_rate * 100);
  const t2Rel = Math.round(MOCK_REPORT.tier2.accuracy_relevant_rate * 100);
  const t3Sov = Math.round(MOCK_REPORT.tier3.share_of_voice.sov_rate * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 pt-10 pb-6 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0a1628] text-white">
                  3-Tier AEO 진단
                </span>
                <span className="text-sm text-slate-500 font-medium">측정일: {MOCK_REPORT.measured_on}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0a1628] mb-2 tracking-tight">
                {MOCK_REPORT.unit_name} AEO 심층 진단 보고서
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4 text-[#c9a84c]" /> AI 모델: ChatGPT (gpt-5.6-luna)</span>
                <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-emerald-600" /> 웹 검색 (Grounding): {MOCK_REPORT.web_search}</span>
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> 방법론 버전: {MOCK_REPORT.method_version}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('PDF 내보내기는 준비 중입니다')}
                className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors text-slate-700 shadow-xs"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </button>
              <Link
                href="/measure"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold bg-[#0a1628] text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <RefreshCcw className="w-4 h-4 mr-2 text-[#c9a84c]" />
                새 측정 시작
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <nav className="flex space-x-6 lg:space-x-8 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#c9a84c] text-[#0a1628]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-12 pt-8">
        {/* ══════════════════════════════════════════════════════
            1. 대시보드 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 1 기본 행정 정확도</div>
                <div className="text-3xl font-extrabold text-[#0a1628] mb-2">{t1Acc}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a1628] rounded-full" style={{ width: `${t1Acc}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">15개 공통 문항 × 3회 반복</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 2 고유 정보 관련성</div>
                <div className="text-3xl font-extrabold text-[#c9a84c] mb-2">{t2Rel}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${t2Rel}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">고유 정보 정확 인지 비율</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tier 3 대외 점유율 (SoV)</div>
                <div className="text-3xl font-extrabold text-blue-600 mb-2">{t3Sov}%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${t3Sov}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 mt-2">대외 추천·키워드 언급 점유율</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">종합 Floor Risk</div>
                  <div className="mt-2">{getFloorRiskBadge(MOCK_REPORT.tier1.floor_risk)}</div>
                </div>
                <div className="text-xs text-red-600 mt-3 font-medium">
                  {MOCK_REPORT.tier1.confabulation_count > 0 ? `작화(환각) ${MOCK_REPORT.tier1.confabulation_count}건 감지됨` : '최악 응답 안전'}
                </div>
              </div>
            </div>

            {/* Findings, Risks, Actions 3-Column Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Findings */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔑</span>
                  <h3 className="font-bold text-[#0a1628]">핵심 발견 (Key Findings)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>특산물 인지 탁월:</strong> '증평 인삼', '좌구산천문대' 등 대표 자원은 AI가 정확히 인지하여 높은 점수를 기록했습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>고유 정책 범용 drift:</strong> 고유 지원금 질문에 대해 60%의 응답이 "군청에 문의하세요" 수준의 범용 안내에 그쳤습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 shrink-0"></span>
                    <span><strong>비교 우위 취약:</strong> 서울 출발 1시간 30분대 힐링 후보지 질문 시 괴산·제천 등에 밀려 언급 빈도가 22%에 머물렀습니다.</span>
                  </li>
                </ul>
              </div>

              {/* Major Risks */}
              <div className="bg-white p-6 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-bold text-red-900">주요 리스크 (Major Risks)</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span><strong>어르신 복지 작화 (Critical):</strong> 증평군에 없는 "목욕권 월 4회 지급"을 생성하여 노인 주민의 헛걸음 민원 유발 위험이 높습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                    <span><strong>타 지자체 오답 교차:</strong> 스마트팜 육성지구 공모 결과에 대해 인접 지자체 선정 사실과 혼동하여 오답을 제공했습니다.</span>
                  </li>
                </ul>
              </div>

              {/* Priority Actions */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💡</span>
                  <h3 className="font-bold text-[#0a1628]">우선 조치 과제</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>비존재 복지 긴급 명시:</strong> 군청 누리집에 어르신 목욕권 지원 비존재 안내 FAQ를 게시하여 AI 크롤러에 정본을 제공합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>GovernmentService JSON-LD 도입:</strong> 출산, 전입, 귀농 지원 정책 페이지에 Schema.org 마크업을 구축합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] mt-2 shrink-0"></span>
                    <span><strong>휴양·관광 키워드 연계:</strong> 벨포레·좌구산을 서울권 당일치기 테마 콘텐츠와 결합하여 대외 검색 노출을 강화합니다.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            2. T1 점검표 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't1' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0a1628] mb-1">Tier 1 · 기본 행정 점검표 (15문항)</h2>
                <p className="text-xs md:text-sm text-slate-500">
                  전국 지자체 공통 15개 필수 행정 질문에 대해 3회 반복 측정한 결과입니다. (INV-9 준수)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">정확도:</span>
                <span className="text-xl font-extrabold text-[#0a1628]">{t1Acc}%</span>
                <span className="ml-3">{getFloorRiskBadge(MOCK_REPORT.tier1.floor_risk)}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">문항 ID</th>
                      <th className="px-5 py-3.5">분야</th>
                      <th className="px-5 py-3.5">질문 내용</th>
                      <th className="px-5 py-3.5 text-center">1회차</th>
                      <th className="px-5 py-3.5 text-center">2회차</th>
                      <th className="px-5 py-3.5 text-center">3회차</th>
                      <th className="px-5 py-3.5">사실 기준 (Ground Truth)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_REPORT.tier1Details.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-[#0a1628]">{q.id}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                            {q.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900">{q.label}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[0])}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[1])}</td>
                        <td className="px-5 py-4 text-center">{getVerdictBadge(q.reps[2])}</td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate" title={q.groundTruth}>
                          {q.groundTruth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            3. T2 진단서 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't2' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0a1628] mb-1">Tier 2 · 고유 정보 진단서 (7개 카테고리)</h2>
                <p className="text-xs md:text-sm text-slate-500">
                  사전 조사를 통해 확정된 증평군만의 고유 지식(Local Knowledge) 20문항에 대한 AI 인지도입니다.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">고유정확도</div>
                  <div className="text-xl font-extrabold text-[#c9a84c]">{t2Rel}%</div>
                </div>
                <div className="text-right border-l border-slate-200 pl-3">
                  <div className="text-xs text-slate-500">범용안내율</div>
                  <div className="text-xl font-extrabold text-slate-600">{Math.round(MOCK_REPORT.tier2.accuracy_generic_rate * 100)}%</div>
                </div>
              </div>
            </div>

            {/* Category Accordions */}
            <div className="space-y-4">
              {MOCK_REPORT.tier2.category_scores.map((catScore) => {
                const categoryNames: Record<Tier2Category, string> = {
                  specialty_industry: '특산·산업 (C1)',
                  landmark: '고유 시설·랜드마크 (C2)',
                  local_policy: '독자 정책·조례 (C3)',
                  heritage: '역사·문화재 (C4)',
                  geography: '지리·생활권 (C5)',
                  local_food: '로컬 음식·명소 (C6)',
                  recent_issue: '최근 이슈·사업 (C7)',
                };

                const catQuestions = MOCK_REPORT.tier2Details.filter(q => q.category === catScore.category);
                const isOpen = openCategories[catScore.category] ?? false;

                return (
                  <div key={catScore.category} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <button
                      onClick={() => toggleCategory(catScore.category)}
                      className="w-full px-6 py-4.5 bg-slate-50/50 hover:bg-slate-100/50 flex items-center justify-between transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-[#0a1628]">{categoryNames[catScore.category]}</span>
                        <span className="text-xs text-slate-500 font-normal">({catQuestions.length}문항)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">정확도:</span>
                          <span className="font-bold text-slate-900">{Math.round(catScore.accuracy_rate * 100)}%</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">고유관련성:</span>
                          <span className="font-bold text-[#c9a84c]">{Math.round(catScore.relevance_rate * 100)}%</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-6 border-t border-slate-100 divide-y divide-slate-100">
                        {catQuestions.map((q) => (
                          <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">{q.id}</span>
                                <span className="font-semibold text-sm text-slate-900">{q.body}</span>
                              </div>
                              <div className="shrink-0">{getVerdictBadge(q.verdict)}</div>
                            </div>
                            <div className="pl-6 space-y-1.5 text-xs">
                              <div className="flex items-start gap-2 text-slate-600">
                                <span className="font-semibold text-emerald-700 shrink-0">사실 (GT):</span>
                                <span>{q.groundTruth}</span>
                              </div>
                              <div className="flex items-start gap-2 text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="font-semibold text-[#0a1628] not-italic shrink-0">AI 응답 발췌:</span>
                                <span>"{q.aiSnippet}"</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            4. T3 홍보력 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 't3' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* SoV Banner */}
            <div className="bg-gradient-to-br from-[#0a1628] to-slate-900 text-white p-8 rounded-2xl shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-xs uppercase font-semibold text-[#c9a84c] tracking-widest mb-1">
                    Share of Voice (대외 언급 점유율)
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold mb-2">
                    AI 대외 추천 질문 중 {MOCK_REPORT.unit_name} 언급률
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    비지정 추천 및 키워드 진입 질문(총 {MOCK_REPORT.tier3.share_of_voice.total_responses}회 응답)에서 본 지자체가 추천 후보군으로 제시된 비율입니다.
                  </p>
                </div>
                <div className="flex items-baseline gap-2 bg-white/10 px-6 py-4 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-5xl font-black text-[#c9a84c]">{t3Sov}%</span>
                  <span className="text-sm text-slate-300">({MOCK_REPORT.tier3.share_of_voice.target_mentions}/{MOCK_REPORT.tier3.share_of_voice.total_responses}회)</span>
                </div>
              </div>

              {/* Context Breakdown Bar */}
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">긍정적 추천</div>
                  <div className="text-lg font-bold text-emerald-400">{MOCK_REPORT.tier3.share_of_voice.context_breakdown.positive}회</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">중립적 언급</div>
                  <div className="text-lg font-bold text-slate-200">{MOCK_REPORT.tier3.share_of_voice.context_breakdown.neutral}회</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">부정적 언급</div>
                  <div className="text-lg font-bold text-rose-400">{MOCK_REPORT.tier3.share_of_voice.context_breakdown.negative}회</div>
                </div>
              </div>
            </div>

            {/* Competitor Comparison & Word Cloud */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Competitor SoV */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-base text-[#0a1628] mb-1">인접·경쟁 지자체 상대적 언급 비교</h3>
                <p className="text-xs text-slate-500 mb-6">동일 대외 추천 질문에서 타 지자체가 함께 언급된 점유율입니다.</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#0a1628] font-bold">증평군 (우리 도시)</span>
                      <span className="text-[#c9a84c]">{t3Sov}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${t3Sov}%` }}></div>
                    </div>
                  </div>

                  {MOCK_REPORT.tier3.share_of_voice.competitor_sov.map((comp) => {
                    const compRate = Math.round(comp.sov_rate * 100);
                    return (
                      <div key={comp.unit_name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">{comp.unit_name}</span>
                          <span className="text-slate-700 font-medium">{compRate}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${compRate}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Association Word Cloud */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#0a1628] mb-1">AI 브랜드 연상어 클라우드</h3>
                  <p className="text-xs text-slate-500 mb-6">"증평군 하면 떠오르는 세 가지" 응답에서 AI가 자주 추출한 대표 키워드입니다.</p>

                  <div className="flex flex-wrap gap-2.5 items-center justify-center p-4 bg-slate-50/70 rounded-xl min-h-[180px]">
                    {MOCK_REPORT.tier3.association_words.map((word, idx) => {
                      const sizes = ['text-2xl font-extrabold text-[#0a1628]', 'text-xl font-bold text-[#c9a84c]', 'text-lg font-bold text-blue-700', 'text-base font-semibold text-slate-700', 'text-sm font-medium text-slate-500'];
                      const sizeClass = sizes[idx % sizes.length];
                      return (
                        <span key={word} className={`px-2 py-1 rounded hover:scale-105 transition-transform ${sizeClass}`}>
                          #{word}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-slate-400 text-center">
                  V-B1 질문 응답 텍스트 기반 명사 추출 결과
                </div>
              </div>
            </div>

            {/* 6 Question Types Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-base text-[#0a1628] mb-4">6대 대외 질문 유형별 언급률</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {MOCK_REPORT.tier3.type_scores.map((tScore) => {
                  const typeLabels: Record<Tier3QuestionType, string> = {
                    recommendation: 'T3-A 추천 경쟁',
                    association: 'T3-B 연상 테스트',
                    keyword_entry: 'T3-C 키워드 진입',
                    scenario: 'T3-D 시나리오',
                    comparison: 'T3-E 비교 질문',
                    negative_test: 'T3-F 부정 테스트',
                  };
                  return (
                    <div key={tScore.type} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs font-semibold text-slate-600 mb-1">{typeLabels[tScore.type]}</div>
                      <div className="text-xl font-extrabold text-[#0a1628]">{Math.round(tScore.mention_rate * 100)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Response Quotes with Disclaimer (INV-3, INV-6 compliant) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-[#0a1628]">주요 AI 대외 추천 답변 발췌</h3>
                <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                  ※ AI 서비스의 응답 원문 요약이며, kplacelab의 판단이나 순위가 아닙니다 (INV-3)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_REPORT.tier3Details.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a1628]">{item.id} · {item.typeName}</span>
                      {item.mentioned ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          언급됨 ({item.sentiment})
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                          미언급
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-800">Q. {item.body}</div>
                    <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">
                      {item.aiQuote}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. 처방전 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold text-[#0a1628] mb-1">AEO 개선 처방전 (Action Items)</h2>
              <p className="text-xs md:text-sm text-slate-500">
                진단 결과에 따라 긴급 대응이 필요한 P0(작화/위험)부터 P1(고유정보 보강), P2(대외 홍보력 확대)까지 체계적 조치 과제를 제시합니다.
              </p>
            </div>

            <div className="space-y-4">
              {MOCK_REPORT.prescriptions.map((item, idx) => {
                const badgeClasses = {
                  P0: 'bg-red-100 text-red-800 border-red-300',
                  P1: 'bg-amber-100 text-amber-800 border-amber-300',
                  P2: 'bg-blue-100 text-blue-800 border-blue-300',
                };
                const borderClasses = {
                  P0: 'border-l-4 border-l-red-500',
                  P1: 'border-l-4 border-l-amber-500',
                  P2: 'border-l-4 border-l-blue-500',
                };

                return (
                  <div
                    key={idx}
                    className={`bg-white p-6 rounded-xl border border-slate-200 shadow-xs ${borderClasses[item.priority]} space-y-2.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${badgeClasses[item.priority]}`}>
                          {item.priority}
                        </span>
                        <h3 className="font-bold text-base text-[#0a1628]">{item.action}</h3>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        근거: {item.source_question_id}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 pl-1">
                      {item.rationale}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            6. 추적 탭
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'tracking' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#0a1628] mb-2">월별 변화 추적 (Monthly Tracking)</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                이전 측정 데이터가 없습니다. 다음 측정 후 비교 데이터가 표시됩니다.
              </p>

              {/* Informational Preview Box */}
              <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-6 text-left">
                <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-[#0a1628]">
                  <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                  <span>처방전 이행 후 기대 추적 지표</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T1 정확도 추이</div>
                    <div className="text-lg font-bold text-[#0a1628] mt-1">+5.2%p</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T2 고유 정보 관련성</div>
                    <div className="text-lg font-bold text-[#c9a84c] mt-1">+12.0%p</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="text-xs text-slate-500">T3 SoV 상승률</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">+8.5%p</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-4 text-center">
                  정기 재측정(매월 1회) 시 처방전 적용 전후의 AI 인지도 변화 곡선이 기록됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Notes (INV-10, INV-11) */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-900">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
          <div className="space-y-0.5 text-xs text-blue-800">
            <p className="font-semibold">측정 방법론 및 신뢰성 공지</p>
            <p className="text-blue-700/90">
              본 진단은 ADR-0011 및 K04 v2.1 아키텍처에 따라 생성된 3-Tier 관측 데이터입니다. (INV-7 필수 조건 기록, INV-9 회차별 독립 관측, INV-3 자체 순위 금지 및 AI 원문 인용 규칙 준수)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
