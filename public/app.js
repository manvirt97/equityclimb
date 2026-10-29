/* EquityClimb — app logic. Everything the user types stays on their device (localStorage). */
'use strict';

/* ---------------------------------------------------------------- state */
const DEF = {
  profile: { name: '', city: '', region: '', country: 'CA', goal: 'own', onboarded: false },
  theme: 'light', shareCtx: false, rateMode: 'Live', adj: -0.5, priorities: ['Family', 'Value'], shortlist: [], chat: [],
  // Owner numbers (same keys as earlier versions so old backups still import)
  home: 550000, growth: 3, bal: 450000, rate: 4.0, rtype: 'Variable', pmt: 2400, origP: 470000,
  maturity: '2030-09-01', trigger: 6.0, renewRate: 4.25,
  income: 6500, otherInc: 0, rent: 1800, rentOn: 'No', vacancy: 4, suiteShare: 40,
  mtr: 30.5, retTax: 25, ret: 6, tfsa: 10000, rrsp: 5000, nonreg: 0, cash: 8000, tfsaRoom: 40000, rrspRoom: 15000,
  extra: 500, years: 25,
  spend: { Housing: 3000, Transportation: 650, Food: 750, Personal: 350, Health: 80, Debt: 0, Savings: 800, Other: 150 },
  goals: [{ n: 'Emergency fund', t: 20000, d: '2027-12-31', s: 8000, m: 500 }, { n: 'Vacation', t: 6000, d: '2027-06-01', s: 1500, m: 300 }],
  buy: { price: 600000, down: 60000, income: 140000, debts: 400, heat: 120, tax: 300, amort: 25 }
};
const merge = (a, b) => { for (const k in b) if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else if (b[k] !== undefined) a[k] = b[k]; return a; };
let S = merge(structuredClone(DEF), JSON.parse(localStorage.getItem('ho') || '{}'));
const save = () => localStorage.setItem('ho', JSON.stringify(S));
const cache = { get: (k, maxMin) => { try { const x = JSON.parse(localStorage.getItem('c_' + k)); return x && (Date.now() - x.t) / 6e4 < maxMin ? x.v : null; } catch { return null; } },
  set: (k, v) => localStorage.setItem('c_' + k, JSON.stringify({ t: Date.now(), v })) };

/* ---------------------------------------------------------------- helpers */
const $ = n => (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-CA');
const pct = (n, d = 1) => (+n).toFixed(d) + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = new Date();
const addM = n => { const d = new Date(today); d.setMonth(d.getMonth() + n); return d; };
const fmtD = d => d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
const ago = d => { const m = (Date.now() - new Date(d)) / 6e4; return m < 60 ? Math.max(1, Math.round(m)) + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
const area = () => [S.profile.city, S.profile.region].filter(Boolean).join(', ') || 'Canada';
const set = (path, v) => { const k = path.split('.'); let o = S; while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; save(); };
const api = async (p, opt) => { const r = await fetch(p, opt); const j = await r.json().catch(() => ({ error: 'Service unavailable' })); if (!r.ok && !j.error) j.error = 'Service unavailable'; return j; };

/* icons (line style) */
const I = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  market: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  map: '<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  plan: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  refresh: '<path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  logo: '<rect width="32" height="32" rx="8" fill="#0E1116" stroke="#262D38"/><path d="M8 22l6-6 4 3 6.5-9" fill="none" stroke="#C8A96A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 10h4v4" fill="none" stroke="#C8A96A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

/* ---------------------------------------------------------------- live rates */
let RATES = cache.get('rates', 24 * 60) || null;
async function loadRates(force) {
  if (RATES && !force && cache.get('rates', 60)) return applyRates();
  let j = await api('/api/rates').catch(() => ({ error: 1 }));
  if (j.error) { // fallback: call Bank of Canada directly from the browser
    try {
      const r = await fetch('https://www.bankofcanada.ca/valet/observations/V80691311,V39079/json?recent=10').then(r => r.json());
      const latest = id => {
        const rows = (r.observations || []).filter(o => o[id] && o[id].v !== '' && Number.isFinite(+o[id].v)).sort((a,b)=>a.d.localeCompare(b.d));
        if (!rows.length) return null;
        const last=rows[rows.length-1],first=rows[0];
        return { value:+last[id].v, date:last.d, change:+(+last[id].v - +first[id].v).toFixed(2) };
      };
      j = { source: 'Bank of Canada (direct fallback)', prime:latest('V80691311'), policy:latest('V39079') };
    } catch { j = null; }
  }
  if (j && j.prime) { RATES = j; cache.set('rates', j); }
  applyRates(); render();
}
function applyRates() {
  if (S.rateMode === 'Live' && S.rtype === 'Variable' && RATES?.prime) { const r = +(RATES.prime.value + +S.adj).toFixed(2); if (r !== S.rate) { S.rate = r; save(); } }
}
const prime = () => RATES?.prime?.value;

/* ---------------------------------------------------------------- finance engine (Canadian compounding) */
const per = (rate, type = S.rtype) => { const r = rate / 100; return type === 'Fixed' ? Math.pow(1 + r / 2, 1 / 6) - 1 : r / 12; };
function amort(bal, rate, pmt, extra = 0, lump = 0) {
  let b = bal, m = 0, int = 0; const path = [b], i = per(rate);
  while (b > 0.01 && m < 600) { const ii = b * i; int += ii; b = b + ii - pmt - extra - (m % 12 === 7 ? lump : 0); m++; if (m % 12 === 0) path.push(Math.max(b, 0)); }
  if (b > 0.01) return { months: Infinity, int, path };
  path.push(0); return { months: m, int, path };
}
const payment = (P, rate, years, type = 'Fixed') => { const i = per(rate, type), n = years * 12; return i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n; };
function unlock(extra = 0, growth = S.growth) {
  let b = S.bal, h = S.home; const i = per(S.rate);
  for (let m = 0; m < 480; m++) { if (b <= 0.8 * h) return m; b = b + b * i - S.pmt - extra; h *= Math.pow(1 + growth / 100, 1 / 12); }
  return null;
}
function rentNet() {
  const eff = S.rent * 12 * (1 - S.vacancy / 100), exp = 12000 * S.suiteShare / 100 + 1050, intr = S.bal * S.rate / 100 * S.suiteShare / 100;
  return (eff - exp - Math.max(eff - exp - intr, 0) * S.mtr / 100) / 12;
}
function compare() {
  const N = S.years * 12, X = +S.extra, i = per(S.rate), g = Math.pow(1 + S.ret / 100, 1 / 12) - 1, res = {};
  let b = S.bal, inv = 0;
  for (let m = 0; m < N; m++) { if (b > 0) { b = b + b * i - S.pmt - X; if (b < 0) { inv -= b; b = 0; } } else inv += S.pmt + X; inv *= 1 + g; }
  res.prepay = inv - b;
  const base = () => { let bb = S.bal, iv = 0; return { step() { if (bb > 0) { bb = bb + bb * i - S.pmt; if (bb < 0) { iv -= bb; bb = 0; } } else iv += S.pmt; iv *= 1 + g; }, get v() { return iv - bb; } }; };
  let B = base(), t = 0; for (let m = 0; m < N; m++) { B.step(); t = (t + X) * (1 + g); } res.tfsa = t + B.v;
  B = base(); let r = 0, tf = 0; for (let m = 0; m < N; m++) { B.step(); r = (r + X) * (1 + g); tf *= 1 + g; if (m % 12 === 3) tf += X * 12 * S.mtr / 100; } res.rrsp = r * (1 - S.retTax / 100) + tf + B.v;
  return res;
}
const income = () => S.income + S.otherInc + (S.rentOn === 'Yes' ? S.rent * (1 - S.vacancy / 100) : 0);
const spendTotal = () => Object.values(S.spend).reduce((a, b) => a + +b, 0);

/* ---------------------------------------------------------------- UI pieces */
const F = (path, label, hint = '', type = 'number') => {
  const v = path.split('.').reduce((o, k) => o[k], S);
  return `<label for="f_${path}">${label}</label><input id="f_${path}" type="${type}" step="any" value="${esc(v)}" onchange="set('${path}', this.type==='number' ? +this.value : this.value); applyRates(); later()">${hint ? `<div class="hint">${hint}</div>` : ''}`;
};
const Sel = (path, label, opts, hint = '') => {
  const v = path.split('.').reduce((o, k) => o[k], S);
  return `<label for="f_${path}">${label}</label><select id="f_${path}" onchange="set('${path}', /^\d+$/.test(this.value) ? +this.value : this.value); applyRates(); later()">${opts.map(o => `<option ${o == v ? 'selected' : ''}>${o}</option>`).join('')}</select>${hint ? `<div class="hint">${hint}</div>` : ''}`;
};
function chart(series, h = 230) {
  const w = 680, all = series.flatMap(s => s.d), mx = Math.max(...all, 1), n = Math.max(...series.map(s => s.d.length)) - 1 || 1;
  const X = k => 46 + k * (w - 56) / n, Y = v => h - 26 - (v / mx) * (h - 44);
  let g = ''; for (let k = 0; k <= 4; k++) { const v = mx * k / 4; g += `<line x1="46" x2="${w}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="${k ? '3 4' : ''}"/><text x="0" y="${Y(v) + 4}">${v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v / 1e3) + 'k'}</text>`; }
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%">${g}${series.map(s => `<polyline fill="none" stroke="${s.c}" stroke-width="2.2" stroke-linejoin="round" points="${s.d.map((v, k) => X(k) + ',' + Y(v)).join(' ')}"/>`).join('')}
  <text x="46" y="${h - 6}">Today</text><text x="${w - 50}" y="${h - 6}">Yr ${n}</text></svg>
  <div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>`;
}
const head = (eyebrow, title, lede = '') => `<div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : '<div class="sp"></div>'}`;
const loading = (n = 3) => Array.from({ length: n }, (_, k) => `<div class="skel" style="width:${90 - k * 12}%"></div>`).join('');
function rateStrip() {
  if (!RATES?.prime) return `<div class="note">Live rates couldn't load. Using your saved rate of <b>${pct(S.rate, 2)}</b>. <a href="#" onclick="loadRates(true);return false">Try again</a></div>`;
  const cell = (l, o, hint) => o ? `<div class="card flat kpi"><div class="l">${l}</div><div class="v">${pct(o.value, 2)}</div><div class="h">${o.change ? `<span class="delta ${o.change > 0 ? 'neg' : 'pos'}">${o.change > 0 ? '▲' : '▼'} ${Math.abs(o.change).toFixed(2)}</span> ` : '<span class="delta">no change</span> '}${hint}</div></div>` : '';
  return `<div class="grid g4">${cell('Prime rate', RATES.prime, 'variable rates follow this')}${cell('BoC policy rate', RATES.policy, 'sets prime')}${cell('5-yr bond yield', RATES.bond5, 'drives fixed rates')}${cell('5-yr posted rate', RATES.fiveYearPosted, 'big-bank posted')}</div>
  <div class="small mute" style="margin-top:8px"><span class="dot"></span>Live from the Bank of Canada · updated ${RATES.prime.date}</div>`;
}

/* ---------------------------------------------------------------- AI calls */
async function aiBrief(scope, force) {
  const key = 'brief_' + area() + S.profile.goal;
  let b = !force && cache.get(key, 360); if (b) return b;
  const heads = [...(NEWS.local || []), ...(NEWS.national || []), ...(NEWS.global || [])].slice(0, 18);
  const rates = RATES ? Object.fromEntries(['prime', 'policy', 'bond5', 'fiveYearPosted'].filter(k => RATES[k]).map(k => [k, RATES[k].value + '% (10-obs change ' + RATES[k].change + ')'])) : {};
  b = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'brief', area: area(), goal: GOALS[S.profile.goal].t, rates, headlines: heads }) }).catch(() => ({ error: 'AI unavailable' }));
  if (!b.error) cache.set(key, b); return b;
}
let NEWS = {};
async function loadNews(scope, force) {
  const k = 'news_' + scope + area(); const c = !force && cache.get(k, 30); if (c) return (NEWS[scope] = c);
  const q = new URLSearchParams({ scope, city: S.profile.city, region: S.profile.region, country: S.profile.country });
  const j = await api('/api/news?' + q).catch(() => ({ items: [], error: 1 }));
  if (j.items?.length) cache.set(k, j.items);
  return (NEWS[scope] = j.items || []);
}

/* ---------------------------------------------------------------- pages */
const GOALS = {
  own: { t: 'Owning & paying down my mortgage', d: 'Pay it off faster, plan renewals, grow equity' },
  buy: { t: 'Buying a home', d: 'See what I can afford and where to look' },
  invest: { t: 'Investing in property', d: 'Rental income, cash flow and leverage' },
  rent: { t: 'Renting for now', d: 'Save, budget and watch the market' }
};
const V = {};

V.overview = () => {
  const sp = spendTotal(), cf = income() - sp, eq = S.home - S.bal, nw = eq + S.tfsa + S.rrsp + S.nonreg + S.cash, a = amort(S.bal, S.rate, S.pmt), owner = S.profile.goal === 'own' || S.profile.goal === 'invest';
  const h = today.getHours(), hi = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const steps = [
    [cf >= 0, 'Positive monthly cash flow', cf >= 0 ? `${$(cf)} left each month.` : `Spending is ${$(-cf)} above income. Check your income and budget first.`, "go('plan','budget')"],
    [S.cash >= sp * 3, 'Three-month emergency fund', `${$(S.cash)} saved of ${$(sp * 3)}.`, "go('plan','goals')"],
    owner ? [S.trigger - S.rate > 1, 'Safe distance from trigger rate', `${(S.trigger - S.rate).toFixed(2)} points of headroom.`, "go('plan','mortgage')"] : [false, 'Know your buying power', 'Run the stress-test affordability check.', "go('plan','buy')"],
    [false, 'Choose your strategy', 'See which option grows your wealth most for your numbers.', "go('plan','strategy')"]
  ];
  setTimeout(fillOverview, 0);
  return `${head(today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }), `${hi}${S.profile.name ? ', ' + esc(S.profile.name) : ''}.`, `Your home, your money and your market. ${esc(area())}.`)}
  ${rateStrip()}<div class="sp"></div>
  <div class="grid g4">
    <div class="card kpi"><div class="l">Net worth</div><div class="v">${$(nw)}</div><div class="h">Home equity plus accounts</div></div>
    <div class="card kpi"><div class="l">Monthly cash flow</div><div class="v ${cf < 0 ? 'neg' : 'pos'}">${$(cf)}</div><div class="h">Income minus spending</div></div>
    ${owner ? `<div class="card kpi"><div class="l">Home equity</div><div class="v">${pct(eq / S.home * 100)}</div><div class="bar" style="margin-top:12px"><i style="width:${Math.min(eq / S.home / .2 * 100, 100)}%"></i></div><div class="h">Progress to 20%</div></div>
    <div class="card kpi"><div class="l">Mortgage-free</div><div class="v">${a.months === Infinity ? '—' : fmtD(addM(a.months))}</div><div class="h">At ${pct(S.rate, 2)} and today's payment</div></div>`
    : `<div class="card kpi"><div class="l">Savings</div><div class="v">${$(S.cash + S.tfsa + S.rrsp)}</div><div class="h">Cash, TFSA and RRSP</div></div><div class="card kpi"><div class="l">Est. buying power</div><div class="v">${$(afford().max)}</div><div class="h">After the stress test</div></div>`}
  </div><div class="sp"></div>
  <div class="grid g21">
    <div class="card"><div class="head"><div><h2>Today's market brief</h2><div class="small mute">AI summary of today's rates and headlines for ${esc(area())}</div></div><button class="btn ghost sm" onclick="fillOverview(true)">${ic('refresh')}Refresh</button></div><div id="ov-brief">${loading(4)}</div></div>
    <div class="card"><h2>Next steps</h2><div class="list">${steps.map((s, k) => `<div class="it" style="cursor:pointer" onclick="${s[3]}"><div class="num">${s[0] ? '✓' : k + 1}</div><div><h3>${s[1]}</h3><div class="small mute">${s[2]}</div></div></div>`).join('')}</div></div>
  </div><div class="sp"></div>
  <div class="card news"><div class="head"><h2>Local headlines</h2><a href="#" onclick="go('market');return false">All news →</a></div><div id="ov-news" class="list">${loading(3)}</div></div>`;
};
async function fillOverview(force) {
  const nb = document.getElementById('ov-news'); if (!nb) return;
  if (force) document.getElementById('ov-brief').innerHTML = loading(4);
  await Promise.all(['local', 'national', 'global'].map(s => loadNews(s, force)));
  if (document.getElementById('ov-news')) document.getElementById('ov-news').innerHTML = newsList((NEWS.local || []).slice(0, 4));
  const b = await aiBrief('all', force); const el = document.getElementById('ov-brief'); if (el) el.innerHTML = briefHtml(b, true);
}
const newsList = items => items.length ? items.map(n => `<div class="it"><div style="flex:1"><a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a><div class="meta">${esc(n.source)} · ${ago(n.date)}</div></div></div>`).join('')
  : `<div class="small mute" style="padding:12px 0">No headlines right now. The news feed works once the app is published (it doesn't run from a file on your computer).</div>`;
function briefHtml(b, compact) {
  if (!b || b.error) return `<div class="note">${esc(b?.error || 'The AI brief is unavailable.')} Live rates and news still work.</div>`;
  const arrow = d => d === 'up' ? '<span class="tag neg">▲ Up</span>' : d === 'down' ? '<span class="tag pos">▼ Down</span>' : '<span class="tag">● Steady</span>';
  return `<p style="margin:0 0 12px">${esc(b.summary)}</p>
  ${(b.signals || []).slice(0, compact ? 3 : 6).map(s => `<div class="row" style="justify-content:space-between;padding:8px 0;border-top:1px solid var(--line)"><div><b style="font-size:14px">${esc(s.label)}</b><div class="small mute">${esc(s.note)}</div></div>${arrow(s.direction)}</div>`).join('')}
  ${!compact && b.outlook ? `<div class="sp"></div><h3>Outlook <span class="tag warn">AI view · not a forecast</span></h3>${['rates', 'prices', 'rents'].map(k => b.outlook[k] ? `<div style="margin-top:8px"><span class="eyebrow">${k}</span><div class="small">${esc(b.outlook[k])}</div></div>` : '').join('')}` : ''}
  ${!compact && b.actions ? `<div class="sp"></div><h3>What you could do</h3><ol class="small" style="padding-left:18px;margin:8px 0 0">${b.actions.map(a => `<li style="margin:4px 0">${esc(a)}</li>`).join('')}</ol>` : ''}`;
}

let mScope = 'local', shock = 0.5;
V.market = () => {
  setTimeout(fillMarket, 0);
  const b = S.bal, p0 = prime(), r1 = S.rate + shock, i0 = b * per(S.rate), i1 = b * per(r1), pay1 = payment(b, r1, Math.max(amort(S.bal, S.rate, S.pmt).months / 12, 1), S.rtype);
  return `${head('Market', 'Rates, news and outlook', `What's moving rates and prices for ${esc(area())}, Canada and the world, and what it means for you.`)}
  ${rateStrip()}<div class="sp"></div>
  <div class="grid g21">
    <div class="card news"><div class="head"><div class="seg">${[['local', esc(S.profile.city || 'Local')], ['national', 'Canada'], ['global', 'Global']].map(([k, l]) => `<button class="${mScope === k ? 'on' : ''}" onclick="mScope='${k}';render()">${l}</button>`).join('')}</div><button class="btn ghost sm" onclick="fillMarket(true)">${ic('refresh')}Refresh</button></div><div id="mk-news" class="list">${loading(6)}</div></div>
    <div>
      <div class="card"><h2>What it means</h2><div class="small mute" style="margin-bottom:12px">AI reads today's rates and headlines</div><div id="mk-brief">${loading(5)}</div></div><div class="sp"></div>
      <div class="card"><h2>Rate impact</h2><div class="small mute">If prime changes, here's what happens to your mortgage</div>
        <label>Change in rates: <b>${shock > 0 ? '+' : ''}${shock.toFixed(2)} pts</b></label><input type="range" min="-1.5" max="2.5" step="0.25" value="${shock}" onchange="shock=+this.value;render()" style="padding:0">
        <table style="margin-top:10px"><tr><td>Your rate</td><td>${pct(S.rate, 2)} → <b>${pct(r1, 2)}</b></td></tr>
        <tr><td>Monthly interest</td><td>${$(i0)} → <b class="${i1 > i0 ? 'neg' : 'pos'}">${$(i1)}</b></td></tr>
        <tr><td>${S.rtype === 'Variable' ? 'Payment if re-amortized' : 'Payment at renewal'}</td><td>${$(S.pmt)} → <b>${$(pay1)}</b></td></tr>
        <tr><td>Trigger rate headroom</td><td class="${S.trigger - r1 < 0.5 ? 'neg' : ''}">${(S.trigger - r1).toFixed(2)} pts</td></tr></table>
        ${p0 ? `<div class="hint">Prime today: ${pct(p0, 2)}. Your rate = prime ${S.adj >= 0 ? '+' : '−'} ${Math.abs(S.adj).toFixed(2)}.</div>` : ''}</div>
    </div>
  </div><div class="sp"></div>
  ${homeScenarios()}
  <p class="foot">Headlines come from Google News and link to the original publishers. AI summaries can be wrong. Treat them as a starting point, not advice or a forecast.</p>`;
};
function homeScenarios() {
  const yrs = 10, mk = g => Array.from({ length: yrs + 1 }, (_, k) => S.home * Math.pow(1 + g / 100, k));
  const at = (g) => S.home * Math.pow(1 + g / 100, 5);
  return `<div class="card"><div class="head"><div><h2>Home value scenarios</h2><div class="small mute">Starting from ${$(S.home)}. Set your own growth rate under Plan → My numbers.</div></div></div>
  <div class="grid g3" style="margin-bottom:14px">${[['Cautious', -1, 'neg'], ['Your assumption', S.growth, 'acc'], ['Strong', S.growth + 2.5, 'pos']].map(([l, g, c]) => `<div class="kpi"><div class="l">${l} · ${pct(g)} / yr</div><div class="v ${c}" style="font-size:22px">${$(at(g))}</div><div class="h">in 5 years</div></div>`).join('')}</div>
  ${chart([{ n: 'Cautious', c: 'var(--neg)', d: mk(-1) }, { n: 'Your assumption', c: 'var(--accent)', d: mk(S.growth) }, { n: 'Strong', c: 'var(--pos)', d: mk(S.growth + 2.5) }], 200)}</div>`;
}
async function fillMarket(force) {
  if (!document.getElementById('mk-news')) return;
  if (force) document.getElementById('mk-brief').innerHTML = loading(5);
  await Promise.all(['local', 'national', 'global'].map(s => loadNews(s, force)));
  const n = document.getElementById('mk-news'); if (n) n.innerHTML = newsList(NEWS[mScope] || []);
  const b = await aiBrief('all', force); const el = document.getElementById('mk-brief'); if (el) el.innerHTML = briefHtml(b, false);
}

/* Neighbourhoods */
const PRI = ['Family', 'Commute', 'Walkability', 'Value', 'Nightlife'];
let AREAS = null, areaCity = '';
V.areas = () => {
  areaCity = areaCity || S.profile.city || '';
  const c = cache.get('areas_' + areaCity.toLowerCase(), 60 * 24 * 14); if (c && !AREAS) AREAS = c;
  return `${head('Neighbourhoods', 'Find the right area', 'Choose what matters to you and we\'ll rank neighbourhoods by fit. Save favourites and add your own notes.')}
  <div class="card"><div class="grid g3" style="align-items:end">
    <div><label>City</label><input id="ar-city" value="${esc(areaCity)}" placeholder="e.g. Calgary"></div>
    <div><label>Budget (optional)</label><input id="ar-budget" placeholder="e.g. $650k detached" value="${esc(S.areaBudget || '')}"></div>
    <div><button class="btn" style="width:100%;justify-content:center" onclick="genAreas()">${ic('ai')}Build my guide</button></div></div>
    <label>What matters most</label><div class="row">${PRI.map(p => `<button class="chip" style="${S.priorities.includes(p) ? 'border-color:var(--accent);color:var(--ink)' : ''}" onclick="togglePri('${p}')">${S.priorities.includes(p) ? '✓ ' : ''}${p}</button>`).join('')}</div>
  </div><div class="sp"></div>
  <div id="ar-out">${AREAS ? areasHtml(AREAS) : `<div class="note">Enter a city and select <b>Build my guide</b>. Guides are AI-generated from general knowledge and saved for two weeks.</div>`}</div>
  <div class="sp2"></div>${shortlistHtml()}`;
};
function togglePri(p) { S.priorities = S.priorities.includes(p) ? S.priorities.filter(x => x !== p) : [...S.priorities, p]; save(); render(); }
async function genAreas() {
  areaCity = document.getElementById('ar-city').value.trim(); S.areaBudget = document.getElementById('ar-budget').value.trim(); save();
  if (!areaCity) return;
  document.getElementById('ar-out').innerHTML = `<div class="card">${loading(6)}</div>`;
  const j = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'areas', area: areaCity, priorities: S.priorities.join(', '), budget: S.areaBudget }) }).catch(() => ({ error: 'AI unavailable' }));
  if (!j.error && j.neighbourhoods) { AREAS = j; cache.set('areas_' + areaCity.toLowerCase(), j); }
  document.getElementById('ar-out').innerHTML = j.error ? `<div class="note">${esc(j.error)}</div>` : areasHtml(AREAS);
}
const fit = n => { const p = S.priorities.length ? S.priorities : PRI; const s = p.reduce((a, k) => a + (+n.scores?.[k.toLowerCase()] || 0), 0); return Math.round(s / (p.length * 5) * 100); };
function areasHtml(A) {
  const list = [...(A.neighbourhoods || [])].sort((a, b) => fit(b) - fit(a));
  return `<div class="grid g2">${list.map(n => `<div class="card area"><div class="head" style="margin-bottom:6px"><div><h3>${esc(n.name)}</h3><div class="small mute">${esc(n.quadrant || '')} · ${esc(n.housing || '')}</div></div><div style="text-align:right"><div style="font-size:22px;font-weight:600" class="acc">${fit(n)}%</div><div class="small mute">match</div></div></div>
  <div class="small" style="margin:6px 0">${esc(n.vibe)}</div><div class="row small"><span class="tag acc">${esc(n.priceTier || '')}</span><span class="tag">Best for: ${esc(n.bestFor || '')}</span></div>
  ${PRI.map(k => { const v = +n.scores?.[k.toLowerCase()] || 0; return `<div class="sc"><span>${k}</span><div class="bar"><i style="width:${v * 20}%"></i></div><span>${v}</span></div>`; }).join('')}
  <div class="grid g2 small" style="margin-top:12px;gap:8px"><div>${(n.pros || []).map(x => `<div class="pos">+ <span style="color:var(--ink2)">${esc(x)}</span></div>`).join('')}</div><div>${(n.cons || []).map(x => `<div class="neg">− <span style="color:var(--ink2)">${esc(x)}</span></div>`).join('')}</div></div>
  <div class="row" style="margin-top:14px"><button class="btn ghost sm" onclick='addShort(${JSON.stringify(n.name).replace(/'/g, "&#39;")})'>${S.shortlist.some(s => s.name === n.name) ? '✓ Saved' : '+ Save'}</button><a class="small" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(n.name + ' ' + areaCity + ' homes for sale')}">See listings →</a></div></div>`).join('')}</div>
  <p class="foot">${esc(A.note || 'AI-generated guide. Verify prices, schools and commute times locally.')}</p>`;
}
function addShort(name) { if (!S.shortlist.some(s => s.name === name)) S.shortlist.push({ name, city: areaCity, price: '', note: '', score: 3 }); save(); render(); }
function shortlistHtml() {
  if (!S.shortlist.length) return '';
  return `<div class="card"><h2>Your shortlist</h2><div class="small mute">Add what you see on viewings: prices, notes and your own rating.</div>
  <table style="margin-top:8px"><tr><th>Neighbourhood</th><th>Price seen</th><th>Your rating</th><th style="text-align:left">Notes</th><th></th></tr>
  ${S.shortlist.map((s, k) => `<tr><td>${esc(s.name)}<div class="small mute">${esc(s.city)}</div></td><td><input value="${esc(s.price)}" placeholder="$" onchange="S.shortlist[${k}].price=this.value;save()"></td>
  <td><select style="width:80px" onchange="S.shortlist[${k}].score=+this.value;save()">${[1, 2, 3, 4, 5].map(v => `<option ${v == s.score ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
  <td style="text-align:left"><input style="width:100%;text-align:left" value="${esc(s.note)}" placeholder="Schools, noise, commute…" onchange="S.shortlist[${k}].note=this.value;save()"></td>
  <td><button class="btn ghost sm" onclick="S.shortlist.splice(${k},1);save();render()">Remove</button></td></tr>`).join('')}</table></div>`;
}

/* Plan */
let pTab = 'mortgage';
const PT = [['mortgage', 'Mortgage'], ['budget', 'Budget'], ['strategy', 'Strategy'], ['buy', 'Buying'], ['goals', 'Goals'], ['numbers', 'My numbers']];
V.plan = () => `${head('Plan', 'Your plan', 'Your own numbers. Change anything and everything updates.')}
  <div class="seg" style="margin-bottom:22px">${PT.map(([k, l]) => `<button class="${pTab === k ? 'on' : ''}" onclick="pTab='${k}';render()">${l}</button>`).join('')}</div>${P[pTab]()}`;
const P = {};
P.mortgage = () => {
  const base = amort(S.bal, S.rate, S.pmt), inc = Math.round(Math.min(S.pmt * 0.2, 500)), p1 = amort(S.bal, S.rate, S.pmt, inc), p2 = amort(S.bal, S.rate, S.pmt, 0, 5000), rs = amort(S.bal, S.rate + 2, S.pmt);
  const yrs = m => m === Infinity ? 'Never' : (m / 12).toFixed(1) + ' yrs', u = unlock();
  return `<div class="grid g4">
   <div class="card kpi"><div class="l">Balance</div><div class="v">${$(S.bal)}</div><div class="h">${S.rtype} · ${S.rateMode === 'Live' && S.rtype === 'Variable' ? '<span class="dot"></span>linked to prime' : 'manual rate'}</div></div>
   <div class="card kpi"><div class="l">Rate</div><div class="v">${pct(S.rate, 2)}</div><div class="h">Trigger ${pct(S.trigger, 2)} · ${(S.trigger - S.rate).toFixed(2)} pts headroom</div></div>
   <div class="card kpi"><div class="l">Interest still to pay</div><div class="v">${$(base.int)}</div><div class="h">At today's rate</div></div>
   <div class="card kpi"><div class="l">20% equity</div><div class="v">${u == null ? '—' : fmtD(addM(u))}</div><div class="h">Unlocks refinance and HELOC options</div></div></div><div class="sp"></div>
  <div class="card"><h2>Balance over time</h2><div class="sp"></div>${chart([{ n: 'Current plan', c: 'var(--mute)', d: base.path }, { n: `+${$(inc)}/mo`, c: 'var(--accent)', d: p1.path }, { n: '+$5,000 yearly lump sum', c: 'var(--pos)', d: p2.path }])}</div><div class="sp"></div>
  <div class="card"><table><tr><th>Scenario</th><th>Paid off in</th><th>Total interest</th><th>You save</th></tr>
   <tr><td>Today's payment</td><td>${yrs(base.months)}</td><td>${$(base.int)}</td><td class="mute">—</td></tr>
   <tr><td>Add ${$(inc)} a month</td><td>${yrs(p1.months)}</td><td>${$(p1.int)}</td><td class="pos">${$(base.int - p1.int)}</td></tr>
   <tr><td>$5,000 lump sum each year</td><td>${yrs(p2.months)}</td><td>${$(p2.int)}</td><td class="pos">${$(base.int - p2.int)}</td></tr>
   <tr><td>Stress test: rate +2 pts</td><td>${yrs(rs.months)}</td><td>${$(rs.int)}</td><td class="neg">${$(rs.int - base.int)} more</td></tr></table>
   <div class="hint">Most lenders allow yearly prepayments (often 10–20% of the original amount). Check your mortgage terms.</div></div>`;
};
P.budget = () => {
  const inc = income(), tot = spendTotal(), cf = inc - tot;
  return `${cf < 0 ? `<div class="note" style="margin-bottom:16px"><b>Spending is ${$(-cf)} above income.</b> Check that your take-home pay under My numbers is current and includes everyone in the household.</div>` : ''}
  <div class="grid g2"><div class="card"><h2>Monthly budget</h2><table><tr><th>Category</th><th>Monthly</th><th>% of income</th></tr>
  ${Object.keys(S.spend).map(k => `<tr><td>${k}</td><td><input type="number" value="${S.spend[k]}" onchange="S.spend['${k}']=+this.value;save();render()"></td><td class="mute">${pct(S.spend[k] / inc * 100)}</td></tr>`).join('')}
  <tr><td><b>Total</b></td><td><b>${$(tot)}</b></td><td></td></tr><tr><td><b>Left over</b></td><td class="${cf < 0 ? 'neg' : 'pos'}"><b>${$(cf)}</b></td><td></td></tr></table>
  <div class="row" style="margin-top:12px"><input id="newcat" placeholder="Add a category" style="flex:1"><button class="btn ghost sm" onclick="const v=document.getElementById('newcat').value.trim();if(v){S.spend[v]=0;save();render()}">Add</button></div></div>
  <div class="card"><h2>How you compare</h2><div class="small mute">Common guidelines, not rules</div>
  ${[['Housing', 35, false], ['Savings', 20, true], ['Transportation', 15, false]].map(([n, t, more]) => { const p = (S.spend[n] || 0) / inc * 100, ok = more ? p >= t : p <= t; return `<label>${n}: <b>${pct(p)}</b> <span class="mute">(${more ? 'aim for' : 'keep under'} ${t}%)</span></label><div class="bar"><i style="width:${Math.min(p / t * 100, 100)}%;background:var(--${ok ? 'pos' : 'warn'})"></i></div>`; }).join('')}
  ${S.profile.goal !== 'rent' ? `<div class="note" style="margin-top:20px">A rental suite at ${$(S.rent)}/mo could add about <b>${$(Math.max(rentNet(), 0))}/mo after tax</b>. Change the rent amount under My numbers.</div>` : ''}</div></div>`;
};
P.strategy = () => {
  const c = compare(), eqp = (S.home - S.bal) / S.home * 100, u = unlock(), rn = Math.max(rentNet(), 0), u2 = unlock(rn);
  const opts = [['RRSP first, refund into TFSA', c.rrsp, 'Medium', `Best when your tax rate now (${S.mtr}%) is higher than in retirement (${S.retTax}%). Reinvest every refund.`],
    ['TFSA first', c.tfsa, 'Medium', 'Tax-free growth that you can withdraw any time. Most flexible when big expenses are coming.'],
    ['Extra mortgage prepayments', c.prepay, 'Low', `A guaranteed ${pct(S.rate, 2)} return and faster equity.`]].sort((a, b) => b[1] - a[1]);
  return `${eqp < 20 ? `<div class="note" style="margin-bottom:16px"><b>Under 20% equity (${pct(eqp)}):</b> leveraged strategies like the Smith Manoeuvre need a readvanceable HELOC, which generally requires a refinance at 80% loan-to-value or less. Projected: <b>${u == null ? '—' : fmtD(addM(u))}</b>. Lining that up with your renewal (${fmtD(new Date(S.maturity))}) avoids penalties.</div>` : ''}
  <div class="card"><div class="grid g2"><div>${F('extra', 'Extra I can set aside each month')}</div><div>${F('years', 'Years to compare')}</div></div>
  <div class="list" style="margin-top:10px">${opts.map((o, k) => `<div class="it"><div class="num">${k + 1}</div><div style="flex:1"><h3>${o[0]} ${k === 0 ? '<span class="tag acc">Best for your numbers</span>' : ''}</h3><div class="small mute">${o[3]}</div></div><div style="text-align:right;min-width:150px"><div style="font-size:20px;font-weight:600">${$(o[1])}</div><div class="small mute">after-tax wealth · yr ${S.years}</div><span class="tag">${o[2]} risk</span></div></div>`).join('')}</div></div><div class="sp"></div>
  ${S.profile.goal !== 'rent' ? `<div class="card"><h2>Biggest booster: rental income to the mortgage</h2><div class="small mute" style="margin-top:6px">About ${$(rn)}/mo after tax from a suite would reach 20% equity ${u != null && u2 != null ? `<b>${u - u2} months sooner</b> (${fmtD(addM(u2))})` : 'sooner'}. It's shown separately because it adds new income.</div></div><div class="sp"></div>` : ''}
  <div class="grid g2"><div class="card"><h2>Also worth considering</h2><ul class="small" style="padding-left:18px;color:var(--ink2);line-height:1.8"><li>Accelerated bi-weekly payments</li><li>A separate credit line for rental expenses, with rent going to the mortgage (ask a CPA)</li><li>Spousal RRSP to split income later</li><li>FHSA, only if you're eligible as a first-time buyer</li></ul></div>
  <div class="card"><h2>Be careful with</h2><ul class="small" style="padding-left:18px;color:var(--ink2);line-height:1.8"><li>Unsecured loans to invest</li><li>Breaking your mortgage early (penalties and cash-back clawback)</li><li>Investing money you need within 2 years</li></ul></div></div>
  <p class="foot">Projection with an assumed ${S.ret}% yearly return, which isn't guaranteed. Not financial or tax advice.</p>`;
};
function afford() {
  const b = S.buy, qual = Math.max(5.25, (prime() ? prime() + 0.5 : S.rate) + 2), inc = b.income / 12;
  const maxP = Math.min(inc * 0.39 - b.heat - b.tax, inc * 0.44 - b.heat - b.tax - b.debts);
  const i = per(qual, 'Fixed'), n = b.amort * 12, loan = maxP * (1 - Math.pow(1 + i, -n)) / i;
  const minDown = p => p <= 500000 ? p * .05 : p <= 1500000 ? 25000 + (p - 500000) * .1 : p * .2;
  let max = 0; for (let p = 100000; p < 4e6; p += 5000) { const d = Math.min(b.down, p); if (d < minDown(p)) break; const L = p - d, prem = L / p > .8 ? L * cmhc(d / p) : 0; if (L + prem > loan) break; max = p; }
  return { qual, loan, max, maxP, minDown };
}
const cmhc = dp => dp >= .2 ? 0 : dp >= .15 ? .028 : dp >= .10 ? .031 : .04;
P.buy = () => {
  const b = S.buy, a = afford(), dp = b.down / b.price, L = b.price - b.down, prem = dp < .2 ? L * cmhc(dp) : 0, rate = prime() ? Math.max(prime() - 0.3, 3.5) : S.rate, pm = payment(L + prem, rate, b.amort), md = a.minDown(b.price);
  return `<div class="grid g2"><div class="card"><h2>Your situation</h2>
   ${F('buy.income', 'Household gross income / year')}${F('buy.down', 'Down payment saved')}${F('buy.debts', 'Other debt payments / month', 'Car, credit cards, loans')}
   <div class="grid g2" style="gap:12px"><div>${F('buy.tax', 'Property tax / month')}</div><div>${F('buy.heat', 'Heating / month')}</div></div>${Sel('buy.amort', 'Amortization (years)', [25, 30], '30 years is available to first-time buyers and on new builds')}</div>
  <div class="card"><h2>What you can afford</h2>
   <div class="kpi" style="margin-top:10px"><div class="l">Estimated maximum price</div><div class="v acc" style="font-size:34px">${$(a.max)}</div><div class="h">Qualifying at ${pct(a.qual, 2)} (stress test) · up to ${$(a.maxP)}/mo for the mortgage</div></div>
   <div class="sp"></div>${F('buy.price', 'Home I\'m looking at')}
   <table style="margin-top:8px"><tr><td>Minimum down payment</td><td class="${b.down < md ? 'neg' : ''}">${$(md)}</td></tr><tr><td>Your down payment</td><td>${pct(dp * 100)}</td></tr>
   <tr><td>Mortgage default insurance</td><td>${prem ? $(prem) + ` (${(cmhc(dp) * 100).toFixed(1)}%)` : 'Not needed'}</td></tr>
   <tr><td>Est. payment at ${pct(rate, 2)}</td><td><b>${$(pm)}/mo</b></td></tr><tr><td>Within budget?</td><td>${b.price <= a.max ? '<span class="tag pos">Yes</span>' : '<span class="tag neg">Over by ' + $(b.price - a.max) + '</span>'}</td></tr></table>
   <div class="hint">Uses Canadian rules: a stress test of the higher of 5.25% or your rate + 2%, debt limits of 39% (housing) and 44% (total), and tiered minimum down payments. Lenders vary, so get a pre-approval.</div></div></div>`;
};
P.goals = () => `<div class="card"><table><tr><th>Goal</th><th>Target</th><th>Saved</th><th>Monthly</th><th>Needed</th><th>Status</th><th></th></tr>
  ${S.goals.map((g, k) => { const ml = Math.max(1, Math.round((new Date(g.d) - today) / 2.63e9)), need = Math.max(g.t - g.s, 0) / ml, ok = g.m >= need;
    return `<tr><td><input style="width:170px;text-align:left" value="${esc(g.n)}" onchange="S.goals[${k}].n=this.value;save()"><div class="small mute" style="margin-top:4px"><input type="date" style="width:150px;padding:4px 6px;text-align:left" value="${g.d}" onchange="S.goals[${k}].d=this.value;save();render()"> · ${ml} mo</div><div class="bar" style="margin-top:6px"><i style="width:${Math.min(g.s / g.t * 100, 100)}%"></i></div></td>
    <td><input type="number" value="${g.t}" onchange="S.goals[${k}].t=+this.value;save();render()"></td><td><input type="number" value="${g.s}" onchange="S.goals[${k}].s=+this.value;save();render()"></td><td><input type="number" value="${g.m}" onchange="S.goals[${k}].m=+this.value;save();render()"></td>
    <td>${$(need)}</td><td>${ok ? '<span class="tag pos">On track</span>' : `<span class="tag neg">Short ${$(need - g.m)}/mo</span>`}</td><td><button class="btn ghost sm" onclick="S.goals.splice(${k},1);save();render()">×</button></td></tr>`; }).join('')}</table>
  <button class="btn ghost sm" style="margin-top:14px" onclick="S.goals.push({n:'New goal',t:10000,d:'${today.getFullYear() + 1}-12-31',s:0,m:0});save();render()">+ Add goal</button></div>
  <div class="note" style="margin-top:16px">Keep money you'll need within 2 years in a high-interest savings account or GICs, not in stocks.</div>`;
P.numbers = () => `<div class="note" style="margin-bottom:16px">Fill in what you know. The rest uses sensible defaults. Everything stays on this device.</div>
  <div class="grid g3"><div class="card"><h2>Home and mortgage</h2>${F('home', 'Home value')}${F('bal', 'Mortgage balance', 'From your latest statement')}${Sel('rtype', 'Rate type', ['Variable', 'Fixed'])}
  ${S.rtype === 'Variable' ? Sel('rateMode', 'Rate source', ['Live', 'Manual'], 'Live keeps your rate in step with prime') + (S.rateMode === 'Live' ? F('adj', 'Your rate vs prime (pts)', 'e.g. −0.64 if your rate is prime minus 0.64%') : F('rate', 'Mortgage rate (%)')) : F('rate', 'Mortgage rate (%)')}
  ${F('pmt', 'Monthly payment (principal + interest)')}${F('maturity', 'Term ends', '', 'date')}${F('trigger', 'Trigger rate (%)', 'Listed in your mortgage documents')}${F('origP', 'Original mortgage amount')}${F('growth', 'Expected home growth / yr (%)')}</div>
  <div class="card"><h2>Income and tax</h2>${F('income', 'Take-home pay / month', 'Include everyone in the household')}${F('otherInc', 'Other income / month')}${F('mtr', 'Marginal tax rate (%)')}${F('retTax', 'Expected tax rate in retirement (%)')}${F('rent', 'Suite or rental income / month')}${Sel('rentOn', 'Currently rented?', ['No', 'Yes'])}${F('suiteShare', 'Rental share of home (%)')}</div>
  <div class="card"><h2>Savings</h2>${F('cash', 'Cash / emergency fund')}${F('tfsa', 'TFSA')}${F('rrsp', 'RRSP')}${F('nonreg', 'Non-registered')}${F('tfsaRoom', 'Unused TFSA room', 'CRA My Account')}${F('rrspRoom', 'Unused RRSP room', 'Notice of Assessment')}${F('ret', 'Expected return / yr (%)')}</div></div>`;

/* Advisor */
const SUGG = ['Should I choose a fixed or variable rate at renewal?', 'How can I pay my mortgage off faster?', 'Is now a good time to buy in my city?', 'TFSA, RRSP or FHSA, where should my money go first?', 'What should I ask a mortgage broker?', 'Explain the Smith Manoeuvre simply'];
let busy = false;
V.advisor = () => {
  setTimeout(() => { const m = document.getElementById('msgs'); if (m) m.scrollTop = m.scrollHeight; }, 0);
  return `${head('Advisor', 'Ask anything', 'Plain-language guidance on mortgages, buying, investing and the market.')}
  <div class="card chat"><div class="msgs" id="msgs">${S.chat.length ? S.chat.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${fmtMsg(m.content)}</div>`).join('') :
    `<div class="small mute" style="margin-bottom:10px">Try one of these:</div><div class="row">${SUGG.map(s => `<button class="chip" onclick="ask(${JSON.stringify(s).replace(/"/g, '&quot;')})">${s}</button>`).join('')}</div>`}
    ${busy ? `<div class="msg a"><span class="skel" style="display:inline-block;width:120px;margin:0"></span></div>` : ''}</div>
   <div class="composer"><textarea id="q" rows="1" placeholder="Ask a question…" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ask()}"></textarea><button class="btn" ${busy ? 'disabled' : ''} onclick="ask()">${ic('send')}</button></div>
   <div class="row small mute" style="margin-top:10px;justify-content:space-between"><label style="margin:0;display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" style="width:auto" ${S.shareCtx ? 'checked' : ''} onchange="S.shareCtx=this.checked;save()"> Use my numbers for more personal answers</label>
   ${S.chat.length ? `<a href="#" onclick="S.chat=[];save();render();return false">New conversation</a>` : ''}</div></div>
  <p class="foot">General education only, not personal financial, tax or legal advice. The AI can make mistakes, so confirm important decisions with a licensed professional.</p>`;
};
const fmtMsg = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*(.+)$/gm, '<b>$1</b>');
async function ask(text) {
  const q = (text || document.getElementById('q')?.value || '').trim(); if (!q || busy) return;
  S.chat.push({ role: 'user', content: q }); busy = true; save(); render();
  const context = S.shareCtx ? { location: area(), goal: GOALS[S.profile.goal].t, homeValue: S.home, mortgageBalance: S.bal, rate: S.rate + '% ' + S.rtype, payment: S.pmt, termEnds: S.maturity, prime: prime(), monthlyIncome: income(), monthlySpending: spendTotal(), savings: { cash: S.cash, tfsa: S.tfsa, rrsp: S.rrsp }, marginalTax: S.mtr } : null;
  const j = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', messages: S.chat, context }) }).catch(() => ({ error: 'Network error' }));
  S.chat.push({ role: 'assistant', content: j.error ? '⚠ ' + j.error : j.text }); busy = false; save(); render();
}

/* Settings */
V.settings = () => `${head('Settings', 'Make it yours')}
  <div class="grid g2"><div class="card"><h2>Profile</h2>${F('profile.name', 'First name', '', 'text')}
   <div class="grid g2" style="gap:12px"><div>${F('profile.city', 'City', '', 'text')}</div><div>${F('profile.region', 'Province / state', '', 'text')}</div></div>
   <label>My situation</label><select onchange="set('profile.goal',this.value);render()">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}" ${S.profile.goal === k ? 'selected' : ''}>${g.t}</option>`).join('')}</select>
   <label>Appearance</label><div class="seg">${['dark', 'light'].map(t => `<button class="${S.theme === t ? 'on' : ''}" onclick="S.theme='${t}';save();theme();render()">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
  <div class="card"><h2>Your data</h2><p class="small mute">Everything is stored only on this device. Back it up to move it to another phone or computer.</p>
   <div class="row"><button class="btn" onclick="exportData()">Export backup</button><button class="btn ghost" onclick="document.getElementById('imp').click()">Import backup</button><input id="imp" type="file" hidden accept=".json" onchange="importData(this)"></div>
   <div class="sp2"></div><button class="btn ghost sm" onclick="if(confirm('Erase all your data on this device?')){localStorage.clear();location.reload()}">Erase everything</button>
   <div class="sp2"></div><h2>Live data</h2><p class="small mute">Rates: Bank of Canada · News: Google News · AI: Cloudflare Workers AI</p><button class="btn ghost sm" onclick="EC162.refreshAll()">Refresh all live data</button><div class="ec162-settings-status" id="ec162-refresh-status" aria-live="polite">News topics, rates and rules can be prepared for faster browsing.</div></div></div>`;
function exportData() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })); a.download = 'equityclimb-backup.json'; a.click(); }
function importData(el) { const r = new FileReader(); r.onload = () => { try { S = merge(structuredClone(DEF), JSON.parse(r.result)); S.profile.onboarded = true; save(); theme(); loadRates(true); go('overview'); } catch { alert('That file could not be read.'); } }; r.readAsText(el.files[0]); }

/* Onboarding */
let ob = 1;
V.onboard = () => {
  const dots = `<div class="dots">${[1, 2, 3].map(k => `<i class="${k <= ob ? 'on' : ''}"></i>`).join('')}</div>`;
  if (ob === 1) return `<div class="ob">${dots}<div style="margin-bottom:18px">${ic('logo').replace('viewBox="0 0 24 24"', 'viewBox="0 0 32 32" width="44" height="44"')}</div>${head('Welcome to EquityClimb', 'Your home and money, made simple.', 'Three quick questions and you\'re set. Your answers stay on this device.')}
    <div class="card">${F('profile.name', 'What should we call you?', '', 'text')}<div class="grid g2" style="gap:12px"><div>${F('profile.city', 'City', '', 'text')}</div><div>${F('profile.region', 'Province / state', '', 'text')}</div></div><div class="hint">We filled in your approximate location. Change it if it's wrong.</div>
    <div class="row" style="margin-top:20px;justify-content:space-between"><a href="#" onclick="document.getElementById('imp2').click();return false">I have a backup file</a><input id="imp2" type="file" hidden accept=".json" onchange="importData(this)"><button class="btn" onclick="ob=2;render()">Continue</button></div></div></div>`;
  if (ob === 2) return `<div class="ob">${dots}${head('Step 2 of 3', 'What best describes you?')}${Object.entries(GOALS).map(([k, g]) => `<button class="opt ${S.profile.goal === k ? 'on' : ''}" onclick="set('profile.goal','${k}');render()"><b>${g.t}</b><span>${g.d}</span></button>`).join('')}
    <div class="row" style="margin-top:16px;justify-content:space-between"><button class="btn ghost" onclick="ob=1;render()">Back</button><button class="btn" onclick="ob=3;render()">Continue</button></div></div>`;
  const g = S.profile.goal, own = g === 'own' || g === 'invest';
  return `<div class="ob">${dots}${head('Step 3 of 3', 'A few numbers', 'Rough figures are fine. You can change them any time under Plan.')}
    <div class="card">${own ? F('home', 'Home value (approx.)') + F('bal', 'Mortgage balance') + Sel('rtype', 'Rate type', ['Variable', 'Fixed']) + (S.rtype === 'Fixed' ? F('rate', 'Mortgage rate (%)') : F('adj', 'Your rate vs prime (pts)', 'e.g. −0.64 if prime minus 0.64%')) + F('pmt', 'Monthly payment (principal + interest)')
      : F('buy.income', 'Household gross income / year') + F('buy.down', 'Savings for a down payment') + F('buy.price', 'Price range you\'re considering')}
    ${F('income', 'Take-home pay / month (household)')}
    <div class="row" style="margin-top:20px;justify-content:space-between"><button class="btn ghost" onclick="ob=2;render()">Back</button><button class="btn" onclick="finishOb()">Open my dashboard</button></div></div></div>`;
};
function finishOb() { S.profile.onboarded = true; S.rateMode = S.rtype === 'Variable' ? 'Live' : 'Manual'; if (S.profile.goal === 'buy' || S.profile.goal === 'rent') pTab = 'buy'; save(); applyRates(); go('overview'); }

/* ---------------------------------------------------------------- shell */
const NAV = [['overview', 'Overview', 'home'], ['market', 'Market', 'market'], ['areas', 'Areas', 'map'], ['plan', 'Plan', 'plan'], ['advisor', 'Advisor', 'ai']];
let cur = 'overview';
function go(v, tab) { cur = v; if (tab) pTab = tab; history.replaceState(null, '', '#' + v); render(); scrollTo(0, 0); }
function render() {
  const view = S.profile.onboarded ? cur : 'onboard';
  const nav = NAV.map(([k, l, i]) => `<button class="nav ${k === view ? 'on' : ''}" onclick="go('${k}')">${ic(i)}<span>${l}</span></button>`).join('');
  document.getElementById('side').innerHTML = S.profile.onboarded ? `<div class="logo"><svg viewBox="0 0 32 32">${I.logo}</svg>EquityClimb</div>${nav}<div class="grow"></div>
    <button class="nav ${view === 'settings' ? 'on' : ''}" onclick="go('settings')">${ic('gear')}<span>Settings</span></button>
    <div class="ratechip">${RATES?.primeAnnouncement?.confirmed ? `<span class="dot"></span>Prime · ${esc(RATES.primeAnnouncement.effectiveDate)}<b>${pct(RATES.primeAnnouncement.value, 2)}</b>` : prime() ? `<span class="dot"></span>Prime rate<b>${pct(prime(), 2)}</b>` : '<span class="dot off"></span>Rates offline'}</div>` : '';
  document.getElementById('tabbar').innerHTML = S.profile.onboarded ? nav + `<button class="nav ${view === 'settings' ? 'on' : ''}" onclick="go('settings')">${ic('gear')}<span>More</span></button>` : '';
  const ae = document.activeElement, keep = ae && ae.id;
  document.getElementById('view').innerHTML = V[view]();
  if (keep && document.getElementById(keep)) document.getElementById(keep).focus();
}
let _t; const later = () => { clearTimeout(_t); _t = setTimeout(render, 0); };
function theme() { document.documentElement.dataset.theme = S.theme; document.querySelector('meta[name=theme-color]').content = S.theme === 'light' ? '#F6F5F1' : '#0E1116'; }

(async function init() {
  theme();
  const h = location.hash.slice(1); if (V[h] && h !== 'onboard') cur = h;
  if (!S.profile.city) { try { const g = await api('/api/geo'); if (g.city) { S.profile.city = g.city; S.profile.region = g.region; S.profile.country = g.country; save(); } } catch {} }
  applyRates(); render(); loadRates();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
})();
