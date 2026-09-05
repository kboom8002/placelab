// tests/invariants/inv-12-evidence-ledger.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv12EvidenceLedger() {
  const evidencePath = path.join(process.cwd(), 'docs/EVIDENCE.md');
  if (!fs.existsSync(evidencePath)) {
    throw new Error('docs/EVIDENCE.md 증거 대장이 존재하지 않습니다');
  }

  const evidenceContent = fs.readFileSync(evidencePath, 'utf-8');

  // 핵심 가설 C-2 (AI 응답 부정확이 실제 행정 문제를 만든다)가 '미검증' 상태인지 확인
  if (!evidenceContent.includes('C-2') || !evidenceContent.includes('미검증')) {
    throw new Error('EVIDENCE.md에 C-2 주장이 미검증 상태로 등록되어 있지 않습니다');
  }

  // 홈페이지에 "세계 최초" 등의 허위 과장 문구가 없는지 확인
  const homepageContent = fs.readFileSync(
    path.join(process.cwd(), 'app/(public)/page.tsx'),
    'utf-8'
  );

  const exaggerations = ['세계 최초', '국내 유일', '독보적', '특허받은'];
  for (const ex of exaggerations) {
    if (homepageContent.includes(ex)) {
      throw new Error(`공개 화면에 대장에 없는 과장 문구 '${ex}'가 포함되어 있습니다 (INV-12 위반)`);
    }
  }
}
