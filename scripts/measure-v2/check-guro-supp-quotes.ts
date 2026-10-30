// scripts/measure-v2/check-guro-supp-quotes.ts
// 보완 세트 원장의 근거 구절이 캐시된 공식 페이지에 실제로 있는지 확인한다 (원장 날조 방지)
//  - '…' 로 줄인 구절은 조각별로 확인한다
import fs from 'fs';
import path from 'path';

const set = process.argv[2] ?? 'guro-supp1';
const gt = JSON.parse(fs.readFileSync(`docs/aeo-questions/${set}/ground-truth.json`, 'utf-8'));
const dir = path.resolve('.private/guro/pages');
const byUrl = new Map<string, string>();
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt'))) {
  const t = fs.readFileSync(path.join(dir, f), 'utf-8');
  const url = t.split('\n')[0].replace('URL: ', '').trim().replace(/&$/, '');
  const norm = t.replace(/\s+/g, '');
  byUrl.set(url, (byUrl.get(url) ?? '') + norm);
}
const n = (s: string) => s.replace(/\s+/g, '');
let bad = 0;
let checked = 0;
for (const [id, e] of Object.entries<any>(gt.entries)) {
  const pairs: { url: string; quote: string }[] = [];
  if (e.sourceUrl && e.evidence_quote && e.kind !== 'negative') pairs.push({ url: e.sourceUrl, quote: e.evidence_quote });
  for (const s of e.sources ?? []) pairs.push(s);
  for (const { url, quote } of pairs) {
    const page = byUrl.get(url);
    checked++;
    if (!page) {
      console.log(`NOPAGE ${id} ${url}`);
      bad++;
      continue;
    }
    const parts = quote.split('…').map((p: string) => n(p)).filter(Boolean);
    const miss = parts.filter((p: string) => !page.includes(p));
    if (miss.length) {
      console.log(`MISS ${id} ${url} :: ${miss.join(' | ')}`);
      bad++;
    }
  }
}
console.log(`확인 ${checked} · 문제 ${bad}`);
process.exit(bad ? 1 : 0);
