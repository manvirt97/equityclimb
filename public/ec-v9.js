/* EquityClimb v9 — add-on (loads after ec-v8.js). Only ADDS features; nothing existing is removed.
   1. Market prices: TSX, S&P 500, oil, gold (free, via /api/quotes)
   2. Schools & safety: links for every neighbourhood and the Property check
   3. Bank statement import (CSV): auto-sorts spending, finds subscriptions, updates your budget in one tap
      → Your file is read ONLY on your device. It is never uploaded anywhere.
*/
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof V === 'undefined') return;
  const money = n => (typeof $ === 'function' ? $(n) : '$' + Math.round(n));
  const e = s => (typeof esc === 'function' ? esc(s) : String(s ?? ''));
  const city = () => S.profile.city || 'Edmonton';
  const prov = () => S.profile.region || 'AB';
  const g = q => 'https://www.google.com/search?q=' + encodeURIComponent(q);

  /* ======================================================= 1. MARKET PRICES */
  let Q = null, qLoading = false, qTried = 0;
  try { const c = JSON.parse(localStorage.getItem('ec9_quotes') || 'null'); if (c && Date.now() - c.fetched < 864e5) Q = c; } catch (_) {}
  async function loadQuotes(force) {
    if (qLoading || (!force && Q && Date.now() - Q.fetched < 15 * 6e4) || (!force && Date.now() - qTried < 6e4)) return;
    qLoading = true; qTried = Date.now();
    try {
      const r = await fetch('/api/quotes', { cache: 'no-store' });
      const j = await r.json();
      if (j.items && j.items.length) { Q = j; localStorage.setItem('ec9_quotes', JSON.stringify(j)); }
    } catch (_) {}
    qLoading = false; render();
  }
  function quotesHtml() {
    if (!Q || !Q.items?.length) return `<div class="small mute" style="margin-top:10px">Stock and oil prices will appear here once the app is published. <a href="#" onclick="EC9.quotes(true);return false">Load now</a></div>`;
    const fmt = (x) => x.key === 'oil' || x.key === 'gold' ? 'US$' + x.value.toLocaleString('en-CA', { maximumFractionDigits: 2 }) : x.value.toLocaleString('en-CA', { maximumFractionDigits: 0 });
    return `<div class="grid ec9-q">${Q.items.map(x => `<div class="card flat kpi"><div class="l">${e(x.name)}</div><div class="v">${fmt(x)}</div><div class="h">${x.changePct == null ? '' : `<span class="delta ${x.changePct >= 0 ? 'pos' : 'neg'}">${x.changePct >= 0 ? '▲' : '▼'} ${Math.abs(x.changePct).toFixed(2)}%</span> `}${x.key === 'oil' ? 'matters for Alberta jobs' : x.key === 'tsx' ? 'Canadian stocks' : x.key === 'sp500' ? 'US stocks' : 'per ounce'}</div></div>`).join('')}</div>
    <div class="small mute" style="margin-top:6px">Market prices · may be delayed 15+ min · checked ${new Date(Q.fetched).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · <a href="#" onclick="EC9.quotes(true);return false">Refresh</a></div>`;
  }
  const _rs = window.rateStrip;
  window.rateStrip = function () { return _rs.apply(this, arguments) + quotesHtml(); };

  /* ======================================================= 2. SCHOOLS & SAFETY */
  
  function safetyLinks(area, place) {
    const c = (place || city()).toLowerCase(), full = `${area ? area + ' ' : ''}${place || city()}`;
    const crime = g(full + ' police community crime map');
    return `<div class="ec9-links">
      <a target="_blank" rel="noopener" href="https://www.compareschoolrankings.org/">🎓 School rankings (Fraser)</a>
      <a target="_blank" rel="noopener" href="${g(full + ' schools catchment ' + prov())}">🏫 Schools nearby</a>
      <a target="_blank" rel="noopener" href="${crime}">🛡️ Crime map</a>
      <a target="_blank" rel="noopener" href="${g(full + ' walk score transit')}">🚶 Walk &amp; transit</a>
      <a target="_blank" rel="noopener" href="${g(full + ' flood map ' + prov())}">🌊 Flood risk</a></div>`;
  }
  if (typeof areasHtml === 'function') {
    const _ah = window.areasHtml;
    window.areasHtml = function (A) {
      let h = _ah.apply(this, arguments);
      (A?.neighbourhoods || []).forEach(n => {
        const tag = `homes for sale')}">See listings →</a>`; // end of each card's listings link (from app.js)
        const needle = encodeURIComponent(n.name + ' ' + (typeof areaCity !== 'undefined' ? areaCity : '') + ' homes for sale');
        const i = h.indexOf(needle); if (i < 0) return;
        const end = h.indexOf('</a>', i); if (end < 0) return;
        h = h.slice(0, end + 4) + safetyLinks(n.name, typeof areaCity !== 'undefined' && areaCity ? areaCity : city()) + h.slice(end + 4);
      });
      return h;
    };
  }
  if (typeof P !== 'undefined' && P.property) {
    const _pp = P.property;
    P.property = function () {
      const h = _pp.apply(this, arguments), addr = S.prop.addr || '';
      const box = `<div class="card" style="margin-bottom:16px"><h2>Where is it?</h2><label>Address or neighbourhood</label><input type="text" style="text-align:left" value="${e(addr)}" placeholder="e.g. 123 Main St, Edmonton" onchange="S.prop.addr=this.value;save();render()">
        ${addr ? `<div class="row" style="margin-top:10px"><a class="small" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(addr)}">📍 Map</a><a class="small" target="_blank" rel="noopener" href="${g(addr + ' sold price history')}">💲 Sold history</a></div>${safetyLinks(addr, '')}` : '<div class="hint">Add an address to get school, crime, transit and flood-risk links for this home.</div>'}</div>`;
      return box + h;
    };
  }

  /* ======================================================= 3. BANK STATEMENT IMPORT */
  const RULES = [
    ['Housing', /mortgage|rent\b|property tax|condo|epcor|enmax|atco|direct energy|fortis|utilit|water|insurance.*home|home.*insur|telus|shaw|rogers|bell|freedom mobile|koodo|fido|internet/i],
    ['Transportation', /petro|esso|shell|husky|co-?op gas|chevron|mobil|ultramar|fas gas|gas bar|parking|impark|ets\b|transit|calgary transit|uber(?! *eats)|lyft|car wash|autopay.*insur|auto insur|registry|canadian tire gas|costco gas|7-eleven fuel/i],
    ['Food', /safeway|sobeys|superstore|save-?on|no frills|walmart|costco|t&t|real canadian|freshco|iga|loblaw|co-?op(?! gas)|restaurant|cafe|coffee|tim hortons|starbucks|mcdonald|a&w|subway|pizza|skip ?the ?dishes|doordash|uber *eats|wendy|dairy queen|kfc|popeyes|boston pizza|earls|cactus club/i],
    ['Health', /pharma|shoppers|rexall|london drugs|dental|dentist|clinic|physio|optom|massage|chiro|medical|health/i],
    ['Debt', /loan pmt|loan payment|credit card pay|payment.*thank|line of credit|loc pmt|student loan|nslsc|car loan|finance pmt/i],
    ['Savings', /tfsa|rrsp|fhsa|wealthsimple|questrade|invest|transfer to sav|savings/i],
    ['Personal', /netflix|spotify|disney|apple\.com|google \*|amazon|prime video|crave|youtube|gym|goodlife|anytime fitness|cineplex|winners|h&m|zara|best buy|sport chek|indigo|salon|barber|sephora/i]
  ];
  const SKIP = /payroll|salary|deposit|e-?transfer.*(received|from)|refund|interest earned|transfer from|payment received|pay ?cheque/i;
  const SUBS = /netflix|spotify|disney|apple\.com|crave|prime|youtube|gym|goodlife|anytime|adobe|microsoft|google|icloud|dropbox|patreon|xbox|playstation|audible|telus|rogers|bell|shaw|koodo|fido|freedom/i;
  function cat(desc) { for (const [c, re] of RULES) if (re.test(desc)) return c; return 'Other'; }

  function parseCSV(text) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += ch;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c));
  }
  function parseDate(s) {
    s = String(s || '').trim();
    let m;
    if ((m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/))) return new Date(+m[1], m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return +m[1] > 12 ? new Date(y, m[2] - 1, +m[1]) : new Date(y, m[1] - 1, +m[2]); }
    const d = new Date(s); return isNaN(d) ? null : d;
  }
  const num = s => { if (s == null || s === '') return null; const neg = /^\(.*\)$/.test(s) || /-/.test(s); const v = parseFloat(String(s).replace(/[^0-9.]/g, '')); return isNaN(v) ? null : neg ? -v : v; };

  function analyse(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('The file looks empty.');
    let hi = rows.findIndex(r => r.some(c => /date/i.test(c)) && r.some(c => /amount|debit|withdraw|credit|cad\$/i.test(c)));
    let H, data;
    if (hi >= 0) { H = rows[hi].map(c => c.toLowerCase()); data = rows.slice(hi + 1); }
    else { // no header (TD style): date, description, debit, credit, balance
      H = ['date', 'description', 'debit', 'credit', 'balance']; data = rows;
    }
    const col = re => H.findIndex(h => re.test(h));
    const dI = col(/date/), descI = [...new Set([col(/desc|merchant|payee|details|transaction$/), col(/description 2|memo|name/)])].filter(x => x >= 0 && x !== dI);
    const amtI = col(/^amount|cad\$|amount \(cad\)|transaction amount/), debI = col(/debit|withdraw|money out/), creI = col(/credit|deposit|money in/);
    if (dI < 0 || (amtI < 0 && debI < 0)) throw new Error('Could not find Date and Amount columns. Export as CSV from your bank\'s website.');
    const dIdx = descI.length ? descI : [H.findIndex((h, k) => k !== dI && k !== amtI && k !== debI && k !== creI)];
    const tx = [];
    let negCount = 0, posCount = 0;
    for (const r of data) {
      const d = parseDate(r[dI]); if (!d) continue;
      const desc = dIdx.map(k => r[k] || '').join(' ').replace(/\s+/g, ' ').trim();
      let out = null;
      if (amtI >= 0) { const a = num(r[amtI]); if (a == null) continue; a < 0 ? negCount++ : posCount++; out = a; }
      else { const db = num(r[debI]), cr = num(r[creI]); if (db) out = -Math.abs(db); else if (cr) out = Math.abs(cr); else continue; negCount += out < 0; posCount += out > 0; }
      tx.push({ d, desc, a: out });
    }
    if (!tx.length) throw new Error('No transactions found in this file.');
    // single amount column: if mostly positive, it's a credit-card file (purchases positive)
    const flip = amtI >= 0 && posCount > negCount;
    const spend = tx.map(t => ({ ...t, out: flip ? t.a : -t.a })).filter(t => t.out > 0 && !SKIP.test(t.desc));
    const months = new Set(tx.map(t => t.d.getFullYear() + '-' + t.d.getMonth())).size || 1;
    const byCat = {}, byMerchant = {};
    spend.forEach(t => {
      const c = cat(t.desc); byCat[c] = (byCat[c] || 0) + t.out;
      const m = t.desc.toLowerCase().replace(/[#*]?\d{3,}.*$/, '').replace(/[^a-z& ]/g, '').trim().slice(0, 28) || 'unknown';
      (byMerchant[m] = byMerchant[m] || []).push(t);
    });
    Object.keys(byCat).forEach(k => byCat[k] = Math.round(byCat[k] / months));
    const subs = Object.entries(byMerchant).filter(([m, a]) => {
      const mo = new Set(a.map(t => t.d.getFullYear() + '-' + t.d.getMonth())).size, avg = a.reduce((s, t) => s + t.out, 0) / a.length;
      const same = a.every(t => Math.abs(t.out - avg) <= Math.max(2, avg * 0.1));
      return (mo >= 2 && same && avg < 400) || (SUBS.test(m) && avg < 400);
    }).map(([m, a]) => ({ n: m, amt: Math.round(a.reduce((s, t) => s + t.out, 0) / a.length * 100) / 100, times: a.length })).sort((x, y) => y.amt - x.amt);
    const top = Object.entries(byMerchant).map(([m, a]) => ({ n: m, total: a.reduce((s, t) => s + t.out, 0) / months })).sort((x, y) => y.total - x.total).slice(0, 8);
    const first = new Date(Math.min(...tx.map(t => t.d))), last = new Date(Math.max(...tx.map(t => t.d)));
    return { byCat, subs, top, months, count: spend.length, first: first.toISOString().slice(0, 10), last: last.toISOString().slice(0, 10), total: Object.values(byCat).reduce((a, b) => a + b, 0) };
  }

  let IMP = null; try { IMP = JSON.parse(localStorage.getItem('ec9_import') || 'null'); } catch (_) {}
  let impErr = '';
  function readFiles(input) {
    const files = [...(input.files || [])]; if (!files.length) return;
    Promise.all(files.map(f => f.text())).then(texts => {
      try {
        // combine multiple files (e.g. chequing + credit card) by analysing each and adding category totals
        const parts = texts.map(analyse), r = { byCat: {}, subs: [], top: [], months: Math.max(...parts.map(p => p.months)), count: 0, first: parts.map(p => p.first).sort()[0], last: parts.map(p => p.last).sort().pop(), total: 0, files: files.length };
        parts.forEach(p => { Object.entries(p.byCat).forEach(([k, v]) => r.byCat[k] = (r.byCat[k] || 0) + v); r.subs.push(...p.subs); r.top.push(...p.top); r.count += p.count; r.total += p.total; });
        r.top.sort((a, b) => b.total - a.total); r.top = r.top.slice(0, 8);
        IMP = r; impErr = ''; localStorage.setItem('ec9_import', JSON.stringify(r));
      } catch (err) { impErr = err.message || 'That file could not be read.'; }
      input.value = ''; render();
    });
  }
  function applyBudget() {
    if (!IMP) return;
    const keepSavings = S.spend.Savings || 0;
    Object.keys(S.spend).forEach(k => { if (k !== 'Savings') S.spend[k] = 0; });
    Object.entries(IMP.byCat).forEach(([k, v]) => { S.spend[k] = k === 'Savings' ? Math.max(v, keepSavings) : v; });
    save(); if (typeof pTab !== 'undefined') pTab = 'budget'; render();
  }

  if (typeof PT !== 'undefined' && typeof P !== 'undefined') {
    if (!PT.some(x => x[0] === 'import')) PT.push(['import', 'Import bank CSV']);
    P.import = () => {
      const cats = IMP ? Object.entries(IMP.byCat).sort((a, b) => b[1] - a[1]) : [];
      const mx = cats.length ? cats[0][1] : 1;
      const subTotal = IMP ? IMP.subs.reduce((a, s) => a + s.amt, 0) : 0;
      return `<div class="card"><h2>Import your bank statement</h2>
        <div class="small mute">We sort your spending automatically, find subscriptions, and can fill in your budget for you. <b>Your file is read only on this device and never uploaded.</b></div>
        <div class="ec9-drop" onclick="document.getElementById('ec9-file').click()">⬆️ <b>Choose CSV file(s)</b><span class="small mute">You can pick chequing and credit card files together</span></div>
        <input id="ec9-file" type="file" accept=".csv,text/csv" multiple hidden onchange="EC9.read(this)">
        ${impErr ? `<div class="note" style="margin-top:12px">⚠ ${e(impErr)}</div>` : ''}
        <details class="small" style="margin-top:12px"><summary><b>How do I get the CSV from my bank?</b></summary>
        <ol style="padding-left:18px;line-height:1.8;color:var(--ink2)"><li><b>BMO:</b> Online banking → your account → <i>Download transactions</i> → choose dates → <i>CSV / Excel</i>.</li>
        <li><b>RBC:</b> Online banking → <i>Download Transactions</i> (left menu) → <i>Comma Separated Values (.csv)</i>.</li>
        <li><b>TD:</b> EasyWeb → account → <i>Download</i> → <i>Spreadsheet (.csv)</i>.</li>
        <li><b>CIBC / Scotiabank / ATB / Tangerine:</b> open the account → look for <i>Download</i> or <i>Export</i> → choose <i>CSV</i>.</li>
        <li>Tip: download the last <b>3 months</b> for the best averages. Use a computer — most bank apps only allow this on the website.</li></ol></details></div><div class="sp"></div>
      ${IMP ? `<div class="grid g3"><div class="card kpi"><div class="l">Average monthly spending</div><div class="v acc">${money(IMP.total)}</div><div class="h">${IMP.count} purchases · ${IMP.first} to ${IMP.last}</div></div>
        <div class="card kpi"><div class="l">Subscriptions & bills found</div><div class="v">${IMP.subs.length}</div><div class="h">about ${money(subTotal)}/mo</div></div>
        <div class="card kpi"><div class="l">Your budget today</div><div class="v">${money(typeof spendTotal === 'function' ? spendTotal() : 0)}</div><div class="h">${typeof spendTotal === 'function' ? (IMP.total > spendTotal() ? `<span class="neg">You actually spend ${money(IMP.total - spendTotal())} more</span>` : `<span class="pos">You spend ${money(spendTotal() - IMP.total)} less than planned</span>`) : ''}</div></div></div><div class="sp"></div>
        <div class="grid g2"><div class="card"><h2>Where your money goes</h2>${cats.map(([k, v]) => `<div class="ec9-cat"><span>${e(k)}</span><div class="bar"><i style="width:${v / mx * 100}%"></i></div><b>${money(v)}</b></div>`).join('')}
          <button class="btn" style="margin-top:14px" onclick="if(confirm('Replace your budget categories with these monthly averages? (Your Savings amount is kept if higher.)'))EC9.apply()">Use these as my budget</button>
          <div class="hint">Anything we couldn't recognise goes to "Other". Pay-cheques, refunds and transfers in are ignored.</div></div>
        <div class="card"><h2>Subscriptions & repeating bills</h2>${IMP.subs.length ? `<table>${IMP.subs.slice(0, 12).map(s => `<tr><td style="text-align:left;text-transform:capitalize">${e(s.n)}</td><td>${money(s.amt)}<span class="small mute">/mo</span></td></tr>`).join('')}</table><div class="hint">Cancel one you don't use and the savings show up in your Next Best Actions.</div>` : '<div class="small mute">No repeating charges found.</div>'}
          <div class="sp"></div><h2>Top places you spend</h2><table>${IMP.top.map(t => `<tr><td style="text-align:left;text-transform:capitalize">${e(t.n)}</td><td>${money(t.total)}<span class="small mute">/mo</span></td></tr>`).join('')}</table>
          <button class="btn ghost sm" style="margin-top:12px" onclick="EC8&&EC8.askAbout('Here is my real monthly spending by category: ${Object.entries(IMP.byCat).map(([k, v]) => k + ' ' + money(v)).join(', ')}. Where can I save the most?')">Ask AI where I can save</button>
          <button class="btn ghost sm" style="margin-top:12px" onclick="EC9.clear()">Clear import</button></div></div>` : ''}`;
    };
  }

  // Subscriptions feed into Next Best Actions (ec-v8)
  if (window.EC8 && typeof EC8.actions === 'function') {
    const _o = V.overview;
    V.overview = function () {
      let h = _o.apply(this, arguments);
      if (IMP && IMP.subs.length) {
        const t = IMP.subs.reduce((a, s) => a + s.amt, 0);
        const card = `<div class="ec8-alert amber" onclick="go('plan','import')"><i></i><div><b>${IMP.subs.length} subscriptions & bills · ${money(t)}/mo</b><div class="small mute">Review them. Cancelling one $20 service saves $240 a year.</div></div></div>`;
        h = h.replace(/(<h2>Alerts<\/h2>[\s\S]*?<\/div>)/, '$1' + card);
      }
      return h;
    };
  }

  window.EC9_SUBS = () => IMP && IMP.subs ? IMP.subs.reduce((a, s) => a + s.amt, 0) : 0;
  window.EC9 = { read: readFiles, apply: applyBudget, clear() { IMP = null; localStorage.removeItem('ec9_import'); render(); }, quotes: f => loadQuotes(f), analyse };

  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadQuotes(false); });
  render();
  loadQuotes(false);
})();
