// EquityClimb — free market prices (TSX, S&P 500, oil, gold). No API key needed.
// Runs on Cloudflare (server side), so the browser never hits blocked cross-site requests.
const SYMBOLS = [
  { k: 'tsx', n: 'TSX', y: '^GSPTSE', s: '^tsx' },
  { k: 'sp500', n: 'S&P 500', y: '^GSPC', s: '^spx' },
  { k: 'oil', n: 'Oil (WTI)', y: 'CL=F', s: 'cl.f' },
  { k: 'gold', n: 'Gold', y: 'GC=F', s: 'gc.f' }
];
const UA = { 'user-agent': 'Mozilla/5.0 (EquityClimb)', accept: 'application/json,text/csv,*/*' };

async function yahoo(sym) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`, { headers: UA });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = await r.json(), res = j.chart?.result?.[0], m = res?.meta;
  if (!m || m.regularMarketPrice == null) throw new Error('yahoo empty');
  const prev = m.chartPreviousClose ?? m.previousClose;
  return { value: m.regularMarketPrice, prev, time: (m.regularMarketTime || 0) * 1000 };
}
async function stooq(sym) {
  const r = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcp&h&e=csv`, { headers: UA });
  if (!r.ok) throw new Error('stooq ' + r.status);
  const [, row] = (await r.text()).trim().split('\n'); const c = (row || '').split(',');
  const close = +c[6], prev = +c[7];
  if (!isFinite(close) || !close) throw new Error('stooq empty');
  return { value: close, prev: isFinite(prev) && prev ? prev : null, time: Date.parse(c[1] + 'T' + (c[2] || '16:00:00') + 'Z') || Date.now() };
}

export async function onRequestGet(ctx) {
  const cacheKey = new Request('https://equityclimb.cache/quotes-v1');
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  const items = await Promise.all(SYMBOLS.map(async x => {
    let q = null;
    try { q = await yahoo(x.y); } catch (_) { try { q = await stooq(x.s); } catch (_) {} }
    if (!q) return null;
    const chg = q.prev ? (q.value - q.prev) / q.prev * 100 : null;
    return { key: x.k, name: x.n, value: +q.value.toFixed(2), changePct: chg == null ? null : +chg.toFixed(2), time: q.time };
  }));
  const body = { items: items.filter(Boolean), fetched: Date.now(), note: 'Prices may be delayed 15+ minutes.' };
  const resp = new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=900' } });
  if (body.items.length) ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
