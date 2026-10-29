// EquityClimb - market prices + symbol search. Free, no API key.
//   GET /api/quotes                         -> TSX, S&P 500, oil, gold
//   GET /api/quotes?symbols=RY.TO,AAPL      -> any list (max 20)
//   GET /api/quotes?symbols=...&fresh=1     -> skip the 60-second shared cache (used by the Refresh button)
//   GET /api/quotes?q=royal bank            -> symbol search for the "add to watchlist" box
const DEFAULTS = ['^GSPTSE', '^GSPC', 'CL=F', 'GC=F'];
const NAMES = { '^GSPTSE': 'TSX Composite', '^GSPC': 'S&P 500', 'CL=F': 'Oil (WTI)', 'GC=F': 'Gold' };
const STOOQ = { '^GSPTSE': '^tsx', '^GSPC': '^spx', 'CL=F': 'cl.f', 'GC=F': 'gc.f' };
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; EquityClimb)', accept: 'application/json,text/csv,*/*' };
const SYM = /^[A-Za-z0-9.^=\-]{1,18}$/;

async function yahoo(sym) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d&includePrePost=false`, { headers: UA });
  if (!r.ok) throw new Error('yahoo ' + r.status);
  const j = await r.json(), res = j.chart && j.chart.result && j.chart.result[0], m = res && res.meta;
  if (!m || m.regularMarketPrice == null) throw new Error('no data');
  const price = +m.regularMarketPrice;
  const closes = ((res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || []).filter(x => x != null);
  // Daily change = today's price vs the previous session's close.
  // (meta.chartPreviousClose is the close BEFORE the 5-day window, so it is NOT yesterday.)
  let prev = null;
  if (closes.length >= 2) {
    const last = closes[closes.length - 1];
    prev = Math.abs(last - price) / Math.max(Math.abs(price), 1e-9) < 0.002 ? closes[closes.length - 2] : last;
  } else if (m.previousClose != null) prev = +m.previousClose;
  const p = m.currentTradingPeriod && m.currentTradingPeriod.regular, t = Date.now() / 1000;
  const open = m.instrumentType === 'CRYPTOCURRENCY' ? true : p ? t >= p.start && t <= p.end : false;
  return { symbol: sym, name: NAMES[sym] || m.shortName || m.longName || sym, value: price, prev, currency: m.currency || '', exchange: m.exchangeName || '', open, time: m.regularMarketTime ? m.regularMarketTime * 1000 : null, provider: 'Yahoo Finance' };
}
async function stooq(sym) {
  const s = STOOQ[sym] || (/^[A-Z]{1,5}$/.test(sym) ? sym.toLowerCase() + '.us' : null);
  if (!s) throw new Error('no fallback');
  const r = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(s)}&f=sd2t2ohlcp&h&e=csv`, { headers: UA });
  if (!r.ok) throw new Error('stooq ' + r.status);
  const row = (await r.text()).trim().split('\n')[1] || '', c = row.split(',');
  const close = +c[6], prev = +c[7];
  if (!isFinite(close) || !close) throw new Error('stooq empty');
  return { symbol: sym, name: NAMES[sym] || sym, value: close, prev: isFinite(prev) && prev ? prev : null, currency: '', exchange: '', open: false, // A missing vendor timestamp is unknown, NOT evidence of a live trade.
    time: Number.isFinite(Date.parse(c[1] + 'T' + (c[2] || '16:00:00') + 'Z')) ? Date.parse(c[1] + 'T' + (c[2] || '16:00:00') + 'Z') : null, provider: 'Stooq (fallback)' };
}
async function search(q) {
  const r = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0&listsCount=0`, { headers: UA });
  if (!r.ok) throw new Error('search ' + r.status);
  const j = await r.json(), ok = ['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND', 'CURRENCY', 'CRYPTOCURRENCY', 'FUTURE'];
  return (j.quotes || []).filter(x => x.symbol && SYM.test(x.symbol) && ok.includes(x.quoteType))
    .slice(0, 8).map(x => ({ symbol: x.symbol, name: x.shortname || x.longname || x.symbol, exchange: x.exchDisp || x.exchange || '', type: x.quoteType }));
}
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestGet(ctx) {
  const u = new URL(ctx.request.url), cache = caches.default, fresh = u.searchParams.get('fresh') === '1';
  // ----- symbol search -----
  if (u.searchParams.has('q')) {
    const q = (u.searchParams.get('q') || '').trim().slice(0, 40);
    if (q.length < 1) return json({ results: [] });
    const key = new Request('https://equityclimb.internal/quotes-search/' + encodeURIComponent(q.toLowerCase()));
    if (!fresh) { const hit = await cache.match(key); if (hit) return hit; }
    try {
      const body = JSON.stringify({ results: await search(q) });
      ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } })));
      return new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    } catch (e) { return json({ results: [], error: 'Search is not available right now. You can still type a symbol such as RY.TO or AAPL.' }); }
  }
  // ----- quotes -----
  let symbols = (u.searchParams.get('symbols') || '').split(',').map(s => s.trim()).filter(s => SYM.test(s));
  symbols = [...new Set(symbols.length ? symbols : DEFAULTS)].slice(0, 20);
  const key = new Request('https://equityclimb.internal/quotes-v2/' + encodeURIComponent(symbols.join(',')));
  if (!fresh) { const hit = await cache.match(key); if (hit) return hit; }
  const got = await Promise.all(symbols.map(async s => { try { return await yahoo(s); } catch (_) { try { return await stooq(s); } catch (_) { return null; } } }));
  const items = got.filter(Boolean).map(q => {
    const change = q.prev ? q.value - q.prev : null;
    return { symbol: q.symbol, name: q.name, value: +q.value.toFixed(q.value < 10 ? 4 : 2), change: change == null ? null : +change.toFixed(4), changePct: change == null ? null : +(change / q.prev * 100).toFixed(2), currency: q.currency, exchange: q.exchange, open: q.open, time: q.time, provider: q.provider,
      timestampVerified: Number.isFinite(q.time) && q.time > 0 && q.time <= Date.now() + 5*60*1000,
      delayed: !Number.isFinite(q.time) || q.time <= 0 || Date.now()-q.time > 15*60*1000 };
  });
  const body = JSON.stringify({ items, missing: symbols.filter(s => !items.some(i => i.symbol === s)), fetched: Date.now(), note: 'Quotes may be delayed. Verify per-symbol as-of timestamps and exchange currencies; not an execution feed.' });
  if (items.length) ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' } })));
  return new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
