// supabase/functions/verdict-promote/index.ts
// SDD 4, AGENTS.md INV-8: 판정 승격 (최근 2주 연속 동일 확인 시 승격)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  try {
    requireAuth(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 활성 도메인 목록 조회
    const { data: domains } = await supabase
      .from('unit_domains')
      .select('id, unit_id')
      .eq('scannable', true)
      .eq('active', true);

    if (!domains) {
      return new Response(JSON.stringify({ message: 'No domains' }));
    }

    let promotedCount = 0;
    let pendingCount = 0;

    for (const domain of domains) {
      // 최근 2회 스캔 관측치 조회
      const { data: scans } = await supabase
        .from('tech_scans')
        .select('*')
        .eq('domain_id', domain.id)
        .order('scanned_at', { ascending: false })
        .limit(2);

      if (!scans || scans.length < 2) {
        continue; // 2회 미만 관측치는 승격 대상 아님 (INV-8)
      }

      const [latest, prev] = scans;

      // 두 관측의 verdict 및 사유가 일치하는지 확인
      const isConsistent =
        latest.robots_verdict === prev.robots_verdict &&
        latest.undetermined_reason === prev.undetermined_reason;

      if (isConsistent) {
        // 기존 판정 조회
        const { data: existingVerdict } = await supabase
          .from('verdicts')
          .select('*')
          .eq('domain_id', domain.id)
          .single();

        let consecutiveWeeks = 2;
        let published = false;
        let changePending = false;
        let noticeUntil: string | null = null;
        const now = new Date();
        const noticeDate = new Date(now.setDate(now.getDate() + 14)).toISOString();

        if (existingVerdict) {
          if (existingVerdict.robots_verdict === latest.robots_verdict) {
            consecutiveWeeks = existingVerdict.consecutive_weeks + 1;
            published = existingVerdict.published;
            noticeUntil = existingVerdict.notice_until || null; // Preserve existing
            changePending = false;
          } else {
            // 판정 변경 이력 기록
            await supabase.from('verdict_changelog').insert({
              domain_id: domain.id,
              from_verdict: existingVerdict.robots_verdict,
              from_reason: existingVerdict.undetermined_reason,
              to_verdict: latest.robots_verdict,
              to_reason: latest.undetermined_reason,
              method_version: latest.method_version,
            });
            published = false;
            changePending = true;
            noticeUntil = noticeDate; // FR-24 14-day notice period
          }
        } else {
          // New verdict
          published = false;
          changePending = false;
          noticeUntil = noticeDate; // FR-24 14-day notice period
        }

        // verdicts UPSERT
        await supabase.from('verdicts').upsert({
          domain_id: domain.id,
          robots_verdict: latest.robots_verdict,
          undetermined_reason: latest.undetermined_reason,
          method_version: latest.method_version,
          confirmed_from: prev.scanned_at,
          confirmed_at: latest.scanned_at,
          consecutive_weeks: consecutiveWeeks,
          change_pending: changePending,
          published: published,
          notice_until: noticeUntil, // 사전 통지
        });

        promotedCount++;
      } else {
        // 일치하지 않으면 기존 판정을 유지하고 change_pending 플래그 설정
        await supabase
          .from('verdicts')
          .update({ change_pending: true })
          .eq('domain_id', domain.id);

        pendingCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Promotion batch completed',
        promotedCount,
        pendingCount,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
