// app/(public)/login/page.tsx
// 운영·지자체·랩 계정 로그인. 색인하지 않는다.
import type { Metadata } from 'next';
import { safeNext } from '@/lib/auth/safe-next';
import { signIn } from './actions';

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = safeNext(searchParams.next);
  const hasError = searchParams.error === '1';

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">로그인</h1>
      <p className="mt-2 text-sm text-gray-600">
        운영·지자체·랩 계정 전용입니다. 계정은 운영팀이 발급합니다.
      </p>

      {hasError && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          이메일 또는 비밀번호를 확인해 주세요.
        </p>
      )}

      <form action={signIn} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          이메일
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          비밀번호
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="w-full rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white">
          로그인
        </button>
      </form>
    </main>
  );
}
