// supabase/functions/scan-enqueue/index.ts
// SDD 5.3: 주간 스캔 큐잉 함수 (pg_cron 월요일 03:00 KST)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 이번 주 월요일 날짜 계산
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const scheduledWeek = monday.toISOString().split('T')[0];

    // scannable = true 이고 active = true 인 도메인 목록 조회
    const { data: domains, error: domainError } = await supabase
      .from('unit_domains')
      .select('id')
      .eq('scannable', true)
      .eq('active', true);

    if (domainError) throw domainError;

    let enqueued = 0;
    for (const d of domains) {
      const { error: insertError } = await supabase.from('scan_jobs').insert({
        domain_id: d.id,
        scheduled_week: scheduledWeek,
        scheduled_for: new Date().toISOString(),
        status: 'queued',
      });

      if (!insertError) {
        enqueued++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Scan queue populated',
        scheduledWeek,
        enqueued,
        total: domains.length,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
