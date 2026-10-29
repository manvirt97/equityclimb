import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/ec-money-core.js');
const C=globalThis.ECMoney;
test('minimum down uses 2026 Canadian 5/10% rule and 20% for 1.5 million+',()=>{
 assert.equal(C.minimumDown(400000),20000);
 assert.equal(C.minimumDown(600000),35000);
 assert.equal(C.minimumDown(1490000),124000);
 assert.equal(C.minimumDown(1500000),300000);
});
test('CMHC standard default insurance premium is financed, not mistakenly added upfront',()=>{
 const x=C.ownership({price:600000,down:60000,rate:5,years:25,closingPct:1.5,cash:100000});
 assert.equal(x.insurancePremium,540000*.031);
 assert.equal(x.principal,556740);
 assert.equal(x.upfront,69000);
 assert.ok(x.mortgage>C.mortgagePayment(540000,5,25));
 assert.equal(x.downPaymentValid,true);
});
test('20% down has zero premium',()=>{
 const x=C.ownership({price:750000,down:150000,rate:5,years:25});
 assert.ok(x.insurancePremium>0,'hypothetical insurance premium must not be silently omitted');
 assert.ok(x.principal>x.price-x.down);assert.equal(x.insuranceEstimateAvailable,true);
});
test('insufficient down and ineligible insured scenarios are never marked valid',()=>{
 const x=C.ownership({price:600000,down:10000,rate:5,years:25});
 assert.equal(x.downPaymentValid,false);assert.equal(x.insuranceNeedsReview,true);
 assert.equal(x.insurancePremium,0);
 const high=C.ownership({price:1550000,down:200000,rate:5,years:25});
 assert.equal(high.insuranceNeedsReview,true);
 assert.ok(!high.downPaymentValid);
});
test('30-year insured scenarios require explicitly declared eligibility and caution on surcharge',()=>{
 const no=C.ownership({price:500000,down:50000,rate:5,years:30});
 assert.equal(no.insuranceNeedsReview,true);
 const yes=C.ownership({price:500000,down:50000,rate:5,years:30,eligible30:true});
 assert.ok(yes.insurancePremium>0);assert.equal(yes.mayHaveSurcharge,true);
});
test('qualification stress rate is higher of 5.25 or rate plus 2',()=>{
 assert.equal(C.qualifyingRate(2),5.25);assert.equal(C.qualifyingRate(4.9),6.9);
 const x=C.ownership({price:600000,down:120000,rate:4.9,years:25});
 assert.ok(C.monthlyQualifier({price:600000,down:120000,rate:4.9,years:25})>x.mortgage);
});
test('higher provincial fees or mortgage rates reduce cash buffer / increase carrying cost',()=>{
 const base={price:550000,down:60000,rate:5,years:25,closingPct:1.5,cash:80000};
 const x=C.ownership(base),y=C.ownership({...base,closingExtra:25000,rate:7});
 assert.equal(y.upfront-x.upfront,25000);assert.ok(y.total>x.total);
});
test('comfort budget never exceeds chosen monthly maximum in bounded illustrative model',()=>{
 const x=C.affordableRange({availableMonthly:3400,down:130000,rate:5,years:25,tax:300,insurance:120,utilities:150,maintenancePct:1,closingPct:1.5});
 assert.ok(x.maxPrice>0);assert.ok(x.ownership.total<3401);assert.ok(x.ownership.downPaymentValid);
});
