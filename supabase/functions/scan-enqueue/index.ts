// supabase/functions/scan-enqueue/index.ts
// SDD 5.3: 주간 스캔 큐잉 함수 (pg_cron 월요일 03:00 KST)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  try {
    requireAuth(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 이번 주 월요일 날짜 계산 (KST 기준)
    const now = new Date();
    // UTC에 9시간을 더해서 KST 시간으로 변환
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const day = kstDate.getUTCDay();
    const diff = kstDate.getUTCDate() - day + (day === 0 ? -6 : 1);
    
    // KST 기준 월요일의 년월일을 구함 (시간은 00:00:00 UTC로 하여 YYYY-MM-DD 추출)
    const kstMonday = new Date(Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), diff));
    const scheduledWeek = kstMonday.toISOString().split('T')[0];

    // scannable = true 이고 active = true 인 도메인 목록 조회
    const { data: domains, error: domainError } = await supabase
      .from('unit_domains')
      .select('id')
      .eq('scannable', true)
      .eq('active', true);

    if (domainError) throw domainError;

    let enqueued = 0;
    if (domains && domains.length > 0) {
      const scanJobs = domains.map(d => ({
        domain_id: d.id,
        scheduled_week: scheduledWeek,
        scheduled_for: new Date().toISOString(),
        status: 'queued',
      }));

      const { error: insertError } = await supabase.from('scan_jobs').insert(scanJobs);
      if (insertError) throw insertError;
      
      enqueued = scanJobs.length;
    }

    return new Response(
      JSON.stringify({
        message: 'Scan queue populated',
        scheduledWeek,
        enqueued,
        total: domains?.length || 0,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
