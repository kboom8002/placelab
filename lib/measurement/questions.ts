// lib/measurement/questions.ts
// docs/measurement-spec: 문항 지식 소스 단일 출처(SSOT) 로더
// 애플리케이션 코드 안에 문항 목록을 하드코딩하지 않고 data/questions/에서 직접 로드

import fs from 'fs';
import path from 'path';
import type { Question } from '@/lib/types/measurement-spec';

const QUESTIONS_DIR = path.join(process.cwd(), 'docs', 'measurement-spec', 'data', 'questions');

export interface QuestionSetDoc {
  set: string;
  revision: number;
  reference_date: string;
  counts?: {
    value: number;
    descriptive: number;
  };
  questions: Question[];
}

export function getCoreCommonQuestions(): Question[] {
  const filePath = path.join(QUESTIONS_DIR, 'core_common.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const doc: QuestionSetDoc = JSON.parse(fileContent);
  return doc.questions;
}

export function getArchetypeQuestions(archetype: 'depopulation' | 'tourism' | 'industry' | 'urban_rural' | 'border_island'): Question[] {
  const filePath = path.join(QUESTIONS_DIR, `archetype_${archetype}.json`);
  if (!fs.existsSync(filePath)) return [];
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const doc: QuestionSetDoc = JSON.parse(fileContent);
  return doc.questions;
}

export function getProjectTemplate(): any {
  const filePath = path.join(QUESTIONS_DIR, 'project_template.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

export function getAllActiveQuestions(options?: {
  includeRestricted?: boolean;
  archetypes?: ('depopulation' | 'tourism' | 'industry' | 'urban_rural' | 'border_island')[];
}): Question[] {
  const core = getCoreCommonQuestions();
  let questions = [...core];

  if (options?.archetypes) {
    for (const arch of options.archetypes) {
      questions = questions.concat(getArchetypeQuestions(arch));
    }
  }

  return questions.filter((q) => {
    if (q.status !== 'active') return false;
    if (!options?.includeRestricted && q.sensitivity === 'restricted') return false;
    return true;
  });
}
