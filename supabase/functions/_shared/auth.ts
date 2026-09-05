export function requireAuth(req: Request): void {
  const secret = Deno.env.get('EDGE_SHARED_SECRET');
  if (!secret) throw new Error('EDGE_SHARED_SECRET not configured');
  const provided = req.headers.get('x-edge-secret');
  if (provided !== secret) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
