// lib/jeongdap/window-state.ts
// 출처:
// - docs/adr/0024-stability-rules.md
// - jeongdap-note-repo-docs-v1.1/docs/methodology/04_active-outcome-measurement-and-weekly-diagnosis.md L205-207
// - jeongdap-note-repo-docs-v1.1/measurement/observe_weekly.py L157-162, L197
// - AGENTS.md v2.0 INV-8, INV-15

import {
  WINDOW_NEW_THIS_WEEK_MIN_HITS,
  WINDOW_OCCASIONAL_MIN_HITS,
  WINDOW_STABLE_MIN_HITS,
  WINDOW_VANISHED_PREV3W_MIN_HITS,
} from './constants';
import { WindowState } from './types';

export interface FourWeekHitInput {
  /** 최근 4주 주차별 등장 횟수: [이번 주(w0), 1주 전(w1), 2주 전(w2), 3주 전(w3)] */
  weeklyHits: readonly [number, number, number, number];
}

/**
 * 상시 관측 4주(최대 12회) 창 상태 계산 (observe_weekly.py L157-161 정본):
 * - 신규: 이번 주 2회 이상 ∧ 이전 3주 합계 0회
 * - 안정: 4주 합계 9회 이상
 * - 가끔: 4주 합계 3–8회
 * - 소멸: 이번 주 0회 ∧ 직전 주 0회(최근 2주 연속 0회) ∧ 이전 3주 합계 6회 이상
 * - 드묾: 그 밖 (4주 1–2회 등)
 */
export function computeFourWeekWindowState(input: FourWeekHitInput): WindowState {
  const [w0, w1, w2, w3] = input.weeklyHits;
  const total4w = w0 + w1 + w2 + w3;
  const prev3w = w1 + w2 + w3;

  if (w0 >= WINDOW_NEW_THIS_WEEK_MIN_HITS && prev3w === 0) {
    return '신규';
  }
  if (total4w >= WINDOW_STABLE_MIN_HITS) {
    return '안정';
  }
  if (w0 === 0 && w1 === 0 && prev3w >= WINDOW_VANISHED_PREV3W_MIN_HITS) {
    return '소멸';
  }
  if (total4w >= WINDOW_OCCASIONAL_MIN_HITS) {
    return '가끔';
  }
  return '드묾';
}

/**
 * 지자체 주간 카드 등장 목록 필터 (observe_weekly.py L197):
 * '드묾'은 단발·저빈도 노이즈이므로 등장 목록에서 제외한다.
 */
export function isCardAppearState(state: WindowState): boolean {
  return state === '안정' || state === '가끔' || state === '신규';
}

/**
 * 전국 관측 기상도 공개 필터 (methodology/04 L230, INV-15):
 * 기상도에는 '안정'과 '신규'만 표시하며, 미등장 지역 명단은 절대 산출·반환하지 않는다.
 */
export function filterWeatherMapAppearingUnits<T extends { unitId: string; state: WindowState }>(
  entries: readonly T[]
): T[] {
  return entries.filter((e) => e.state === '안정' || e.state === '신규');
}
