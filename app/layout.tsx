// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: '모두의 정답노트 — AI가 우리 동네를 제대로 답하는가',
  description:
    '전국 광역 16 · 기초 227개 지방자치단체와 특별구역에 대해 생성형 AI가 공식 출처를 첫 근거로 인용하고 정확히 답하는지 측정·공표하는 민간 공익 데이터 플랫폼',
  metadataBase: new URL(process.env.SITE_URL || 'https://jeongdap.kr'),
  openGraph: {
    title: '모두의 정답노트 — AI가 우리 동네를 제대로 답하는가',
    description:
      '전국 광역 16 · 기초 227개 지방자치단체와 특별구역에 대해 생성형 AI가 공식 출처를 첫 근거로 인용하고 정확히 답하는지 측정·공표하는 민간 공익 데이터 플랫폼',
    siteName: '모두의 정답노트 (Jeongdap Note)',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // FR-5.4 자기준수 원칙: 모든 공개 페이지에 유효한 JSON-LD 삽입
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '모두의 정답노트',
    alternateName: ['Jeongdap Note', 'kplacelab'],
    url: 'https://jeongdap.kr',
    description:
      'AI가 우리 동네를 제대로 답하는가 — 전국 지방자치단체 AI 응답의 공식 근거율과 피해 위험을 독립 측정하는 민간 공익 플랫폼',
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
