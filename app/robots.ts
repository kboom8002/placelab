// app/robots.ts
// AGENTS.md §7: kplacelab의 robots.txt는 완전 개방이고 Sitemap을 선언한다 (CI 체크 항목)
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL || 'https://kplacelab.kr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
