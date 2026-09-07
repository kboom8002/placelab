// lib/theme-lab/types.ts
// Policy Theme Lab (PRD v3.0) 데이터 모델 및 타입 정의

export type LifeTopic =
  | 'housing'        // 주거
  | 'care'           // 돌봄 (영유아, 노인, 장애인)
  | 'mobility'       // 이동 (교통, 버스, 보행)
  | 'work'           // 일 (일자리, 청년, 소상공인)
  | 'environment'    // 환경 (폐기물, 공원, 탄소)
  | 'culture'        // 문화 (관광, 축제, 도서관)
  | 'civic_admin'    // 생활행정 (민원, 증명, 세무)
  | 'other';         // 기타

export type TaskStage =
  | 'discovery'          // 발견 (제도가 있는지 모름)
  | 'understanding'      // 이해 (조건·자격 불명확)
  | 'comparison'         // 비교 (타 지역이나 타 제도와 비교)
  | 'application'        // 신청 (창구, 온라인 절차 막힘)
  | 'use'                // 이용 (실제 수령·방문 중 발생)
  | 'post_confirmation' // 사후 확인 (변경, 취소, 자격 갱신)
  | 'unknown';

export type QuestionFunction =
  | 'fact'          // 사실 (단순 금액, 전화번호, 위치)
  | 'condition'     // 조건 (연령, 소득, 거주 요건)
  | 'reason'        // 이유 (왜 다른지, 왜 제외되었는지)
  | 'procedure'     // 절차 (어디서 어떻게 신청하는지)
  | 'alternative'   // 대안 (안 될 때 어디로 가야 하는지)
  | 'criteria'      // 평가 기준 (선정 방식, 우선순위)
  | 'other';

export type DifficultyCandidate =
  | 'info_absence'             // 정보 부재 (공식 안내 없음)
  | 'contradiction'            // 정보 상충 (자료마다 숫자가 다름)
  | 'understanding_difficulty' // 이해 어려움 (행정 전문용어)
  | 'access'                   // 접근 어려움 (이미지/PDF/찾기 힘듦)
  | 'procedure'                // 절차 복잡 (창구 핑퐁)
  | 'supply'                   // 공급 부족 (대기 장기화)
  | 'unknown';

export type InputType = 'question' | 'experience' | 'comparison' | 'suggestion';

export type SourceType =
  | 'citizen'      // 주민 직접 작성
  | 'facilitator'  // 진행자 대면/전화 기록
  | 'agency'       // 기관 FAQ / 공무원 관찰
  | 'researcher'   // 연구자 조사
  | 'ai'           // AI 모델 생성 (합성)
  | 'report';      // PlaceLab 진단 보고서 파생

export interface CollectionMission {
  id: string;
  unitId: string | null;
  title: string;
  lifeTask: string;
  channels: string[];
  periodStart?: string;
  periodEnd?: string;
  scopeNote?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface Submission {
  id: string;
  missionId?: string;
  unitId?: string;
  rawText: string;
  inputType: InputType;
  sourceType: SourceType;
  isRealExperience: boolean;
  consentScope: 'internal' | 'public_anonymized' | 'research_only';
  contactEmail?: string;
  createdAt: string;
}

export interface SubmissionContext {
  id: string;
  submissionId: string;
  intendedTask?: string;
  blockedAt?: string;
  alreadyChecked?: string;
  resolutionStatus: 'resolved' | 'unresolved' | 'partial' | 'unknown';
  followupQuestions: {
    questionText: string;
    targetField: string;
    isSynthetic: boolean;
  }[];
  confirmedByParticipant: boolean;
  createdAt: string;
}

export interface RefinedQuestion {
  id: string;
  unitId?: string;
  submissionIds: string[];
  refinedText: string;
  lifeTopic: LifeTopic;
  taskStage: TaskStage;
  questionFunction?: QuestionFunction;
  difficultyCandidate?: DifficultyCandidate;
  sourceType: SourceType;
  status: 'draft' | 'reviewed' | 'approved' | 'archived';
  createdAt: string;
}

export interface QuestionCluster {
  id: string;
  unitId?: string;
  title: string;
  representativeQuestionId?: string;
  questionIds: string[];
  commonTask?: string;
  observedBlockage?: string;
  mergeReason?: string;
  createdAt: string;
}

export interface DiagnosticQuestionItem {
  id: string;
  text: string;
  tier: 'T1' | 'T1-V' | 'T2' | 'T3' | 'T3-C' | 'T3-D' | 'T4';
  targetField: string;
  expectedGroundTruth?: string;
  evaluationNote?: string;
}

export interface PolicyTheme {
  id: string;
  unitId?: string;
  unitName?: string;
  themeCode: string;
  title: string;
  coreQuestion: string;
  clusterIds: string[];
  targetAudience: string;
  observedPatterns: string;
  unconfirmedCauses: string;
  existingSolutions?: string;
  nextDiagnosticQuestions: DiagnosticQuestionItem[];
  nextCitizenQuestions: string[];
  status: 'candidate' | 'context_enriched' | 'citizen_confirmed' | 'research_ready' | 'suspended';
  createdAt: string;
}
