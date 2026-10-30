// scripts/measure-v2/fetch-guro-pages.ts
// 원장 작성용 공식 페이지 열람기 — 사람이 읽는 수준의 열람을 자동화한 것이다 (INV-5)
//  - UA 는 SCANNER_UA 하나만 쓴다. robots.txt 를 먼저 확인하고 금지 경로는 요청하지 않는다
//  - 같은 호스트에 최소 FETCH_INTERVAL_MS 간격. 재시도·우회 없음
//  - 본문 텍스트만 .private/guro/pages/ 에 저장한다 (원장 근거 확인용)
// 사용: pnpm tsx scripts/measure-v2/fetch-guro-pages.ts <url|@listfile> ...

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SCANNER_UA, SCAN_TIMEOUT_MS } from '../../lib/constants/scanner';

const FETCH_INTERVAL_MS = 1500;
const OUT = path.resolve('.private', 'guro', 'pages');
fs.mkdirSync(OUT, { recursive: true });

const robotsCache = new Map<string, string[]>();
async function disallowed(u: URL): Promise<string[]> {
  if (robotsCache.has(u.host)) return robotsCache.get(u.host)!;
  const rules: string[] = [];
  try {
    const r = await fetch(`${u.protocol}//${u.host}/robots.txt`, { headers: { 'User-Agent': SCANNER_UA }, signal: AbortSignal.timeout(SCAN_TIMEOUT_MS) });
    if (r.ok) {
      let applies = false;
      for (const line of (await r.text()).split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z-]+)\s*:\s*(.*)$/);
        if (!m) continue;
        const k = m[1].toLowerCase();
        if (k === 'user-agent') applies = m[2].trim() === '*' || /kplacelab/i.test(m[2]);
        else if (k === 'disallow' && applies && m[2].trim()) rules.push(m[2].trim());
      }
    }
  } catch {
    /* robots 를 못 읽으면 일반 열람 수준으로 진행하되, 기록은 남긴다 */
  }
  robotsCache.set(u.host, rules);
  return rules;
}

function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/li|\/tr|\/h\d|\/div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

async function main() {
  let urls: string[] = [];
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('@')) urls.push(...fs.readFileSync(a.slice(1), 'utf-8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')));
    else urls.push(a);
  }
  const lastByHost = new Map<string, number>();
  const index: Record<string, string> = fs.existsSync(path.join(OUT, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf-8')) : {};
  for (const raw of urls) {
    const u = new URL(raw);
    const id = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 10);
    const dis = await disallowed(u);
    if (dis.some((d) => u.pathname.startsWith(d))) {
      console.log(`SKIP(robots) ${raw}`);
      continue;
    }
    const wait = (lastByHost.get(u.host) ?? 0) + FETCH_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastByHost.set(u.host, Date.now());
    try {
      const r = await fetch(raw, { headers: { 'User-Agent': SCANNER_UA }, signal: AbortSignal.timeout(SCAN_TIMEOUT_MS * 2), redirect: 'follow' });
      const buf = Buffer.from(await r.arrayBuffer());
      const html = new TextDecoder('utf-8').decode(buf);
      const text = toText(html);
      fs.writeFileSync(path.join(OUT, `${id}.html`), html, 'utf-8');
      fs.writeFileSync(path.join(OUT, `${id}.txt`), `URL: ${raw}\nSTATUS: ${r.status}\nFETCHED: ${new Date().toISOString()}\n---\n${text}\n`, 'utf-8');
      index[id] = raw;
      console.log(`${r.status} ${id} ${text.length}자 ${raw}`);
    } catch (e: any) {
      console.log(`ERR ${raw} ${e?.message}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
}
main();
