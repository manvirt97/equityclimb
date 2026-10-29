/* EquityClimb rate integrity / mortgage behaviour engine.
 * Illustrative planning only: lender-specific contract and payment frequency are authoritative. */
(function(root,factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 root.ECMortgageModes=core;
})(typeof globalThis!=='undefined'?globalThis:window,function(){
 'use strict';
 const finite=(x)=>Number.isFinite(+x)&&x!==null&&x!==''?+x:NaN;
 const round=x=>Math.round(x*100)/100;
 function payment(principal,annualPct,months,fixedRate=false){
   const B=finite(principal),y=finite(annualPct),n=finite(months);
   if(!Number.isFinite(B)||B<0||!Number.isFinite(y)||y<0||y>30||!Number.isFinite(n)||n<1||n>600)return NaN;
   const i=fixedRate?Math.pow(1+y/200,1/6)-1:y/1200;
   if(i<1e-12)return B/n;
   return B*i/(1-Math.pow(1+i,-n));
 }
 function monthsToPay(balance,annualPct,paymentAmount,fixedRate=false){
   const B=finite(balance),r=finite(annualPct),p=finite(paymentAmount);
   if(!Number.isFinite(B)||B<=0||!Number.isFinite(r)||r<0||r>30||!Number.isFinite(p)||p<=0)return {months:null,interestMonthly:NaN,warning:'Check mortgage balance, rate and payment.'};
   const i=fixedRate?Math.pow(1+r/200,1/6)-1:r/1200;
   const interestMonthly=B*i;
   if(p<=interestMonthly+1e-9)return {months:Infinity,interestMonthly,warning:'Payment may not cover interest. Trigger-rate / negative-amortization review is needed.'};
   const n=i<1e-12?B/p:-Math.log1p(-B*i/p)/Math.log1p(i);
   return {months:Math.ceil(n),interestMonthly,warning:null};
 }
 function impact({balance,rate,paymentAmount,remainingYears,mode,nextRate}={}){
   const B=finite(balance),old=finite(rate),future=finite(nextRate),p=finite(paymentAmount),years=finite(remainingYears);
   if(!Number.isFinite(B)||B<=0||!Number.isFinite(old)||old<0||old>30||
      !Number.isFinite(future)||future<0||future>30||!Number.isFinite(p)||p<=0||
      !Number.isFinite(years)||years<=0||years>40)return {valid:false,message:'Enter a positive balance, payment and remaining amortization (up to 40 years).'};
   const months=Math.round(years*12);
   const unchanged=monthsToPay(B,old,p,mode==='fixed-rate');
   if(mode==='fixed-rate')return {valid:true,mode,rate:old,oldRate:old,monthly:p,previousMonthly:p,delta:0,months:unchanged.months,interestMonthly:unchanged.interestMonthly,warning:unchanged.warning,note:'Your contractual fixed rate and payment do not change on a BoC announcement. Recalculate at renewal.'};
   if(mode==='fixed-payment'){
     const rem=monthsToPay(B,future,p,false);
     return {valid:true,mode,rate:future,oldRate:old,monthly:p,previousMonthly:p,delta:0,
       months:rem.months,oldMonths:unchanged.months,interestMonthly:rem.interestMonthly,
       warning:rem.warning,note:'Payment held constant for this illustration. Your amortization changes; your lender may require a higher payment at a trigger point.'};
   }
   if(mode==='adjustable-payment'){
     const next=payment(B,future,months,false);
     const prev=payment(B,old,months,false);
     return {valid:Number.isFinite(next),mode,rate:future,oldRate:old,monthly:next,
       previousMonthly:prev,delta:next-prev,months,oldMonths:months,interestMonthly:B*future/1200,
       warning:null,note:'Estimated payment to keep your entered remaining amortization. Actual lender calculation may differ.'};
   }
   return {valid:false,message:'Choose the mortgage arrangement shown in your contract.'};
 }
 function officialPrime(rates,localDate){
   const raw=rates?.prime;
   const ann=rates?.primeAnnouncement;
   const date=localDate||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   if(ann?.confirmed&&Number.isFinite(+ann.value)&&ann.effectiveDate<=date &&
     (!raw?.date||raw.date<ann.effectiveDate))return {value:+ann.value,date:ann.effectiveDate,source:ann.sourceUrl,confirmed:true};
   if(raw&&Number.isFinite(+raw.value))return {value:+raw.value,date:raw.date||'',source:raw.sourceUrl||'',confirmed:!!raw.confirmed};
   return null;
 }
 return {payment,monthsToPay,impact,officialPrime};
});
