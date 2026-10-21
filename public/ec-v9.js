/* EquityClimb v9 (lean) - Neighbourhoods page: scorecard out of 10 + school / safety / transit / flood links.
   Only ADDS to the existing page. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof areasHtml !== 'function') return;
  const e = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const g = q => 'https://www.google.com/search?q=' + encodeURIComponent(q);
  const place = () => (typeof areaCity !== 'undefined' && areaCity) || S.profile.city || 'Edmonton';
  const prov = () => S.profile.region || 'AB';

  function links(name) {
    const full = `${name} ${place()}`;
    return `<div class="ec9-links">
      <a target="_blank" rel="noopener" href="https://www.compareschoolrankings.org/">\uD83C\uDF93 School rankings</a>
      <a target="_blank" rel="noopener" href="${g(full + ' schools catchment ' + prov())}">\uD83C\uDFEB Schools nearby</a>
      <a target="_blank" rel="noopener" href="${g(full + ' police community crime map')}">\uD83D\uDEE1\uFE0F Crime map</a>
      <a target="_blank" rel="noopener" href="${g(full + ' walk score transit')}">\uD83D\uDEB6 Walk &amp; transit</a>
      <a target="_blank" rel="noopener" href="${g(full + ' flood map ' + prov())}">\uD83C\uDF0A Flood risk</a></div>`;
  }

  const base = window.areasHtml;
  window.areasHtml = function (A) {
    let h = base.apply(this, arguments);
    const list = (A && A.neighbourhoods) || [];
    if (!list.length) return h;
    // school / safety links under each neighbourhood's "See listings" link
    list.forEach(n => {
      const needle = encodeURIComponent(n.name + ' ' + place() + ' homes for sale'), i = h.indexOf(needle);
      if (i < 0) return;
      const end = h.indexOf('</a>', i);
      if (end > -1) h = h.slice(0, end + 4) + links(n.name) + h.slice(end + 4);
    });
    // scorecard out of 10
    const keys = ['family', 'commute', 'walkability', 'value', 'nightlife'];
    const mine = (S.priorities && S.priorities.length ? S.priorities : ['Family', 'Commute', 'Walkability', 'Value', 'Nightlife']).map(x => x.toLowerCase());
    const avg = (n, ks) => (ks.reduce((a, k) => a + (+(n.scores && n.scores[k]) || 0), 0) / ks.length * 2);
    const sorted = [...list].sort((a, b) => avg(b, mine) - avg(a, mine));
    const cell = v => `<td><span class="ec8-pill" style="--s:${v.toFixed(1)}">${v.toFixed(1)}</span></td>`;
    const card = `<div class="card"><div class="head"><div><h2>Neighbourhood scorecard</h2><div class="small mute">Scores out of 10. \u201CYour fit\u201D uses only what matters to you.</div></div></div>
      <div style="overflow-x:auto"><table class="ec8-sc"><tr><th style="text-align:left">Area</th><th>Family</th><th>Commute</th><th>Walk</th><th>Value</th><th>Nightlife</th><th>Overall</th><th>Your fit</th></tr>
      ${sorted.map(n => `<tr><td style="text-align:left"><b>${e(n.name)}</b></td>${keys.map(k => cell(avg(n, [k]))).join('')}${cell(avg(n, keys))}<td><b class="acc">${avg(n, mine).toFixed(1)}</b></td></tr>`).join('')}</table></div></div><div class="sp"></div>`;
    return card + h;
  };
})();
