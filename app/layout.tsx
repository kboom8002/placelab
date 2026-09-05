// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'kplacelab — 지자체 AI 응답 측정 플랫폼',
  description:
    '전국 243개 지방자치단체와 특별구역의 생성형 AI 기술 접근성과 응답 품질을 독립적으로 측정하고 시계열로 추적하는 웹 플랫폼',
  metadataBase: new URL(process.env.SITE_URL || 'https://kplacelab.kr'),
  openGraph: {
    title: 'kplacelab — 지자체 AI 응답 측정 플랫폼',
    description:
      '전국 243개 지방자치단체와 특별구역의 생성형 AI 기술 접근성과 응답 품질을 독립적으로 측정하고 시계열로 추적하는 웹 플랫폼',
    siteName: 'kplacelab',
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
    name: 'kplacelab',
    alternateName: '지자체 AI 응답 측정 플랫폼',
    url: 'https://kplacelab.kr',
    description:
      '전국 243개 지방자치단체와 특별구역의 생성형 AI 기술 접근성과 응답 품질을 독립적으로 측정하는 웹 플랫폼',
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
