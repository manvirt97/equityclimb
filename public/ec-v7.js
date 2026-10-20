/* EquityClimb v7 - one add-on file. Loads after app.js, phase1.js and refresh-fix.js.
   Adds: auto-updating Canadian rules, phone <-> laptop sync (Google sign-in), backup & monthly check-in reminders,
   mortgage renewal planner, prepayment scenarios, Learn hub (lessons, quizzes, streaks), financial health check,
   daily money minute, a calmer Copilot (asks before sending + follow-up suggestions), and the new Market page
   with a Deal Tracker. Replaces v5-market.js. */
(function () {
  'use strict';
  if (window.__ec7) return; window.__ec7 = true;
  const E = window.ECEngine, X = window.ECP, T = window.ECTax, LD = window.EC_LEARN || { lessons: [], tips: [] };
  const n = v => (Number.isFinite(+v) ? +v : 0);
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const hasMortgage = () => n(S.bal) > 0 && S.profile.goal !== 'rent' && S.profile.goal !== 'buy';
  const yrsTxt = m => m === Infinity ? 'Never at this payment' : (m / 12).toFixed(1) + ' yrs';
  const when = m => m === Infinity ? 'Never' : fmtD(addM(m));
  const attr = s => esc(s).replace(/`/g, '&#96;');

  /* ---------- icons ---------- */
  Object.assign(I, {
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
    growth: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    piggy: '<path d="M5 11a7 6 0 0113-3l2-1v4l-1 1a7 6 0 01-3 5v2h-3v-1H9v1H6v-3a6 6 0 01-1-5z"/><circle cx="15" cy="10" r=".8"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    deal: '<path d="M8 12l3 3 5-6"/><path d="M3 12l4-4 5 3 5-3 4 4-9 8z"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    cloud: '<path d="M7 18h10a4 4 0 00.5-8A6 6 0 006 9a4.5 4.5 0 001 9z"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'
  });

  /* ---------- state ---------- */
  function st() {
    S.ec7 = S.ec7 || {};
    const s = S.ec7;
    s.learn = s.learn || { done: {}, xp: 0, streak: 0, lastDay: '', best: 0, daily: {} };
    s.pp = s.pp || { extra: 200, lump: 0, accel: false };
    s.market = s.market || { scope: 'local', cat: 'all' };
    s.firstSeen = s.firstSeen || todayKey();
    if (s.fixedSpread == null) s.fixedSpread = 1.5;
    return s;
  }
  st();

  /* ======================================================================
     1. AUTO-UPDATING RULES (tax brackets, CPP, EI, TFSA/RRSP/FHSA, stress test)
     ====================================================================== */
  const deInf = t => { const fix = a => (a || []).map(b => ({ upTo: b.upTo == null ? Infinity : b.upTo, rate: b.rate })); t.federal.brackets = fix(t.federal.brackets); Object.values(t.provinces).forEach(p => p.brackets = fix(p.brackets)); return t; };
  function installRules(r) {
    if (!r || !r.table || !T) return;
    window.EC_RULES = r;
    if (r.year > 2026) T.TAX_TABLES[r.year] = deInf(JSON.parse(JSON.stringify(r.table)));
    const s = st(), y = r.year;
    if (s.rulesYear !== y) {
      // New year: refresh yearly limits the user hasn't customised.
      if (!S.tfsaNew || [7000, 6500, 7500, 8000].includes(+S.tfsaNew)) S.tfsaNew = r.limits.tfsa;
      s.rulesYear = y;
    }
    try { X.sync(); } catch (e) {}
    save();
  }
  async function loadRules() {
    const y = new Date().getFullYear();
    let r = cache.get('rules7_' + y, 720);
    if (r) installRules(r);
    const fresh = await api('/api/rules?year=' + y).catch(() => null);
    if (fresh && !fresh.error) { cache.set('rules7_' + y, fresh); installRules(fresh); render(); }
  }
  const money0 = v => '$' + Math.round(n(v)).toLocaleString('en-CA');
  function fillRules(html) {
    const r = window.EC_RULES, lim = r?.limits || { tfsa: 7000, rrsp: 33810, fhsaAnnual: 8000, fhsaLifetime: 40000 }, m = r?.mortgage || { stressFloor: 5.25, stressBuffer: 2, gdsMax: 39, tdsMax: 44, minDown: '5% to $500k, 10% to $1.5M, 20% above' };
    return String(html).replace(/\{tfsa\}/g, money0(lim.tfsa)).replace(/\{rrsp\}/g, money0(lim.rrsp)).replace(/\{fhsaAnnual\}/g, money0(lim.fhsaAnnual)).replace(/\{fhsaLifetime\}/g, money0(lim.fhsaLifetime))
      .replace(/\{stressFloor\}/g, m.stressFloor).replace(/\{stressBuffer\}/g, m.stressBuffer).replace(/\{gds\}/g, m.gdsMax).replace(/\{tds\}/g, m.tdsMax).replace(/\{minDown\}/g, m.minDown);
  }

  /* ======================================================================
     2. SYNC: same data on phone and laptop (optional Google sign-in)
     ====================================================================== */
  const SK = 'ec_session', MK = 'ho_mtime', UK = 'ec_sync_uid';
  const sync = { cfg: null, state: 'off', msg: '', last: +localStorage.getItem('ec_last_sync') || 0, pending: null, applying: false, gsi: false, ready: false };
  const session = () => { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch { return null; } };
  const setI = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    const mine = this === window.localStorage && k === 'ho' && !sync.applying, prev = mine ? this.getItem('ho') : null;
    setI.call(this, k, v);
    // Only real changes count, and only after we've checked the account (so automatic start-up updates
    // on an out-of-date device can never overwrite newer data from your other device).
    if (mine && sync.ready && prev !== v) { setI.call(this, MK, String(Date.now())); schedulePush(); }
  };
  const uidOf = s => { try { return JSON.parse(atob(s.token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).uid; } catch { return ''; } };
  async function syncFetch(method, body) {
    const s = session(); if (!s) throw Error('auth');
    const r = await fetch('/api/sync', { method, headers: { authorization: 'Bearer ' + s.token, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { localStorage.removeItem(SK); sync.state = 'off'; sync.msg = 'Your sign-in expired. Please sign in again.'; throw Error('auth'); }
    if (!r.ok) throw Error(j.error || 'Sync failed');
    return j;
  }
  function schedulePush() {
    const s = session(); if (!s || !sync.cfg?.syncReady || localStorage.getItem(UK) !== uidOf(s)) return;
    clearTimeout(sync.pending); sync.pending = setTimeout(push, 4000);
  }
  async function push() {
    try {
      sync.state = 'saving'; paintSync();
      const data = JSON.parse(localStorage.getItem('ho') || '{}');
      await syncFetch('PUT', { data, updated: +localStorage.getItem(MK) || Date.now() });
      sync.state = 'ok'; sync.last = Date.now(); setI.call(localStorage, 'ec_last_sync', String(sync.last)); sync.msg = '';
    } catch (e) { if (e.message !== 'auth') { sync.state = 'error'; sync.msg = 'Couldn\u2019t save to your account. We\u2019ll try again.'; } }
    paintSync();
  }
  function applyCloud(data, updated) {
    sync.applying = true;
    try { setI.call(localStorage, 'ho_before_sync', localStorage.getItem('ho') || '{}'); setI.call(localStorage, 'ho', JSON.stringify(data)); setI.call(localStorage, MK, String(updated || Date.now())); }
    finally { sync.applying = false; }
    location.reload();
  }
  async function pull(first) {
    const s = session(); if (!s || !sync.cfg?.syncReady) return;
    try {
      sync.state = 'checking'; paintSync();
      const j = await syncFetch('GET'), uid = uidOf(s), linked = localStorage.getItem(UK) === uid, localT = +localStorage.getItem(MK) || 0;
      if (!j.data) { setI.call(localStorage, UK, uid); await push(); return; }
      if (!linked) {
        if (!S.profile.onboarded) { setI.call(localStorage, UK, uid); return applyCloud(j.data, j.updated); }
        sync.choice = { updated: j.updated, data: j.data }; sync.state = 'choose'; render(); return;
      }
      if (j.updated > localT + 1000) return applyCloud(j.data, j.updated);
      if (localT > j.updated + 1000) return push();
      sync.state = 'ok'; sync.last = Date.now(); setI.call(localStorage, 'ec_last_sync', String(sync.last));
    } catch (e) { if (e.message !== 'auth') { sync.state = 'error'; sync.msg = 'Couldn\u2019t reach your account right now.'; } }
    paintSync(); if (first) render();
  }
  window.EC7 = window.EC7 || {};
  EC7.useCloud = () => { const c = sync.choice; if (!c) return; setI.call(localStorage, UK, uidOf(session())); applyCloud(c.data, c.updated); };
  EC7.useDevice = () => { sync.choice = null; setI.call(localStorage, UK, uidOf(session())); setI.call(localStorage, MK, String(Date.now())); push().then(render); };
  EC7.signOut = () => { localStorage.removeItem(SK); localStorage.removeItem(UK); sync.state = 'off'; sync.msg = 'Signed out. Your data stays on this device.'; try { google.accounts.id.disableAutoSelect(); } catch (e) {} render(); };
  EC7.eraseCloud = async () => { if (!confirm('Delete the copy saved in your account? Data on this device is kept.')) return; try { await syncFetch('DELETE'); localStorage.removeItem(UK); sync.msg = 'Your cloud copy was deleted.'; EC7.signOut(); } catch (e) { alert('Could not delete right now. Try again later.'); } };
  async function onCredential(resp) {
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential: resp.credential }) });
      const j = await r.json();
      if (!r.ok) throw Error(j.error || 'Sign-in failed');
      setI.call(localStorage, SK, JSON.stringify({ token: j.token, email: j.email, name: j.name }));
      sync.msg = ''; sync.ready = false; await pull(true); sync.ready = true;
    } catch (e) { sync.msg = e.message; render(); }
  }
  function loadGsi() {
    if (sync.gsi || !sync.cfg?.googleClientId) return;
    sync.gsi = 'loading';
    const sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
    sc.onload = () => {
      const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
      google.accounts.id.initialize({ client_id: sync.cfg.googleClientId, callback: onCredential, auto_select: false, cancel_on_tap_outside: true, ux_mode: standalone ? 'redirect' : 'popup', login_uri: location.origin + '/api/auth' });
      sync.gsi = true; drawGsi();
    };
    sc.onerror = () => { sync.gsi = 'failed'; sync.msg = 'Google sign-in couldn\u2019t load. Check your connection or ad-blocker, then tap Try again.'; sc.remove(); render(); };
    document.head.appendChild(sc);
  }
  function drawGsi() {
    if (sync.gsi !== true) return;
    document.querySelectorAll('.ec-gsi').forEach(el => { if (!el.dataset.done) { el.dataset.done = 1; google.accounts.id.renderButton(el, { theme: S.theme === 'light' ? 'outline' : 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(320, el.clientWidth || 300) }); } });
  }
  function paintSync() { const el = document.getElementById('ec-sync-state'); if (el) el.innerHTML = syncLine(); }
  function syncLine() {
    const s = session(); if (!s) return '';
    const t = sync.last ? ago(new Date(sync.last)) : 'not yet';
    const m = { saving: 'Saving\u2026', checking: 'Checking\u2026', error: `<span class="warn">${esc(sync.msg)}</span>`, ok: `Synced ${t}`, choose: 'Waiting for your choice', off: '' }[sync.state] || `Last synced ${t}`;
    return `<span class="dot${sync.state === 'error' ? ' off' : ''}"></span>${m}`;
  }
  function accountCard(compact) {
    const s = session(), c = sync.cfg;
    if (!c) return '';
    if (!c.syncReady) return compact ? '' : `<div class="card"><h2>Sync between phone and laptop</h2><div class="small mute">Not switched on yet. The app owner needs to finish the one-time setup (Google sign-in + Cloudflare database). Until then, use Export / Import backup to move your data.</div></div>`;
    if (s) return `<div class="card"><div class="head"><div><h2>${ic('cloud')} Synced to your account</h2><div class="small mute">${esc(s.email)} · <span id="ec-sync-state">${syncLine()}</span></div></div><button class="btn ghost sm" onclick="EC7.syncNow()">Sync now</button></div>
      <div class="small mute">Sign in with the same Google account on your phone and laptop and your numbers stay the same everywhere. Data is encrypted before it\u2019s stored.</div>
      <div class="row" style="margin-top:12px"><button class="btn ghost sm" onclick="EC7.signOut()">Sign out</button><button class="btn ghost sm" onclick="EC7.eraseCloud()">Delete cloud copy</button></div></div>`;
    setTimeout(loadGsi, 0); setTimeout(drawGsi, 50);
    return `<div class="card ec-account"><h2>${ic('cloud')} ${compact ? 'Already use EquityClimb?' : 'Use EquityClimb on all your devices'}</h2>
      <div class="small mute" style="margin:4px 0 12px">${compact ? 'Sign in to bring your numbers from your other device.' : 'Sign in once on your phone and once on your laptop, and your numbers stay in sync. Optional: without signing in, data stays on this device only.'}</div>
      <div class="ec-gsi"></div>${sync.msg ? `<div class="small warn" style="margin-top:8px">${esc(sync.msg)}${sync.gsi === 'failed' ? ' <a href="#" onclick="EC7.retryGsi();return false">Try again</a>' : ''}</div>` : ''}
      <div class="small mute" style="margin-top:10px">We never see your Google password. Your data is encrypted and you can delete it any time.</div></div>`;
  }
  EC7.syncNow = () => pull(true);
  EC7.retryGsi = () => { sync.gsi = false; sync.msg = ''; render(); };
  function choiceModal() {
    const c = sync.choice; if (!c || sync.state !== 'choose') return '';
    return `<div class="ec-modal"><div class="ec-modal-card card"><h2>Which numbers should we keep?</h2>
      <p class="small mute">Your account already has data (saved ${ago(new Date(c.updated))}). This device also has data. Pick one; the other is kept as a backup on this device.</p>
      <button class="btn" style="width:100%;justify-content:center;margin-top:8px" onclick="EC7.useCloud()">Use my account\u2019s data (recommended)</button>
      <button class="btn ghost" style="width:100%;justify-content:center;margin-top:8px" onclick="EC7.useDevice()">Replace my account with this device\u2019s data</button></div></div>`;
  }
  async function initSync() {
    // Return from Google redirect sign-in (installed phone app)
    const h = location.hash;
    if (h.startsWith('#signin=')) {
      const p = new URLSearchParams(h.slice(1));
      setI.call(localStorage, SK, JSON.stringify({ token: p.get('signin'), email: p.get('email') || '' }));
      history.replaceState(null, '', location.pathname + '#settings');
    } else if (h.startsWith('#signin-error')) { sync.msg = 'Sign-in didn\u2019t complete. Please try again.'; history.replaceState(null, '', location.pathname); }
    sync.cfg = await api('/api/config').catch(() => null) || { syncReady: false };
    if (session() && sync.cfg.syncReady) { await pull(true); sync.ready = true; } else { sync.ready = true; render(); }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && session()) pull(); });
  }

  /* ======================================================================
     3. REMINDERS: backups + monthly check-in
     ====================================================================== */
  const exp0 = window.exportData;
  window.exportData = function () { exp0(); st().lastBackup = todayKey(); save(); toast('Backup saved. Keep the file somewhere safe (email it to yourself or save to cloud storage).'); render(); };
  EC7.snooze = k => { st()['snooze_' + k] = todayKey(); save(); render(); };
  EC7.checkin = () => { const s = st(); s.lastCheckin = todayKey(); xp(15, 'Monthly check-in'); save(); window.pfStep = 'savings'; go('profile'); };
  function reminders() {
    const s = st(), t = todayKey(), out = [];
    const snoozed = k => s['snooze_' + k] && daysBetween(s['snooze_' + k], t) < 3;
    const signedIn = session() && sync.cfg?.syncReady;
    const sinceBackup = s.lastBackup ? daysBetween(s.lastBackup, t) : daysBetween(s.firstSeen, t);
    if (!signedIn && sinceBackup >= (s.lastBackup ? 30 : 7) && !snoozed('backup'))
      out.push(`<div class="note ec-remind">${ic('shield')}<div style="flex:1"><b>${s.lastBackup ? `Last backup ${sinceBackup} days ago.` : 'Your numbers are only on this device.'}</b> Save a backup in 5 seconds, or sign in to sync automatically.</div><div class="row"><button class="btn sm" onclick="exportData()">Save backup</button><button class="btn ghost sm" onclick="go('settings')">Sign in</button><button class="btn ghost sm" onclick="EC7.snooze('backup')">Later</button></div></div>`);
    const sinceCheck = s.lastCheckin ? daysBetween(s.lastCheckin, t) : daysBetween(s.firstSeen, t);
    if (sinceCheck >= 30 && !snoozed('checkin'))
      out.push(`<div class="note ec-remind">${ic('bell')}<div style="flex:1"><b>Monthly money check-in (2 minutes).</b> Update your mortgage balance, savings and spending so every number stays true. +15 XP</div><div class="row"><button class="btn sm" onclick="EC7.checkin()">Start</button><button class="btn ghost sm" onclick="EC7.snooze('checkin')">Later</button></div></div>`);
    if (hasMortgage() && X.validISO(S.maturity)) {
      const d = daysBetween(t, S.maturity);
      if (d >= 0 && d <= 120) out.push(`<div class="note ec-remind warnnote">${ic('home')}<div style="flex:1"><b>Your mortgage renews in ${d} days.</b> This is the best time to compare offers. Don\u2019t just sign the renewal letter.</div><button class="btn sm" onclick="dTab='mortgage';go('debt')">Plan renewal</button></div>`);
    }
    return out.join('');
  }
  function toast(msg) { const t = document.createElement('div'); t.className = 'ec-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.classList.add('on'), 10); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, 3600); }
  EC7.toast = toast;

  /* ======================================================================
     4. LEARN: lessons, quizzes, XP, streaks
     ====================================================================== */
  const LV = ['Starter', 'Saver', 'Planner', 'Builder', 'Strategist', 'Money Pro'];
  const level = x => ({ name: LV[Math.min(Math.floor(x / 100), LV.length - 1)], next: (Math.floor(x / 100) + 1) * 100, pct: (x % 100) });
  function xp(points, why) {
    const L = st().learn, t = todayKey();
    if (L.lastDay !== t) { const y = new Date(); y.setDate(y.getDate() - 1); L.streak = L.lastDay === todayKey(y) ? L.streak + 1 : 1; L.lastDay = t; L.best = Math.max(L.best || 0, L.streak); }
    const before = level(L.xp).name; L.xp += points; save();
    const after = level(L.xp).name;
    toast(after !== before ? `Level up! You\u2019re now a ${after}.` : `+${points} XP · ${why}`);
  }
  let lessonOpen = null, quizState = {};
  window.lTrack = window.lTrack || 'All';
  V.learn = () => {
    const L = st().learn, lv = level(L.xp), done = Object.keys(L.done).length, total = LD.lessons.length;
    if (lessonOpen) return lessonView(LD.lessons.find(l => l.id === lessonOpen));
    const tracks = ['All', ...new Set(LD.lessons.map(l => l.track))];
    const list = LD.lessons.filter(l => lTrack === 'All' || l.track === lTrack);
    const next = LD.lessons.find(l => !L.done[l.id]);
    return `${head('Learn', 'Get smarter with money, 2 minutes at a time', 'Short lessons in plain English, a quick quiz, and a link to try it on your own numbers.')}
      <div class="grid g3">
        <div class="card kpi"><div class="l">Level</div><div class="v acc">${lv.name}</div><div class="bar" style="margin-top:10px"><i style="width:${lv.pct}%"></i></div><div class="h">${L.xp} XP · ${lv.next - L.xp} to next level</div></div>
        <div class="card kpi"><div class="l">Streak</div><div class="v">${ic('flame', 'ec-flame')} ${L.streak || 0} day${L.streak === 1 ? '' : 's'}</div><div class="h">Best ${L.best || 0}. Learn or answer the daily question to keep it going.</div></div>
        <div class="card kpi"><div class="l">Lessons finished</div><div class="v">${done} / ${total}</div><div class="bar" style="margin-top:10px"><i style="width:${done / total * 100}%"></i></div><div class="h">${done === total ? 'All done. Impressive!' : 'Keep going'}</div></div>
      </div><div class="sp"></div>
      ${next ? `<div class="card ec-next"><div class="eyebrow">Up next · ${next.mins} min</div><h2 style="font-size:20px;margin-top:6px">${esc(next.title)}</h2><button class="btn" style="margin-top:12px" onclick="EC7.open('${next.id}')">Start lesson</button></div><div class="sp"></div>` : ''}
      <div class="seg" style="margin-bottom:16px">${tracks.map(t => `<button class="${lTrack === t ? 'on' : ''}" onclick="lTrack='${attr(t)}';render()">${esc(t)}</button>`).join('')}</div>
      <div class="grid g3">${list.map(l => `<button class="card ec-lesson" onclick="EC7.open('${l.id}')"><span class="ec-lic">${ic(I[l.icon] ? l.icon : 'book')}</span><span class="eyebrow">${esc(l.track)} · ${l.mins} min</span><b>${esc(l.title)}</b>${L.done[l.id] ? `<span class="tag pos">\u2713 Done${L.done[l.id] === 2 ? ' · perfect quiz' : ''}</span>` : '<span class="tag">Not started</span>'}</button>`).join('')}</div>
      <p class="foot">Lessons are general education for Canadians, not personal advice. Yearly limits shown here update automatically.</p>`;
  };
  function lessonView(l) {
    if (!l) { lessonOpen = null; return V.learn(); }
    const q = quizState[l.id] || {}, allAnswered = l.quiz.every((_, k) => q[k] != null), score = l.quiz.filter((x, k) => q[k] === x.c).length;
    return `<div style="max-width:720px">
      <a href="#" onclick="EC7.close();return false">\u2190 All lessons</a>
      ${head(`${esc(l.track)} · ${l.mins} min`, esc(l.title))}
      <div class="card ec-body">${l.body.map(p => `<p>${fillRules(p)}</p>`).join('')}
        <button class="btn ghost sm" onclick="EC7.tryIt('${l.try[0]}')">${esc(l.try[1])} \u2192</button></div><div class="sp"></div>
      <div class="card"><h2>Quick check</h2>${l.quiz.map((x, k) => `<div class="ec-q"><div class="ec-qq">${k + 1}. ${fillRules(esc(x.q))}</div>
        ${x.a.map((a, j) => { const picked = q[k] === j, show = q[k] != null; return `<button class="ec-opt ${show && j === x.c ? 'right' : ''} ${picked && j !== x.c ? 'wrong' : ''}" ${show ? 'disabled' : ''} onclick="EC7.answer('${l.id}',${k},${j})">${fillRules(esc(a))}</button>`; }).join('')}
        ${q[k] != null ? `<div class="small ${q[k] === x.c ? 'pos' : 'warn'}" style="margin-top:6px">${q[k] === x.c ? 'Correct. ' : 'Not quite. '}${fillRules(esc(x.why))}</div>` : ''}</div>`).join('')}
        ${allAnswered ? `<div class="note" style="margin-top:14px"><b>${score} of ${l.quiz.length} correct.</b> ${score === l.quiz.length ? 'Perfect!' : 'Nice work, the explanation above is the key idea.'}</div>
          <div class="row" style="margin-top:12px">${(() => { const i = LD.lessons.indexOf(l), nx = LD.lessons[i + 1]; return nx ? `<button class="btn" onclick="EC7.open('${nx.id}')">Next: ${esc(nx.title)}</button>` : `<button class="btn" onclick="EC7.close()">Back to lessons</button>`; })()}
          <button class="btn ghost" onclick="EC7.askLesson('${l.id}')">${ic('ai')} Ask Copilot about this</button></div>` : ''}</div></div>`;
  }
  EC7.open = id => { lessonOpen = id; if (cur !== 'learn') go('learn'); else { render(); scrollTo(0, 0); } };
  EC7.close = () => { lessonOpen = null; render(); scrollTo(0, 0); };
  EC7.tryIt = v => { lessonOpen = null; go(v); };
  EC7.answer = (id, k, j) => {
    const l = LD.lessons.find(x => x.id === id); quizState[id] = quizState[id] || {}; if (quizState[id][k] != null) return;
    quizState[id][k] = j;
    if (l.quiz.every((_, i) => quizState[id][i] != null)) {
      const perfect = l.quiz.every((x, i) => quizState[id][i] === x.c), L = st().learn, first = !L.done[id];
      L.done[id] = Math.max(L.done[id] || 0, perfect ? 2 : 1);
      if (first) xp(perfect ? 25 : 20, 'Lesson complete'); else save();
    }
    render();
  };
  EC7.askLesson = id => { const l = LD.lessons.find(x => x.id === id); lessonOpen = null; EC7.prefill(`Explain "${l.title}" using my own numbers, in simple terms.`); };

  /* ---------- daily money minute + financial health check ---------- */
  const dayNo = () => Math.floor(new Date(todayKey() + 'T12:00:00') / 864e5);
  const allQ = () => LD.lessons.flatMap(l => l.quiz.map(q => ({ ...q, lesson: l })));
  EC7.daily = j => {
    const L = st().learn, t = todayKey(); if (L.daily[t] != null) return;
    const qs = allQ(), q = qs[dayNo() % qs.length]; L.daily = { [t]: j };
    xp(j === q.c ? 10 : 5, j === q.c ? 'Daily question' : 'Daily question (you\u2019ll get the next one)'); render();
  };
  function moneyMinute() {
    const L = st().learn, t = todayKey(), qs = allQ(); if (!qs.length) return '';
    const q = qs[dayNo() % qs.length], tip = LD.tips[dayNo() % LD.tips.length], a = L.daily[t];
    return `<div class="card ec-minute"><div class="head"><div><div class="eyebrow">Today\u2019s money minute</div><h2 style="margin-top:4px">${ic('flame', 'ec-flame')} ${L.streak || 0}-day streak</h2></div><button class="btn ghost sm" onclick="go('learn')">${ic('book')}Learn</button></div>
      <div class="ec-tip">${esc(tip)}</div>
      <div class="ec-qq" style="margin-top:12px">${fillRules(esc(q.q))}</div>
      ${q.a.map((x, j) => `<button class="ec-opt ${a != null && j === q.c ? 'right' : ''} ${a === j && j !== q.c ? 'wrong' : ''}" ${a != null ? 'disabled' : ''} onclick="EC7.daily(${j})">${fillRules(esc(x))}</button>`).join('')}
      ${a != null ? `<div class="small ${a === q.c ? 'pos' : 'warn'}" style="margin-top:6px">${fillRules(esc(q.why))} <a href="#" onclick="EC7.open('${q.lesson.id}');return false">2-min lesson \u2192</a></div>` : '<div class="small mute" style="margin-top:6px">Answer to keep your streak going.</div>'}</div>`;
  }
  function health() {
    let m; try { m = window.ECModel(); } catch { return null; }
    const inc = n(m.income), parts = [];
    const ef = m.essentialNeed > 0 ? Math.min(m.emergencyMonths / 3, 1) : null;
    parts.push({ k: 'Emergency fund', s: ef == null ? null : ef * 20, tip: ef == null ? 'Add your essential costs in Budget' : `${m.emergencyMonths.toFixed(1)} of 3 months`, fix: ['emergency', 'goals'] });
    const sr = inc > 0 ? n(m.savings) / inc : 0;
    parts.push({ k: 'Saving rate', s: inc > 0 ? Math.min(sr / 0.15, 1) * 20 : null, tip: inc > 0 ? `${(sr * 100).toFixed(0)}% of take-home (aim for 15%)` : 'Add your income', fix: ['budget', 'budget'] });
    parts.push({ k: 'Cash flow', s: inc > 0 ? (m.unallocated >= 0 ? 20 : Math.max(0, 10 + m.unallocated / inc * 50)) : null, tip: m.unallocated >= 0 ? 'Income covers your plan' : `Short ${$(-m.unallocated)}/mo`, fix: ['budget', 'budget'] });
    const hi = (S.debts || []).filter(d => n(d.bal) > 0 && n(d.rate) >= 10).reduce((s, d) => s + n(d.bal), 0);
    parts.push({ k: 'High-interest debt', s: hi === 0 ? 20 : inc > 0 && hi < inc ? 12 : 5, tip: hi === 0 ? 'None. Great!' : `${$(hi)} at 10%+`, fix: ['debt', 'debt'] });
    const housing = (hasMortgage() ? n(m.mc?.usedMonthly) : 0) + n(S.budget?.essentials?.housing), hr = inc > 0 ? housing / inc : 0;
    parts.push({ k: 'Housing cost', s: inc > 0 && housing > 0 ? (hr <= 0.35 ? 20 : hr <= 0.45 ? 12 : 5) : null, tip: inc > 0 && housing > 0 ? `${(hr * 100).toFixed(0)}% of take-home` : 'Add housing costs', fix: ['mortgage', 'debt'] });
    const scored = parts.filter(p => p.s != null); if (scored.length < 3) return null;
    const score = Math.round(scored.reduce((s, p) => s + p.s, 0) / (scored.length * 20) * 100);
    const weakest = [...scored].sort((a, b) => a.s - b.s)[0];
    return { score, parts, weakest, grade: score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Building' : 'Starting out' };
  }
  function healthCard() {
    const h = health();
    if (!h) return `<div class="card"><h2>Financial health check</h2><div class="small mute" style="margin-top:6px">Add your income and spending in My profile and Budget to see your score.</div><button class="btn sm" style="margin-top:12px" onclick="go('profile')">Complete my profile</button></div>`;
    const lesson = LD.lessons.find(l => l.id === h.weakest.fix[0]);
    return `<div class="card"><div class="head"><div><div class="eyebrow">Financial health check</div><h2 style="margin-top:4px">${h.score} / 100 · ${h.grade}</h2></div><div class="ec-ring" style="--p:${h.score}"><span>${h.score}</span></div></div>
      ${h.parts.map(p => `<div class="ec-hp"><span>${p.k}</span><div class="bar"><i style="width:${p.s == null ? 0 : p.s / 20 * 100}%;background:var(--${p.s == null ? 'line' : p.s >= 16 ? 'pos' : p.s >= 10 ? 'warn' : 'neg'})"></i></div><span class="small mute">${esc(p.tip)}</span></div>`).join('')}
      <div class="note" style="margin-top:12px"><b>Best next step:</b> improve your ${h.weakest.k.toLowerCase()}. ${lesson ? `<a href="#" onclick="EC7.open('${lesson.id}');return false">Learn how (2 min)</a> · ` : ''}<a href="#" onclick="go('${h.weakest.fix[1]}');return false">Open</a></div>
      <div class="small mute" style="margin-top:8px">A simple check from your own numbers, not a credit score.</div></div>`;
  }

  /* ======================================================================
     5. RENEWAL PLANNER + PREPAYMENT SCENARIOS (Debt & Mortgage page)
     ====================================================================== */
  const comp = () => S.rtype === 'Fixed' ? 'Semi-annual' : (S.compounding || 'Monthly');
  function balanceAfter(months) { const s = E.mortgageStepper({ balance: n(S.bal), rate: n(S.rate), payment: n(S.pmt), compounding: comp() }); for (let k = 0; k < months && s.balance > 0; k++) s.step(0); return s.balance; }
  EC7.setSpread = v => { st().fixedSpread = Math.max(0, Math.min(5, +v || 0)); save(); render(); };
  function renewalCard() {
    if (!hasMortgage()) return '';
    if (!X.validISO(S.maturity)) return `<div class="card"><h2>${ic('bell')} Renewal planner</h2><div class="small mute">Add your term-end date to get a countdown, payment estimates at today\u2019s rates and a reminder when to start shopping.</div><button class="btn sm" style="margin-top:10px" onclick="pfStep='mortgage';go('profile')">Add term-end date</button></div>`;
    const t = todayKey(), days = daysBetween(t, S.maturity), shopStart = new Date(S.maturity + 'T12:00:00'); shopStart.setDate(shopStart.getDate() - 120);
    const months = Math.max(0, X.monthsUntil(S.maturity) || 0), bal = balanceAfter(months);
    const amYears = n(S.fp?.mort?.amortYears), leftYears = amYears > 0 ? Math.max(amYears - months / 12, 1) : Math.max((E.monthsToRepay(S.bal, S.rate, S.pmt, comp()) - months) / 12, 1);
    const pr = window.RATES || (typeof RATES !== 'undefined' ? RATES : null), sc = [];
    if (pr?.prime) sc.push(['Variable at today\u2019s prime', +(pr.prime.value + n(S.adj)).toFixed(2), 'Monthly', `Prime ${pct(pr.prime.value, 2)} ${n(S.adj) < 0 ? '\u2212' : '+'} ${Math.abs(n(S.adj)).toFixed(2)} (your current discount)`]);
    if (pr?.bond5) sc.push(['5-yr fixed estimate', +(pr.bond5.value + st().fixedSpread).toFixed(2), 'Semi-annual', `5-yr bond ${pct(pr.bond5.value, 2)} + lender margin ${st().fixedSpread.toFixed(2)} (assumed)`]);
    if (pr?.fiveYearPosted) sc.push(['Big-bank posted 5-yr (worst case)', pr.fiveYearPosted.value, 'Semi-annual', 'What you might be offered if you don\u2019t negotiate']);
    sc.push(['Your expected renewal rate', n(S.renewRate), 'Semi-annual', 'From your settings']);
    const rows = sc.map(([l, r, c, h]) => { const p = E.payment(bal, r, leftYears, c); const d = p - n(S.pmt); return `<tr><td>${l}<div class="small mute">${h}</div></td><td>${pct(r, 2)}</td><td><b>${$(p)}</b></td><td class="${d > 0 ? 'neg' : 'pos'}">${d > 0 ? '+' : ''}${$(d)}</td></tr>`; }).join('');
    const stage = days < 0 ? ['Term date has passed', 'If you\u2019ve renewed, enter your new term-end date in My profile.', 'warn'] : days <= 30 ? ['Decision time', 'Your lender\u2019s offer should have arrived. Compare it with at least two other quotes before signing.', 'neg'] : days <= 120 ? ['Start shopping now', 'Get quotes from your bank, another lender and a mortgage broker. Many lenders can hold a rate for up to 120 days.', 'warn'] : ['Relax for now', `We\u2019ll remind you on ${shopStart.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}, 120 days before renewal.`, 'pos'];
    return `<div class="card"><div class="head"><div><h2>${ic('bell')} Renewal planner</h2><div class="small mute">Renews ${X.longDate(S.maturity)} · ${days >= 0 ? `<b>${days} days</b> away` : 'date passed'}</div></div>${askBtnSafe('How should I prepare for my mortgage renewal?')}</div>
      <div class="ec-stage ${stage[2]}"><b>${stage[0]}.</b> ${stage[1]}</div>
      <div class="grid g3 mini" style="margin:12px 0"><div class="card flat kpi"><div class="l">Balance at renewal ${'<span class="tag warn">Estimate</span>'}</div><div class="v">${$(bal)}</div></div><div class="card flat kpi"><div class="l">Years left after renewal</div><div class="v">${leftYears.toFixed(1)}</div></div><div class="card flat kpi"><div class="l">Today\u2019s payment</div><div class="v">${$(S.pmt)}</div></div></div>
      <div class="table-scroll"><table><tr><th>If you renewed at\u2026</th><th>Rate</th><th>Monthly payment</th><th>vs today</th></tr>${rows}</table></div>
      <div class="pf-q" style="max-width:260px;margin-top:12px"><label>Lender margin over the 5-yr bond (for the fixed estimate)</label><input type="text" inputmode="decimal" value="${st().fixedSpread}" onchange="EC7.setSpread(this.value)"><div class="help">An assumption. Change it to match a real quote.</div></div>
      <details class="ec-check"><summary>Renewal checklist</summary><ol class="small">
        <li>120 days out: ask your lender for an early renewal offer, and get 2 outside quotes (another lender and a broker).</li>
        <li>Compare rate, term, prepayment privileges and penalties, not just the payment.</li>
        <li>Think about how sure you are about your income over the next term before choosing fixed or variable.</li>
        <li>Ask about switching costs. Many lenders cover legal and appraisal fees when you switch at renewal.</li>
        <li>Never let it auto-renew without comparing.</li></ol></details></div>`;
  }
  const askBtnSafe = q => `<button class="ask-ai" onclick='EC7.prefill(${JSON.stringify(q).replace(/'/g, '&#39;')})' title="Ask Copilot">${ic('ai')}<span>Ask</span></button>`;
  EC7.pp = (k, v) => { const p = st().pp; p[k] = k === 'accel' ? !!v : Math.max(0, +String(v).replace(/[$,\s]/g, '') || 0); save(); render(); };
  function prepayCard() {
    if (!hasMortgage() || n(S.pmt) <= 0) return '';
    const p = st().pp, base = amort(S.bal, S.rate, S.pmt);
    if (base.months === Infinity) return '';
    const accelExtra = p.accel ? n(S.pmt) / 12 : 0, sc = amort(S.bal, S.rate, S.pmt, n(p.extra) + accelExtra, n(p.lump));
    const saved = base.int - sc.int, monthsSaved = base.months - sc.months, cap = n(S.origP) * n(S.prepayPct) / 100;
    const bonusNet = n(S.fp?.income?.bonus) * (1 - n(S.mtr) / 100), extraTotal = (n(p.extra) + accelExtra) * sc.months + n(p.lump) * Math.ceil(sc.months / 12);
    const chips = (k, vals, fmt) => vals.map(v => `<button class="chip ${n(p[k]) === v ? 'on' : ''}" onclick="EC7.pp('${k}',${v})">${fmt(v)}</button>`).join('');
    return `<div class="card"><div class="head"><div><h2>${ic('growth')} Pay it off faster</h2><div class="small mute">Try extra payments and see the years and interest you save.</div></div>${askBtnSafe('Should I prepay my mortgage or invest the money?')}</div>
      <label>Extra each month</label><div class="row">${chips('extra', [0, 100, 200, 500], v => v ? '+' + $(v) : 'None')}<input style="width:110px" type="text" inputmode="decimal" value="${n(p.extra)}" onchange="EC7.pp('extra',this.value)"></div>
      <label>Lump sum once a year</label><div class="row">${chips('lump', [0, 2000, 5000], v => v ? $(v) : 'None')}${bonusNet > 0 ? `<button class="chip ${Math.round(n(p.lump)) === Math.round(bonusNet) ? 'on' : ''}" onclick="EC7.pp('lump',${Math.round(bonusNet)})">My bonus after tax (~${$(bonusNet)})</button>` : ''}<input style="width:110px" type="text" inputmode="decimal" value="${n(p.lump)}" onchange="EC7.pp('lump',this.value)"></div>
      <label class="ec-switch"><input type="checkbox" ${p.accel ? 'checked' : ''} onchange="EC7.pp('accel',this.checked)"> Switch to accelerated bi-weekly payments <span class="small mute">(about one extra payment a year)</span></label>
      <div class="grid g3" style="margin-top:14px">
        <div class="card flat kpi"><div class="l">Mortgage-free</div><div class="v acc">${when(sc.months)}</div><div class="h">instead of ${when(base.months)}</div></div>
        <div class="card flat kpi"><div class="l">Time saved</div><div class="v pos">${monthsSaved > 0 ? (monthsSaved / 12).toFixed(1) + ' yrs' : '\u2014'}</div><div class="h">${monthsSaved > 0 ? monthsSaved + ' fewer payments' : 'Add an extra amount above'}</div></div>
        <div class="card flat kpi"><div class="l">Interest saved</div><div class="v pos">${saved > 1 ? $(saved) : '\u2014'}</div><div class="h">${extraTotal > 0 && saved > 1 ? `Each extra $1 saves about $${(saved / extraTotal).toFixed(2)}` : 'Guaranteed, tax-free return'}</div></div>
      </div><div class="sp"></div>${chart([{ n: 'Current plan', c: 'var(--mute)', d: base.path }, { n: 'With extra payments', c: 'var(--accent)', d: sc.path }], 190)}
      ${n(p.lump) > cap && cap > 0 ? `<div class="note warnnote" style="margin-top:10px">Your yearly lump sum is above your prepayment limit (about ${$(cap)} a year at ${pct(S.prepayPct, 0)} of the original amount). The calculation is capped at your limit; check your mortgage terms.</div>` : ''}
      <div class="hint">Uses your real balance, rate, payment and renewal assumptions. Prepaying within your limits has no penalty. Compare with investing under Investing \u2192 Pay down vs invest.</div></div>`;
  }

  /* ======================================================================
     6. COPILOT: you decide when to send + follow-up suggestions
     ====================================================================== */
  let draft = '';
  const SUGG = ['How can I pay my mortgage off faster?', 'TFSA, RRSP or FHSA: where should my money go first?', 'Fixed or variable at renewal?', 'How do I build an emergency fund?', 'What do the latest business deals mean for me?', 'Explain my monthly cash flow simply'];
  const touch = () => matchMedia('(pointer:coarse)').matches;
  EC7.prefill = q => { draft = q; if (cur !== 'advisor') go('advisor'); else render(); setTimeout(() => { const t = document.getElementById('q'); if (t) { t.value = q; t.focus(); t.setSelectionRange(q.length, q.length); grow(t); } }, 30); };
  window.askAbout = q => EC7.prefill(q);
  const grow = t => { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; };
  EC7.grow = grow;
  EC7.key = e => { if (e.key === 'Enter' && !e.shiftKey && !touch()) { e.preventDefault(); window.ask(); } };
  EC7.clearChat = () => { if (S.chat.length && !confirm('Start a new conversation? This one will be cleared.')) return; S.chat = []; draft = ''; save(); render(); };
  function lessonFor(text) {
    const t = String(text).toLowerCase(), map = [['tfsa', 'tfsa'], ['rrsp', 'rrsp'], ['fhsa', 'fhsa'], ['emergency', 'emergency'], ['credit score', 'credit'], ['avalanche', 'debt'], ['snowball', 'debt'], ['renew', 'mortgage'], ['prepay', 'prepay'], ['stress test', 'stress'], ['bracket', 'tax'], ['marginal', 'tax'], ['acqui', 'deals'], ['merger', 'deals'], ['inflation', 'rates'], ['prime', 'rates'], ['budget', 'budget'], ['compound', 'compound'], ['etf', 'investing'], ['diversif', 'investing']];
    const hit = map.find(([k]) => t.includes(k)); return hit ? LD.lessons.find(l => l.id === hit[1]) : null;
  }
  const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*(.+)$/gm, '<b>$1</b>').replace(/^\s*[-*]\s+/gm, '\u2022 ');
  V.advisor = () => {
    setTimeout(() => { const m = document.getElementById('msgs'); if (m) m.scrollTop = m.scrollHeight; const t = document.getElementById('q'); if (t && draft && !t.value) { t.value = draft; grow(t); } }, 0);
    const last = S.chat[S.chat.length - 1], fu = last && last.role === 'assistant' && !busy ? (last.followups || []) : [], les = last && last.role === 'assistant' ? lessonFor(last.content + ' ' + (S.chat[S.chat.length - 2]?.content || '')) : null;
    return `${head('Copilot', 'Ask anything about money', 'Plain-language answers about budgeting, mortgages, investing, taxes and business news.')}
    <div class="card chat"><div class="msgs" id="msgs">${S.chat.length ? S.chat.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${md(m.content)}</div>`).join('') :
      `<div class="small mute" style="margin-bottom:10px">Tap an idea to put it in the box, edit it if you like, then press Send.</div><div class="row">${SUGG.map(s => `<button class="chip" onclick='EC7.prefill(${JSON.stringify(s).replace(/'/g, '&#39;')})'>${esc(s)}</button>`).join('')}</div>`}
      ${busy ? `<div class="msg a"><span class="ec-typing"><i></i><i></i><i></i></span></div>` : ''}
      ${fu.length ? `<div class="ec-fu"><div class="small mute">Keep going:</div>${fu.map(s => `<button class="chip" onclick='EC7.prefill(${JSON.stringify(s).replace(/'/g, '&#39;')})'>${esc(s)}</button>`).join('')}</div>` : ''}
      ${les && !busy ? `<div class="ec-fu"><button class="chip ec-learnchip" onclick="EC7.open('${les.id}')">${ic('book')} 2-min lesson: ${esc(les.title)}</button></div>` : ''}</div>
     <div class="composer"><textarea id="q" rows="1" placeholder="Type your question\u2026" oninput="EC7.grow(this)" onkeydown="EC7.key(event)">${esc(draft)}</textarea><button class="btn" ${busy ? 'disabled' : ''} onclick="ask()" aria-label="Send">${ic('send')}<span class="ec-sendlbl">Send</span></button></div>
     <div class="row small mute" style="margin-top:10px;justify-content:space-between"><label style="margin:0;display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" style="width:auto" ${S.shareCtx ? 'checked' : ''} onchange="S.shareCtx=this.checked;save()"> Use my numbers for more personal answers</label>
     ${S.chat.length ? `<a href="#" onclick="EC7.clearChat();return false">New conversation</a>` : ''}</div></div>
    <p class="foot">General education only, not personal financial, tax or legal advice. The AI can make mistakes, so confirm important decisions with a licensed professional.</p>`;
  };
  function context() {
    if (!S.shareCtx) return null;
    try {
      const m = window.ECModel(), est = m.ic.est;
      return { note: 'Numbers under "calculated" come from EquityClimb calculators. Use them exactly. Say when information is missing.', location: area(), goal: GOALS[S.profile.goal]?.t,
        calculated: { takeHomeMonthly: Math.round(m.ic.takeHome), essentials: Math.round(m.essentials), lifestyle: Math.round(m.lifestyle), debtPayments: Math.round(m.debt), plannedSavings: Math.round(m.savings), unallocated: Math.round(m.unallocated), netWorth: Math.round(m.net), emergencyMonths: +m.emergencyMonths.toFixed(1), mortgageFree: hasMortgage() ? when(m.mp.months) : 'no mortgage', otherDebtsFree: when(m.dp.months) },
        taxEstimate: est ? { province: est.provinceName, year: est.year, grossEmployment: Math.round(est.employment), incomeTax: Math.round(est.incomeTax), marginalRate: S.mtr } : null,
        mortgage: hasMortgage() ? { balance: S.bal, rate: S.rate + '% ' + S.rtype, paymentMonthly: Math.round(m.mc.usedMonthly), amortizationYearsLeft: S.fp?.mort?.amortYears, termEnds: X.validISO(S.maturity) ? S.maturity : 'missing', primeToday: prime() } : null,
        debts: (S.debts || []).map(d => ({ name: d.name, balance: d.bal, rate: d.rate, min: d.min })),
        savings: { cash: S.cash, tfsa: S.tfsa, rrsp: S.rrsp, nonreg: S.nonreg, tfsaRoom: S.tfsaRoom, rrspRoom: S.rrspRoom }, healthScore: health()?.score, lessonsDone: Object.keys(st().learn.done) };
    } catch (e) { return { location: area() }; }
  }
  window.ask = async function (text) {
    const box = document.getElementById('q'), q = (text || box?.value || '').trim();
    if (!q || busy) return;
    S.chat.push({ role: 'user', content: q }); draft = ''; busy = true; save(); render();
    const j = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'chat', messages: S.chat.map(({ role, content }) => ({ role, content })), context: context() }) }).catch(() => ({ error: 'Network error. Check your connection.' }));
    let msg;
    if (j.error) {
      const reset = j.resetAt ? new Date(j.resetAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }) : '';
      msg = j.code === 'limit' ? `Today\u2019s free AI allowance is used up. It resets at ${reset}. Your calculators, lessons and news all still work.` : '\u26A0 ' + j.error + ' Your calculators still work without the AI.';
    } else msg = j.text;
    S.chat.push({ role: 'assistant', content: msg, followups: j.followups || [] });
    busy = false; save(); render();
    if (!j.error && S.chat.filter(m => m.role === 'user').length === 1) xp(5, 'First question asked');
  };

  /* ======================================================================
     7. MARKET: intelligence feed + Deal Tracker (replaces v5-market.js)
     ====================================================================== */
  const GEO = () => [['all', 'All'], ['local', S.profile.city || 'Local'], ['province', S.profile.region || 'Province'], ['national', 'Canada'], ['global', 'Global']];
  const CATS = [['all', 'All intelligence'], ['realestate', 'Real estate'], ['corpdev', 'Corp Dev & Deals'], ['capital', 'Capital Markets & IR'], ['opportunities', 'Business opportunities'], ['finance', 'Finance & economy'], ['government', 'Government & policy']];
  const WHY = { realestate: 'Housing news can move home prices, rents and what buyers can afford.', corpdev: 'Deals change who owns companies. Target shareholders usually get a premium; jobs, suppliers and local businesses can be affected.', capital: 'Results, dividends and financing show how healthy a company is and can move its share price (and your pension or ETFs).', opportunities: 'New projects, contracts and funding can mean jobs, work for local businesses and places to invest or start something.', finance: 'Rates, inflation and jobs drive mortgage costs, savings returns and the wider economy.', government: 'New rules, taxes and programs can change what you pay or what help is available.' };
  const guess = t => { t = t.toLowerCase(); if (/acqui|merger|takeover|to buy|sell|divest|deal/.test(t)) return 'corpdev'; if (/earning|dividend|results|quarter|shares|ipo|offering/.test(t)) return 'capital'; if (/housing|home|rent|real estate|condo|mortgage/.test(t)) return 'realestate'; if (/rate|inflation|bank of canada|gdp|jobs|economy|oil/.test(t)) return 'finance'; if (/budget|tax|government|minister|policy|regulat/.test(t)) return 'government'; if (/contract|project|grant|funding|expan|invest/.test(t)) return 'opportunities'; return ''; };
  let MKT = { items: null, msg: '', err: '', deals: null, loading: false, status: '' };
  EC7.mset = (k, v) => { st().market[k] = v; save(); MKT.items = null; render(); loadMarket(); };
  EC7.mrefresh = () => loadMarket(true);
  async function loadMarket(force) {
    const m = st().market, key = `m8_${m.scope}_${m.cat}_${area()}`;
    if (!force) { const c = cache.get(key, 10); if (c) { MKT.items = c.items; MKT.msg = c.message || ''; MKT.err = ''; paintMarket(); loadDeals(); return; } }
    MKT.loading = true; MKT.status = 'Refreshing\u2026'; paintMarket(true);
    const q = new URLSearchParams({ scope: m.scope, category: m.cat, city: S.profile.city || '', region: S.profile.region || '', country: S.profile.country || 'CA' });
    if (force) q.set('fresh', '1');
    const j = await api('/api/news?' + q).catch(() => ({ items: [], error: 'Network error' }));
    MKT.loading = false;
    if (j.items?.length) { MKT.items = j.items; MKT.msg = j.message || ''; MKT.err = ''; cache.set(key, { items: j.items, message: j.message }); MKT.status = 'Updated just now'; }
    else { MKT.items = MKT.items || []; MKT.err = j.error || 'No stories came back. Tap Refresh to try again.'; MKT.status = 'Couldn\u2019t refresh'; }
    try { NEWS.local = MKT.items; } catch (e) {}
    paintMarket(); loadDeals(force); loadBrief(force);
  }
  async function loadDeals(force) {
    const key = 'deals8_' + (S.profile.region || '');
    if (!force) { const c = cache.get(key, 120); if (c) { MKT.deals = c; paintDeals(); return; } }
    const j = await api('/api/news?' + new URLSearchParams({ mode: 'deals', region: S.profile.region || 'Alberta', ...(force ? { fresh: '1' } : {}) })).catch(() => ({ deals: [] }));
    MKT.deals = j.deals || []; if (MKT.deals.length) cache.set(key, MKT.deals); paintDeals();
  }
  async function loadBrief(force) {
    const el = document.getElementById('mk-brief'); if (!el || typeof aiBrief !== 'function') return;
    try { const b = await aiBrief('all', force); const e2 = document.getElementById('mk-brief'); if (e2) e2.innerHTML = briefHtml(b, false) + (b?.learn ? `<div class="note" style="margin-top:12px">${ic('book')} <b>Learn:</b> ${esc(b.learn)}</div>` : ''); } catch (e) {}
  }
  function story(x) {
    const c = x.category && x.category !== 'all' ? x.category : guess(x.title), lab = (CATS.find(k => k[0] === c) || [, ''])[1];
    return `<div class="v5-story"><div class="v5-meta">${lab ? `<span class="v5-badge">${esc(lab)}</span>` : ''}<span>${esc(x.source || '')}</span><span>\u00B7 ${ago(x.date)}</span>${x.widenedFrom ? `<span class="tag">${esc(x.scope === 'national' ? 'Canada' : x.scope === 'province' ? (S.profile.region || 'Province') : 'Global')}</span>` : ''}</div>
      <a class="v5-title" href="${attr(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a>
      ${c && WHY[c] ? `<div class="v5-why"><b>Why it matters:</b> ${WHY[c]}</div>` : ''}</div>`;
  }
  function paintMarket(loadingOnly) {
    const st1 = document.getElementById('mk-status'); if (st1) { st1.textContent = MKT.status; st1.className = 'v5-status ' + (MKT.status.startsWith('Updated') ? 'ok' : MKT.status.startsWith('Couldn') ? 'fail' : ''); }
    const b = document.querySelector('.v5-refresh'); if (b) b.classList.toggle('loading', MKT.loading);
    if (loadingOnly && MKT.items) return;
    const el = document.getElementById('mk-list'); if (!el) return;
    if (!MKT.items) { el.innerHTML = loading(6); return; }
    el.innerHTML = (MKT.msg ? `<div class="note" style="margin-bottom:8px">${esc(MKT.msg)}</div>` : '') + (MKT.items.length ? MKT.items.map(story).join('') : `<div class="v5-empty">${esc(MKT.err || 'Nothing yet.')}</div>`);
  }
  function paintDeals() {
    const el = document.getElementById('mk-deals'); if (!el) return;
    const d = MKT.deals;
    if (!d) { el.innerHTML = loading(4); return; }
    if (!d.length) { el.innerHTML = '<div class="small mute">No deal headlines found in the last 30 days. Tap Refresh to check again.</div>'; return; }
    el.innerHTML = d.map(x => `<div class="ec-deal"><div class="row" style="justify-content:space-between;gap:6px"><span class="tag ${x.status === 'Completed' ? 'pos' : x.status === 'Proposed' ? 'warn' : 'acc'}">${esc(x.status || 'Announced')}</span>${x.value ? `<b class="acc">${esc(x.value)}</b>` : ''}</div>
      ${x.buyer && x.target ? `<div class="ec-dealwho">${esc(x.buyer)} <span class="mute">\u2192</span> ${esc(x.target)}</div>` : ''}
      <a class="v5-title" style="font-size:13.5px" href="${attr(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a>
      ${x.plain ? `<div class="small mute" style="margin-top:4px">${esc(x.plain)}</div>` : ''}<div class="small mute" style="margin-top:4px">${esc(x.source || '')} \u00B7 ${ago(x.date)}</div></div>`).join('') +
      `<div class="small mute" style="margin-top:10px">Deals from the last 30 days. \u201CAnnounced\u201D deals still need approvals and can change. <a href="#" onclick="EC7.open('deals');return false">How to read a deal (2 min)</a></div>`;
  }
  V.market = () => {
    const m = st().market;
    setTimeout(() => { paintMarket(); paintDeals(); if (!MKT.items) loadMarket(); else { loadDeals(); loadBrief(); } }, 0);
    return `${head('Market', 'Market intelligence', `Business, deals, real estate and the economy for ${esc(area())}, with what it means for you.`)}
      ${rateStrip()}<div class="sp"></div>
      <div class="v5-controls">
        <div class="v5-geo">${GEO().map(([k, l]) => `<button class="${m.scope === k ? 'on' : ''}" onclick="EC7.mset('scope','${k}')">${esc(l)}</button>`).join('')}</div>
        <div class="v5-categories">${CATS.map(([k, l]) => `<button class="${m.cat === k ? 'on' : ''}" onclick="EC7.mset('cat','${k}')">${l}</button>`).join('')}</div>
        <select class="v5-category-select" onchange="EC7.mset('cat',this.value)">${CATS.map(([k, l]) => `<option value="${k}" ${m.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <div class="v5-refresh-line"><span id="mk-status" class="v5-status">${esc(MKT.status)}</span><button class="btn ghost sm v5-refresh refresh-btn" onclick="EC7.mrefresh()">${ic('refresh')}Refresh</button></div>
      </div>
      <div class="v5-layout"><div class="card news"><div id="mk-list">${loading(6)}</div></div>
        <div><div class="card v5-side-card"><div class="head" style="margin-bottom:8px"><div><h2>${ic('deal')} Deal Tracker</h2><div class="small mute">Who\u2019s buying whom, in Canada and ${esc(S.profile.region || 'your province')}</div></div></div><div id="mk-deals">${loading(4)}</div></div>
        <div class="card v5-side-card"><h2>What it means</h2><div class="small mute" style="margin-bottom:12px">AI reads today\u2019s rates and headlines</div><div id="mk-brief">${loading(5)}</div></div></div></div>
      <div class="sp"></div>${typeof homeScenarios === 'function' ? homeScenarios() : ''}
      <p class="foot">Headlines link to the original publishers (via Google News, press-release wires, CBC, BOE Report, Financial Post and GDELT). Deal details are read from headlines and can be incomplete. AI summaries can be wrong; treat them as a starting point, not advice.</p>`;
  };

  /* ======================================================================
     8. PAGES: Home, Debt, Settings, More, Onboarding
     ====================================================================== */
  const home0 = V.home;
  V.home = () => {
    const h = home0(), add = `${reminders()}<div class="grid g2 ec-top">${healthCard()}${moneyMinute()}</div><div class="sp"></div>`;
    const i = h.indexOf('<div class="grid g4">');
    return i >= 0 ? h.slice(0, i) + add + h.slice(i) : add + h;
  };
  const debt0 = V.debt;
  V.debt = () => { const h = debt0(); return dTab === 'mortgage' && hasMortgage() ? `${h}<div class="sp"></div>${renewalCard()}<div class="sp"></div>${prepayCard()}` : h; };
  const set0 = V.settings;
  V.settings = () => {
    const r = window.EC_RULES, s = st();
    return `${accountCard(false)}<div class="sp"></div>${set0()}<div class="sp"></div>
      <div class="grid g2"><div class="card"><h2>${ic('shield')} Backups</h2><div class="small mute">${s.lastBackup ? `Last backup: ${new Date(s.lastBackup + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}.` : 'No backup saved yet.'} ${session() ? 'Your account sync also keeps a copy.' : 'We\u2019ll remind you every 30 days.'}</div><button class="btn sm" style="margin-top:10px" onclick="exportData()">Save backup now</button></div>
      <div class="card"><h2>Canadian rules in use</h2><div class="small mute">${r ? `Tax year <b>${r.year}</b> \u00B7 ${r.status === 'official' ? 'official values' : 'auto-calculated from the official formula; some values are estimates until announced'}. TFSA ${money0(r.limits.tfsa)} \u00B7 RRSP limit ${money0(r.limits.rrsp)} \u00B7 FHSA ${money0(r.limits.fhsaAnnual)}/yr.<br>Checked ${ago(r.checked)}. Updates itself every January.` : 'Loading\u2026'}</div></div></div>`;
  };
  const more0 = V.more;
  V.more = () => { const h = more0(), item = `<div class="it" style="cursor:pointer;align-items:center" onclick="go('learn')"><span class="moreic">${ic('book')}</span><h3 style="flex:1">Learn <span class="tag acc">${st().learn.streak || 0}-day streak</span></h3><span class="mute">\u203A</span></div>`; return h.replace('<div class="list card">', '<div class="list card">' + item); };
  const ob0 = V.onboard;
  V.onboard = () => { const h = ob0(); return ob === 1 && sync.cfg?.syncReady ? h + `<div class="ob" style="margin-top:-3vh">${accountCard(true)}</div>` : h; };

  /* ---------- navigation: add Learn ---------- */
  const render0 = window.render;
  window.render = function () {
    render0();
    try {
      const view = S.profile.onboarded ? cur : 'onboard', side = document.getElementById('side');
      if (side && S.profile.onboarded && !side.querySelector('[data-ec7learn]')) {
        const b = document.createElement('button'); b.className = 'nav' + (view === 'learn' ? ' on' : ''); b.setAttribute('data-ec7learn', '1'); b.setAttribute('onclick', "go('learn')"); b.innerHTML = ic('book') + '<span>Learn</span>';
        const after = [...side.querySelectorAll('button.nav')].find(x => /go\('goals'\)/.test(x.getAttribute('onclick') || ''));
        if (after) after.after(b); else side.querySelector('.navsep')?.before(b);
      }
      if (view === 'learn') document.querySelectorAll('#tabbar .nav').forEach(x => { if (/go\('more'\)/.test(x.getAttribute('onclick') || '')) x.classList.add('on'); });
      if (view !== 'market') { MKT.status = ''; }
      const modal = choiceModal(); document.getElementById('ec-modal-host')?.remove();
      if (modal) { const d = document.createElement('div'); d.id = 'ec-modal-host'; d.innerHTML = modal; document.body.appendChild(d); }
      drawGsi();
    } catch (e) { console.error(e); }
  };

  /* ---------- start ---------- */
  save();
  render();
  loadRules();
  initSync();
})();
