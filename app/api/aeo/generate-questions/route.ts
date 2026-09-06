// app/api/aeo/generate-questions/route.ts
// Tier 2 질문 후보 자동 생성 API (gpt-5.6-luna 연동)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { generateTier2Candidates } from '@/lib/aeo/generate-tier2';
import type { CrawlResult } from '@/lib/aeo/crawl-unit';

const GenerateRequestSchema = z.object({
  unit_id: z.string().min(1),
  unit_name: z.string().min(1),
  target_count: z.number().min(7).max(100).default(50),
});

const CORPUS_DIR = path.join(process.cwd(), 'docs', 'aeo-corpus');
const QUESTIONS_DIR = path.join(process.cwd(), 'docs', 'aeo-questions');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateRequestSchema.parse(body);

    // 1. 크롤링된 코퍼스 확인
    let corpus: CrawlResult[] = [];
    const safeId = parsed.unit_id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const corpusPath = path.join(CORPUS_DIR, `${safeId}.json`);

    if (fs.existsSync(corpusPath)) {
      try {
        const rawCorpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
        if (Array.isArray(rawCorpus.pages)) {
          corpus = rawCorpus.pages;
        }
      } catch (err) {
        console.warn(`[generate-questions] 코퍼스 파일 읽기 실패: ${corpusPath}`);
      }
    }

    // 2. AI 후보 생성 호출 (gpt-5.6-luna)
    const generated = await generateTier2Candidates(
      parsed.unit_name,
      parsed.unit_id,
      corpus,
      parsed.target_count
    );

    // 3. docs/aeo-questions/{unitId}.json에 후보 병합 저장
    if (!fs.existsSync(QUESTIONS_DIR)) {
      fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
    }
    const questionsPath = path.join(QUESTIONS_DIR, `${safeId}.json`);
    let storedData = {
      unit_id: parsed.unit_id,
      questions: [],
      candidates: [] as any[],
      updated_at: new Date().toISOString(),
    };

    if (fs.existsSync(questionsPath)) {
      try {
        storedData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
      } catch {
        // 기존 파일 없거나 파싱 오류 시 기본값 유지
      }
    }

    const newCandidates = generated.map((g, idx) => ({
      id: `cand-${Date.now().toString(36)}-${idx + 1}`,
      category: g.category,
      body: g.body,
      ground_truth_candidate: g.groundTruthCandidate,
      source_url: g.sourceUrl,
      status: 'pending',
    }));

    // 기존 후보 뒤에 추가 (중복 방지)
    storedData.candidates = [...(storedData.candidates || []), ...newCandidates];
    storedData.updated_at = new Date().toISOString();

    fs.writeFileSync(questionsPath, JSON.stringify(storedData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      unit_id: parsed.unit_id,
      unit_name: parsed.unit_name,
      generated_count: newCandidates.length,
      total_candidates: storedData.candidates.length,
      candidates: storedData.candidates,
      message: `${parsed.unit_name}의 고유 정보 질문 후보 ${newCandidates.length}개가 생성되었습니다.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '요청 형식이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '질문 생성 중 오류가 발생했습니다.', message: (error as any).message },
      { status: 500 }
    );
  }
}
