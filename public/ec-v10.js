/* EquityClimb v10 (v11 build) - add-on. Loads LAST. Only adds / re-orders; nothing existing is removed.
   1. Home: Financial health check + Today's money minute move to the bottom
   2. Budget: the five groups sit in two equal columns under the summary bar, in order 1-2-3-4-5
   3. Market: editable watchlist (add / remove any stock, ETF, index, crypto), working Refresh for rates AND prices
   4. Copilot: pick the AI model, chats are saved to History, every new visit starts a fresh chat
   5. Learn: a new AI lesson every day, "learn anything" on demand, and live articles from the web
   6. Menu: Market and Neighbourhoods sit right under Goals */
(function () {
  'use strict';
  if (window.__ec10) return;
  window.__ec10 = true;
  if (typeof S === 'undefined' || typeof V === 'undefined') return;

  /* ============================== helpers ============================== */
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const mdx = t => E(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const pad = n => String(n).padStart(2, '0');
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const jparse = (s, f) => { try { const v = JSON.parse(s); return v == null ? f : v; } catch (_) { return f; } };
  const toast = m => { if (window.EC7 && EC7.toast) EC7.toast(m); };
  const tpl = h => { const t = document.createElement('template'); t.innerHTML = h; return t.content; };
  const ser = f => { const d = document.createElement('div'); d.appendChild(f); return d.innerHTML; };
  const icon = n => (typeof ic === 'function' ? ic(n) : '');
  const clock = t => new Date(t).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  const cv = () => (typeof cur !== 'undefined' ? cur : '');

  const DEFAULT_WATCH = [{ s: '^GSPTSE', n: 'TSX Composite' }, { s: '^GSPC', n: 'S&P 500' }, { s: 'CL=F', n: 'Oil (WTI)' }, { s: 'GC=F', n: 'Gold' }];
  function st() {
    const s = S.ec10 = S.ec10 || {};
    if (!Array.isArray(s.watch)) s.watch = DEFAULT_WATCH.map(x => ({ ...x }));
    if (!s.model) s.model = 'balanced';
    if (!Array.isArray(s.chats)) s.chats = [];
    if (!s.lessons || typeof s.lessons !== 'object') s.lessons = {};
    if (!Array.isArray(s.lessonOrder)) s.lessonOrder = [];
    return s;
  }
  st();

  /* ============================== 1. HOME ============================== */
  if (typeof V.home === 'function') {
    const home0 = V.home;
    V.home = function () {
      const html = home0.apply(this, arguments);
      try {
        const f = tpl(html), top = f.querySelector('.ec-top');
        if (!top) return html;
        const parent = top.parentNode, next = top.nextElementSibling;
        if (next && next.classList.contains('sp')) next.remove();
        const foot = [...parent.children].filter(c => c.classList && c.classList.contains('foot')).pop();
        const sp = document.createElement('div'); sp.className = 'sp';
        if (foot) { parent.insertBefore(sp, foot); parent.insertBefore(top, foot); } else { parent.appendChild(sp); parent.appendChild(top); }
        return ser(f);
      } catch (_) { return html; }
    };
  }

  /* ============================== 2. BUDGET ============================== */
  const NUM = /^\s*([1-5])\s*[\u00B7\u2022.\-\u2013:)]\s*\S/;
  function numberedHeads(f) {
    for (const sel of ['h1,h2,h3,h4,h5,h6,legend,summary,.title,[class*="title"]', '*']) {
      const seen = new Map();
      f.querySelectorAll(sel).forEach(el => {
        const t = (el.textContent || '').trim(); if (t.length > 60) return;
        const m = t.match(NUM); if (m && !seen.has(+m[1])) seen.set(+m[1], el);
      });
      if (seen.size >= 3) return seen;
    }
    return null;
  }
  const emptyShell = el => !el.children.length && !(el.textContent || '').trim();
  /* Finds the five numbered cards, lifts them out of whatever columns the page put them in, and places them in ONE
     full-width two-column grid right under the summary bar: 1 | 2, 3 | 4, then 5 across the full width. */
  function fixBudget(html) {
    const f = tpl(html), seen = numberedHeads(f);
    if (!seen) return html;
    const heads = [...seen.values()];
    const cardOf = h => { let c = h; while (c.parentElement && heads.every(o => o === h || !c.parentElement.contains(o))) c = c.parentElement; return c; };
    const cards = [...seen.keys()].sort((a, b) => a - b).map(n => ({ n, el: cardOf(seen.get(n)) }));
    if (new Set(cards.map(c => c.el)).size !== cards.length) return html;
    let box = cards[0].el.parentNode;
    while (box && !cards.every(c => box.contains(c.el))) box = box.parentNode;
    if (!box) return html;
    let ref = cards[0].el; while (ref.parentNode !== box) ref = ref.parentNode;
    const grid = document.createElement('div'); grid.className = 'ec10-budget';
    box.insertBefore(grid, ref);
    const oldParents = cards.map(c => c.el.parentNode);
    cards.forEach(c => { c.el.classList.add('ec10-bcard'); c.el.dataset.n = String(c.n); grid.appendChild(c.el); });
    oldParents.forEach(p => { let x = p; while (x && x !== box && x !== grid && x.nodeType === 1 && emptyShell(x)) { const up = x.parentNode; x.remove(); x = up; } });
    if (box.nodeType === 1) box.classList.add('ec10-bbox');
    return ser(f);
  }
  if (typeof V.budget === 'function') {
    const budget0 = V.budget;
    V.budget = function () { const html = budget0.apply(this, arguments); try { return fixBudget(html); } catch (_) { return html; } };
  }

  /* ============================== 6. MENU ORDER ============================== */
  /* Market and Neighbourhoods move up so they sit directly under Goals (above the dividing line). */
  function reorderNav() {
    const side = document.getElementById('side'); if (!side) return;
    const btns = [...side.querySelectorAll('button.nav, a.nav')], by = l => btns.find(b => (b.textContent || '').trim().toLowerCase() === l);
    const goals = by('goals'), market = by('market'), areas = by('neighbourhoods');
    if (!goals || !market || !areas) return;
    if (goals.nextElementSibling === market && market.nextElementSibling === areas) return;
    goals.after(market); market.after(areas);
  }

  /* ============================== 3. MARKET: watchlist + refresh ============================== */
  const SUGG = [['RY.TO', 'Royal Bank'], ['TD.TO', 'TD Bank'], ['ENB.TO', 'Enbridge'], ['CNQ.TO', 'Canadian Natural'], ['SU.TO', 'Suncor'], ['SHOP.TO', 'Shopify'], ['XIU.TO', 'TSX 60 ETF'], ['VFV.TO', 'S&P 500 ETF'], ['AAPL', 'Apple'], ['MSFT', 'Microsoft'], ['NVDA', 'NVIDIA'], ['BTC-USD', 'Bitcoin'], ['USDCAD=X', 'USD/CAD']];
  let Q = jparse(localStorage.getItem('ec10_q'), null), qBusy = false, qErr = '', editing = false, snapBusy = false;
  /* Prices of 10,000 or more (like the TSX) show with no decimals. (Asking for "at least 2 decimals but at most 0"
     was an error that crashed the Market page, so the minimum is now always <= the maximum.) */
  function fmtPrice(v) {
    v = +v; if (!isFinite(v)) return '\u2014';
    const big = Math.abs(v) >= 10000, maxD = big ? 0 : Math.abs(v) < 10 ? 4 : 2;
    try { return new Intl.NumberFormat('en-CA', { minimumFractionDigits: Math.min(big ? 0 : 2, maxD), maximumFractionDigits: maxD }).format(v); } catch (_) { return String(Math.round(v * 100) / 100); }
  }

  async function fetchQuotes(force) {
    const w = st().watch;
    if (!w.length) { Q = { items: [], missing: [], t: Date.now() }; paintSnap(); return; }
    qBusy = true; paintStatus();
    try {
      const r = await fetch('/api/quotes?symbols=' + encodeURIComponent(w.map(x => x.s).join(',')) + (force ? '&fresh=1' : '') + '&_=' + Date.now(), { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !Array.isArray(j.items)) throw new Error('bad');
      Q = { items: j.items, missing: j.missing || [], t: Date.now() };
      localStorage.setItem('ec10_q', JSON.stringify(Q)); qErr = '';
      let changed = false;
      j.items.forEach(i => { const x = w.find(y => y.s === i.symbol); if (x && (!x.n || x.n === x.s) && i.name && i.name !== i.symbol) { x.n = i.name; changed = true; } });
      if (changed) save();
    } catch (_) { qErr = 'Couldn\u2019t load prices right now.'; }
    qBusy = false; paintSnap();
  }
  async function refreshSnap() {
    if (snapBusy) return;
    snapBusy = true; paintStatus();
    try { await Promise.all([window.EC8 && EC8.refreshRates ? EC8.refreshRates() : Promise.resolve(), fetchQuotes(true)]); } catch (_) { /* each part reports its own error */ }
    snapBusy = false; paintSnap();
  }
  function statusText() {
    if (snapBusy || qBusy) return 'Updating rates and prices\u2026';
    const s = window.EC8 && EC8.status ? EC8.status() : {}, bits = [];
    bits.push(s.err ? 'Rates: couldn\u2019t reach the Bank of Canada' : s.last ? 'Rates checked ' + clock(s.last) : '');
    bits.push(qErr ? qErr : Q && Q.t ? 'Prices updated ' + clock(Q.t) : '');
    return bits.filter(Boolean).join(' \u00B7 ');
  }
  function paintStatus() { const el = document.getElementById('ec10-snap-status'); if (el) el.textContent = statusText(); }
  function tile(w, q) {
    const x = editing ? `<button class="ec10-x" data-s="${E(w.s)}" onclick="EC10.remove(this.dataset.s)" aria-label="Remove ${E(w.n || w.s)}">\u00D7</button>` : '';
    if (!q || !isFinite(+q.value)) return `<div class="card flat kpi ec10-tile"><div class="l">${E(w.n || w.s)} <span class="ec10-sym">${E(w.s)}</span>${x}</div><div class="v mute">\u2014</div><div class="h">No price yet</div></div>`;
    const pctv = q.changePct == null ? null : +q.changePct, up = (pctv || 0) >= 0, cur0 = q.currency && q.currency !== 'CAD' ? ` <span class="ec10-cur">${E(q.currency)}</span>` : '';
    const ts=Number(q.time), validTime=Number.isFinite(ts)&&ts>0&&ts<=Date.now()+300000;
    const age=validTime?(Date.now()-ts)/60000:Infinity;
    const stamp=validTime?new Date(ts).toLocaleString('en-CA',{timeZone:'UTC',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC':'timestamp unavailable';
    const asof='<div class="ec10-quote-asof">'+E(q.provider||'Market data vendor')+' · '+E(stamp)+(age>15?' · delayed/last close':'')+'</div>';
    return `<div class="card flat kpi ec10-tile"><div class="l">${E(w.n || q.name || w.s)} <span class="ec10-sym">${E(w.s)}</span>${x}</div>
      <div class="v">${fmtPrice(q.value)}${cur0}</div>
      <div class="h">${pctv == null || !isFinite(pctv) ? '' : `<span class="delta ${up ? 'pos' : 'neg'}">${up ? '\u25B2' : '\u25BC'} ${Math.abs(pctv).toFixed(2)}%</span> `}${q.open ? '<span class="tag pos">Open</span>' : '<span class="tag" title="Markets are closed, so the price shows the last close">Closed</span>'}</div>${asof}</div>`;
  }
  function wlHtml() {
    const w = st().watch, by = {}; ((Q && Q.items) || []).forEach(i => { by[i.symbol] = i; });
    const anyOpen = ((Q && Q.items) || []).some(i => i.open);
    const have = new Set(w.map(x => x.s));
    return `<div class="ec10-wl">
      <div class="ec10-wl-head"><div><h2>Watchlist</h2><div class="small mute">Your own list of markets, stocks and funds. Add or remove anything.</div></div>
        <div class="row"><button class="btn ghost sm refresh-btn ec10-refresh" onclick="EC10.refreshSnap()">${icon('refresh')}Refresh rates &amp; prices</button><button class="btn ghost sm" onclick="EC10.edit()">${editing ? 'Done' : 'Edit list'}</button></div></div>
      ${w.length ? `<div class="grid ec10-q">${w.map(x => tile(x, by[x.s])).join('')}</div>` : '<div class="note">Your watchlist is empty. Choose Edit list to add something.</div>'}
      ${editing ? `<div class="card flat ec10-addbox"><label for="ec10-wl-q">Add to your watchlist</label>
        <div class="ec10-add"><input id="ec10-wl-q" type="text" maxlength="40" autocomplete="off" placeholder="Search a company, fund or symbol (e.g. Royal Bank, AAPL, XIU.TO)" oninput="EC10.search(this.value)" onkeydown="if(event.key==='Enter')EC10.addTyped(this.value)"><button class="btn sm" onclick="EC10.addTyped(document.getElementById('ec10-wl-q').value)">Add</button></div>
        <div id="ec10-wl-res"></div>
        <div class="small mute" style="margin:10px 0 6px">Quick add</div>
        <div class="row">${SUGG.filter(s => !have.has(s[0])).map(s => `<button class="chip" data-s="${E(s[0])}" data-n="${E(s[1])}" onclick="EC10.add(this.dataset.s,this.dataset.n)">+ ${E(s[1])}</button>`).join('')}</div>
        <div class="small" style="margin-top:10px"><a href="#" onclick="EC10.resetList();return false">Reset to the standard four</a></div></div>` : ''}
      <div class="small mute" style="margin-top:8px"><span id="ec10-snap-status">${E(statusText())}</span>${Q && Q.items && Q.items.length ? ` \u00B7 ${anyOpen ? 'Prices can be delayed 15+ minutes.' : 'Markets are closed, so prices show the last close and won\u2019t move until they reopen.'}` : ''}</div>
    </div>`;
  }
  const strip0 = window.rateStrip;
  /* The rate strip and the watchlist are drawn separately, so a problem in one can never take down the page or the other. */
  const snapInner = () => {
    let a = '', b = '';
    try { a = typeof strip0 === 'function' ? strip0() : ''; } catch (err) { console.error(err); a = '<div class="note">Live rates couldn\u2019t be shown. <a href="#" onclick="loadRates(true);return false">Try again</a></div>'; }
    if (cv() === 'market') {
      try { b = wlHtml(); } catch (err) { console.error(err); b = '<div class="note" style="margin-top:14px">The watchlist hit a problem. <a href="#" onclick="EC10.resetList();return false">Reset it</a></div>'; }
    }
    return a + b;
  };
  window.rateStrip = function () { return `<div id="ec10-snap">${snapInner()}</div>`; };
  function paintSnap() {
    const el = document.getElementById('ec10-snap'); if (!el) return;
    const a = document.activeElement; if (a && a.id === 'ec10-wl-q' && a.value) { paintStatus(); return; }
    try {
      // Always render through the CURRENT rateStrip wrapper. Later modules (v16+)
      // decorate the rate cards, but the old snapInner() closure bypassed them
      // every time Refresh rates & prices or quote refresh called paintSnap().
      const updated = typeof window.rateStrip === 'function' ? window.rateStrip() : '';
      if (updated) {
        const t=document.createElement('template');t.innerHTML=updated;
        const root=t.content.querySelector('#ec10-snap');
        el.innerHTML=root ? root.innerHTML : updated;
      } else el.innerHTML=snapInner();
      const chip = document.querySelector('.ratechip b');
      if (chip) {
        const confirmed = typeof RATES !== 'undefined' && RATES?.primeAnnouncement?.confirmed ? RATES.primeAnnouncement : null;
        if (confirmed && Number.isFinite(+confirmed.value)) chip.textContent=pct(confirmed.value,2);
        else if (typeof prime === 'function' && prime()) chip.textContent=pct(prime(),2);
        const label=Array.from(chip.parentNode.childNodes).find(n=>n.nodeType===3);
        if(label)label.textContent=confirmed ? 'Prime · '+confirmed.effectiveDate : 'Prime rate';
      }
    } catch (err) { console.error(err); }
  }
  window.EC8_PAINT = paintSnap;

  let searchTimer = 0, searchSeq = 0;
  function doSearch(v) {
    clearTimeout(searchTimer);
    const out = document.getElementById('ec10-wl-res'); v = String(v || '').trim();
    if (!out) return;
    if (v.length < 2) { out.innerHTML = ''; return; }
    out.innerHTML = '<div class="small mute" style="margin-top:8px">Searching\u2026</div>';
    const seq = ++searchSeq;
    searchTimer = setTimeout(async () => {
      try {
        const r = await fetch('/api/quotes?q=' + encodeURIComponent(v), { cache: 'no-store' }), j = await r.json();
        if (seq !== searchSeq) return;
        if (j.error) { out.innerHTML = `<div class="small mute" style="margin-top:8px">${E(j.error)}</div>`; return; }
        if (!j.results || !j.results.length) { out.innerHTML = '<div class="small mute" style="margin-top:8px">No matches. Try the exact symbol, for example RY.TO.</div>'; return; }
        out.innerHTML = j.results.map(x => `<button class="ec10-res" data-s="${E(x.symbol)}" data-n="${E(x.name)}" onclick="EC10.add(this.dataset.s,this.dataset.n)"><b>${E(x.symbol)}</b><span>${E(x.name)}</span><i>${E(x.exchange)}</i></button>`).join('');
      } catch (_) { if (seq === searchSeq) out.innerHTML = '<div class="small mute" style="margin-top:8px">Search isn\u2019t available right now. Type a symbol (like RY.TO) and press Add.</div>'; }
    }, 300);
  }
  async function addSym(sym, name) {
    sym = String(sym || '').trim().toUpperCase();
    if (!/^[A-Z0-9.^=\-]{1,18}$/.test(sym)) { toast('That doesn\u2019t look like a symbol.'); return; }
    const w = st().watch;
    if (w.some(x => x.s === sym)) { toast('Already in your watchlist.'); return; }
    if (w.length >= 20) { toast('Your watchlist is full (20 max). Remove one first.'); return; }
    w.push({ s: sym, n: name || sym }); save();
    const q = document.getElementById('ec10-wl-q'); if (q) q.value = '';
    const res = document.getElementById('ec10-wl-res'); if (res) res.innerHTML = '';
    await fetchQuotes(true);
    if (Q && Q.missing && Q.missing.includes(sym)) { st().watch = st().watch.filter(x => x.s !== sym); save(); toast(`Couldn\u2019t find a price for ${sym}. Check the symbol.`); paintSnap(); } else toast(`${name || sym} added.`);
  }
  async function addTyped(t) {
    t = String(t || '').trim(); if (!t) return;
    try {
      const r = await fetch('/api/quotes?q=' + encodeURIComponent(t), { cache: 'no-store' }), j = await r.json(), list = j.results || [];
      const hit = list.find(x => x.symbol.toUpperCase() === t.toUpperCase()) || list[0];
      if (hit) return addSym(hit.symbol, hit.name);
    } catch (_) { /* fall through to treating it as a symbol */ }
    if (/^[A-Za-z0-9.^=\-]{1,18}$/.test(t)) return addSym(t);
    toast('No match found. Try the symbol, for example RY.TO.');
  }

  /* ============================== 4. COPILOT ============================== */
  const MODELS = [
    ['balanced', 'Balanced \u2014 Llama 3.3 70B (default)', 'Good all-round answers. Recommended for most questions.'],
    ['fast', 'Fast \u2014 Llama 3.1 8B', 'Quickest, and lightest on your free daily AI allowance. Best for simple questions.'],
    ['gemma', 'Smart \u2014 Gemma 4 26B', 'Google\u2019s newer model. Clear, careful explanations.'],
    ['mistral', 'Mistral Small 3.1 24B', 'Short, well-structured answers.'],
    ['gptoss', 'Deep \u2014 GPT-OSS 120B', 'Best for tricky decisions. Slower and uses more of the free allowance.'],
    ['reason', 'Reasoning \u2014 DeepSeek R1 32B', 'Works through problems step by step. Slower.']
  ];
  const modelName = k => (MODELS.find(m => m[0] === k) || MODELS[0])[1].split(' \u2014 ')[0].replace(' (default)', '');
  let histOpen = false;

  function archiveCurrent() {
    if (!Array.isArray(S.chat) || !S.chat.length) return false;
    const s = st(), first = S.chat.find(m => m.role === 'user');
    if (first) {
      s.chats.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: String(first.content).replace(/\s+/g, ' ').trim().slice(0, 70) || 'Chat', model: s.model, t: Date.now(), msgs: S.chat.slice(-60).map(m => ({ role: m.role, content: m.content, followups: m.followups || [] })) });
      while (s.chats.length > 30) s.chats.pop();
      while (JSON.stringify(s.chats).length > 300000 && s.chats.length > 1) s.chats.pop();
    }
    S.chat = []; save();
    return true;
  }
  function histHtml() {
    const h = st().chats;
    if (!h.length) return '<div class="small mute">No saved chats yet. Your conversations are saved here automatically when you start a new chat or reopen the app.</div>';
    return h.map(c => `<div class="ec10-hi"><div class="ec10-hi-main" data-id="${E(c.id)}" onclick="EC10.openChat(this.dataset.id)"><b>${E(c.title)}</b><div class="small mute">${new Date(c.t).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} \u00B7 ${c.msgs.length} message${c.msgs.length === 1 ? '' : 's'} \u00B7 ${E(modelName(c.model))}</div></div>
      <button class="btn ghost sm" data-id="${E(c.id)}" onclick="EC10.openChat(this.dataset.id)">Open</button><button class="btn ghost sm" data-id="${E(c.id)}" onclick="EC10.delChat(this.dataset.id)">Delete</button></div>`).join('') +
      `<div style="margin-top:10px"><a class="small" href="#" onclick="EC10.clearHist();return false">Delete all saved chats</a></div>`;
  }
  function toolbar() {
    const s = st(), m = MODELS.find(x => x[0] === s.model) || MODELS[0];
    return `<div class="ec10-bar"><div class="ec10-model"><label for="ec10-model">AI model</label>
      <select id="ec10-model" onchange="EC10.setModel(this.value)">${MODELS.map(x => `<option value="${x[0]}" ${x[0] === s.model ? 'selected' : ''}>${E(x[1])}</option>`).join('')}</select>
      <div class="hint" id="ec10-model-hint">${E(m[2])}</div></div>
      <div class="row"><button class="btn ghost sm" onclick="EC10.newChat()">+ New chat</button><button class="btn ghost sm" onclick="EC10.toggleHist()">History (${s.chats.length})</button></div></div>
      <div id="ec10-hist" class="card ec10-hist" style="display:${histOpen ? 'block' : 'none'}">${histHtml()}</div>`;
  }
  if (typeof V.advisor === 'function') {
    const adv0 = V.advisor;
    V.advisor = function () {
      const html = adv0.apply(this, arguments);
      try { const f = tpl(html), chat = f.querySelector('.card.chat') || f.querySelector('.chat'); if (!chat) return html; chat.insertAdjacentHTML('beforebegin', toolbar()); return ser(f); } catch (_) { return html; }
    };
  }
  // chat messages go to /api/ai-chat (model choice); if that file isn't there yet we quietly use the original /api/ai
  const fetch0 = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      const u = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (u.origin === location.origin && u.pathname === '/api/ai' && init && init.method === 'POST' && typeof init.body === 'string') {
        const b = JSON.parse(init.body);
        if (b.mode === 'chat') {
          b.model = st().model || 'balanced';
          return fetch0('/api/ai-chat', { ...init, body: JSON.stringify(b) }).then(r => {
            if (!r.ok && (r.status === 404 || r.status === 405)) return fetch0(input, init);
            if (!/json/i.test(r.headers.get('content-type') || '')) return fetch0(input, init);
            r.clone().json().then(j => { if (j && j.fallback) toast('That model wasn\u2019t available, so the default was used.'); }).catch(() => { /* ignore */ });
            return r;
          }).catch(() => fetch0(input, init));
        }
      }
    } catch (_) { /* fall through to the normal request */ }
    return fetch0.apply(null, arguments);
  };

  /* ============================== 5. LEARN ============================== */
  const T = { open: null, q: {}, today: null, todayBusy: false, todayErr: '', feed: null, feedBusy: false, feedErr: '', topic: 'all', genBusy: false, genErr: '' };
  const FEED_TOPICS = [['all', 'Everything'], ['mortgage', 'Mortgages'], ['tax', 'Taxes & accounts'], ['invest', 'Investing'], ['debt', 'Debt & credit'], ['home', 'Home buying'], ['budget', 'Budgeting']];
  const LV = ['Starter', 'Saver', 'Planner', 'Builder', 'Strategist', 'Money Pro'];
  const lvl = x => LV[Math.min(Math.floor(x / 100), LV.length - 1)];
  const skel = (n = 3) => Array.from({ length: n }, (_, k) => `<div class="skel" style="width:${92 - k * 14}%"></div>`).join('');
  function addXP(p, why) {
    const L = S.ec7 && S.ec7.learn; if (!L) return;
    const t = todayKey();
    if (L.lastDay !== t) { const y = new Date(); y.setDate(y.getDate() - 1); L.streak = L.lastDay === todayKey(y) ? (L.streak || 0) + 1 : 1; L.lastDay = t; L.best = Math.max(L.best || 0, L.streak); }
    const b = lvl(L.xp || 0); L.xp = (L.xp || 0) + p; save();
    const a = lvl(L.xp); toast(a !== b ? `Level up! You\u2019re now a ${a}.` : `+${p} XP \u00B7 ${why}`);
  }
  function saveLesson(L, done) {
    const s = st(), prev = s.lessons[L.id];
    s.lessons[L.id] = { ...L, done: Math.max(done, prev ? prev.done || 0 : 0), t: Date.now() };
    s.lessonOrder = [L.id, ...s.lessonOrder.filter(x => x !== L.id)];
    while (s.lessonOrder.length > 40) { const old = s.lessonOrder.pop(); delete s.lessons[old]; }
    save();
  }
  const lessonByKey = k => (k === 'today' ? T.today : st().lessons[String(k).replace(/^mine:/, '')]);

  function todayHtml() {
    if (T.today) {
      const L = T.today, rec = st().lessons[L.id];
      return `<div class="head"><div><div class="eyebrow">New today \u00B7 ${E(L.topic)} \u00B7 ${L.mins} min</div><h2 style="font-size:20px;margin-top:6px">${E(L.title)}</h2></div><span class="tag acc" title="Written by AI from today\u2019s news and this year\u2019s Canadian rules">AI \u00B7 new every day</span></div>
        ${L.hook ? `<div class="small mute" style="margin-bottom:12px">${E(L.hook)}</div>` : ''}
        <div class="row"><button class="btn" onclick="EC10.openLesson('today')">${rec && rec.done ? 'Review lesson' : 'Start lesson'}</button>${rec && rec.done ? `<span class="tag pos">\u2713 Done${rec.done === 2 ? ' \u00B7 perfect quiz' : ''}</span>` : ''}</div>`;
    }
    if (T.todayBusy) return `<div class="eyebrow">New today</div><div style="margin-top:8px">${skel(3)}</div><div class="small mute">Writing today\u2019s lesson\u2026</div>`;
    return `<div class="eyebrow">New today</div><div class="small mute" style="margin:8px 0 10px">${E(T.todayErr || 'Today\u2019s lesson isn\u2019t ready yet.')}</div><button class="btn ghost sm" onclick="EC10.loadToday(true)">Try again</button>`;
  }
  function feedHtml() {
    const tabs = `<div class="seg ec10-feedtabs">${FEED_TOPICS.map(([k, l]) => `<button class="${T.topic === k ? 'on' : ''}" onclick="EC10.feedTopic('${k}')">${E(l)}</button>`).join('')}</div>`;
    let body;
    if (T.feed && T.feed.items && T.feed.items.length) {
      body = T.feed.items.slice(0, 8).map((x, i) => `<div class="it"><div style="flex:1"><a href="${E(x.link)}" target="_blank" rel="noopener">${E(x.title)}</a><div class="meta">${E(x.source || '')}${x.date && typeof ago === 'function' ? ' \u00B7 ' + ago(x.date) : ''} \u00B7 <a href="#" data-i="${i}" onclick="EC10.explain(+this.dataset.i);return false">Explain simply</a></div></div></div>`).join('');
    } else if (T.feedBusy) body = skel(4);
    else body = `<div class="small mute" style="padding:10px 0">${E(T.feedErr || 'Nothing new yet. Tap Refresh.')}</div>`;
    return tabs + `<div class="list">${body}</div>${T.feed && T.feed.fetched ? `<div class="small mute" style="margin-top:6px">Updated ${typeof ago === 'function' ? ago(T.feed.fetched) : ''}. Links open the original publisher.</div>` : ''}`;
  }
  function mineHtml() {
    const s = st(), ids = s.lessonOrder.filter(id => s.lessons[id]).slice(0, 8);
    if (!ids.length) return '';
    return `<div class="small mute" style="margin:16px 0 6px">Your AI lessons</div>` + ids.map(id => { const l = s.lessons[id]; return `<div class="ec10-mine" data-k="mine:${E(id)}" onclick="EC10.openLesson(this.dataset.k)"><span>${E(l.title)}</span>${l.done ? `<span class="tag pos">\u2713${l.done === 2 ? ' perfect' : ''}</span>` : '<span class="tag">New</span>'}</div>`; }).join('');
  }
  function liveBlock() {
    const L = (S.ec7 && S.ec7.learn) || { done: {} }, total = ((window.EC_LEARN && EC_LEARN.lessons) || []).length, done = Object.keys(L.done || {}).length;
    const chips = ['What is a HELOC?', 'Should I pay off debt or invest?', 'How do capital gains work?', 'What is the mortgage stress test?'];
    return `<div class="ec10-live">
      ${total && done >= total ? `<div class="note" style="margin-bottom:14px"><b>You\u2019ve finished all ${total} core lessons.</b> Learning never stops here: a new AI lesson arrives every day, and you can ask for a lesson on anything below.</div>` : ''}
      <div class="card ec10-todaycard" id="ec10-today">${todayHtml()}</div><div class="sp"></div>
      <div class="grid g2">
        <div class="card"><h2>Learn anything</h2><div class="small mute">Type any money question and get a short lesson with a quiz, written for you in seconds.</div>
          <div class="ec10-add" style="margin-top:12px"><input id="ec10-topic" type="text" maxlength="90" placeholder="e.g. How does the FHSA work?" onkeydown="if(event.key==='Enter')EC10.gen()"><button class="btn sm" id="ec10-gen-btn" onclick="EC10.gen()">Create lesson</button></div>
          <div id="ec10-gen-out" class="small" style="margin-top:8px"></div>
          <div class="row" style="margin-top:10px">${chips.map(c => `<button class="chip" data-t="${E(c)}" onclick="EC10.genFrom(this.dataset.t)">${E(c)}</button>`).join('')}</div>
          <div id="ec10-mine">${mineHtml()}</div></div>
        <div class="card news"><div class="head"><div><h2>Live from the web</h2><div class="small mute">Fresh Canadian money articles, updated all day</div></div><button class="btn ghost sm refresh-btn" onclick="EC10.feedRefresh()">${icon('refresh')}Refresh</button></div><div id="ec10-feed">${feedHtml()}</div></div>
      </div></div><div class="sp"></div>`;
  }
  function lessonView(L) {
    const q = T.q[L.id] || {}, answered = L.quiz.every((_, k) => q[k] != null), score = L.quiz.filter((x, k) => q[k] === x.c).length;
    const head1 = typeof head === 'function' ? head(`${E(L.topic || 'Lesson')} \u00B7 ${L.mins} min \u00B7 AI lesson`, E(L.title)) : `<h1>${E(L.title)}</h1>`;
    return `<div style="max-width:720px"><a href="#" onclick="EC10.closeLesson();return false">\u2190 All lessons</a>${head1}
      <div class="card ec-body">${L.hook ? `<p><b>${mdx(L.hook)}</b></p>` : ''}${L.body.map(p => `<p>${mdx(p)}</p>`).join('')}
        ${L.takeaway ? `<div class="note" style="margin-bottom:14px"><b>Key idea:</b> ${mdx(L.takeaway)}</div>` : ''}${L.action ? `<p><b>Try this week:</b> ${mdx(L.action)}</p>` : ''}
        ${(L.sources || []).length ? `<div class="small mute" style="margin-top:6px">In the news: ${(L.sources || []).map(s => `<a href="${E(s.link)}" target="_blank" rel="noopener">${E(s.title)}</a>${s.source ? ' (' + E(s.source) + ')' : ''}`).join(' \u00B7 ')}</div>` : ''}
        <div class="small mute" style="margin-top:10px">Written by AI using this year\u2019s Canadian rules. General education only, not personal advice.</div></div><div class="sp"></div>
      <div class="card"><h2>Quick check</h2>${L.quiz.map((x, k) => `<div class="ec-q"><div class="ec-qq">${k + 1}. ${E(x.q)}</div>
        ${x.a.map((a, j) => { const picked = q[k] === j, show = q[k] != null; return `<button class="ec-opt ${show && j === x.c ? 'right' : ''} ${picked && j !== x.c ? 'wrong' : ''}" ${show ? 'disabled' : ''} onclick="EC10.answer(${k},${j})">${E(a)}</button>`; }).join('')}
        ${q[k] != null ? `<div class="small ${q[k] === x.c ? 'pos' : 'warn'}" style="margin-top:6px">${q[k] === x.c ? 'Correct. ' : 'Not quite. '}${E(x.why)}</div>` : ''}</div>`).join('')}
        ${answered ? `<div class="note" style="margin-top:14px"><b>${score} of ${L.quiz.length} correct.</b> ${score === L.quiz.length ? 'Perfect!' : 'Nice work, the explanation above is the key idea.'}</div>
          <div class="row" style="margin-top:12px"><button class="btn" onclick="EC10.closeLesson()">Back to lessons</button><button class="btn ghost" onclick="EC10.askAbout()">${icon('ai')} Ask Copilot about this</button></div>` : ''}</div></div>`;
  }

  async function loadToday(force) {
    const d = todayKey(), key = 'ec10_today_' + d;
    Object.keys(localStorage).filter(k => k.startsWith('ec10_today_') && k !== key).forEach(k => localStorage.removeItem(k));
    if (!force) { const c = jparse(localStorage.getItem(key), null); if (c && c.id && c.quiz) { T.today = c; paintToday(); return; } }
    if (T.todayBusy) return;
    T.todayBusy = true; T.todayErr = ''; paintToday();
    try {
      const r = await fetch('/api/learn?mode=today&d=' + d + (force ? '&fresh=1' : ''), { cache: 'no-store' }), j = await r.json();
      if (!r.ok || !j.lesson) throw new Error(j.error || 'fail');
      T.today = j.lesson; localStorage.setItem(key, JSON.stringify(j.lesson));
    } catch (e) { T.todayErr = (e && e.message && e.message !== 'fail' && e.message !== 'Failed to fetch') ? e.message : 'Couldn\u2019t load today\u2019s lesson. Check your connection and try again.'; }
    T.todayBusy = false; paintToday();
  }
  async function loadFeed(force) {
    const topic = T.topic, key = 'ec10_feed_' + topic;
    if (!force) { const c = jparse(localStorage.getItem(key), null); if (c && c.items && Date.now() - c.t < 60 * 6e4) { T.feed = c; paintFeed(); return; } }
    if (T.feedBusy) return;
    T.feedBusy = true; T.feedErr = ''; paintFeed();
    try {
      const r = await fetch('/api/learn?mode=feed&topic=' + topic + (force ? '&fresh=1' : ''), { cache: 'no-store' }), j = await r.json();
      if (!r.ok || !Array.isArray(j.items)) throw new Error(j.error || 'fail');
      if (topic === T.topic) { T.feed = { items: j.items, fetched: j.fetched || new Date().toISOString(), t: Date.now() }; localStorage.setItem(key, JSON.stringify(T.feed)); }
    } catch (e) { T.feedErr = 'Couldn\u2019t load articles right now. Tap Refresh to try again.'; }
    T.feedBusy = false; paintFeed();
  }
  const paintToday = () => { const el = document.getElementById('ec10-today'); if (el) el.innerHTML = todayHtml(); };
  const paintFeed = () => { const el = document.getElementById('ec10-feed'); if (el) el.innerHTML = feedHtml(); };
  function learnInit() { loadToday(false); loadFeed(false); }
  async function genLesson(topic) {
    topic = String(topic || '').trim();
    const out = document.getElementById('ec10-gen-out'), btn = document.getElementById('ec10-gen-btn');
    if (topic.length < 3) { if (out) out.textContent = 'Type a topic with at least 3 letters.'; return; }
    if (T.genBusy) return;
    T.genBusy = true; if (btn) { btn.disabled = true; btn.textContent = 'Creating\u2026'; } if (out) out.textContent = 'Writing your lesson\u2026 this takes a few seconds.';
    try {
      const r = await fetch('/api/learn?mode=topic&q=' + encodeURIComponent(topic), { cache: 'no-store' }), j = await r.json();
      if (!r.ok || !j.lesson) throw new Error(j.error || 'fail');
      saveLesson(j.lesson, 0); T.open = j.lesson; T.q[j.lesson.id] = {}; T.genBusy = false; render(); scrollTo(0, 0); return;
    } catch (e) { if (out) out.textContent = (e && e.message && e.message !== 'fail' && e.message !== 'Failed to fetch') ? e.message : 'Couldn\u2019t create the lesson. Check your connection and try again.'; }
    T.genBusy = false; if (btn) { btn.disabled = false; btn.textContent = 'Create lesson'; }
  }
  if (typeof V.learn === 'function') {
    const learn0 = V.learn;
    V.learn = function () {
      if (T.open) return lessonView(T.open);
      const html = learn0.apply(this, arguments), marker = '<div class="seg" style="margin-bottom:16px">', i = html.indexOf(marker);
      if (i < 0) return html;                       // a built-in lesson is open: leave it alone
      setTimeout(learnInit, 0);
      return html.slice(0, i) + liveBlock() + html.slice(i);
    };
  }

  /* ============================== public handlers ============================== */
  window.EC10 = {
    // watchlist
    refreshSnap, search: doSearch, add: addSym, addTyped,
    edit() { editing = !editing; paintSnap(); },
    remove(sym) { st().watch = st().watch.filter(x => x.s !== sym); save(); paintSnap(); },
    resetList() { st().watch = DEFAULT_WATCH.map(x => ({ ...x })); save(); fetchQuotes(true); },
    // copilot
    setModel(v) { if (!MODELS.some(m => m[0] === v)) return; st().model = v; save(); const h = document.getElementById('ec10-model-hint'); if (h) h.textContent = MODELS.find(m => m[0] === v)[2]; toast('Copilot will use ' + modelName(v) + '.'); },
    newChat() { if (!S.chat || !S.chat.length) { toast('You\u2019re already in a fresh chat.'); return; } archiveCurrent(); toast('Chat saved to History.'); render(); },
    toggleHist() { histOpen = !histOpen; const el = document.getElementById('ec10-hist'); if (el) el.style.display = histOpen ? 'block' : 'none'; },
    openChat(id) {
      const s = st(), c = s.chats.find(x => x.id === id); if (!c) return;
      s.chats = s.chats.filter(x => x.id !== id);
      archiveCurrent();
      S.chat = c.msgs.map(m => ({ role: m.role, content: m.content, followups: m.followups || [] }));
      if (MODELS.some(m => m[0] === c.model)) s.model = c.model;
      histOpen = false; save(); render();
    },
    delChat(id) { if (!confirm('Delete this saved chat?')) return; st().chats = st().chats.filter(x => x.id !== id); save(); render(); },
    clearHist() { if (!confirm('Delete ALL saved chats? This can\u2019t be undone.')) return; st().chats = []; save(); render(); },
    // learn
    loadToday, openLesson(k) { const L = lessonByKey(k); if (!L || !L.quiz) return; T.open = L; T.q[L.id] = {}; render(); scrollTo(0, 0); },
    closeLesson() { T.open = null; render(); scrollTo(0, 0); },
    answer(k, j) {
      const L = T.open; if (!L) return;
      const q = T.q[L.id] = T.q[L.id] || {}; if (q[k] != null) return;
      q[k] = j;
      if (L.quiz.every((_, i) => q[i] != null)) {
        const perfect = L.quiz.every((x, i) => q[i] === x.c), first = !(st().lessons[L.id] && st().lessons[L.id].done);
        saveLesson(L, perfect ? 2 : 1);
        if (first) addXP(perfect ? 25 : 20, 'AI lesson complete');
      }
      render();
    },
    askAbout() { const L = T.open; T.open = null; if (window.EC7 && EC7.prefill) EC7.prefill(L ? `Explain "${L.title}" using my own numbers, in simple terms.` : ''); else go('advisor'); },
    gen() { const i = document.getElementById('ec10-topic'); genLesson(i && i.value); },
    genFrom(t) { const i = document.getElementById('ec10-topic'); if (i) i.value = t; genLesson(t); },
    feedTopic(k) { T.topic = k; T.feed = null; paintFeed(); loadFeed(false); },
    feedRefresh() { loadFeed(true); },
    explain(i) { const x = T.feed && T.feed.items && T.feed.items[i]; if (x && window.EC7 && EC7.prefill) EC7.prefill(`Explain this headline in simple terms and what it could mean for me: "${x.title}"`); },
    // exposed so the page can be checked without the screen
    _fmtPrice: fmtPrice
  };
  if (window.EC7) {
    EC7.clearChat = () => EC10.newChat();
    if (EC7.mrefresh) { const m0 = EC7.mrefresh; EC7.mrefresh = function () { refreshSnap(); return m0.apply(this, arguments); }; }
  }

  /* ============================== render hook + start ============================== */
  const render0 = window.render;
  window.render = function () {
    if (cv() !== 'learn') T.open = null;
    const out = render0.apply(this, arguments);
    try { reorderNav(); } catch (_) { /* never block the page */ }
    try {
      if (cv() === 'market') {
        if (!qBusy && (!Q || !Q.t || Date.now() - Q.t > 5 * 6e4)) fetchQuotes(false);
        const rs = window.EC8 && EC8.status ? EC8.status() : null;       // opening Market re-checks the Bank of Canada if it's been 10+ minutes
        if (rs && !rs.busy && Date.now() - (rs.last || 0) > 10 * 6e4) EC8.refreshRates();
      }
    } catch (_) { /* never block the page */ }
    return out;
  };
  setInterval(() => { if (!document.hidden && cv() === 'market' && !qBusy) fetchQuotes(false); }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (cv() === 'learn' && !T.open) { loadToday(false); loadFeed(false); }
  });

  archiveCurrent();   // every new visit starts with a fresh Copilot chat; the old one is in History
  render();
})();
