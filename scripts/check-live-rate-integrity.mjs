import {fileURLToPath} from 'node:url';
/* Public-data integrity check, for GitHub Actions and manual owner verification.
   NO account data, bank credentials or user input is accessed. */
export function validate(data, now){
 const warnings=[],errors=[];
 if(!data||typeof data!=='object'){errors.push('The public BoC API did not return JSON.');return {errors,warnings};}
 const current=now||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const checked=Date.parse(data.fetched);
 if(!Number.isFinite(checked)||Math.abs(Date.now()-checked)>45*60*1000)errors.push('The API fetch timestamp is missing or old.');
 if(!Number.isFinite(+data.policy?.value))errors.push('A numeric Bank of Canada policy rate is missing.');
 if(!Number.isFinite(+data.prime?.value))errors.push('A numeric prime rate is missing.');
 if(data.errors?.policy||data.errors?.prime||data.errors?.lenderPrime)warnings.push('At least one official rate source failed: '+JSON.stringify({policy:data.errors?.policy,prime:data.errors?.prime,lenderPrime:data.errors?.lenderPrime}));
 const lender=data.primeAnnouncement;
 if(lender?.confirmed&&Number.isFinite(+lender.value)){
   if(lender.effectiveDate<=current){
     const observed=data.primeObserved||data.prime;
     if(data.prime.date<lender.effectiveDate || Math.abs(+data.prime.value-+lender.value)>.001){
       if(!observed?.date||observed.date<=lender.effectiveDate)errors.push('Announced lender prime has not become effective in the API.');
     }
   }
 }else warnings.push('No confirmed lender announcement in API; latest published BoC prime may be delayed.');
 const latestPolicy=data.policyAnnouncement;
 if(latestPolicy?.announced&&latestPolicy.date===current&&!lender?.confirmed)
   warnings.push('Bank of Canada announced a decision today without a confirmed current lender prime announcement. Review bank sites.');
 if(!data.fetched||!data.source)warnings.push('Rates provenance details are missing.');
 return {errors,warnings};
}
export async function run(url='https://equityclimb.pages.dev/api/boc?fresh=1'){
 const res=await fetch(url+'&monitor='+Date.now(),{cache:'no-store'});
 if(!res.ok)throw Error('Production BoC rate API returned HTTP '+res.status);
 const data=await res.json();
 const health=validate(data);
 console.log(JSON.stringify({checked:new Date().toISOString(),policy:data.policy?.value,prime:data.prime?.value,
   confirmedPrime:data.primeAnnouncement?.value,effectiveDate:data.primeAnnouncement?.effectiveDate,...health},null,2));
 if(health.errors.length||health.warnings.length)process.exitCode=1;
 return health;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])run().catch(err=>{console.error(err);process.exitCode=1;});
