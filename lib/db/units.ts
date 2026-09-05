// lib/db/units.ts
import { createClient } from '@/lib/supabase/server';
import { UnitWithVerdict, Population, RobotsVerdict } from '@/lib/types/layers';

// Fallback 목 데이터 (초기 DB 세팅 전 또는 오프라인 환경 대응)
const FALLBACK_UNITS: UnitWithVerdict[] = [
  // 자치단체 (local_gov)
  {
    unit_id: 'lg-11000',
    name: '서울특별시',
    name_en: 'Seoul',
    population: 'local_gov',
    unit_type: 'metro',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: '11000',
    is_depop_area: false,
    domain_id: 1,
    host: 'www.seoul.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 3,
    published: true,
  },
  {
    unit_id: 'lg-41650',
    name: '포천시',
    name_en: 'Pocheon-si',
    population: 'local_gov',
    unit_type: 'basic',
    domain_form: 'A',
    parent_unit_id: 'lg-41000',
    sgg_code: '41650',
    is_depop_area: true,
    domain_id: 2,
    host: 'www.pocheon.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 3,
    published: true,
  },
  {
    unit_id: 'lg-26000',
    name: '부산광역시',
    name_en: 'Busan',
    population: 'local_gov',
    unit_type: 'metro',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: '26000',
    domain_id: 3,
    host: 'www.busan.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 3,
    published: true,
    is_depop_area: false,
  },
  {
    unit_id: 'lg-43770',
    name: '증평군',
    name_en: 'Jeungpyeong-gun',
    population: 'local_gov',
    unit_type: 'basic',
    domain_form: 'A',
    parent_unit_id: 'lg-43000',
    sgg_code: '43770',
    domain_id: 4,
    host: 'www.jp.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 3,
    published: true,
    is_depop_area: true,
  },
  {
    unit_id: 'lg-42150',
    name: '강릉시',
    name_en: 'Gangneung-si',
    population: 'local_gov',
    unit_type: 'basic',
    domain_form: 'A',
    parent_unit_id: 'lg-42000',
    sgg_code: '42150',
    domain_id: 5,
    host: 'www.gn.go.kr',
    domain_role: 'main',
    robots_verdict: 'no_file',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
    is_depop_area: false,
  },
  // 특별구역 (special_zone - A형 6곳)
  {
    unit_id: 'sz-fez-ifez',
    name: '인천경제자유구역',
    name_en: 'IFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 101,
    host: 'www.ifez.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  {
    unit_id: 'sz-fez-bjfez',
    name: '부산진해경제자유구역',
    name_en: 'BJFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 102,
    host: 'www.bjfez.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  {
    unit_id: 'sz-fez-gfez',
    name: '광양만권경제자유구역',
    name_en: 'GFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 103,
    host: 'www.gfez.go.kr',
    domain_role: 'main',
    robots_verdict: 'open',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  {
    unit_id: 'sz-fez-dgfez',
    name: '대구경북경제자유구역',
    name_en: 'DGFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 104,
    host: 'www.dgfez.go.kr',
    domain_role: 'main',
    robots_verdict: 'no_file',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  {
    unit_id: 'sz-fez-gsfez',
    name: '강원경제자유구역',
    name_en: 'GSFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 105,
    host: 'gsfez.go.kr',
    domain_role: 'main',
    robots_verdict: 'blocked_all',
    undetermined_reason: null,
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  {
    unit_id: 'sz-fez-jgfez',
    name: '전남광주경제자유구역',
    name_en: 'JGFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'A',
    parent_unit_id: null,
    sgg_code: null,
    is_depop_area: false,
    domain_id: 106,
    host: 'www.gjfez.go.kr',
    domain_role: 'main',
    robots_verdict: 'undetermined',
    undetermined_reason: 'timeout',
    confirmed_at: '2026-09-01T00:00:00Z',
    consecutive_weeks: 2,
    published: true,
  },
  // B형 특별구역 3곳 (참조용)
  {
    unit_id: 'sz-fez-ggfez',
    name: '경기경제자유구역',
    name_en: 'GGFEZ',
    population: 'special_zone',
    unit_type: 'fez',
    domain_form: 'B',
    parent_unit_id: 'lg-41000',
    sgg_code: null,
    is_depop_area: false,
    domain_id: 107,
    host: 'ggfez.gg.go.kr',
    domain_role: 'main',
    robots_verdict: null,
    undetermined_reason: null,
    confirmed_at: null,
    consecutive_weeks: null,
    published: null,
  },
];

// AGENTS.md INV-1: 집계 함수는 반드시 모집단을 인자로 받는다. 기본값을 두지 않는다.
export async function getUnitsByPopulation(
  population: Population
): Promise<UnitWithVerdict[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_unit_latest_verdict')
      .select('*')
      .eq('population', population)
      .order('sgg_code', { ascending: true, nullsFirst: false });

    if (!error && data && data.length > 0) {
      return data as UnitWithVerdict[];
    }
  } catch {
    // DB 테이블 생성 전 fallback 사용
  }

  return FALLBACK_UNITS.filter((u) => u.population === population);
}

export async function getUnitById(id: string): Promise<UnitWithVerdict | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_unit_latest_verdict')
      .select('*')
      .eq('unit_id', id)
      .single();

    if (!error && data) {
      return data as UnitWithVerdict;
    }
  } catch {
    // fallback
  }

  return FALLBACK_UNITS.find((u) => u.unit_id === id) || null;
}

export async function getUnitBySlug(slug: string): Promise<UnitWithVerdict | null> {
  const decoded = decodeURIComponent(slug).trim();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_unit_latest_verdict')
      .select('*')
      .or(`name.eq.${decoded},name_en.eq.${decoded}`)
      .single();

    if (!error && data) {
      return data as UnitWithVerdict;
    }
  } catch {
    // fallback
  }

  return (
    FALLBACK_UNITS.find(
      (u) =>
        u.name === decoded ||
        (u.name_en && u.name_en.toLowerCase() === decoded.toLowerCase())
    ) || null
  );
}

// AGENTS.md INV-1: 두 모집단을 합산하지 않는 집계 (population 필수 인자)
export function calculateCoverage(units: UnitWithVerdict[], population: Population) {
  const filtered = units.filter((u) => u.population === population);
  let open = 0;
  let blocked = 0;
  let noFile = 0;
  let undetermined = 0;

  for (const u of filtered) {
    if (u.robots_verdict === 'open') open++;
    else if (u.robots_verdict === 'blocked_all' || u.robots_verdict === 'blocked_selective') blocked++;
    else if (u.robots_verdict === 'no_file') noFile++;
    else if (u.robots_verdict === 'undetermined') undetermined++;
  }

  return {
    population,
    total: filtered.length,
    open,
    blocked,
    noFile,
    undetermined,
  };
}
