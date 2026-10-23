import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/ec-money-core.js');
const {mortgagePayment,monthlyRate,ownership}=globalThis.ECMoney;
test('fixed rate monthly equivalent uses Canadian semiannual compounding',()=>{
 assert.ok(Math.abs(monthlyRate(6,true)-(Math.pow(1.03,1/6)-1))<1e-12);
 assert.ok(Math.abs(mortgagePayment(500000,5,25)-2908.024925185)<0.01);
});
test('zero rate and down-payment changes',()=>{
 assert.equal(mortgagePayment(120000,0,10),1000);
 assert.equal(ownership({price:300000,down:300000,rate:5,years:25}).mortgage,0);
});
test('higher rates increase mortgage payment',()=>{
 const a=ownership({price:600000,down:120000,rate:4,years:25});
 const b=ownership({price:600000,down:120000,rate:6,years:25});
 assert.ok(b.total>a.total);
});
test('costs, affordability warning, maintenance and upfront are explicit',()=>{
 const x=ownership({price:600000,down:60000,rate:5,years:25,tax:300,insurance:150,utilities:180,condo:0,maintenancePct:1,closingPct:1.5,netIncome:6500,nonHousing:1800,cash:50000});
 assert.equal(x.maintenance,500);
 assert.equal(x.closing,9000);
 assert.equal(x.upfront,69000);
 assert.ok(x.requiresInsuranceReview);
 assert.ok(x.caution.includes('Mortgage default insurance is estimated'));
 assert.ok(x.insurancePremium > 0);
 assert.ok(x.principal > x.price-x.down);
 assert.ok(Math.abs(x.room-(6500-1800-x.total))<.0001);
});
test('invalid and very large values are constrained',()=>{
 const x=ownership({price:-3,down:9999,rate:-20,years:0});
 assert.equal(x.price,0); assert.equal(x.down,0); assert.equal(x.mortgage,0);
});
