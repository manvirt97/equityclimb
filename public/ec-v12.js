/* EquityClimb v12 - Budget page: no empty space.
   The five budget cards flow into two columns like a pinboard: each card goes under whichever column is shorter,
   always in the order 1-2-3-4-5, so there are never gaps between cards. Below laptop width it is one column in order.
   Loads after ec-v10.js (which collects the five cards into one container); it only moves those cards around. */
(function () {
  'use strict';
  if (window.__ec12) return;
  window.__ec12 = true;
  const WIDE = () => window.innerWidth > 1180;     // same breakpoint as the style sheet
  const GAP = 16;
  let ro = null, timer = 0;

  const div = c => { const d = document.createElement('div'); d.className = c; return d; };
  function layoutBudget() {
    const g = document.querySelector('.ec10-budget'); if (!g) return;
    const cards = [...g.querySelectorAll('.ec10-bcard')].sort((a, b) => (+a.dataset.n) - (+b.dataset.n));
    if (cards.length < 2) return;
    let cols = [...g.children].filter(c => c.classList && c.classList.contains('ec10-col'));

    if (!WIDE()) {                                   // narrow: one column, in order
      if (cols.length) { cards.forEach(c => g.appendChild(c)); cols.forEach(c => c.remove()); g.classList.remove('ec10-mason'); }
      watch(cards); return;
    }
    if (cols.length !== 2) {                         // wide: make two equal columns, start with everything in the first
      cols.forEach(c => c.remove());
      const a = div('ec10-col'), b = div('ec10-col');
      g.classList.add('ec10-mason'); g.appendChild(a); g.appendChild(b);
      cards.forEach(c => a.appendChild(c)); cols = [a, b];
    }
    const [a, b] = cols;
    const hs = cards.map(c => c.offsetHeight);       // both columns are the same width, so these heights are exact
    let ha = 0, hb = 0;
    const plan = cards.map((c, i) => { if (ha <= hb) { ha += hs[i] + GAP; return 0; } hb += hs[i] + GAP; return 1; });
    const now = cards.map(c => (c.parentNode === a ? 0 : 1));
    if (plan.some((p, i) => p !== now[i])) {
      const ae = document.activeElement;
      if (ae && g.contains(ae) && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;   // never move a box while you're typing in it
      cards.forEach((c, i) => (plan[i] === 0 ? a : b).appendChild(c));
    }
    watch(cards);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { try { layoutBudget(); } catch (_) { /* never break the page */ } }, 80); }
  function watch(cards) {                            // re-flow if a card grows or shrinks (new line, longer text, etc.)
    if (typeof ResizeObserver === 'undefined') return;
    if (ro) ro.disconnect(); else ro = new ResizeObserver(schedule);
    cards.forEach(c => ro.observe(c));
  }

  const render0 = window.render;
  if (typeof render0 === 'function') {
    window.render = function () {
      const out = render0.apply(this, arguments);
      try { layoutBudget(); requestAnimationFrame(layoutBudget); } catch (_) { /* never block the page */ }
      return out;
    };
  }
  window.addEventListener('resize', schedule);
  document.addEventListener('focusout', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  window.EC12 = { layoutBudget };
  try { layoutBudget(); } catch (_) { /* page not on Budget yet */ }
})();
