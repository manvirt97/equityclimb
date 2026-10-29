/* EquityClimb 16.10 — source health and financial input audit, Settings only.
 * This panel NEVER reads private balances or sends personal financial data to any endpoint. */
(()=>{
 'use strict';
 if(window.ECDataHealth||typeof V==='undefined'||typeof V.settings!=='function')return;
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const state={status:'Not checked this session',last:null,items:[],busy:false};
 const now=()=>new Date().toISOString();
 const age=iso=>{const n=Date.parse(iso);return Number.isFinite(n)?Math.max(0,(Date.now()-n)/36e5):Infinity;};
 function panel(){
  return '<section class="card ec-health" aria-labelledby="ec-health-title"><div class="ec-health-head"><div><h2 id="ec-health-title">Financial data reliability</h2><p>Source checks, not a guarantee that every value is correct. Your saved bank balances and financial entries remain private on this device.</p></div><button class="btn ghost sm" type="button" onclick="ECDataHealth.check(true)">Check sources now</button></div>'+
   '<p class="ec-health-status" id="ec-health-status" role="status" aria-live="polite">'+e(state.status)+'</p><div id="ec-health-results">'+rows()+'</div>'+
   '<p class="ec-health-disclaimer">Live source values, estimates and manually entered figures must not be confused. Changes to your mortgage contract, investment balances, tax situation or home prices cannot be verified without their respective authenticated and licensed records.</p></section>';
 }
 function rows(){return state.items.length?state.items.map(x=>'<div class="ec-health-row"><strong>'+e(x.name)+'</strong><span>'+e(x.status)+'</span><small>'+e(x.detail)+'</small></div>').join(''):'<p class="small mute">Select Check sources now to verify public feeds. Saved figures are not bank-verified.</p>';}
 function paint(){
  const status=document.getElementById('ec-health-status'),results=document.getElementById('ec-health-results');
  if(status)status.textContent=state.status;
  if(results)results.innerHTML=rows();
 }
 async function get(url){const controller=new AbortController();const tm=setTimeout(()=>controller.abort(),12000);
   try{const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store',signal:controller.signal});
      if(!r.ok)throw Error('HTTP '+r.status);
      return await r.json();
   }finally{clearTimeout(tm);}
 }
 async function check(force=false){
  if(state.busy)return;
  if(!force&&state.last&&Date.now()-state.last<20*60*1000)return paint();
  state.busy=true;state.status='Checking public data providers…';paint();
  const year=new Date().getFullYear();
  const tasks=[
    {name:'BoC and lender prime',url:'/api/boc?fresh=1',fn:j=>{
      const stale=age(j.fetched)>3;
      const policy=Number(j.policy?.value),prime=Number(j.primeAnnouncement?.confirmed?j.primeAnnouncement.value:j.prime?.value);
      if(!Number.isFinite(policy)||!Number.isFinite(prime))return {status:'Unavailable',detail:'Policy or prime rate missing; do not assume saved numbers are live.'};
      const ann=j.primeAnnouncement?.confirmed?'Announced '+j.primeAnnouncement.value+'% effective '+j.primeAnnouncement.effectiveDate:'Weekly BoC prime observation, may lag lender announcements';
      return {status:stale||j.errors?.lenderPrime?'Review source':'Verified response',detail:'BoC '+policy.toFixed(2)+'%, prime '+prime.toFixed(2)+'%. '+ann+(stale?' · response stale':'')};
    }},
    {name:'Canadian tax rules',url:'/api/rules?year='+year,fn:j=>({status:j.year===year?j.status||'Check rules year':'Wrong tax year',detail:'Tax year '+j.year+'. '+(j.status==='official'?'Official published table':j.status==='official_with_estimates'?'Official values plus estimated components': 'Estimated: confirm with CRA')+'. TFSA/RRSP personal room requires account records.'})},
    {name:'Market quotes',url:'/api/quotes?symbols=RY.TO,TD.TO&fresh=1',fn:j=>{
       const items=Array.isArray(j.items)?j.items:[],dated=items.filter(x=>Number.isFinite(x.time)&&x.time>0);
       return {status:dated.length===items.length&&items.length>0?'Delayed market data':'Missing or undated quotes',detail:items.length+' retrieved; latest trading timestamp '+(dated.length?new Date(Math.max(...dated.map(x=>x.time))).toISOString():'unavailable')+'. Not real-time execution prices.'};
    }},
    {name:'Public news',url:'/api/news?scope=national&category=finance&country=CA&fresh=1',fn:j=>{const failures=(j.sourceStatus||[]).filter(x=>!x.ok).length;return {status:failures?'Partial provider outage':(j.items||[]).length?'Dated feed sampled':'Empty or unavailable',detail:(j.items||[]).length+' articles; source failures '+failures+'. Headlines, events and AI summaries are not fact-checked transaction records.'};}},
    {name:'Live MLS listings',url:'/api/homes?city=Calgary',fn:j=>({status:j.enabled?'Provider response available':'Not connected',detail:j.enabled?'Availability does not establish rights or listing accuracy.': 'Use manually entered homes only. No current MLS inventory is shown.'})}
  ];
  const settled=await Promise.allSettled(tasks.map(async t=>t.fn(await get(t.url))));
  state.items=settled.map((r,i)=>({name:tasks[i].name,...(r.status==='fulfilled'?r.value:{status:'Unavailable',detail:'Provider request failed; existing displayed values may be cached. Do not treat as current.'})}));
  state.items.push({name:'Your balances, budget and investments',status:'Manual inputs',detail:'No authenticated bank/account reconciliation. Check statements and last-entered values.'});
  state.items.push({name:'Mortgage / ownership forecasts',status:'Illustrative calculations',detail:'Tested formulas, but lender terms, closing costs, repairs and future returns are assumptions, not verified records.'});
  state.last=Date.now();state.busy=false;state.status='Public-source check completed '+now().replace('T',' ').slice(0,16)+' UTC. Review any warnings below.';paint();
 }
 const prior=V.settings;
 V.settings=function(){
   const result=prior.apply(this,arguments)+panel();
   setTimeout(()=>{if(document.getElementById('ec-health-status')&&(!state.last||Date.now()-state.last>60*60*1000))check(false);},50);
   return result;
 };
 window.ECDataHealth={check,getStatus:()=>({last:state.last,status:state.status,items:state.items.map(x=>({...x}))})};
})();
