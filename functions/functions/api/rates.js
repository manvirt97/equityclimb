// GET /api/rates  -> live Bank of Canada data (official Valet API), cached 1 hour
const SERIES = {
  V80691311: 'prime',          // Prime rate (major chartered banks)
  V39079: 'policy',            // BoC target overnight rate
  V80691335: 'fiveYearPosted', // Conventional 5-year posted mortgage rate
  'BD.CDN.5YR.DQ.YLD': 'bond5' // GoC 5-year bond yield (drives fixed rates)
};
export async function onRequestGet() {
  const url = `https://www.bankofcanada.ca/valet/observations/${Object.keys(SERIES).join(',')}/json?recent=10`;
  try {
    const r = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!r.ok) throw new Error('BoC ' + r.status);
    const j = await r.json();
    const out = { source: 'Bank of Canada Valet API', fetched: new Date().toISOString() };
    for (const [id, key] of Object.entries(SERIES)) {
      const obs = (j.observations || []).filter(o => o[id] && o[id].v !== '');
      if (!obs.length) continue;
      const last = obs[obs.length - 1], first = obs[0];
      out[key] = { value: +last[id].v, date: last.d, change: +(+last[id].v - +first[id].v).toFixed(2), since: first.d };
    }
    return json(out, 3600);
  } catch (e) { return json({ error: 'Live rates unavailable right now', detail: String(e) }, 60, 502); }
}
const json = (d, ttl, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` } });
