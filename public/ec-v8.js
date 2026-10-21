/* EquityClimb v8 — "Best of every app" upgrade.
   Add-on module: loads AFTER all other scripts and only ADDS features.
   1. Home Equity Command Centre  2. Animated numbers  3. Net Worth Centre  4. What-if simulator
   5. Next Best Actions  6. Property check  7. Neighbourhood scorecard  8. Ask AI on every page
   9. Smart alerts  10. Market snapshot  11. FIX: Bank of Canada rates re-checked on every open
*/
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof V === 'undefined') { console.warn('EC8: app.js not loaded'); return; }

  const ensure = () => {
    if (!Array.isArray(S.xAssets)) S.xAssets = [];
    if (!Array.isArray(S.xDebts)) S.xDebts = [];
    if (!Array.isArray(S.nwHist)) S.nwHist = [];
    if (!S.prop || typeof S.prop !== 'object') S.prop = { price: 550000, down: 110000, rate: 4.5, amort: 25, rent: 2600, tax: 350, ins: 120, condo: 0, maint: 1, growth: 3, vacancy: 4 };
  };
  ensure();

  const money = n => (typeof $ === 'function' ? $(n) : '$' + Math.round(n).toLocaleString('en-CA'));
  const pc = (n, d = 1) => (typeof pct === 'function' ? pct(n, d) : (+n).toFixed(d) + '%');
  const e = s => (typeof esc === 'function' ? esc(s) : String(s ?? ''));
  const now = () => new Date();
  const monthsUntil = d => { const t = new Date(d), n = now(); return (t.getFullYear() - n.getFullYear()) * 12 + (t.getMonth() - n.getMonth()) - (t.getDate() < n.getDate() ? 1 : 0); };
  const daysUntil = d => Math.ceil((new Date(d + 'T09:45:00-05:00') - now()) / 864e5);
  const fmtDay = d => new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtMon = d => d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  const addMonths = n => { const d = now(); d.setMonth(d.getMonth() + n); return d; };
  const isOwner = () => S.profile.goal === 'own' || S.profile.goal === 'invest';
  const inc = () => (typeof income === 'function' ? income() : S.income);
  const spent = () => (typeof spendTotal === 'function' ? spendTotal() : 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const BOC_DATES = ['2026-10-28', '2026-12-09', '2027-01-27', '2027-03-03', '2027-04-28', '2027-06-02', '2027-07-21', '2027-09-08', '2027-10-27', '2027-12-08'];
  const nextBoC = () => BOC_DATES.find(d => daysUntil(d) >= 0) || null;

  /* ============ 11. LIVE RATES FIX — always ask the Bank of Canada directly, keep the newest date */
  const VALET = 'https://www.bankofcanada.ca/valet/observations/';
  const SERIES = { prime: ['V80691311', 12], policy: ['V39079', 40], bond5: ['BD.CDN.5YR.DQ.YLD', 40], fiveYearPosted: ['V80691335', 12], usdcad: ['FXUSDCAD', 15] };
  let FRESH = null, checking = false, lastCheck = +localStorage.getItem('ec8_lastCheck') || 0;

  async function fetchSeries(id, n) {
    const r = await fetch(`${VALET}${id}/json?recent=${n}&_=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('valet ' + r.status);
    const j = await r.json();
    const ob = (j.observations || []).filter(o => o[id] && o[id].v !== undefined && o[id].v !== '');
    if (!ob.length) throw new Error('no data');
    const last = ob[ob.length - 1], first = ob[0];
    return { value: +last[id].v, date: last.d, change: +(+last[id].v - +first[id].v).toFixed(2) };
  }
  const newer = (a, b) => (!a ? b : !b ? a : (a.date || '') >= (b.date || '') ? a : b);

  async function freshRates() {
    if (checking) return;
    checking = true;
    try {
      const keys = Object.keys(SERIES);
      const res = await Promise.allSettled(keys.map(k => fetchSeries(SERIES[k][0], SERIES[k][1])));
      const out = {};
      keys.forEach((k, i) => { if (res[i].status === 'fulfilled') out[k] = res[i].value; });
      if (out.prime) {
        const base = (typeof RATES !== 'undefined' && RATES) || {};
        const merged = Object.assign({}, base);
        keys.forEach(k => { merged[k] = newer(base[k], out[k]); });
        merged.source = 'Bank of Canada';
        FRESH = merged; RATES = merged;
        try { cache.set('rates', merged); } catch (_) {}
        lastCheck = Date.now(); localStorage.setItem('ec8_lastCheck', String(lastCheck));
        if (typeof applyRates === 'function') applyRates();
      }
    } catch (err) { console.warn('EC8 rates', err); }
    checking = false;
    render();
  }
  const _oldLoadRates = window.loadRates;
  window.loadRates = async function (force) {
    await freshRates();
    if (!FRESH && typeof _oldLoadRates === 'function') return _oldLoadRates(force);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastCheck > 30 * 6e4) freshRates(); });
  setInterval(() => { if (!document.hidden) freshRates(); }, 6 * 3600e3);

  window.rateStrip = function () {
    if (typeof RATES === 'undefined' || !RATES || !RATES.prime) return `<div class="note">Live rates couldn't load. Using your saved rate of <b>${pc(S.rate, 2)}</b>. <a href="#" onclick="loadRates(true);return false">Try again</a></div>`;
    const cell = (l, o, hint) => o ? `<div class="card flat kpi"><div class="l">${l}</div><div class="v">${pc(o.value, 2)}</div><div class="h">${o.change ? `<span class="delta ${o.change > 0 ? 'neg' : 'pos'}">${o.change > 0 ? '▲' : '▼'} ${Math.abs(o.change).toFixed(2)}</span> ` : '<span class="delta">no change</span> '}${hint}</div></div>` : '';
    const nb = nextBoC(), nd = nb ? daysUntil(nb) : null;
    const stale = RATES.prime.date && (now() - new Date(RATES.prime.date + 'T12:00:00')) / 864e5 > 10;
    const usd = RATES.usdcad ? `<div class="card flat kpi"><div class="l">USD → CAD</div><div class="v">${(+RATES.usdcad.value).toFixed(4)}</div><div class="h">1 US$ in Canadian $</div></div>` : '';
    const boc = nb ? `<div class="card flat kpi ec8-boc"><div class="l">Next BoC decision</div><div class="v">${fmtDay(nb).replace(/, \d{4}/, '')}</div><div class="h">${nd === 0 ? '<b>Today</b>, 9:45 a.m. ET' : `in ${nd} day${nd === 1 ? '' : 's'}`} · prime follows</div></div>` : '';
    return `<div class="grid ec8-rates">${cell('Prime rate', RATES.prime, 'variable rates follow this')}${cell('BoC policy rate', RATES.policy, 'sets prime')}${cell('5-yr bond yield', RATES.bond5, 'drives fixed rates')}${cell('5-yr posted rate', RATES.fiveYearPosted, 'big-bank posted')}${usd}${boc}</div>
    <div class="small mute" style="margin-top:8px"><span class="dot ${stale ? 'off' : ''}"></span>Live from the Bank of Canada · prime published ${fmtDay(RATES.prime.date)} (weekly, every Wednesday) · checked ${lastCheck ? new Date(lastCheck).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
    ${stale ? ` · <a href="#" onclick="loadRates(true);return false">Data looks old, refresh</a>` : ''}</div>`;
  };

  /* ============ core numbers */
  function mortgageNext12() {
    if (!isOwner() || typeof per !== 'function') return 0;
    let b = S.bal, prin = 0; const i = per(S.rate);
    for (let m = 0; m < 12 && b > 0; m++) { const p = Math.min(S.pmt, b + b * i) - b * i; prin += p; b -= p; }
    return prin;
  }
  const extraAssets = () => S.xAssets.reduce((a, x) => a + (+x.v || 0), 0);
  const extraDebts = () => S.xDebts.reduce((a, x) => a + (+x.v || 0), 0);
  function netWorth() {
    const home = isOwner() ? S.home : 0, mort = isOwner() ? S.bal : 0;
    const assets = home + S.cash + S.tfsa + S.rrsp + S.nonreg + extraAssets();
    const debts = mort + extraDebts();
    return { assets, debts, nw: assets - debts };
  }
  function snapshot() {
    ensure();
    const k = now().toISOString().slice(0, 7), nw = Math.round(netWorth().nw), h = S.nwHist, last = h[h.length - 1];
    if (last && last.m === k) { if (last.v !== nw) { last.v = nw; save(); } }
    else { h.push({ m: k, v: nw }); if (h.length > 120) h.shift(); save(); }
  }
  function nwChangeYear() {
    const y = String(now().getFullYear()), h = S.nwHist, first = h.find(x => x.m.startsWith(y)) || h[0];
    return first ? netWorth().nw - first.v : 0;
  }

  /* ============ financial score */
  function score() {
    const i = inc() || 1, sp = spent() || 1, cf = i - sp, parts = [];
    parts.push(['Cash flow', cf >= 0 ? 20 : cf > -0.05 * i ? 8 : 0, 20, cf >= 0 ? `${money(cf)} left each month` : `${money(-cf)} short each month`]);
    const em = S.cash / sp;
    parts.push(['Emergency fund', Math.round(clamp(em / 6, 0, 1) * 20), 20, `${em.toFixed(1)} months of spending saved (goal: 6)`]);
    if (isOwner()) {
      const eq = (S.home - S.bal) / S.home;
      parts.push(['Home equity', Math.round(clamp(eq / 0.35, 0, 1) * 20), 20, `${pc(eq * 100)} equity`]);
      const hd = S.trigger - S.rate;
      parts.push(['Rate safety', S.rtype === 'Fixed' ? 15 : hd >= 2 ? 15 : hd >= 1 ? 10 : hd >= 0.5 ? 5 : 0, 15, S.rtype === 'Fixed' ? 'Fixed rate until renewal' : `${hd.toFixed(2)} pts below trigger rate`]);
    } else {
      const dp = S.buy.down / (0.2 * S.buy.price);
      parts.push(['Down payment', Math.round(clamp(dp, 0, 1) * 20), 20, `${pc(clamp(dp, 0, 9) * 100, 0)} of a 20% down payment`]);
      const ok = typeof afford === 'function' && afford().max >= S.buy.price;
      parts.push(['Buying power', ok ? 15 : 7, 15, ok ? 'Target home is within budget' : 'Target home is above budget']);
    }
    const sr = (S.spend.Savings || 0) / i;
    parts.push(['Savings rate', Math.round(clamp(sr / 0.2, 0, 1) * 15), 15, `${pc(sr * 100)} of income saved (goal: 20%)`]);
    const g = S.goals || [], on = g.filter(x => { const ml = Math.max(1, Math.round((new Date(x.d) - now()) / 2.63e9)); return x.m >= Math.max(x.t - x.s, 0) / ml; }).length;
    parts.push(['Goals on track', g.length ? Math.round(on / g.length * 10) : 10, 10, g.length ? `${on} of ${g.length} goals on track` : 'No goals yet']);
    const total = parts.reduce((a, p) => a + p[1], 0);
    const label = total >= 80 ? 'Excellent' : total >= 65 ? 'Good' : total >= 50 ? 'Fair' : 'Needs attention';
    return { total, label, parts };
  }

  /* ============ 9. smart alerts */
  function alerts() {
    const out = [], sp = spent(), cf = inc() - sp;
    if (isOwner() && S.maturity) {
      const m = monthsUntil(S.maturity);
      if (m >= 0 && m <= 4) out.push(['red', `Mortgage renewal in ${m} month${m === 1 ? '' : 's'}`, 'Ask lenders for a rate hold now (usually up to 120 days) so you can shop without risk.', "go('plan','mortgage')"]);
      else if (m >= 0 && m <= 12) out.push(['amber', `Mortgage renewal in ${m} months`, 'Start comparing renewal offers. Your lender\'s first offer is often not the best one.', "go('plan','mortgage')"]);
    }
    if (isOwner() && S.rtype === 'Variable') {
      const hd = S.trigger - S.rate;
      if (hd < 0.5) out.push(['red', 'Close to your trigger rate', `Only ${hd.toFixed(2)} pts of headroom. Above it, your payment may no longer cover the interest.`, "go('plan','whatif')"]);
      else if (hd < 1) out.push(['amber', 'Trigger rate getting closer', `${hd.toFixed(2)} pts of headroom left.`, "go('plan','whatif')"]);
    }
    const nb = nextBoC();
    if (nb && daysUntil(nb) <= 14) out.push(['amber', `Bank of Canada decision ${daysUntil(nb) === 0 ? 'today' : 'in ' + daysUntil(nb) + ' days'}`, `${fmtDay(nb)}. If the policy rate moves, prime and variable rates usually follow within days.`, "go('market')"]);
    if (cf < 0) out.push(['red', 'Spending is above income', `${money(-cf)} more going out than coming in each month.`, "go('plan','budget')"]);
    if (sp && S.cash < sp * 3) out.push(['amber', 'Emergency fund below 3 months', `${money(S.cash)} saved. Aim for ${money(sp * 3)} to ${money(sp * 6)}.`, "go('plan','goals')"]);
    (S.goals || []).forEach(g => { const ml = Math.max(1, Math.round((new Date(g.d) - now()) / 2.63e9)), need = Math.max(g.t - g.s, 0) / ml; if (g.m < need) out.push(['amber', `“${g.n}” is behind`, `Needs ${money(need)}/mo; you're putting in ${money(g.m)}.`, "go('plan','goals')"]); });
    if (typeof RATES !== 'undefined' && RATES?.prime?.date && (now() - new Date(RATES.prime.date + 'T12:00:00')) / 864e5 > 10) out.push(['amber', 'Live rates look out of date', `Last prime update ${fmtDay(RATES.prime.date)}. Tap to refresh.`, 'loadRates(true)']);
    if (now().getMonth() <= 1 && S.rrspRoom > 0) out.push(['green', 'RRSP deadline is coming', `Contributions made by March 1 count toward last year's taxes. You have ${money(S.rrspRoom)} of room.`, "go('plan','strategy')"]);
    if (isOwner() && (S.home - S.bal) / S.home >= 0.2) out.push(['green', '20% equity reached', 'You may qualify for a refinance or a HELOC. Compare costs before you use it.', "go('plan','networth')"]);
    if (sp && S.cash > sp * 6 && S.tfsaRoom > 0) out.push(['green', 'Extra cash could grow tax-free', `About ${money(Math.min(S.cash - sp * 6, S.tfsaRoom))} above a 6-month cushion could go into your TFSA.`, "go('plan','strategy')"]);
    const rank = { red: 0, amber: 1, green: 2 };
    return out.sort((a, b) => rank[a[0]] - rank[b[0]]);
  }

  /* ============ 5. next best actions */
  function actions() {
    const out = [], sp = spent(), cf = inc() - sp, mtr = (S.mtr || 0) / 100;
    if (cf < 0) out.push({ t: `Close the ${money(-cf)}/mo gap`, d: 'Review your three biggest categories in your budget first.', v: -cf * 12, unit: 'a year back in your pocket', go: "go('plan','budget')" });
    if (sp && S.cash < sp * 3) out.push({ t: 'Build your emergency fund', d: `Get to 3 months (${money(sp * 3)}) before investing or prepaying.`, v: sp * 3 - S.cash, unit: 'still to save', go: "go('plan','goals')" });
    if (isOwner() && typeof amort === 'function') {
      const x = Math.max(100, Math.round((+S.extra || 200) / 50) * 50), b = amort(S.bal, S.rate, S.pmt), p = amort(S.bal, S.rate, S.pmt, x);
      if (isFinite(b.months) && isFinite(p.months) && b.int > p.int) out.push({ t: `Prepay ${money(x)}/mo on your mortgage`, d: `Mortgage-free ${((b.months - p.months) / 12).toFixed(1)} years sooner. A guaranteed ${pc(S.rate, 2)} return.`, v: b.int - p.int, unit: 'interest saved', go: "go('plan','mortgage')" });
    }
    if (S.rrspRoom > 0 && mtr >= 0.3) { const amt = Math.min((+S.extra || 200) * 12, S.rrspRoom); out.push({ t: `Contribute ${money(amt)} to your RRSP`, d: `At a ${pc(S.mtr)} tax rate the refund is large. Put the refund into your TFSA or mortgage.`, v: amt * mtr, unit: 'estimated tax refund', go: "go('plan','strategy')" }); }
    if (sp && S.cash > sp * 6 && S.tfsaRoom > 0) { const amt = Math.min(S.cash - sp * 6, S.tfsaRoom); out.push({ t: `Move ${money(amt)} into your TFSA`, d: 'Cash above a 6-month cushion can grow tax-free.', v: amt * (Math.pow(1 + (S.ret || 5) / 100, 10) - 1), unit: 'possible tax-free growth in 10 yrs', go: "go('plan','strategy')" }); }
    if (S.profile.goal === 'buy' && mtr > 0) out.push({ t: 'Open an FHSA if you qualify', d: 'First-time buyers can put in up to $8,000 a year. It\'s tax-deductible going in and tax-free coming out for a home.', v: 8000 * mtr, unit: 'yearly tax refund (est.)', go: "go('plan','buy')" });
    if (isOwner() && S.maturity) { const m = monthsUntil(S.maturity); if (m >= 0 && m <= 12) out.push({ t: 'Shop your renewal', d: `Renewal is in ${m} months. Saving 0.25 pts on ${money(S.bal)} is worth roughly this over a 5-year term.`, v: S.bal * 0.0025 * 5, unit: 'potential saving', go: "go('plan','mortgage')" }); }
    if (window.EC9_SUBS) { const t = window.EC9_SUBS(); if (t > 0) out.push({ t: 'Review your subscriptions', d: 'From your imported bank statement. Cancel what you don\'t use.', v: t * 12, unit: 'a year in subscriptions', go: "go('plan','import')" }); }
    return out.sort((a, b) => b.v - a.v).slice(0, 4);
  }

  /* ============ 1+2. Command Centre */
  function commandCentre() {
    snapshot();
    const s = score(), nw = netWorth(), al = alerts(), act = actions(), ow = isOwner(), sp = spent(), cf = inc() - sp;
    const a = ow && typeof amort === 'function' ? amort(S.bal, S.rate, S.pmt) : null, eq = S.home - S.bal;
    const growth = ow ? mortgageNext12() + S.home * (S.growth || 0) / 100 : 0, ren = ow && S.maturity ? monthsUntil(S.maturity) : null;
    const ring = `<div class="ec8-ring" style="--p:${s.total}"><div><b data-count="${s.total}" data-fmt="int">${s.total}</b><span>/100</span></div></div>`;
    const tile = (l, v, fmt, h, cls = '') => `<div class="ec8-tile ${cls}"><div class="l">${l}</div><div class="v" ${v !== null && fmt ? `data-count="${Math.round(v)}" data-fmt="${fmt}"` : ''}>${v === null ? '—' : fmt === 'money' ? money(v) : v}</div><div class="h">${h}</div></div>`;
    const tiles = ow ? [
      tile('Home value', S.home, 'money', `${pc(S.growth)} / yr assumed`),
      tile('Mortgage', S.bal, 'money', `${pc(S.rate, 2)} ${S.rtype.toLowerCase()}`),
      tile('Home equity', eq, 'money', `<span class="pos">+${money(growth)}</span> next 12 months (est.)`, 'gold'),
      tile('Mortgage-free', a && isFinite(a.months) ? fmtMon(addMonths(a.months)) : null, '', a && isFinite(a.months) ? `${(a.months / 12).toFixed(1)} years at today's payment` : 'Payment doesn\'t cover interest'),
      tile('Renewal', ren === null ? null : ren < 0 ? 'Due' : ren < 12 ? ren + ' months' : (ren / 12).toFixed(1) + ' years', '', S.maturity ? fmtDay(S.maturity) : ''),
      tile('Monthly cash left', cf, 'money', 'Income minus spending', cf < 0 ? 'bad' : '')
    ] : [
      tile('Savings', S.cash + S.tfsa + S.rrsp, 'money', 'Cash, TFSA and RRSP'),
      tile('Down payment', S.buy.down, 'money', `${pc(S.buy.down / S.buy.price * 100)} of ${money(S.buy.price)}`, 'gold'),
      tile('Buying power', typeof afford === 'function' ? afford().max : null, 'money', 'After the stress test'),
      tile('Monthly cash left', cf, 'money', 'Income minus spending', cf < 0 ? 'bad' : '')
    ];
    const ch = nwChangeYear();
    return `<div class="ec8-hero">
      <div class="ec8-hero-top">
        <div><div class="eyebrow">Net worth</div><div class="ec8-big" data-count="${Math.round(nw.nw)}" data-fmt="money">${money(nw.nw)}</div>
        <div class="small ${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '▲' : '▼'} ${money(Math.abs(ch))} this year <span class="mute">· tracked since you started</span></div>
        <a href="#" class="small" onclick="go('plan','networth');return false">Open Net Worth Centre →</a></div>
        <div class="ec8-score" onclick="EC8.showScore()" title="How is this calculated?">${ring}<div><div class="l">Financial score</div><b>${s.label}</b><div class="small mute">Tap to see why</div></div></div>
      </div>
      <div class="ec8-tiles">${tiles.join('')}</div>
      <div id="ec8-score-detail" style="display:none">${scoreDetail(s)}</div>
    </div>
    <div class="sp"></div>
    <div class="grid g2">
      <div class="card"><div class="head"><h2>Next best actions</h2><span class="tag acc">Ranked by $ impact</span></div>
        ${act.length ? `<div class="list">${act.map((x, k) => `<div class="it ec8-act" onclick="${x.go}"><div class="num">${k + 1}</div><div style="flex:1"><h3>${e(x.t)}</h3><div class="small mute">${e(x.d)}</div></div><div class="ec8-impact"><b class="pos">${money(x.v)}</b><span>${e(x.unit)}</span></div></div>`).join('')}</div>` : '<div class="small mute">You\'re in great shape. Nothing urgent right now.</div>'}
      </div>
      <div class="card"><div class="head"><h2>Alerts</h2>${al.length ? `<span class="tag ${al[0][0] === 'red' ? 'neg' : ''}">${al.length}</span>` : ''}</div>
        ${al.length ? al.slice(0, 4).map(alertRow).join('') + (al.length > 4 ? `<a href="#" class="small" onclick="go('plan','alerts');return false">See all ${al.length} alerts →</a>` : '') : '<div class="small mute">No alerts. We\'ll flag renewals, rate changes, goals and spending here.</div>'}
      </div>
    </div><div class="sp"></div>`;
  }
  const alertRow = a => `<div class="ec8-alert ${a[0]}" onclick="${a[3]}"><i></i><div><b>${e(a[1])}</b><div class="small mute">${e(a[2])}</div></div></div>`;
  const scoreDetail = s => `<div class="ec8-sd">${s.parts.map(p => `<div class="ec8-sdr"><span>${p[0]}</span><div class="bar"><i style="width:${p[1] / p[2] * 100}%;background:var(--${p[1] / p[2] >= .7 ? 'pos' : p[1] / p[2] >= .4 ? 'warn' : 'neg'})"></i></div><b>${p[1]}/${p[2]}</b><div class="small mute">${e(p[3])}</div></div>`).join('')}<div class="hint">A simple health check based on your own numbers. Not a credit score.</div></div>`;

  const _overview = V.overview;
  V.overview = function () {
    const html = _overview.apply(this, arguments), cc = commandCentre();
    const h1 = html.indexOf('</h1>');
    if (h1 > -1) { const p = html.indexOf('</p>', h1); const at = p > -1 && p - h1 < 600 ? p + 4 : h1 + 5; return html.slice(0, at) + '<div class="sp"></div>' + cc + html.slice(at); }
    return cc + html;
  };

  /* ============ Plan tabs */
  if (typeof PT !== 'undefined' && typeof P !== 'undefined') {
    [['networth', 'Net worth'], ['whatif', 'What if?'], ['property', 'Property check'], ['alerts', 'Alerts']].forEach(t => { if (!PT.some(x => x[0] === t[0])) PT.push(t); });

    P.networth = () => {
      snapshot();
      const n = netWorth(), ow = isOwner(), h = S.nwHist;
      const row = (label, v, path) => `<tr><td>${label}</td><td>${path ? `<input type="number" value="${v}" onchange="set('${path}',+this.value);render()">` : money(v)}</td></tr>`;
      const list = (arr, key) => arr.map((x, k) => `<tr><td><input style="text-align:left" value="${e(x.n)}" onchange="S.${key}[${k}].n=this.value;save()"></td><td><input type="number" value="${x.v}" onchange="S.${key}[${k}].v=+this.value;save();render()"></td><td><button class="btn ghost sm" onclick="S.${key}.splice(${k},1);save();render()">×</button></td></tr>`).join('');
      const series = h.length > 1 ? `<div class="card"><h2>Your net worth over time</h2><div class="sp"></div>${chart([{ n: 'Net worth', c: 'var(--accent)', d: h.map(x => Math.max(x.v, 0)) }], 200).replace('>Today<', '>' + h[0].m + '<').replace(/>Yr \d+</, '>Now<')}</div><div class="sp"></div>` : `<div class="note">Your net worth history starts today. Each month we save a snapshot so you can watch it grow.</div><div class="sp"></div>`;
      return `<div class="grid g3">
        <div class="card kpi"><div class="l">Assets</div><div class="v" data-count="${Math.round(n.assets)}" data-fmt="money">${money(n.assets)}</div></div>
        <div class="card kpi"><div class="l">Debts</div><div class="v neg" data-count="${Math.round(n.debts)}" data-fmt="money">${money(n.debts)}</div></div>
        <div class="card kpi"><div class="l">Net worth</div><div class="v acc" data-count="${Math.round(n.nw)}" data-fmt="money">${money(n.nw)}</div><div class="h ${nwChangeYear() >= 0 ? 'pos' : 'neg'}">${nwChangeYear() >= 0 ? '▲' : '▼'} ${money(Math.abs(nwChangeYear()))} this year</div></div></div><div class="sp"></div>
        ${series}
        <div class="grid g2"><div class="card"><h2>What you own</h2><table>${ow ? row('Home', S.home, 'home') : ''}${row('Cash', S.cash, 'cash')}${row('TFSA', S.tfsa, 'tfsa')}${row('RRSP', S.rrsp, 'rrsp')}${row('Non-registered', S.nonreg, 'nonreg')}${list(S.xAssets, 'xAssets')}</table>
          <button class="btn ghost sm" style="margin-top:10px" onclick="S.xAssets.push({n:'Vehicle',v:0});save();render()">+ Add asset (car, FHSA, pension…)</button></div>
        <div class="card"><h2>What you owe</h2><table>${ow ? row('Mortgage', S.bal, 'bal') : ''}${list(S.xDebts, 'xDebts')}</table>
          <button class="btn ghost sm" style="margin-top:10px" onclick="S.xDebts.push({n:'Car loan',v:0});save();render()">+ Add debt (car loan, card, HELOC…)</button>
          <div class="hint">Use balances from your latest statements. Everything syncs if you're signed in.</div></div></div>`;
    };

    const W = { rate: 0, home: 0, inc: 0, extra: 0, lump: 0 };
    window.EC8W = (k, v) => { W[k] = +v; render(); };
    window.EC8P = p => { Object.assign(W, { rate: 0, home: 0, inc: 0, extra: 0, lump: 0 }, p); render(); };
    P.whatif = () => {
      if (!isOwner()) return `<div class="note">"What if" is built around a mortgage. Switch your situation to owning in Settings, or use <a href="#" onclick="pTab='property';render();return false">Property check</a> to test a home you might buy.</div>`;
      const base = amort(S.bal, S.rate, S.pmt), remY = isFinite(base.months) ? Math.max(base.months / 12, 1) : 25;
      const r1 = Math.max(S.rate + W.rate, 0), home1 = S.home * (1 + W.home / 100), inc1 = inc() * (1 + W.inc / 100);
      const pmt1 = W.rate === 0 ? S.pmt : payment(S.bal, r1, remY, S.rtype);
      const sc = amort(S.bal, r1, pmt1, W.extra, W.lump), sp = spent();
      const cf0 = inc() - sp, cf1 = inc1 - sp - (pmt1 - S.pmt) - W.extra;
      const bal5 = (rate, pm, x, l) => { let b = S.bal; const i = per(rate); for (let m = 0; m < 60 && b > 0; m++) b = b + b * i - pm - x - (m % 12 === 7 ? l : 0); return Math.max(b, 0); };
      const g5 = Math.pow(1 + (S.growth || 0) / 100, 5), eq0 = S.home * g5 - bal5(S.rate, S.pmt, 0, 0), eq1 = home1 * g5 - bal5(r1, pmt1, W.extra, W.lump);
      const ltv1 = S.bal / home1, mf = a => isFinite(a.months) ? fmtMon(addMonths(a.months)) : 'Never';
      const rowc = (l, a, b, good) => `<tr><td>${l}</td><td>${a}</td><td class="${good === undefined ? '' : good ? 'pos' : 'neg'}"><b>${b}</b></td></tr>`;
      const sl = (k, l, min, max, step, unit) => `<label>${l}: <b>${W[k] > 0 && unit !== '$' ? '+' : ''}${unit === '$' ? money(W[k]) : W[k] + unit}</b></label><input type="range" min="${min}" max="${max}" step="${step}" value="${W[k]}" style="padding:0" onchange="EC8W('${k}',this.value)">`;
      const em = sp ? S.cash / sp : 0;
      return `<div class="card"><h2>Try a scenario</h2><div class="small mute">Move the sliders or tap a quick scenario. Your saved numbers don't change.</div>
        <div class="row" style="margin:12px 0">${[['Rates +2%', { rate: 2 }], ['Rates −1%', { rate: -1 }], ['Home value −15%', { home: -15 }], ['10% raise', { inc: 10 }], ['Lose one income (−50%)', { inc: -50 }], ['Prepay $500/mo', { extra: 500 }], ['Reset', {}]].map(([l, p]) => `<button class="chip" onclick='EC8P(${JSON.stringify(p)})'>${l}</button>`).join('')}</div>
        <div class="grid g2"><div>${sl('rate', 'Interest rate change', -2, 3, 0.25, ' pts')}${sl('home', 'Home value change', -30, 30, 5, '%')}${sl('inc', 'Income change', -100, 30, 5, '%')}</div><div>${sl('extra', 'Extra monthly prepayment', 0, 2000, 50, '$')}${sl('lump', 'Yearly lump-sum prepayment', 0, 20000, 1000, '$')}</div></div></div><div class="sp"></div>
        <div class="card"><table><tr><th>What changes</th><th>Today</th><th>Your scenario</th></tr>
          ${rowc('Mortgage rate', pc(S.rate, 2), pc(r1, 2), W.rate === 0 ? undefined : W.rate < 0)}
          ${rowc(S.rtype === 'Variable' ? 'Payment (if lender re-amortizes)' : 'Payment at renewal', money(S.pmt), money(pmt1), pmt1 === S.pmt ? undefined : pmt1 < S.pmt)}
          ${rowc('Monthly cash left', money(cf0), money(cf1), cf1 === cf0 ? undefined : cf1 > cf0)}
          ${rowc('Mortgage-free', mf(base), mf(sc), sc.months === base.months ? undefined : sc.months < base.months)}
          ${rowc('Interest still to pay', money(base.int), money(sc.int), Math.round(sc.int) === Math.round(base.int) ? undefined : sc.int < base.int)}
          ${rowc('Home equity in 5 years', money(eq0), money(eq1), Math.round(eq1) === Math.round(eq0) ? undefined : eq1 > eq0)}
          ${S.rtype === 'Variable' ? rowc('Trigger rate headroom', (S.trigger - S.rate).toFixed(2) + ' pts', (S.trigger - r1).toFixed(2) + ' pts', W.rate === 0 ? undefined : S.trigger - r1 > S.trigger - S.rate) : ''}
          ${rowc('Loan-to-value', pc(S.bal / S.home * 100), pc(ltv1 * 100), W.home === 0 ? undefined : ltv1 < S.bal / S.home)}
        </table>
        ${ltv1 > 0.8 ? `<div class="note" style="margin-top:12px">At this home value you'd have under 20% equity, so refinancing or a HELOC would be harder.</div>` : ''}
        ${W.inc <= -50 ? `<div class="note" style="margin-top:12px">Your emergency fund covers about <b>${em.toFixed(1)} months</b> of spending if income stops completely.</div>` : ''}
        ${cf1 < 0 ? `<div class="note" style="margin-top:12px"><b>Cash flow turns negative</b> in this scenario. You'd need to cut spending by about ${money(-cf1)}/mo.</div>` : ''}
        <div class="hint">Estimates use Canadian compounding. Many variable mortgages keep the same payment when rates move and change the amortization instead; your lender's terms decide which applies.</div></div>`;
    };

    P.property = () => {
      const p = S.prop, dp = p.down / p.price, L = p.price - p.down, prem = dp < 0.2 && typeof cmhc === 'function' ? L * cmhc(dp) : 0;
      const pm = payment(L + prem, p.rate, p.amort, 'Fixed'), maint = p.price * p.maint / 100 / 12;
      const own = pm + p.tax + p.ins + p.condo + maint, effRent = p.rent * (1 - p.vacancy / 100), cfR = effRent - own;
      const noi = (effRent - p.tax - p.ins - p.condo - maint) * 12, cap = noi / p.price * 100, coc = p.down ? cfR * 12 / p.down * 100 : 0;
      const v5 = p.price * Math.pow(1 + p.growth / 100, 5);
      let b = L + prem; const i = per(p.rate, 'Fixed'); for (let m = 0; m < 60; m++) b = b + b * i - pm;
      const af = typeof afford === 'function' ? afford() : null, md = af ? af.minDown(p.price) : 0;
      const ff = (k, l, h = '') => `<label>${l}</label><input type="number" step="any" value="${p[k]}" onchange="S.prop.${k}=+this.value;save();render()">${h ? `<div class="hint">${h}</div>` : ''}`;
      const rateHint = typeof RATES !== 'undefined' && RATES?.fiveYearPosted ? `Big-bank 5-yr posted is ${pc(RATES.fiveYearPosted.value, 2)}; discounted rates are usually lower.` : '';
      return `<div class="grid g2"><div class="card"><h2>The home</h2>
        ${ff('price', 'Asking price')}${ff('down', 'Down payment')}<div class="grid g2" style="gap:12px"><div>${ff('rate', 'Mortgage rate (%)', rateHint)}</div><div>${ff('amort', 'Amortization (years)')}</div></div>
        <div class="grid g2" style="gap:12px"><div>${ff('tax', 'Property tax / month')}</div><div>${ff('ins', 'Home insurance / month')}</div></div>
        <div class="grid g2" style="gap:12px"><div>${ff('condo', 'Condo fees / month')}</div><div>${ff('maint', 'Maintenance (% of price / yr)', 'About 1% is common')}</div></div>
        <div class="grid g2" style="gap:12px"><div>${ff('rent', 'Rent it could earn / month', 'Check similar listings nearby')}</div><div>${ff('growth', 'Expected growth / yr (%)')}</div></div>
        <div class="row" style="margin-top:12px"><a class="small" target="_blank" rel="noopener" href="https://www.realtor.ca/">Find listings on Realtor.ca →</a><a class="small" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent((S.profile.city || '') + ' rent prices ' + new Date().getFullYear())}">Rent prices →</a></div></div>
        <div class="card"><h2>What this home really costs</h2>
          <div class="grid g2" style="gap:12px;margin:10px 0"><div class="kpi"><div class="l">Monthly cost to own</div><div class="v acc" data-count="${Math.round(own)}" data-fmt="money">${money(own)}</div><div class="h">Mortgage + tax + insurance + fees + upkeep</div></div>
          <div class="kpi"><div class="l">If rented out</div><div class="v ${cfR < 0 ? 'neg' : 'pos'}">${money(cfR)}/mo</div><div class="h">After ${p.vacancy}% vacancy</div></div></div>
          <table><tr><td>Mortgage payment</td><td>${money(pm)}</td></tr><tr><td>Mortgage insurance (CMHC)</td><td>${prem ? money(prem) + ' added to loan' : 'Not needed (20%+ down)'}</td></tr>
          <tr><td>Minimum down payment</td><td class="${p.down < md ? 'neg' : ''}">${money(md)}</td></tr>
          <tr><td>Cap rate</td><td>${pc(cap)}</td></tr><tr><td>Cash-on-cash return</td><td class="${coc < 0 ? 'neg' : 'pos'}">${pc(coc)}</td></tr>
          <tr><td>Value in 5 years</td><td>${money(v5)}</td></tr><tr><td>Equity in 5 years</td><td><b>${money(v5 - Math.max(b, 0))}</b></td></tr>
          ${af ? `<tr><td>Within your buying power?</td><td>${p.price <= af.max ? '<span class="tag pos">Yes</span>' : `<span class="tag neg">Over by ${money(p.price - af.max)}</span>`}</td></tr>` : ''}</table>
          <button class="btn ghost sm" style="margin-top:12px" onclick="EC8.askAbout('Is this home a good buy for me? Price ${money(p.price)}, down ${money(p.down)}, monthly cost to own ${money(own)}, rent potential ${money(p.rent)}.')">${typeof ic === 'function' ? ic('ai') : ''}Ask AI about this home</button>
          <div class="hint">Estimates only. Get a home inspection and check real comparable sales before you make an offer.</div></div></div>`;
    };

    P.alerts = () => { const a = alerts(); return `<div class="card"><h2>All alerts</h2>${a.length ? a.map(alertRow).join('') : '<div class="small mute">Nothing needs your attention right now.</div>'}<div class="hint">Alerts update every time you open the app. They come from your numbers, your renewal date and the Bank of Canada calendar.</div></div>`; };
  }

  /* ============ 7. Neighbourhood scorecard */
  if (typeof areasHtml === 'function') {
    const _areasHtml = areasHtml;
    window.areasHtml = function (A) {
      const html = _areasHtml.apply(this, arguments), list = (A?.neighbourhoods || []);
      if (!list.length) return html;
      const keys = ['family', 'commute', 'walkability', 'value', 'nightlife'];
      const o10 = n => { const v = keys.map(k => +n.scores?.[k] || 0); return (v.reduce((a, b) => a + b, 0) / v.length * 2).toFixed(1); };
      const m10 = n => { const p = (S.priorities.length ? S.priorities : ['Family', 'Commute', 'Walkability', 'Value', 'Nightlife']).map(x => x.toLowerCase()); return (p.reduce((a, k) => a + (+n.scores?.[k] || 0), 0) / p.length * 2).toFixed(1); };
      const sorted = [...list].sort((a, b) => m10(b) - m10(a));
      const cell = v => `<td><span class="ec8-pill" style="--s:${v}">${(+v).toFixed(1)}</span></td>`;
      return `<div class="card"><div class="head"><div><h2>Neighbourhood scorecard</h2><div class="small mute">Scores out of 10. “Your fit” uses only what matters to you.</div></div></div>
        <div style="overflow-x:auto"><table class="ec8-sc"><tr><th style="text-align:left">Area</th><th>Family</th><th>Commute</th><th>Walk</th><th>Value</th><th>Nightlife</th><th>Overall</th><th>Your fit</th></tr>
        ${sorted.map(n => `<tr><td style="text-align:left"><b>${e(n.name)}</b></td>${keys.map(k => cell((+n.scores?.[k] || 0) * 2)).join('')}${cell(o10(n))}<td><b class="acc">${m10(n)}</b></td></tr>`).join('')}</table></div></div><div class="sp"></div>${html}`;
    };
  }

  /* ============ 8. Ask AI on every page */
  const ASK = {
    overview: ['What should I focus on this month?', 'How can I raise my financial score?', 'Explain my next best actions'],
    market: ['What does the next Bank of Canada decision mean for me?', 'Should I worry about rates going up?', 'Summarize today\'s market in simple words'],
    areas: ['Which area fits my budget and family best?', 'What should I check on a home viewing?'],
    plan: ['Should I prepay my mortgage or invest?', 'What happens to me if rates go up 1%?', 'Fixed or variable at my renewal?', 'How do I grow my net worth faster?'],
    settings: ['How is my data kept private?']
  };
  function closeAsk() { const p = document.getElementById('ec8-askp'); if (p) p.classList.remove('on'); }
  window.EC8 = {
    askAbout(q) { go('advisor'); closeAsk(); if (q) setTimeout(() => typeof ask === 'function' && ask(q), 60); },
    showScore() { const d = document.getElementById('ec8-score-detail'); if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none'; },
    toggleAsk() { const p = document.getElementById('ec8-askp'); if (p) p.classList.toggle('on'); },
    refreshRates: () => freshRates(), score, alerts, actions, netWorth
  };
  function askButton(view) {
    let b = document.getElementById('ec8-ask');
    if (!b) {
      b = document.createElement('div'); b.id = 'ec8-ask';
      b.innerHTML = `<div id="ec8-askp" class="ec8-askp"></div><button class="ec8-fab" onclick="EC8.toggleAsk()" aria-label="Ask AI">${typeof ic === 'function' ? ic('ai') : '✦'}<span>Ask AI</span></button>`;
      document.body.appendChild(b);
    }
    b.style.display = (!S.profile.onboarded || view === 'advisor') ? 'none' : '';
    const qs = ASK[view] || ASK.overview, p = document.getElementById('ec8-askp');
    if (p) p.innerHTML = `<div class="small mute" style="margin-bottom:8px">Ask about this page</div>${qs.map(q => `<button class="chip" onclick='EC8.askAbout(${JSON.stringify(q).replace(/'/g, '&#39;')})'>${e(q)}</button>`).join('')}<button class="btn sm" style="margin-top:8px;width:100%;justify-content:center" onclick="EC8.askAbout('')">Open Advisor</button>`;
  }

  /* ============ 2. animated numbers */
  let lastView = '';
  function animate() {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('#view [data-count]').forEach(el => {
      const to = +el.dataset.count, fmt = el.dataset.fmt; if (!isFinite(to) || reduce) return;
      const t0 = performance.now(), dur = 900, f = v => fmt === 'money' ? money(v) : Math.round(v);
      const step = t => { const k = Math.min((t - t0) / dur, 1), ez = 1 - Math.pow(1 - k, 3); el.textContent = f(to * ez); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    document.querySelectorAll('#view .ec8-ring').forEach(r => { r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); });
  }

  /* ============ hook into render */
  const _render = window.render;
  window.render = function () {
    if (FRESH && typeof RATES !== 'undefined' && RATES?.prime && FRESH.prime && (RATES.prime.date || '') < FRESH.prime.date) RATES = FRESH;
    ensure();
    const r = _render.apply(this, arguments);
    const view = S.profile.onboarded ? (typeof cur !== 'undefined' ? cur : '') : 'onboard';
    try { askButton(view); } catch (_) {}
    if (view !== lastView) { lastView = view; try { animate(); } catch (_) {} }
    return r;
  };
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('.seg button'); if (b) setTimeout(() => { try { animate(); } catch (_) {} }, 0); });
  document.addEventListener('click', ev => { const w = document.getElementById('ec8-ask'); if (w && !w.contains(ev.target)) closeAsk(); });

  snapshot();
  render();
  freshRates();
})();
