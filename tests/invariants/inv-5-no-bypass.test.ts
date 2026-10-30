// tests/invariants/inv-5-no-bypass.test.ts
import fs from 'fs';
import path from 'path';
import {
  SCANNER_UA,
  LEGACY_SCANNER_UA,
  SCAN_MIN_INTERVAL_MS,
  CITED_PAGE_MIN_INTERVAL_MS,
} from '../../lib/constants/scanner';

export async function testInv5NoBypass() {
  // 1. 단일 상수 SCANNER_UA 일치 확인 (모두의 정답노트 전환 U-1)
  const expectedUa = 'JeongdapNoteBot/1.0 (+https://jeongdap.kr/bot; contact@jeongdap.kr)';
  if (SCANNER_UA !== expectedUa) {
    throw new Error(`SCANNER_UA가 표준 규약과 다릅니다: ${SCANNER_UA}`);
  }

  if (!LEGACY_SCANNER_UA.startsWith('KPlaceLabBot/1.0')) {
    throw new Error('12주 전환기 안내용 LEGACY_SCANNER_UA 상수가 누락되었습니다');
  }

  // 2. 최소 간격 지연 확인 (전체 도메인 스캔 5000ms 이상, 인용 페이지 확인 수집 1500ms 이상)
  if (SCAN_MIN_INTERVAL_MS < 5000) {
    throw new Error(`SCAN_MIN_INTERVAL_MS가 5000ms 미만입니다: ${SCAN_MIN_INTERVAL_MS}`);
  }
  if (CITED_PAGE_MIN_INTERVAL_MS < 1500) {
    throw new Error(`CITED_PAGE_MIN_INTERVAL_MS가 1500ms 미만입니다: ${CITED_PAGE_MIN_INTERVAL_MS}`);
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
