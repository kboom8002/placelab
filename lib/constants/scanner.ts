// lib/constants/scanner.ts
// 출처: SDD 3.3, K03 §1, AGENTS.md INV-5, IMPLEMENTATION-PLAN §4 U-1

export const SCANNER_UA =
  'JeongdapNoteBot/1.0 (+https://jeongdap.kr/bot; contact@jeongdap.kr)' as const;

// 12주 전환기 동안 /bot 페이지에 함께 안내하는 구 식별자 (IMPLEMENTATION-PLAN §4 U-1)
export const LEGACY_SCANNER_UA =
  'KPlaceLabBot/1.0 (+https://kplacelab.kr/bot; contact@kplacelab.kr)' as const;

export const SCAN_TIMEOUT_MS = 10_000;
export const SCAN_MIN_INTERVAL_MS = 5_000; // 도메인 전체 스캔 시 같은 호스트 최소 간격
export const CITED_PAGE_MIN_INTERVAL_MS = 1_500; // 인용 페이지 확인 수집 시 같은 호스트 최소 간격 (FR-83, R13)
export const CITED_PAGE_DAILY_HOST_LIMIT = 60; // 인용 페이지 확인 수집 시 호스트당 일 상한
export const SCAN_MAX_REDIRECTS = 3;
export const SCAN_BATCH_SIZE = 20;
export const SCAN_MAX_ATTEMPTS = 3;
export const SCAN_CADENCE = 'weekly' as const;

export const PROMOTION_REQUIRED_WEEKS = 2; // INV-8 (보존된 verdicts 제약)
export const FIRST_PUBLICATION_NOTICE_DAYS = 0; // ADR-0016: 자체 사업 측정은 사전 통지·14일 대기 생략
export const CHANGE_NOTICE_DAYS = 0;
