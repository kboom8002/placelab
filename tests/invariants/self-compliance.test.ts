// tests/invariants/self-compliance.test.ts
// AGENTS.md §7 및 FR-5.4: 자체 사이트 자가 준수 (CI 체크 항목)
import fs from 'fs';
import path from 'path';
import robots from '../../app/robots';

export async function testSelfCompliance() {
  // 1. app/robots.ts 실행 결과 확인
  const robotsConfig = robots();

  if (!robotsConfig.sitemap || !robotsConfig.sitemap.includes('sitemap.xml')) {
    throw new Error('kplacelab 자체 robots.txt에 Sitemap 선언이 누락되었습니다 (FR-5.4 위반)');
  }

  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
  const hasAllowAll = rules.some(
    (r) => r.userAgent === '*' && r.allow === '/'
  );

  if (!hasAllowAll) {
    throw new Error('kplacelab 자체 robots.txt가 전면 개방(allow: /)되어 있지 않습니다');
  }

  // 2. app/layout.tsx에 JSON-LD가 삽입되어 있는지 확인
  const layoutContent = fs.readFileSync(
    path.join(process.cwd(), 'app/layout.tsx'),
    'utf-8'
  );

  if (!layoutContent.includes('application/ld+json') || !layoutContent.includes('schema.org')) {
    throw new Error('루트 레이아웃에 유효한 JSON-LD 구조화 데이터가 누락되었습니다');
  }
}
