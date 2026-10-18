/* EquityClimb v5 Market controller. Loaded after app.js and upgrade.js. */
(() => {
  'use strict';
  const categories={
    realestate:{label:'Real Estate',why:'Potential effect on housing supply, demand, pricing, rents or development.'},
    corpdev:{label:'Corp Dev',why:'Relevant to acquisitions, partnerships, divestitures or strategic growth.'},
    capital:{label:'Capital Markets',why:'Relevant to earnings, financing, capital allocation or investor expectations.'},
    opportunities:{label:'Business Opportunities',why:'May indicate funding, procurement, construction or investment opportunities.'},
    finance:{label:'Finance & Rates',why:'May influence borrowing costs, affordability, returns or economic conditions.'},
    government:{label:'Government & Policy',why:'May change tax, regulation, zoning, incentives or housing economics.'}
  };
  const geos={local:'Local',province:'Province',national:'Canada',global:'Global'};
  let cat='realestate',geo='local',busy=false,timer;
  const storageKey=()=>`ec5_${cat}_${geo}_${S.profile.city}_${S.profile.region}`;
  const getSaved=()=>{try{return JSON.parse(localStorage.getItem(storageKey())||'null')}catch{return null}};
  const save=v=>localStorage.setItem(storageKey(),JSON.stringify({savedAt:Date.now(),...v}));
  const when=d=>new Date(d).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  function categoryOptions(){return Object.entries(categories).map(([k,v])=>`<option value="${k}" ${cat===k?'selected':''}>${v.label}</option>`).join('')}
  function stories(items){
    if(!items?.length)return `<div class="v5-empty">No matching ${esc(categories[cat].label.toLowerCase())} updates were found for this location. Try another geography or check again later.</div>`;
    return items.map(x=>`<article class="v5-story"><div class="v5-meta"><span class="v5-badge">${esc(categories[x.category]?.label||categories[cat].label)}</span><span>${esc(x.source)}</span><span>•</span><span>${ago(x.date)}</span></div><a class="v5-title" href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="v5-why"><b>Why it matters:</b> ${esc(x.why||categories[cat].why)}</div></article>`).join('');
  }
  function status(text,cls=''){const e=document.querySelector('.v5-status');if(e){e.textContent=text;e.className='v5-status '+cls}}
  function button(mode){const b=document.querySelector('.v5-refresh');if(!b)return;b.disabled=mode==='loading';b.classList.toggle('loading',mode==='loading');b.classList.toggle('success',mode==='success');b.innerHTML=`${ic('refresh')}<span>${mode==='loading'?'Checking…':mode==='success'?'Updated':'Refresh'}</span>`}
  function paintSaved(){const d=getSaved(),box=document.getElementById('v5-feed');if(d?.items?.length&&box){box.innerHTML=stories(d.items);status(`Last checked ${when(d.fetched||d.savedAt)}`)}return d}
  async function brief(items){const e=document.getElementById('v5-brief');if(!e||!items?.length)return;try{const rates=RATES?Object.fromEntries(['prime','policy','bond5','fiveYearPosted'].filter(k=>RATES[k]).map(k=>[k,RATES[k].value+'%'])):{};const b=await api('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'brief',area:area(),goal:GOALS[S.profile.goal].t,rates,headlines:items.slice(0,12)})});if(!b.error)e.innerHTML=briefHtml(b,false)}catch{}}
  async function refresh(force=false){
    if(busy)return;busy=true;if(force){button('loading');status('Checking live sources…')}
    const q=new URLSearchParams({scope:geo,category:cat,city:S.profile.city,region:S.profile.region,country:S.profile.country});if(force)q.set('_',Date.now());
    try{
      const old=getSaved()?.items||[];const r=await api('/api/news?'+q,force?{cache:'no-store'}:undefined);if(r.error&&!r.items?.length)throw Error(r.error);
      const items=r.items||[],oldLinks=new Set(old.map(x=>x.link)),added=items.filter(x=>!oldLinks.has(x.link)).length;save({items,fetched:r.fetched||new Date().toISOString()});
      const box=document.getElementById('v5-feed');if(box)box.innerHTML=stories(items);button('success');status(`Checked just now · ${added} new ${added===1?'story':'stories'}`,'ok');brief(items);
      clearTimeout(timer);timer=setTimeout(()=>{button('idle');status(`Last checked ${when(Date.now())}`)},2600);
    }catch{button('idle');status('Could not refresh · showing saved stories','fail')}
    busy=false;
  }
  window.v5Cat=v=>{cat=v;render()};window.v5Geo=v=>{geo=v;render()};window.v5Refresh=()=>refresh(true);
  V.market=()=>{
    setTimeout(()=>{const d=paintSaved();if(!d||Date.now()-(d.savedAt||0)>5*60*1000)refresh(false);else brief(d.items)},0);
    const place=geo==='local'?(S.profile.city||'your city'):geo==='province'?(S.profile.region||'your province'):geos[geo];
    return `${head('Market Intelligence','Signals that matter','Location-specific business, property, capital-markets and policy updates with source-grounded interpretation.')}
    <section class="card v5-hero"><div class="v5-kicker">Daily intelligence</div><h2>${esc(categories[cat].label)} updates for ${esc(place)}</h2><div class="v5-signals"><span class="v5-signal">Prime ${prime()?pct(prime(),2):'—'}</span><span class="v5-signal">Your rate ${pct(S.rate,2)}</span><span class="v5-signal">${esc(area())}</span></div></section>
    <section class="v5-controls"><div class="v5-geo">${Object.entries(geos).map(([k,l])=>`<button class="${geo===k?'on':''}" onclick="v5Geo('${k}')">${l}</button>`).join('')}</div>
    <select class="v5-category-select" aria-label="News category" onchange="v5Cat(this.value)">${categoryOptions()}</select>
    <div class="v5-categories">${Object.entries(categories).map(([k,v])=>`<button class="${cat===k?'on':''}" onclick="v5Cat('${k}')">${v.label}</button>`).join('')}</div>
    <div class="v5-refresh-line"><span class="v5-status">Ready</span><button class="btn ghost sm v5-refresh" onclick="v5Refresh()">${ic('refresh')}<span>Refresh</span></button></div></section>
    <div class="v5-layout"><section class="card"><div class="head"><div><h2>${esc(categories[cat].label)}</h2><div class="small mute">${esc(place)} · publication time and check time are separate</div></div></div><div id="v5-feed">${loading(5)}</div></section>
    <aside><section class="card v5-side-card"><h2>What it means</h2><div class="small mute" style="margin-bottom:12px">AI summary grounded in the retrieved headlines and current rates</div><div id="v5-brief">${loading(4)}</div></section><section class="card v5-side-card"><h2>Your position</h2><div class="mini-metric"><div class="label">Mortgage rate</div><div class="value">${pct(S.rate,2)} · ${esc(S.rtype)}</div></div><div class="mini-metric"><div class="label">Trigger headroom</div><div class="value">${(S.trigger-S.rate).toFixed(2)} percentage points</div></div><div class="mini-metric"><div class="label">Selected market</div><div class="value">${esc(place)}</div></div></section></aside></div>
    <p class="foot">Stories link to the original publishers. AI interpretation is general information, not a forecast or recommendation.</p>`;
  };
  setTimeout(()=>{if(S.profile?.onboarded&&cur==='market')render()},0);
})();
