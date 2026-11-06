/* Equity Climb optional RealtyNinja MLS/IDX search mount.
 * OFF until the provider approves Equity Climb and supplies an embeddable HTTPS frame URL.
 * This is an embedded provider experience; it is NOT an MLS data API, crawler or listing import.
 */
(() => {
  'use strict';
  if (window.__ecIDX || typeof V === 'undefined' || typeof V.homes !== 'function') return;
  window.__ecIDX = true;

  // Configure ONLY after written provider approval for the precise deployed website/domain.
  // RealtyNinja commonly supplies a SCRIPT-based snippet, not a standalone iframe URL.
  // Do not guess an iframe URL or add third-party scripts to the financial app shell.
  const config = Object.freeze({
    enabled: false,
    approvedHost: '',
    iframeUrl: ''
  });
  const escaped = value => String(value).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function authorizedIframeUrl() {
    if (!config.enabled || !config.approvedHost ||
        location.hostname.toLowerCase() !== config.approvedHost.toLowerCase()) return null;
    try {
      const url = new URL(config.iframeUrl);
      const host = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || url.username || url.password ||
          !(host === 'realtyninja.com' || host.endsWith('.realtyninja.com'))) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function widgetPanel(url) {
    return '<section class="ecidx-panel card" aria-label="Partner MLS listing search">' +
      '<div class="ecidx-heading"><div><span class="ecidx-kicker">AUTHORIZED PROVIDER SEARCH</span>' +
      '<h2>Explore current homes</h2><p>This search runs inside a RealtyNinja widget. ' +
      'Listings, filters, lead forms and updates belong to the provider, not Equity Climb.</p></div>' +
      '<a href="' + escaped(url) + '" target="_blank" rel="noopener noreferrer">Open property search ↗</a></div>' +
      '<iframe class="ecidx-frame" title="RealtyNinja property search" src="' + escaped(url) + '"' +
      ' loading="lazy" referrerpolicy="strict-origin-when-cross-origin"' +
      ' sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox">' +
      '</iframe>' +
      '<p class="ecidx-footnote">Searching here does not automatically copy MLS details into ' +
      'your Decision Lab. For analysis, enter and verify the property information yourself.</p></section>';
  }

  const previous = V.homes;
  V.homes = function (...args) {
    const html = previous.apply(this, args);
    const url = authorizedIframeUrl();
    // Leave the original Real Estate page entirely untouched until authorization is complete.
    if (!url || !html.includes('<section class="card ec13-search"')) return html;
    return html.replace('<section class="card ec13-search"', widgetPanel(url) +
      '<section class="card ec13-search"');
  };

  window.ECIdx = Object.freeze({
    isConnected: () => !!authorizedIframeUrl()
  });
})();
