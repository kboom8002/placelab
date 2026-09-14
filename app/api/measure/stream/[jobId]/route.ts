// app/api/measure/stream/[jobId]/route.ts
// 실시간 측정 진행도 및 결과 전달을 위한 SSE(Server-Sent Events) 스트리밍 API (§8.2, INV-7)

import { NextRequest } from 'next/server';
import { getMeasureJob, updateJobProgress, completeJob, failJob } from '@/lib/measurement/job-manager';
import { runMeasurement, ProgressEvent } from '@/lib/measurement/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  const job = await getMeasureJob(jobId);

  if (!job) {
    return new Response(JSON.stringify({ error: '해당 측정 작업을 찾을 수 없습니다.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: any) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.warn('[SSE] 클라이언트 전송 오류 또는 연결 종료:', e);
        }
      };

      // 1. 초기 연결 확인 이벤트
      sendEvent('ready', {
        jobId: job.id,
        agencyHandle: job.agencyHandle,
        agencyName: job.agencyName,
        providers: job.providers,
        status: job.status,
      });

      // 이미 완료된 작업인 경우 즉시 완료 이벤트 반환
      if (job.status === 'done' && job.result) {
        sendEvent('complete', {
          jobId: job.id,
          result: job.result,
          vipReport: job.vipReport,
          techReport: job.techReport,
        });
        controller.close();
        return;
      }

      try {
        // 2. 측정 파이프라인 가동
        const result = await runMeasurement({
          agencyKey: job.agencyHandle,
          providers: job.providers,
          models: job.models,
          questionSet: job.questionSet,
          repetitions: job.repetitions,
          channel: job.channel as any,
          simulation: job.simulation,
          onProgress: async (progressEvent: ProgressEvent) => {
            // DB/메모리 진행 상태 업데이트
            await updateJobProgress(job.id, progressEvent);
            // 실시간 SSE 푸시
            sendEvent('progress', progressEvent);
          },
        });

        // 3. 완료 처리
        await completeJob(job.id, result);

        sendEvent('complete', {
          jobId: job.id,
          result,
          vipReport: result.vipReport,
          techReport: result.technicalReport,
          summary: {
            agency: result.agency,
            providers: result.providers,
            totalApiCalls: result.totalApiCalls,
            durationMs: result.durationMs,
          },
        });

        controller.close();
      } catch (err: any) {
        console.error(`[SSE jobId: ${job.id}] 실행 실패:`, err);
        const errMsg = err.message || '측정 실행 중 예외가 발생했습니다.';
        await failJob(job.id, errMsg);
        sendEvent('error', { message: errMsg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
