// app/(public)/[slug]/page.tsx
// FR-48: 지역 조회 URL (/{시군구명}) — 리다이렉트 없이 자체 렌더링하여 공유 URL 보존
import React from 'react';
import { notFound } from 'next/navigation';
import { getUnitBySlug } from '@/lib/db/units';
import UnitDetailPage from '../units/[unitId]/page';

export const revalidate = 3600;

interface SlugPageProps {
  params: {
    slug: string;
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const unit = await getUnitBySlug(params.slug);

  if (!unit) {
    notFound();
  }

  // URL 리다이렉트 없이 동일 컴포넌트로 렌더링
  return <UnitDetailPage params={{ unitId: unit.unit_id }} />;
}
