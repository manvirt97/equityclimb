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
export function summarize(ob, id) {
  // The Valet API normally sends newest observations first. Normalize ordering before calculating the last change.
  ob = [...ob].sort((a, b) => a.d.localeCompare(b.d));
  const last = ob[ob.length - 1], v = +last[id].v;
  let i = ob.length - 1;
  while (i > 0 && +ob[i - 1][id].v === v) i--;
  const out = { value: v, date: last.d, change: 0 };
  if (i > 0) { out.lastChange = ob[i].d; out.change = +(v - +ob[i - 1][id].v).toFixed(2); }
  else out.sameSince = ob[0].d;
  return out;
}
async function series(id, n, fresh) {
  // The Valet API rejects unsupported cache-buster parameters with HTTP 400.
  const url = `${VALET}${id}/json?recent=${n}`;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(url, fresh ? { headers: { 'cache-control': 'no-cache' }, signal: ac.signal } : { cf: { cacheTtl: 300, cacheEverything: true }, signal: ac.signal });
    if (!r.ok) throw new Error('Bank of Canada answered ' + r.status);
    const j = await r.json();
    const ob = (j.observations || []).filter(o => o[id] && o[id].v !== undefined && o[id].v !== '');
    if (!ob.length) throw new Error('no data for ' + id);
    return ob.sort((a, b) => a.d.localeCompare(b.d));
  } finally { clearTimeout(t); }
}

/* Banks set prime a fixed distance above the Bank's policy rate. We learn that distance from the data itself
   (the most common gap over the last year) instead of remembering a number, and flag it if the two ever drift apart. */
export function spreadInfo(pObs, pid, oObs, oid) {
  if (!pObs || !oObs || pObs.length < 4 || !oObs.length) return null;
  pObs = [...pObs].sort((a, b) => a.d.localeCompare(b.d));
  oObs = [...oObs].sort((a, b) => a.d.localeCompare(b.d));
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

/* Policy decisions are announced before the business-daily V39079 series reflects them.
   Trust ONLY the Bank's own dated press release. Never guess policy from prime. */
export function parsePolicyAnnouncement(html, date, link) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) ||
      !/^https:\/\/www\.bankofcanada\.ca\/\d{4}\/\d{2}\/fad-press-release-\d{4}-\d{2}-\d{2}\/?$/.test(String(link))) return null;
  const words = stripTags(html).replace(/\s+/g, ' ');
  // Only use the rate declared for the TARGET FOR THE OVERNIGHT RATE, not the Bank Rate or deposit rate.
  const m = words.match(/\b(?:increased|raised|reduced|lowered|cut|maintained|held|kept)\s+its\s+target\s+for\s+the\s+overnight\s+rate\b[\s\S]{0,160}?\b(?:to|at)\s+(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value < 0 || value > 30) return null;
  const effective = new Date(date + 'T12:00:00Z');
  effective.setUTCDate(effective.getUTCDate() + 1);
  return { value, date, announced: true, effectiveDate: effective.toISOString().slice(0, 10), sourceUrl: link };
}
export async function latestOfficialPolicy(announcements, observed, options={}) {
  const latest = (announcements || []).filter(a => a?.date && /\/fad-press-release-\d{4}-\d{2}-\d{2}\/?$/.test(a.link || ''))
    .sort((a,b)=>b.date.localeCompare(a.date))[0];
  if (!latest || (observed?.date && latest.date < observed.date)) return null;
  // A failed release read MUST NOT turn an old fixed value into a "live" new rate.
  const getter = options.getText || getText;
  const html = await getter(latest.link);
  const policy = parsePolicyAnnouncement(html, latest.date, latest.link);
  if (!policy || (observed?.date && policy.date < observed.date)) return null;
  return { ...policy, change: observed && Number.isFinite(observed.value) ?
    +(policy.value - observed.value).toFixed(2) : 0, observed: observed || null };
}

/* --------- Prime is set by LENDERS, not by the Bank of Canada ---------
   Valet V80691311 is a weekly retrospective statistical observation.
   On a BoC decision day, a lender's official announcement may be more current.
   These are verified lender-owned sources, not guessed policy-rate spreads. */
const PRIME_RELEASES = [
  { lender: 'RBC Royal Bank', date: '2026-10-28', url: 'https://www.rbc.com/newsroom/article.html?article=126172' },
  { lender: 'TD Canada Trust', date: '2026-10-28', url: 'https://td.mediaroom.com/2026-10-28-TD-Canada-Trust-announces-change-to-TD-Prime-Rate' }
];
const TD_POSTED_PRIME = 'https://www.td.com/ca/en/personal-banking/products/todays-rates-and-prime';
function calendarDate(y, m, d) {
  const mo=MONTHS[String(m).toLowerCase().slice(0,3)]||Object.entries(MONTHS).find(([name])=>name.startsWith(String(m).toLowerCase().slice(0,3)))?.[1];
  const day=Number(d),year=Number(y);
  if(!mo||year<2000||year>2100||day<1||day>31)return null;
  const date = new Date(Date.UTC(year,mo-1,day));
  return date.getUTCFullYear()===year && date.getUTCMonth()===mo-1 && date.getUTCDate()===day ? date.toISOString().slice(0,10) : null;
}
export function parsePrimeRelease(html, meta) {
  if (!PRIME_RELEASES.some(x => x.url === meta?.url && x.lender === meta?.lender && x.date === meta?.date)) return null;
  const words=stripTags(html);
  if(!/prime\s+(?:lending\s+)?rate/i.test(words))return null;
  const valueMatch=words.match(/\bprime\s+(?:lending\s+)?rate[\s\S]{0,135}?\bto\s+(\d{1,2}(?:\.\d{1,3})?)\s*(?:%|per\s+cent)(?=\W|$)/i);
  const effect=words.match(/\beffective\s+(?:on\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if(!valueMatch||!effect)return null;
  const value=Number(valueMatch[1]),effectiveDate=calendarDate(effect[3],effect[1],effect[2]);
  if(!effectiveDate||!Number.isFinite(value)||value<0||value>30||effectiveDate<meta.date)return null;
  return {value,date:meta.date,effectiveDate,sourceUrl:meta.url,lender:meta.lender,confirmed:true};
}
export function parseTdPostedPrime(html) {
  // Live TD prime table is a second source for any future rate changes.
  const words=stripTags(html);
  const r=words.match(/\bTD\s+Prime\s+Rate\s+(\d{1,2}(?:\.\d{1,3})?)\s*%\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember|t)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if(!r)return null;
  const value=Number(r[1]),date=calendarDate(r[4],r[2],r[3]);
  if(!date||!Number.isFinite(value)||value<0||value>30)return null;
  return {value,date,effectiveDate:date,sourceUrl:TD_POSTED_PRIME,lender:'TD Canada Trust',confirmed:true,posted:true};
}
export function resolvePrime(observed, confirmed, asOf) {
  if(!confirmed)return {prime:observed||null};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(confirmed.effectiveDate)||!Number.isFinite(confirmed.value))return {prime:observed||null};
  // More recently dated weekly observations take precedence over old official releases.
  if(observed?.date && observed.date>=confirmed.effectiveDate && observed.value===confirmed.value)
    return {prime:observed,primeAnnouncement:confirmed,primeObserved:observed};
  if(observed?.date && observed.date>confirmed.effectiveDate)
    return {prime:observed};
  const today=asOf || new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const nowEffective=today>=confirmed.effectiveDate;
  return {
    prime:nowEffective ? {...confirmed, date:confirmed.effectiveDate, change:observed&&Number.isFinite(observed.value)?+(confirmed.value-observed.value).toFixed(2):0,lastChange:confirmed.effectiveDate} : observed||null,
    primeObserved:observed||null,
    primeAnnouncement:confirmed,
    primePending:!nowEffective
  };
}
async function latestConfirmedPrime() {
  const work=[
    ...PRIME_RELEASES.map(async meta=>parsePrimeRelease(await getText(meta.url,6000),meta)),
    getText(TD_POSTED_PRIME,6000).then(parseTdPostedPrime)
  ];
  const settled=await Promise.allSettled(work);
  const rates=settled.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
  if(!rates.length)throw new Error('Lender announcements and posted prime are unavailable');
  // The official source with the latest effective date wins, not an assumed BoC spread.
  rates.sort((a,b)=>b.effectiveDate.localeCompare(a.effectiveDate)||Number(!!b.posted)-Number(!!a.posted));
  return rates[0];
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
  // A same-day official announcement outranks an older daily observation. Prime remains strictly observed.
  if (Array.isArray(out.announcements) && out.announcements.length) {
    try {
      const announced = await latestOfficialPolicy(out.announcements, out.policy);
      if (announced && (!out.policy || announced.date >= out.policy.date)) {
        out.policyObserved = out.policy || null;
        out.policyAnnouncement = announced;
        if (!out.policy || announced.date > out.policy.date || announced.value !== out.policy.value)
          out.policy = { ...announced, change: announced.change };
      }
    } catch (e) { errors.policyAnnouncement = String(e && e.message || e).slice(0, 120); }
  }
  // Confirm announced lender prime independently of the BoC's lagged weekly rate.
  try {
    const confirmed=await latestConfirmedPrime();
    const resolved=resolvePrime(out.prime||null,confirmed);
    if(resolved.prime)out.prime=resolved.prime;
    if(resolved.primeObserved)out.primeObserved=resolved.primeObserved;
    if(resolved.primeAnnouncement)out.primeAnnouncement=resolved.primeAnnouncement;
    if(typeof resolved.primePending==='boolean')out.primePending=resolved.primePending;
  } catch (e) { errors.lenderPrime=String(e&&e.message||e).slice(0,120); }
  if (Object.keys(errors).length) out.errors = errors;
  const ok = !!(out.prime || out.policy);
  return new Response(JSON.stringify(ok ? out : { error: 'The Bank of Canada could not be reached right now.', errors }), {
    status: ok ? 200 : 502,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
