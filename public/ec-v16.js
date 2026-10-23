/* EquityClimb v16 — connected planning, first-class Canadian homebuying,
   clean rates, user-owned real estate shortlist, customizable mobile, privacy-first settings.
   No commercial feed enabled and no real property images/records fabricated. */
(() => {
 'use strict';
 if(window.__ec16 || typeof V==='undefined' || typeof S==='undefined'||!window.ECMoney)return;
 window.__ec16=true;
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const N=(v,d=0)=>Number.isFinite(Number(v))&&v!==''&&v!=null?Number(v):d;
 const CAD=v=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(N(v));
 const st=S.ec16=(S.ec16&&typeof S.ec16==='object'&&!Array.isArray(S.ec16))?S.ec16:{};
 if(!Array.isArray(st.pins))st.pins=['budget','homes','advisor','goals'];
 if(!st.landing)st.landing='home';
 if(st.fhsaSaved===undefined)st.fhsaSaved=0;
 if(st.fhsaMonthly===undefined)st.fhsaMonthly=300;
 if(st.reserve===undefined)st.reserve=5000;
 if(st.ratio===undefined)st.ratio=30;
 if(st.targetPrice===undefined)st.targetPrice=600000;
 if(st.renewNotice===undefined)st.renewNotice=true;
 if(st.localAlerts===undefined)st.localAlerts=true;
 const persist=()=>{try{save();}catch(e){console.warn('Saving preferences unavailable',e);}};
 const MODEL=()=>{try{return typeof window.ECModel==='function'?window.ECModel():null;}catch(_){return null;}};
 const routes={home:['Home','home'],budget:['Budget','wallet'],debt:['Mortgage','debt'],wealth:['Investing','market'],goals:['Goals','goal'],homes:['Real Estate','house'],journey:['Buying guide','check'],learn:['Learn','book'],advisor:['AI Copilot','ai'],areas:['Neighbourhoods','map'],market:['Markets','market'],readiness:['Home readiness','house'],canada:['Canadian toolkit','plan'],report:['My financial report','plan']};
 const provinceCodes={'Alberta':'AB','British Columbia':'BC','Ontario':'ON','Quebec':'QC','Québec':'QC','Manitoba':'MB','Saskatchewan':'SK','Nova Scotia':'NS','New Brunswick':'NB','Newfoundland and Labrador':'NL','Prince Edward Island':'PE','Northwest Territories':'NT','Nunavut':'NU','Yukon':'YT'};
 const getProvince=()=> { const c=String(S.fp?.income?.province||S.profile?.region||'AB');return provinceCodes[c]||c.toUpperCase().slice(0,2); };
 const provGuides={
   AB:['Alberta','https://www.alberta.ca/land-titles-overview','Land Titles registration fees (transfer and mortgage registration)'],
   BC:['British Columbia','https://www2.gov.bc.ca/gov/content/taxes/property-taxes/property-transfer-tax','Property Transfer Tax and potential exemptions'],
   ON:['Ontario','https://www.ontario.ca/document/land-transfer-tax','Land Transfer Tax, rebates and possible municipal tax'],
   QC:['Quebec','https://www.quebec.ca/en/housing-territory/buying-selling-property','Municipal transfer duties and notary fees'],
   MB:['Manitoba','https://www.gov.mb.ca/finance/taxation/taxes/landtransfer.html','Land transfer tax and registration'],
   SK:['Saskatchewan','https://www.saskregistries.ca/','Land title registration'],
   NS:['Nova Scotia','https://novascotia.ca/sns/access/land/property-online.asp','Municipal deed transfer tax'],
   NB:['New Brunswick','https://www2.snb.ca/content/snb/en/sites/land-registry.html','Real Property Transfer Tax'],
   NL:['Newfoundland and Labrador','https://www.gov.nl.ca/dgsnl/registries/deeds/','Registration and legal fees'],
   PE:['Prince Edward Island','https://www.princeedwardisland.ca/en/information/finance/real-property-transfer-tax','Real Property Transfer Tax'],
   NT:['Northwest Territories','https://www.justice.gov.nt.ca/en/land-titles/','Land Titles registration'],
   NU:['Nunavut','https://www.gov.nu.ca/en/justice','Local registration / land tenure rules'],
   YT:['Yukon','https://yukon.ca/en/housing-and-property/land-and-property','Land Titles and registration']};
 const province=()=>provGuides[getProvince()]||provGuides.AB;
 const monthModel=(price,down,rate=5,other={})=>ECMoney.ownership({price,down,rate,years:25,tax:310,insurance:135,utilities:190,maintenancePct:1,closingPct:1.5,...other});
 const userCalc=()=>{const c=S.ec13?.calc||{};return ECMoney.ownership({...c,netIncome:N(MODEL()?.income),nonHousing:Math.max(0,N(MODEL()?.essentials)+N(MODEL()?.lifestyle)+N(MODEL()?.debt)+N(MODEL()?.savings)-N(S.budget?.essentials?.housing)),cash:N(S.cash)});};
 const header=(kicker,title,subtitle)=>`<div class="ec16-page-head"><div class="ec16-label">${E(kicker)}</div><h1>${E(title)}</h1><p>${E(subtitle)}</p></div>`;
 const info=(message)=>`<div class="ec16-plain-note">${message}</div>`;
 const btn=(id,label)=>`<button type="button" class="ec16-soft-button" onclick="go('${id}')">${E(label)} <span aria-hidden="true">↗</span></button>`;
 function savedUpgrades(){const saved=(S.ec13?.homes?.saved||[]).filter(x=>x.manual),c=S.ec13?.calc||{};
   if(!saved.length)return `<section class="ec16-inline-callout"><h3>Make a comparison from your real search.</h3><p>Paste your own asking prices into My shortlist. You can compare monthly ownership, upfront cash and rate risks without connecting MLS.</p>${btn('readiness','Check my budget first')}</section>`;
   const rows=saved.slice(0,4).map(item=>{const price=N(item.price),down=Math.min(price,N(c.down,price*.2)),o=monthModel(price,down,N(c.rate,5),{years:N(c.years,25),tax:N(c.tax,310),insurance:N(c.insurance,135),utilities:N(c.utilities,190),condo:N(c.condo),maintenancePct:N(c.maintenancePct,1),closingPct:N(c.closingPct,1.5),closingExtra:N(c.closingExtra)}),shock=monthModel(price,down,N(c.rate,5)+2,{years:N(c.years,25)});
     return `<tr><th scope="row">${E(item.address)}</th><td>${CAD(price)}</td><td>${CAD(o.total)}</td><td>${CAD(o.upfront)}</td><td>+${CAD(Math.max(0,shock.total-o.total))}</td></tr>`;});
   return `<section class="card ec16-compare"><div class="ec16-section-head"><div><div class="ec16-label">OWNERSHIP INTELLIGENCE</div><h2>Side-by-side decision overview</h2><p>Same assumptions, user-entered properties only; figures update with your Decision Lab.</p></div>${btn('readiness','Home readiness')}</div>
   <div class="ec16-scroll"><table><thead><tr><th scope="col">Property</th><th scope="col">Asking price</th><th scope="col">Est. monthly</th><th scope="col">Upfront cash</th><th scope="col">Rate +2%*</th></tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="small mute">*Illustrative payment change, not a renewal or qualification offer. Provincial fees may be missing. Check the assumptions in Decision Lab.</p></section>`;}
 const oldHomes=V.homes;
 V.homes=function(){const t=document.createElement('template');t.innerHTML=oldHomes.apply(this,arguments);const root=t.content;
   const s=root.querySelector('.ec154-feed');if(s){const d=document.createElement('details');d.className='ec16-feed-details';d.innerHTML=`<summary>Live MLS listings not connected · Financial planning works without MLS</summary>`;s.replaceWith(d);d.append(s);}
   const tabs=root.querySelector('.ec13-tabs');if(tabs){const b=document.createElement('div');b.className='ec16-homes-tools';b.innerHTML=`${btn('readiness','Home readiness')}${btn('canada','Canadian buying costs')}${btn('report','My financial report')}`;tabs.before(b);}
   const saved=root.querySelector('.ec13-saved');if(saved){const b=document.createElement('div');b.innerHTML=savedUpgrades();saved.after(b);}
   const lab=root.querySelector('.ec13-lab');if(lab){
     const o=userCalc();const n=document.createElement('div');n.className='ec16-lab-summary';n.innerHTML=`<div class="ec16-label">CANADIAN MORTGAGE RULES · SCENARIO CHECK</div><div class="ec16-lab-facts">
       <div><span>Minimum down payment</span><b>${CAD(o.minimumDown)}</b></div><div><span>Estimated financed default insurance</span><b>${CAD(o.insurancePremium)}</b></div><div><span>Illustrative stress-test rate</span><b>${ECMoney.qualifyingRate(o.rate).toFixed(2)}%</b></div>
       <div><span>Cash buffer after closing</span><b>${CAD(o.cashAfterClosing)}</b></div></div>
       ${o.insuranceNeedsReview||!o.downPaymentValid?'<p class="ec16-risk">⚠ Standard eligibility or insurance premium needs review; the estimated payment can understate the true cost.</p>':''}
       <p class="small mute">The qualifying rate is informational, not a pre-approval. Income, debt and lender policy affect eligibility. Provincial transfer taxes and some mortgage-insurance taxes must be entered manually.</p>`;
     lab.prepend(n);
   }
   const wrap=document.createElement('div');wrap.append(root);return wrap.innerHTML;
 };
 function estimatedReadiness(){const m=MODEL(),income=Math.max(0,N(m?.income)),nonhousing=Math.max(0,N(m?.essentials)-N(S.budget?.essentials?.housing)+N(m?.lifestyle)+N(m?.debt)+N(m?.savings)),room=Math.max(0,income-nonhousing);
   const safe=room*N(st.ratio,30)/100,down=Math.max(0,N(S.cash)+N(st.fhsaSaved)-N(st.reserve));
   const comfort=ECMoney.affordableRange({availableMonthly:safe,down:Math.max(0,N(S.cash)+N(st.fhsaSaved)),reserve:N(st.reserve),rate:N(S.ec13?.calc?.rate,5),years:25,tax:310,insurance:135,utilities:190,maintenancePct:1,closingPct:1.5});
   const cost=monthModel(N(st.targetPrice),Math.max(down,N(st.targetPrice)*.05),N(S.ec13?.calc?.rate,5));
   return {income,nonhousing,room,safe,down,cost,comfort,m};
 }
 function readinessView(){const a=estimatedReadiness(),target=N(st.targetPrice),needed=ECMoney.minimumDown(target)+target*.015,short=Math.max(0,needed-a.down),months=N(st.fhsaMonthly)>0?Math.ceil(short/N(st.fhsaMonthly)):null;
   const ratio=a.income?a.cost.total/a.income*100:0;
   return `${header('HOME READINESS','What home could fit your life?','A planning guide that connects your budget, accessible savings and Canadian mortgage assumptions.')}
     <section class="ec16-intro-grid"><article class="card ec16-highlight"><span class="ec16-label">MONTHLY CASH FLOW</span><div class="ec16-hero-number">${CAD(a.room)}<small>/mo</small></div><p>Remaining after your recorded non-housing expenses and planned saving. Review any existing mortgage or rental obligations before assuming a replacement purchase.</p><div class="ec16-comfort">${a.comfort.maxPrice?`Illustrative comfort-price ceiling: <b>${CAD(a.comfort.maxPrice)}</b>`:'No comfort-price estimate from current inputs.'}</div>${btn('budget','Review my budget')}</article>
       <article class="card ec16-highlight"><span class="ec16-label">AVAILABLE DOWN PAYMENT</span><div class="ec16-hero-number">${CAD(a.down)}</div><p>Cash plus separately entered FHSA savings, less your protected reserve. Do not count FHSA money twice if it is already included in cash. Verify eligibility and withdrawal limits.</p>${btn('canada','Explore Canadian programs')}</article></section>
     <section class="ec16-two"><article class="card"><div class="ec16-label">CHANGE THE ASSUMPTIONS</div><h2>Your homebuying plan</h2>
       <label class="ec16-control"><span>Illustrative home price</span><input type="number" min="0" max="20000000" step="5000" value="${E(target)}" onchange="EC16.field('targetPrice',this.value)"></label>
       <label class="ec16-control"><span>FHSA savings available for a home</span><input type="number" min="0" max="1000000" value="${E(st.fhsaSaved)}" onchange="EC16.field('fhsaSaved',this.value)"></label>
       <label class="ec16-control"><span>Emergency cash to keep untouched</span><input type="number" min="0" max="2000000" value="${E(st.reserve)}" onchange="EC16.field('reserve',this.value)"></label>
       <label class="ec16-control"><span>Monthly additional home savings</span><input type="number" min="0" max="100000" value="${E(st.fhsaMonthly)}" onchange="EC16.field('fhsaMonthly',this.value)"></label>
       <label class="ec16-control"><span>Share of remaining monthly cash you want for housing (%)</span><input type="range" min="10" max="100" step="5" value="${E(st.ratio)}" oninput="document.getElementById('ec16-range-label').textContent=this.value+'%'" onchange="EC16.field('ratio',this.value)"><strong id="ec16-range-label">${E(st.ratio)}%</strong></label>
     </article><article class="card ec16-outcomes"><div class="ec16-label">YOUR TARGET · EDUCATIONAL ONLY</div><h2>Could a ${CAD(target)} home fit?</h2>
       <div class="ec16-large-stats"><div><span>Minimum down payment</span><strong>${CAD(ECMoney.minimumDown(target))}</strong></div><div><span>Estimated monthly ownership</span><strong>${CAD(a.cost.total)}</strong></div><div><span>Estimated upfront cash target*</span><strong>${CAD(needed)}</strong></div><div><span>Remaining savings needed</span><strong>${CAD(short)}</strong></div></div>
       <div class="ec16-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,needed?Math.round(a.down/needed*100):0)}"><i style="width:${Math.min(100,needed?a.down/needed*100:0)}%"></i></div><p>${short?`At ${CAD(st.fhsaMonthly)} extra savings/month, the simplified savings target is ${months===null?'not reachable without contributions':`approximately ${months} months away`}.`:'Your entered accessible cash reaches this illustrative upfront target.'}</p>
       <p class="ec16-risk">${ratio>100?'Estimated housing cost exceeds entered take-home income.':a.income?`Illustrative ownership cost uses ${ratio.toFixed(0)}% of take-home income — not a lending eligibility ratio.`:'Complete your income and budget for a meaningful affordability review.'}</p>
       <button class="btn" onclick="EC16.readinessToLab()">Refine in Decision Lab →</button>
       <p class="small mute">*Down payment plus 1.5% illustrative closing allowance. Your province, new-build tax, mortgage-insurance taxes and professional fees can change the total. The default insurance estimate applies only to eligible insured mortgages.</p>
     </article></section>
     <section class="card ec16-education"><h2>Financial comfort isn't mortgage approval.</h2><p>EquityClimb compares your estimated costs to your chosen household spending plan. Lenders additionally verify income, credit, debts, down payment, debt-service ratios, property value and an applicable qualifying rate. For uninsured federally regulated mortgages, the stress-test rule is generally the higher of 5.25% or the contract rate plus 2 percentage points, subject to exceptions.</p>
      <div class="ec16-actions">${btn('homes','Explore real estate')}${btn('journey','View homebuying checklist')}${btn('report','Financial overview')}</div></section>`;
 }
 function canadaView(){const p=province();return `${header('CANADIAN FINANCIAL TOOLKIT','Plan with Canadian rules.','A practical starting point for registered accounts, mortgage rules and province-specific homebuying considerations.')}
   <section class="ec16-tools-grid"><article class="card ec16-tool"><div class="ec16-label">FHSA</div><h2>Save for a first home</h2><p>Annual participation room generally starts at <strong>$8,000</strong> when first opened, subject to carryforward and a <strong>$40,000</strong> lifetime contribution limit. Eligibility, timing and qualifying withdrawals matter.</p><a href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html" target="_blank" rel="noopener">Read CRA FHSA guidance ↗</a></article>
    <article class="card ec16-tool"><div class="ec16-label">TFSA + RRSP</div><h2>Know your actual room</h2><p>Use the CRA amounts for your own TFSA and RRSP accounts. Tax deductions, carryforward, age, prior withdrawals and pension adjustments may change available room. EquityClimb never assumes everyone's room is identical.</p><a href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account.html" target="_blank" rel="noopener">CRA TFSA ↗</a><a href="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans.html" target="_blank" rel="noopener">CRA RRSP ↗</a></article>
    <article class="card ec16-tool"><div class="ec16-label">MORTGAGE INSURANCE</div><h2>Plan for more than the payment</h2><p>For eligible owner-occupied homes below $1.5 million, federal minimum down-payment rules start at 5% of the first $500,000 and 10% of the remainder. Standard default-insurance premiums may be financed but sales tax on the premium in some provinces cannot.</p><a href="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/down-payment.html" target="_blank" rel="noopener">Minimum down payment ↗</a><a href="https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/premium-information-for-homeowner-and-small-rental-loans" target="_blank" rel="noopener">CMHC premium tables ↗</a></article>
    <article class="card ec16-tool"><div class="ec16-label">FIRST-TIME BUYER BENEFITS</div><h2>Explore new-home tax relief</h2><p>Eligible first-time homebuyers may qualify for federal GST/HST rebates on new or substantially renovated homes. Benefits depend on dates, home value, residency and other criteria. We do not automatically deduct a rebate from purchase costs.</p><a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/gst-hst-rebates/first-time-home-buyers-gst-hst-rebate.html" target="_blank" rel="noopener">Read CRA eligibility ↗</a></article></section>
   <section class="card ec16-province"><div class="ec16-label">PROVINCE-SPECIFIC PURCHASE COSTS</div><h2>${E(p[0])} homebuying checklist</h2><p>Review <b>${E(p[2])}</b>, property taxes, inspection, survey/condo-document fees, title insurance, legal fees, land transfer or registration charges, and any tax on new construction or mortgage insurance. The editable Decision Lab includes an extra closing-cost field for amounts that vary by region.</p>
     <div class="ec16-actions"><a class="ec16-soft-button" href="${E(p[1])}" target="_blank" rel="noopener">Provincial reference ↗</a>${btn('profile','Change my province')}${btn('homes','Open Decision Lab')}</div></section>
   ${info('These are general educational rules, not live lender rates, personalized contribution limits, provincial tax quotes or legal advice. Verify your situation and current program rules directly with CRA, CMHC, your province and a qualified professional.')}`;
 }
 const notice=()=>{const out=[];if(st.renewNotice&&S.maturity){const d=new Date(S.maturity+'T12:00:00'),months=(d-Date.now())/864e5/30.4;if(Number.isFinite(months)&&months>=0&&months<=6)out.push({h:'Mortgage renewal approaching',body:`Your saved renewal date is ${E(S.maturity)}. Compare renewal scenarios and lender offers early.`,to:'debt'});}
   if(st.localAlerts&&st.primeAlert&&N(RATES?.prime?.value,-1)>=N(st.primeAlert))out.push({h:'Prime threshold reached',body:'A locally checked saved rate meets the alert level. Verify the rate at the source before acting.',to:'market'});
   const m=MODEL();if(m&&N(m.income)>0&&N(m.unallocated)<0)out.push({h:'Monthly spending needs review',body:'Your entered spending and savings plans exceed the income estimate.',to:'budget'});
   return out;};
 function alerts(){const list=notice();return list.length?`<div class="ec16-notices" role="status">${list.slice(0,3).map(n=>`<div><strong>${E(n.h)}</strong><p>${n.body}</p>${btn(n.to,'Review')}</div>`).join('')}</div>`:'';}
 function homeIntelligence(){const m=MODEL();if(!m)return '';
   const surplus=N(m.unallocated),runway=N(m.emergencyMonths),saved=(S.ec13?.homes?.saved||[]).filter(x=>x.manual).length;
   const top=N(m.income)<=0?['Add your income to see accurate insights','Complete your income profile before treating cash-flow estimates as meaningful.','profile']:surplus<0?['Review your cash flow','Your recorded expenses and planned savings exceed your income estimate.','budget']:
        runway<3?['Strengthen your emergency cushion','Start with a cash reserve before taking on a larger monthly obligation.','goals']:
        ['Know your next move','Connect your spending plan to the home, savings and investment goals that matter.','readiness'];
   return `<section class="ec16-intelligence" aria-label="Connected financial insights"><div><span class="ec16-label">YOUR CONNECTED FINANCIAL PLAN</span><h2>Today's next smart move</h2><p><b>${E(top[0])}.</b> ${E(top[1])}</p><div class="ec16-tiny-stats"><span>${N(m.income)>0?`Unallocated ${CAD(surplus)}/mo`:'Monthly income not entered'}</span><span>Emergency fund ${runway.toFixed(1)} months</span><span>${saved} saved ${saved===1?'home':'homes'}</span></div></div>${btn(top[2],'Take action')}</section>${alerts()}`;
 }
 const home0=V.home;V.home=function(){const html=home0.apply(this,arguments);if(!S.profile?.onboarded)return html;const t=document.createElement('template');t.innerHTML=html;
   const market=t.content.querySelector('.ec153-market');if(market){const container=document.createElement('div');container.innerHTML=homeIntelligence();market.after(container);}else{const x=document.createElement('div');x.innerHTML=homeIntelligence();t.content.append(x);}
   const out=document.createElement('div');out.append(t.content);return out.innerHTML;};
 const priorLearn=V.learn;if(typeof priorLearn==='function')V.learn=function(){return priorLearn.apply(this,arguments)+`<section class="card ec16-learn-more"><div class="ec16-label">KEEP LEARNING · APPLY WHAT YOU LEARN</div><h2>There is no finish line for financial knowledge.</h2><p>Review completed topics, explore new lessons and apply them to a real choice. Financial rules change: revisit the Canadian toolkit whenever your circumstances change.</p><div class="ec16-actions">${btn('canada','Canadian money concepts')}${btn('readiness','Practice a home scenario')}${btn('advisor','Ask Copilot a question')}</div></section>`;};
 const priorAdvisor=V.advisor;if(typeof priorAdvisor==='function')V.advisor=function(){return `<section class="ec16-ai-intro"><div class="ec16-label">PERSONALIZED · YOU CONTROL THE CONTEXT</div><div class="ec16-ai-row"><div><strong>Your financial Copilot</strong><p>Questions about your home and budget can use saved figures only when financial context sharing is enabled. AI can be incorrect; check the calculations in the app.</p></div><label><input type="checkbox" ${S.shareCtx?'checked':''} onchange="EC16.aiContext(this.checked)"> Use my financial context</label></div><div class="ec16-chip-row">${['Can I afford a home while still investing?','Explain what a 2% rate increase means','Help me prioritize my financial goals'].map(q=>`<button type="button" onclick="EC16.ask(${JSON.stringify(q).replace(/'/g,'&#39;')})">${E(q)}</button>`).join('')}</div></section>`+priorAdvisor.apply(this,arguments);};
 function reportView(){const m=MODEL(),x=userCalc(),p=province();const today=new Date().toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'});
   return `${header('PRIVATE FINANCIAL SUMMARY','Your financial overview.','A printable snapshot of the information you entered, with transparent assumptions.')}
   <section class="card ec16-report-print" id="ec16-print"><div class="ec16-report-title"><div><h2>EquityClimb · Financial snapshot</h2><p>${E(today)} · ${E(p[0])}, Canada</p></div><strong>Personal planning · CAD</strong></div>
   <div class="ec16-report-grid">${[['Net worth',m?.net],['Total assets',m?.assets],['Liabilities',m?.liab],['Take-home monthly income',m?.income],['Monthly planned outgoings',N(m?.essentials)+N(m?.lifestyle)+N(m?.debt)+N(m?.savings)],['Unallocated monthly funds',m?.unallocated],['Emergency fund (months)',N(m?.emergencyMonths).toFixed(1)],['Current home scenario monthly cost',x.total],['Current scenario upfront cash',x.upfront],['Financed default insurance estimate',x.insurancePremium]].map(([l,v])=>`<div><span>${E(l)}</span><b>${typeof v==='string'?E(v):CAD(v)}</b></div>`).join('')}</div>
   <p class="small mute">Values reflect saved user inputs and app models, not verified bank balances, lender qualification or a professional plan. Home costs exclude region-specific taxes/fees unless entered. Never share this report without checking personal information.</p></section>
   <div class="ec16-actions ec16-no-print"><button class="btn" type="button" onclick="window.print()">Print / Save as PDF</button><button class="btn ghost" type="button" onclick="EC16.downloadCSV()">Export summary CSV</button>${btn('profile','Review source figures')}</div>`;}
 V.readiness=readinessView;V.canada=canadaView;V.report=reportView;
 const oldMore=V.more;V.more=function(){const h=oldMore.apply(this,arguments);return `<section class="ec16-more-tools"><span class="ec16-label">YOUR PLANNING WORKSPACE</span><div class="ec16-more-links">${[['readiness','Home readiness'],['canada','Canadian toolkit'],['report','Financial report']].map(([id,label])=>btn(id,label)).join('')}</div></section>`+h;};
 // Keep cloud sync functionality, move only its current Settings display under a discreet disclosure.
 const oldSettings=V.settings;V.settings=function(){const t=document.createElement('template');t.innerHTML=oldSettings.apply(this,arguments);
   const cards=[...t.content.querySelectorAll('.card')];const account=cards.find(x=>/Synced to your account|Use EquityClimb on all your devices|Sync between phone and laptop/.test(x.textContent||''));
   if(account){const wrap=document.createElement('details');wrap.className='ec16-sync-details';wrap.innerHTML='<summary><span>Accounts & device sync</span><small>Optional sign-in and cross-device backups</small></summary>';
     const next=account.nextElementSibling;if(next&&next.classList.contains('sp'))next.remove();account.replaceWith(wrap);wrap.append(account);t.content.append(wrap);}
   const content=document.createElement('section');content.className='card ec16-preferences';content.innerHTML=`<div class="ec16-label">PERSONALIZATION</div><h2>Make EquityClimb yours</h2><p>Choose your mobile landing page and the four shortcuts you use most. Home and More always remain available.</p>
    <div class="ec16-control-grid"><label class="ec16-control"><span>First page when opening on a phone</span><select onchange="EC16.landing(this.value)">${Object.entries(routes).map(([id,[label]])=>`<option value="${id}" ${st.landing===id?'selected':''}>${E(label)}</option>`).join('')}</select></label>
      ${[0,1,2,3].map(i=>`<label class="ec16-control"><span>Mobile shortcut ${i+1}</span><select onchange="EC16.pin(${i},this.value)">${Object.entries(routes).filter(([id])=>id!=='home').map(([id,[label]])=>`<option value="${id}" ${st.pins[i]===id?'selected':''}>${E(label)}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="ec16-options"><label><input type="checkbox" ${st.renewNotice?'checked':''} onchange="EC16.option('renewNotice',this.checked)"> Show renewal reminders in the app</label><label><input type="checkbox" ${st.localAlerts?'checked':''} onchange="EC16.option('localAlerts',this.checked)"> In-app financial alerts</label><label><input type="checkbox" ${S.shareCtx?'checked':''} onchange="EC16.aiContext(this.checked)"> Permit Copilot to use my financial context</label></div>
    <label class="ec16-control"><span>Optional in-app prime-rate alert (enter a percentage or leave blank)</span><input type="number" min="0" max="30" step="0.1" value="${st.primeAlert==null?'':E(st.primeAlert)}" placeholder="e.g. 7.0" onchange="EC16.primeThreshold(this.value)"></label>
    <p class="small mute">These alerts are checked when you open or use the app; background push notifications are not activated. Mobile navigation is configured per signed-in backup if syncing is enabled.</p>`;
   const lede=t.content.querySelector('.lede');const title=t.content.querySelector('h1');const spacer=title?.nextElementSibling?.classList?.contains('sp')?title.nextElementSibling:null;if(lede)lede.after(content);else if(spacer)spacer.after(content);else if(title)title.after(content);else t.content.prepend(content);const w=document.createElement('div');w.append(t.content);return w.innerHTML;};
 // The Bank of Canada statement is accurate, but the long repeated message crowded the app.
 // Do not misrepresent saved quotes as real-time: accessible timestamp and status remain inside Details.
 const olderRateStrip=window.rateStrip;
 window.rateStrip=function(){
    const h=typeof olderRateStrip==='function'?olderRateStrip():'';
    const t=document.createElement('template');t.innerHTML=h;
    const block=t.content.querySelector('.ec8-rates');
    if(!block){
      const oldNote=t.content.querySelector('.note');
      if(oldNote)oldNote.innerHTML='Rates unavailable. <button type="button" onclick="loadRates(true)">Refresh</button>';
      const w=document.createElement('div');w.append(t.content);return w.innerHTML;
    } // Retain the watchlist even if current rates are unavailable.
    const series=[['Prime',RATES?.prime],['BoC policy',RATES?.policy],['5-year bond',RATES?.bond5],['5-year posted',RATES?.fiveYearPosted]];
    const rows=series.filter(([_,r])=>Number.isFinite(N(r?.value,NaN))).map(([label,r])=>`<div class="card flat kpi"><div class="l">${E(label)}</div><div class="v">${N(r.value).toFixed(2)}%</div></div>`).join('');
    if(rows){block.className='grid ec8-rates ec16-rates';block.innerHTML=rows;}
    for(const element of [...t.content.querySelectorAll('.ec8-ratesline,.ec8-ann,.ec8-official,.ec8-warn,.ec8-boc')])element.remove();
    const stat=window.EC8?.status?.(),date=RATES?.prime?.date,age=date?(Date.now()-Date.parse(date+'T12:00:00'))/864e5:null;
    const detail=document.createElement('details');detail.className='ec16-source-details';
    detail.innerHTML=`<summary>Rate source & status${age!=null&&age>30?' · verify before relying':''}</summary><p>Bank of Canada observations where available. Saved data may be used when connection fails. Prime observation dated ${E(date||'unknown')}. ${stat?.err?'Latest refresh did not succeed; verify current rates.':'Rates can change.'}</p><button type="button" onclick="loadRates(true)">Refresh rates</button>`;
    block.after(detail);
    const holder=document.createElement('div');holder.append(t.content);return holder.innerHTML;
 };
 const olderPaint=window.EC8_PAINT;
 if(typeof olderPaint==='function')window.EC8_PAINT=function(){
   const active=document.activeElement;
   const result=olderPaint.apply(this,arguments);
   if(active?.id==='ec10-wl-q'&&active.value)return result;
   const snap=document.getElementById('ec10-snap');
   if(snap){try{const t=document.createElement('template');t.innerHTML=window.rateStrip();const clean=t.content.querySelector('#ec10-snap');if(clean)snap.innerHTML=clean.innerHTML;compactMarketStatus();}catch(_){}}
   return result;
 };
 function compactMarketStatus(){
   const el=document.getElementById('ec10-snap-status');if(!el)return;
   const row=el.parentElement;if(row&&!row.closest('details')){
     const d=document.createElement('details');d.className='ec16-market-status';d.innerHTML='<summary>Watchlist data details</summary>';
     row.before(d);d.append(row);
   }
 }
 function mobileNav(){if(!S.profile?.onboarded)return;const bar=document.getElementById('tabbar');if(!bar)return;
   const entries=[['home','Home','home'],...st.pins.filter((v,i,a)=>routes[v]&&v!=='home'&&a.indexOf(v)===i).slice(0,4).map(id=>[id,routes[id][0],routes[id][1]]),['more','More','more']];
   bar.innerHTML=entries.map(([id,l,icon])=>`<button class="nav ${cur===id?'on':''}" ${cur===id?'aria-current="page"':''} onclick="go('${id}')">${ic(icon)}<span>${E(l)}</span></button>`).join('');
 }
 function appendSidebarLinks(){if(!S.profile?.onboarded)return;const nav=document.querySelector('.ec14-sidebar');if(!nav)return;
   if(nav.querySelector('.ec16-side-section'))return;
   const section=document.createElement('section');section.className='ec14-nav-section ec16-side-section';section.innerHTML=`<div class="ec14-nav-heading">FINANCIAL INTELLIGENCE</div>${[['readiness','Home readiness','house'],['canada','Canadian toolkit','plan'],['report','My reports','plan']].map(([id,label,ico])=>`<button type="button" class="ec14-nav-item${cur===id?' active':''}" onclick="go('${id}')">${ic(ico)}<span>${label}</span></button>`).join('')}`;
   nav.append(section);
 }
 const render0=window.render;window.render=function(){const x=render0.apply(this,arguments);try{mobileNav();appendSidebarLinks();document.body.classList.add('ec16-ready');compactMarketStatus();}catch(err){console.warn('Optional v16 navigation adjustment failed',err);}return x;};
 window.EC16={
  field(k,val){if(!['targetPrice','fhsaSaved','fhsaMonthly','reserve','ratio'].includes(k))return;st[k]=Math.max(0,Math.min(k==='ratio'?100:20000000,N(val)));persist();render();},
  option(k,v){if(!['renewNotice','localAlerts'].includes(k))return;st[k]=!!v;persist();render();},
  primeThreshold(v){st.primeAlert=v===''?null:Math.max(0,Math.min(30,N(v)));persist();render();},
  aiContext(v){S.shareCtx=!!v;persist();render();},ask(q){go('advisor');if(window.EC7?.prefill)EC7.prefill(q);},
  landing(id){if(!routes[id])return;st.landing=id;persist();render();},
  pin(i,id){if(!Number.isInteger(i)||i<0||i>3||!routes[id]||id==='home')return;const old=st.pins[i];const j=st.pins.findIndex((x,k)=>x===id&&k!==i);if(j>=0)st.pins[j]=old;st.pins[i]=id;persist();render();},
  readinessToLab(){const p=N(st.targetPrice),down=Math.min(p,Math.max(ECMoney.minimumDown(p),estimatedReadiness().down));S.ec13.calc.price=p;S.ec13.calc.down=down;persist();EC13.tab('lab');},
  downloadCSV(){const m=MODEL(),x=userCalc(),rows=[['Metric','Value (CAD except months)'],['Net worth',N(m?.net)],['Assets',N(m?.assets)],['Liabilities',N(m?.liab)],['Monthly income',N(m?.income)],['Monthly unallocated',N(m?.unallocated)],['Emergency fund months',N(m?.emergencyMonths)],['Scenario home price',x.price],['Scenario mortgage payment',x.mortgage],['Scenario insurance premium financed',x.insurancePremium],['Scenario monthly ownership',x.total],['Scenario upfront cash',x.upfront]];
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='EquityClimb_financial_summary.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 };
 persist();try{render();}catch(e){console.warn('v16 initial layout unavailable',e);}
 // Only use a selected mobile landing screen for a no-hash fresh open. Deep links always win.
 if(S.profile?.onboarded&&!location.hash&&window.matchMedia('(max-width:920px)').matches&&st.landing!=='home'){
  try{go(st.landing);}catch(_){/* keep the normal Home screen */}
 }
})();
