// app/api/aeo/tier2-questions/route.ts
// Tier 2 고유 정보 질문 및 후보 CRUD API
// 파일 기반 스토리지 (docs/aeo-questions/{unitId}.json)

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Tier2Question, Tier2Category } from '@/lib/types/source-analysis';

export interface Tier2Candidate {
  id: string;
  category: string;
  body: string;
  ground_truth_candidate: string;
  source_url?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface StoredData {
  unit_id: string;
  questions: Tier2Question[];
  candidates: Tier2Candidate[];
  updated_at?: string;
}

const STORAGE_DIR = path.join(process.cwd(), 'docs', 'aeo-questions');

function getFilePath(unitId: string): string {
  // 안전한 파일명 처리
  const safeId = unitId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORAGE_DIR, `${safeId}.json`);
}

function ensureDirectoryExists() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function readStoredData(unitId: string): StoredData {
  ensureDirectoryExists();
  const filePath = getFilePath(unitId);

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        unit_id: parsed.unit_id || unitId,
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
        updated_at: parsed.updated_at,
      };
    } catch (err: any) {
      console.error(`[tier2-questions] 파일 읽기 오류 (${filePath}):`, err.message);
    }
  }

  // 기본값 (수원시 등 주요 지자체 기본 시드)
  return getInitialSeedData(unitId);
}

function writeStoredData(unitId: string, data: StoredData): void {
  ensureDirectoryExists();
  const filePath = getFilePath(unitId);
  data.updated_at = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 신규 지자체에 대한 기본 시드 데이터 (K04 v2.1 기준)
 */
function getInitialSeedData(unitId: string): StoredData {
  const isSuwon = unitId.includes('41110') || unitId.includes('suwon');
  const unitName = isSuwon ? '수원' : '지자체';

  const defaultQuestions: Tier2Question[] = [
    {
      id: `${isSuwon ? 'S' : 'T2'}-01`,
      category: 'specialty_industry',
      body: `${unitName}에 삼성전자 본사나 대규모 R&D 사업장이 있어? 뭐 하는 곳이야?`,
      ground_truth: `${unitName} 영통구 삼성전자 수원 디지털시티(본사), 모바일 및 영상디스플레이 R&D 특화`,
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'easy',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-02`,
      category: 'landmark',
      body: `${unitName}화성 야간 관람(달빛동행) 시간과 입장료 알려줘`,
      ground_truth: '화성행궁 야간개장 19:00~21:30 운영, 성인 기준 1,500원',
      ground_truth_source: 'https://www.swcf.or.kr',
      difficulty: 'medium',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-03`,
      category: 'local_policy',
      body: `${unitName}시에서 독자적으로 지원하는 1인 가구 포털이나 안심 서비스 있어?`,
      ground_truth: '수원시 1인가구 맞춤형 안심 패키지 및 쏘옥(SSOK) 플랫폼 운영',
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'medium',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-04`,
      category: 'heritage',
      body: `정조대왕이 ${unitName}화성을 축조한 역사적 배경과 행차 의미가 뭐야?`,
      ground_truth: '사도세자의 묘소인 현륭원 참배 및 왕도정치 실현, 국방 요새화 목적',
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'medium',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-05`,
      category: 'geography',
      body: `${unitName}에서 광교신도시와 영통지구의 생활권 및 교통 차이가 뭐야?`,
      ground_truth: '광교는 신분당선 중심 호수공원 신도시, 영통은 수인분당선 중심 학원가 및 삼성전자 배후 주거지',
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'hard',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-06`,
      category: 'local_food',
      body: `${unitName} 왕갈비와 통닭거리 대표 맛집 거리 위치가 어디야?`,
      ground_truth: '팔달문 인근 수원천변 통닭거리 및 팔달구 일대 왕갈비 특화거리',
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'easy',
    },
    {
      id: `${isSuwon ? 'S' : 'T2'}-07`,
      category: 'recent_issue',
      body: `${unitName} 군공항 이전 사업 및 경기국제공항 추진 현황 어떻게 돼?`,
      ground_truth: '경기남부 통합국제공항 연계 군공항 이전 특별법 발의 및 국토부 사전타당성 용역 검토',
      ground_truth_source: 'https://www.suwon.go.kr',
      difficulty: 'hard',
    },
  ];

  const defaultCandidates: Tier2Candidate[] = [
    {
      id: 'cand-01',
      category: 'landmark',
      body: `${unitName} 스타필드 수원점 별마당 도서관 위치와 층별 규모 알려줘`,
      ground_truth_candidate: '스타필드 수원 4층~7층 관통 대형 서가 및 문화공간',
      source_url: 'https://www.suwon.go.kr',
      status: 'pending',
    },
    {
      id: 'cand-02',
      category: 'specialty_industry',
      body: `${unitName} 델타플렉스(수원일반산업단지)에 입주해 있는 주요 첨단 업종이 뭐야?`,
      ground_truth_candidate: '권선구 고색동 소재 IT, BT, 반도체 장비 및 정밀기계 특화 단지',
      source_url: 'https://www.suwon.go.kr',
      status: 'pending',
    },
    {
      id: 'cand-03',
      category: 'local_policy',
      body: `${unitName}시민 안전보험 보장 항목과 자동 가입 대상자 조건은?`,
      ground_truth_candidate: '수원시에 주민등록을 둔 모든 시민 자동 가입, 대중교통 및 재해사망 보장',
      source_url: 'https://www.suwon.go.kr',
      status: 'pending',
    },
    {
      id: 'cand-04',
      category: 'heritage',
      body: `${unitName} 행궁동 공방거리와 벽화마을 투어 코스 추천해줘`,
      ground_truth_candidate: '화성행궁~행리단길~화홍문으로 이어지는 보행 친화 골목길 코스',
      source_url: 'https://www.suwon.go.kr',
      status: 'pending',
    },
  ];

  return {
    unit_id: unitId,
    questions: defaultQuestions,
    candidates: defaultCandidates,
  };
}

/**
 * GET /api/aeo/tier2-questions?unit_id=lg-41110
 * 질문 목록과 후보 목록 반환
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unit_id') || 'lg-41110';

  try {
    const data = readStoredData(unitId);
    return NextResponse.json({
      unit_id: unitId,
      questions: data.questions,
      candidates: data.candidates,
      updated_at: data.updated_at,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: '질문 목록 조회 실패', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/aeo/tier2-questions
 * 신규 질문 추가, 후보 승인/거부, 또는 일괄 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const unitId = body.unit_id || 'lg-41110';
    const action = body.action || 'create';

    const stored = readStoredData(unitId);

    if (action === 'save_all') {
      // 전체 저장
      if (Array.isArray(body.questions)) {
        stored.questions = body.questions;
      }
      if (Array.isArray(body.candidates)) {
        stored.candidates = body.candidates;
      }
      writeStoredData(unitId, stored);
      return NextResponse.json({
        success: true,
        message: '모든 변경사항이 저장되었습니다.',
        questions: stored.questions,
        candidates: stored.candidates,
      });
    }

    if (action === 'approve_candidate') {
      // 후보 승인: 질문으로 승격하고 후보에서 제거
      const candidateId = body.candidate_id;
      const candIdx = stored.candidates.findIndex((c) => c.id === candidateId);
      const cand = candIdx !== -1 ? stored.candidates[candIdx] : null;

      const newQuestion: Tier2Question = {
        id: body.id || `T2-${Date.now().toString(36).slice(-4)}`,
        category: (body.category || cand?.category || 'specialty_industry') as Tier2Category,
        body: body.body || cand?.body || '',
        ground_truth: body.ground_truth || cand?.ground_truth_candidate || '',
        ground_truth_source: body.ground_truth_source || cand?.source_url || '',
        difficulty: body.difficulty || 'medium',
      };

      stored.questions.push(newQuestion);
      if (candIdx !== -1) {
        stored.candidates.splice(candIdx, 1);
      }

      writeStoredData(unitId, stored);
      return NextResponse.json({
        success: true,
        message: '후보 질문이 승인되어 질문 목록에 추가되었습니다.',
        question: newQuestion,
        questions: stored.questions,
        candidates: stored.candidates,
      });
    }

    if (action === 'reject_candidate') {
      // 후보 거부: 목록에서 제거
      const candidateId = body.candidate_id;
      stored.candidates = stored.candidates.filter((c) => c.id !== candidateId);
      writeStoredData(unitId, stored);
      return NextResponse.json({
        success: true,
        message: '후보 질문이 거부되었습니다.',
        candidates: stored.candidates,
      });
    }

    if (action === 'set_candidates') {
      // AI 생성 등으로 후보 전체 교체 또는 병합
      if (Array.isArray(body.candidates)) {
        stored.candidates = body.candidates;
      }
      writeStoredData(unitId, stored);
      return NextResponse.json({
        success: true,
        candidates: stored.candidates,
      });
    }

    // 기본 동작: 일반 질문 신규 추가 (또는 candidate_id가 포함된 경우)
    if (!body.body || !body.category) {
      return NextResponse.json(
        { error: '질문 본문(body)과 카테고리(category)는 필수입니다.' },
        { status: 400 }
      );
    }

    const newQuestion: Tier2Question = {
      id: body.id || `T2-${Date.now().toString(36).slice(-4)}`,
      category: body.category as Tier2Category,
      body: body.body,
      ground_truth: body.ground_truth || '',
      ground_truth_source: body.ground_truth_source || '',
      difficulty: body.difficulty || 'medium',
    };

    stored.questions.push(newQuestion);

    // 연관된 후보 ID가 있으면 후보 목록에서 제거
    if (body.candidate_id) {
      stored.candidates = stored.candidates.filter((c) => c.id !== body.candidate_id);
    }

    writeStoredData(unitId, stored);

    return NextResponse.json({
      success: true,
      message: '질문이 등록되었습니다.',
      question: newQuestion,
      questions: stored.questions,
      candidates: stored.candidates,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: '요청 처리 실패', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/aeo/tier2-questions
 * 기존 질문 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const unitId = body.unit_id || 'lg-41110';
    const stored = readStoredData(unitId);

    if (body.question && body.question.id) {
      const q = body.question;
      const idx = stored.questions.findIndex((item) => item.id === q.id);
      if (idx !== -1) {
        stored.questions[idx] = {
          ...stored.questions[idx],
          category: q.category || stored.questions[idx].category,
          body: q.body || stored.questions[idx].body,
          ground_truth: q.ground_truth !== undefined ? q.ground_truth : stored.questions[idx].ground_truth,
          ground_truth_source: q.ground_truth_source !== undefined ? q.ground_truth_source : stored.questions[idx].ground_truth_source,
          difficulty: q.difficulty || stored.questions[idx].difficulty,
        };
        writeStoredData(unitId, stored);
        return NextResponse.json({
          success: true,
          message: '질문이 수정되었습니다.',
          question: stored.questions[idx],
          questions: stored.questions,
        });
      } else {
        return NextResponse.json({ error: '해당 ID의 질문을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 전체 리스트 교체
    if (Array.isArray(body.questions)) {
      stored.questions = body.questions;
      writeStoredData(unitId, stored);
      return NextResponse.json({ success: true, questions: stored.questions });
    }

    return NextResponse.json({ error: '수정할 데이터가 올바르지 않습니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: '수정 실패', message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/aeo/tier2-questions
 * 질문 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let unitId = searchParams.get('unit_id');
    let questionId = searchParams.get('question_id');

    if (!unitId || !questionId) {
      try {
        const body = await request.json();
        unitId = unitId || body.unit_id;
        questionId = questionId || body.question_id;
      } catch {
        // body 파싱 생략
      }
    }

    if (!unitId || !questionId) {
      return NextResponse.json(
        { error: 'unit_id와 question_id는 필수입니다.' },
        { status: 400 }
      );
    }

    const stored = readStoredData(unitId);
    const beforeCount = stored.questions.length;
    stored.questions = stored.questions.filter((q) => q.id !== questionId);

    if (stored.questions.length === beforeCount) {
      return NextResponse.json({ error: '삭제할 질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    writeStoredData(unitId, stored);
    return NextResponse.json({
      success: true,
      message: '질문이 삭제되었습니다.',
      questions: stored.questions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: '삭제 실패', message: err.message }, { status: 500 });
  }
}
