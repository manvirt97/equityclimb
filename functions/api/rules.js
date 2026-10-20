// GET /api/rules?year=2027 -> Canadian tax, payroll and savings limits for that year (auto-updating).
import { getRules } from '../_shared/rules.js';

export async function onRequestGet({ request }) {
  const y = parseInt(new URL(request.url).searchParams.get('year'), 10) || new Date().getFullYear();
  try {
    const now = await getRules(y);
    return json(now, 3600);
  } catch (e) {
    return json({ error: 'Rules unavailable', detail: String(e).slice(0, 200) }, 60, 502);
  }
}
const json = (d, ttl, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` } });
