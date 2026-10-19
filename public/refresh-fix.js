/* EquityClimb refresh-button fix v1
   Works alongside the existing refresh code; does not replace it.
   1. Taps are never lost: if the page redraws while your finger is on the button,
      the tap is passed on to the new button.
   2. The button spins from the moment you tap until the data actually arrives,
      even if the page redraws in between.
   3. A short status message shows "Refreshing...", "Updated just now" or an error. */
(function () {
  'use strict';
  if (window.__ecRefreshFix) return; window.__ecRefreshFix = true;

  /* ---- styles ---- */
  var css = '' +
    '.refresh-btn,.ec-refresh{touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer;user-select:none;-webkit-user-select:none}' +
    '.ec-spin svg{animation:ecspin .8s linear infinite;transform-origin:50% 50%}' +
    '.ec-spin{opacity:.9}' +
    '.ec-done{border-color:rgba(103,196,154,.55)!important;color:var(--pos,#67c49a)!important;animation:ecpulse .7s ease}' +
    '@keyframes ecspin{to{transform:rotate(360deg)}}' +
    '@keyframes ecpulse{50%{box-shadow:0 0 0 6px rgba(103,196,154,.12)}}' +
    '@media (prefers-reduced-motion:reduce){.ec-spin svg{animation-duration:2s}}';
  var st = document.createElement('style'); st.setAttribute('data-ec-refresh', ''); st.textContent = css; document.head.appendChild(st);

  /* ---- which elements are refresh buttons ---- */
  function asRefresh(el) {
    var b = el && el.closest ? el.closest('button,a,[role="button"]') : null;
    if (!b) return null;
    if (b.classList.contains('refresh-btn')) return b;
    var txt = [b.getAttribute('onclick'), b.getAttribute('aria-label'), b.getAttribute('title'), (b.textContent || '').slice(0, 40)].join(' ');
    return /refresh/i.test(txt) ? b : null;
  }
  function allRefresh() {
    return Array.prototype.filter.call(document.querySelectorAll('button,a,[role="button"]'), function (b) { return asRefresh(b) === b; });
  }
  function keyOf(b) {
    var cls = Array.prototype.filter.call(b.classList, function (c) { return !/^(ec-|refreshing$|success$|on$|active$)/.test(c); }).sort().join(' ');
    return (b.getAttribute('onclick') || '') + '|' + cls + '|' + (b.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* ---- track data requests (/api/..., not the AI chat) ---- */
  var inflight = 0, failed = false;
  function tracked(input) {
    try {
      var u = new URL(typeof input === 'string' ? input : input.url, location.href);
      return u.origin === location.origin && u.pathname.indexOf('/api/') === 0 && u.pathname.indexOf('/api/ai') !== 0;
    } catch (e) { return false; }
  }
  if (typeof window.fetch === 'function') {
    var orig = window.fetch;
    window.fetch = function (input) {
      if (!tracked(input)) return orig.apply(this, arguments);
      inflight++; update();
      return orig.apply(this, arguments).then(function (r) {
        if (!r || !r.ok) failed = true;
        return r;
      }, function (e) { failed = true; throw e; }).finally(function () { inflight = Math.max(0, inflight - 1); update(); });
    };
  }

  /* ---- spinning state ---- */
  var spinning = false, startedAt = 0, sawRequest = false, timer = null, STATUS_TXT = 'Refreshing\u2026', statusSet = [];
  function paint() {
    allRefresh().forEach(function (b) {
      b.classList.add('ec-refresh');
      if (spinning) { if (!b.classList.contains('ec-spin')) b.classList.add('ec-spin'); b.setAttribute('aria-busy', 'true'); }
      else { b.classList.remove('ec-spin'); b.removeAttribute('aria-busy'); }
    });
  }
  function setStatus(text, cls) {
    Array.prototype.forEach.call(document.querySelectorAll('.refresh-status'), function (s) {
      if (cls === null && statusSet.indexOf(s) < 0) statusSet.push(s);
      if (cls !== null && s.textContent !== STATUS_TXT) return; // the app already wrote its own message; keep it
      s.textContent = text; s.classList.remove('ok', 'fail'); if (cls) s.classList.add(cls);
    });
  }
  function start() {
    spinning = true; startedAt = Date.now(); sawRequest = inflight > 0; failed = false;
    paint(); setStatus(STATUS_TXT, null);
    clearTimeout(timer); timer = setTimeout(update, 2500); // if nothing starts within 2.5 s, finish
  }
  function finish() {
    spinning = false; paint();
    var ok = !failed;
    setStatus(ok ? 'Updated just now' : 'Couldn\u2019t refresh. Check your connection and try again.', ok ? 'ok' : 'fail');
    if (ok) allRefresh().forEach(function (b) { b.classList.add('ec-done'); setTimeout(function () { b.classList.remove('ec-done'); }, 900); });
  }
  function update() {
    if (inflight > 0) sawRequest = true;
    if (!spinning) return;
    var elapsed = Date.now() - startedAt;
    if (inflight > 0) { paint(); return; }
    if (elapsed < 800) { clearTimeout(timer); timer = setTimeout(update, 800 - elapsed); return; } // always visible for at least 0.8 s
    if (!sawRequest && elapsed < 2500) return;
    clearTimeout(timer); finish();
  }

  /* ---- keep the spin on buttons the page redraws ---- */
  var mo = new MutationObserver(function () { if (spinning) paint(); else allRefresh().forEach(function (b) { b.classList.add('ec-refresh'); }); });
  mo.observe(document.body, { childList: true, subtree: true });

  /* ---- taps: start feedback immediately, and never lose a tap ---- */
  var pending = null, synthetic = false;
  document.addEventListener('click', function (e) {
    var b = asRefresh(e.target); if (!b) return;
    if (pending) pending.fired = true;
    if (!synthetic && spinning && Date.now() - startedAt < 400) return; // ignore accidental double taps for feedback only
    start();
  }, true);
  document.addEventListener('pointerdown', function (e) {
    var b = asRefresh(e.target); if (!b) { pending = null; return; }
    pending = { btn: b, key: keyOf(b), x: e.clientX, y: e.clientY, t: Date.now(), fired: false };
  }, true);
  document.addEventListener('pointerup', function (e) {
    var p = pending; if (!p) return;
    if (Date.now() - p.t > 1200 || Math.abs(e.clientX - p.x) > 12 || Math.abs(e.clientY - p.y) > 12) { pending = null; return; }
    setTimeout(function () {
      if (pending !== p) return; pending = null;
      if (p.fired || p.btn.isConnected) return;        // normal tap already worked
      var again = allRefresh().filter(function (b) { return keyOf(b) === p.key; })[0];
      if (again) { synthetic = true; try { again.click(); } finally { synthetic = false; } } // tap was lost to a redraw: replay it
    }, 120);
  }, true);

  paint();
})();
