// 원장 값(targetValue)의 핵심 토큰이 evidence_quote 에 없는 항목을 나열한다 (표 열 혼동·요약 과잉 후보).
import fs from 'fs';
import path from 'path';
const GT = path.resolve('docs/ground-truth/guro');
const QD = path.resolve('docs/aeo-questions/guro');
const usable = new Map<string, string>();
for (const f of fs.readdirSync(QD).filter((x) => x.endsWith('.json') && !x.startsWith('all'))) {
  const j = JSON.parse(fs.readFileSync(path.join(QD, f), 'utf-8'));
  for (const q of j.questions ?? []) if (q.usable !== false && q.status !== 'retired') usable.set(q.id, q.text);
}
const strip = (s: string) => s.replace(/\s+/g, '').replace(/,/g, '');
for (const f of fs.readdirSync(GT).filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(GT, f), 'utf-8'));
  for (const [id, e] of Object.entries<any>(j.entries ?? {})) {
    if (!usable.has(id) || !e.targetValue || !e.evidence_quote) continue;
    const nums: string[] = String(e.targetValue).replace(/,/g, '').match(/\d+(?:\.\d+)?/g) ?? [];
    const q = strip(String(e.evidence_quote));
    const missing = nums.filter((n) => !q.includes(n));
    if (nums.length && missing.length) console.log(`${id}|${usable.get(id)}|=>${e.targetValue}|quote:${e.evidence_quote}`);
  }
}
