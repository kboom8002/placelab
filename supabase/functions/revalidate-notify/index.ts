import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req: Request) => {
  // Auth guard
  const secret = Deno.env.get('EDGE_SHARED_SECRET');
  const provided = req.headers.get('x-edge-secret');
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://kplacelab.kr';
  const revalidateSecret = Deno.env.get('REVALIDATE_SECRET');
  
  try {
    // Call Next.js revalidation endpoint
    const res = await fetch(`${siteUrl}/api/revalidate?secret=${revalidateSecret}&tag=verdicts`);
    const data = await res.json();
    return new Response(JSON.stringify({ revalidated: true, ...data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Revalidation failed' }), { status: 500 });
  }
});
