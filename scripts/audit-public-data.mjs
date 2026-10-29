/* Public source health checks. No account data, API keys or personal data are queried. */
import {fileURLToPath} from 'node:url';
const ageHours=(x,now=Date.now())=>{const t=typeof x==='number'?x:Date.parse(x);return Number.isFinite(t)?Math.max(0,(now-t)/36e5):Infinity;};
export function inspectPublicFeeds({rates,rules,quotes,news,homes},date=new Date()){
 const findings=[],year=date.getUTCFullYear(),now=date.getTime();
 const note=(source,status,reason)=>findings.push({source,status,reason});
 if(!rates||!Number.isFinite(+rates.policy?.value)||!Number.isFinite(+rates.prime?.value))
    note('Official policy and prime','error','Missing numeric Bank of Canada data');
 else if(ageHours(rates.fetched,now)>4)note('Official policy and prime','error','Official data response fetched more than four hours ago');
 else if(rates.errors?.lenderPrime)note('Official policy and prime','warning','Lender announcement feed is unavailable; posted weekly prime could lag');
 else note('Official policy and prime','ok','Policy '+rates.policy.value+'%, published weekly prime '+rates.prime.value+'%; lender announcement '+(rates.primeAnnouncement?.value??'none'));
 const ann=rates?.primeAnnouncement;
 if(ann?.confirmed&&/^\d{4}-\d{2}-\d{2}$/.test(ann.effectiveDate||'')){
  const local=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  if(ann.effectiveDate<=local&&rates.prime?.date<ann.effectiveDate&&Math.abs(+rates.prime.value-(+ann.value))>.001)
    note('Effective prime timing','error','Confirmed lender prime is not reflected in the effective calculation after its effective date');
  else note('Effective prime timing','ok','Bank prime announcement effective date is respected');
 }else note('Effective prime timing','warning','No current lender announcement in the response; verify posted lender rate on decision days');
 if(!rules||rules.year!==year)note('Canadian annual tax rules','error','Tax endpoint returned an incorrect or missing year');
 else if(ageHours(rules.checked,now)>24)note('Canadian annual tax rules','warning','Source rules last checked more than 24 hours ago');
 else if(rules.status==='official')note('Canadian annual tax rules','warning','Source claims fully official even where some components are known to be estimates');
 else note('Canadian annual tax rules','ok','Data year '+year+', rules status '+rules.status+' (estimates must be disclosed)');
 if(!quotes||!Array.isArray(quotes.items)||!quotes.items.length)note('Market quotations','error','No market quotes returned');
 else {
   const uncertain=quotes.items.filter(q=>!q.timestampVerified||!Number.isFinite(q.time));
   const veryOld=quotes.items.filter(q=>ageHours(q.time,now)>120);
   if(veryOld.length)note('Market quotations','warning','Some vendor prices have last-trade timestamps over five days old');
   else if(uncertain.length)note('Market quotations','warning','Missing trading timestamps for '+uncertain.length+' symbols');
   else note('Market quotations','ok','Prices returned with per-symbol provider and trade timestamp; not real-time execution feed');
 }
 if(!news||!Array.isArray(news.items))note('News feed','error','No structurally valid news response');
 else if(!news.items.length)note('News feed','warning','No finance category articles; individual providers may be unavailable');
 else if(news.items.some(x=>!x.date||!Number.isFinite(Date.parse(x.date))))note('News feed','error','Undated articles were presented as current');
 else if((news.sourceStatus||[]).some(x=>x.ok===false))note('News feed','warning','Provider outages; published articles remain external and unverified');
 else note('News feed','ok','Dated headlines sampled, content not independently fact-checked');
 if(!homes||typeof homes.enabled!=='boolean')note('Licensed listings','error','Unclear MLS provider state');
 else note('Licensed listings','ok',homes.enabled?'Licensing and availability must be separately verified':'Disabled; app must not show invented live listings');
 return {findings,errors:findings.filter(x=>x.status==='error'),warnings:findings.filter(x=>x.status==='warning')};
}
export async function run(base='https://equityclimb.pages.dev'){
 const endpoints={
 rates:'/api/boc?fresh=1',rules:'/api/rules?year='+new Date().getUTCFullYear(),
 quotes:'/api/quotes?symbols=RY.TO,TD.TO&fresh=1',
 news:'/api/news?scope=national&category=finance&country=CA&fresh=1',
 homes:'/api/homes?city=Calgary'
 };
 const data={};
 await Promise.all(Object.entries(endpoints).map(async([k,path])=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),28000);
  try{
   const url=base+path+(path.includes('?')?'&':'?')+'audit='+Date.now();
   const r=await fetch(url,{cache:'no-store',signal:controller.signal});
   if(!r.ok)throw Error('HTTP '+r.status);
   data[k]=await r.json();
  }catch(e){console.error(k+' source failed: '+e.message);}
  finally{clearTimeout(timer);}
 }));
 const outcome=inspectPublicFeeds(data);
 console.log(JSON.stringify({checked:new Date().toISOString(),...outcome},null,2));
 if(outcome.errors.length||outcome.warnings.length)process.exitCode=1;
 return outcome;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])run().catch(err=>{console.error(err);process.exitCode=1;});
