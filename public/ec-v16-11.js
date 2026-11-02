/* EquityClimb v16.11 — Home market placement and complete rate cards.
   Presentation only: rates and calculations are supplied by existing validated feeds. */
(() => {
  'use strict';
  if (window.__ec1611 || !window.V || typeof window.rateStrip !== 'function') return;
  window.__ec1611 = true;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const fmtDate = raw => {
    const iso = String(raw || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Date unavailable';
    const time = Date.parse(iso + 'T12:00:00Z');
    return Number.isFinite(time)
      ? new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(time))
      : 'Date unavailable';
  };
  const valueOf = rate => {
    const n = rate?.value === '' || rate?.value == null ? NaN : Number(rate.value);
    return Number.isFinite(n) ? n.toFixed(2) : null;
  };
  const verifiedSource = raw => {
    try {
      const url = new URL(String(raw || ''));
      if (url.protocol !== 'https:') return null;
      const host = url.hostname.toLowerCase();
      if (host === 'bankofcanada.ca' || host.endsWith('.bankofcanada.ca') ||
          ['td.mediaroom.com', 'www.td.com', 'www.rbc.com'].includes(host)) return url.href;
    } catch (_) { /* Untrusted or missing source link. */ }
    return null;
  };
  const ageMessage = iso => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return 'Date not reported';
    const age = (Date.now() - Date.parse(iso + 'T12:00:00Z')) / 86400000;
    return Number.isFinite(age) && age > 35 ? 'Older observation — verify' : '';
  };
  const bankSource = 'https://www.bankofcanada.ca/';
  const seriesSource = id => 'https://www.bankofcanada.ca/valet/observations/' + id + '/json?recent=10';

  const previousRateStrip = window.rateStrip;
  window.rateStrip = function (...args) {
    const html = previousRateStrip.apply(this, args);
    const rates = typeof RATES === 'undefined' ? null : RATES;
    if (!rates || !rates.prime) return html; // Preserve the existing unavailable-data state.
    try {
      const template = document.createElement('template');
      template.innerHTML = html;
      const grid = template.content.querySelector('.ec8-rates');
      if (!grid) return html;

      // An announced lender rate has its own effective date. Never imply it
      // was the latest daily/weekly BoC observation or a guaranteed offer.
      const confirmed = rates.primeAnnouncement;
      const announced = confirmed && valueOf(confirmed) !== null &&
        String(confirmed.effectiveDate || '') >= String(rates.prime?.date || '');
      const prime = announced ? confirmed : rates.prime;
      const policyAnnouncement = rates.policyAnnouncement || (rates.policy?.announced ? rates.policy : null);
      const policy = rates.policy || policyAnnouncement;
      const policyEffective = policyAnnouncement?.effectiveDate;
      const primeDate = announced ? confirmed.effectiveDate : prime?.date;
      const primeTitle = announced ? 'Lender confirmed' : 'BoC weekly series';

      const items = [
        {
          key: 'prime', index: '01', label: 'Bank prime', category: primeTitle,
          rate: prime, date: primeDate, dateKind: announced ? 'Effective' : 'Observed',
          note: 'Reference for many variable-rate mortgages; lenders set their own rates.',
          source: announced ? (confirmed.lender || 'Confirmed lender') : 'Bank of Canada',
          url: (announced && verifiedSource(confirmed.sourceUrl)) || seriesSource('V80691311')
        },
        {
          key: 'policy', index: '02', label: 'BoC policy', category: 'Central bank',
          rate: policy, date: policyEffective || policy?.date,
          dateKind: policyEffective ? 'Effective' : 'Observed',
          note: 'The Bank of Canada target overnight rate. Not a mortgage rate.',
          source: 'Bank of Canada',
          url: verifiedSource(policyAnnouncement?.sourceUrl) ||
            'https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/'
        },
        {
          key: 'bond', index: '03', label: '5-year bond', category: 'Government yield',
          rate: rates.bond5, date: rates.bond5?.date, dateKind: 'Observed',
          note: 'Government of Canada yield; one influence on fixed mortgage pricing.',
          source: 'Bank of Canada',
          url: seriesSource('BD.CDN.5YR.DQ.YLD')
        },
        {
          key: 'posted', index: '04', label: '5-year posted', category: 'Mortgage benchmark',
          rate: rates.fiveYearPosted, date: rates.fiveYearPosted?.date, dateKind: 'Observed',
          note: 'Published conventional posted rate; not a personalized lender offer.',
          source: 'Bank of Canada',
          url: seriesSource('V80691335')
        }
      ];
      grid.classList.add('ec1611-rates');
      grid.setAttribute('aria-label', 'Canadian interest rate benchmarks');
      grid.innerHTML = items.map(item => {
        const amount = valueOf(item.rate);
        const observation = item.date ? item.dateKind + ' ' + fmtDate(item.date) : 'Date unavailable';
        const age = ageMessage(item.date);
        return '<article class="card flat kpi ec1611-rate-card" data-rate="' + esc(item.key) + '">' +
          '<div class="ec1611-rate-top"><span>' + item.index + ' / 04</span><span>' + esc(item.category) + '</span></div>' +
          '<h3 class="ec1611-rate-name">' + esc(item.label) + '</h3>' +
          '<div class="ec1611-rate-number">' + (amount === null ? '<span class="ec1611-no-value">Unavailable</span>' :
            esc(amount) + '<span class="ec1611-percent">%</span>') + '</div>' +
          '<p class="ec1611-rate-note">' + esc(item.note) + '</p>' +
          '<div class="ec1611-rate-bottom"><div class="ec1611-rate-date">' + esc(observation) +
            (age ? '<small>' + esc(age) + '</small>' : '') + '</div>' +
          '<div class="ec1611-rate-source"><span>' + esc(item.source) + '</span>' +
            '<a href="' + esc(item.url || bankSource) + '" target="_blank" rel="noopener noreferrer"' +
            ' aria-label="View official source for ' + esc(item.label) + '">Source ↗</a></div></div>' +
          '</article>';
      }).join('');
      const wrapper = document.createElement('div');
      wrapper.append(template.content);
      return wrapper.innerHTML;
    } catch (error) {
      console.warn('Market card enhancement unavailable; original rates retained', error);
      return html;
    }
  };

  // v15.3 has already organized Home. Move the WHOLE Market section
  // beneath the financial KPIs, preserving its source details and insight panel.
  if (typeof V.home === 'function') {
    const previousHome = V.home;
    V.home = function (...args) {
      const html = previousHome.apply(this, args);
      try {
        const template = document.createElement('template');
        template.innerHTML = html;
        const root = template.content;
        const snapshot = root.querySelector('.ec153-primary-metrics');
        const market = root.querySelector('.ec153-market');
        const heading = [...root.querySelectorAll('.ec153-section-heading')]
          .find(el => el.querySelector('h2')?.textContent?.trim() === 'Rates and market');
        if (!snapshot || !market || !heading) return html;
        const insights = root.querySelector('.ec153-insights');
        const gap = snapshot.nextElementSibling;
        if (gap?.classList?.contains('sp')) gap.remove();
        snapshot.after(heading, market, ...(insights ? [insights] : []));
        market.classList.add('ec1611-market-panel');
        heading.classList.add('ec1611-market-heading');
        const wrapper = document.createElement('div');
        wrapper.append(root);
        return wrapper.innerHTML;
      } catch (error) {
        console.warn('Home market placement unavailable; original layout retained', error);
        return html;
      }
    };
  }
  try {
    if (typeof S !== 'undefined' && S.profile?.onboarded &&
        typeof cur !== 'undefined' && cur === 'home' && typeof render === 'function') render();
  } catch (_) { /* The next normal Home render applies the enhancement. */ }
})();