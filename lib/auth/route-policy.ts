// lib/auth/route-policy.ts
// 보호 경로 정책 (순수 함수). middleware.ts 와 tests/invariants/route-guard.test.ts 가 함께 쓴다.
//
// 출처: docs/IMPLEMENTATION-PLAN-jeongdap-note.md §7.3(앱 분리), §13(API 인증), Phase 0
// 경로는 라우트 그룹 `(admin)` `(org)` 를 뺀 실제 URL 이다.
// 새 관리자·조직용 라우트를 만들면 반드시 여기에 추가한다 (테스트가 누락을 잡는다).

import { CLIENT_ROLES, GOV_ROLES, LAB_ROLES, OPS_ROLES, hasAnyRole, type AppRole } from './roles';

export interface RoutePolicy {
  /** 'prefix': 경로와 그 하위 전부. 'exact': 정확히 그 경로만 */
  match: 'prefix' | 'exact';
  path: string;
  roles: readonly AppRole[];
  kind: 'api' | 'page';
}

export const ROUTE_POLICIES: readonly RoutePolicy[] = [
  // ── API: 운영 전용 ──
  { match: 'prefix', path: '/api/admin', roles: OPS_ROLES, kind: 'api' },
  { match: 'prefix', path: '/api/aeo', roles: OPS_ROLES, kind: 'api' },
  { match: 'prefix', path: '/api/measure', roles: OPS_ROLES, kind: 'api' },
  { match: 'prefix', path: '/api/ops-maps', roles: OPS_ROLES, kind: 'api' },
  { match: 'prefix', path: '/api/portal', roles: [...GOV_ROLES, ...OPS_ROLES], kind: 'api' },
  { match: 'prefix', path: '/api/kbrandlab', roles: [...LAB_ROLES, 'ops_admin'], kind: 'api' },
  { match: 'prefix', path: '/api/workspace', roles: [...CLIENT_ROLES, ...LAB_ROLES, ...OPS_ROLES], kind: 'api' },

  // ── 페이지: 운영 전용 ──
  { match: 'prefix', path: '/admin', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/ops', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/review', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/scans', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/correction-mgmt', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/measure', roles: OPS_ROLES, kind: 'page' },
  { match: 'prefix', path: '/reviewer', roles: OPS_ROLES, kind: 'page' },
  // AEO 는 내부 연구 도구다 (계획 §6, 판매 중단 U-4)
  { match: 'prefix', path: '/aeo', roles: OPS_ROLES, kind: 'page' },

  // ── 페이지: 조직 ──
  // `/dashboard/reports` 는 (public) 의 시민 신고 현황이므로 정확히 `/dashboard` 만 막는다.
  { match: 'exact', path: '/dashboard', roles: [...GOV_ROLES, ...OPS_ROLES], kind: 'page' },
  { match: 'prefix', path: '/portal', roles: [...GOV_ROLES, ...OPS_ROLES], kind: 'page' },
  { match: 'prefix', path: '/kbrandlab', roles: [...LAB_ROLES, 'ops_admin'], kind: 'page' },
  { match: 'prefix', path: '/workspace', roles: [...CLIENT_ROLES, ...LAB_ROLES, ...OPS_ROLES], kind: 'page' },
];

/** 연속 슬래시·끝 슬래시를 정리한다. `//api//admin` 같은 우회를 막는다. */
export function normalizePath(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    // 잘못된 인코딩은 원문 그대로 검사한다
  }
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

export function policyFor(pathname: string): RoutePolicy | null {
  const p = normalizePath(pathname);
  for (const policy of ROUTE_POLICIES) {
    if (policy.match === 'exact') {
      if (p === policy.path) return policy;
    } else if (p === policy.path || p.startsWith(policy.path + '/')) {
      return policy;
    }
  }
  return null;
}

export type AuthDecision =
  | { kind: 'allow'; policy: RoutePolicy | null }
  | { kind: 'unauthenticated'; policy: RoutePolicy }
  | { kind: 'forbidden'; policy: RoutePolicy };

export function authorize(
  pathname: string,
  user: { roles: readonly AppRole[] } | null,
): AuthDecision {
  const policy = policyFor(pathname);
  if (!policy) return { kind: 'allow', policy: null };
  if (!user) return { kind: 'unauthenticated', policy };
  if (!hasAnyRole(user.roles, policy.roles)) return { kind: 'forbidden', policy };
  return { kind: 'allow', policy };
}
