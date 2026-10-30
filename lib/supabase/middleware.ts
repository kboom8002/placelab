// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export interface SessionResult {
  response: NextResponse;
  /** 로그인하지 않았으면 null */
  user: User | null;
  /** Supabase 환경변수가 있는가. 없으면 보호 경로를 열어 두지 말고 닫아야 한다 */
  configured: boolean;
}

export async function updateSessionWithUser(request: NextRequest): Promise<SessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 환경변수 미설정 시 미들웨어 크래시 방지
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response: supabaseResponse, user: null, configured: false };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token. getUser() 는 서버에서 토큰을 검증한다 (getSession 은 쿠키만 믿는다)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user: user ?? null, configured: true };
}

export async function updateSession(request: NextRequest) {
  return (await updateSessionWithUser(request)).response;
}
