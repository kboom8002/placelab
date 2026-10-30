// lib/kbrandlab/local/jsonld-generator.ts
// 로컬레이다 (LocalRadar) 소상공인 5대 영업 정본 → Schema.org LocalBusiness / FAQPage JSON-LD 생성기
// 근거: ADR-0025, PRD FR-96, AGENTS.md §4 (금지어 배제) 및 의료법 제56조 준수 게이트

import { FORBIDDEN_WORDS } from '@/lib/constants/measurement';
import { HIGH_RISK_FACT_DEFINITIONS } from './constants';
import type { LocalShop } from './types';

/**
 * 의료기관(강남 피부과·클리닉 등) 정본 입력 시 의료법 제56조 및 저장소 금지어 위반 여부를 검사한다.
 * - 치료 효과 보장, 타 기관 비방·비교, 서열 표현을 차단하고 객관적 운영 사실만 허용한다.
 */
const MEDICAL_PROHIBITED_CLAIMS = [
  '완치 보장',
  '100% 효과',
  '부작용 없음',
  '무통증 보장',
  '최고 시술',
  '유일한 시술',
] as const;

export interface CanonicalValidationResult {
  valid: boolean;
  violations: string[];
}

export function validateShopCanonicalFacts(shop: LocalShop): CanonicalValidationResult {
  const violations: string[] = [];

  for (const fact of shop.facts) {
    for (const word of FORBIDDEN_WORDS) {
      if (fact.canonicalValue.includes(word)) {
        violations.push(
          `[${fact.factLabel}] 저장소 금지어("${word}")가 포함되어 있습니다.`,
        );
      }
    }

    if (shop.isMedicalRegulated) {
      for (const medClaim of MEDICAL_PROHIBITED_CLAIMS) {
        if (fact.canonicalValue.includes(medClaim)) {
          violations.push(
            `[${fact.factLabel}] 의료법 준수 트랙에서 허용되지 않는 치료 효과 단정 표현("${medClaim}")이 포함되어 있습니다.`,
          );
        }
      }
    }
  }

  if (shop.isMedicalRegulated && !shop.licenseVerified) {
    violations.push('의료법 준수 트랙 매장은 개설 허가·면허 확인(licenseVerified)이 필수입니다.');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * 매장의 5대 고위험 영업 사실 정본을 AI 웹검색 수집기가 즉시 파싱할 수 있는
 * Schema.org LocalBusiness (또는 LodgingBusiness / MedicalClinic) + FAQPage JSON-LD 로 변환한다.
 */
export function generateShopJsonLd(shop: LocalShop): Record<string, unknown> {
  const validation = validateShopCanonicalFacts(shop);
  if (!validation.valid) {
    throw new Error(
      `정본 검증 실패로 JSON-LD를 생성할 수 없습니다: ${validation.violations.join('; ')}`,
    );
  }

  const schemaType = shop.isMedicalRegulated
    ? 'MedicalClinic'
    : shop.cohortId === 'SEOGWIPO_STAY' && shop.category.includes('숙소')
      ? 'LodgingBusiness'
      : 'LocalBusiness';

  const faqEntities = shop.facts.map((fact) => {
    const def = HIGH_RISK_FACT_DEFINITIONS.find((d) => d.key === fact.factKey);
    const questionText = def
      ? def.questionTemplate
          .replace('{region}', shop.neighborhood)
          .replace('{shopName}', shop.shopName)
      : `${shop.shopName}의 ${fact.factLabel}은 어떻게 되나요?`;

    return {
      '@type': 'Question',
      name: questionText,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${fact.canonicalValue} (점주 최종 확인일: ${fact.ownerVerifiedAt}, 정본 출처: ${fact.sourceUrl})`,
      },
    };
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': schemaType,
        '@id': `https://${shop.canonicalDomain}/#identity`,
        name: shop.shopName,
        alternateName: shop.aliases,
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.neighborhood,
          addressCountry: 'KR',
        },
        url: `https://${shop.canonicalDomain}`,
        sameAs: [shop.placeUrl, shop.bookingUrl].filter(Boolean),
        potentialAction: {
          '@type': 'ReserveAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: shop.bookingUrl,
          },
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `https://${shop.canonicalDomain}/#localradar-facts`,
        mainEntity: faqEntities,
      },
    ],
  };
}
