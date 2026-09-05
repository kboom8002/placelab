// lib/constants/scanner.ts
// 출처: SDD 3.3, K03 §1, AGENTS.md INV-5

export const SCANNER_UA =
  'KPlaceLabBot/1.0 (+https://kplacelab.kr/bot; contact@kplacelab.kr)' as const;
export const SCAN_TIMEOUT_MS = 10_000;
export const SCAN_MIN_INTERVAL_MS = 5_000; // 같은 호스트에 대한 최소 간격
export const SCAN_MAX_REDIRECTS = 3;
export const SCAN_BATCH_SIZE = 20;
export const SCAN_MAX_ATTEMPTS = 3;
export const SCAN_CADENCE = 'weekly' as const;

export const PROMOTION_REQUIRED_WEEKS = 2; // INV-8
export const FIRST_PUBLICATION_NOTICE_DAYS = 14; // FR-24
export const CHANGE_NOTICE_DAYS = 7;
