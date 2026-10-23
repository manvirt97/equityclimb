/* EquityClimb v16.1 — substantial product refresh, no fictional property inventory.
   All displayed amounts are taken from saved user inputs, with transparent missing-data cues. */
(()=>{
'use strict';
if(window.__ec161||typeof V==='undefined'||typeof S==='undefined')return;
window.__ec161=true;
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number.isFinite(+x)?+x:0;
const money=x=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(num(x));
const model=()=>{try{return typeof window.ECModel==='function'?window.ECModel():null;}catch(_){return null;}};
const action=(target,title,secondary=false)=>`<button type="button" class="ec161-action ${secondary?'secondary':''}" onclick="go('${target}')">${E(title)} <span aria-hidden="true">↗</span></button>`;
function hero(m){
 const hasIncome=num(m?.ic?.takeHome)>0||num(m?.income)>0;
 const surplus=hasIncome?money(m.unallocated):'Add your income';
 const changed=hasIncome?(num(m.unallocated)<0?'Review monthly expenses':'Available after planned spending'):'Finish your income profile to calculate cash flow';
 return `<section class="ec161-hero" aria-label="Your financial overview">
  <div class="ec161-hero-content"><span class="ec161-topline"><span class="ec161-live-dot"></span> YOUR FINANCIAL COMMAND CENTRE <span class="ec161-version">VERSION 16.2</span></span>
   <h2>See the full picture.<br><em>Make your next move.</em></h2>
   <div class="ec161-hero-metrics"><div class="ec161-networth"><span>YOUR NET WORTH</span><strong>${money(m?.net)}</strong><small>${money(m?.assets)} assets <b>−</b> ${money(m?.liab)} liabilities</small></div>
   <div class="ec161-hero-sep"></div><div class="ec161-hero-cash"><span>MONTHLY CASH FLOW</span><strong>${E(surplus)}</strong><small>${E(changed)}</small></div></div>
   <div class="ec161-hero-actions">${action('budget','Review budget')}${action('readiness','Plan for a home',true)}</div>
  </div>
  <div class="ec161-hero-art" aria-hidden="true"><div class="ec161-orbit one"></div><div class="ec161-orbit two"></div><div class="ec161-orbit three"></div><div class="ec161-trend"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
 </section>`;
}
const oldHome=V.home;
V.home=function(){const old=oldHome.apply(this,arguments);if(!S.profile?.onboarded)return old;
 const t=document.createElement('template');t.innerHTML=old;const root=t.content,m=model();if(!m)return old;
 // Keep the familiar greeting, but add a prominent purpose-built financial command centre.
 const lede=[...root.children].find(el=>el.classList?.contains('lede'));const host=document.createElement('div');host.innerHTML=hero(m);if(lede)lede.after(host);else root.prepend(host);
 // Avoid the long first-screen warning pile-up without concealing the actual messages or their buttons.
 const notes=[...root.children].filter(el=>el.classList?.contains('note'));if(notes.length){const details=document.createElement('details');details.className='ec161-account-check';
   details.innerHTML=`<summary><span aria-hidden="true">✦</span> <strong>Review ${notes.length} profile ${notes.length===1?'notice':'notices'}</strong><span>Some figures may need your confirmation</span><b aria-hidden="true">⌄</b></summary>`;
   notes[0].before(details);notes.forEach(n=>details.append(n));}
 // Net worth is in the hero. Show three distinct KPI cards underneath instead of repeating it.
 const metrics=root.querySelector('.ec153-primary-metrics');if(metrics){const first=metrics.querySelector('.kpi');if(first)first.remove();metrics.classList.add('ec161-three-metrics');if(!(num(m?.ic?.takeHome)>0||num(m?.income)>0)){const k=[...metrics.querySelectorAll('.kpi')].find(e=>e.textContent.includes('Monthly surplus'));if(k){const v=k.querySelector('.v'),hint=k.querySelector('.h');if(v){v.textContent='Add income';v.className='v';}if(hint)hint.textContent='Complete your profile to calculate cash flow';}}}
 const monthly=root.querySelector('.ec153-secondary-metrics');const monthlyHead=monthly?.previousElementSibling;
 if(monthly){const collapsible=document.createElement('details');collapsible.className='ec161-monthly-details';collapsible.innerHTML='<summary><span>Monthly picture & additional balances</span><small>Income · expenses · renewals · goal progress</small><b aria-hidden="true">⌄</b></summary>';monthly.before(collapsible);collapsible.append(monthly);if(monthlyHead?.classList?.contains('ec153-section-heading'))monthlyHead.remove();}
 const headline=root.querySelector('.ec153-primary-metrics')?.previousElementSibling;
 if(headline?.classList?.contains('ec153-section-heading'))headline.classList.add('ec161-finance-heading');
 const intelligence=root.querySelector('.ec16-intelligence')?.parentElement;
 if(intelligence){intelligence.classList.add('ec161-smart-move');if(metrics)metrics.after(intelligence);}
 const market=root.querySelector('.ec153-market');const marketHead=market?.previousElementSibling;
 const actions=root.querySelector('.ec153-next');if(market&&actions){actions.after(market);if(marketHead?.classList.contains('ec153-section-heading'))market.before(marketHead);}
 const spot=root.querySelector('.ec153-market');if(spot)spot.classList.add('ec161-lower-market');
 const pageTitle=[...root.children].find(el=>el.tagName==='H1');if(pageTitle)pageTitle.classList.add('ec161-page-title');
 const out=document.createElement('div');out.append(root);return out.innerHTML;
};
function noFeedWorkspace(root){
 const empty=root.querySelector('#ec13-results .ec13-empty');if(!empty)return; // Authorized feed stays untouched when connected.
 const search=root.querySelector('.ec13-search');if(search)search.remove();
 const results=root.querySelector('#ec13-results');if(results)results.innerHTML=`<section class="ec161-no-feed" aria-label="Real estate planning without MLS">
  <div class="ec161-feed-intro"><span class="ec161-pill"><i></i> LISTING FEED NOT CONNECTED</span><h2>Start with a real property.<br><em>We'll help with the numbers.</em></h2><p>Browse actual listings at the source, add a home you are considering, then compare its monthly and upfront costs. All property prices come from what you enter, not fabricated inventory.</p>
  <div class="ec161-feed-actions"><a href="https://www.realtor.ca/" target="_blank" rel="noopener noreferrer" class="ec161-action">Browse REALTOR.ca <span aria-hidden="true">↗</span></a><button class="ec161-action secondary" type="button" onclick="EC13.tab('saved')">Add your property <span aria-hidden="true">↗</span></button></div></div>
  <div class="ec161-feed-steps"><div><span>01</span><strong>Find a real home</strong><small>Use a trusted listing source and verify details.</small></div><div><span>02</span><strong>Build your shortlist</strong><small>Enter prices and details you want to compare.</small></div><div><span>03</span><strong>Know the full cost</strong><small>Mortgage, insurance, closing cash and rate risk.</small></div></div>
 </section><section class="ec161-real-actions"><article><div class="ec161-tile-icon">⌂</div><span>STEP ONE</span><h3>Your home readiness</h3><p>Understand your budget and available cash before you shop.</p>${action('readiness','Open affordability planner')}</article>
 <article><div class="ec161-tile-icon">▥</div><span>STEP TWO</span><h3>Compare homes you choose</h3><p>Your personal shortlist. Only properties you enter, never placeholders.</p><button class="ec161-action secondary" onclick="EC13.tab('saved')">Go to my shortlist ↗</button></article>
 <article><div class="ec161-tile-icon">◇</div><span>STEP THREE</span><h3>Decision Lab</h3><p>Test different interest rates and ownership assumptions.</p><button class="ec161-action secondary" onclick="EC13.tab('lab')">Open Decision Lab ↗</button></article></section>`;
 const feed=root.querySelector('.ec16-feed-details');if(feed)feed.remove(); // Internal connector diagnostics do not need to dominate the consumer view.
}
const oldHomes=V.homes;
V.homes=function(){const html=oldHomes.apply(this,arguments);const t=document.createElement('template');t.innerHTML=html;const root=t.content;
 const h1=[...root.children].find(el=>el.tagName==='H1');if(h1)h1.textContent='Real estate, with clarity.';
 const lede=[...root.children].find(el=>el.classList?.contains('lede'));if(lede)lede.textContent='Search independently. Compare confidently. Make decisions that fit your finances.';
 const banner=root.querySelector('.ec13-banner, .ec14-portal-intro');if(banner){banner.innerHTML=`<div class="ec161-re-kicker">YOUR PROPERTY DECISION WORKSPACE <span>16.2</span></div><h2>Find the right home.<br><em>Understand the true cost.</em></h2><p>One place for your own shortlist, Canadian ownership estimates and homebuying decisions.</p><div class="ec161-re-steps"><span>01 · DISCOVER</span><span>02 · COMPARE</span><span>03 · DECIDE</span></div>`;banner.classList.add('ec161-real-hero');}
 noFeedWorkspace(root);
 const b=root.querySelector('.ec16-homes-tools');if(b)b.classList.add('ec161-home-tools');
 const w=document.createElement('div');w.append(root);return w.innerHTML;
};
const oldSettings=V.settings;
V.settings=function(){const html=oldSettings.apply(this,arguments);const t=document.createElement('template');t.innerHTML=html;
 const p=t.content.querySelector('.ec16-preferences');if(p){p.classList.add('ec161-settings-hero');const h2=p.querySelector('h2');if(h2)h2.textContent='Your app. Your layout.';}
 const el=t.content.querySelector('.ec16-sync-details');if(el){const sum=el.querySelector('summary span');if(sum)sum.textContent='Advanced account & sync';}
 const w=document.createElement('div');w.append(t.content);return w.innerHTML;
};
function afterPaint(){
 document.body.classList.add('ec161-active');
 if(typeof cur==='string'&&cur==='homes'){
  const el=document.querySelector('#view .ec14-portal-intro');
  if(el&&!el.classList.contains('ec161-real-hero')){
    el.classList.add('ec161-real-hero');
    el.innerHTML='<div class="ec161-re-kicker">EQUITYCLIMB REAL ESTATE <span>VERSION 16.2</span></div><h2>Find the right home.<br><em>Know what it really costs.</em></h2><p>A personal homebuying workspace built around your own shortlist, your budget and Canadian ownership costs.</p><div class="ec161-re-steps"><span>01 · DISCOVER</span><span>02 · COMPARE</span><span>03 · DECIDE</span></div>';
  }
  if(document.querySelector('#view .ec161-no-feed')){document.querySelector('#view .ec14-location-strip')?.remove();}
  if(S.ec16?.legacyDemoNeedsReview){const lab=document.querySelector('#view .ec13-lab');
    if(lab&&!lab.querySelector('.ec161-migration-review')){lab.insertAdjacentHTML('afterbegin',`<div class="ec161-migration-review" role="status"><strong>Review your saved scenario price.</strong> An earlier version could populate the calculator from a fictional property example. Please confirm your figures before using this estimate. <button type="button" onclick="EC161.confirmScenario()">I've reviewed it</button></div>`);}}
 }
}
window.EC161={confirmScenario(){if(S.ec16)delete S.ec16.legacyDemoNeedsReview;try{save()}catch(_){}render();}};
const oldRender=window.render;
if(typeof oldRender==='function')window.render=function(){const v=oldRender.apply(this,arguments);afterPaint();return v;};
// Remove obsolete v16 example-listing preferences without overwriting any saved prices or calculations.
if(S.ec16&&typeof S.ec16==='object'){
 const previousExampleValues=(S.ec16.demo!==undefined||S.ec16.demoScenario!==undefined);
 if(S.ec16.demoScenario)S.ec16.legacyDemoNeedsReview=true;
 delete S.ec16.demo;delete S.ec16.demoScenario;
 if(previousExampleValues){try{save()}catch(_){}}
}

try{render();}catch(err){console.warn('Visual enhancements could not load',err);}
})();
