// GET /api/rates  -> live Bank of Canada data (official Valet API), fresh observations
const SERIES = {
  V80691311: 'prime',          // Prime rate (major chartered banks)
  V39079: 'policy',            // BoC target overnight rate
  V80691335: 'fiveYearPosted', // Conventional 5-year posted mortgage rate
  'BD.CDN.5YR.DQ.YLD': 'bond5' // GoC 5-year bond yield (drives fixed rates)
};
export async function onRequestGet({ request } = {}) {
  const url = `https://www.bankofcanada.ca/valet/observations/${Object.keys(SERIES).join(',')}/json?recent=100`;
  const fresh = request ? new URL(request.url).searchParams.get('fresh') === '1' : false;
  try {
    const r = await fetch(url + (fresh ? `&_=${Date.now()}` : ''), { cache: 'no-store' });
    if (!r.ok) throw new Error('BoC ' + r.status);
    const j = await r.json();
    const out = { source: 'Bank of Canada Valet API', fetched: new Date().toISOString() };
    for (const [id, key] of Object.entries(SERIES)) {
      const obs = (j.observations || []).filter(o => o[id] && o[id].v !== '' && Number.isFinite(+o[id].v)).sort((a,b) => a.d.localeCompare(b.d));
      if (!obs.length) continue;
      const last = obs[obs.length - 1], first = obs[0];
      let prior = obs.length - 2;
      while (prior >= 0 && +obs[prior][id].v === +last[id].v) prior--;
      out[key] = { value: +last[id].v, date: last.d, change: prior >= 0 ? +(+last[id].v - +obs[prior][id].v).toFixed(2) : 0,
        lastChange: prior >= 0 ? last.d : null, sameSince: prior < 0 ? first.d : undefined };
    }
    if (!out.policy && !out.prime) throw new Error('No supported rate observations');
    return json(out, 0);
  } catch (e) { return json({ error: 'Live rates unavailable right now', detail: String(e) }, 0, 502); }
}
const json = (d, ttl, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
