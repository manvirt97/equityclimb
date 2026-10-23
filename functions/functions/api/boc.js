// GET /api/boc          -> LIVE Bank of Canada information, read from bankofcanada.ca every time (nothing typed in by hand):
//     prime, policy, bond5, fiveYearPosted, usdcad   (Valet API, the Bank's official data service)
//     spread         (is banks' prime in step with the Bank's policy rate? catches unscheduled moves)
//     announcements  (latest rate announcements from the Bank's own press releases)
//     schedule       (next scheduled announcement dates, read from the Bank's own schedule release)
// GET /api/boc?fresh=1  -> skips every cache
// Every part is fetched on its own, so one part failing never hides the others.
// Self-contained: does not import anything.

const BASE = 'https://www.bankofcanada.ca';
const VALET = BASE + '/valet/observations/';
const SERIES = {
  prime: ['V80691311', 60],             // Prime rate (published weekly)
  policy: ['V39079', 400],              // Bank of Canada policy (overnight) rate target
  bond5: ['BD.CDN.5YR.DQ.YLD', 40],     // Government of Canada 5-year bond yield
  fiveYearPosted: ['V80691335', 60],    // 5-year posted mortgage rate
  usdcad: ['FXUSDCAD', 15]              // US dollar in Canadian dollars
};
const FEEDS = [BASE + '/content_type/press-releases/feed/', BASE + '/press/press-releases/feed/'];
const LIST_PAGE = BASE + '/press/press-releases/';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; EquityClimb)', accept: 'application/rss+xml,application/xml,text/xml,text/html,application/json,*/*' };

/* ---------------- small helpers ---------------- */
async function getText(url, ms = 7000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers: UA, signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
}
const dec = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;|&#8217;/g, '\u2019').replace(/&nbsp;|&#160;/g, ' ').replace(/&#188;/g, '\u00BC').trim();
const stripTags = h => dec(String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const tag = (b, n) => { const m = b.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, 'i')); return m ? dec(m[1]) : ''; };
const iso = d => (isNaN(d) ? null : d.toISOString().slice(0, 10));
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

/* ---------------- Valet series ---------------- */
function summarize(ob, id) {
  const last = ob[ob.length - 1], v = +last[id].v;
  let i = ob.length - 1;
  while (i > 0 && +ob[i - 1][id].v === v) i--;
  const out = { value: v, date: last.d, change: 0 };
  if (i > 0) { out.lastChange = ob[i].d; out.change = +(v - +ob[i - 1][id].v).toFixed(2); }
  else out.sameSince = ob[0].d;
  return out;
}
async function series(id, n, fresh) {
  const url = `${VALET}${id}/json?recent=${n}` + (fresh ? `&_=${Date.now()}` : '');
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(url, fresh ? { headers: { 'cache-control': 'no-cache' }, signal: ac.signal } : { cf: { cacheTtl: 300, cacheEverything: true }, signal: ac.signal });
    if (!r.ok) throw new Error('Bank of Canada answered ' + r.status);
    const j = await r.json();
    const ob = (j.observations || []).filter(o => o[id] && o[id].v !== undefined && o[id].v !== '');
    if (!ob.length) throw new Error('no data for ' + id);
    return ob;
  } finally { clearTimeout(t); }
}

/* Banks set prime a fixed distance above the Bank's policy rate. We learn that distance from the data itself
   (the most common gap over the last year) instead of remembering a number, and flag it if the two ever drift apart. */
export function spreadInfo(pObs, pid, oObs, oid) {
  if (!pObs || !oObs || pObs.length < 4 || !oObs.length) return null;
  const pol = oObs.map(o => [o.d, +o[oid].v]);
  const valAt = d => { let v = null; for (const [dd, vv] of pol) { if (dd <= d) v = vv; else break; } return v; };
  const freq = {};
  pObs.forEach(o => { const v = valAt(o.d); if (v != null) { const k = (+o[pid].v - v).toFixed(2); freq[k] = (freq[k] || 0) + 1; } });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
  if (!top) return null;
  const typical = +top[0], lp = pObs[pObs.length - 1], lo = oObs[oObs.length - 1];
  const prime = +lp[pid].v, policy = +lo[oid].v, now = +(prime - policy).toFixed(2);
  return { typical, now, prime, policy, expectedPrime: +(policy + typical).toFixed(2), primeDate: lp.d, policyDate: lo.d, mismatch: Math.abs(now - typical) > 0.04 };
}

/* ---------------- the Bank's own announcements ---------------- */
export function parseFeed(xml) {
  const out = [], re = /<item>([\s\S]*?)<\/item>/g; let m;
  while ((m = re.exec(xml)) && out.length < 60) {
    const b = m[1], link = tag(b, 'link'), title = stripTags(tag(b, 'title'));
    if (title && /^https?:\/\//.test(link)) out.push({ title, link, date: iso(new Date(tag(b, 'pubDate'))) });
  }
  return out;
}
export function parseList(html) {            // fallback: read the Bank's press-release page
  const out = [], seen = new Set(), re = /<a\b[^>]*href="([^"]*\/\d{4}\/\d{2}\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html)) && out.length < 60) {
    let link = m[1]; if (link.startsWith('/')) link = BASE + link;
    if (seen.has(link)) continue; seen.add(link);
    const title = stripTags(m[2]), slug = link.match(/fad-press-release-(\d{4})-(\d{2})-(\d{2})/);
    out.push({ title: title || 'Policy interest rate announcement', link, date: slug ? `${slug[1]}-${slug[2]}-${slug[3]}` : null });
  }
  return out;
}
const isSchedule = x => /schedule\s+for\s+policy\s+interest\s+rate|schedule-policy-interest-rate/i.test(x.title + ' ' + x.link);
const isRateRelease = x => !isSchedule(x) && (/policy\s+rate|overnight\s+rate|policy\s+interest\s+rate/i.test(x.title) || /fad-press-release-/.test(x.link));

/* "Wednesday, January 27 ..." lists inside the Bank's schedule release -> ISO dates */
export function parseSchedule(text, titleYear) {
  const t = stripTags(text), dates = new Set();
  const dayRe = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+)\s+(\d{1,2})/g;
  const take = (block, year) => {
    let m; dayRe.lastIndex = 0;
    while ((m = dayRe.exec(block))) { const mo = MONTHS[m[1].toLowerCase()], d = +m[2]; if (mo && d >= 1 && d <= 31 && year) dates.add(`${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`); }
  };
  const b1 = t.match(/interest rate announcements for (\d{4}) are as follows:?\s*(.*?)\s*(?:The scheduled dates for the interest rate announcements from|All interest rate announcements will take place)/i);
  if (b1) take(b1[2], +b1[1]);
  const b2 = t.match(/interest rate announcements from [A-Za-z]+ (\d{4}) through [A-Za-z]+ (\d{4}) (?:are|is) reconfirmed as follows:?\s*(.*?)\s*All interest rate announcements will take place/i);
  if (b2) take(b2[3], +b2[2]);
  return [...dates].sort();
}

async function loadAnnouncements() {
  let items = [], lastErr = null;
  for (const u of FEEDS) { try { items = parseFeed(await getText(u)); if (items.length) break; } catch (e) { lastErr = e; } }
  if (!items.length) { try { items = parseList(await getText(LIST_PAGE)); } catch (e) { lastErr = e; } }
  if (!items.length) throw lastErr || new Error('no announcements found');
  const ann = items.filter(isRateRelease).filter(x => x.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const sched = items.filter(isSchedule).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
  return { ann, sched };
}
async function loadSchedule(sched) {
  const html = await getText(sched.link), dates = parseSchedule(html);
  if (dates.length < 3) throw new Error('schedule not readable');
  return { dates, published: sched.date || null, link: sched.link, title: sched.title };
}

/* ---------------- handler ---------------- */
export async function onRequestGet({ request }) {
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  const keys = Object.keys(SERIES), errors = {};
  const [vals, annRes] = await Promise.all([
    Promise.allSettled(keys.map(k => series(SERIES[k][0], SERIES[k][1], fresh))),
    Promise.allSettled([loadAnnouncements()])
  ]);
  const out = { source: 'bankofcanada.ca (Valet API + press releases)', fetched: new Date().toISOString() }, raw = {};
  keys.forEach((k, i) => {
    if (vals[i].status === 'fulfilled') { raw[k] = vals[i].value; out[k] = summarize(vals[i].value, SERIES[k][0]); }
    else errors[k] = String(vals[i].reason && vals[i].reason.message || vals[i].reason).slice(0, 120);
  });
  if (raw.prime && raw.policy) out.spread = spreadInfo(raw.prime, SERIES.prime[0], raw.policy, SERIES.policy[0]);
  const a = annRes[0];
  if (a.status === 'fulfilled') {
    out.announcements = a.value.ann;
    if (a.value.sched) { try { out.schedule = await loadSchedule(a.value.sched); } catch (e) { errors.schedule = String(e && e.message || e).slice(0, 120); } }
    else errors.schedule = 'schedule release not found in the Bank\u2019s recent releases';
  } else errors.announcements = String(a.reason && a.reason.message || a.reason).slice(0, 120);
  if (Object.keys(errors).length) out.errors = errors;
  const ok = !!out.prime;
  return new Response(JSON.stringify(ok ? out : { error: 'The Bank of Canada could not be reached right now.', errors }), {
    status: ok ? 200 : 502,
    headers: { 'content-type': 'application/json', 'cache-control': fresh ? 'no-store' : 'public, max-age=120' }
  });
}
