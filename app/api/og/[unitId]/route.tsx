// app/api/og/[unitId]/route.tsx
// FR-47: 단위별 소셜 공유 카드 (OG Image) 동적 생성 (확산 엔진)
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getUnitById } from '@/lib/db/units';
import { CURRENT_METHOD_VERSION } from '@/lib/constants/measurement';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { unitId: string } }
) {
  const unit = await getUnitById(params.unitId);

  const unitName = unit ? unit.name : '대한민국 지자체';
  const verdict = unit?.robots_verdict || 'undetermined';
  const published = unit?.published ?? false;

  const verdictLabel = !published
    ? '공표 전 심사 중'
    : verdict === 'open'
    ? '개방 (Open)'
    : verdict === 'blocked_all'
    ? '전체 차단 (Blocked All)'
    : verdict === 'blocked_selective'
    ? '선별 차단 (Selective)'
    : verdict === 'no_file'
    ? '파일 없음 (No File)'
    : '판정 불가 (Undetermined)';

  const verdictColor = !published
    ? '#64748b'
    : verdict === 'open'
    ? '#10b981'
    : verdict === 'blocked_all'
    ? '#f43f5e'
    : verdict === 'blocked_selective'
    ? '#f59e0b'
    : '#8b5cf6';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단 브랜딩 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            K
          </div>
          <span style={{ fontSize: '26px', color: '#94a3b8', fontWeight: 'bold' }}>
            kplacelab · 지자체 AI 응답 측정 플랫폼
          </span>
        </div>

        {/* 중앙 카드 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#ffffff' }}>
            {unitName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '28px', color: '#cbd5e1' }}>
              AI 기술 접근성 상태:
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: verdictColor,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 18px',
                borderRadius: '8px',
                border: `1px solid ${verdictColor}`,
              }}
            >
              {verdictLabel}
            </span>
          </div>
        </div>

        {/* 하단 메타정보 */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #334155',
            paddingTop: '24px',
            color: '#64748b',
            fontSize: '18px',
          }}
        >
          <span>측정 방법론 {CURRENT_METHOD_VERSION} · 2주 연속 동일 확인 승격 원칙</span>
          <span>kplacelab.kr</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
