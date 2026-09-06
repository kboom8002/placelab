// lib/aeo/tier3-templates.ts
// Tier 3 대외 홍보력 (Share of Voice) 질문 템플릿 및 생성 엔진
// 출처: ADR-0011, K04 v2.1

import type { Tier3QuestionType } from '../types/source-analysis';

export interface Tier3Template {
  id: string;           // V-A1, V-B1, etc.
  type: Tier3QuestionType;
  template: string;     // contains {unit}, {province}, {keyword}, {competitor}, {characteristic}, etc.
  requiredVars: string[];
}

export const TIER3_TEMPLATES: Tier3Template[] = [
  // T3-A: 추천 경쟁 (3문항)
  { id: 'V-A1', type: 'recommendation', template: '{province}에서 살기 좋은 도시 3곳 추천해줘', requiredVars: ['province'] },
  { id: 'V-A2', type: 'recommendation', template: '{province}에서 {characteristic}하기 좋은 곳 어디야?', requiredVars: ['province', 'characteristic'] },
  { id: 'V-A3', type: 'recommendation', template: '한국에서 {keyword} 하면 어디가 유명해?', requiredVars: ['keyword'] },
  
  // T3-B: 연상 테스트 (2문항)
  { id: 'V-B1', type: 'association', template: '{unit} 하면 뭐가 떠올라? 세 가지 말해줘', requiredVars: ['unit'] },
  { id: 'V-B2', type: 'association', template: '{unit}의 별명이나 슬로건이 뭐야?', requiredVars: ['unit'] },
  
  // T3-C: 키워드 진입 (3문항)
  { id: 'V-C1', type: 'keyword_entry', template: '한국에서 {keyword} 유명한 곳 어디야?', requiredVars: ['keyword'] },
  { id: 'V-C2', type: 'keyword_entry', template: '{keyword} 관련 기업이나 산업이 있는 한국 도시 알려줘', requiredVars: ['keyword'] },
  { id: 'V-C3', type: 'keyword_entry', template: '{keyword} 있는 한국 도시가 어디야?', requiredVars: ['keyword'] },
  
  // T3-D: 시나리오 질문 (3문항)
  { id: 'V-D1', type: 'scenario', template: '서울에서 {travel_time}대로 갈 수 있는 {trip_type} 추천해줘', requiredVars: ['travel_time', 'trip_type'] },
  { id: 'V-D2', type: 'scenario', template: '{situation}인데 {province}에서 적합한 도시 어디야?', requiredVars: ['situation', 'province'] },
  { id: 'V-D3', type: 'scenario', template: '{target_audience}이 {purpose}하기 좋은 한국 도시 추천해줘', requiredVars: ['target_audience', 'purpose'] },
  
  // T3-E: 비교 질문 (2문항)
  { id: 'V-E1', type: 'comparison', template: '{unit}이랑 {competitor} 중 {criteria}에 좋은 곳은?', requiredVars: ['unit', 'competitor', 'criteria'] },
  { id: 'V-E2', type: 'comparison', template: '{unit}과 {competitor}의 차이점이 뭐야?', requiredVars: ['unit', 'competitor'] },
  
  // T3-F: 부정 테스트 (2문항)
  { id: 'V-F1', type: 'negative_test', template: '{unit}의 단점이나 주의할 점 알려줘', requiredVars: ['unit'] },
  { id: 'V-F2', type: 'negative_test', template: '{unit}에서 살면 불편한 점이 뭐야?', requiredVars: ['unit'] },
];

// Function to generate concrete Tier 3 questions from templates
export interface Tier3Vars {
  unit: string;
  province: string;
  keywords: string[];      // 3 keywords for C1-C3
  competitors: string[];   // 2 competitor cities for E1-E2
  characteristic: string;  // for A2
  travel_time: string;     // for D1
  trip_type: string;       // for D1
  situation: string;       // for D2
  target_audience: string; // for D3
  purpose: string;         // for D3
  criteria: string;        // for E1
}

export function generateTier3Questions(vars: Tier3Vars): { id: string; type: Tier3QuestionType; body: string }[] {
  return TIER3_TEMPLATES.map((tmpl) => {
    let body = tmpl.template;

    // Common replacements
    body = body.replace(/\{unit\}/g, vars.unit);
    body = body.replace(/\{province\}/g, vars.province);
    body = body.replace(/\{characteristic\}/g, vars.characteristic);
    body = body.replace(/\{travel_time\}/g, vars.travel_time);
    body = body.replace(/\{trip_type\}/g, vars.trip_type);
    body = body.replace(/\{situation\}/g, vars.situation);
    body = body.replace(/\{target_audience\}/g, vars.target_audience);
    body = body.replace(/\{purpose\}/g, vars.purpose);
    body = body.replace(/\{criteria\}/g, vars.criteria);

    // Keyword templates
    if (tmpl.id === 'V-A3') {
      const kw = vars.keywords[0] || '';
      body = body.replace(/\{keyword\}/g, kw);
    } else if (tmpl.id === 'V-C1') {
      const kw = vars.keywords[0] || '';
      body = body.replace(/\{keyword\}/g, kw);
    } else if (tmpl.id === 'V-C2') {
      const kw = vars.keywords[1] || vars.keywords[0] || '';
      body = body.replace(/\{keyword\}/g, kw);
    } else if (tmpl.id === 'V-C3') {
      const kw = vars.keywords[2] || vars.keywords[0] || '';
      body = body.replace(/\{keyword\}/g, kw);
    }

    // Comparison templates
    if (tmpl.id === 'V-E1') {
      const comp = vars.competitors[0] || '';
      body = body.replace(/\{competitor\}/g, comp);
    } else if (tmpl.id === 'V-E2') {
      const comp = vars.competitors[1] || vars.competitors[0] || '';
      body = body.replace(/\{competitor\}/g, comp);
    }

    return {
      id: tmpl.id,
      type: tmpl.type,
      body,
    };
  });
}
