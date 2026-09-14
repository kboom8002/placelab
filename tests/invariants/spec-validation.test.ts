// tests/invariants/spec-validation.test.ts
// docs/measurement-spec: 규격 저장소 무결성 및 금지 규칙 자동 린트 테스트
import { execSync } from 'child_process';
import path from 'path';

export async function testSpecValidation() {
  const specDir = path.join(process.cwd(), 'docs', 'measurement-spec');
  const validateScript = path.join(specDir, 'tools', 'validate.py');

  try {
    const output = execSync(`python "${validateScript}"`, {
      cwd: specDir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      encoding: 'utf-8',
    });

    if (!output.includes('오류 0')) {
      throw new Error(`measurement-spec 린트 실패:\n${output}`);
    }
  } catch (err: any) {
    throw new Error(`measurement-spec 검증 스크립트 실행 오류: ${err?.stdout || err?.message}`);
  }
}
