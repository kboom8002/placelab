// lib/auth/roles.ts
// 앱 역할 정의와 파싱 (순수 함수 — I/O 없음, Edge/Node 어디서나 import 가능)
//
// 출처: docs/IMPLEMENTATION-PLAN-jeongdap-note.md §7.3, §9 (roles_rls_v2), Phase 0
// 역할은 Supabase `app_metadata.app_roles` 에서만 읽는다.
//   - `user_metadata` 는 사용자가 직접 고칠 수 있으므로 절대 읽지 않는다.
//   - `app_metadata` 는 service_role 로만 쓸 수 있다.
// Phase 4 에서 `user_roles` 테이블 + JWT custom claim 으로 대체된다. 그때까지의 임시 경로다.

export const OPS_ROLES = [
  'ops_admin',
  'ops_editor',
  'ops_measure',
  'ops_approver',
  'ops_analyst',
] as const;
export const GOV_ROLES = ['gov_admin', 'gov_official', 'gov_editor', 'gov_viewer'] as const;
export const LAB_ROLES = ['lab_org', 'lab_member'] as const;
export const CLIENT_ROLES = ['client_owner', 'client_editor', 'client_viewer'] as const;

export const APP_ROLES = [...OPS_ROLES, ...GOV_ROLES, ...LAB_ROLES, ...CLIENT_ROLES] as const;
export type AppRole = (typeof APP_ROLES)[number];

const KNOWN: ReadonlySet<string> = new Set(APP_ROLES);

/** `app_metadata` 에서 알려진 역할만 추출한다. 모르는 값은 버린다. */
export function parseAppRoles(appMetadata: unknown): AppRole[] {
  if (!appMetadata || typeof appMetadata !== 'object') return [];
  const meta = appMetadata as Record<string, unknown>;

  const raw: unknown[] = [];
  if (Array.isArray(meta.app_roles)) raw.push(...meta.app_roles);
  if (typeof meta.app_role === 'string') raw.push(meta.app_role);

  const out = new Set<AppRole>();
  for (const r of raw) {
    if (typeof r === 'string' && KNOWN.has(r)) out.add(r as AppRole);
  }
  return Array.from(out);
}

export function hasAnyRole(have: readonly AppRole[], allowed: readonly AppRole[]): boolean {
  return have.some((r) => allowed.includes(r));
}
