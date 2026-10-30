// scripts/measure-v2/guro-pages.ts
// 저장된 구로구청 페이지에서 본문만 꺼내 보는 도구 (원장 작성용 열람 보조)
//  pnpm tsx scripts/measure-v2/guro-pages.ts show <key|urlpart> [maxChars]
//  pnpm tsx scripts/measure-v2/guro-pages.ts grep <정규식> [ctx=60] [maxHits=20]
//  pnpm tsx scripts/measure-v2/guro-pages.ts list [정규식]   (제목 목록)
import fs from 'fs';
import path from 'path';

const DIR = path.resolve('.private', 'guro', 'pages');

interface Page { id: string; url: string; crumb: string; body: string }

function load(): Page[] {
  const pages: Page[] = [];
  const seen = new Set<string>();
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.txt'))) {
    const t = fs.readFileSync(path.join(DIR, f), 'utf-8');
    const lines = t.split('\n');
    const url = (lines[0] ?? '').replace(/^URL:\s*/, '').trim().replace(/&+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    const crumb = (lines[4] ?? '').trim();
    let start = -1;
    let end = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '공유하기') start = i;
      if (start >= 0 && lines[i].includes('담당자 정보')) {
        end = i;
        break;
      }
    }
    // 공유하기 가 없으면(부서 페이지 등) 제목 이후 전체
    const from = start >= 0 ? start + 1 : 5;
    const body = lines.slice(from, end).map((l) => l.trim()).filter(Boolean).join(' ');
    // 담당자 정보 블록 (부서·전화)
    const tail = lines.slice(end, end + 6).map((l) => l.trim()).filter(Boolean).join(' ');
    pages.push({ id: f.replace('.txt', ''), url, crumb, body: body + (tail ? ` ‖ ${tail}` : '') });
  }
  return pages;
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
const pages = load();
if (cmd === 'show') {
  const max = Number(a2 ?? 3000);
  for (const p of pages.filter((p) => p.url.includes(a1))) {
    console.log(`### ${p.crumb}\n${p.url}\n${p.body.slice(0, max)}\n`);
  }
} else if (cmd === 'grep') {
  const re = new RegExp(a1, 'g');
  const ctx = Number(a2 ?? 60);
  const maxHits = Number(a3 ?? 20);
  let hits = 0;
  for (const p of pages) {
    const m = [...p.body.matchAll(re)];
    if (!m.length) continue;
    console.log(`### ${p.crumb} | ${p.url}`);
    for (const x of m.slice(0, 2)) console.log('   …' + p.body.slice(Math.max(0, (x.index ?? 0) - ctx), (x.index ?? 0) + ctx + a1.length) + '…');
    if (++hits >= maxHits) break;
  }
} else if (cmd === 'list') {
  const re = a1 ? new RegExp(a1) : null;
  for (const p of pages) if (!re || re.test(p.crumb)) console.log(`${p.url.replace('https://www.guro.go.kr/www/', '')} | ${p.crumb.replace(/-구로구청$/, '')} | ${p.body.length}`);
} else {
  console.log(`pages=${pages.length}`);
}
