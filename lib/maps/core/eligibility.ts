// lib/maps/core/eligibility.ts
// A원칙(이해충돌 방지) 적격성 심사 게이트 — 지자체(광역 16·기초 227) 유상 판매·진단 원천 차단
// 근거: ADR-0026, INV-17, MAPS-INV-17

import type { MapsOrgType } from './types';

export interface MapsEligibilityInput {
  orgName: string;
  orgType: MapsOrgType;
  domain: string;
  sponsorDisclosure?: string | null;
}

export interface MapsEligibilityResult {
  eligible: boolean;
  reasonCode:
    | 'ELIGIBLE_PRIVATE'
    | 'ELIGIBLE_QUASI_PUBLIC_WITH_DISCLOSURE'
    | 'BLOCKED_MUNICIPAL_A_PRINCIPLE'
    | 'BLOCKED_PUBLIC_DOMAIN_SUFFIX'
    | 'REQUIRES_SPONSOR_DISCLOSURE';
  messageKo: string;
  redirectPath: string | null;
}

const MUNICIPAL_NAME_PATTERN =
  /(특별자치시|특별자치도|특별시|광역시|도청|시청|군청|구청|읍사무소|면사무소|동주민센터|행정복지센터)$/;

/**
 * MAPS 상용 트랙 적격성 심사
 *
 * 불변식(INV-17, MAPS-INV-17):
 * 1. 지방자치단체(local_gov_blocked) 또는 .go.kr / .gov 도메인, 시청·군청·구청 명칭은
 *    A원칙(공익 측정 대상에 대한 유·무상 정비·컨설팅·진단 판매 금지)에 따라 즉시 차단하고
 *    공공 공표 트랙(/selfcheck, /units)으로 안내한다.
 * 2. 지방공기업(public_corp) 및 출자·출연 재단(foundation)은 후원·용역 이해관계 공시 문구(sponsorDisclosure)가
 *    명시된 경우에만 승인한다.
 */
export function checkMapsEligibility(
  input: MapsEligibilityInput
): MapsEligibilityResult {
  const cleanName = input.orgName.trim();
  const cleanDomain = input.domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  if (
    input.orgType === 'local_gov_blocked' ||
    MUNICIPAL_NAME_PATTERN.test(cleanName)
  ) {
    return {
      eligible: false,
      reasonCode: 'BLOCKED_MUNICIPAL_A_PRINCIPLE',
      messageKo:
        '지방자치단체(광역 16 · 기초 227) 및 행정기관은 A원칙(이해충돌 방지 · INV-17)에 따라 MAPS 유상 진단·정비 계약 대상에서 제외됩니다. 공공 공표 트랙(/selfcheck · /units)을 이용해 주십시오.',
      redirectPath: '/selfcheck',
    };
  }

  if (
    cleanDomain.endsWith('.go.kr') ||
    cleanDomain.endsWith('.gov') ||
    cleanDomain.endsWith('.korea.kr')
  ) {
    return {
      eligible: false,
      reasonCode: 'BLOCKED_PUBLIC_DOMAIN_SUFFIX',
      messageKo:
        '정부·지자체 공식 도메인(.go.kr / .korea.kr)은 공익 측정 대상이므로 상용 MAPS 스튜디오에서 진단·과금할 수 없습니다 (INV-17).',
      redirectPath: '/selfcheck',
    };
  }

  if (input.orgType === 'public_corp' || input.orgType === 'foundation') {
    const disclosure = (input.sponsorDisclosure ?? '').trim();
    if (disclosure.length < 5) {
      return {
        eligible: false,
        reasonCode: 'REQUIRES_SPONSOR_DISCLOSURE',
        messageKo:
          '지방공기업 및 출자·출연 재단은 후원·용역 이해관계 공시 문구(sponsor_disclosure)를 입력해야 적격 심사를 통과할 수 있습니다.',
        redirectPath: null,
      };
    }

    return {
      eligible: true,
      reasonCode: 'ELIGIBLE_QUASI_PUBLIC_WITH_DISCLOSURE',
      messageKo: `준공공·출자출연기관 이해관계 공시("${disclosure}")가 확인되어 MAPS 스튜디오 이용이 가능합니다.`,
      redirectPath: null,
    };
  }

  return {
    eligible: true,
    reasonCode: 'ELIGIBLE_PRIVATE',
    messageKo:
      '민간 기업·병의원·대학·로컬 상권 적격 요건을 충족하여 MAPS 스튜디오 진단 및 정본 대장 이용이 가능합니다.',
    redirectPath: null,
  };
}
