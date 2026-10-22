/* EquityClimb Homes API: licensed Repliers inventory only. No scraping, no fabricated listings.
   Set secret REPLIERS_API_KEY and env.HOMES_PUBLIC_ENABLED="on" AFTER confirming written display rights.
   GET /api/homes?city=Calgary&type=sale&minPrice=...&maxPrice=...&beds=...&page=1
*/
const json = (data, status = 200, maxAge = 0) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8',
    'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store', 'x-content-type-options': 'nosniff' }
});
const clean = (v, max = 70) => String(v || '').replace(/[^\p{L}\p{N} .,'-]/gu, '').trim().slice(0, max);
const numeric = (v, low, high) => v == null || v === '' ? null : Math.min(high, Math.max(low, +v || 0));
const safeExternal = s => { try { const u = new URL(String(s || '')); return u.protocol === 'https:' ? u.toString() : ''; } catch { return ''; } };
const pickNum = (...xs) => { for (const x of xs) if (x !== '' && x != null && Number.isFinite(+x)) return +x; return null; };
export function normalizeListing(x) {
  const a = x.address || {}, d = x.details || {}, m = x.map || {}, b = x.brokerage || {};
  const images = Array.isArray(x.images) ? x.images.slice(0, 6).map(path => {
    const p = String(path || '');
    if (p.startsWith('https://cdn.repliers.io/')) return p;
    if (p && !p.includes('..') && /^[\w\-/\.]+\.(?:jpe?g|png|webp)$/i.test(p)) return 'https://cdn.repliers.io/' + p.replace(/^\/+/, '');
    return '';
  }).filter(Boolean) : [];
  const street = [a.streetNumber, a.streetName, a.streetSuffix, a.streetDirection].filter(Boolean).join(' ');
  const permittedAddress = String(x.displayAddressOnInternet || '').toUpperCase() !== 'N';
  const agent = (Array.isArray(x.agents) ? x.agents : []).map(z => [z.name || [z.firstName, z.lastName].filter(Boolean).join(' '), z.title].filter(Boolean).join(', ')).filter(Boolean).slice(0, 3);
  return {
    id: String(x.mlsNumber || x.id || '').slice(0, 80), price: pickNum(x.listPrice, x.price),
    city: clean(a.city, 80), area: clean(a.neighborhood || a.area || '', 100),
    address: permittedAddress ? clean(street || a.fullAddress || '', 160) : 'Address withheld by listing agent',
    beds: pickNum(d.numBedrooms, d.bedrooms, x.bedrooms), baths: pickNum(d.numBathrooms, d.bathrooms, x.bathrooms),
    type: clean(d.propertyType || d.style || x.class || 'Home', 100),
    sqft: pickNum(d.sqft, d.squareFeet, d.size),
    lat: Number.isFinite(+m.lat) && +m.lat >= -90 && +m.lat <= 90 && permittedAddress ? +m.lat : null,
    lng: Number.isFinite(+m.long) && +m.long >= -180 && +m.long <= 180 && permittedAddress ? +m.long : null,
    images, brokerage: clean(b.name || x.brokerageName || x.office?.name || '', 150),
    agents: agent, listedDate: String(x.listDate || x.listedOn || x.timestamps?.listingUpdated || '').slice(0, 32),
    sourceUrl: safeExternal(x.listingUrl || x.url || ''), source: 'Repliers (licensed MLS feed)',
    // No assumed licence to republish remarks, sale histories, or details beyond the approved fields.
  };
}
export async function onRequestGet({ request, env }) {
  const configured = !!env.REPLIERS_API_KEY && String(env.HOMES_PUBLIC_ENABLED || '').toLowerCase() === 'on';
  const q = new URL(request.url).searchParams;
  if (q.get('mode') === 'status') return json({ enabled: configured, provider: configured ? 'Repliers' : null,
    reason: configured ? null : 'Live listing data requires an approved licensed feed. You can still search external portals and compare homes you add yourself.' });
  if (!configured) return json({ enabled: false, items: [], total: null, page: 1, pages: 0,
    message: 'Live MLS inventory is not connected. No properties have been fabricated.' });
  const city = clean(q.get('city'), 60);
  if (city.length < 2) return json({ error: 'Choose a city first.' }, 400);
  const type = q.get('type') === 'lease' ? 'lease' : 'sale';
  const page = Math.floor(numeric(q.get('page'), 1, 100) || 1);
  const max = numeric(q.get('maxPrice'), 0, 20000000);
  const min = numeric(q.get('minPrice'), 0, 20000000);
  if (max !== null && min !== null && max < min) return json({ error: 'Maximum price must exceed minimum price.' }, 400);
  const beds = Math.floor(numeric(q.get('beds'), 0, 12) || 0);
  const params = new URLSearchParams({ city, status: 'A', type, pageNum: String(page), resultsPerPage: '18',
    displayInternetEntireListing: 'Y', displayPublic: 'Y' });
  if (beds) params.set('minBedrooms', String(beds));
  if (max !== null && max) params.set('maxPrice', String(max));
  if (min !== null && min) params.set('minPrice', String(min));
  const property = q.get('property');
  if (property === 'condo') params.set('class', 'condo');
  if (property === 'house') params.set('class', 'residential');
  const upstream = 'https://api.repliers.io/listings?' + params.toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const r = await fetch(upstream, { headers: { 'REPLIERS-API-KEY': env.REPLIERS_API_KEY, accept: 'application/json' }, signal: controller.signal });
    if (!r.ok) return json({ error: r.status === 401 || r.status === 403 ? 'Licensed listing feed is not authorized.' : 'Property feed unavailable. Please retry.', items: [] }, 502);
    const response = await r.json();
    const items = (Array.isArray(response.listings) ? response.listings : []).filter(x => x && x.mlsNumber && String(x.displayInternetEntireListing || 'Y').toUpperCase() !== 'N' && String(x.displayPublic || 'Y').toUpperCase() !== 'N')
      .map(normalizeListing).filter(x => x.id && x.price !== null);
    return json({ enabled: true, provider: 'Repliers', items, page: pickNum(response.page) || page,
      pages: pickNum(response.numPages) || 1, total: pickNum(response.count),
      fetchedAt: new Date().toISOString(), note: 'Active listings supplied by a licensed source; information can change. Confirm details with the listing brokerage.' }, 200, 60);
  } catch (_) { return json({ error: 'Could not reach the authorized property feed.', items: [] }, 502); }
  finally { clearTimeout(timeout); }
}
