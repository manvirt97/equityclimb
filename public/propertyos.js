/* PropertyOS 2.0 — additive interface; no MLS feed, tenant records or paid APIs. */
(function(){
  'use strict';
  if(window.__propertyOS||typeof V==='undefined'||typeof S==='undefined'||!window.PropertyOSEngine)return;
  window.__propertyOS=true;
  var core=window.PropertyOSEngine;
  var initial={
    label:'',price:'',units:2,rent:'',otherIncome:0,vacancy:5,credit:1,
    propertyTax:'',insurance:'',utilities:0,repairs:0,admin:0,
    managementPct:8,capex:0,downPct:25,rate:5,years:25,
    closingPct:2,renovation:0,upfrontFees:0,ownerOccupied:false
  };
  var st=S.propertyOS&&typeof S.propertyOS==='object'&&!Array.isArray(S.propertyOS)?S.propertyOS:(S.propertyOS={});
  if(!st.draft||typeof st.draft!=='object')st.draft={};
  for(var k in initial)if(st.draft[k]===undefined)st.draft[k]=initial[k];
  if(!Array.isArray(st.deals))st.deals=[];
  if(!st.tab)st.tab='deal';
  if(!st.growth||typeof st.growth!=='object')st.growth={value:'',balance:'',maxLtv:70,costs:5000,decline:15};
  var status='';
  var esc=function(s){return String(s??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];});};
  var cad=function(n){return Number.isFinite(n)?new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n):'—';};
  var pct=function(n,d){return Number.isFinite(n)?n.toFixed(d===undefined?1:d)+'%':'—';};
  var ratio=function(n){return Number.isFinite(n)?n.toFixed(2)+'×':'—';};
  var saveState=function(){try{save();status='Saved to your EquityClimb financial profile.';return true;}catch(_){status='Unable to save. Check available browser storage.';return false;}};
  var tabs=[['deal','Deal analyzer'],['portfolio','My comparisons'],['growth','Equity & growth'],['guide','First property guide']];
  function field(key,label,help,options){
    var opt=options||{},value=st.draft[key]??'';
    return '<label class="pos-field"><span>'+esc(label)+'</span><input type="number" inputmode="decimal" min="'+(opt.min??0)+'" max="'+(opt.max??10000000000)+'" step="'+(opt.step??'any')+'" value="'+esc(value)+'" placeholder="'+esc(opt.placeholder||'Enter value')+'" data-pos-field="'+esc(key)+'" onchange="ECPropertyOS.field(this.dataset.posField,this.value)"><small>'+esc(help||'')+'</small></label>';
  }
  function metric(label,val,detail,kind){
    return '<details class="pos-metric '+(kind||'')+'"><summary><span>'+esc(label)+'</span><strong>'+esc(val)+'</strong><small>See calculation <span aria-hidden="true">↗</span></small></summary><p>'+esc(detail)+'</p></details>';
  }
  function analyzeSafe(){
    try{return {result:core.analyze(st.draft),error:null};}
    catch(error){return {result:null,error:String(error.message||error)};}
  }
  function resultPanel(){
    var evaluation=analyzeSafe(),r=evaluation.result;
    if(!r)return '<div class="pos-empty"><span class="pos-mark">◇</span><h3>Your investment picture starts here.</h3><p>Enter a property price and expected rent. PropertyOS will calculate returns, debt coverage and cash flow instantly—without pretending to know the market.</p><small>'+esc(evaluation.error)+'</small></div>';
    var note=r.flags.map(function(v){return '<li>'+esc(v)+'</li>';}).join('');
    return '<div class="pos-results"><div class="pos-result-bar"><div><span>ANALYSIS FROM YOUR INPUTS</span><h3>Investment snapshot</h3><p>'+esc(r.mode)+' · Canadian fixed-rate payment illustration</p></div><span class="pos-origin">Not verified market data</span></div>'+
      '<div class="pos-metrics">'+
      metric('Monthly cash flow',cad(r.monthlyCashFlow), 'Net operating income '+cad(r.noi)+' / year − debt service '+cad(r.debtService)+' / year − capital reserve '+cad(r.capitalReserve)+' / year; divide by 12.',r.monthlyCashFlow<0?'pos-negative':'pos-positive')+
      metric('Cap rate',pct(r.capRate), 'NOI '+cad(r.noi)+' ÷ purchase price '+cad(r.price)+' × 100. Cap rate excludes mortgage payments, major capital expenditure and appreciation.')+
      metric('Cash-on-cash return',pct(r.cashOnCash),'Cash flow after debt and capital reserve '+cad(r.cashFlow)+' ÷ cash required '+cad(r.cashRequired)+' × 100.')+
      metric('DSCR',ratio(r.dscr),'Net operating income '+cad(r.noi)+' ÷ annual debt service '+cad(r.debtService)+'. Not a lender qualification result.')+
      metric('Total cash needed',cad(r.cashRequired),'Down payment '+cad(r.downPayment)+' + modeled closing allowance + renovation + additional upfront fees. Excludes unspecified insurance premiums and tax.')+
      metric('Loan-to-value',pct(r.ltv),'Mortgage amount '+cad(r.loan)+' ÷ purchase price '+cad(r.price)+' × 100. Lender appraisal may differ from purchase price.')+
      metric('Debt yield',pct(r.debtYield),'NOI '+cad(r.noi)+' ÷ mortgage amount '+cad(r.loan)+' × 100.')+
      metric('Break-even occupancy',pct(r.breakEvenOccupancy),'(Operating expenses + mortgage service + capital reserve − other income) ÷ annual potential rent. Can be below 0% or above 100% under extreme inputs.')+
      '</div><details class="pos-breakdown" open><summary>Understand every dollar</summary>'+
        '<div><span>Potential annual rent and other income</span><b>'+cad(r.grossPotential)+'</b></div>'+
        '<div><span>Vacancy and unpaid rent</span><b>−'+cad(r.vacancyLoss+r.creditLoss)+'</b></div>'+
        '<div><span>Effective gross income</span><b>'+cad(r.effectiveGrossIncome)+'</b></div>'+
        '<div><span>Operating costs (includes management, excludes mortgage)</span><b>−'+cad(r.operatingExpenses)+'</b></div>'+
        '<div class="pos-total"><span>Net operating income (NOI)</span><b>'+cad(r.noi)+'</b></div>'+
        '<div><span>Mortgage principal + interest / year</span><b>−'+cad(r.debtService)+'</b></div>'+
        '<div><span>Capital reserve / year (below NOI)</span><b>−'+cad(r.capitalReserve)+'</b></div>'+
        '<div class="pos-total"><span>Annual cash flow before tax</span><b>'+cad(r.cashFlow)+'</b></div>'+
        '<p>Other metrics: gross rent multiplier '+ratio(r.grm)+' · operating-expense ratio '+pct(r.expenseRatio)+' · estimated principal repaid in year one '+cad(r.annualPrincipalRepaid)+'. Income taxes, mortgage insurance, financing points, GST, sale proceeds and market appreciation are not included unless explicitly entered.</p>'+
      '</details>'+
      (note?'<div class="pos-risk"><strong>What deserves another look</strong><ul>'+note+'</ul></div>':'<p class="pos-caution">These positive results remain estimates. Verify rent roll, tax bill, insurance, property condition and lender terms before relying on them.</p>')+
      '<div class="pos-result-actions"><button type="button" class="pos-btn" onclick="ECPropertyOS.saveDeal()">Save this comparison</button><button type="button" class="pos-ghost" onclick="ECPropertyOS.exportCSV()">Download calculations CSV</button></div></div>';
  }
  function deal(){
    return '<section class="pos-section"><div class="pos-section-heading"><div><small>01 / UNDERWRITE</small><h2>Would this property pay for itself?</h2><p>Start with numbers you know. We separate everyday costs, mortgage payments and future repairs.</p></div></div>'+
      '<div class="pos-workspace"><div class="pos-form"><div class="pos-form-title">Property essentials <small>All amounts in Canadian dollars</small></div>'+
      '<label class="pos-field pos-span"><span>Property nickname (optional)</span><input type="text" maxlength="80" value="'+esc(st.draft.label)+'" placeholder="For example, Fourplex near downtown" onchange="ECPropertyOS.field(\'label\',this.value)"><small>Do not enter tenant names or other sensitive personal information.</small></label>'+
      '<div class="pos-fields">'+field('price','Purchase price','Required; no listing price is retrieved for you.')+field('units','Rental units','Whole number, from 1 to 10,000.',{step:1,min:1,max:10000})+
      field('rent','Monthly rent per unit','Required. For different unit rents, use their monthly average.')+field('otherIncome','Other income / month','Parking, laundry and other recurring income.')+
      field('vacancy','Vacancy allowance (%)','Months without a paying tenant.',{max:100})+field('credit','Unpaid rent allowance (%)','Separate from vacant units.',{max:100})+'</div>'+
      '<div class="pos-form-title">Operating expenses <small>Monthly amounts; exclude mortgage and major improvements</small></div><div class="pos-fields">'+
      field('propertyTax','Property taxes / month','Use actual annual bill divided by 12.')+field('insurance','Insurance / month','Quote for this exact building.')+
      field('utilities','Owner-paid utilities / month','Only utilities the owner pays.')+field('repairs','Routine repairs / month','Do not include capital projects.')+
      field('admin','Other operating costs / month','Condo, common area, accounting, leasing, etc.')+field('managementPct','Management (% of effective income)','Enter 0 only if appropriate, including self-management assumptions.',{max:100})+
      field('capex','Capital reserve / month','Allowance for roofs, major systems, replacements. Outside NOI.')+'</div>'+
      '<div class="pos-form-title">Acquisition and financing <small>Editable illustrations, never lender offers</small></div><div class="pos-fields">'+
      field('downPct','Down payment (%)','Actual eligibility depends on occupancy, unit count and lender.',{max:100})+field('rate','Interest rate (%)','Illustrative fixed nominal rate, semi-annual compounding.',{max:40})+
      field('years','Amortization (years)','Not every product or property is eligible for longer terms.',{max:50})+field('closingPct','Closing allowance (%)','Legal, inspections, land registration etc.; verify locally.',{max:30})+
      field('renovation','Initial renovation budget','Capital improvement cost at acquisition.')+field('upfrontFees','Upfront financing costs','Add insured premiums, lender/broker fees where applicable.')+'</div>'+
      '<label class="pos-check"><input type="checkbox" '+(st.draft.ownerOccupied?'checked':'')+' onchange="ECPropertyOS.field(\'ownerOccupied\',this.checked)"><span>I plan to live in this property</span></label>'+
      '<p class="pos-inline-note">Defaults such as 5% interest, 25% down and 5% vacancy are <b>editable example assumptions</b>, not current market quotes or bank approvals.</p></div>'+
      '<div class="pos-panel">'+resultPanel()+'</div></div></section>';
  }
  function portfolio(){
    var deals=st.deals.slice(0,25);
    return '<section class="pos-section"><div class="pos-section-heading"><div><small>02 / COMPARE</small><h2>Your investment shortlist</h2><p>Keep deal assumptions separate from your personal homebuying shortlist. Nothing is a live listing.</p></div><button class="pos-btn" onclick="ECPropertyOS.open(\'deal\')">New analysis</button></div>'+
      (deals.length?'<div class="pos-table-wrap"><table><thead><tr><th>Property</th><th>Price</th><th>NOI / yr</th><th>Cash flow / mo</th><th>Cap rate</th><th>DSCR</th><th>Action</th></tr></thead><tbody>'+
      deals.map(function(d,i){var r;try{r=core.analyze(d.input)}catch(_){r=null;}return '<tr><td><strong>'+esc(d.label||'Property '+(i+1))+'</strong><small>Saved '+esc((d.createdAt||'').slice(0,10))+'</small></td><td>'+cad(r&&r.price)+'</td><td>'+cad(r&&r.noi)+'</td><td>'+cad(r&&r.monthlyCashFlow)+'</td><td>'+pct(r&&r.capRate)+'</td><td>'+ratio(r&&r.dscr)+'</td><td><button type="button" class="pos-link" onclick="ECPropertyOS.load('+i+')">Open</button></td></tr>';}).join('')+'</tbody></table></div>'+
      '<p class="pos-caution">Saved analyses are editable user assumptions, not authenticated property records, transaction history, independently appraised valuations or verified market comps.</p>':
      '<div class="pos-empty"><span class="pos-mark">▤</span><h3>No deals saved yet.</h3><p>Complete your first underwriting analysis and choose Save this comparison. You can then compare its numbers with future properties.</p><button class="pos-btn" onclick="ECPropertyOS.open(\'deal\')">Analyze a property</button></div>')+'</section>';
  }
  function growth(){
    var g=st.growth,analysis=null,err='';
    try{analysis=core.equity(g);}catch(e){err=String(e.message||e);}
    var gf=function(k,label,desc,max){return '<label class="pos-field"><span>'+esc(label)+'</span><input type="number" inputmode="decimal" min="0" max="'+(max||10000000000)+'" value="'+esc(g[k]??'')+'" onchange="ECPropertyOS.growth(this.dataset.key,this.value)" data-key="'+esc(k)+'"><small>'+esc(desc)+'</small></label>';};
    return '<section class="pos-section"><div class="pos-section-heading"><div><small>03 / GROW SAFELY</small><h2>Equity is not cash in the bank.</h2><p>Find an illustrative refinancing ceiling—and see how quickly that number changes when values fall.</p></div></div><div class="pos-growth-grid"><div class="pos-form"><div class="pos-form-title">Your existing property</div><div class="pos-fields">'+
      gf('value','Estimated property value','Enter an appraisal or your own dated estimate.')+
      gf('balance','Current mortgage balance','Verify against the lender statement.')+
      gf('maxLtv','Assumed refinance LTV (%)','Illustrative constraint; not a Canadian lender rule.',100)+
      gf('costs','Estimated refinance costs','Penalties, legal, appraisals, fees.')+
      gf('decline','Stress: property value falls (%)','Test lower valuation and loan limits.',100)+'</div></div>'+
      '<div class="pos-panel">'+(analysis?'<div class="pos-growth-results"><span>HYPOTHETICAL GROWTH CAPACITY</span>'+
      metric('Current property equity',cad(analysis.equity),'Entered property value less entered outstanding mortgage. Not cash available.')+
      metric('Illustrative net cash-out',cad(analysis.illustrativeCashOut),'Maximum modeled mortgage at your LTV assumption less existing debt and refinance costs; subject to all lender constraints.')+
      metric('Cash-out under price stress',cad(analysis.stressedCashOut),'Property value reduced by your scenario, then same hypothetical LTV cap less debt and costs.')+
      '<div class="pos-risk"><strong>Before investing again</strong><p>Confirm an actual appraisal, qualifying income, debt-service coverage, mortgage penalties, new payment, emergency reserves and whether the existing property still cash-flows under higher rates. Refinancing may release $0.</p></div></div>':
      '<div class="pos-empty"><span class="pos-mark">↗</span><h3>Model your available equity.</h3><p>Enter your property's value and remaining loan balance to estimate a ceiling before financing eligibility and debt coverage.</p><small>'+esc(err)+'</small></div>')+'</div></div></section>';
  }
  function guide(){
    var items=[
      ['1','Decide your purpose','Will you live in part of the building or rent every unit? This changes financing, tax, housing costs and insurance.'],
      ['2','Choose personal or corporate ownership','Personal ownership may be simpler for a first small rental; a corporation can help with partners and governance but adds accounting, legal costs and different tax treatment. A corporation does not automatically save tax, eliminate liability or avoid personal guarantees.'],
      ['3','Check your total starting cash','Down payment plus inspection, lawyer, registration, mortgage fees, renovations and an emergency reserve. Do not spend every available dollar on the deposit.'],
      ['4','Get financing reviewed','A mortgage broker should verify actual qualifying income, debt ratios, borrower structure, lender property eligibility and rate terms. Five-plus-unit financing differs materially from home mortgages.'],
      ['5','Underwrite real rent and expenses','Verify the rent roll, leases, receipts, taxes, insurance, utilities, maintenance, vacancy, management and a major-repairs budget.'],
      ['6','Complete building and legal diligence','Inspect structure, roof, plumbing, environmental issues, zoning, title, permits, legal suites, tenant obligations and outstanding work orders.'],
      ['7','Stress-test the investment','Assume a few vacant units, higher interest, a major repair and lower valuation. Protect liquidity before acquiring more properties.'],
      ['8','Plan the operations','Set up separate books, lawful security deposit handling, lease/inspection templates, contractor contacts and annual tax records.']
    ];
    return '<section class="pos-section"><div class="pos-section-heading"><div><small>04 / LEARN BY DOING</small><h2>Your first rental, from idea to keys.</h2><p>Simple advice, no shortcuts: what to ask, what to verify and why it matters.</p></div></div>'+
      '<div class="pos-guide-grid"><div><div class="pos-form-title">8 essential decisions</div>'+items.map(function(i){return '<details class="pos-guide-item"><summary><b>'+i[0]+'</b><strong>'+esc(i[1])+'</strong><span aria-hidden="true">+</span></summary><p>'+esc(i[2])+'</p></details>';}).join('')+'</div>'+
      '<div class="pos-guide-aside"><span class="pos-origin">CANADA FIRST</span><h3>Should I buy under my name or a corporation?</h3><p><b>Personal name:</b> often lower setup and filing complexity; ownership, income splitting and liability depend on the arrangement. Rental income is generally reported on your personal return, using CRA rules.</p><p><b>Corporation:</b> can support partnerships, ownership structure and continuity, but carries incorporation and annual compliance costs. Passive rental income may not receive the small-business treatment you expect.</p><p><b>Decision rule:</b> compare tax results, legal protection, mortgage guarantees, transfers, eventual sale and succession with a Canadian CPA and lawyer <em>before</em> buying or transferring title.</p>'+
      '<div class="pos-source-links"><a target="_blank" rel="noopener noreferrer" href="https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4036/rental-income.html">CRA rental income guide ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/multi-unit-insurance/mliselect">CMHC multi-unit financing ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.alberta.ca/information-for-landlords-and-tenants">Alberta tenancy guide ↗</a></div></div></div></section>';
  }
  function page(){
    return '<div class="pos" id="propertyos"><header class="pos-hero"><div><div class="pos-kicker"><span class="pos-accent"></span> EQUITYCLIMB / PROPERTYOS 2.0 <span class="pos-stage">FOUNDATION RELEASE</span></div><h1>Invest in property.<br><em>Understand every number.</em></h1><p>Professional Canadian investment analysis, explained for your first deal. Build a portfolio with clarity, not guesswork.</p><div class="pos-hero-actions"><button class="pos-btn" onclick="ECPropertyOS.open(\'deal\')">Analyze an investment <span aria-hidden="true">↗</span></button><button class="pos-ghost" onclick="ECPropertyOS.open(\'guide\')">First-time investor guide</button></div></div><div class="pos-hero-side"><span>YOUR PROPERTY JOURNEY</span><strong>01 <i>→</i> 02 <i>→</i> 03</strong><div>Analyze a deal</div><div>Check the financing</div><div>Grow with safeguards</div><small>No invented listings. No unapproved payments or subscriptions.</small></div></header>'+
      '<nav aria-label="PropertyOS workspace" class="pos-tabs">'+tabs.map(function(t){return '<button type="button" class="'+(st.tab===t[0]?'active':'')+'" '+(st.tab===t[0]?'aria-current="page"':'')+' onclick="ECPropertyOS.open(\''+t[0]+'\')">'+esc(t[1])+'</button>';}).join('')+'</nav>'+
      (status?'<div role="status" class="pos-status">'+esc(status)+'</div>':'')+
      (st.tab==='deal'?deal():st.tab==='portfolio'?portfolio():st.tab==='growth'?growth():guide())+
      '<footer class="pos-footer"><b>Financial integrity first.</b> Figures come from your entries and explicitly labelled assumptions, never a live lender or MLS quote. No bank connection, licensed listing feed, tenant data processing, tax filing, or automated refinancing is part of this foundation release. <a href="https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4036/rental-income.html" target="_blank" rel="noopener noreferrer">Canadian rental tax guidance ↗</a></footer></div>';
  }
  V.propertyos=page;
  var previousHomes=V.homes;
  if(typeof previousHomes==='function')V.homes=function(){var h=previousHomes.apply(this,arguments);if(!S.profile?.onboarded)return h;return '<div class="pos-entry"><div><small>NEW · PROPERTYOS</small><strong>Considering a rental investment?</strong><span>Model rent, NOI, cap rate, financing and risk—separately from personal homebuying costs.</span></div><button type="button" onclick="go(\'propertyos\')">Open Investment Lab ↗</button></div>'+h;};
  var previousMore=V.more;
  if(typeof previousMore==='function')V.more=function(){return '<div class="pos-entry"><div><small>PROPERTY INVESTMENT</small><strong>PropertyOS investment tools</strong><span>Deal Analyzer · Equity growth · First property guide</span></div><button type="button" onclick="go(\'propertyos\')">Open ↗</button></div>'+previousMore.apply(this,arguments);};
  var previousRender=window.render;
  if(typeof previousRender==='function')window.render=function(){var result=previousRender.apply(this,arguments);try{var nav=document.querySelector('.ec14-sidebar')||document.querySelector('#side');if(S.profile?.onboarded&&nav&&!nav.querySelector('.pos-nav-item')){var b=document.createElement('button');b.type='button';b.className='ec14-nav-item pos-nav-item';b.textContent='◇  PropertyOS · Investing';b.onclick=function(){go('propertyos');};nav.append(b);}var b2=nav&&nav.querySelector('.pos-nav-item');if(b2){b2.classList.toggle('active',cur==='propertyos');if(cur==='propertyos')b2.setAttribute('aria-current','page');else b2.removeAttribute('aria-current');}}catch(_){/* existing navigation must continue even if optional link fails */}return result;};
  window.ECPropertyOS={
    open:function(tab){if(!tabs.some(function(t){return t[0]===tab;}))return;st.tab=tab;saveState();go('propertyos');},
    field:function(key,value){if(!Object.prototype.hasOwnProperty.call(initial,key))return;st.draft[key]=key==='ownerOccupied'?!!value:key==='label'?String(value).slice(0,80):value;status='';saveState();render();},
    growth:function(key,value){if(!['value','balance','maxLtv','costs','decline'].includes(key))return;st.growth[key]=value;status='';saveState();render();},
    saveDeal:function(){var a=analyzeSafe();if(!a.result){status='Please correct the numbers before saving: '+a.error;render();return;}if(st.deals.length>=25){status='Maximum 25 deals reached. Export or remove old comparisons before adding more.';render();return;}
      st.deals.unshift({label:String(st.draft.label||'Rental investment').slice(0,80),input:JSON.parse(JSON.stringify(st.draft)),createdAt:new Date().toISOString()});status='Analysis saved. These are user assumptions, not live listing data.';saveState();st.tab='portfolio';render();},
    load:function(index){var d=st.deals[index];if(!d)return;st.draft=Object.assign({},initial,d.input);st.tab='deal';status='Saved analysis loaded for review; property data is not automatically refreshed.';saveState();render();},
    exportCSV:function(){var a=analyzeSafe();if(!a.result){status='Complete the analysis before exporting.';render();return;}var r=a.result,rows=[['EquityClimb PropertyOS','User-input scenario, not a verified market report'],['Generated on',new Date().toISOString()],['Price CAD',r.price],['Annual NOI CAD',r.noi],['Annual debt service CAD',r.debtService],['Monthly cash flow CAD',r.monthlyCashFlow],['Cap rate percent',r.capRate],['Cash on cash percent',r.cashOnCash],['DSCR',r.dscr],['Total cash required CAD',r.cashRequired]];
      var csv=rows.map(function(row){return row.map(function(v){var s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
      var u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),ael=document.createElement('a');ael.href=u;ael.download='EquityClimb_PropertyOS_underwriting.csv';ael.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);}
  };
})();
