/* EquityClimb BYOK News Connector v1
   Each visitor may save a personal Currents API key in that browser.
   The key is attached only to same-origin /api/news requests. */
(() => {
  'use strict';
  const STORAGE_KEY = 'equityclimb_currents_api_key';
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input.url;
    const url = new URL(raw, location.href);
    if (url.origin === location.origin && url.pathname === '/api/news') {
      const key = localStorage.getItem(STORAGE_KEY) || '';
      if (key) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('X-Currents-Key', key);
        init = { ...init, headers };
      }
    }
    return nativeFetch(input, init);
  };

  function mask(key) {
    if (!key) return 'Not connected';
    return `Connected ••••${key.slice(-4)}`;
  }

  async function testKey(key) {
    const r = await nativeFetch('/api/news?scope=national&category=all&city=Calgary&region=Alberta&country=CA&test=1', {
      cache: 'no-store',
      headers: { 'X-Currents-Key': key }
    });
    const j = await r.json();
    const currents = (j.sourceStatus || []).find(x => x.source === 'Currents');
    if (!r.ok || !currents?.ok) throw new Error(currents?.error || j.error || 'Connection test failed');
    return currents.count || 0;
  }

  function openDialog() {
    document.getElementById('ec-key-dialog')?.remove();
    const current = localStorage.getItem(STORAGE_KEY) || '';
    const wrap = document.createElement('div');
    wrap.id = 'ec-key-dialog';
    wrap.innerHTML = `
      <div class="ec-key-backdrop" data-close="1"></div>
      <section class="ec-key-card" role="dialog" aria-modal="true" aria-labelledby="ec-key-title">
        <button class="ec-key-close" data-close="1" aria-label="Close">×</button>
        <div class="ec-key-kicker">NEWS & INTELLIGENCE</div>
        <h2 id="ec-key-title">Connect a personal news key</h2>
        <p>Use your own free Currents API key. The key stays in this browser and is sent only to EquityClimb's news endpoint.</p>
        <label for="ec-currents-key">Currents API key</label>
        <input id="ec-currents-key" type="password" value="${current.replace(/"/g,'&quot;')}" autocomplete="off" placeholder="Paste API key">
        <div id="ec-key-state" class="ec-key-state">${mask(current)}</div>
        <div class="ec-key-actions">
          <button id="ec-key-test" class="btn ghost">Test connection</button>
          <button id="ec-key-save" class="btn">Save on this device</button>
        </div>
        <button id="ec-key-remove" class="ec-key-remove">Remove saved key</button>
        <p class="ec-key-note">Do not enter an email password. Create the account directly with Currents and paste only the API key.</p>
      </section>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-close]').forEach(x => x.onclick = () => wrap.remove());
    const input = wrap.querySelector('#ec-currents-key');
    const state = wrap.querySelector('#ec-key-state');
    wrap.querySelector('#ec-key-save').onclick = () => {
      const key = input.value.trim();
      if (!key) { state.textContent = 'Enter an API key first.'; state.className='ec-key-state fail'; return; }
      localStorage.setItem(STORAGE_KEY, key);
      state.textContent = mask(key); state.className='ec-key-state ok';
      document.querySelector('#ec-news-key-button span').textContent='News connected';
    };
    wrap.querySelector('#ec-key-test').onclick = async e => {
      const key = input.value.trim(); e.currentTarget.disabled = true;
      state.textContent='Testing…'; state.className='ec-key-state';
      try { const n = await testKey(key); state.textContent=`Connected successfully • ${n} articles returned`; state.className='ec-key-state ok'; }
      catch(err) { state.textContent=`Could not connect: ${err.message}`; state.className='ec-key-state fail'; }
      e.currentTarget.disabled = false;
    };
    wrap.querySelector('#ec-key-remove').onclick = () => {
      localStorage.removeItem(STORAGE_KEY); input.value=''; state.textContent='Key removed'; state.className='ec-key-state';
      document.querySelector('#ec-news-key-button span').textContent='Connect news';
    };
  }

  function addButton() {
    if (document.getElementById('ec-news-key-button')) return;
    const b = document.createElement('button');
    b.id='ec-news-key-button'; b.type='button'; b.className='ec-news-key-button';
    b.innerHTML=`<span>${localStorage.getItem(STORAGE_KEY)?'News connected':'Connect news'}</span>`;
    b.onclick=openDialog; document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();
})();
