import { NextResponse, type NextRequest } from 'next/server';
import { updateSessionWithUser } from '@/lib/supabase/middleware';
import { parseAppRoles } from '@/lib/auth/roles';
import { authorize, normalizePath } from '@/lib/auth/route-policy';

function withCookies(from: NextResponse, to: NextResponse): NextResponse {
  // 토큰 갱신으로 바뀐 쿠키를 리다이렉트·오류 응답에도 실어 보낸다
  from.cookies.getAll().forEach((c) => to.cookies.set(c));
  return to;
}

export async function middleware(request: NextRequest) {
  const { response, user, configured } = await updateSessionWithUser(request);
  const pathname = normalizePath(request.nextUrl.pathname);

  const decision = authorize(
    pathname,
    user ? { roles: parseAppRoles(user.app_metadata) } : null,
  );

  if (decision.kind === 'allow' && decision.policy === null) return response;

  const isApi = decision.policy?.kind === 'api';

  // Supabase 설정이 없으면 보호 경로는 닫는다 (fail-closed)
  if (!configured) {
    return isApi
      ? NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 })
      : new NextResponse('Service unavailable', { status: 503 });
  }

  if (decision.kind === 'allow') return response;

  if (decision.kind === 'unauthenticated') {
    if (isApi) {
      return withCookies(
        response,
        NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return withCookies(response, NextResponse.redirect(url));
  }

  // forbidden: 로그인은 했지만 역할이 없다
  return withCookies(
    response,
    isApi
      ? NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      : new NextResponse('Forbidden', { status: 403 }),
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
