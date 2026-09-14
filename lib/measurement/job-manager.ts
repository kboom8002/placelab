// lib/measurement/job-manager.ts
// 측정 작업(MeasureJob) 상태 관리 및 큐 브릿지 (Supabase DB + 인메모리 폴백 지원)

import { createClient } from '@supabase/supabase-js';
import type { MeasurementRunnerResult, ProgressEvent } from './runner';

export interface MeasureJob {
  id: string;
  agencyHandle: string;
  agencyName: string;
  providers: ('gemini' | 'openai')[];
  models: Record<string, string>;
  questionSet: 'core' | 'custom';
  repetitions: number;
  channel: string;
  simulation: boolean;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: ProgressEvent | null;
  result: MeasurementRunnerResult | null;
  vipReport: string | null;
  techReport: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// 인메모리 저장소 (개발/로컬/DB 폴백용)
const memoryStore = new Map<string, MeasureJob>();

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

/**
 * 신규 측정 작업 생성
 */
export async function createMeasureJob(params: {
  agencyHandle: string;
  agencyName: string;
  providers: ('gemini' | 'openai')[];
  models?: Record<string, string>;
  questionSet?: 'core' | 'custom';
  repetitions?: number;
  channel?: string;
  simulation?: boolean;
}): Promise<MeasureJob> {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const job: MeasureJob = {
    id,
    agencyHandle: params.agencyHandle,
    agencyName: params.agencyName,
    providers: params.providers.length > 0 ? params.providers : ['gemini'],
    models: params.models || {},
    questionSet: params.questionSet || 'core',
    repetitions: params.repetitions || 3,
    channel: params.channel || 'agency_notice',
    simulation: params.simulation || false,
    status: 'queued',
    progress: null,
    result: null,
    vipReport: null,
    techReport: null,
    error: null,
    createdAt: now,
    startedAt: null,
    completedAt: null,
  };

  memoryStore.set(id, job);

  // Supabase 동기화 시도
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('measure_jobs').insert({
        id,
        agency_handle: job.agencyHandle,
        agency_name: job.agencyName,
        providers: job.providers,
        models: job.models,
        question_set: job.questionSet,
        repetitions: job.repetitions,
        channel: job.channel,
        simulation: job.simulation,
        status: 'queued',
        created_at: now,
      });
    } catch (e) {
      console.warn('[JobManager] Supabase 작업 등록 실패, 메모리 저장소로 계속 진행:', e);
    }
  }

  return job;
}

/**
 * 작업 조회
 */
export async function getMeasureJob(jobId: string): Promise<MeasureJob | null> {
  const memJob = memoryStore.get(jobId);
  if (memJob) return memJob;

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data } = await sb
        .from('measure_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (data) {
        const job: MeasureJob = {
          id: data.id,
          agencyHandle: data.agency_handle,
          agencyName: data.agency_name,
          providers: data.providers,
          models: data.models,
          questionSet: data.question_set,
          repetitions: data.repetitions,
          channel: data.channel,
          simulation: data.simulation,
          status: data.status,
          progress: data.progress,
          result: data.result,
          vipReport: data.vip_report_md,
          techReport: data.tech_report_md,
          error: data.error,
          createdAt: data.created_at,
          startedAt: data.started_at,
          completedAt: data.completed_at,
        };
        memoryStore.set(jobId, job);
        return job;
      }
    } catch {}
  }

  return null;
}

/**
 * 작업 진행 상태 갱신
 */
export async function updateJobProgress(jobId: string, progress: ProgressEvent): Promise<void> {
  const job = memoryStore.get(jobId);
  if (job) {
    job.progress = progress;
    if (job.status === 'queued') {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
    }
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb
        .from('measure_jobs')
        .update({
          status: 'running',
          progress,
          locked_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    } catch {}
  }
}

/**
 * 작업 완료 처리
 */
export async function completeJob(
  jobId: string,
  result: MeasurementRunnerResult
): Promise<void> {
  const now = new Date().toISOString();
  const job = memoryStore.get(jobId);
  if (job) {
    job.status = 'done';
    job.result = result;
    job.vipReport = result.vipReport;
    job.techReport = result.technicalReport;
    job.completedAt = now;
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb
        .from('measure_jobs')
        .update({
          status: 'done',
          result,
          vip_report_md: result.vipReport,
          tech_report_md: result.technicalReport,
          completed_at: now,
        })
        .eq('id', jobId);
    } catch {}
  }
}

/**
 * 작업 실패 처리
 */
export async function failJob(jobId: string, errorMsg: string): Promise<void> {
  const now = new Date().toISOString();
  const job = memoryStore.get(jobId);
  if (job) {
    job.status = 'failed';
    job.error = errorMsg;
    job.completedAt = now;
  }

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb
        .from('measure_jobs')
        .update({
          status: 'failed',
          error: errorMsg,
          completed_at: now,
        })
        .eq('id', jobId);
    } catch {}
  }
}
