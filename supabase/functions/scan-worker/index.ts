// supabase/functions/scan-worker/index.ts
// SDD 1.3, 3.2, 5.3: 배치 스캔 워커 (2분 간격 pg_cron 호출, 배치 20개)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { parseRobotsTxt } from '../_shared/robots-parser.ts';

const SCANNER_UA = 'KPlaceLabBot/1.0 (+https://kplacelab.kr/bot; contact@kplacelab.kr)';
const SCAN_TIMEOUT_MS = 10_000;
const METHOD_VERSION = 'v1.0';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 좀비 잡 회수
    await supabase.rpc('reclaim_stale_jobs');

    // 2. 20개 작업 클레임 (FOR UPDATE SKIP LOCKED)
    const { data: jobs, error: claimError } = await supabase.rpc('claim_scan_jobs', {
      p_limit: 20,
    });

    if (claimError) throw claimError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: 'No jobs queued' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const job of jobs) {
      // 도메인 정보 조회
      const { data: domain } = await supabase
        .from('unit_domains')
        .select('id, host')
        .eq('id', job.domain_id)
        .single();

      if (!domain) {
        await supabase
          .from('scan_jobs')
          .update({ status: 'failed', last_error: 'Domain not found' })
          .eq('id', job.id);
        continue;
      }

      const targetUrl = `https://${domain.host}/robots.txt`;
      const start = Date.now();
      let httpStatus = 0;
      let rawText = '';
      let errorOccurred = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

        const res = await fetch(targetUrl, {
          headers: { 'User-Agent': SCANNER_UA },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        httpStatus = res.status;
        rawText = await res.text();
      } catch (e: any) {
        errorOccurred = true;
      }

      const latencyMs = Date.now() - start;
      const rawHash = await sha256(rawText || `error-${httpStatus}`);

      // robots.txt 파싱 및 판정
      let parseRes;
      if (errorOccurred) {
        parseRes = {
          verdict: 'undetermined' as const,
          reason: 'timeout' as const,
          aiAgents: {},
        };
      } else {
        parseRes = parseRobotsTxt(rawText, httpStatus);
      }

      // tech_scans 삽입 (INV-2 강제)
      await supabase.from('tech_scans').insert({
        domain_id: domain.id,
        method_version: METHOD_VERSION,
        http_status: httpStatus || null,
        latency_ms: latencyMs,
        robots_verdict: parseRes.verdict,
        undetermined_reason: parseRes.reason || null,
        ai_agents: parseRes.aiAgents,
        sitemap_declared: parseRes.sitemapDeclared || false,
        raw_hash: rawHash,
      });

      // 작업 완료 표시
      await supabase
        .from('scan_jobs')
        .update({ status: 'done', locked_at: null })
        .eq('id', job.id);

      results.push({ host: domain.host, verdict: parseRes.verdict });

      // 5초 간격 준수 (SDD 1.3 Polite Crawler)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
