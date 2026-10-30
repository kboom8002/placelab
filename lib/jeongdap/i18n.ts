// lib/jeongdap/i18n.ts
// 5개 UI 로케일(ko · ko-easy · en · ja · zh-Hans) 및 쉬운 말(ko-easy) 용어 사전
// 출처: docs/knowledge/multilingual-l10n.md, docs/knowledge/web-copy.md, docs/IMPLEMENTATION-PLAN-jeongdap-note.md §12

export const UI_LOCALES = ['ko', 'ko-easy', 'en', 'ja', 'zh-Hans'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export const MEASUREMENT_LANGUAGES = ['ko', 'en', 'ja', 'zh-Hans'] as const;
export type MeasurementLanguage = (typeof MEASUREMENT_LANGUAGES)[number];

export interface EasyTermExplanation {
  termKey:
    | 'official_source_rate'
    | 'harm_risk_count'
    | 'source_4_stages'
    | 'supply_gap'
    | 'window_state'
    | 'principle_a';
  standardKo: string;
  easyKo: string;
  en: string;
  ja: string;
  zhHans: string;
}

export const JEONGDAP_EASY_GLOSSARY: readonly EasyTermExplanation[] = [
  {
    termKey: 'official_source_rate',
    standardKo:
      '공식 근거율: 공식 누리집·법령에 답이 게시된 문항 중 AI가 공식 출처를 첫 근거로 인용하고 핵심 내용이 일치한 비율',
    easyKo:
      '공식 근거율: 시청·구청 누리집에 이미 안내문이 있는 질문 가운데, AI가 블로그 대신 공식 누리집을 맨 먼저 참고해서 바르게 답한 비율이에요.',
    en: 'Official Source Rate: Share of questions with published official documentation where AI cited an official domain first and matched key facts.',
    ja: '公式根拠率：公式ウェブサイトや法令に案内がある質問のうち、AIが公式ドメインを最初の根拠として引用し内容が一致した割合。',
    zhHans: '官方依据率：在官方网站或法令已发布指南的问题中，AI将官方域名作为首要引用来源且核心内容一致的比例。',
  },
  {
    termKey: 'harm_risk_count',
    standardKo:
      '피해 위험 건수: 고위험 생활행정 문항(재난·안전 제외) 중 수수료·기한·자격·연락처 오답으로 시민의 시간·금전 피해 가능성이 확인된 건수',
    easyKo:
      '피해 위험 건수: 신청 기한이나 수수료, 전화번호를 AI가 다르게 알려주어 시민이 헛걸음하거나 손해를 볼 수 있는 답변 건수예요 (재난·안전은 따로 안내해요).',
    en: 'Harm Risk Count: Number of high-risk civic questions (excluding disaster/safety) where inaccurate fees, deadlines, or contacts could cause real-world harm.',
    ja: '被害リスク件数：高リスク生活行政質問（災害・安全を除く）のうち、手数料・期限・連絡先の誤答により市民に不利益が生じる恐れがある件数。',
    zhHans: '损害风险件数：在高风险生活行政问题（不含灾难与安全）中，因费用、期限或联系方式错误可能导致市民蒙受损失的回答件数。',
  },
  {
    termKey: 'source_4_stages',
    standardKo:
      '출처 4단 판정: 1단(검색에 뜸) → 2단(AI가 읽음) → 3단(첫 근거가 됨) → 4단(내용이 맞음)',
    easyKo:
      '출처 4단: ① 검색 목록에 공식 누리집이 나왔는지 → ② AI가 그 주소를 인용했는지 → ③ 첫 번째 근거로 삼았는지 → ④ 숫자·내용이 맞는지 차례대로 확인해요.',
    en: '4-Stage Source Evaluation: Stage 1 (Appeared in search) → Stage 2 (Cited by AI) → Stage 3 (First official citation) → Stage 4 (Fact match).',
    ja: '出典4段階判定：第1段階（検索に出る）→第2段階（AIが引用）→第3段階（最初の根拠になる）→第4段階（内容が一致）。',
    zhHans: '来源四阶段判定：第1阶段（出现在搜索结果）→第2阶段（被AI引用）→第3阶段（成为首要依据）→第4阶段（内容准确）。',
  },
  {
    termKey: 'supply_gap',
    standardKo:
      '공급 공백: 해당 지자체 공식 누리집·자치법규에 관련 안내 문서 자체가 아직 게시되지 않은 상태 (AI 오답률 분모에서 분리)',
    easyKo:
      '공급 공백: 시청·구청 누리집에 아직 안내 글이 올라와 있지 않은 경우예요. AI가 읽을 공식 문서 자체가 없으므로 따로 나누어 표시해요.',
    en: 'Supply Gap: No official document is currently published on the municipality website or ordinance portal (separated from the primary denominator).',
    ja: '供給空白：自治体の公式サイトや条例に該当する案内文書がまだ掲載されていない状態（主要分母から分離）。',
    zhHans: '供给空白：地方政府官网或法规库中尚未发布相关指南文档的状态（从主分母中分离统计）。',
  },
  {
    termKey: 'window_state',
    standardKo:
      '4주 12회 창 상태: 주간 상시 관측(월·수·금) 최근 4주 12회 중 등장 빈도에 따라 안정(9회 이상)·신규(이번 주 2회 이상, 이전 3주 0회)만 공개',
    easyKo:
      '4주 날씨 상태: 한 달(12번) 동안 AI 추천에 꾸준히 나온 지역(안정)과 이번 주에 새로 떠오른 지역(신규)만 기상도에 보여주고, 안 나온 지역 명단은 만들지 않아요.',
    en: '4-Week Window State: Across 12 observations over 4 weeks, only Stable (≥9/12) and New (≥2 this week after 0 in prior 3 weeks) regions are shown.',
    ja: '4週12回ウィンドウ状態：直近4週12回の観測で「安定（9回以上）」「新規（今週2回以上・前3週0回）」の地域のみを表示。',
    zhHans: '4周12次窗口状态：在最近4周12次观测中，仅展示“稳定（≥9次）”与“新增（本周≥2次且前3周为0）”地区。',
  },
  {
    termKey: 'principle_a',
    standardKo:
      'A원칙(이해충돌 방지): 측정 대상 지자체·공공기관에 정비·컨설팅·개선 대행·VIP 진단 상품을 유상으로 판매하거나 무상으로 제공하지 않음',
    easyKo:
      'A원칙(약속): 점수를 매기는 곳이 컨설팅을 팔면 공정할 수 없어요. 그래서 모두의 정답노트는 지자체에 유료 상품이나 컨설팅을 절대 팔지 않아요.',
    en: 'Principle A (No Conflict of Interest): We never sell or provide paid/free consulting, repair, or VIP diagnostic services to measured public agencies.',
    ja: 'A原則（利益相反防止）：測定対象の自治体・公共機関に対して、整備・コンサルティング・有償診断商品を一切販売・提供しません。',
    zhHans: 'A原则（防止利益冲突）：绝不向被测量的地方政府或公共机构销售或提供任何有偿/无偿整改、咨询或诊断产品。',
  },
] as const;

export function getTermExplanation(
  termKey: EasyTermExplanation['termKey'],
  locale: UiLocale = 'ko'
): string {
  const found = JEONGDAP_EASY_GLOSSARY.find((item) => item.termKey === termKey);
  if (!found) return '';
  switch (locale) {
    case 'ko-easy':
      return found.easyKo;
    case 'en':
      return found.en;
    case 'ja':
      return found.ja;
    case 'zh-Hans':
      return found.zhHans;
    case 'ko':
    default:
      return found.standardKo;
  }
}
