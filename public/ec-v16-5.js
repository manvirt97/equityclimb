/* EquityClimb v16.5 — decision-led engagement, on top of existing financial tools.
   This module NEVER fetches, fabricates or caches real-estate listings. */
(()=>{
'use strict';
if(window.__ec165||typeof V==='undefined'||typeof S==='undefined'||!window.ECMoney)return;
window.__ec165=true;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(v,d=0)=>v===''||v==null||!Number.isFinite(Number(v))?d:Number(v);
const CAD=v=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(N(v));
const stages={considering:'Considering',visited:'Visited',finalist:'Finalist',passed:'Passed'};
const state=S.ec165=(S.ec165&&typeof S.ec165==='object'&&!Array.isArray(S.ec165))?S.ec165:{};
if(!state.stages||typeof state.stages!=='object'||Array.isArray(state.stages))state.stages={};
if(!state.notes||typeof state.notes!=='object'||Array.isArray(state.notes))state.notes={};
if(!['all',...Object.keys(stages)].includes(state.filter))state.filter='all';
if(!['monthly','price','recent'].includes(state.sort))state.sort='recent';
if(![0,1,2].includes(state.rateShock))state.rateShock=0;
const persist=()=>{try{save();return true;}catch(e){console.warn('EquityClimb decision notes could not be saved',e);return false;}};
const homes=()=>Array.isArray(S.ec13?.homes?.saved)?S.ec13.homes.saved.filter(x=>x?.manual&&N(x.price)>0):[];
const id=x=>String(x?.id??'') || [x?.address,x?.city,x?.price].join('|');
const profile=()=>{try{return typeof window.ECModel==='function'?window.ECModel():null;}catch(_){return null;}};
function housingRoom(){
 const m=profile();if(!m||N(m.income)<=0)return null;
 const essentials=Math.max(0,N(m.essentials)-N(S.budget?.essentials?.housing));
 const other=essentials+N(m.lifestyle)+N(m.debt)+N(m.savings);
 return Math.max(0,N(m.income)-other);
}
function pricing(home,shock=state.rateShock){
 if(!home||N(home.price)<=0)return null;
 const c=S.ec13?.calc||{},p=N(home.price),down=Math.max(0,Math.min(p,N(c.down))),rate=N(c.rate,5)+shock;
 try{return window.ECMoney.ownership({...c,price:p,down,rate,years:N(c.years,25),
   tax:N(c.tax,310),insurance:N(c.insurance,135),utilities:N(c.utilities,190),
   condo:N(c.condo),maintenancePct:N(c.maintenancePct,1),closingPct:N(c.closingPct,1.5),
   closingExtra:N(c.closingExtra),fixed:c.fixed!==false});}
 catch(e){console.warn('Home affordability calculation unavailable',e);return null;}
}
function evaluate(home,shock=state.rateShock){
 const p=pricing(home,shock),room=housingRoom(),cash=Number.isFinite(Number(S.cash))?Math.max(0,N(S.cash)):null;
 if(!p)return {code:'unknown',title:'Add property details',reason:'A saved asking price is required.',price:0,room,cash,estimate:null,monthlyGap:null,cashGap:null};
 const monthlyGap=room===null?null:room-p.total;
 const cashGap=cash===null?null:cash-p.upfront;
 let code='unknown',title='Review your inputs',reason='Add your income and available cash to check this against your own plan.';
 if(!p.downPaymentValid){code='risk';title='Down payment needs review';reason='The selected Decision Lab down payment is below the usual Canadian minimum.';}
 else if(p.insuranceNeedsReview){code='risk';title='Financing needs review';reason='This purchase may not fit standard insured-mortgage assumptions.';}
 else if(room!==null&&monthlyGap<0){code='risk';title='Above planned monthly room';reason='The estimated ownership cost exceeds the amount left after your recorded non-housing expenses and planned savings.';}
 else if(cash!==null&&cashGap<0){code='risk';title='Upfront cash gap';reason='The estimated down payment and closing cash exceed cash recorded in your profile. Other funds might not be counted.';}
 else if(room!==null&&cash!==null){code='possible';title='Within entered figures';reason='The estimated costs fit the financial figures you entered. This is not a mortgage qualification or a property recommendation.';}
 return {code,title,reason,price:N(home.price),room,cash,estimate:p,monthlyGap,cashGap};
}
const savedStage=x=>Object.prototype.hasOwnProperty.call(stages,state.stages[id(x)])?state.stages[id(x)]:'considering';
function boardCard(x,i){
 const k=id(x),e=evaluate(x),base=pricing(x,0),plus2=pricing(x,2);
 const picked=String(state.focus||'')===k;
 const stage=savedStage(x),price=e.estimate;
 return '<article class="ec165-property" data-stage="'+E(stage)+'">'+
   '<div class="ec165-property-top"><div><div class="ec165-overline">'+E(x.city||'Your home')+' · User-entered property</div>'+
   '<h3>'+E(x.address||'Saved home')+'</h3></div><span class="ec165-price">'+CAD(x.price)+'</span></div>'+
   '<div class="ec165-brief-numbers"><div><span>Monthly at '+(N(S.ec13?.calc?.rate,5)+state.rateShock).toFixed(2)+'%</span><strong>'+(price?CAD(price.total):'—')+'</strong></div>'+
   '<div><span>Upfront cash</span><strong>'+(price?CAD(price.upfront):'—')+'</strong></div>'+
   '<div><span>At rate +2 pp</span><strong>'+(plus2?CAD(plus2.total):'—')+'</strong></div></div>'+
   '<div class="ec165-fit ec165-fit-'+e.code+'"><strong>'+E(e.title)+'</strong><p>'+E(e.reason)+'</p>'+
     (e.monthlyGap!==null?'<small>After planned expenses: '+(e.monthlyGap>=0?CAD(e.monthlyGap)+' remaining':CAD(Math.abs(e.monthlyGap))+' over budget')+' / month</small>':'')+
     (e.cashGap!==null?'<small>Saved cash less upfront: '+(e.cashGap>=0?CAD(e.cashGap)+' remaining':CAD(Math.abs(e.cashGap))+' short')+'</small>':'')+
   '</div><div class="ec165-stage-row"><label for="ec165-stage-'+i+'">Buying stage</label><select id="ec165-stage-'+i+'" onchange="EC165.stage('+i+',this.value)">'+
   Object.entries(stages).map(([key,label])=>'<option value="'+key+'"'+(key===stage?' selected':'')+'>'+E(label)+'</option>').join('')+'</select></div>'+
   '<div class="ec165-card-actions"><button type="button" class="ec165-button" onclick="EC165.focus('+i+')">'+(picked?'Hide my decision notes':'Open decision notes')+'</button>'+
   '<button type="button" class="ec165-link" onclick="EC165.analyze('+i+')">Use Decision Lab →</button></div>'+
   (picked?'<div class="ec165-note-editor"><label for="ec165-note-'+i+'">What matters about this home?</label>'+
   '<textarea id="ec165-note-'+i+'" maxlength="500" rows="3" placeholder="Viewing notes, commute, repairs, deal-breakers…" onchange="EC165.note('+i+',this.value)">'+E(state.notes[k]||'')+'</textarea>'+
   '<small>Private notes you enter; no automated listing or price updates.</small><div class="ec165-note-actions">'+
   '<button type="button" onclick="EC165.ask('+i+')">Discuss risks with AI Copilot →</button>'+
   '<button type="button" onclick="EC165.copy('+i+')">Copy comparison</button>'+
   (x.sourceUrl&&/^https:\/\//i.test(x.sourceUrl)?'<a href="'+E(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Original listing ↗</a>':'')+
   '</div><p class="ec165-note-message" id="ec165-note-message" role="status"></p></div>':'')+
   '</article>';
}
function matchboard(){
 const saved=homes(),passed=saved.filter(x=>savedStage(x)==='passed').length,finalists=saved.filter(x=>savedStage(x)==='finalist').length;
 const available=saved.map((x,i)=>({x,i})).filter(({x})=>state.filter==='all'||savedStage(x)===state.filter);
 if(state.sort==='price')available.sort((a,b)=>N(a.x.price)-N(b.x.price));
 if(state.sort==='monthly')available.sort((a,b)=>N(pricing(a.x)?.total,Infinity)-N(pricing(b.x)?.total,Infinity));
 const m=profile(),room=housingRoom();
 return '<section class="ec165-board" id="ec165-board" aria-label="Your home decision board">'+
 '<div class="ec165-board-header"><div><div class="ec165-eyebrow">YOUR PROPERTY DECISION BOARD</div>'+
 '<h2>Which home actually works for you?</h2><p>Turn your saved listings into real decisions. Compare costs, track viewings and record the details that matter.</p></div>'+
 '<div class="ec165-board-count"><strong>'+saved.length+'</strong><span>saved homes</span></div></div>'+
 (saved.length?'<div class="ec165-board-summary"><span>'+finalists+' finalists</span><span>'+passed+' passed on</span><span>'+(room===null?'Add income for budget comparison':CAD(room)+'/mo planned housing room')+'</span></div>'+
 '<div class="ec165-controls"><label>Show <select onchange="EC165.filter(this.value)">'+[['all','All homes'],...Object.entries(stages)].map(([v,l])=>'<option value="'+v+'"'+(v===state.filter?' selected':'')+'>'+E(l)+'</option>').join('')+'</select></label>'+
 '<label>Sort by <select onchange="EC165.sort(this.value)">'+[['recent','Saved order'],['monthly','Monthly ownership'],['price','Asking price']].map(([v,l])=>'<option value="'+v+'"'+(v===state.sort?' selected':'')+'>'+E(l)+'</option>').join('')+'</select></label>'+
 '<label>Rate scenario <select onchange="EC165.shock(this.value)">'+[0,1,2].map(v=>'<option value="'+v+'"'+(v===state.rateShock?' selected':'')+'>'+(v===0?'Your saved rate':'Rate +'+v+' pp')+'</option>').join('')+'</select></label></div>'+
 '<div class="ec165-card-grid">'+(available.length?available.map(({x,i})=>boardCard(x,i)).join(''):'<p class="ec165-blank">No homes in this stage. Change the filter to see your other saved homes.</p>')+'</div>'+
 '<p class="ec165-disclaimer">Estimates reuse your Decision Lab assumptions and saved financial inputs. The same down payment is applied to each home and may be insufficient for some. Monthly room removes recorded current housing costs as a replacement-home illustration. Upfront cash checks use recorded cash only; FHSA/RRSP and other sources are not automatically included. Values may be outdated, and MLS price or status changes are not monitored. Confirm costs, eligibility and property details with qualified providers.</p>':
 '<div class="ec165-empty"><div><strong>Start with a home worth considering.</strong><p>Find an actual property at your preferred listing website, add it using the form below, then it will appear here with financial context and viewing notes.</p></div><div><a href="https://www.realtor.ca/" target="_blank" rel="noopener noreferrer">Browse REALTOR.ca ↗</a><a href="https://www.zolo.ca/" target="_blank" rel="noopener noreferrer">Browse Zolo ↗</a></div></div>')+
 '</section>';
}
function nextMove(){
 const saved=homes(),counts={finalist:0,visited:0,considering:0};
 saved.forEach(x=>{const k=savedStage(x);if(k in counts)counts[k]++;});
 const m=profile(),housing=housingRoom();
 const focus=saved.find(x=>id(x)===String(state.focus||''))||saved.find(x=>savedStage(x)==='finalist')||saved.find(x=>savedStage(x)==='visited')||saved[0];
 let heading='',detail='',primary='Real Estate',action='homes';
 if(focus){
   const e=evaluate(focus);
   heading=focus.address||'Continue your home comparison';
   detail=e.title+'. '+(e.estimate?'Estimated ownership '+CAD(e.estimate.total)+'/mo at your saved rate. ':'')+'Open your shortlist to review the full picture.';
   primary='Continue this decision';action='saved';
 }else if(!m||N(m.income)<=0){
   heading='Build a plan around your own numbers';
   detail='Enter income and expenses to see which future home purchases could fit your budget.';
   primary='Complete my financial profile';action='profile';
 }else if(housing!==null&&housing<=0){
   heading='Make room for the home you want';
   detail='Your entered spending and savings leave no estimated monthly housing room. Review the budget before shopping.';
   primary='Review my budget';action='budget';
 }else{
   heading='Find a home. Keep your financial plan.';
   detail='Bring a real property you like into EquityClimb. See ownership cost and compare it against your saved monthly plan.';
   primary='Start comparing homes';action='saved';
 }
 return '<section class="ec165-brief" aria-label="Your next meaningful step">'+
 '<div class="ec165-brief-text"><div class="ec165-eyebrow">YOUR DECISION BRIEF · BASED ON SAVED INPUTS</div>'+
 '<h2>'+E(heading)+'</h2><p>'+E(detail)+'</p>'+
 '<div class="ec165-brief-pills"><span>'+saved.length+' saved '+(saved.length===1?'home':'homes')+'</span><span>'+counts.finalist+' finalists</span>'+
 (housing!==null?'<span>'+CAD(housing)+'/mo estimated housing room</span>':'<span>Income required for budget fit</span>')+
 '</div></div><div class="ec165-brief-cta"><button type="button" onclick="EC165.open(\''+action+'\')">'+E(primary)+' <span aria-hidden="true">↗</span></button>'+
 '<button class="ec165-secondary" type="button" onclick="EC165.open(\'readiness\')">Review home readiness</button></div></section>';
}
const priorHome=V.home;
V.home=function(){
 const html=priorHome.apply(this,arguments);if(!S.profile?.onboarded)return html;
 const t=document.createElement('template');t.innerHTML=html;
 const target=t.content.querySelector('.ec16-intelligence');
 const node=document.createElement('div');node.innerHTML=nextMove();
 if(target)target.replaceWith(node.firstElementChild);
 else {const hero=t.content.querySelector('.ec161-hero');if(hero)hero.after(node.firstElementChild);else t.content.prepend(node.firstElementChild);}
 // Replace redundant generic advice, retain existing weekly tasks and actual data.
 t.content.querySelector('.ec13-home-lead')?.remove();
 t.content.querySelector('.ec13-home-cards')?.remove();
 const wrap=document.createElement('div');wrap.append(t.content);return wrap.innerHTML;
};
const priorHomes=V.homes;
V.homes=function(){
 const html=priorHomes.apply(this,arguments);if(!S.profile?.onboarded)return html;
 const t=document.createElement('template');t.innerHTML=html;
 const saved=t.content.querySelector('.ec13-saved');
 if(saved){
   const node=document.createElement('div');node.innerHTML=matchboard();
   saved.prepend(node.firstElementChild);
   saved.querySelector('.ec13-compare-wrap')?.remove(); // New board supersedes the static comparison table.
 }
 const wrap=document.createElement('div');wrap.append(t.content);return wrap.innerHTML;
};
function repaint(){
 if(typeof render==='function')render();
 // When preserving focus on a review action, scroll the decision board back into view.
}
const itemAt=i=>Number.isInteger(i)&&i>=0?homes()[i]:null;
const message=txt=>{const el=document.getElementById('ec165-note-message');if(el)el.textContent=txt;};
window.EC165={
 evaluate(i,shock){const x=itemAt(i);return x?evaluate(x,shock):null;},
 stage(i,value){const x=itemAt(i);if(!x||!Object.prototype.hasOwnProperty.call(stages,value))return;state.stages[id(x)]=value;
   if(persist())repaint();else message('Could not save this stage. Check browser storage.');},
 note(i,value){const x=itemAt(i);if(!x)return;state.notes[id(x)]=String(value).slice(0,500);
   message(persist()?'Notes saved on this device.':'Could not save notes. Check browser storage.');},
 focus(i){const x=itemAt(i);if(!x)return;state.focus=state.focus===id(x)?null:id(x);persist();repaint();},
 filter(value){if(!['all',...Object.keys(stages)].includes(value))return;state.filter=value;persist();repaint();},
 sort(value){if(!['recent','monthly','price'].includes(value))return;state.sort=value;persist();repaint();},
 shock(value){const n=Number(value);if(![0,1,2].includes(n))return;state.rateShock=n;persist();repaint();},
 open(action){if(action==='saved'){if(typeof window.EC13?.tab==='function')window.EC13.tab('saved');else go('homes');}
   else if(['budget','readiness','profile','homes'].includes(action))go(action);},
 analyze(i){const x=itemAt(i);if(!x)return;if(typeof window.EC13?.analyze==='function')window.EC13.analyze('saved',i);else this.open('readiness');},
 ask(i){const x=itemAt(i),e=x?evaluate(x,0):null;if(!x||!e?.estimate)return;
   // Prefill only. Never transmit a street address, user's notes or financial profile automatically.
   const q='Help me evaluate buying a home priced at '+CAD(x.price)+
     ' in Canada. My illustrative ownership estimate is '+CAD(e.estimate.total)+
     ' per month, with upfront cash of '+CAD(e.estimate.upfront)+
     '. Explain the affordability, mortgage insurance, interest-rate and repair risks, and what I should verify with a lender and inspector. Do not assume pre-approval.';
   if(typeof window.EC7?.prefill==='function')window.EC7.prefill(q);
   else if(typeof window.EC16?.ask==='function')window.EC16.ask(q);
   else go('advisor');},
 copy(i){const x=itemAt(i);if(!x)return;const e=evaluate(x,0),p=e.estimate;
   const contents=['EquityClimb home decision — user-entered property',x.address||'Property',x.city||'Canada',
      'Asking price '+CAD(x.price),'Estimated monthly ownership '+(p?CAD(p.total):'not available'),
      'Estimated upfront cash '+(p?CAD(p.upfront):'not available'),
      'Decision stage '+stages[savedStage(x)],'Estimate only. Verify actual listing and financing.'].join('\n');
   if(!navigator.clipboard?.writeText){message('Clipboard access is unavailable.');return;}
   navigator.clipboard.writeText(contents).then(()=>message('Comparison copied.'),()=>message('Clipboard permission was blocked.'));}
};
})();
