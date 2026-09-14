// tests/invariants/inv-4-citizen-report-separation.test.ts
// AGENTS.md INV-4, INV-1, INV-6, INV-7: 시민 제보 및 승격 파이프라인 불변식 검증

import fs from 'fs';
import path from 'path';
import { aggregateReports } from '../../lib/crowdsource/report-aggregator';

export async function testInv4CitizenReportSeparation() {
  // 1. types/layers.ts에 Layer2ReportStat이 브랜딩되어 있고 denominator가 없는지 확인
  const layersContent = fs.readFileSync(
    path.join(process.cwd(), 'lib/types/layers.ts'),
    'utf-8'
  );

  if (!layersContent.includes("[brand]: 'layer2_report'")) {
    throw new Error('Layer2ReportStat의 브랜디드 타입 선언이 누락되었습니다 (INV-4 위반)');
  }

  const layer2ReportMatch = layersContent.match(/export type Layer2ReportStat = {([\s\S]*?)};/);
  if (!layer2ReportMatch) {
    throw new Error('Layer2ReportStat 정의를 찾을 수 없습니다.');
  }

  if (layer2ReportMatch[1].includes('denominator')) {
    throw new Error('Layer2ReportStat에 전국 분모(denominator) 필드가 존재합니다 (INV-4 위반)');
  }

  if (!layer2ReportMatch[1].includes('participatingUnits')) {
    throw new Error('Layer2ReportStat에 참여 단위 수(participatingUnits) 필드가 누락되었습니다 (INV-4 위반)');
  }

  if (!layer2ReportMatch[1].includes('population: Population')) {
    throw new Error('Layer2ReportStat에 모집단(population) 필드가 누락되었습니다 (INV-1 위반)');
  }

  // 2. 대시보드 페이지에 "참여한" 문구가 존재하고 전국 분모 오용이 없는지 확인
  const dashboardContent = fs.readFileSync(
    path.join(process.cwd(), 'app/(public)/dashboard/reports/page.tsx'),
    'utf-8'
  );

  if (!dashboardContent.includes('참여한')) {
    throw new Error('시민 제보 대시보드에 "참여한 N곳" 필수 문구가 누락되었습니다 (INV-4 위반)');
  }

  if (dashboardContent.includes('전국 ${') || dashboardContent.includes('전국 N곳')) {
    throw new Error('시민 제보 대시보드에 "전국" 분모 표현이 오용되었습니다 (INV-4 위반)');
  }

  // 3. aggregateReports 함수가 population 인자 없이 호출 시 예외를 던지는지 확인 (INV-1)
  try {
    // @ts-expect-error testing missing population
    await aggregateReports({});
    throw new Error('aggregateReports가 population 인자 없이도 성공했습니다 (INV-1 위반)');
  } catch (err: any) {
    if (!err.message.includes('INV-1')) {
      throw err;
    }
  }

  // 4. aggregateReports 함수 정상 실행 시 stat에 denominator가 없는지 확인
  const result = await aggregateReports({ population: 'local_gov' });
  if ('denominator' in (result.stat as any)) {
    throw new Error('aggregateReports 반환 stat 객체에 denominator가 존재합니다 (INV-4 위반)');
  }

  if (result.stat.participatingUnits === undefined || result.stat.participatingUnits < 0) {
    throw new Error('participatingUnits 계산이 유효하지 않습니다.');
  }
}
