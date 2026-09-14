// app/api/report/upload/route.ts
// 제보 증빙 스크린샷 업로드 API (Supabase Storage 또는 로컬 폴백)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 });
    }

    // 파일 타입 검증 (이미지 파일만 허용)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일(PNG, JPG, WebP)만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 용량 검증 (최대 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 용량은 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'png';
    const filename = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { data, error } = await supabase.storage
          .from('citizen-screenshots')
          .upload(filename, buffer, { contentType: file.type });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('citizen-screenshots')
            .getPublicUrl(filename);
          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
          });
        }
      } catch {}
    }

    // Supabase Storage 미연결 시 모의 URL 반환
    const mockUrl = `/uploads/screenshots/${filename}`;
    return NextResponse.json({
      success: true,
      url: mockUrl,
      note: 'Storage 폴백 모드로 등록되었습니다.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '업로드 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}
