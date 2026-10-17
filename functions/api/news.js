// GET /api/news?scope=local|national|global&city=Calgary&region=Alberta&country=CA
// Pulls Google News RSS (headlines + links only), cached 30 minutes.
const COUNTRY = { CA: 'Canada', US: 'United States', GB: 'United Kingdom', AU: 'Australia', IN: 'India' };
export async function onRequestGet({ request }) {
  const p = new URL(request.url).searchParams;
  const scope = p.get('scope') || 'national', city = (p.get('city') || '').slice(0, 60), region = (p.get('region') || '').slice(0, 60);
  const cc = (p.get('country') || 'CA').toUpperCase(), country = COUNTRY[cc] || 'Canada';
  const q = {
    local: `"${city || region || country}" (real estate OR housing OR "home prices" OR rent OR condo OR development) when:7d`,
    national: `${country} (housing market OR mortgage rates OR home sales OR "interest rate") when:7d`,
    global: `("central bank" OR "Federal Reserve" OR "Bank of Canada" OR inflation OR "bond yields" OR "global housing") when:3d`
  }[scope] || '';
  const gl = scope === 'global' ? 'US' : (COUNTRY[cc] ? cc : 'CA');
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`;
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 EquityClimb' }, cf: { cacheTtl: 1800, cacheEverything: true } });
    if (!r.ok) throw new Error('feed ' + r.status);
    const items = parseRss(await r.text()).slice(0, 14);
    return new Response(JSON.stringify({ scope, items }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=1800' } });
  } catch (e) {
    return new Response(JSON.stringify({ scope, items: [], error: 'News feed unavailable right now' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
export function parseRss(xml) {
  const dec = s => (s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  const tag = (b, t) => dec((b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1]);
  const seen = new Set(), out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1], source = tag(b, 'source');
    let title = tag(b, 'title'); if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    const key = title.toLowerCase().slice(0, 60); if (seen.has(key)) continue; seen.add(key);
    out.push({ title, link: tag(b, 'link'), source, date: tag(b, 'pubDate') });
  }
  return out.sort((a, b) => new Date(b.date) - new Date(a.date));
}
