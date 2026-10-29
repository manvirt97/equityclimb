/* Rate source transparency + mortgage payment choices. Scoped to Plan > Mortgage. */
(()=>{
 'use strict';
 if(typeof S==='undefined'||typeof P==='undefined'||typeof ECMortgageModes==='undefined'||typeof save!=='function'||typeof render!=='function'||window.ECMortgageImpact)return;
 const M=ECMortgageModes;
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cad=v=>Number.isFinite(v)?'$'+Math.round(v).toLocaleString('en-CA'):'—';
 const yrs=v=>v===Infinity?'Never at this payment':Number.isFinite(v)?(v/12).toFixed(1)+' years':'Unavailable';
 const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 function state(){
   if(!S.ecMortgage||typeof S.ecMortgage!=='object')S.ecMortgage={};
   const m=S.ecMortgage;
   if(!Number.isFinite(+m.remainingYears)||+m.remainingYears<=0)m.remainingYears=Number.isFinite(+S.fp?.mort?.amortYears)&&+S.fp.mort.amortYears>0?+S.fp.mort.amortYears:25;
   if(!Number.isFinite(+m.shift))m.shift=.25;
   return m;
 }
 function source(r){
   const ann=r?.primeAnnouncement?.confirmed?r.primeAnnouncement:null;
   const prime=r?.primeObserved||r?.prime;
   const age=r?.fetched?Math.max(0,(Date.now()-Date.parse(r.fetched))/36e5):null;
   let s=ann?'Lender-confirmed prime '+(+ann.value).toFixed(2)+'% effective '+e(ann.effectiveDate)+' ('+e(ann.lender)+').':prime?'Latest available BoC weekly prime '+(+prime.value).toFixed(2)+'% observed '+e(prime.date)+'.':'No confirmed bank-prime reading. Do not use stale rates for decisions.';
   s+=' '+(age===null?'Last successful live check unverified.':age>24?'Last source check '+Math.floor(age)+' hours ago; refresh before relying on this.':'Source checked '+Math.round(age*60)+' minutes ago.');
   return '<div class="ec-mortgage-source" role="status"><strong>Rate sources & reliability</strong><p>'+s+'</p><p>Your mortgage balance, payment, remaining amortization and prime discount are saved inputs, <strong>not verified bank records</strong>. Budgets, investments, property prices and tax assumptions must be checked separately.</p><button class="btn ghost sm" type="button" data-ec-m-action="refresh">Refresh official rates</button>'+(ann?.sourceUrl?'<a href="'+e(ann.sourceUrl)+'" rel="noopener noreferrer" target="_blank">Official lender source</a>':'')+'</div>';
 }
 function view(){
   const m=state(),variable=S.rtype==='Variable',mode=variable?m.mode||'unselected':'fixed-rate';
   const r=typeof RATES!=='undefined'?RATES:null,ann=r?.primeAnnouncement?.confirmed?r.primeAnnouncement:null;
   const linked=variable&&S.rateMode==='Live';
   const future=linked&&ann&&ann.effectiveDate>localDate();
   const shift=Math.max(-3,Math.min(3,+m.shift||0)),old=Number(S.rate);
   const nextRate=future?(+ann.value+Number(S.adj||0)):old+shift;
   const scenario=M.impact({balance:S.bal,rate:old,nextRate,paymentAmount:S.pmt,remainingYears:m.remainingYears,mode});
   const choices=variable?'<div class="ec-mortgage-choices" role="group" aria-label="Select contract payment behaviour">'+
      '<button type="button" data-ec-m-mode="fixed-payment" aria-pressed="'+(mode==='fixed-payment')+'" class="'+(mode==='fixed-payment'?'selected':'')+'">Keep payment; amortization changes</button>'+
      '<button type="button" data-ec-m-mode="adjustable-payment" aria-pressed="'+(mode==='adjustable-payment')+'" class="'+(mode==='adjustable-payment'?'selected':'')+'">Keep amortization; payment changes</button></div>':
      '<p>Fixed-rate mortgage: the BoC announcement does not change your contracted mortgage payment or rate until renewal.</p>';
   const result=!scenario.valid?'<p class="ec-mortgage-caution">'+e(scenario.message)+'</p>':
      '<div class="ec-mortgage-results"><div><span>Modeled monthly payment</span><strong>'+cad(scenario.monthly)+'</strong><small>'+(mode==='adjustable-payment'?'Change from modeled prior payment '+(scenario.delta>=0?'+':'')+cad(scenario.delta):'Same as your saved payment')+'</small></div>'+
      '<div><span>Modeled time to payoff</span><strong>'+yrs(scenario.months)+'</strong><small>'+(mode==='fixed-payment'?'At previous rate: '+yrs(scenario.oldMonths):'Based on entered remaining amortization')+'</small></div>'+
      '<div><span>Initial interest per month</span><strong>'+cad(scenario.interestMonthly)+'</strong><small>Approximate; lender compounding may differ</small></div></div>'+
      '<p>'+e(scenario.note)+'</p>'+(scenario.warning?'<p class="ec-mortgage-caution" role="alert">'+e(scenario.warning)+' Contact your lender.</p>':'');
   const rateDesc=future?'Confirmed future lender prime effective '+e(ann.effectiveDate)+'. Your modeled contract rate '+old.toFixed(2)+'% → '+nextRate.toFixed(2)+'% using the saved prime adjustment.':
       'Scenario: current saved mortgage rate '+old.toFixed(2)+'% '+(shift>=0?'+':'')+shift.toFixed(2)+' percentage points (illustrative).';
   return '<section class="card ec-mortgage-impact" aria-label="Mortgage rate changes and contract choices"><h2>How rate changes affect your mortgage</h2>'+
      '<p>Select the arrangement in your mortgage contract. This calculator never changes your real payment, balance or lender instructions.</p>'+source(r)+choices+
      '<div class="ec-mortgage-inputs"><label>Remaining amortization in years (verify with lender)<input data-ec-m-input="years" type="number" min="1" max="40" step="0.5" value="'+e(m.remainingYears)+'"></label>'+
      (variable&&!future?'<label>Rate change scenario, percentage points<input data-ec-m-input="shift" type="number" min="-3" max="3" step="0.25" value="'+e(shift)+'"></label>':'')+'</div>'+
      (variable?'<p class="ec-mortgage-source">'+rateDesc+'</p>':'')+result+
      (variable?'<label class="ec-mortgage-link"><input type="checkbox" data-ec-m-input="property" '+(m.linkProperty?'checked':'')+'> Opt in: also apply my live mortgage rate to the Real Estate / Shortlist assumptions <small>(not a new-home loan quote; previous property rate is restored when switched off)</small></label>':'')+
      '<p class="ec-mortgage-disclaimer">Only Live + Variable follows confirmed lender prime automatically. Manual, fixed-rate and independent property scenario rates remain unchanged unless opted in. Interest, payments, trigger points and renewal terms depend on your bank contract. Estimates are not bank statements.</p></section>';
 }
 const prior=P.mortgage;
 if(typeof prior==='function')P.mortgage=function(){return view()+prior.apply(this,arguments);};
 document.addEventListener('click',event=>{
   const el=event.target.closest?.('[data-ec-m-mode],[data-ec-m-action]');if(!el)return;
   const mode=el.dataset.ecMMode;
   if(mode&&['fixed-payment','adjustable-payment'].includes(mode)){state().mode=mode;save();render();}
   if(el.dataset.ecMAction==='refresh'&&typeof loadRates==='function')loadRates(true);
 });
 document.addEventListener('change',event=>{
   const el=event.target;if(!el?.dataset?.ecMInput)return;
   const m=state(),v=el.value;
   if(el.dataset.ecMInput==='years'&&Number.isFinite(+v)&&+v>=1&&+v<=40)m.remainingYears=+v;
   if(el.dataset.ecMInput==='shift'&&Number.isFinite(+v)&&+v>=-3&&+v<=3)m.shift=+v;
   if(el.dataset.ecMInput==='property'){
     const c=S.ec13?.calc;
     if(c){
       if(el.checked&&!m.linkProperty){m.savedPropertyRate=Number(c.rate);m.savedPropertyFixed=c.fixed;m.linkProperty=true;}
       else if(!el.checked&&m.linkProperty){m.linkProperty=false;if(Number.isFinite(m.savedPropertyRate))c.rate=m.savedPropertyRate;if(m.savedPropertyFixed!==undefined)c.fixed=m.savedPropertyFixed;delete m.savedPropertyRate;delete m.savedPropertyFixed;}
       if(m.linkProperty&&S.rateMode==='Live'&&S.rtype==='Variable'&&Number.isFinite(+S.rate)){c.rate=+S.rate;c.fixed=false;}
     }
   }
   save();render();
 });
 window.ECMortgageImpact={refresh:()=>typeof loadRates==='function'?loadRates(true):Promise.resolve(),state};
})();
