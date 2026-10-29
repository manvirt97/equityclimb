/* EquityClimb financial decision engine v16. Illustrative Canadian owner-occupied mortgage estimates.
   Reference: canada.ca FCAC down-payment rules, CMHC homeowner premium tables (verified Oct 2026).
   No lender qualification, provincial insurance-premium sales tax or legal advice. */
(function(root, factory) { const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;root.ECMoney=x; })(typeof globalThis!=='undefined'?globalThis:window,function(){
 'use strict';
 const finite=(v,d=0)=>v===''||v==null||!Number.isFinite(+v)?d:+v;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,finite(v,a)));
 function monthlyRate(annualPct,fixed=true){const r=clamp(annualPct,0,30)/100;return fixed?Math.pow(1+r/2,1/6)-1:r/12;}
 function mortgagePayment(principal,rate,years,fixed=true){const P=Math.max(0,finite(principal)),n=Math.round(clamp(years,1,40)*12),i=monthlyRate(rate,fixed);return i===0?P/n:P*i/(1-Math.pow(1+i,-n));}
 function minimumDown(price){const p=clamp(price,0,20000000);return p>=1500000?p*.20:p<=500000?p*.05:25000+(p-500000)*.10;}
 function insuranceEstimate(price,down,years=25,eligible30=false){
   const p=clamp(price,0,20000000),d=clamp(down,0,p),ltv=p?(p-d)/p:0,required=p>0&&d<p*.20-0.001;
   const minimum=minimumDown(p),validDown=d>=minimum-0.001;
   const eligible=required&&p<1500000&&validDown&&(+years<=25||eligible30===true);
   const base=p-d;
   const pct=ltv>.90?4.00:ltv>.85?3.10:ltv>.80?2.80:0;
   // Keep a CONSERVATIVE hypothetical insurance allowance even when a scenario is
   // ineligible/unverified; otherwise a low-down-payment estimate understates carrying costs.
   // This does NOT mean insurance or lender approval is available.
   return {required,eligible,validDown,minimum,ltv,base,premium:required?base*pct/100:0,premiumRate:required?pct:0,
     needsReview:required&&!eligible,mayHaveSurcharge:eligible&&+years>25};
 }
 function ownership(input={}){
   const price=clamp(input.price,0,20000000),down=clamp(input.down,0,price),rate=clamp(input.rate,0,30),years=clamp(input.years,1,40);
   const ins=insuranceEstimate(price,down,years,input.eligible30===true);
   const premium=ins.premium;
   // Insurance estimates enter financed principal where eligible; do not understate when status uncertain.
   const principal=price-down+premium;
   const mortgage=mortgagePayment(principal,rate,years,input.fixed!==false);
   const propertyTax=clamp(input.tax,0,20000),insurance=clamp(input.insurance,0,10000),utilities=clamp(input.utilities,0,10000),condo=clamp(input.condo,0,10000);
   const maintenance=price*clamp(input.maintenancePct,0,10)/100/12;
   const total=mortgage+propertyTax+insurance+utilities+condo+maintenance;
   const closingPct=clamp(input.closingPct,0,10),closing=price*closingPct/100+clamp(input.closingExtra,0,2000000);
   const upfront=down+closing;
   const netIncome=Math.max(0,finite(input.netIncome)),nonHousing=Math.max(0,finite(input.nonHousing));
   const caution='Illustrative cash flow only, not a mortgage pre-approval. When mortgage insurance would normally be required, a hypothetical standard CMHC premium is included even if this scenario may NOT qualify for insurance; this must not be interpreted as lender approval. Actual insurer rules, provincial sales tax on the premium (where applicable), special surcharges, closing fees, land transfer tax, GST/HST on applicable new homes, utilities and unexpected repairs may vary. Confirm with your lender and lawyer.';
   return {price,down,principal,mortgage,propertyTax,insurance,utilities,condo,maintenance,total,closing,upfront,cashAfterClosing:finite(input.cash)-upfront,
      room:netIncome-nonHousing-total,rate,years,loanToValue:ins.ltv,insurancePremium:premium,insurancePremiumRate:ins.premiumRate,
      estimatedInsuredPrincipal:principal,minimumDown:ins.minimum,downPaymentValid:ins.validDown,insuranceEstimateAvailable:ins.eligible||!ins.required,
      insuranceNeedsReview:ins.needsReview,mayHaveSurcharge:ins.mayHaveSurcharge,requiresInsuranceReview:ins.required,caution};
 }
 function qualifyingRate(rate){return Math.max(5.25,clamp(rate,0,30)+2);}
 function monthlyQualifier(input){ const o=ownership(input);return mortgagePayment(o.principal,qualifyingRate(o.rate),o.years,input.fixed!==false); }
 function affordableRange(input={}){
  const budget=Math.max(0,finite(input.availableMonthly)); const down=Math.max(0,finite(input.down)),reserve=Math.max(0,finite(input.reserve));
  const spendableDown=Math.max(0,down-reserve);
  if(!budget||!spendableDown)return {maxPrice:0,ownership:ownership({...input,price:0,down:0}),cashDown:spendableDown};
  let lo=0,hi=Math.min(20000000,Math.max(1500000,spendableDown*25));
  for(let i=0;i<45;i++){const mid=(lo+hi)/2,d=Math.min(mid,spendableDown),o=ownership({...input,price:mid,down:d});
    if(o.total<=budget&&o.downPaymentValid&&o.insuranceEstimateAvailable)lo=mid;else hi=mid;
  }
  return {maxPrice:Math.floor(lo/1000)*1000,cashDown:spendableDown,ownership:ownership({...input,price:lo,down:Math.min(lo,spendableDown)})};
 }
 return {monthlyRate,mortgagePayment,minimumDown,insuranceEstimate,ownership,qualifyingRate,monthlyQualifier,affordableRange};
});
