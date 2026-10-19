/* EquityClimb Financial Profile v8
   Targeted enhancement: Canadian tax/payroll estimates, rental income,
   mortgage renewal date, Canadian mortgage payments, and monthly cash flow. */
(() => {
  'use strict';

  const PROVINCES = {
    AB:'Alberta', BC:'British Columbia', MB:'Manitoba', NB:'New Brunswick',
    NL:'Newfoundland and Labrador', NS:'Nova Scotia', NT:'Northwest Territories',
    NU:'Nunavut', ON:'Ontario', PE:'Prince Edward Island', QC:'Quebec',
    SK:'Saskatchewan', YT:'Yukon'
  };
  const REGION_TO_CODE = Object.fromEntries(Object.entries(PROVINCES).map(([k,v]) => [v.toLowerCase(), k]));
  Object.assign(REGION_TO_CODE, {'alberta':'AB','british columbia':'BC','manitoba':'MB','new brunswick':'NB','newfoundland and labrador':'NL','nova scotia':'NS','northwest territories':'NT','nunavut':'NU','ontario':'ON','prince edward island':'PE','quebec':'QC','québec':'QC','saskatchewan':'SK','yukon':'YT'});

  // Annual values are isolated by tax year so a future year can be added without rewriting formulas.
  // Province tax is a bracket estimate; final payroll/return amounts depend on personal credits and benefits.
  const TAX_CONFIG = {
    2026: {
      federal: { bpa: 16452, brackets:[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[Infinity,.33]] },
      provinces: {
        AB:{bpa:22769,brackets:[[61200,.08],[154259,.10],[185111,.12],[246813,.13],[370220,.14],[Infinity,.15]]},
        BC:{bpa:13216,brackets:[[50363,.056],[100728,.077],[115648,.105],[140430,.1229],[190405,.147],[265545,.168],[Infinity,.205]]},
        MB:{bpa:15780,brackets:[[47564,.108],[101200,.1275],[Infinity,.174]]},
        NB:{bpa:13996,brackets:[[52333,.094],[104666,.14],[193861,.16],[Infinity,.195]]},
        NL:{bpa:11067,brackets:[[44678,.087],[89354,.145],[159528,.158],[223340,.178],[285319,.198],[570638,.208],[1141275,.213],[Infinity,.218]]},
        NS:{bpa:11932,brackets:[[30995,.0879],[61991,.1495],[97417,.1667],[157124,.175],[Infinity,.21]]},
        NT:{bpa:17842,brackets:[[53003,.059],[106009,.086],[172346,.122],[Infinity,.1405]]},
        NU:{bpa:19501,brackets:[[55801,.04],[111602,.07],[181439,.09],[Infinity,.115]]},
        ON:{bpa:12947,brackets:[[53891,.0505],[107785,.0915],[150000,.1116],[220000,.1216],[Infinity,.1316]]},
        PE:{bpa:14250,brackets:[[33928,.095],[65820,.1347],[106890,.166],[142520,.1762],[200000,.19],[Infinity,.20]]},
        QC:{bpa:18571,abatement:.165,brackets:[[54345,.14],[108680,.19],[132245,.24],[Infinity,.2575]]},
        SK:{bpa:19591,brackets:[[54532,.105],[155805,.125],[Infinity,.145]]},
        YT:{bpa:16452,brackets:[[58523,.064],[117045,.09],[181440,.109],[500000,.128],[Infinity,.15]]}
      },
      cpp:{exemption:3500,ympe:74600,yampe:85000,rate1:.0595,rate2:.04},
      qpp:{exemption:3500,ympe:74600,yampe:85000,rate1:.063,rate2:.04},
      ei:{max:68900,rate:.0163,qcRate:.0130}
    }
  };

  const safeNum = (v, fallback=0) => { const n=Number(v); return Number.isFinite(n) ? Math.max(0,n) : fallback; };
  const money = n => (Number.isFinite(+n) ? (+n).toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}) : '$0');
  const money2 = n => (Number.isFinite(+n) ? (+n).toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2}) : '$0.00');
  const currentYear = () => new Date().getFullYear();
  const supportedYear = () => TAX_CONFIG[currentYear()] ? currentYear() : Math.max(...Object.keys(TAX_CONFIG).map(Number));
  const regionCode = () => {
    const raw=String(S.financial?.province || S.profile.region || 'Alberta').trim();
    return PROVINCES[raw] ? raw : REGION_TO_CODE[raw.toLowerCase()] || 'AB';
  };
  const progressive = (income, brackets) => {
    let tax=0, lower=0;
    for (const [upper,rate] of brackets) {
      const slice=Math.max(0,Math.min(income,upper)-lower); tax+=slice*rate;
      if(income<=upper) break; lower=upper;
    }
    return Math.max(0,tax);
  };
  const marginalRate = (income, brackets) => (brackets.find(([u])=>income<=u)||brackets.at(-1))[1];

  function migrateFinancial() {
    const legacyProvince=regionCode();
    const legacyDate=normaliseFutureDate(S.maturity);
    const legacyNet=safeNum(S.income)*12;
    const estimatedLegacyGross=legacyNet ? Math.round(legacyNet/0.72/100)*100 : 0;
    const f=S.financial ||= {};
    f.taxYear ||= supportedYear();
    f.province ||= legacyProvince;
    f.salary = safeNum(f.salary, estimatedLegacyGross);
    f.bonus = safeNum(f.bonus);
    f.otherEmploymentIncome = safeNum(f.otherEmploymentIncome);
    f.actualTakeHomeAnnual = f.actualTakeHomeAnnual==='' ? '' : safeNum(f.actualTakeHomeAnnual);
    f.useActualTakeHome = Boolean(f.useActualTakeHome && safeNum(f.actualTakeHomeAnnual)>0);
    f.rental ||= {};
    f.rental.has = f.rental.has ?? (S.rentOn==='Yes');
    f.rental.grossMonthly = safeNum(f.rental.grossMonthly, safeNum(S.rent));
    f.rental.ownershipPct = Math.min(100,safeNum(f.rental.ownershipPct,100));
    f.rental.expensesMonthly = safeNum(f.rental.expensesMonthly);
    f.rental.actualNetMonthly = f.rental.actualNetMonthly==='' ? '' : safeNum(f.rental.actualNetMonthly);
    f.mortgage ||= {};
    f.mortgage.balance=safeNum(f.mortgage.balance,safeNum(S.bal));
    f.mortgage.rate=safeNum(f.mortgage.rate,safeNum(S.rate));
    f.mortgage.rateType=f.mortgage.rateType || S.rtype || 'Variable';
    f.mortgage.amortYears=Math.max(0,safeNum(f.mortgage.amortYears,25));
    f.mortgage.amortMonths=Math.min(11,safeNum(f.mortgage.amortMonths));
    f.mortgage.frequency=f.mortgage.frequency || 'Monthly';
    f.mortgage.renewalDate=f.mortgage.renewalDate || legacyDate || '';
    f.mortgage.actualPayment=f.mortgage.actualPayment==='' ? '' : safeNum(f.mortgage.actualPayment,safeNum(S.pmt));
    f.housingOther=safeNum(f.housingOther);
    syncLegacy(); save();
  }

  function normaliseFutureDate(value) {
    const s=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const d=new Date(s+'T12:00:00');
      if(!Number.isNaN(d.getTime()) && d.getFullYear()>=currentYear()-1) return s;
    }
    return '';
  }

  function employmentEstimate() {
    const f=S.financial, year=TAX_CONFIG[f.taxYear] ? f.taxYear : supportedYear(), cfg=TAX_CONFIG[year];
    const province=regionCode(), pc=cfg.provinces[province]||cfg.provinces.AB;
    const gross=safeNum(f.salary)+safeNum(f.bonus)+safeNum(f.otherEmploymentIncome);
    const plan=province==='QC'?cfg.qpp:cfg.cpp;
    const pension1=Math.min(Math.max(gross-plan.exemption,0),plan.ympe-plan.exemption)*plan.rate1;
    const pension2=Math.min(Math.max(gross-plan.ympe,0),plan.yampe-plan.ympe)*plan.rate2;
    const pension=pension1+pension2;
    const ei=Math.min(gross,cfg.ei.max)*(province==='QC'?cfg.ei.qcRate:cfg.ei.rate);
    let federal=progressive(gross,cfg.federal.brackets);
    const fedCreditRate=cfg.federal.brackets[0][1];
    federal=Math.max(0,federal-(cfg.federal.bpa+pension+ei)*fedCreditRate);
    if(province==='QC') federal*=1-(pc.abatement||0);
    let provincial=progressive(gross,pc.brackets);
    provincial=Math.max(0,provincial-(pc.bpa+pension+ei)*pc.brackets[0][1]);
    const taxes=federal+provincial,total=taxes+pension+ei,net=Math.max(0,gross-total);
    return {year,province,gross,federal,provincial,pension,ei,taxes,total,net,monthly:net/12,effective:gross?total/gross*100:0,marginal:(marginalRate(gross,cfg.federal.brackets)+marginalRate(gross,pc.brackets))*100};
  }

  const RENT_FREQ={Monthly:12,'Semi-monthly':24,'Bi-weekly':26,'Accelerated bi-weekly':26,Weekly:52,'Accelerated weekly':52};
  function mortgageEstimate() {
    const m=S.financial.mortgage,P=safeNum(m.balance),annual=safeNum(m.rate)/100,years=safeNum(m.amortYears)+safeNum(m.amortMonths)/12;
    if(!P||!years) return {payment:0,monthly:0,frequency:m.frequency};
    const monthlyRate=m.rateType==='Fixed'?Math.pow(1+annual/2,1/6)-1:annual/12;
    const nMonths=Math.max(1,Math.round(years*12));
    const monthly=monthlyRate?P*monthlyRate/(1-Math.pow(1+monthlyRate,-nMonths)):P/nMonths;
    let paymentValue=monthly;
    if(m.frequency==='Semi-monthly') paymentValue=monthly/2;
    else if(m.frequency==='Bi-weekly') { const r=m.rateType==='Fixed'?Math.pow(1+annual/2,2/26)-1:annual/26; const n=Math.max(1,Math.round(years*26)); paymentValue=r?P*r/(1-Math.pow(1+r,-n)):P/n; }
    else if(m.frequency==='Weekly') { const r=m.rateType==='Fixed'?Math.pow(1+annual/2,2/52)-1:annual/52; const n=Math.max(1,Math.round(years*52)); paymentValue=r?P*r/(1-Math.pow(1+r,-n)):P/n; }
    else if(m.frequency==='Accelerated bi-weekly') paymentValue=monthly/2;
    else if(m.frequency==='Accelerated weekly') paymentValue=monthly/4;
    return {payment:paymentValue,monthly:paymentValue*(RENT_FREQ[m.frequency]||12)/12,frequency:m.frequency};
  }

  function rentalNet() {
    const r=S.financial.rental;if(!r.has)return {gross:0,estimated:0,used:0,actual:false};
    const gross=safeNum(r.grossMonthly)*Math.min(100,safeNum(r.ownershipPct))/100;
    const estimated=Math.max(0,gross-safeNum(r.expensesMonthly));
    const hasActual=r.actualNetMonthly!=='' && Number.isFinite(+r.actualNetMonthly);
    return {gross,estimated,used:hasActual?safeNum(r.actualNetMonthly):estimated,actual:hasActual};
  }
  function chosenEmploymentMonthly(){const e=employmentEstimate(),f=S.financial;return f.useActualTakeHome&&safeNum(f.actualTakeHomeAnnual)>0?safeNum(f.actualTakeHomeAnnual)/12:e.monthly;}
  function chosenMortgageMonthly(){const m=S.financial.mortgage,est=mortgageEstimate();return m.actualPayment!==''&&safeNum(m.actualPayment)>0?safeNum(m.actualPayment)*(RENT_FREQ[m.frequency]||12)/12:est.monthly;}
  function flow(){const emp=chosenEmploymentMonthly(),rent=rentalNet().used,mort=chosenMortgageMonthly(),other=Math.max(0,spendTotal()-safeNum(S.spend.Housing)),housingOther=safeNum(S.financial.housingOther);return {emp,rent,mort,housingOther,other,remaining:emp+rent-mort-housingOther-other};}

  function syncLegacy(){
    const f=S.financial,e=employmentEstimate(),r=rentalNet(),m=mortgageEstimate();
    S.profile.region=PROVINCES[regionCode()];
    S.income=chosenEmploymentMonthly(); S.otherInc=r.used; S.rentOn='No';
    S.mtr=e.marginal; S.bal=f.mortgage.balance; S.rate=f.mortgage.rate; S.rtype=f.mortgage.rateType;
    S.maturity=f.mortgage.renewalDate||''; S.pmt=chosenMortgageMonthly();
    // Existing Housing budget becomes mortgage + other housing, but cash-flow replaces it once.
    S.spend.Housing=S.pmt+safeNum(f.housingOther);
  }

  function fpSet(path,value,type='number'){
    let obj=S.financial,parts=path.split('.');while(parts.length>1)obj=obj[parts.shift()];
    if(type==='number') value=safeNum(value); if(type==='optional') value=value===''?'':safeNum(value);
    obj[parts[0]]=value;syncLegacy();save();render();
  }
  window.fpSet=fpSet;
  window.fpToggle=(path,yes)=>fpSet(path,yes,'bool');

  const input=(path,label,value,hint='',opts={})=>`<div class="fp-field"><label>${label}</label><input type="${opts.type||'number'}" ${opts.type==='date'?'':'min="0"'} ${opts.max!=null?`max="${opts.max}"`:''} step="${opts.step||'any'}" value="${esc(value??'')}" onchange="fpSet('${path}',this.value,'${opts.optional?'optional':opts.type==='date'?'date':'number'}')">${hint?`<div class="hint">${hint}</div>`:''}</div>`;
  const select=(path,label,value,options,hint='')=>`<div class="fp-field"><label>${label}</label><select onchange="fpSet('${path}',this.value,'text')">${options.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
  const result=(label,value,tag='Estimated')=>`<div class="fp-result"><div><span>${esc(label)}</span><small>${esc(tag)}</small></div><b>${value}</b></div>`;
  function renewalWarning(){const v=S.financial.mortgage.renewalDate;if(!v)return '<div class="fp-warning">Renewal date is incomplete.</div>';const d=new Date(v+'T23:59:59');if(Number.isNaN(d.getTime()))return '<div class="fp-warning">Enter a valid renewal date.</div>';if(d<new Date())return '<div class="fp-warning">This date has passed. Confirm whether the mortgage has already renewed.</div>';const months=Math.max(0,Math.ceil((d-new Date())/2629800000));return `<div class="fp-ok">Renews ${d.toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})} · about ${months} months away</div>`;}

  P.numbers=()=>{
    const f=S.financial,e=employmentEstimate(),r=rentalNet(),m=mortgageEstimate(),cf=flow(),pc=regionCode();
    const actualMortgage=f.mortgage.actualPayment!==''&&safeNum(f.mortgage.actualPayment)>0;
    return `<div class="fp-intro"><div><div class="eyebrow">Financial profile</div><h2>Simple inputs. Canadian calculations.</h2></div><span class="tag warn">Estimates only</span></div>
    <div class="fp-stack">
      <section class="card fp-section"><div class="fp-heading"><div><span>1</span><div><h2>Employment income</h2><p>Enter annual amounts before tax.</p></div></div></div>
        <div class="fp-grid">${select('province','Province or territory of residence',pc,Object.entries(PROVINCES))}${input('salary','Annual gross base salary',f.salary,'Before income tax, CPP/QPP and EI.')}${input('bonus','Expected annual bonus',f.bonus,'Keep bonus separate from salary.')}${input('otherEmploymentIncome','Other taxable employment income',f.otherEmploymentIncome,'Optional. Do not include rental income.')}</div>
        <div class="fp-total"><span>Total estimated gross employment income</span><b>${money(e.gross)}</b></div>
      </section>
      <section class="card fp-section"><div class="fp-heading"><div><span>2</span><div><h2>Taxes & take-home pay</h2><p>Progressive ${e.year} estimate for ${PROVINCES[e.province]}.</p></div></div><span class="tag">Calculated by EquityClimb</span></div>
        <div class="fp-results">${result('Gross annual income',money(e.gross))}${result('Federal income tax',money(e.federal))}${result(`${PROVINCES[e.province]} income tax`,money(e.provincial))}${result(e.province==='QC'?'QPP':'CPP',money(e.pension))}${result('EI',money(e.ei))}${result('Total deductions',money(e.total))}${result('Annual take-home',money(e.net))}${result('Monthly take-home',money(e.monthly))}${result('Effective deduction rate',pct(e.effective,1))}</div>
        <div class="fp-override"><label class="fp-check"><input type="checkbox" ${f.useActualTakeHome?'checked':''} onchange="fpSet('useActualTakeHome',this.checked,'bool')"> I know my actual take-home pay</label>${f.useActualTakeHome?input('actualTakeHomeAnnual','Actual annual take-home income',f.actualTakeHomeAnnual,'This value will be used for cash flow. The estimate remains visible.',{optional:true}):''}</div>
      </section>
      <section class="card fp-section"><div class="fp-heading"><div><span>3</span><div><h2>Rental income</h2><p>Gross rent is not automatically treated as disposable income.</p></div></div></div>
        <label>Do you currently receive rental income?</label><div class="seg"><button class="${!f.rental.has?'on':''}" onclick="fpSet('rental.has',false,'bool')">No</button><button class="${f.rental.has?'on':''}" onclick="fpSet('rental.has',true,'bool')">Yes</button></div>
        ${f.rental.has?`<div class="fp-grid">${input('rental.grossMonthly','Gross monthly rental income',f.rental.grossMonthly)}${input('rental.ownershipPct','Your ownership percentage',f.rental.ownershipPct,'Between 0% and 100%.',{max:100})}${input('rental.expensesMonthly','Monthly rental-property expenses',f.rental.expensesMonthly,'Optional.',{optional:true})}${input('rental.actualNetMonthly','Actual monthly net rental income',f.rental.actualNetMonthly,'Optional. If provided, this takes priority.',{optional:true})}</div><div class="fp-results">${result('Attributed gross rent',money(r.gross),'Estimated')}${result('Net rent used in cash flow',money(r.used),r.actual?'Actual':'Estimated')}</div>`:'<div class="hint">Rental fields remain hidden until Yes is selected.</div>'}
      </section>
      <section class="card fp-section"><div class="fp-heading"><div><span>4</span><div><h2>Mortgage</h2><p>Canadian payment estimate with semi-annual compounding for fixed rates.</p></div></div></div>
        <div class="fp-grid">${input('mortgage.balance','Current mortgage balance',f.mortgage.balance)}${input('mortgage.rate','Current mortgage interest rate (%)',f.mortgage.rate,'Enter 4.45 for 4.45%.',{step:.01})}${select('mortgage.rateType','Fixed or variable',f.mortgage.rateType,[['Fixed','Fixed'],['Variable','Variable']])}${input('mortgage.amortYears','Remaining amortisation - years',f.mortgage.amortYears)}${input('mortgage.amortMonths','Additional months',f.mortgage.amortMonths,'0 to 11 months.',{max:11})}${select('mortgage.frequency','Payment frequency',f.mortgage.frequency,['Monthly','Semi-monthly','Bi-weekly','Accelerated bi-weekly','Weekly','Accelerated weekly'].map(x=>[x,x]))}${input('mortgage.renewalDate','When does your current mortgage term end / renew?',f.mortgage.renewalDate,'Use the date shown in your mortgage documents.',{type:'date'})}${input('mortgage.actualPayment','Actual current mortgage payment',f.mortgage.actualPayment,'Optional. Enter the amount for the selected frequency.',{optional:true})}</div>
        ${renewalWarning()}<div class="fp-results">${result('EquityClimb estimated payment',money2(m.payment),m.frequency)}${actualMortgage?result('Actual mortgage payment',money2(f.mortgage.actualPayment),'Actual · '+f.mortgage.frequency):''}${result('Monthly amount used in cash flow',money(chosenMortgageMonthly()),actualMortgage?'Actual converted monthly':'Estimated converted monthly')}</div>
      </section>
      <section class="card fp-section"><div class="fp-heading"><div><span>5</span><div><h2>Monthly cash flow</h2><p>Actual values take priority. Estimates are never added twice.</p></div></div></div>
        ${input('housingOther','Other monthly housing costs',f.housingOther,'Property tax, condo fees, insurance and utilities not already in another budget category.',{optional:true})}
        <div class="fp-cash">${result('Employment take-home',money(cf.emp),f.useActualTakeHome?'Actual':'Estimated')}${result('Net rental income',money(cf.rent),r.actual?'Actual':r.used?'Estimated':'None')}${result('Mortgage payment',`−${money(cf.mort)}`,actualMortgage?'Actual':'Estimated')}${result('Other housing costs',`−${money(cf.housingOther)}`)}${result('Other monthly expenses',`−${money(cf.other)}`)}<div class="fp-remaining"><span>Estimated monthly remaining cash flow</span><b class="${cf.remaining<0?'neg':'pos'}">${money(cf.remaining)}</b></div></div>
      </section>
    </div>`;
  };

  P.budget=()=>{const cf=flow(),inc=cf.emp+cf.rent,total=cf.mort+cf.housingOther+cf.other;return `<div class="grid g2"><section class="card"><h2>Household cash flow</h2><div class="fp-results">${result('Employment take-home',money(cf.emp),S.financial.useActualTakeHome?'Actual':'Estimated')}${result('Net rental income',money(cf.rent),rentalNet().actual?'Actual':'Estimated')}${result('Mortgage',`−${money(cf.mort)}`)}${result('Other housing',`−${money(cf.housingOther)}`)}${result('Other expenses',`−${money(cf.other)}`)}</div><div class="fp-remaining"><span>Monthly remaining cash flow</span><b class="${cf.remaining<0?'neg':'pos'}">${money(cf.remaining)}</b></div></section><section class="card"><h2>Other monthly expenses</h2><div class="small mute">Mortgage and other housing costs are calculated separately to prevent double-counting.</div><table>${Object.keys(S.spend).filter(k=>k!=='Housing').map(k=>`<tr><td>${esc(k)}</td><td><input type="number" min="0" value="${safeNum(S.spend[k])}" onchange="S.spend['${k}']=Math.max(0,+this.value||0);save();render()"></td></tr>`).join('')}</table></section></div>`};

  const oldOnboard=V.onboard;
  V.onboard=()=>{if(ob!==3)return oldOnboard();const f=S.financial,e=employmentEstimate();return `<div class="ob">${`<div class="dots"><i class="on"></i><i class="on"></i><i class="on"></i></div>`}${head('Step 3 of 3','Your income and mortgage','Enter rough figures now. EquityClimb will calculate taxes and payments automatically.')}<div class="card"><div class="fp-grid">${select('province','Province or territory',regionCode(),Object.entries(PROVINCES))}${input('salary','Annual salary before tax',f.salary,'Gross salary before deductions.')}${input('bonus','Expected annual bonus',f.bonus)}${input('mortgage.balance','Current mortgage balance',f.mortgage.balance)}${input('mortgage.rate','Mortgage interest rate (%)',f.mortgage.rate,'Enter 4.45 for 4.45%.',{step:.01})}${input('mortgage.amortYears','Remaining amortisation - years',f.mortgage.amortYears)}${input('mortgage.renewalDate','When does your mortgage term renew?',f.mortgage.renewalDate,'Choose the full date.',{type:'date'})}</div><div class="fp-total"><span>Estimated monthly take-home</span><b>${money(e.monthly)}</b></div><div class="row" style="margin-top:20px;justify-content:space-between"><button class="btn ghost" onclick="ob=2;render()">Back</button><button class="btn" onclick="finishOb()">Open my dashboard</button></div></div></div>`};

  // Migration and initial redraw. Existing navigation/news/APIs remain untouched.
  migrateFinancial();
  setTimeout(()=>{syncLegacy();save();render();},0);
})();
