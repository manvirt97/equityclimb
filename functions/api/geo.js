// GET /api/geo -> approximate location from Cloudflare's edge (no GPS, no permission prompt)
export async function onRequestGet({ request }) {
  const c = request.cf || {};
  return new Response(JSON.stringify({ city: c.city || '', region: c.region || '', country: c.country || 'CA' }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'private, max-age=600' } });
}
