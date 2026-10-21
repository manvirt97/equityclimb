// GET /api/boc            -> latest Bank of Canada rates (prime, policy, 5-yr bond, 5-yr posted, USD/CAD)
// GET /api/boc?fresh=1    -> always asks the Bank of Canada again (used by the Refresh buttons)
// Each series is requested on its own, so one slow or empty series can never hide another.
// Self-contained: does not import anything.
const SERIES = {
  prime: ['V80691311', 60],             // Prime rate (published weekly)
  policy: ['V39079', 400],              // Bank of Canada policy (overnight) rate
  bond5: ['BD.CDN.5YR.DQ.YLD', 40],     // Government of Canada 5-year bond yield
  fiveYearPosted: ['V80691335', 60],    // 5-year posted mortgage rate
  usdcad: ['FXUSDCAD', 15]              // US dollar in Canadian dollars
};

async function one(id, n, fresh) {
  const url = `https://www.bankofcanada.ca/valet/observations/${id}/json?recent=${n}` + (fresh ? `&_=${Date.now()}` : '');
  const r = await fetch(url, fresh ? { headers: { 'cache-control': 'no-cache' } } : { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error('Bank of Canada answered ' + r.status);
  const j = await r.json();
  const ob = (j.observations || []).filter(o => o[id] && o[id].v !== undefined && o[id].v !== '');
  if (!ob.length) throw new Error('no data for ' + id);
  const last = ob[ob.length - 1], base = ob[Math.max(0, ob.length - 10)], v = +last[id].v;
  let i = ob.length - 1;
  while (i > 0 && +ob[i - 1][id].v === v) i--;
  const out = { value: v, date: last.d, change: +(v - +base[id].v).toFixed(2) };
  if (i > 0) out.lastChange = ob[i].d;       // the first reading at today's value
  else out.sameSince = ob[0].d;              // unchanged for the whole period we looked at
  return out;
}

export async function onRequestGet({ request }) {
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  const keys = Object.keys(SERIES);
  const res = await Promise.allSettled(keys.map(k => one(SERIES[k][0], SERIES[k][1], fresh)));
  const out = { source: 'Bank of Canada Valet API', fetched: new Date().toISOString() }, errors = {};
  keys.forEach((k, i) => { if (res[i].status === 'fulfilled') out[k] = res[i].value; else errors[k] = String(res[i].reason && res[i].reason.message || res[i].reason).slice(0, 120); });
  const ok = !!out.prime;
  if (Object.keys(errors).length) out.errors = errors;
  return new Response(JSON.stringify(ok ? out : { error: 'The Bank of Canada could not be reached right now.', errors }), {
    status: ok ? 200 : 502,
    headers: { 'content-type': 'application/json', 'cache-control': fresh ? 'no-store' : 'public, max-age=120' }
  });
}
