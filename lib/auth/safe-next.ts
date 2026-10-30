// lib/auth/safe-next.ts
// 로그인 뒤 이동 경로 검증 (오픈 리다이렉트 방지)

/** 같은 사이트 안의 절대 경로만 허용한다. 그 밖에는 '/' 를 돌려준다. */
export function safeNext(next: unknown): string {
  if (typeof next !== 'string') return '/';
  if (!next.startsWith('/')) return '/';
  // `//evil.com`, `/\evil.com` 은 브라우저가 외부 주소로 해석한다
  if (next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (/[\u0000-\u001f]/.test(next)) return '/';
  return next;
}
