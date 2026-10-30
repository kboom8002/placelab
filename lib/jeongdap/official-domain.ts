// lib/jeongdap/official-domain.ts
// 출처:
// - docs/IMPLEMENTATION-PLAN-jeongdap-note.md §3.1, §10 official-domain.ts
// - jeongdap-note-repo-docs-v1.1/measurement/judge_auto.py L33-42

import { OfficialDomainKind } from './types';

export interface OfficialDomainRegistryEntry {
  unitId: string;
  selfDomains: string[];         // 해당 기관 (예: guro.go.kr)
  metroDomains?: string[];       // 소관 광역 (예: seoul.go.kr, cartax.seoul.go.kr)
  linkedAgencyDomains?: string[]; // 산하·연결기관 (예: guro.nid.or.kr)
  cultureDomains?: string[];     // 문화·관광 공식 포털 (예: visitkorea.or.kr)
  ledgerDomains?: string[];      // 원장 official_url_1 / official_url_2 도메인
}

const CENTRAL_GOV_DOMAINS = [
  'go.kr',
  'gov.kr',
  'korea.kr',
  'law.go.kr',
  'bokjiro.go.kr',
  'wetax.go.kr',
  'etax.seoul.go.kr',
  'nhis.or.kr',
  'nps.or.kr',
] as const;

const CULTURE_PORTAL_DOMAINS = [
  'visitkorea.or.kr',
  'cha.go.kr',
  'khs.go.kr',
  'mcst.go.kr',
  'visitseoul.net',
  'visitbusan.net',
  'visitjeju.net',
] as const;

export function extractHostname(urlOrHost: string): string {
  if (!urlOrHost) return '';
  try {
    const withProto = /^https?:\/\//i.test(urlOrHost) ? urlOrHost : `https://${urlOrHost}`;
    return new URL(withProto).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function matchesDomainList(host: string, list: readonly string[] | undefined): boolean {
  if (!host || !list || list.length === 0) return false;
  for (const raw of list) {
    const target = extractHostname(raw) || raw.trim().toLowerCase().replace(/^www\./, '');
    if (!target) continue;
    if (host === target || host.endsWith(`.${target}`)) {
      return true;
    }
  }
  return false;
}

/**
 * URL을 5대 공식 출처 범주(self / metro / central / linked_agency / culture) 또는 other로 분류한다.
 */
export function classifyDomainKind(
  url: string,
  entry?: OfficialDomainRegistryEntry
): OfficialDomainKind {
  const host = extractHostname(url);
  if (!host) return 'other';

  if (entry) {
    if (matchesDomainList(host, entry.selfDomains) || matchesDomainList(host, entry.ledgerDomains)) {
      return 'self';
    }
    if (matchesDomainList(host, entry.metroDomains)) {
      return 'metro';
    }
    if (matchesDomainList(host, entry.linkedAgencyDomains)) {
      return 'linked_agency';
    }
    if (matchesDomainList(host, entry.cultureDomains)) {
      return 'culture';
    }
  }

  if (matchesDomainList(host, CULTURE_PORTAL_DOMAINS)) {
    return 'culture';
  }

  if (host.endsWith('.go.kr') || matchesDomainList(host, CENTRAL_GOV_DOMAINS)) {
    return 'central';
  }

  return 'other';
}

export function isOfficialDomain(url: string, entry?: OfficialDomainRegistryEntry): boolean {
  return classifyDomainKind(url, entry) !== 'other';
}
