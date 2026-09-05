// tests/invariants/inv-4-layer-separation.test.ts
import fs from 'fs';
import path from 'path';

export async function testInv4LayerSeparation() {
  // 1. types/layers.ts에 Layer1Stat과 Layer2Stat이 별도 심볼 브랜딩되어 있는지 확인
  const layersContent = fs.readFileSync(
    path.join(process.cwd(), 'lib/types/layers.ts'),
    'utf-8'
  );

  if (!layersContent.includes("[brand]: 'layer1'") || !layersContent.includes("[brand]: 'layer2'")) {
    throw new Error('Layer1Stat과 Layer2Stat의 브랜디드 타입 분리가 누락되었습니다 (INV-4 위반)');
  }

  // 2. Layer2Stat 정의에 denominator(전국 분모) 필드가 없어야 함
  const layer2Match = layersContent.match(/export type Layer2Stat = {([\s\S]*?)};/);
  if (!layer2Match || layer2Match[1].includes('denominator')) {
    throw new Error('Layer2Stat에 전국 분모(denominator) 필드가 존재합니다 (INV-4 위반)');
  }

  // 3. v_layer2_participation 뷰에 분모 컬럼이 없는지 확인
  const migration14 = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260905000014_create_views.sql'),
    'utf-8'
  );

  const l2ViewMatch = migration14.match(/create or replace view v_layer2_participation as([\s\S]*?);/);
  if (l2ViewMatch && l2ViewMatch[1].includes('denominator')) {
    throw new Error('v_layer2_participation 뷰에 전국 분모가 포함되어 있습니다');
  }
}
