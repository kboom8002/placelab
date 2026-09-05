// supabase/functions/scan-worker/index.ts
// SDD 1.3, 3.2, 5.3: 배치 스캔 워커 (2분 간격 pg_cron 호출, 배치 20개)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { parseRobotsTxt } from '../_shared/robots-parser.ts';
import { requireAuth } from '../_shared/auth.ts';

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

Deno.serve(async (req) => {
  try {
    requireAuth(req);
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
    const hostLastFetchTime = new Map<string, number>();

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

      // 5초 간격 준수 (동일 호스트 기준)
      const lastFetchTime = hostLastFetchTime.get(domain.host) || 0;
      const nowTime = Date.now();
      if (nowTime - lastFetchTime < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 5000 - (nowTime - lastFetchTime)));
      }
      hostLastFetchTime.set(domain.host, Date.now());

      const targetUrl = `https://${domain.host}/robots.txt`;
      const start = Date.now();
      let httpStatus = 0;
      let rawText = '';
      let errorOccurred = false;
      let isDnsError = false;
      let isTimeout = false;
      let isTlsError = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          isTimeout = true;
          controller.abort();
        }, SCAN_TIMEOUT_MS);

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
        const msg = e.message?.toLowerCase() || '';
        if (msg.includes('dns') || msg.includes('resolve') || msg.includes('name not known')) {
          isDnsError = true;
        } else if (msg.includes('timeout') || isTimeout) {
          isTimeout = true;
        } else if (msg.includes('cert') || msg.includes('tls') || msg.includes('ssl')) {
          isTlsError = true;
        } else {
          isTimeout = true;
        }
      }

      const is5xx = httpStatus >= 500 && httpStatus < 600;
      const is4xx = httpStatus >= 400 && httpStatus < 500 && httpStatus !== 404;
      const isTimeoutOr5xx = isTimeout || is5xx;

      if (isTimeoutOr5xx) {
        if (job.attempts < 3) {
          const delayMinutes = job.attempts === 1 ? 10 : 60;
          const nextRun = new Date(Date.now() + delayMinutes * 60000).toISOString();
          
          await supabase
            .from('scan_jobs')
            .update({ 
              status: 'queued', 
              scheduled_for: nextRun,
              locked_at: null,
              last_error: `Attempt ${job.attempts} failed: ${httpStatus || (isTimeout ? 'Timeout' : 'Error')}`
            })
            .eq('id', job.id);
            
          continue; 
        }
      }

      const latencyMs = Date.now() - start;
      const rawHash = await sha256(rawText || `error-${httpStatus}`);

      // robots.txt 파싱 및 판정
      let parseRes;
      if (isDnsError) {
        parseRes = { verdict: 'undetermined' as const, reason: 'dns_fail' as const, aiAgents: {} };
      } else if (isTimeoutOr5xx || errorOccurred) {
        parseRes = { verdict: 'undetermined' as const, reason: 'timeout' as const, aiAgents: {} };
      } else if (is4xx) {
        parseRes = { verdict: 'undetermined' as const, reason: 'timeout' as const, aiAgents: {} };
      } else {
        parseRes = parseRobotsTxt(rawText, httpStatus);
      }

      let meta_robots = null;
      let jsonld_count = 0;
      let jsonld_valid = null;
      let jsonld_types: string[] = [];
      let hreflang_count = 0;

      // Stage 2: Fetch homepage (only if we're not blocked and robots.txt parsed successfully)
      if (
        parseRes.verdict === 'open' || 
        parseRes.verdict === 'blocked_selective' ||
        parseRes.verdict === 'no_file'
      ) {
        try {
          const nowTime2 = Date.now();
          const lastFetchTime2 = hostLastFetchTime.get(domain.host) || 0;
          if (nowTime2 - lastFetchTime2 < 5000) {
            await new Promise((resolve) => setTimeout(resolve, 5000 - (nowTime2 - lastFetchTime2)));
          }
          hostLastFetchTime.set(domain.host, Date.now());

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
          const res = await fetch(`https://${domain.host}/`, {
            headers: { 'User-Agent': SCANNER_UA },
            signal: controller.signal,
            redirect: 'follow',
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const html = await res.text();
            
            const metaRobotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
            if (metaRobotsMatch) {
              meta_robots = metaRobotsMatch[1];
            }

            const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
            let match;
            let hasInvalid = false;
            let hasValid = false;
            while ((match = scriptRegex.exec(html)) !== null) {
              jsonld_count++;
              try {
                const parsed = JSON.parse(match[1]);
                hasValid = true;
                const types = Array.isArray(parsed['@type']) ? parsed['@type'] : (parsed['@type'] ? [parsed['@type']] : []);
                for (const t of types) {
                  if (typeof t === 'string') jsonld_types.push(t);
                }
              } catch (e) {
                hasInvalid = true;
              }
            }
            if (jsonld_count > 0) {
              jsonld_valid = hasValid && !hasInvalid;
            }

            const linkRegex = /<link[^>]+rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*>/gi;
            while (linkRegex.exec(html) !== null) {
              hreflang_count++;
            }
          }
        } catch (e) {
          // ignore homepage fetch errors
        }
      }

      // Stage 3: Sitemap Reachability
      let sitemap_reachable = null;
      if (parseRes.sitemapUrl) {
        try {
          const nowTime3 = Date.now();
          const lastFetchTime3 = hostLastFetchTime.get(domain.host) || 0;
          if (nowTime3 - lastFetchTime3 < 5000) {
            await new Promise((resolve) => setTimeout(resolve, 5000 - (nowTime3 - lastFetchTime3)));
          }
          hostLastFetchTime.set(domain.host, Date.now());

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
          const res = await fetch(parseRes.sitemapUrl, {
            method: 'HEAD',
            headers: { 'User-Agent': SCANNER_UA },
            signal: controller.signal,
            redirect: 'follow',
          });
          clearTimeout(timeoutId);
          sitemap_reachable = res.ok;
        } catch (e) {
          sitemap_reachable = false;
        }
      }

      // Stage 4: TLS Ok
      const tls_ok = (httpStatus > 0) ? true : (isTlsError ? false : null);

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
        meta_robots,
        jsonld_count,
        jsonld_valid,
        jsonld_types,
        hreflang_count,
        sitemap_reachable,
        tls_ok
      });

      // 작업 완료 표시
      await supabase
        .from('scan_jobs')
        .update({ status: 'done', locked_at: null })
        .eq('id', job.id);

      results.push({ host: domain.host, verdict: parseRes.verdict });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
