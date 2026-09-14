// lib/measurement/registries.ts
// docs/measurement-spec: 등록부(모집단, 관측 프로필, 계열 배정, 원장 출처) SSOT 로더

import fs from 'fs';
import path from 'path';
import type {
  PopulationFrame,
  RunProfileRegistry,
  AgencyEntry,
} from '@/lib/types/measurement-spec';

const REGISTRIES_DIR = path.join(
  process.cwd(),
  'docs',
  'measurement-spec',
  'data',
  'registries'
);

export function getPopulationFrame(): PopulationFrame {
  const filePath = path.join(REGISTRIES_DIR, 'population_frame.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getRunProfileRegistry(): RunProfileRegistry {
  const filePath = path.join(REGISTRIES_DIR, 'run_profile.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getArchetypeAssignment(): any {
  const filePath = path.join(REGISTRIES_DIR, 'archetype_assignment.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function getLedgerSources(): any {
  const filePath = path.join(REGISTRIES_DIR, 'ledger_sources.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function findAgencyByHandle(handle: string): AgencyEntry | undefined {
  const frame = getPopulationFrame();
  return frame.agencies.find((a) => a.handle === handle);
}

export function findAgencyByDisplay(name: string): AgencyEntry | undefined {
  const frame = getPopulationFrame();
  return frame.agencies.find(
    (a) => a.display === name || a.display.replace(/(시|군|구)$/, '') === name
  );
}
