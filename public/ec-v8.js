/* EquityClimb v8 (v12 build) - LIVE Bank of Canada rates, announcements and schedule + "Ask AI" button.
   Loads after the other scripts and only ADDS to the app.
   Every time the app opens, comes back on screen, or Refresh is pressed, it asks TWO ways at once:
     (1) your own /api/boc  -> reads bankofcanada.ca: rates, the Bank's latest rate announcements, its announcement schedule
     (2) the Bank of Canada's data service straight from the browser (rates only)
   The newest reading always wins. The screen shows exactly where each piece came from.
   Safety net for surprises: if the Bank's policy rate ever moves and banks' prime has not caught up (or the Bank posts a
   new rate announcement), a notice appears - even for an unscheduled move. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof V === 'undefined') return;

  const pc = (n, d = 1) => (typeof pct === 'function' ? pct(n, d) : (+n).toFixed(d) + '%');
  const e = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const now = () => new Date();
  const daysUntil = d => Math.ceil((new Date(d + 'T09:45:00-05:00') - now()) / 864e5);
  const fmtDay = d => { const x = new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')); return isNaN(x) ? '\u2014' : x.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const fmtTime = t => new Date(t).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const safeUrl = u => (/^https:\/\/([a-z0-9-]+\.)*bankofcanada\.ca\//i.test(String(u || '')) ? u : 'https://www.bankofcanada.ca/press/press-releases/');

  /* Fallback announcement dates, used ONLY if the live schedule can't be read. Copied from the Bank's own release of
     July 27, 2026. As soon as the live schedule is read from bankofcanada.ca, it replaces this list. */
  const SCHED_LINK = 'https://www.bankofcanada.ca/2026/07/bank-canada-publishes-2027-schedule-policy-interest-rate-announcements-other-major-publications/';
  const FALLBACK = ['2026-10-28', '2026-12-09', '2027-01-27', '2027-03-03', '2027-04-28', '2027-06-02', '2027-07-21', '2027-09-08', '2027-10-27', '2027-12-08'];
  let SCHEDULE = { dates: FALLBACK, live: false, published: '2026-07-27', link: SCHED_LINK };
  let ANN = null, SPREAD = null;
  const nextBoC = () => SCHEDULE.dates.find(d => d > new Date().toLocaleDateString('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).replace(/\//g,'-')) || null;

  /* ---------------- live rates ---------------- */
  const VALET = 'https://www.bankofcanada.ca/valet/observations/';
  const SERIES = { prime: ['V80691311', 60], policy: ['V39079', 400], bond5: ['BD.CDN.5YR.DQ.YLD', 40], fiveYearPosted: ['V80691335', 60], usdcad: ['FXUSDCAD', 15] };
  let FRESH = null, checking = false, lastErr = '', diag = {}, lastCheck = +localStorage.getItem('ec8_lastCheck') || 0;

  function summarize(ob, id) {
    ob = [...ob].sort((a,b) => a.d.localeCompare(b.d));
    const last = ob[ob.length - 1], v = +last[id].v;
    let i = ob.length - 1;
    while (i > 0 && +ob[i - 1][id].v === v) i--;
    const out = { value: v, date: last.d, change: 0 };
    if (i > 0) { out.lastChange = ob[i].d; out.change = +(v - +ob[i - 1][id].v).toFixed(2); } else out.sameSince = ob[0].d;
    return out;
  }
  /* Banks keep prime a fixed distance above the Bank's policy rate. The usual distance is learned from the data itself. */
  function spreadInfo(pObs, pid, oObs, oid) {
    if (!pObs || !oObs || pObs.length < 4 || !oObs.length) return null;
    pObs = [...pObs].sort((a,b) => a.d.localeCompare(b.d));
    oObs = [...oObs].sort((a,b) => a.d.localeCompare(b.d));
    const pol = oObs.map(o => [o.d, +o[oid].v]);
    const valAt = d => { let v = null; for (const [dd, vv] of pol) { if (dd <= d) v = vv; else break; } return v; };
    const freq = {};
    pObs.forEach(o => { const v = valAt(o.d); if (v != null) { const k = (+o[pid].v - v).toFixed(2); freq[k] = (freq[k] || 0) + 1; } });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    if (!top) return null;
    const typical = +top[0], lp = pObs[pObs.length - 1], lo = oObs[oObs.length - 1], prime = +lp[pid].v, policy = +lo[oid].v, now0 = +(prime - policy).toFixed(2);
    return { typical, now: now0, prime, policy, expectedPrime: +(policy + typical).toFixed(2), primeDate: lp.d, policyDate: lo.d, mismatch: Math.abs(now0 - typical) > 0.04 };
  }
  async function fetchSeries(id, n) {
    const r = await fetch(`${VALET}${id}/json?recent=${n}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const ob = (j.observations || []).filter(o => o[id] && o[id].v !== undefined && o[id].v !== '');
    if (!ob.length) throw new Error('no data');
    return ob.sort((a,b) => a.d.localeCompare(b.d));
  }
  async function fromBrowser() {
    const keys = Object.keys(SERIES), res = await Promise.allSettled(keys.map(k => fetchSeries(SERIES[k][0], SERIES[k][1]))), out = {}, raw = {};
    keys.forEach((k, i) => { if (res[i].status === 'fulfilled') { raw[k] = res[i].value; out[k] = summarize(res[i].value, SERIES[k][0]); } });
    if (!out.prime && !out.policy) { const bad = res.find(x => x.status === 'rejected'); throw new Error(bad ? String(bad.reason && bad.reason.message || bad.reason) : 'no data'); }
    if (raw.prime && raw.policy) out.spread = spreadInfo(raw.prime, SERIES.prime[0], raw.policy, SERIES.policy[0]);
    return out;
  }
  async function fromServer() {
    const r = await fetch('/api/boc?fresh=1&_=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j || (!j.prime && !j.policy)) throw new Error('no BoC rate');
    return j;
  }
  function pick(cands) {
    const list = cands.filter(Boolean);
    if (!list.length) return undefined;
    const rank = c => (c.lastChange || c.sameSince ? 1 : 0);
    list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || rank(b) - rank(a));
    const win = Object.assign({}, list[0]);
    if (!win.lastChange && !win.sameSince) { const m = list.find(c => c.value === win.value && (c.lastChange || c.sameSince)); if (m) { if (m.lastChange) { win.lastChange = m.lastChange; win.change = m.change; } else win.sameSince = m.sameSince; } }
    return win;
  }
  const newestSpread = list => list.filter(Boolean).sort((a, b) => ((b.policyDate || '') + (b.primeDate || '')).localeCompare((a.policyDate || '') + (a.primeDate || '')))[0] || null;
  const why = r => (r.status === 'fulfilled' ? 'ok' : 'failed (' + String(r.reason && r.reason.message || r.reason).slice(0, 40) + ')');

  async function freshRates() {
    if (checking) return;
    checking = true;
    const before = typeof RATES !== 'undefined' && RATES && RATES.prime ? RATES.prime.value : null;
    try {
      const [srv, dir] = await Promise.allSettled([fromServer(), fromBrowser()]);
      diag = { server: why(srv), direct: why(dir) };
      const S1 = srv.status === 'fulfilled' ? srv.value : null, D1 = dir.status === 'fulfilled' ? dir.value : null, sources = [S1, D1].filter(Boolean);
      if (sources.length) {
        const base = (typeof RATES !== 'undefined' && RATES) || {}, merged = Object.assign({}, base);
        Object.keys(SERIES).forEach(k => { const w = pick([base[k], ...sources.map(s => s[k])]); if (w) merged[k] = w; });
        merged.source = 'Bank of Canada';
        if (S1?.policyAnnouncement && (!merged.policy || S1.policyAnnouncement.date >= merged.policy.date)) {
          merged.policy = S1.policyAnnouncement;
          merged.policyAnnouncement = S1.policyAnnouncement;
          merged.policyObserved = S1.policyObserved || null;
        } else if (S1 && !S1.policyAnnouncement) {
          // Do not leave yesterday's announced value displayed forever after official observations supersede it.
          delete merged.policyAnnouncement;
          delete merged.policyObserved;
        }
        FRESH = merged; RATES = merged;
        try { cache.set('rates', merged); } catch (_) { /* cache is optional */ }
        SPREAD = newestSpread([S1 && S1.spread, D1 && D1.spread]);
        if (S1) {
          if (Array.isArray(S1.announcements)) ANN = S1.announcements;
          if (S1.schedule && Array.isArray(S1.schedule.dates) && S1.schedule.dates.length >= 3) SCHEDULE = { dates: S1.schedule.dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)), live: true, published: S1.schedule.published || '', link: safeUrl(S1.schedule.link) };
        }
        lastCheck = Date.now(); lastErr = '';
        localStorage.setItem('ec8_lastCheck', String(lastCheck));
        if (typeof applyRates === 'function') applyRates();
      } else lastErr = 'Couldn\u2019t reach the Bank of Canada. Showing the last saved rates.';
    } catch (err) { lastErr = 'Couldn\u2019t reach the Bank of Canada. Showing the last saved rates.'; }
    checking = false;
    // Policy-only announcements must also repaint immediately: prime can lag until the lender changes it.
    try { render(); } catch (err) { console.error(err); }
  }
  const _oldLoadRates = window.loadRates;
  window.loadRates = async function (force) {
    await freshRates();
    if (!FRESH && typeof _oldLoadRates === 'function') return _oldLoadRates(force);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastCheck > 2 * 6e4) freshRates(); });
  window.addEventListener('focus', () => { if (Date.now() - lastCheck > 2 * 6e4) freshRates(); });
  // Bounded polling ensures announcements show up even when the app remains open.
  setInterval(() => { if (!document.hidden && Date.now() - lastCheck > 2 * 6e4) freshRates(); }, 3 * 6e4);

  const srcLine = () => {
    const bits = [];
    if (diag.server) bits.push('bankofcanada.ca via our server ' + (diag.server === 'ok' ? '\u2713' : '\u2715'));
    if (diag.direct) bits.push('Bank data direct ' + (diag.direct === 'ok' ? '\u2713' : '\u2715'));
    const title = e(`app server: ${diag.server || '\u2014'}; Bank of Canada direct: ${diag.direct || '\u2014'}`);
    return bits.length ? ` \u00B7 <span title="${title}">sources: ${bits.join(', ')}</span>` : '';
  };
  /* Live notices straight from the Bank: newest rate announcement, a warning if prime hasn't followed the policy rate, official links. */
  function bocLive() {
    const out = [], a = ANN && ANN[0];
    if (SPREAD && SPREAD.mismatch && !(RATES?.policyAnnouncement && RATES.policyAnnouncement.date === new Date().toISOString().slice(0,10))) {
      out.push(`<div class="ec8-warn"><b>Heads up: the Bank\u2019s policy rate and banks\u2019 prime are out of step.</b> The Bank\u2019s policy rate is <b>${pc(SPREAD.policy, 2)}</b> (as of ${fmtDay(SPREAD.policyDate)}) but prime is still <b>${pc(SPREAD.prime, 2)}</b>. Prime normally sits ${SPREAD.typical.toFixed(2)} points above the policy rate, so it should move to about <b>${pc(SPREAD.expectedPrime, 2)}</b>, usually within days. Variable payments follow your lender\u2019s prime.</div>`);
    }
    if (a && a.date) {
      const age = (now() - new Date(a.date + 'T12:00:00')) / 864e5, fresh = age <= 7;
      out.push(`<div class="ec8-ann ${fresh ? 'fresh' : ''}"><b>${fresh ? 'New from the Bank:' : 'Latest rate announcement:'}</b> <a href="${e(safeUrl(a.link))}" target="_blank" rel="noopener">${e(a.title)}</a> <span class="mute">\u00B7 ${fmtDay(a.date)}</span></div>`);
    }
    const sched = SCHEDULE.live ? `Dates read live from the Bank${SCHEDULE.published ? ' (schedule published ' + fmtDay(SCHEDULE.published) + ')' : ''}` : `Dates from the Bank\u2019s published schedule (${fmtDay(SCHEDULE.published)}); couldn\u2019t re-check just now`;
    out.push(`<div class="small mute ec8-official">${sched} \u00B7 Official: <a href="${e(SCHEDULE.link)}" target="_blank" rel="noopener">announcement schedule</a> \u00B7 <a href="https://www.bankofcanada.ca/press/press-releases/" target="_blank" rel="noopener">all Bank announcements</a></div>`);
    return out.join('');
  }
  window.rateStrip = function () {
    if (typeof RATES === 'undefined' || !RATES || !RATES.prime) return `<div class="note">Live rates couldn't load. Using your saved rate of <b>${pc(S.rate, 2)}</b>. <a href="#" onclick="loadRates(true);return false">Try again</a></div>`;
    const cell = (l, o, hint, showDate) => o ? `<div class="card flat kpi"><div class="l">${l}</div><div class="v">${pc(o.value, 2)}</div><div class="h">${o.change ? `<span class="delta ${o.change > 0 ? 'neg' : 'pos'}" title="Last move${o.lastChange ? ' on ' + fmtDay(o.lastChange) : ''}">${o.change > 0 ? '\u25B2' : '\u25BC'} ${Math.abs(o.change).toFixed(2)}${showDate && o.lastChange ? ' \u00B7 ' + fmtDay(o.lastChange) : ''}</span> ` : '<span class="delta">no change</span> '}${hint}</div></div>` : '';
    const nb = nextBoC(), nd = nb ? daysUntil(nb) : null, P = RATES.prime;
    const stale = P.date && (now() - new Date(P.date + 'T12:00:00')) / 864e5 > 10;
    const usd = RATES.usdcad ? `<div class="card flat kpi"><div class="l">USD \u2192 CAD</div><div class="v">${(+RATES.usdcad.value).toFixed(4)}</div><div class="h">1 US$ in Canadian $</div></div>` : '';
    const boc = nb ? `<div class="card flat kpi ec8-boc"><div class="l">Next BoC decision</div><div class="v">${fmtDay(nb).replace(/, \d{4}/, '')}</div><div class="h">${nd === 0 ? '<b>Today</b>, 9:45 a.m. ET' : `in ${nd} day${nd === 1 ? '' : 's'}`} \u00B7 prime follows</div></div>` : '';
    const since = P.lastChange ? `Prime last changed <b>${fmtDay(P.lastChange)}</b>` : P.sameSince ? `Prime unchanged since at least <b>${fmtDay(P.sameSince)}</b>` : `Prime is <b>${pc(P.value, 2)}</b>`;
    return `<div class="grid ec8-rates">${cell('Prime rate', P, 'variable rates follow this', true)}${cell('BoC policy rate', RATES.policy, 'sets prime', true)}${cell('5-yr bond yield', RATES.bond5, 'drives fixed rates')}${cell('5-yr posted rate', RATES.fiveYearPosted, 'big-bank posted', true)}${usd}${boc}</div>
    <div class="small mute ec8-ratesline" style="margin-top:8px"><span class="dot ${stale || lastErr ? 'off' : ''}"></span>${since} (it only changes when the Bank changes its rate) \u00B7 Bank of Canada reading dated ${fmtDay(P.date)} \u00B7 ${checking ? 'checking now\u2026' : lastErr ? e(lastErr) : 'checked ' + (lastCheck ? fmtTime(lastCheck) : '\u2014')}${srcLine()}
    ${stale ? ' \u00B7 <a href="#" onclick="loadRates(true);return false">Data looks old, refresh</a>' : ''}</div>${bocLive()}`;
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
    status: () => ({ last: lastCheck, err: lastErr, busy: checking, diag, schedule: SCHEDULE, announcements: ANN, spread: SPREAD })
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
