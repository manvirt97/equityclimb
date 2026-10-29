// EquityClimb News v8 - never-empty market intelligence.
// GET /api/news?scope=local|province|national|global|all&category=...&city=&region=&country=
// GET /api/news?mode=deals&region=Alberta    -> Deal Tracker (who is buying whom)
// Sources: Google News search (targeted per category + place), press-release wires (GlobeNewswire, Newswire.ca,
// Business Wire), BOE Report, Financial Post, CBC, GDELT, plus an optional personal Currents key.
// If a place has nothing new for a topic, we widen automatically: city -> province -> Canada -> global, and say so.

const CATS = {
  all: { q: 'economy OR housing OR "interest rates" OR acquisition OR investment OR business', kw: ['business', 'economy', 'housing', 'acquisition', 'invest', 'rates', 'market', 'earnings', 'policy', 'deal'], days: 7 },
  realestate: { q: '"real estate" OR housing OR "home prices" OR "home sales" OR rent OR rental OR mortgage OR condo OR "housing starts" OR zoning', kw: ['real estate', 'housing', 'home', 'rent', 'mortgage', 'condo', 'zoning', 'property', 'construction', 'development', 'vacancy', 'realtor'], days: 14 },
  corpdev: { q: 'acquisition OR acquire OR acquires OR merger OR takeover OR "to buy" OR "agreement to sell" OR divestiture OR "asset sale" OR "joint venture" OR "strategic review"', kw: ['acqui', 'merger', 'takeover', 'to buy', 'buys', 'sell', 'sale of', 'divest', 'joint venture', 'deal', 'arrangement', 'bid', 'stake', 'strategic review'], days: 30 },
  capital: { q: 'earnings OR "quarterly results" OR "financial results" OR dividend OR buyback OR "bought deal" OR "credit rating" OR guidance OR IPO OR "investor day" OR "share offering"', kw: ['earnings', 'results', 'quarter', 'dividend', 'buyback', 'repurchase', 'offering', 'financing', 'rating', 'guidance', 'ipo', 'investor', 'profit', 'revenue', 'shares'], days: 30 },
  opportunities: { q: 'contract OR tender OR RFP OR grant OR funding OR "new project" OR expansion OR "major project" OR "investment in" OR "jobs" OR "opens" OR "startup"', kw: ['contract', 'tender', 'rfp', 'procurement', 'grant', 'funding', 'project', 'expansion', 'invest', 'jobs', 'opens', 'launch', 'startup', 'program', 'build'], days: 30 },
  finance: { q: '"interest rate" OR inflation OR "Bank of Canada" OR "bond yields" OR GDP OR jobs OR unemployment OR loonie OR "oil prices" OR recession', kw: ['interest', 'rate', 'inflation', 'bank of canada', 'bond', 'gdp', 'jobs', 'unemployment', 'loonie', 'dollar', 'oil', 'economy', 'recession', 'cpi'], days: 7 },
  government: { q: 'budget OR tax OR regulation OR policy OR tariff OR legislation OR CMHC OR OSFI OR "government funding"', kw: ['budget', 'tax', 'regulat', 'policy', 'tariff', 'legislat', 'cmhc', 'osfi', 'government', 'minister', 'premier', 'council', 'bill'], days: 14 }
};
const NEAR = { calgary: ['Calgary', 'Airdrie', 'Cochrane', 'Okotoks', 'Chestermere'], edmonton: ['Edmonton', 'St. Albert', 'Sherwood Park', 'Leduc', 'Spruce Grove'], vancouver: ['Vancouver', 'Burnaby', 'Richmond', 'Surrey'], toronto: ['Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan'], ottawa: ['Ottawa', 'Gatineau', 'Kanata'], montreal: ['Montreal', 'Laval', 'Longueuil'], winnipeg: ['Winnipeg'], halifax: ['Halifax', 'Dartmouth'], victoria: ['Victoria', 'Saanich', 'Langford'], regina: ['Regina'], saskatoon: ['Saskatoon'], hamilton: ['Hamilton', 'Burlington'], kelowna: ['Kelowna', 'West Kelowna'] };
const CBC = { calgary: 'calgary', edmonton: 'edmonton', vancouver: 'britishcolumbia', victoria: 'britishcolumbia', toronto: 'toronto', ottawa: 'ottawa', montreal: 'montreal', winnipeg: 'manitoba', halifax: 'novascotia', regina: 'saskatchewan', saskatoon: 'saskatoon', kelowna: 'britishcolumbia' };
const WIRES = '(site:globenewswire.com OR site:newswire.ca OR site:businesswire.com OR site:prnewswire.com)';
const ORDER = ['local', 'province', 'national', 'global'];

export async function onRequestGet(ctx) {
  const p = new URL(ctx.request.url).searchParams;
  const city = clean(p.get('city') || 'Calgary'), region = clean(p.get('region') || 'Alberta'), country = clean(p.get('country') || 'CA', 3).toUpperCase();
  const fresh = p.get('fresh') === '1', key = (ctx.request.headers.get('X-Currents-Key') || '').trim() || (ctx.env?.CURRENTS_API_KEY || '').trim();
  if (p.get('mode') === 'deals') return deals(ctx, region, fresh);
  const scope = pick(p.get('scope'), ['all', ...ORDER], 'local'), category = pick(p.get('category'), Object.keys(CATS), 'all');
  const cacheKey = `https://equityclimb.internal/news/v8/${scope}/${category}/${city}/${region}/${country}/${key ? 'k' : 'nk'}`;
  if (!fresh) { const hit = await cacheGet(cacheKey); if (hit) return out({ ...hit, cached: true }); }

  const status = [], widened = [];
  let items = await gather({ scope, category, city, region, country, key, status });
  // Widen automatically so a topic is never empty.
  if (items.length < 6 && scope !== 'all' && scope !== 'global') {
    for (const s of ORDER.slice(ORDER.indexOf(scope) + 1)) {
      const more = await gather({ scope: s, category, city, region, country, key: '', status });
      const add = more.filter(m => !items.some(i => same(i, m))).map(m => ({ ...m, widenedFrom: scope, scope: s }));
      if (add.length) { widened.push(s); items = items.concat(add); }
      if (items.length >= 8) break;
    }
  }
  const label = { local: city, province: region, national: 'Canada', global: 'the world' };
  const result = {
    scope, category, items: items.slice(0, 24), fetched: new Date().toISOString(), sourceStatus: status, widened,
    message: widened.length ? `Not much new for this topic in ${label[scope]} lately, so we also included ${widened.map(w => label[w]).join(' and ')}.` : '',
    provider: key ? 'Personal Currents + public sources' : 'Free public sources'
  };
  await cachePut(cacheKey, result, 600);
  return out(result);
}

async function gather({ scope, category, city, region, country, key, status }) {
  const C = CATS[category], k = city.toLowerCase().replace(/[^a-z]/g, ''), near = NEAR[k] || [city];
  const when = `when:${C.days}d`;
  const geo = scope === 'local' ? `(${near.map(x => `"${x}"`).join(' OR ')})` : scope === 'province' ? `"${region}"` : scope === 'national' || scope === 'all' ? (country === 'CA' ? 'Canada' : country) : '';
  const jobs = [];
  const gn = (q, name, intl) => jobs.push({ name, f: () => google(q, intl), targeted: true });
  gn(`${geo ? geo + ' ' : ''}(${C.q}) ${when}`, 'Google News', scope === 'global');
  if (['corpdev', 'capital', 'opportunities', 'all'].includes(category)) gn(`${geo && scope !== 'global' ? geo + ' ' : ''}(${C.q}) ${WIRES} ${when}`, 'Press-release wires');
  // Topic-specific public feeds (filtered by keywords)
  const feeds = [];
  if (scope === 'local' && CBC[k]) feeds.push({ name: `CBC ${city}`, url: `https://www.cbc.ca/webfeed/rss/rss-canada-${CBC[k]}` });
  if (scope !== 'global') feeds.push({ name: 'CBC Business', url: 'https://www.cbc.ca/webfeed/rss/rss-business' });
  if (['corpdev', 'capital', 'all', 'finance', 'opportunities'].includes(category) && scope !== 'global') feeds.push({ name: 'Financial Post', url: 'https://financialpost.com/feed' });
  if (/alberta|saskatchewan|british columbia/i.test(region) && scope !== 'global' && ['corpdev', 'capital', 'opportunities', 'all', 'finance'].includes(category)) feeds.push({ name: 'BOE Report', url: 'https://boereport.com/feed/' });
  if (scope === 'global') feeds.push({ name: 'CBC World', url: 'https://www.cbc.ca/webfeed/rss/rss-world' });
  feeds.forEach(s => jobs.push({ name: s.name, f: () => rss(s.url, s.name), targeted: false }));
  if (key) jobs.push({ name: 'Currents', f: () => currents(`${geo ? geo + ' AND ' : ''}(${C.kw.slice(0, 8).join(' OR ')})`, key), targeted: true });
  jobs.push({ name: 'GDELT', f: () => gdelt(`${geo ? geo + ' ' : ''}(${C.kw.slice(0, 6).map(x => x.includes(' ') ? `"${x}"` : x).join(' OR ')}) sourcecountry:${scope === 'global' ? 'US' : 'CA'}`), targeted: true });

  const res = await Promise.allSettled(jobs.map(j => j.f()));
  let all = [];
  res.forEach((r, i) => {
    if (r.status === 'fulfilled') { all.push(...r.value.map(x => ({ ...x, targeted: jobs[i].targeted }))); status.push({ source: jobs[i].name, scope, ok: true, count: r.value.length }); }
    else status.push({ source: jobs[i].name, scope, ok: false, error: String(r.reason).slice(0, 90) });
  });
  return rank(all, category, scope);
}

function rank(items, c, scope) {
  const C = CATS[c], maxAge = C.days * 24, seen = new Set();
  return items.map(x => {
    const h = `${x.title} ${x.description || ''}`.toLowerCase(), m = C.kw.filter(y => h.includes(y)).length;
    const age = Math.max(0, (Date.now() - new Date(x.date)) / 36e5);
    return { ...x, category: c, scope, m, age, s: (x.targeted ? 30 : 0) + m * 12 - (c !== 'all' && m === 0 ? 25 : 0) + Math.max(0, 40 - age / 6) };
  }).filter(x => (x.targeted || c === 'all' || x.m > 0) && (isNaN(x.age) || x.age <= maxAge + 24))
    .sort((a, b) => b.s - a.s)
    .filter(x => { const k = norm(x.title); if (!k || seen.has(k)) return false; seen.add(k); return true; })
    .map(({ m, s, age, targeted, description, ...x }) => ({ ...x, summary: (description || '').slice(0, 220) }));
}

/* ---------------- Deal Tracker ---------------- */
const DEAL_RE = /\b(acquir|acquisition|merger|merge|takeover|to buy|buys|bought|to sell|sells|sale of|divest|arrangement agreement|purchase agreement|joint venture|bid for|offer for)/i;
async function deals(ctx, region, fresh) {
  const cacheKey = `https://equityclimb.internal/deals/v8/${region}`;
  if (!fresh) { const hit = await cacheGet(cacheKey); if (hit) return out({ ...hit, cached: true }); }
  const q = 'acquisition OR acquire OR acquires OR merger OR takeover OR "to buy" OR "agreement to sell" OR "arrangement agreement"';
  const runs = await Promise.allSettled([
    google(`Canada (${q}) when:30d`), google(`"${region}" (${q}) when:30d`),
    google(`(${q}) (site:globenewswire.com OR site:newswire.ca) Canada when:30d`), rss('https://boereport.com/feed/', 'BOE Report'), rss('https://financialpost.com/feed', 'Financial Post')
  ]);
  const seen = new Set();
  let list = runs.flatMap(r => r.status === 'fulfilled' ? r.value : []).filter(x => DEAL_RE.test(x.title))
    .filter(x => (Date.now() - new Date(x.date)) / 864e5 <= 31)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(x => { const k = norm(x.title).slice(0, 50); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 14);
  let enriched = list.map(x => ({ ...x, ...heuristic(x.title) }));
  if (ctx.env?.AI && list.length) {
    try {
      const prompt = `Headlines:\n${list.map((x, i) => `${i}. ${x.title}`).join('\n')}\n\nFor each headline that is about a company acquisition, merger, asset sale or takeover, return JSON {"deals":[{"i":number,"buyer":"","target":"","value":"","status":"Announced|Approved|Completed|Proposed","plain":""}]}. Use ONLY facts in the headline; leave value "" if no amount is stated. "plain" is one short sentence a beginner understands about what is happening. Skip headlines that are not deals.`;
      const r = await ctx.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8-fast', { messages: [{ role: 'system', content: 'You extract facts from news headlines. Respond with one valid JSON object only.' }, { role: 'user', content: prompt }], max_tokens: 1400, temperature: 0.1, response_format: { type: 'json_object' } });
      const raw = typeof r.response === 'object' ? r.response : JSON.parse(String(r.response).slice(String(r.response).indexOf('{'), String(r.response).lastIndexOf('}') + 1));
      const map = new Map((raw.deals || []).map(d => [+d.i, d]));
      enriched = enriched.map((x, i) => map.has(i) ? { ...x, ...clip(map.get(i)), ai: true } : null).filter(Boolean);
    } catch {}
  }
  const result = { deals: enriched.slice(0, 10), fetched: new Date().toISOString(), region };
  await cachePut(cacheKey, result, 6 * 3600);
  return out(result);
}
function clip(d) { const s = v => String(v || '').slice(0, 140); return { buyer: s(d.buyer), target: s(d.target), value: s(d.value), status: ['Announced', 'Approved', 'Completed', 'Proposed'].includes(d.status) ? d.status : 'Announced', plain: s(d.plain) }; }
function heuristic(t) {
  const v = t.match(/(?:C?\$|US\$)\s?[\d.,]+\s?(?:billion|million|bn|B|M)\b/i);
  const status = /complet|closes|closed|finaliz/i.test(t) ? 'Completed' : /approv|clears/i.test(t) ? 'Approved' : /consider|explor|talks|weigh|could|bid/i.test(t) ? 'Proposed' : 'Announced';
  return { value: v ? v[0] : '', status, buyer: '', target: '', plain: '' };
}

/* ---------------- sources ---------------- */
async function google(q, intl) {
  const u = new URL('https://news.google.com/rss/search');
  u.searchParams.set('q', q); u.searchParams.set('hl', intl ? 'en-US' : 'en-CA'); u.searchParams.set('gl', intl ? 'US' : 'CA'); u.searchParams.set('ceid', intl ? 'US:en' : 'CA:en');
  const items = await rss(u.toString(), 'Google News');
  return items.map(x => { const m = x.title.match(/^(.*)\s+-\s+([^-]{2,60})$/); return m ? { ...x, title: m[1], source: x.sourceName || m[2] } : x; });
}
async function rss(url, fallback) {
  const r = await timed(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EquityClimb/8.0)', Accept: 'application/rss+xml, application/xml, text/xml, */*' } }, 6000);
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map(m => m[1]).map(b => {
    const src = b.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    return { title: strip(val(b, 'title')), link: link(b), source: src ? strip(src[1]) : fallback, sourceName: src ? strip(src[1]) : '', date: val(b, 'pubDate') || val(b, 'published') || val(b, 'updated') || null, description: strip(val(b, 'description') || val(b, 'summary')), provider: fallback };
  }).filter(valid).map(({ sourceName, ...x }) => ({ ...x, sourceName }));
}
async function currents(q, key) {
  const end = new Date(), start = new Date(end - 14 * 864e5), u = new URL('https://api.currentsapi.services/v1/search');
  u.searchParams.set('query', q); u.searchParams.set('language', 'en'); u.searchParams.set('start_date', start.toISOString()); u.searchParams.set('end_date', end.toISOString()); u.searchParams.set('page_size', '20');
  const r = await timed(u, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } }, 6000);
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  const j = await r.json();
  return (j.news || []).map(x => ({ title: x.title || '', link: x.url || '', source: host(x.url) || 'Currents', date: x.published || null, description: x.description || '', provider: 'Currents' })).filter(valid);
}
async function gdelt(q) {
  const u = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  u.searchParams.set('query', q); u.searchParams.set('mode', 'ArtList'); u.searchParams.set('maxrecords', '50'); u.searchParams.set('format', 'json'); u.searchParams.set('sort', 'DateDesc'); u.searchParams.set('timespan', '14d');
  const r = await timed(u, {}, 5000);
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  const j = await r.json();
  return (j.articles || []).filter(x => (x.language || 'English') === 'English').map(x => ({ title: x.title || '', link: x.url || '', source: x.domain || 'GDELT', date: gd(x.seendate), description: '', provider: 'GDELT' })).filter(valid);
}

/* ---------------- helpers ---------------- */
async function timed(url, opt, ms) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { return await fetch(url, { ...opt, signal: c.signal }); } finally { clearTimeout(t); } }
async function cacheGet(k) { try { const r = await caches.default.match(k); return r ? await r.json() : null; } catch { return null; } }
async function cachePut(k, d, ttl) { try { await caches.default.put(k, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` } })); } catch {} }
function gd(s) { const m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null; }
function val(b, t) { return dec(b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`, 'i'))?.[1] || '').trim(); }
function link(b) { const t = val(b, 'link'); return /^https?:\/\//i.test(t) ? t : dec(b.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || '').trim(); }
function strip(s) { return dec(dec(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function dec(s) { return String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&#8220;|&#8221;/g, '"').replace(/&#8211;|&#8212;/g, '-'); }
function valid(x) { const t=Date.parse(x?.date); return x.title && x.title.length > 12 && /^https?:\/\//i.test(x.link) && Number.isFinite(t) && t <= Date.now()+30*60*1000; }
function host(s) { try { return new URL(s).hostname.replace(/^www\./, ''); } catch { return ''; } }
function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 70); }
function same(a, b) { return norm(a.title) === norm(b.title); }
function clean(s, n = 60) { return String(s || '').replace(/[<>"]/g, '').trim().slice(0, n); }
function pick(v, a, d) { return a.includes(v) ? v : d; }
function out(x, s = 200) { return new Response(JSON.stringify(x), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=0, no-store', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'X-Currents-Key' } }); }
