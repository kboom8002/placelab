#!/usr/bin/env npx tsx
// scripts/theme-lab/export-probes.ts
// Policy Theme Lab에서 발굴된 진단 질문을 PlaceLab 측정용 JSON 파일로 내보내기

import * as fs from 'fs';
import * as path from 'path';
import { SEED_THEMES } from '../../lib/theme-lab/seed-data';

const outDir = path.resolve(__dirname, '../../docs/aeo-questions');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targetUnits = ['lg-41110', 'lg-43745'];

for (const unitId of targetUnits) {
  const themes = SEED_THEMES.filter((t) => t.unitId === unitId);
  const questions = themes.flatMap((t) =>
    t.nextDiagnosticQuestions.map((dq) => ({
      id: dq.id,
      tier: dq.tier,
      themeCode: t.themeCode,
      category: dq.targetField,
      body: dq.text,
      groundTruth: dq.expectedGroundTruth || '',
      note: dq.evaluationNote || '',
    }))
  );

  const outFile = path.join(outDir, `${unitId}-themelab.json`);
  fs.writeFileSync(outFile, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`✓ ${unitId} (${questions.length}문항) → ${outFile}`);
}

console.log('\n✅ Policy Theme Lab 진단 프로브 세트 생성 완료!');
