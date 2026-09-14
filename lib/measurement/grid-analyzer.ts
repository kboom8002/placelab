// lib/measurement/grid-analyzer.ts
// docs/measurement-spec: 질문과 주체의 격자(Grid) 엔진
// 규율: spec/04_판정_규칙.md §8, schema/grid.schema.json
// 불변식: not_applicable(해당없음)과 blank(공란) 구분, 빈칸 개수 합산 금지,
//        canon_absent(정본 부재) 시 실질 개선 주체(ownership) 및 계층(tier) 귀속.

import type {
  Question,
  Grid,
  GridRow,
  GridCell,
  ActorRole,
  GridCellValue,
  OwnershipTier,
} from '@/lib/types/measurement-spec';

export interface EvaluatedCellInput {
  questionId: string;
  actorRole: ActorRole;
  value: GridCellValue;
  evidenceUrl?: string;
}

export interface GridAnalyzeOptions {
  agencyHandle: string;
  windowStart: string;
  windowEnd: string;
  questions: Question[];
  cellInputs?: EvaluatedCellInput[];
}

const ALL_ROLES: ActorRole[] = [
  'agency_hq',
  'affiliate',
  'upper_tier',
  'institution',
  'private',
];

/**
 * 기본 주체별 소관 여부 휴리스틱 (입력 데이터가 없을 때 규격 기본값 도출용)
 */
function defaultRoleApplicability(question: Question, role: ActorRole): boolean {
  if (question.owner_role === role) return true;
  if (role === 'agency_hq') return true; // 본청은 총괄
  if (role === 'upper_tier' && question.source_basis.includes('광역')) return true;
  return false;
}

/**
 * 질문과 주체의 격자 생성 및 정본 부재/귀속 판정
 */
export function buildGrid(options: GridAnalyzeOptions): Grid {
  const gridId = `GRD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${options.agencyHandle}-${Math.random().toString(36).slice(2, 8)}`;
  const inputMap = new Map<string, EvaluatedCellInput>();

  if (options.cellInputs) {
    for (const inp of options.cellInputs) {
      inputMap.set(`${inp.questionId}:${inp.actorRole}`, inp);
    }
  }

  const rows: GridRow[] = options.questions.map((q) => {
    const cells: GridCell[] = ALL_ROLES.map((role) => {
      const key = `${q.id}:${role}`;
      const found = inputMap.get(key);

      if (found) {
        return {
          actor_role: role,
          value: found.value,
          evidence_url: found.evidenceUrl,
        };
      }

      // 기본 판정: 해당 주체의 소관이 아니면 not_applicable, 소관인데 미발행이면 blank
      const isApplicable = defaultRoleApplicability(q, role);
      return {
        actor_role: role,
        value: isApplicable ? 'blank' : 'not_applicable',
      };
    });

    // 행 판정: 정본 발행(published)이 하나라도 있으면 canon_present,
    // 모든 칸이 공란(blank) 또는 해당없음(not_applicable)이면 canon_absent
    const hasPublished = cells.some((c) => c.value === 'published');
    const rowVerdict: 'canon_absent' | 'canon_present' = hasPublished
      ? 'canon_present'
      : 'canon_absent';

    // 정본 부재 시에만 ownership 부여
    if (rowVerdict === 'canon_absent') {
      const ownerRole = (q.owner_role === 'none' ? 'agency_hq' : q.owner_role) as Exclude<ActorRole, 'none'>;
      let tier: OwnershipTier = 'direct';

      if (ownerRole === 'affiliate') tier = 'affiliate';
      else if (ownerRole === 'upper_tier' || ownerRole === 'institution') tier = 'partner';
      else if (ownerRole === 'private') tier = 'out_of_reach';

      return {
        question_id: q.id,
        cells,
        row_verdict: 'canon_absent',
        ownership: {
          owner_role: ownerRole,
          tier,
          rationale: `질문 필지 요건상 정본 관리 주체 (${ownerRole})`,
        },
      };
    }

    return {
      question_id: q.id,
      cells,
      row_verdict: 'canon_present',
    };
  });

  return {
    grid_id: gridId,
    agency_handle: options.agencyHandle,
    observed_window: {
      start: options.windowStart,
      end: options.windowEnd,
    },
    rows,
  };
}
