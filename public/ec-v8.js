/* EquityClimb v8 (lean) - live Bank of Canada rates + rate strip + "Ask AI" button.
   Loads after the other scripts and only ADDS to the app.
   - Rates are re-checked straight from the Bank of Canada every time the app opens, comes back on screen,
     or Refresh is pressed. The newest date always wins, so an old cached copy can never hide a new rate.
   - The rate strip shows when prime was published AND when we last checked. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof V === 'undefined') return;

  const pc = (n, d = 1) => (typeof pct === 'function' ? pct(n, d) : (+n).toFixed(d) + '%');
  const e = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const now = () => new Date();
  const daysUntil = d => Math.ceil((new Date(d + 'T09:45:00-05:00') - now()) / 864e5);
  const fmtDay = d => new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = t => new Date(t).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  /* Bank of Canada scheduled rate announcement dates */
  const BOC_DATES = ['2026-10-28', '2026-12-09', '2027-01-27', '2027-03-03', '2027-04-28', '2027-06-02', '2027-07-21', '2027-09-08', '2027-10-27', '2027-12-08'];
  const nextBoC = () => BOC_DATES.find(d => daysUntil(d) >= 0) || null;

  /* ---------------- live rates ---------------- */
  const VALET = 'https://www.bankofcanada.ca/valet/observations/';
  const SERIES = { prime: ['V80691311', 12], policy: ['V39079', 40], bond5: ['BD.CDN.5YR.DQ.YLD', 40], fiveYearPosted: ['V80691335', 12], usdcad: ['FXUSDCAD', 15] };
  let FRESH = null, checking = false, lastErr = '', lastCheck = +localStorage.getItem('ec8_lastCheck') || 0;

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
    const before = typeof RATES !== 'undefined' && RATES && RATES.prime ? RATES.prime.value : null;
    try {
      const keys = Object.keys(SERIES);
      const res = await Promise.allSettled(keys.map(k => fetchSeries(SERIES[k][0], SERIES[k][1])));
      const out = {};
      keys.forEach((k, i) => { if (res[i].status === 'fulfilled') out[k] = res[i].value; });
      if (out.prime) {
        const base = (typeof RATES !== 'undefined' && RATES) || {}, merged = Object.assign({}, base);
        keys.forEach(k => { merged[k] = newer(base[k], out[k]); });
        merged.source = 'Bank of Canada';
        FRESH = merged; RATES = merged;
        try { cache.set('rates', merged); } catch (_) { /* cache is optional */ }
        lastCheck = Date.now(); lastErr = '';
        localStorage.setItem('ec8_lastCheck', String(lastCheck));
        if (typeof applyRates === 'function') applyRates();
      } else lastErr = 'Couldn\u2019t reach the Bank of Canada. Showing the last saved rates.';
    } catch (err) { lastErr = 'Couldn\u2019t reach the Bank of Canada. Showing the last saved rates.'; }
    checking = false;
    const after = typeof RATES !== 'undefined' && RATES && RATES.prime ? RATES.prime.value : null;
    // A new prime rate changes mortgage numbers everywhere, so redraw the page; otherwise just repaint the strip.
    if (before !== after) render(); else if (window.EC8_PAINT) window.EC8_PAINT(); else render();
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
    const cell = (l, o, hint) => o ? `<div class="card flat kpi"><div class="l">${l}</div><div class="v">${pc(o.value, 2)}</div><div class="h">${o.change ? `<span class="delta ${o.change > 0 ? 'neg' : 'pos'}">${o.change > 0 ? '\u25B2' : '\u25BC'} ${Math.abs(o.change).toFixed(2)}</span> ` : '<span class="delta">no change</span> '}${hint}</div></div>` : '';
    const nb = nextBoC(), nd = nb ? daysUntil(nb) : null;
    const stale = RATES.prime.date && (now() - new Date(RATES.prime.date + 'T12:00:00')) / 864e5 > 10;
    const usd = RATES.usdcad ? `<div class="card flat kpi"><div class="l">USD \u2192 CAD</div><div class="v">${(+RATES.usdcad.value).toFixed(4)}</div><div class="h">1 US$ in Canadian $</div></div>` : '';
    const boc = nb ? `<div class="card flat kpi ec8-boc"><div class="l">Next BoC decision</div><div class="v">${fmtDay(nb).replace(/, \d{4}/, '')}</div><div class="h">${nd === 0 ? '<b>Today</b>, 9:45 a.m. ET' : `in ${nd} day${nd === 1 ? '' : 's'}`} \u00B7 prime follows</div></div>` : '';
    return `<div class="grid ec8-rates">${cell('Prime rate', RATES.prime, 'variable rates follow this')}${cell('BoC policy rate', RATES.policy, 'sets prime')}${cell('5-yr bond yield', RATES.bond5, 'drives fixed rates')}${cell('5-yr posted rate', RATES.fiveYearPosted, 'big-bank posted')}${usd}${boc}</div>
    <div class="small mute ec8-ratesline" style="margin-top:8px"><span class="dot ${stale || lastErr ? 'off' : ''}"></span>Bank of Canada \u00B7 prime published ${fmtDay(RATES.prime.date)} (updated weekly; it only changes when the Bank changes its rate) \u00B7 ${checking ? 'checking now\u2026' : lastErr ? e(lastErr) : 'checked ' + (lastCheck ? fmtTime(lastCheck) : '\u2014')}
    ${stale ? ' \u00B7 <a href="#" onclick="loadRates(true);return false">Data looks old, refresh</a>' : ''}</div>`;
  };

  /* ---------------- "Ask AI" button ---------------- */
  const ASK = {
    home: ['What should I focus on this month?', 'How can I raise my financial health score?', 'Explain my numbers in simple words'],
    budget: ['Where can I cut spending without feeling it?', 'Is my housing cost too high?', 'How much should I save each month?'],
    debt: ['Should I prepay my mortgage or invest?', 'Fixed or variable at my renewal?', 'What happens if rates rise 1%?'],
    wealth: ['TFSA, RRSP or FHSA: which first?', 'How much should I invest each month?', 'Explain index funds simply'],
    goals: ['How can I reach my goals faster?', 'How big should my emergency fund be?'],
    learn: ['Teach me something new about money', 'Quiz me on mortgages'],
    market: ['What does the next Bank of Canada decision mean for me?', 'Should I worry about rates going up?', 'Summarize today\u2019s market in simple words'],
    areas: ['Which area fits my budget and family best?', 'What should I check at a home viewing?'],
    profile: ['What numbers matter most to fill in?', 'How is my take-home pay estimated?'],
    settings: ['How is my data kept private?']
  };
  function closeAsk() { const p = document.getElementById('ec8-askp'); if (p) p.classList.remove('on'); }
  window.EC8 = {
    askAbout(q) {
      closeAsk();
      if (q && window.EC7 && EC7.prefill) EC7.prefill(q); else go('advisor');
    },
    toggleAsk() { const p = document.getElementById('ec8-askp'); if (p) p.classList.toggle('on'); },
    refreshRates: freshRates,
    status: () => ({ last: lastCheck, err: lastErr, busy: checking })
  };
  function askButton(view) {
    let b = document.getElementById('ec8-ask');
    if (!b) {
      b = document.createElement('div'); b.id = 'ec8-ask';
      b.innerHTML = `<div id="ec8-askp" class="ec8-askp"></div><button class="ec8-fab" onclick="EC8.toggleAsk()" aria-label="Ask AI">${typeof ic === 'function' ? ic('ai') : '\u2726'}<span>Ask AI</span></button>`;
      document.body.appendChild(b);
    }
    b.style.display = (!S.profile.onboarded || view === 'advisor') ? 'none' : '';
    const p = document.getElementById('ec8-askp');
    if (p) p.innerHTML = `<div class="small mute" style="margin-bottom:8px">Ask about this page</div>${(ASK[view] || ASK.home).map(q => `<button class="chip" onclick='EC8.askAbout(${JSON.stringify(q).replace(/'/g, '&#39;')})'>${e(q)}</button>`).join('')}<button class="btn sm" style="margin-top:8px;width:100%;justify-content:center" onclick="EC8.askAbout('')">Open Copilot</button>`;
  }
  const _render = window.render;
  window.render = function () {
    if (FRESH && typeof RATES !== 'undefined' && RATES && RATES.prime && FRESH.prime && (RATES.prime.date || '') < FRESH.prime.date) RATES = FRESH;
    const r = _render.apply(this, arguments);
    try { askButton(S.profile.onboarded ? (typeof cur !== 'undefined' ? cur : '') : 'onboard'); } catch (_) { /* never block the page */ }
    return r;
  };
  document.addEventListener('click', ev => { const w = document.getElementById('ec8-ask'); if (w && !w.contains(ev.target)) closeAsk(); });

  render();
  freshRates();
})();
