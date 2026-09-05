import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const preregId = request.nextUrl.searchParams.get('prereg_id');
  
  // INV-11: 사전 등록 필수
  if (!preregId) {
    return NextResponse.json(
      { error: '사전 등록 ID는 필수입니다 (INV-11)' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('audience_comparisons')
      .select('*')
      .eq('prereg_id', preregId)
      .order('tag_a', { ascending: true }); // INV-3: 알파벳순, 순위 아님
    
    if (error) throw error;
    
    return NextResponse.json({
      prereg_id: preregId,
      comparisons: data || [],
      disclaimer: '이 결과는 사전 등록된 분석 계획에 따른 탐색적 비교입니다. 순위를 매기지 않으며, 개별 지자체를 지목하지 않습니다.',
    });
  } catch (err) {
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }
}
