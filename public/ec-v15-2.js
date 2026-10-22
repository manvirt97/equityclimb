/* EquityClimb v15.2 — priority order and honest, grouped AI providers.
   Safe additive layer: no changes to finance formulas or existing saved state. */
(() => {
  'use strict';
  if (window.__ec152 || typeof V === 'undefined' || !window.EC15) return;
  window.__ec152 = true;
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Render existing financial KPIs, charts, and Market first. Personal planning
  // journeys follow them; none of the calculation elements are recreated.
  if (typeof V.home === 'function') {
    const oldHome = V.home;
    V.home = function () {
      const html = oldHome.apply(this, arguments);
      try {
        const t = document.createElement('template');
        t.innerHTML = html;
        const banner = t.content.querySelector('.ec15-home-path');
        const actions = t.content.querySelector('.ec13-home-start');
        const footer = t.content.querySelector('.foot');
        if (!footer || (!banner && !actions)) return html;
        const parent = footer.parentNode;
        const gap = document.createElement('div');
        gap.className = 'ec152-before-actions';
        parent.insertBefore(gap, footer);
        if (banner) parent.insertBefore(banner, footer);
        if (actions) parent.insertBefore(actions, footer);
        const d = document.createElement('div');
        d.appendChild(t.content);
        return d.innerHTML;
      } catch (_) { return html; }
    };
  }

  // One catalog query for provider status. Models are activated only if the
  // SERVER reports them available, never on the basis of a dropdown label.
  const defaults = [
    {id:'auto',label:'Auto · picks a free model',available:true,paid:false},
    {id:'free:fast',label:'Quick · Cloudflare',available:true,paid:false},
    {id:'free:balanced',label:'Balanced · Cloudflare',available:true,paid:false},
    {id:'free:deep',label:'Detailed · Cloudflare',available:true,paid:false}
  ];
  let slots = defaults;
  const groups = [
    {name:'Automatic',ids:['auto']},
    {name:'Cloudflare · free allowance',ids:['free:fast','free:balanced','free:deep']},
    {name:'OpenAI API · separately billed',ids:['openai:fast','openai:balanced','openai:advanced']},
    {name:'Anthropic Claude API · separately billed',ids:['claude:fast','claude:balanced','claude:advanced']}
  ];
  const labelFor = slot => {
    const tier = (slot.id.split(':')[1] || 'auto');
    return slot.id === 'auto' ? 'Auto · free' : ({fast:'Quick',balanced:'Balanced',deep:'Detailed',advanced:'Advanced'}[tier] || tier);
  };
  const paidGroups = groups.slice(2);
  const isAvailable = id => Boolean(slots.find(s=>s.id===id)?.available);
  function groupedPicker() {
    const selected = (typeof S !== 'undefined' && S.ec15?.aiModel) || 'auto';
    const groupsHtml = groups.map(g => {
      const usable=g.ids.map(id=>slots.find(s=>s.id===id)).filter(s=>s?.available);
      if (!usable.length) return '';
      return `<optgroup label="${escapeHtml(g.name)}">${usable.map(s=>`<option value="${escapeHtml(s.id)}" ${selected===s.id?'selected':''}>${escapeHtml(labelFor(s))}</option>`).join('')}</optgroup>`;
    }).join('');
    const providerCards = paidGroups.map(g=>{
      const connected=g.ids.some(isAvailable);
      const name=g.name.split(' · ')[0];
      return `<div class="ec152-provider-card"><div class="ec152-provider-row"><b>${escapeHtml(name)}</b><span class="ec152-status ${connected?'ready':'offline'}">${connected?'Configured':'Not connected'}</span></div>
      <p>${connected?'Connected options appear in the model selector.':'Requires owner-approved paid API access, a server-side secret, and tested model IDs.'}</p></div>`;
    }).join('');
    return `<div class="ec15-model-picker ec152-picker">
      <label for="ec15-model">AI engine</label>
      <select id="ec15-model" onchange="EC15.model(this.value)">${groupsHtml}</select>
      <div class="ec15-model-note" id="ec15-model-note">${selected==='auto'?'Auto chooses among connected free Cloudflare models.':'Selected models use the stated provider; availability and costs can change.'} Always verify significant financial decisions.</div>
      <details class="ec152-provider-details"><summary>AI providers & connection status</summary><div class="ec152-provider-grid">${providerCards}</div>
      <p class="ec152-provider-help">API connections are controlled by the EquityClimb owner in Cloudflare. Consumer ChatGPT and Claude subscriptions do not provide these paid API connections. Unavailable models are hidden from the selector rather than offered as broken choices.</p></details>
    </div>`;
  }
  if (typeof V.advisor === 'function') {
    const oldAdvisor=V.advisor;
    V.advisor=function(){
      const html=oldAdvisor.apply(this,arguments);
      try {
        const t=document.createElement('template'); t.innerHTML=html;
        const target=t.content.querySelector('.ec15-model-picker');
        if(!target) return html;
        target.outerHTML=groupedPicker();
        const d=document.createElement('div');d.appendChild(t.content);return d.innerHTML;
      } catch (_) { return html; }
    };
  }
  // Match the source of truth: public catalog from our own API. Never fetch
  // provider credentials from a browser or enable paid usage automatically.
  async function loadCatalog() {
    try {
      const r=await fetch('/api/ai-catalog',{cache:'no-store'});
      if (!r.ok) return;
      const data=await r.json();
      if(!Array.isArray(data.slots)) return;
      slots=data.slots.filter(s=>s&&typeof s.id==='string');
      const selection=S.ec15?.aiModel;
      if(selection && !isAvailable(selection)) {
        S.ec15.aiModel='auto'; try{save();}catch(_){}
      }
      if(typeof cur!=='undefined'&&cur==='advisor'&&typeof render==='function')render();
    } catch (_) { /* free default picker still works */ }
  }
  loadCatalog();
  if (S.profile?.onboarded && typeof render==='function') {
    try {render();} catch (_) {}
  }
})();
