// tests/invariants/route-guard.test.ts
// Phase 0 보안: 보호 경로 정책, 리다이렉트 검증, 코드 내 비밀키 금지
// 출처: docs/IMPLEMENTATION-PLAN-jeongdap-note.md Phase 0 완료 기준
import fs from 'fs';
import path from 'path';
import { authorize, normalizePath, policyFor } from '../../lib/auth/route-policy';
import { parseAppRoles } from '../../lib/auth/roles';
import { safeNext } from '../../lib/auth/safe-next';

const ROOT = process.cwd();

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** app/ 아래 파일 경로를 실제 URL 경로로 바꾼다. 라우트 그룹 (x) 은 뺀다. */
function toUrlPath(file: string): string {
  const rel = path.relative(path.join(ROOT, 'app'), file).split(path.sep);
  rel.pop(); // page.tsx / route.ts
  const segs = rel.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + segs.join('/');
}

export async function testRouteGuard() {
  // 1. 역할 파싱: user_metadata 는 읽지 않고, 모르는 역할은 버린다
  assert(parseAppRoles({ app_roles: ['ops_admin', 'root', 5] }).join() === 'ops_admin', '알 수 없는 역할이 통과했습니다');
  assert(parseAppRoles({ app_role: 'gov_official' }).join() === 'gov_official', 'app_role 단일 값 파싱 실패');
  assert(parseAppRoles({ user_metadata: { app_roles: ['ops_admin'] } }).length === 0, 'user_metadata 의 역할을 읽었습니다');
  assert(parseAppRoles(null).length === 0, 'null 입력 처리 실패');

  // 2. 인가 판정
  const ops = { roles: ['ops_measure'] as const };
  const gov = { roles: ['gov_official'] as const };
  assert(authorize('/api/measure/run', null).kind === 'unauthenticated', '미로그인 /api/measure 가 열려 있습니다');
  assert(authorize('/api/measure/run', gov).kind === 'forbidden', '지자체 계정이 /api/measure 에 접근했습니다');
  assert(authorize('/api/measure/run', ops).kind === 'allow', '운영 계정이 /api/measure 에 접근하지 못합니다');
  assert(authorize('/api/aeo/crawl', null).kind === 'unauthenticated', '미로그인 /api/aeo 가 열려 있습니다');
  assert(authorize('/api/admin/reports', null).kind === 'unauthenticated', '미로그인 /api/admin 이 열려 있습니다');
  assert(authorize('/dashboard', gov).kind === 'allow', '지자체 계정이 /dashboard 에 접근하지 못합니다');
  assert(authorize('/dashboard', null).kind === 'unauthenticated', '미로그인 /dashboard 가 열려 있습니다');
  assert(authorize('/kbrandlab', gov).kind === 'forbidden', '지자체 계정이 K-Brand Lab 에 접근했습니다');

  // 3. 공개 경로는 막지 않는다
  for (const p of ['/', '/units', '/units/lg-11530', '/dashboard/reports', '/login', '/reports/x', '/api/units', '/api/reports/x/download', '/review-guide']) {
    assert(policyFor(p) === null, `공개 경로가 보호 정책에 걸렸습니다: ${p}`);
  }
  // '/review' 와 '/reviewer' 는 서로 다른 경로다
  assert(policyFor('/reviewer/adjudication') !== null, '/reviewer 가 보호되지 않습니다');
  assert(policyFor('/review') !== null, '/review 가 보호되지 않습니다');

  // 4. 우회 시도 정규화
  for (const p of ['//api//measure/run', '/api/measure/run/', '/api/%6Deasure/run']) {
    assert(policyFor(p) !== null, `경로 정규화 우회: ${p} → ${normalizePath(p)}`);
  }

  // 5. 오픈 리다이렉트
  assert(safeNext('/measure') === '/measure', 'safeNext 정상 경로 거부');
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', undefined, '/a\nb']) {
    assert(safeNext(bad) === '/', `오픈 리다이렉트 허용: ${String(bad)}`);
  }

  // 6. 파일 시스템 대조: 보호 대상 디렉터리의 모든 엔드포인트가 정책에 있어야 한다
  const missing: string[] = [];
  const apiRoots = ['admin', 'aeo', 'measure'].map((d) => path.join(ROOT, 'app/api', d));
  for (const r of apiRoots) {
    for (const f of walk(r)) {
      if (path.basename(f).startsWith('route.')) {
        const url = toUrlPath(f);
        if (!policyFor(url)) missing.push(url);
      }
    }
  }
  for (const group of ['(admin)', '(org)']) {
    for (const f of walk(path.join(ROOT, 'app', group))) {
      if (path.basename(f).startsWith('page.')) {
        const url = toUrlPath(f);
        if (!policyFor(url)) missing.push(url);
      }
    }
  }
  assert(missing.length === 0, `정책에 없는 보호 대상 경로: ${missing.join(', ')} (lib/auth/route-policy.ts 에 추가)`);

  // 7. 코드에 JWT·서비스 키가 들어 있지 않다
  const jwt = /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/;
  const secretAssign = /(service_?role|secret|api_?key)\w*\s*[:=]\s*['"][A-Za-z0-9_\-]{32,}['"]/i;
  const leaks: string[] = [];
  for (const dir of ['app', 'lib', 'components', 'scripts', 'supabase', 'tests']) {
    for (const f of walk(path.join(ROOT, dir))) {
      if (!/\.(ts|tsx|js|mjs|sql|json)$/.test(f)) continue;
      if (f.endsWith('route-guard.test.ts')) continue;
      const text = fs.readFileSync(f, 'utf-8');
      if (jwt.test(text) || secretAssign.test(text)) leaks.push(path.relative(ROOT, f));
    }
  }
  assert(leaks.length === 0, `비밀키로 보이는 문자열이 코드에 있습니다: ${leaks.join(', ')}`);
}
