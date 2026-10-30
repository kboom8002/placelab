'use server';
// app/(public)/login/actions.ts
// 로그인 서버 액션. 회원가입은 제공하지 않는다 — 계정은 운영자가 Supabase 에서 만들고
// `app_metadata.app_roles` 를 service_role 로 설정한다 (lib/auth/roles.ts).

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/safe-next';

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // 계정 존재 여부를 드러내지 않도록 사유를 구분하지 않는다
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
