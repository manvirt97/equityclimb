import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=n=>readFileSync(new URL('../public/'+n,import.meta.url),'utf8');
const core=read('app.js');
const ui=read('ec-mortgage-impact.js');
const readUMD=name=>{const ctx={globalThis:{},window:{},module:undefined,console,Math,Number};vm.runInNewContext(read(name),ctx);return ctx.globalThis;};
const modes=readUMD('ec-mortgage-modes.js').ECMortgageModes;
const money=readUMD('ec-money-core.js').ECMoney;

test('Canadian monthly fixed vs variable rates reconcile with shared financial core',()=>{
 const principal=450000,rate=4.5,n=300;
 assert.ok(Math.abs(modes.payment(principal,rate,n,true)-money.mortgagePayment(principal,rate,25,true))<.001);
 assert.ok(Math.abs(modes.payment(principal,rate,n,false)-money.mortgagePayment(principal,rate,25,false))<.001);
 assert.ok(modes.payment(principal,rate,n,true)<modes.payment(principal,rate,n,false));
});
test('fixed payment, rising rate extends payoff while payment stays same',()=>{
 const p=modes.payment(450000,3.95,300,false);
 const a=modes.impact({balance:450000,rate:3.95,nextRate:4.20,paymentAmount:p,remainingYears:25,mode:'fixed-payment'});
 assert.ok(a.valid);
 assert.equal(a.monthly,p);
 assert.equal(a.delta,0);
 assert.ok(a.months>a.oldMonths);
 assert.ok(a.interestMonthly>450000*3.95/1200);
});
test('adjustable payments rise to preserve amortization; falling rates reduce them',()=>{
 const base={balance:450000,rate:3.95,paymentAmount:2400,remainingYears:25,mode:'adjustable-payment'};
 const up=modes.impact({...base,nextRate:4.2});
 const down=modes.impact({...base,nextRate:3.7});
 assert.ok(up.valid);
 assert.equal(up.months,300);
 assert.ok(up.monthly>up.previousMonthly);
 assert.ok(down.monthly<down.previousMonthly);
});
test('fixed rate remains unaffected by the BoC rate move until renewal',()=>{
 const p=modes.impact({balance:450000,rate:4.0,nextRate:4.25,paymentAmount:2400,remainingYears:25,mode:'fixed-rate'});
 assert.equal(p.monthly,2400);assert.equal(p.delta,0);assert.equal(p.rate,4.0);
});
test('trigger-rate risk and nonamortization are explicitly flagged',()=>{
 const x=modes.impact({balance:450000,rate:4,nextRate:8,paymentAmount:2400,remainingYears:25,mode:'fixed-payment'});
 assert.equal(x.months,Infinity);
 assert.match(x.warning,/negative-amortization/);
 assert.equal(modes.impact({balance:-1,rate:4,nextRate:5,paymentAmount:100,remainingYears:25,mode:'fixed-payment'}).valid,false);
});
test('confirmed lender prime is applied on effective date, not announcement date',()=>{
 const R={prime:{value:4.45,date:'2026-10-21'},primeAnnouncement:{value:4.7,effectiveDate:'2026-10-29',confirmed:true,sourceUrl:'https://td.mediaroom.com/'}};
 assert.equal(modes.officialPrime(R,'2026-10-28').value,4.45);
 assert.equal(modes.officialPrime(R,'2026-10-29').value,4.7);
 assert.equal(modes.officialPrime(R,'2026-10-30').value,4.7);
 assert.equal(modes.officialPrime({prime:{value:4.95,date:'2026-12-20'},primeAnnouncement:R.primeAnnouncement},'2026-12-21').value,4.95);
});
test('auto rate sync changes variable live mortgage and optional linked real estate but never payment',()=>{
 const marker='function applyRates() {',end='/* ---------------------------------------------------------------- finance engine';
 const fragment=core.slice(core.indexOf(marker),core.indexOf(end));
 assert.ok(fragment.includes("officialPrime(RATES)"));
 const S={rtype:'Variable',rateMode:'Live',adj:-.5,rate:3.95,pmt:2400,bal:450000,
   ecMortgage:{linkProperty:true},ec13:{calc:{rate:4.85}}};
 const RATES={prime:{value:4.45,date:'2026-10-21'}};
 let saves=0;
 const ctx={S,RATES,window:{ECMortgageModes:{officialPrime:()=>({value:4.7})}},save:()=>saves++,Number,Math};
 vm.runInNewContext(fragment,ctx);
 ctx.applyRates();
 assert.equal(S.rate,4.2);
 assert.equal(S.ec13.calc.rate,4.2);
 assert.equal(S.pmt,2400);
 assert.equal(saves,1);
 S.rateMode='Manual';S.rate=4.8;ctx.applyRates();assert.equal(S.rate,4.8);
 S.rateMode='Live';S.rtype='Fixed';ctx.applyRates();assert.equal(S.rate,4.8);
});
test('selected contract behaviour and property opt-in persist without silently changing mortgage payment',()=>{
 const listeners={},P={mortgage:()=>'<div>previous mortgage content</div>'};
 const S={rate:3.95,adj:-.5,rateMode:'Live',rtype:'Variable',bal:450000,pmt:2400,
   ec13:{calc:{rate:5.25}},fp:{mort:{amortYears:21}}};
 const env={window:{},S,P,ECMortgageModes:modes,save:()=>{},render:()=>{},
  document:{addEventListener:(n,f)=>listeners[n]=f},RATES:{prime:{value:4.45,date:'2026-10-21'},fetched:new Date().toISOString(),
    primeAnnouncement:{confirmed:true,value:4.7,effectiveDate:'2026-10-29',lender:'TD',sourceUrl:'https://td.mediaroom.com'}},
    Intl,Date,Number,Math,console};
 vm.runInNewContext(ui,env);
 const markup=P.mortgage();
 assert.match(markup,/Keep payment; amortization changes/);
 assert.match(markup,/Keep amortization; payment changes/);
 assert.match(markup,/21/);
 assert.match(markup,/previous mortgage content/);
 assert.match(markup,/not verified bank records/);
 listeners.click({target:{closest:()=>({dataset:{ecMMode:'adjustable-payment'}})}});
 assert.equal(S.ecMortgage.mode,'adjustable-payment');
 listeners.change({target:{dataset:{ecMInput:'property'},value:'on',checked:true}});
 assert.equal(S.ecMortgage.linkProperty,true);
 assert.equal(S.ec13.calc.rate,3.95);
 assert.equal(S.pmt,2400);
 listeners.change({target:{dataset:{ecMInput:'property'},value:'on',checked:false}});
 assert.equal(S.ecMortgage.linkProperty,false);
 assert.equal(S.ec13.calc.rate,5.25);
});
test('new scenario module leaves Home renderer and existing shortlist code unchanged',()=>{
 const index=read('index.html'),sw=read('sw.js');
 assert.doesNotMatch(ui,/V\.home\s*=|V\.homes\s*=/);
 assert.match(read('ec-v16-5.js'),/ONLY|Only the Real Estate shortlist|shortlist is enhanced/i);
 assert.ok(index.includes('ec-mortgage-modes.js?v=16.9'));
 assert.ok(index.includes('ec-mortgage-impact.js?v=16.9'));
 assert.ok(sw.includes('ec-mortgage-modes.js'));
 assert.ok(sw.includes('eq-v16-9-rate-integrity'));
});
