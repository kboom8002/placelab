// tests/invariants/inv-5-no-bypass.test.ts
import fs from 'fs';
import path from 'path';
import { SCANNER_UA, SCAN_MIN_INTERVAL_MS } from '../../lib/constants/scanner';

export async function testInv5NoBypass() {
  // 1. 단일 상수 SCANNER_UA 일치 확인
  const expectedUa = 'KPlaceLabBot/1.0 (+https://kplacelab.kr/bot; contact@kplacelab.kr)';
  if (SCANNER_UA !== expectedUa) {
    throw new Error(`SCANNER_UA가 표준 규약과 다릅니다: ${SCANNER_UA}`);
  }

  // 2. 최소 간격 지연이 5000ms 이상인지 확인
  if (SCAN_MIN_INTERVAL_MS < 5000) {
    throw new Error(`SCAN_MIN_INTERVAL_MS가 5000ms 미만입니다: ${SCAN_MIN_INTERVAL_MS}`);
  }

  // 3. package.json에 우회용 도구(puppeteer, playwright, selenium, proxy 등)가 없는지 확인
  const pkg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const forbiddenDeps = ['puppeteer', 'playwright', 'selenium-webdriver', 'crawler'];
  for (const dep of forbiddenDeps) {
    if (allDeps[dep]) {
      throw new Error(`우회 및 크롤링 패키지 '${dep}'가 설치되어 있습니다 (INV-5 위반)`);
    }
  }
}
