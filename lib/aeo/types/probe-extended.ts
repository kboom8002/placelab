// lib/aeo/types/probe-extended.ts
// 확대 프로브 질문 타입 정의 — T1-V, T3-C, T3-D, T4
// 기존 T1/T2/T3 타입은 source-analysis.ts에 정의됨

/** T1-V: 사실 검증 프로브 */
export interface VerificationProbe {
  id: string;                    // "V1-B04-01"
  parentId: string;              // "B-04" (T1 원본 문항 ID)
  tier: 'T1-V';
  category: string;              // "waste_bag", "birth", ...
  body: string;                  // "수원시 20L 종량제봉투 가격은?"
  groundTruth: string;           // "590원"
  groundTruthSource: string;     // "https://www.suwon.go.kr"
  acceptableVariants: string[];  // ["590", "오백구십"]
  errorType: 'numeric' | 'name' | 'date' | 'url' | 'procedure';
}

/** T1-V 채점 결과 */
export type VerificationVerdict =
  | 'correct'           // GT와 일치
  | 'outdated'          // 답은 했지만 구버전 정보
  | 'wrong_value'       // 숫자/이름 틀림 (작화)
  | 'wrong_procedure'   // 절차 설명 오류
  | 'absent';           // 미응답

/** K03 §M-2.3.2 Failure Syndrome 분류 */
export type FailureSyndrome =
  | 'confabulation'     // 존재하지 않는 정책/창구 조작
  | 'stale_fact'        // 과거 정보를 현재처럼 답변
  | 'generic_drift'     // 구체성 상실 → "시청에 문의하세요"
  | 'cross_unit'        // 다른 지자체 정보 혼동
  | 'hypersensitivity'  // 프롬프트 표현에 과민
  | 'unstable_skeleton'; // 반복 간 구조 진동

/** T3-C: 경쟁 매핑 프로브 */
export interface CompetitiveProbe {
  id: string;                    // "C-01"
  tier: 'T3-C';
  type: 'competitive';
  body: string;
  competitors: string[];         // ["용인", "화성", "성남"]
  category: 'livability' | 'education' | 'tourism' | 'industry' | 'cost';
  targetKeywords: string[];      // ["수원"]
}

/** T3-C 경쟁 매핑 결과 */
export interface CompetitiveResult {
  questionId: string;
  question: string;
  category: string;
  targetMentioned: boolean;
  competitorsMentioned: { name: string; mentioned: boolean }[];
}

/** T3-D: 부정 평판 프로브 */
export interface ReputationProbe {
  id: string;                    // "D-01"
  tier: 'T3-D';
  type: 'reputation';
  body: string;
  riskCategory: 'safety' | 'environment' | 'governance' | 'cost' | 'general';
  targetKeywords: string[];
}

/** T3-D 평판 분석 결과 */
export interface ReputationResult {
  questionId: string;
  riskCategory: string;
  mentionedIssues: string[];     // AI가 언급한 이슈들
  severity: 'low' | 'medium' | 'high';
  defenseNeeded: boolean;
}

/** T4: 출처 추적 프로브 */
export interface SourceTrackingProbe {
  id: string;                    // "T4-01"
  tier: 'T4';
  type: 'source_tracking';
  body: string;
  expectedDomains: string[];     // ["suwon.go.kr", "swcf.or.kr"]
}

/** T4 출처 추적 결과 */
export interface SourceTrackingResult {
  questionId: string;
  citedUrls: string[];
  officialUrlCount: number;      // .go.kr, .or.kr
  unofficialUrlCount: number;    // 블로그, 위키 등
  officialDomains: string[];     // 인용된 공식 도메인
  sourceQuality: 'official' | 'mixed' | 'unofficial' | 'none';
}

/** 확대 프로브 대시보드 (VIPDashboard에 추가) */
export interface ExtendedDashboard {
  // T1-V 사실 검증
  verificationCorrect: number;
  verificationWrong: number;
  verificationOutdated: number;
  verificationAbsent: number;
  verificationTotal: number;
  verificationRate: number;        // correct / total

  // T3-C 경쟁 매핑
  competitiveWins: number;         // 우리가 언급된 질문 수
  competitiveLosses: number;       // 경쟁자는 언급되고 우리는 빠진 수
  competitiveTotal: number;

  // T3-D 부정 평판
  reputationHighRisk: number;
  reputationMediumRisk: number;
  reputationLowRisk: number;

  // T4 출처 추적
  sourceOfficialRate: number;      // 공식 출처 비율
  sourceOfficialCount: number;
  sourceTotalCount: number;
}
