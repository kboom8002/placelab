// app/api/aeo/crawl/route.ts
// 지자체 사이트 크롤링 API (INV-5 준수)
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { crawlUnit } from '@/lib/aeo/crawl-unit';

const CrawlRequestSchema = z.object({
  unit_id: z.string().min(1),
  base_url: z.string().url().optional(),
  max_pages: z.number().min(1).max(50).default(30),
});

const CORPUS_DIR = path.join(process.cwd(), 'docs', 'aeo-corpus');

function ensureCorpusDir() {
  if (!fs.existsSync(CORPUS_DIR)) {
    fs.mkdirSync(CORPUS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CrawlRequestSchema.parse(body);

    // baseUrl 미입력 시 기본 수원시 URL 매핑 또는 유추
    let targetUrl = parsed.base_url;
    if (!targetUrl) {
      if (parsed.unit_id === 'lg-41110' || parsed.unit_id.includes('suwon')) {
        targetUrl = 'https://www.suwon.go.kr';
      } else {
        targetUrl = 'https://www.suwon.go.kr';
      }
    }

    // 실제 크롤링 실행 (INV-5 준수)
    const results = await crawlUnit({
      unitId: parsed.unit_id,
      baseUrl: targetUrl,
      maxPages: parsed.max_pages,
    });

    // 크롤링 코퍼스 파일에 저장 (추후 질문 생성에 활용)
    ensureCorpusDir();
    const safeId = parsed.unit_id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const corpusPath = path.join(CORPUS_DIR, `${safeId}.json`);
    fs.writeFileSync(
      corpusPath,
      JSON.stringify(
        {
          unit_id: parsed.unit_id,
          base_url: targetUrl,
          crawled_at: new Date().toISOString(),
          count: results.length,
          pages: results,
        },
        null,
        2
      ),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      unit_id: parsed.unit_id,
      base_url: targetUrl,
      crawled_count: results.length,
      pages: results,
      message: `성공적으로 ${results.length}개의 페이지를 수집했습니다.`,
      note: 'INV-5: SCANNER_UA 사용, robots.txt 준수 완료',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '크롤링 처리 중 오류가 발생했습니다.', message: (error as any).message },
      { status: 500 }
    );
  }
}
