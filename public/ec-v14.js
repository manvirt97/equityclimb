/* EquityClimb v14 — predictable Budget columns, organized sidebar and Housing Explorer.
   Loads after ec-v13. No new credentials; preserves the existing S and local/cloud sync model.
   NEVER creates fake MLS inventory. */
(() => {
  'use strict';
  if (window.__ec14 || typeof V === 'undefined' || typeof S === 'undefined' || !window.EC13) return;
  window.__ec14 = true;
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const places = {
    'Calgary':[51.0447,-114.0719,11], 'Edmonton':[53.5461,-113.4938,11],
    'Vancouver':[49.2827,-123.1207,11], 'Toronto':[43.6532,-79.3832,11],
    'Ottawa':[45.4215,-75.6972,11], 'Montreal':[45.5019,-73.5674,11],
    'Winnipeg':[49.8951,-97.1384,11], 'Halifax':[44.6488,-63.5752,12],
    'Victoria':[48.4284,-123.3656,12], 'Regina':[50.4452,-104.6189,11],
    'Saskatoon':[52.1332,-106.6700,11], 'Kelowna':[49.8880,-119.4960,11],
    'Hamilton':[43.2557,-79.8711,11], 'Quebec City':[46.8139,-71.2080,11]
  };
  const iconNames = {home:'home',budget:'wallet',debt:'debt',wealth:'market',goals:'goal',homes:'house',areas:'map',market:'market',learn:'book',advisor:'ai',profile:'user',settings:'gear'};
  const navGroups = [
    ['YOUR MONEY', [['home','Dashboard'],['budget','Budget & cash flow'],['debt','Debt & mortgage'],['wealth','Investing'],['goals','Goals']]],
    ['EXPLORE', [['homes','Find a home'],['areas','Neighbourhoods'],['market','Markets & news']]],
    ['GROW YOUR KNOWLEDGE', [['learn','Learn'],['advisor','AI Copilot']]],
    ['ACCOUNT', [['profile','My profile'],['settings','Settings']]]
  ];

  // The mobile "More" screen uses the same categories as the desktop sidebar.
  if(typeof V.more==='function') {
    V.more=function(){return `${head('More', 'Explore all tools', 'Everything you need, organized by what you want to achieve.')}
      <div class="ec14-more-grid">${navGroups.map(([heading,links])=>`<section class="card ec14-more-section"><h2>${e(heading)}</h2>
      ${links.map(([id,label])=>`<button type="button" onclick="go('${id}')">${openIcon(iconNames[id])}<span>${e(label)}</span><b>›</b></button>`).join('')}</section>`).join('')}</div>`;};
  }

  const extras = S.ec14 = (S.ec14 && typeof S.ec14 === 'object') ? S.ec14 : {};
  if (!Array.isArray(extras.searches)) extras.searches=[];
  let mapVisible=false, leafletMap=null, leafletPromise=null;
  let resizeTimer=0;
  const saveState = () => { try { save(); } catch (_) {} };
  const currentCity = () => String(S.ec13?.homes?.city || S.profile.city || 'Calgary').trim();
  const openIcon = name => typeof ic==='function' ? ic(name) : '';

  // Group navigational links with section headings; use the original app's renderer and icons.
  function organizeSidebar() {
    if (!S.profile.onboarded) return;
    const side=document.getElementById('side'); if(!side) return;
    const oldRate=side.querySelector('.ratechip');
    const rateHtml=oldRate ? oldRate.outerHTML : '';
    const selected=typeof cur==='string'?cur:'home';
    const groupMarkup=navGroups.map(([heading,links])=>`<section class="ec14-nav-section" aria-label="${e(heading)}">
      <div class="ec14-nav-heading">${e(heading)}</div>
      ${links.map(([id,label])=>`<button type="button" class="ec14-nav-item${selected===id?' active':''}" ${selected===id?'aria-current="page"':''} onclick="go('${id}')">${openIcon(iconNames[id])}<span>${e(label)}</span></button>`).join('')}
    </section>`).join('');
    side.innerHTML=`<div class="logo ec14-logo"><svg viewBox="0 0 32 32">${I.logo}</svg>EquityClimb</div><nav class="ec14-sidebar" aria-label="Main navigation">${groupMarkup}</nav><div class="grow"></div>${rateHtml}`;
  }

  // No CSS grid row-height coupling: two independent stacks, visually 1|2 / 3|4 / 5.
  function compactBudget() {
    const root=document.querySelector('.ec10-budget'); if(!root) return;
    const cards=Array.from(root.querySelectorAll('.ec10-bcard')).sort((a,b)=>Number(a.dataset.n)-Number(b.dataset.n));
    if(cards.length!==5) return;
    const wide=window.matchMedia('(min-width: 1110px)').matches;
    const cols=Array.from(root.children).filter(x=>x.classList?.contains('ec14-budget-col'));
    if (!wide) {
      cards.forEach(c=>root.appendChild(c)); cols.forEach(c=>c.remove());
      root.classList.remove('ec14-compact');
      return;
    }
    let left=cols[0],right=cols[1];
    if(!left || !right){cols.forEach(c=>c.remove()); left=document.createElement('div');right=document.createElement('div');
      left.className='ec14-budget-col'; right.className='ec14-budget-col';root.appendChild(left);root.appendChild(right);}
    root.classList.add('ec14-compact');
    cards.forEach((card,index)=>{
      const target=index%2===0?left:right;
      if(card.parentNode!==target) target.appendChild(card);
    });
  }

  const findPlace = city => {
    const entry=Object.entries(places).find(([k])=>k.toLowerCase()===String(city).trim().toLowerCase());
    return entry?entry[1]:null;
  };
  const searchNames = () => extras.searches.slice(0,8).map((x,i)=>`<div class="ec14-search-chip"><button type="button" onclick="EC14.applySearch(${i})" aria-label="Apply saved search ${e(x.label)}">${openIcon('map')} ${e(x.label)}</button><button type="button" class="ec14-del" aria-label="Remove saved search ${e(x.label)}" onclick="EC14.deleteSearch(${i})">×</button></div>`).join('');
  function searchesMarkup(){return `<div class="ec14-saved-searches"><div class="ec14-saved-label">Saved searches <span>${extras.searches.length} saved on your device</span></div><div class="ec14-chip-list">${searchNames() || '<span class="ec14-muted">Save your preferred city and filters for next time.</span>'}</div></div>`;}
  function buildIntro(){ const city=currentCity();return `<div class="ec14-portal-intro">
      <div><div class="ec14-kicker">EQUITYCLIMB REAL ESTATE</div><h2>Explore places. Understand the price.</h2><p>Search locations, track your criteria and compare the true cost of buying—all in one workspace.</p></div>
      <div class="ec14-portal-steps"><span>${openIcon('map')} Discover</span><span>${openIcon('house')} Compare</span><span>${openIcon('plan')} Decide</span></div>
    </div><div class="ec14-location-strip" aria-label="Quick city selection"><span>EXPLORE CITIES</span>${['Calgary','Edmonton','Vancouver','Toronto','Ottawa','Montreal'].map(n=>`<button type="button" class="${city.toLowerCase()===n.toLowerCase()?'selected':''}" onclick="EC14.city('${n}')">${e(n)}</button>`).join('')}</div>`; }

  function mapMarkup(){const city=currentCity(),match=findPlace(city);return `<section class="ec14-map-panel" aria-label="Map exploration">
      <div class="ec14-map-top"><div><div class="ec14-kicker">LOCATION EXPLORER</div><h3>Explore ${e(city)} on the map</h3><p>See the area around a potential home. Property pins will appear only when an approved listing feed provides them.</p></div><button class="btn ghost sm" type="button" onclick="EC14.toggleMap()">${mapVisible?'Hide area map':'Show interactive map'}</button></div>
      ${mapVisible?`<div id="ec14-city-map" class="ec14-city-map" role="region" aria-label="Map of ${e(city)}"></div><p class="ec14-map-foot">${match?'Approximate city-centre view; no active listings are implied.':'This city does not yet have a preset centre. Choose a listed city for map context.'} Map tiles © OpenStreetMap contributors.</p>`:''}</section>`;}

  function searchToolbar() {return `<div class="ec14-search-toolbar"><div><div class="ec14-kicker">PROPERTY SEARCH</div><h2>Your next home starts here</h2></div><button type="button" class="btn ghost sm" onclick="EC14.saveSearch()">${openIcon('check')} Save this search</button></div>`;}

  function enhanceHomes() {
    const shell=document.querySelector('.ec13-shell'); if(!shell) return;
    const banner=shell.querySelector('.ec13-banner');
    if(banner){banner.insertAdjacentHTML('beforebegin',buildIntro());banner.remove();}
    const tabs=shell.querySelector('.ec13-tabs'); if(!tabs) return;
    if(shell.querySelector('.ec13-search')) {
      const search=shell.querySelector('.ec13-search');
      search.insertAdjacentHTML('afterbegin',searchToolbar());
      search.insertAdjacentHTML('afterend',searchesMarkup()+mapMarkup());
      const searchBtn=search.querySelector('.ec13-filter-actions .btn');
      if(searchBtn)searchBtn.innerHTML=`${openIcon('refresh')} Explore available homes`;
      const results=document.getElementById('ec13-results');
      if(results){results.classList.add('ec14-results');}
    } else if(shell.querySelector('.ec13-saved')) {
      tabs.insertAdjacentHTML('afterend',`<p class="ec14-tab-help">Keep your favourite homes in one place and compare estimated costs, even before MLS integration.</p>`);
    } else {
      tabs.insertAdjacentHTML('afterend',`<p class="ec14-tab-help">Understand payment scenarios before deciding what to buy. Your estimates remain educational, not a mortgage pre-approval.</p>`);
    }
    if(mapVisible) setTimeout(drawCityMap,70);
  }
  async function leaflet(){
    if(window.L) return;
    if(leafletPromise) return leafletPromise;
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyo45KjG4I3P4RJg=';css.crossOrigin='anonymous';document.head.appendChild(css);
    leafletPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
    return leafletPromise;
  }
  async function drawCityMap(){
    const element=document.getElementById('ec14-city-map');if(!element||!mapVisible)return;
    const city=currentCity(),center=findPlace(city);
    if(!center){element.innerHTML='<div class="ec14-map-empty">Choose one of the suggested cities to see its location on the map.</div>';return;}
    element.innerHTML='<div class="ec14-map-empty">Loading location map…</div>';
    try {await leaflet(); if(element!==document.getElementById('ec14-city-map')||!mapVisible)return;
      if(leafletMap){leafletMap.remove();leafletMap=null;}
      element.innerHTML='';
      leafletMap=window.L.map(element,{scrollWheelZoom:false}).setView(center.slice(0,2),center[2]);
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(leafletMap);
      window.L.circle(center.slice(0,2),{radius:500,stroke:true,weight:2,color:'#ba9859',fillColor:'#c7a86e',fillOpacity:.10}).addTo(leafletMap)
        .bindPopup(`${e(city)} city centre (approximate). Not a property listing.`);
      setTimeout(()=>leafletMap?.invalidateSize(),150);
    }catch(_){element.innerHTML='<div class="ec14-map-empty">Could not load the interactive map. Housing search and comparisons still work.</div>';}
  }
  const oldRender=window.render;
  window.render=function(){
    if(leafletMap){try{leafletMap.remove();}catch(_){} leafletMap=null;}
    const out=oldRender.apply(this,arguments);
    try {organizeSidebar();compactBudget();if(typeof cur!=='undefined'&&cur==='homes')enhanceHomes();}
    catch(err){console.warn('Optional v14 layout adjustment failed',err);}
    return out;
  };
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(compactBudget,100);});
  window.EC14 = {
    city(name){EC13.filter('city',name); EC13.search();},
    toggleMap(){mapVisible=!mapVisible;if(!mapVisible && leafletMap){leafletMap.remove();leafletMap=null;}render();},
    saveSearch(){const h=S.ec13.homes, entry={city:currentCity(),type:h.type||'sale',property:h.property||'all',minPrice:h.minPrice||'',maxPrice:h.maxPrice||'',beds:h.beds||'0',baths:h.baths||'0'};
      entry.label=[entry.city,entry.type==='lease'?'Rent':'Buy',entry.maxPrice?'≤ $'+Number(entry.maxPrice).toLocaleString('en-CA'):'Any price'].join(' · ');
      const signature=JSON.stringify(Object.values(entry).slice(0,7));
      if(!extras.searches.some(x=>JSON.stringify(Object.values(x).slice(0,7))===signature)) extras.searches.unshift(entry);
      extras.searches=extras.searches.slice(0,8);saveState();render();},
    applySearch(i){const item=extras.searches[i];if(!item)return;
      const h=S.ec13.homes;for(const k of ['city','type','property','minPrice','maxPrice','beds','baths'])h[k]=item[k];
      h.page=1;saveState(); EC13.search();},
    deleteSearch(i){extras.searches.splice(i,1);saveState();render();},
  };
  // Ensure the first displayed screen picks up the grouping without asking users to refresh.
  if(S.profile.onboarded) { try{render();}catch(_){} }
})();
