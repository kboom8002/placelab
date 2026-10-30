// scripts/measure-v2/check-guro-quotes.ts
// 원장의 evidence_quote(B6 는 basis_quote)가 저장된 구로구청 페이지 본문에 실제로 있는지 전수 대조한다.
// 없으면 원장 오류 후보 — 사람이 열람해 고치거나 폐기한다. 사용: pnpm tsx scripts/measure-v2/check-guro-quotes.ts
import fs from 'fs';
import path from 'path';

const PAGES = path.resolve('.private/guro/pages');
const GT = path.resolve('docs/ground-truth/guro');
const QD = path.resolve('docs/aeo-questions/guro');
const strip = (s: string) => s.replace(/\s+/g, '').replace(/[“”"']/g, '');

const byUrl = new Map<string, string>();
for (const f of fs.readdirSync(PAGES).filter((x) => x.endsWith('.txt'))) {
  const t = fs.readFileSync(path.join(PAGES, f), 'utf-8');
  const url = (t.split('\n')[0] ?? '').replace(/^URL:\s*/, '').trim().replace(/&+$/, '');
  if (url && !byUrl.has(url)) byUrl.set(url, strip(t));
}

const usable = new Set<string>();
for (const f of fs.readdirSync(QD).filter((x) => x.endsWith('.json') && !x.startsWith('all'))) {
  const j = JSON.parse(fs.readFileSync(path.join(QD, f), 'utf-8'));
  for (const q of j.questions ?? []) if (q.usable !== false && q.status !== 'retired') usable.add(q.id);
}

let n = 0;
const bad: string[] = [];
const noPage: string[] = [];
for (const f of fs.readdirSync(GT).filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(GT, f), 'utf-8'));
  for (const [id, e] of Object.entries<any>(j.entries ?? {})) {
    if (!usable.has(id)) continue;
    const url = e.sourceUrl ?? e.basis_url;
    const quote = e.evidence_quote ?? e.basis_quote;
    if (!url || !quote || e.absenceBasis) continue;
    n++;
    const page = byUrl.get(url);
    if (!page) {
      noPage.push(`${id} ${url}`);
      continue;
    }
    if (!page.includes(strip(String(quote)))) bad.push(`${id}|${url}|${quote}`);
  }
}
console.log(`검사 ${n}건 / 페이지 없음 ${noPage.length} / 구절 불일치 ${bad.length}`);
for (const b of noPage) console.log('페이지없음', b);
for (const b of bad) console.log('불일치', b);
