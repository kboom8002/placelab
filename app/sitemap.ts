// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL || 'https://kplacelab.kr';

  const routes = [
    '',
    '/units',
    '/selfcheck',
    '/submit',
    '/method',
    '/cite',
    '/press',
    '/bot',
    '/evidence',
    '/prereg',
    '/corrections',
    '/equity',
    '/theme-lab',
    '/theme-lab/submit',
    '/theme-lab/map',
    '/theme-lab/themes',
    '/theme-lab/studio',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // Use direct Supabase client (not server client) to avoid cookies dependency
    // This allows the sitemap to be statically generated
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      const { data: units, error } = await supabase
        .from('units')
        .select('unit_id, updated_at')
        .eq('active', true);
        
      if (units && !error) {
        const dynamicRoutes = units.map((unit) => ({
          url: `${siteUrl}/units/${unit.unit_id}`,
          lastModified: unit.updated_at ? new Date(unit.updated_at).toISOString() : new Date().toISOString(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
        return [...routes, ...dynamicRoutes];
      }
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  return routes;
}
