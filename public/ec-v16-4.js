/* EquityClimb v16.4 — competition-informed home discovery.
   User-owned search plans and existing financial estimates; NO MLS feed, fake listings or alerts. */
(()=>{
 'use strict';
 if(window.__ec164||typeof V==='undefined'||typeof S==='undefined'||!window.ECMoney)return;
 window.__ec164=true;
 const st=S.ec16=(S.ec16&&typeof S.ec16==='object')?S.ec16:{};
 const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const CAD=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(Number(n)||0);
 const saveSafe=()=>{try{save();return true;}catch(err){console.warn('Search plan could not be saved',err);return false;}};
 const allowedTypes=['any','detached','townhouse','condo'];
 const allowedBeds=['any','1','2','3','4'];
 const plans=()=>Array.isArray(st.discoveryPlans)?st.discoveryPlans.filter(x=>x&&typeof x==='object').slice(0,6):[];
 const normalize=x=>({
   city:String(x?.city||S.ec13?.homes?.city||S.profile?.city||'').trim().slice(0,60),
   price:Math.max(0,Math.min(20000000,Math.round(Number(x?.price)||0))),
   beds:allowedBeds.includes(String(x?.beds))?String(x.beds):'any',
   type:allowedTypes.includes(String(x?.type))?String(x.type):'any'
 });
 function draft(){
   if(st.discoveryDraft)return normalize(st.discoveryDraft);
   const fromHomes=Number(S.ec13?.homes?.maxPrice);
   return normalize({city:S.ec13?.homes?.city||S.profile?.city||'',price:fromHomes>0?fromHomes:Number(st.targetPrice)||600000,beds:'any',type:'any'});
 }
 const typeLabel={any:'All home types',detached:'Detached homes',townhouse:'Townhouses',condo:'Condo / apartment'};
 const bedsLabel={any:'Any bedrooms','1':'1+ bedrooms','2':'2+ bedrooms','3':'3+ bedrooms','4':'4+ bedrooms'};
 function estimate(d){
   const c=S.ec13?.calc||{},price=d.price,down=Math.max(0,Math.min(price,Number(c.down)||0));
   if(!price||!window.ECMoney?.ownership)return null;
   try{
     return ECMoney.ownership({...c,price,down,rate:Number(c.rate)||5,years:Number(c.years)||25,
       tax:Number(c.tax)||310,insurance:Number(c.insurance)||135,utilities:Number(c.utilities)||190,
       maintenancePct:Number(c.maintenancePct)||1,closingPct:Number(c.closingPct)||1.5});
   }catch(err){console.warn('Search preview estimate unavailable',err);return null;}
 }
 function statsHTML(d){
   const x=estimate(d),price=d.price;
   if(!x)return '<p class="ec164-estimate-unavailable">Enter a price to preview ownership costs using your Decision Lab assumptions.</p>';
   const warning=x.downPaymentValid===false||x.insuranceNeedsReview?
     '<p class="ec164-risk">The saved down payment or insurance assumptions need review. This scenario may not qualify for standard financing.</p>':'';
   return '<div class="ec164-est-grid">'+
     '<div><span>Price you want to explore</span><strong>'+CAD(price)+'</strong></div>'+
     '<div><span>Estimated monthly ownership</span><strong>'+CAD(x.total)+'</strong></div>'+
     '<div><span>Estimated upfront cash</span><strong>'+CAD(x.upfront)+'</strong></div>'+
     '</div><div class="ec164-est-meta">Minimum down payment '+CAD(x.minimumDown)+' · Based on your existing Decision Lab inputs, not an approval or live listing.</div>'+warning;
 }
 function savedHTML(){
   const list=plans();
   if(!list.length)return '<p class="ec164-empty">Your saved searches will appear here. Save a search plan to return to it next time.</p>';
   return list.map((p,i)=>{
     const d=normalize(p);
     return '<div class="ec164-plan"><div><strong>'+E(d.city||'City not set')+'</strong><span>Up to '+CAD(d.price)+' · '+E(bedsLabel[d.beds])+' · '+E(typeLabel[d.type])+'</span></div>'+
       '<div class="ec164-plan-actions"><button type="button" onclick="EC164.load('+i+')" aria-label="Load saved search '+(i+1)+'">Use</button>'+
       '<button type="button" onclick="EC164.remove('+i+')" aria-label="Remove saved search '+(i+1)+'">Remove</button></div></div>';
   }).join('');
 }
 function studio(){
   const d=draft();
   return '<section class="ec164-studio" id="ec164-discovery" aria-label="Personal home search workspace">'+
     '<div class="ec164-top"><div><div class="ec164-eyebrow">YOUR NEXT HOME · PERSONAL SEARCH STUDIO</div>'+
     '<h2>Explore what fits your life.</h2><p>Start with a search plan, browse real homes at the source, then bring the ones you love back to EquityClimb.</p></div>'+
     '<div class="ec164-mark" aria-hidden="true">⌂</div></div>'+
     '<div class="ec164-field-grid">'+
       '<label>Where would you like to look?<input id="ec164-city" maxlength="60" autocomplete="address-level2" placeholder="City or neighbourhood" value="'+E(d.city)+'" onchange="EC164.field(&quot;city&quot;,this.value)"></label>'+
       '<label>Budget ceiling (CAD)<input id="ec164-price" type="number" inputmode="numeric" min="10000" max="20000000" step="10000" value="'+E(d.price)+'" onchange="EC164.field(&quot;price&quot;,this.value)"></label>'+
       '<label>Bedrooms<select id="ec164-beds" onchange="EC164.field(&quot;beds&quot;,this.value)">'+allowedBeds.map(b=>'<option value="'+E(b)+'" '+(d.beds===b?'selected':'')+'>'+E(bedsLabel[b])+'</option>').join('')+'</select></label>'+
       '<label>Home type<select id="ec164-type" onchange="EC164.field(&quot;type&quot;,this.value)">'+allowedTypes.map(t=>'<option value="'+E(t)+'" '+(d.type===t?'selected':'')+'>'+E(typeLabel[t])+'</option>').join('')+'</select></label>'+
     '</div><div class="ec164-budget-shortcuts"><span>Quick budgets</span>'+
       '<button type="button" onclick="EC164.price(450000)">$450k</button><button type="button" onclick="EC164.price(600000)">$600k</button>'+
       '<button type="button" onclick="EC164.price(850000)">$850k</button></div>'+
     '<div class="ec164-preview" id="ec164-preview" aria-live="polite">'+statsHTML(d)+'</div>'+
     '<div class="ec164-primary-actions"><button class="ec164-main" type="button" onclick="EC164.savePlan()">♡ Save this search plan</button>'+
       '<button type="button" class="ec164-copy" onclick="EC164.copy()">Copy my filters</button>'+
       '<a href="https://www.realtor.ca/" target="_blank" rel="noopener noreferrer">Browse REALTOR.ca ↗</a>'+
       '<a href="https://www.zolo.ca/" target="_blank" rel="noopener noreferrer">Browse Zolo ↗</a></div>'+
     '<div class="ec164-help">Listing sites open separately. Apply the filters there; EquityClimb does not receive live listings or send new-listing alerts. Ownership costs are estimates, not lender offers.</div>'+
     '<div id="ec164-status" role="status" aria-live="polite" class="ec164-status"></div>'+
     '<div class="ec164-saved-title"><h3>Pick up where you left off</h3><span id="ec164-plan-count">'+plans().length+' saved</span></div>'+
     '<div id="ec164-plan-list" class="ec164-plan-list">'+savedHTML()+'</div>'+
     '<div class="ec164-next"><button type="button" onclick="EC164.shortlist()">+ Add an actual home to my shortlist</button>'+
       '<button type="button" onclick="go(&quot;readiness&quot;)">Review my affordability →</button>'+
       '<button type="button" onclick="go(&quot;areas&quot;)">Explore neighbourhoods →</button></div>'+
   '</section>';
 }
 function notice(msg){const el=document.getElementById('ec164-status');if(el)el.textContent=msg;}
 function repaint(){
   const el=document.getElementById('ec164-preview');if(el)el.innerHTML=statsHTML(draft());
   const count=document.getElementById('ec164-plan-count');if(count)count.textContent=plans().length+' saved';
   const list=document.getElementById('ec164-plan-list');if(list)list.innerHTML=savedHTML();
 }
 function resume(){
   if(plans().length){st.discoveryDraft=normalize(plans()[0]);saveSafe();}
   if(typeof window.EC13?.tab==='function')window.EC13.tab('discover');else go('homes');
 }
 function homeTile(){
   const count=plans().length,latest=count?normalize(plans()[0]):null;
   const manual=(S.ec13?.homes?.saved||[]).filter(x=>x?.manual).length;
   return '<section class="ec164-home-tile" aria-label="Home discovery shortcut">'+
     '<div><div class="ec164-eyebrow">YOUR HOME SEARCH</div><h2>See homes you love. Know what you can afford.</h2>'+
     '<p>'+(latest?'Continue looking in <strong>'+E(latest.city)+'</strong> up to <strong>'+CAD(latest.price)+'</strong>.':
       'Build a personal search, explore live properties at a trusted source, and compare the true ownership costs here.')+'</p>'+
     '<div class="ec164-home-stats"><span>'+count+' saved search '+(count===1?'plan':'plans')+'</span><span>'+manual+' shortlisted '+(manual===1?'home':'homes')+'</span></div></div>'+
     '<button type="button" onclick="EC164.resume()">'+(count?'Continue exploring':'Explore homes')+' <span aria-hidden="true">↗</span></button></section>';
 }
 const oldHomes=V.homes;
 V.homes=function(){
   const html=oldHomes.apply(this,arguments);
   if(!S.profile?.onboarded)return html;
   const t=document.createElement('template');t.innerHTML=html;
   const empty=t.content.querySelector('.ec161-no-feed');
   if(empty){
     const intro=empty.querySelector('.ec161-feed-intro');
     const box=document.createElement('div');box.innerHTML=studio();
     if(intro)intro.replaceWith(box.firstElementChild);else empty.prepend(box.firstElementChild);
   }
   const wrap=document.createElement('div');wrap.append(t.content);return wrap.innerHTML;
 };
 const oldHome=V.home;
 V.home=function(){
   const html=oldHome.apply(this,arguments);
   if(!S.profile?.onboarded)return html;
   const t=document.createElement('template');t.innerHTML=html;
   const target=t.content.querySelector('.ec161-lower-market, .ec153-market');
   const box=document.createElement('div');box.innerHTML=homeTile();
   if(target)target.after(box.firstElementChild);else t.content.append(box.firstElementChild);
   const wrap=document.createElement('div');wrap.append(t.content);return wrap.innerHTML;
 };
 window.EC164={
   copy(){
     const d=draft();
     const text=['EquityClimb search plan','Location: '+(d.city||'Not selected'),'Budget ceiling: '+CAD(d.price),
       'Bedrooms: '+bedsLabel[d.beds],'Home type: '+typeLabel[d.type]].join('\n');
     const clipboard=window.navigator?.clipboard;
     if(clipboard?.writeText){
       clipboard.writeText(text).then(()=>notice('Search filters copied. Apply them on the listing website.'),
         ()=>notice('Clipboard access was blocked. You can enter the same filters on the listing website.'));
     }else notice('Copy is unavailable in this browser. You can enter these filters on the listing website.');
   },
   field(key,value){
     if(!['city','price','beds','type'].includes(key))return;
     const d=draft();d[key]=value;st.discoveryDraft=normalize(d);saveSafe();
     if(key==='price'){const input=document.getElementById('ec164-price');if(input)input.value=st.discoveryDraft.price;}
     repaint();
   },
   price(value){st.discoveryDraft=normalize({...draft(),price:value});saveSafe();const el=document.getElementById('ec164-price');if(el)el.value=st.discoveryDraft.price;repaint();},
   savePlan(){
     const d=draft();
     if(!d.city){notice('Add a city before saving.');return;}
     if(d.price<10000||d.price>20000000){notice('Enter a budget between $10,000 and $20,000,000.');return;}
     const existing=plans(),same=x=>{const v=normalize(x);return v.city.toLowerCase()===d.city.toLowerCase()&&v.price===d.price&&v.beds===d.beds&&v.type===d.type;};
     const next=[{...d,createdAt:new Date().toISOString()},...existing.filter(x=>!same(x))].slice(0,6);
     st.discoveryPlans=next;
     if(!saveSafe()){notice('Unable to save. Check browser storage settings.');return;}
     notice('Search plan saved. Return here any time to continue exploring.');repaint();
   },
   load(i){const selected=plans()[i];if(!selected)return;st.discoveryDraft=normalize(selected);saveSafe();render();document.getElementById('ec164-discovery')?.scrollIntoView({block:'start'});},
   remove(i){const next=plans();if(!next[i])return;next.splice(i,1);st.discoveryPlans=next;if(!saveSafe()){notice('Unable to save this change.');return;}notice('Search plan removed.');repaint();},
   resume,
   shortlist(){if(typeof window.EC13?.tab==='function')window.EC13.tab('saved');else go('homes');}
 };
})();