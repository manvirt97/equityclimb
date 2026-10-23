/* EquityClimb v13 — Homes + Decision Lab + gentle financial progress. Loads LAST.
   Compatible with the v12 project. Does not modify or discard existing saved data. */
(function () {
  'use strict';
  if (window.__ec13 || typeof V === 'undefined' || typeof S === 'undefined') return;
  window.__ec13 = true;
  Object.assign(I, {
    house: '<path d="M3 11.5 12 4l9 7.5V21H3z"/><path d="M9 21v-7h6v7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    compare: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
  });
  const E = s => esc(s);
  const f = (v, d=0) => v === '' || v == null || !isFinite(+v) ? d : +v;
  const cad = v => Math.round(f(v)).toLocaleString('en-CA', {style:'currency',currency:'CAD',maximumFractionDigits:0});
  const safeUrl = s => { try { const u = new URL(String(s||'')); return u.protocol === 'https:' ? u.href : ''; } catch(_) { return ''; } };
  const key = 'ec13';
  function state() {
    if (!S[key] || typeof S[key] !== 'object') S[key] = {};
    const t = S[key];
    if (!t.homes || typeof t.homes !== 'object') t.homes = {};
    const h = t.homes;
    if (!h.city) h.city = S.profile.city || 'Calgary';
    if (!h.type) h.type = 'sale';
    if (!h.property) h.property = 'all';
    if (!Array.isArray(h.saved)) h.saved = [];
    if (!t.calc) t.calc = {};
    const c = t.calc;
    const defaults = { eligible30:false,closingExtra:0, price: f(S.buy && S.buy.price, 600000), down: f(S.buy && S.buy.down, 60000),
      rate: f(S.rate, 4.5), years: 25, tax: f(S.buy && S.buy.tax, 300), insurance: 150,
      utilities: f(S.buy && S.buy.heat, 150), condo: 0, maintenancePct: 1, closingPct: 1.5,
      fixed: true };
    for (const [k,v] of Object.entries(defaults)) if (c[k] === undefined) c[k] = v;
    if (!Array.isArray(t.weekDone)) t.weekDone = [];
    return t;
  }
  const st = state();
  const store = () => { try { save(); } catch (_) {} };
  const cityNow = () => (st.homes.city || S.profile.city || 'Calgary').trim();
  const query = () => { const h=st.homes; const p=new URLSearchParams({city:cityNow(),type:h.type,property:h.property,page:String(h.page||1)});
    for (const n of ['minPrice','maxPrice','beds','baths']) if (f(h[n]) > 0) p.set(n, String(f(h[n])));
    return '/api/homes?' + p.toString(); };
  let list = null, requestId = 0, status = null, error = '', fetching = false;
  let detail = null, tab = 'discover', mapOpen = false, map = null, markers = null;
  function formField(name, label, type='number', options={}) {
    const c = st.calc; const val = c[name];
    return `<label class="ec13-field"><span>${E(label)}</span><input data-calc="${E(name)}" type="${E(type)}" value="${E(val)}" ${type==='number' ? `min="${options.min||0}" max="${options.max||10000000}" step="${options.step||1}"` : ''} onchange="EC13.calcField(this.dataset.calc,this.value)"></label>`;
  }
  function infoRows(c) { const rows=[['Mortgage principal & interest',c.mortgage],['Property tax',c.propertyTax],['Home insurance',c.insurance],['Utilities / heating',c.utilities],['Condo fees',c.condo],['Maintenance allowance',c.maintenance]];
    return rows.map(([l,v])=>`<div class="ec13-line"><span>${E(l)}</span><b>${cad(v)}</b></div>`).join(''); }
  function model(price, changed={}) {
    const c=st.calc, b=S.budget, m=typeof window.ECModel==='function'?window.ECModel():null;
    // Use the existing v6+ budget model, rather than legacy S.spend (which includes old categories).
    // Remove ONLY today's housing expense when modelling a REPLACEMENT home; keep other debt and savings.
    const nonHousing=m && b ? Math.max(0, f(m.essentials)-f(b.essentials?.housing)+f(m.lifestyle)+f(m.debt)+f(m.savings))
      : Math.max(0, Object.entries(S.spend||{}).reduce((a,[k,v])=>a+(k==='Housing'?0:f(v)),0));
    const takeHome=m?f(m.income):f(S.income)+f(S.otherInc);
    return ECMoney.ownership({...c, ...changed, price:f(price ?? c.price), netIncome:takeHome, nonHousing, cash:f(S.cash) });
  }
  const safeTitle = x => x.address || x.area || 'Property';
  function snapshotCard(x, idx, manual=false) {
    const rent = (x.rent || st.homes.type === 'lease') && !manual;
    const monthly = !rent && x.price > 0 ? model(x.price).total : null;
    const image = x.images && x.images[0] && /^https:\/\/(?:cdn\.repliers\.io|ddfcdn\.realtor\.ca)\//i.test(x.images[0]) ? `<img loading="lazy" src="${E(x.images[0])}" alt="Property photo provided by licensed listing service">` : `<div class="ec13-no-photo">${ic('house')}<span>Property photo unavailable</span></div>`;
    return `<article class="ec13-property card">
      <div class="ec13-photo">${image}<div class="ec13-source">${manual ? 'Added by you' : 'Licensed listing feed'}</div></div>
      <div class="ec13-property-body">
        <div class="ec13-property-head"><strong>${cad(x.price||0)}${rent?'<small> /mo</small>':''}</strong>${x.beds!=null?`<span>${E(x.beds)} bed · ${E(x.baths??'—')} bath</span>`:''}</div>
        <h3>${E(safeTitle(x))}</h3><div class="small mute">${E([x.area,x.city].filter(Boolean).join(', '))} · ${E(x.type||'Residential')}</div>
        ${monthly!==null?`<div class="ec13-monthly">Ownership estimate <strong>${cad(monthly)}/mo</strong></div>`:''}
        ${manual?'':`<div class="ec13-agent small mute">${E(x.brokerage||'Confirm listing brokerage with provider')}${x.agents&&x.agents.length?' · '+E(x.agents.join(', ')):''}</div>`}
        <div class="ec13-actions">
          <button class="btn sm" onclick="EC13.analyze('${manual?'saved':'live'}',${idx})">Analyze costs</button>
          ${manual?`<button class="btn sm ghost" onclick="EC13.remove(${idx})">Remove</button>`:`<button class="btn sm ghost" onclick="EC13.remember(${idx})">${st.homes.saved.some(z=>z.providerId===x.id)?'Saved ID ✓':'Save MLS ID'}</button>`}
          ${x.sourceUrl?`<a class="ec13-text-link" target="_blank" rel="noopener noreferrer" href="${E(safeUrl(x.sourceUrl))}">Source ↗</a>`:''}
          ${!manual&&x.source==='REALTOR.ca DDF'&&safeUrl(x.sourceUrl)?`<a class="ec154-powered" href="${E(safeUrl(x.sourceUrl))}" target="_blank" rel="noopener noreferrer" aria-label="Original listing powered by REALTOR.ca"><img src="https://www.realtor.ca/images/en-ca/powered_by_realtor.svg" alt="Powered by REALTOR.ca" width="125"></a>`:''}
        </div>
      </div>
    </article>`;
  }
  function homesLayout() {
    const h = st.homes;
    return `${head('Homes', 'Find a place. Know your numbers.', 'Explore neighbourhoods and housing options, then understand the financial consequences before you decide.')}
    <div class="ec13-shell">
      <section class="ec13-banner"><div class="ec13-eyebrow">EQUITYCLIMB HOMES</div><h2>More than a listing. A smarter home decision.</h2>
        <p>Compare the real carrying cost of homes, explore Canadian cities and build a shortlist that fits your life.</p>
        <div class="ec13-banner-stats"><span>${ic('map')} Search by city</span><span>${ic('plan')} Estimate ownership costs</span><span>${ic('check')} Save and compare</span></div></section>
      <div class="ec13-tabs" role="tablist" aria-label="Homes sections">
        ${[['discover','Discover homes'],['saved','My shortlist'],['lab','Decision Lab']].map(([k,l])=>`<button role="tab" aria-selected="${tab===k}" class="${tab===k?'on':''}" onclick="EC13.tab('${k}')">${E(l)}</button>`).join('')}
      </div>
      ${tab==='discover'?`<section class="card ec13-search" aria-label="Housing search">
        <div class="ec13-search-grid">
          <label class="ec13-field"><span>City or municipality</span><input id="ec13-city" type="text" maxlength="60" value="${E(cityNow())}" placeholder="e.g., Calgary" autocomplete="address-level2" onchange="EC13.filter('city',this.value)"></label>
          <label class="ec13-field"><span>Purpose</span><select onchange="EC13.filter('type',this.value)"><option value="sale" ${h.type==='sale'?'selected':''}>Buy</option><option value="lease" ${h.type==='lease'?'selected':''}>Rent</option></select></label>
          <label class="ec13-field"><span>Home type</span><select onchange="EC13.filter('property',this.value)"><option value="all" ${h.property==='all'?'selected':''}>All properties</option><option value="house" ${h.property==='house'?'selected':''}>Residential</option><option value="condo" ${h.property==='condo'?'selected':''}>Condo</option></select></label>
          <label class="ec13-field"><span>Min. price (CAD)</span><input type="number" min="0" step="25000" value="${E(h.minPrice||'')}" placeholder="No minimum" onchange="EC13.filter('minPrice',this.value)"></label>
          <label class="ec13-field"><span>Max. price (CAD)</span><input type="number" min="0" step="25000" value="${E(h.maxPrice||'')}" placeholder="No maximum" onchange="EC13.filter('maxPrice',this.value)"></label>
          <label class="ec13-field"><span>Bedrooms</span><select onchange="EC13.filter('beds',this.value)">${[['0','Any'],['1','1+'],['2','2+'],['3','3+'],['4','4+'],['5','5+']].map(([n,l])=>`<option value="${n}" ${f(h.beds)===+n?'selected':''}>${l}</option>`).join('')}</select></label><label class="ec13-field"><span>Bathrooms</span><select onchange="EC13.filter('baths',this.value)">${[['0','Any'],['1','1+'],['2','2+'],['3','3+'],['4','4+']].map(([n,l])=>`<option value="${n}" ${f(h.baths)===+n?'selected':''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="ec13-filter-actions"><button class="btn" onclick="EC13.search()">${ic('refresh')} Search inventory</button>
           <button class="btn ghost" onclick="EC13.useCity()">Use my profile city</button><button class="btn ghost" onclick="EC13.openExternal('realtor')">Search REALTOR.ca ↗</button>
        </div>
      </section><section id="ec13-results" aria-live="polite">${resultHtml()}</section>`:''}
      ${tab==='saved'?savedHtml():''}${tab==='lab'?labHtml():''}
      <p class="ec13-disclaimer">Property details may change. EquityClimb is an educational comparison tool, not a licensed real-estate brokerage or mortgage lender. Calculations are estimates and do not represent pre-approval. Verify all details with the listing professional.</p>
    </div>`;
  }
  function resultHtml() {
    if (fetching) return '<div class="card ec13-state"><div class="skel" style="width:65%"></div><div class="skel" style="width:85%"></div><div class="skel" style="width:45%"></div><p class="small mute">Checking available inventory…</p></div>';
    if (error) return `<div class="card ec13-state"><h2>Listings temporarily unavailable</h2><p>${E(error)}</p><button class="btn ghost sm" onclick="EC13.search()">Retry</button></div>`;
    if (!list || !list.enabled) return `<div class="ec13-empty card"><div class="ec13-empty-icon">${ic('house')}</div><div><div class="ec13-eyebrow">REAL ESTATE DISCOVERY</div><h2>Explore ${E(cityNow())} — live feed pending</h2>
      <p>MLS listings aren't connected yet. We won't display invented inventory or pretend prices are live. You can search trusted external portals and bring a property back to EquityClimb to compare the numbers.</p>
      <div class="ec13-actions"><button class="btn" onclick="EC13.openExternal('realtor')">Open REALTOR.ca ↗</button><button class="btn ghost" onclick="EC13.openExternal('zolo')">Open Zolo ↗</button><button class="btn ghost" onclick="EC13.tab('saved')">Add a home to compare</button></div>
      <div class="ec13-smallprint">A licensed listing connection can be enabled by the app owner after authorization. External search portals may use their own location filters.</div></div></div>
      <div class="ec13-inline-grid"><div class="card"><h2>Explore neighbourhoods</h2><p class="small mute">Learn about different areas and use your existing area shortlists.</p><button class="btn ghost sm" onclick="go('areas')">Open Neighbourhoods</button></div>
      <div class="card"><h2>Know your affordable range</h2><p class="small mute">Try rates and down payments before finding your next home.</p><button class="btn ghost sm" onclick="EC13.tab('lab')">Open Decision Lab</button></div></div>`;
    if (!list.items?.length) return `<div class="card ec13-state"><h2>No matching listings</h2><p>There are no listings in this licensed feed matching your search. Try a broader price range or another city. This does not represent all market inventory.</p></div>`;
    const count = list.total == null?'':`${f(list.total).toLocaleString('en-CA')} results in authorized feed`;
    return `<div class="ec13-results-head"><div><h2>Current properties in ${E(cityNow())}</h2><div class="small mute">${E(count)} · ${E(list.provider||'Authorized feed')} · Checked ${new Date(list.fetchedAt||Date.now()).toLocaleString('en-CA')}</div></div>
      <button class="btn ghost sm" onclick="EC13.mapToggle()">${ic('map')} ${mapOpen?'Hide map':'Show map'}</button></div>
      <div id="ec13-map" class="ec13-map ${mapOpen?'':'ec13-map-hidden'}" role="region" aria-label="Property locations on a map"></div>
      <div class="ec13-property-grid">${list.items.map((x,i)=>snapshotCard(x,i)).join('')}</div>
      <div class="ec13-pagination"><button class="btn ghost sm" ${f(list.page)<=1?'disabled':''} onclick="EC13.page(-1)">← Previous</button><span>Page ${E(list.page)} of ${E(list.pages)}</span><button class="btn ghost sm" ${f(list.page)>=f(list.pages)?'disabled':''} onclick="EC13.page(1)">Next →</button></div>
      <div class="ec13-smallprint">Results only represent listings your provider is licensed to show; they are not a complete count of all homes for sale. Verify availability before making decisions.</div>`;
  }
  function savedHtml() {
    const saved=st.homes.saved.filter(x=>x.manual);
    const refs=st.homes.saved.filter(x=>!x.manual);
    return `<section class="ec13-saved">
      <div class="ec13-section-heading"><div><h2>Your property shortlist</h2><p class="small mute">Add a property found on REALTOR.ca, Zolo or elsewhere. Values you enter are user-provided, not verified listings.</p></div><span class="ec13-counter">${saved.length} entered</span></div>
      <div class="ec13-inline-grid"><div class="card ec13-saved-form"><h2>Add a home you've found</h2><form id="ec13-manual" onsubmit="EC13.addManual(event)">
        <label class="ec13-field"><span>Address or property description</span><input name="address" maxlength="150" required placeholder="e.g. 123 Example Street"></label>
        <div class="ec13-two"><label class="ec13-field"><span>City</span><input name="city" maxlength="60" required value="${E(cityNow())}"></label><label class="ec13-field"><span>Asking price (CAD)</span><input type="number" name="price" min="1" max="20000000" required placeholder="575000"></label></div>
        <div class="ec13-two"><label class="ec13-field"><span>Bedrooms (optional)</span><input name="beds" min="0" max="20" type="number" placeholder="3"></label><label class="ec13-field"><span>Property type</span><input name="type" maxlength="60" placeholder="Detached / condo"></label></div>
        <label class="ec13-field"><span>Link to original listing (optional)</span><input type="url" name="url" maxlength="400" placeholder="https://…"></label>
        <button class="btn" type="submit">Save property</button><p class="ec13-smallprint">Only you supply these property details. Saved with your existing EquityClimb data on this device and your optional account sync.</p>
      </form></div><div class="card ec13-primer"><div class="ec13-eyebrow">BEFORE YOU BUY</div><h2>Look beyond the asking price</h2><p>Budget for the down payment, closing costs, mortgage payment, taxes, insurance, utilities and recurring maintenance. Compare multiple rate scenarios.</p><button class="btn ghost sm" onclick="EC13.tab('lab')">Explore monthly costs →</button>
      ${refs.length?`<div class="ec13-saved-ids"><b>MLS IDs saved from the licensed feed</b>${refs.map((r,i)=>`<div><span>${E(r.id)} · ${E(r.city||'')}</span><button class="ec13-x" onclick="EC13.forget('${E(r.id)}')" aria-label="Remove saved MLS ID">×</button></div>`).join('')}<small>For licensing reasons, saved MLS records store only identifiers; search that city again for current details.</small></div>`:''}
      </div></div>
      ${saved.length?`<div class="ec13-section-heading"><h2>Saved comparisons</h2><p class="small mute">${saved.length} property${saved.length===1?'':'ies'}</p></div><div class="ec13-property-grid">${saved.map((x,i)=>snapshotCard(x,i,true)).join('')}</div>${saved.length>1?comparisonTable(saved):''}`:`<div class="card ec13-state">No properties added yet. Paste in details from a listing you've found and you can start comparing ownership costs.</div>`}
    </section>`;
  }
  function comparisonTable(items) { const list0=items.slice(0,4); return `<div class="card ec13-compare-wrap"><h2>Side-by-side estimate</h2><div class="ec13-table-scroll"><table><thead><tr><th>Property</th>${list0.map(x=>`<th>${E(x.address.slice(0,24))}</th>`).join('')}</tr></thead><tbody>
    <tr><td>Price</td>${list0.map(x=>`<td>${cad(x.price)}</td>`).join('')}</tr><tr><td>Est. monthly ownership</td>${list0.map(x=>`<td>${cad(model(x.price).total)}</td>`).join('')}</tr><tr><td>Upfront cash required</td>${list0.map(x=>`<td>${cad(model(x.price).upfront)}</td>`).join('')}</tr>
  </tbody></table></div><p class="small mute">All comparisons use the same down-payment dollar amount and editable assumptions in the Decision Lab, which may not fit every property.</p></div>`; }
  function labHtml() {
    const c=model(); const cur=st.calc;
    const plus1=model(null,{rate:f(cur.rate)+1}), plus2=model(null,{rate:f(cur.rate)+2});
    const positive=c.room>=0;
    // Use the exact same saved-budget components as model(), so the visible arithmetic
    // cannot silently disagree with the number printed in the affordability box.
    const overview=typeof window.ECModel==='function'?window.ECModel():null;
    const bud=S.budget||{};
    const incomeUsed=overview?f(overview.income):f(S.income)+f(S.otherInc);
    const essentialOther=overview?Math.max(0,f(overview.essentials)-f(bud.essentials?.housing)):null;
    const lifeUsed=overview?f(overview.lifestyle):null;
    const debtsUsed=overview?f(overview.debt):null;
    const savingsUsed=overview?f(overview.savings):null;
    const otherUsed=essentialOther===null?Math.max(0,Object.entries(S.spend||{}).reduce((sum,[k,v])=>sum+(k==='Housing'?0:f(v)),0)):
      Math.max(0,essentialOther+lifeUsed+debtsUsed+savingsUsed);
    const available=incomeUsed-otherUsed; // Identical to ECMoney.ownership()'s room calculation when income is supplied.
    const budgetEquation=`<div class="ec162-quickmath">${cad(available)} available − ${cad(c.total)} ownership = <b>${cad(c.room)}/mo</b></div>`;
    const details=essentialOther!==null?`<details class="ec162-math-details"><summary>View budget inputs</summary>
        <div>Take-home income & other income <b>${cad(incomeUsed)}</b></div>
        <div>Essentials excluding current housing <b>−${cad(essentialOther)}</b></div>
        <div>Lifestyle spending <b>−${cad(lifeUsed)}</b></div>
        <div>Existing mortgage & other debt <b>−${cad(debtsUsed)}</b></div>
        <div>Planned savings <b>−${cad(savingsUsed)}</b></div>
        <div class="ec162-math-total">Available for new housing <b>${cad(available)}</b></div>
      </details>`:`<div class="ec162-quickmath">Based on existing legacy spending entries; review Budget & Cash Flow for accuracy.</div>`;
    const downFormula=c.price>=1500000?`20% × ${cad(c.price)} = ${cad(c.minimumDown)}`:
      c.price<=500000?`5% × ${cad(c.price)} = ${cad(c.minimumDown)}`:
      `5% × ${cad(500000)} + 10% × ${cad(c.price-500000)} = ${cad(c.minimumDown)}`;
    const cash= f(S.cash) ? `<span class="${c.cashAfterClosing>=0?'ec13-positive':'ec13-negative'}">${cad(c.cashAfterClosing)}</span>` : '<span>Not supplied</span>';
    return `<section class="ec13-lab">
      <div class="ec13-section-heading"><div><h2>Financial Decision Lab</h2><p class="small mute">Try a property's price, your down payment and different interest-rate scenarios. All numbers are editable.</p></div><span class="ec13-badge">Illustrative · CAD</span></div>
      <div class="ec13-lab-grid"><div class="card ec13-input-card"><h2>Your home scenario</h2>
        <div class="ec13-two">${formField('price','Purchase price')}${formField('down','Down payment')}</div>
        <div class="ec13-two">${formField('rate','Annual mortgage rate (%)','number',{max:30,step:0.05})}${formField('years','Amortization (years)','number',{max:40})}</div>
        <label class="ec13-field"><span>Rate convention</span><select onchange="EC13.calcField('fixed',this.value)"><option value="true" ${cur.fixed?'selected':''}>Fixed — Canadian semi-annual compounding</option><option value="false" ${!cur.fixed?'selected':''}>Variable — monthly assumption</option></select></label>
        <div class="ec13-subheading">Recurring ownership costs</div>
        <div class="ec13-two">${formField('tax','Property tax / month')}${formField('insurance','Insurance / month')}${formField('utilities','Utilities / month')}${formField('condo','Condo fees / month')}</div>
        <div class="ec13-two">${formField('maintenancePct','Maintenance / year (% of price)','number',{max:10,step:0.1})}${formField('closingPct','Closing cost allowance (%)','number',{max:10,step:0.1})}</div>
        <div class="ec13-two">${formField('closingExtra','Additional closing costs / transfer tax (CAD)','number',{max:2000000})}<label class="ec13-field"><span>30-year insured mortgage eligibility</span><select onchange="EC13.calcField('eligible30',this.value)"><option value="false" ${!cur.eligible30?'selected':''}>Not confirmed — use standard rules</option><option value="true" ${cur.eligible30?'selected':''}>Eligible first-time buyer or new-build buyer</option></select></label></div>
        <div class="ec13-smallprint">Change your assumptions to update these estimates. Provincial transfer tax, mortgage-insurance sales tax and new-build GST/HST are not automatically calculated.</div>
      </div><div class="card ec13-result-card">
        <div class="ec13-eyebrow">ESTIMATED MONTHLY OWNERSHIP</div><div class="ec13-big">${cad(c.total)}<span>/mo</span></div>
        <p class="small mute">Based on a ${cad(c.price)} purchase and ${cad(c.down)} down payment.</p>
        <div class="ec13-line-sep">${infoRows(c)}</div>
        <div class="ec13-total"><span>Upfront cash (down + allowance)</span><strong>${cad(c.upfront)}</strong></div>
        <div class="ec13-line"><span>Remaining cash after upfront costs</span><strong>${cash}</strong></div>
        <div class="ec13-note ${positive?'':'ec13-note-warn'}">${positive?'Potential room within your entered budget':'Estimated spending exceeds your entered monthly plan'}<b>${cad(c.room)}/mo</b>${budgetEquation}${details}<small>Based on saved profile and budget inputs. Existing mortgage payments remain included; verify your amounts and whether this home replaces your current one.</small></div>
        <div class="ec13-line"><span>Estimated financed default-insurance premium</span><strong>${cad(c.insurancePremium)}</strong></div>
        <div class="ec13-line"><span>Minimum down payment for this price</span><strong>${cad(c.minimumDown)}</strong></div><div class="ec162-downmath" aria-label="Minimum down payment calculation">${downFormula}</div>
        ${!c.downPaymentValid?'<p class="ec13-caution">Down payment is below the usual federal minimum. This scenario is not a standard eligible mortgage.</p>':''}
        ${c.insuranceNeedsReview?'<p class="ec13-caution">The selected insured-mortgage scenario could not be priced under the standard eligibility assumptions. The monthly payment may be understated. Review before relying on it.</p>':''}
        ${c.mayHaveSurcharge?'<p class="ec13-caution">Some insured 30-year mortgages have a premium surcharge not included in this basic estimate. Verify with your insurer.</p>':''}
      </div></div>
      <div class="card ec13-stress"><div class="ec13-section-heading"><div><h2>What if mortgage rates change?</h2><p class="small mute">The same home and principal, different rates. Illustrative new mortgage payments, not a prediction of your renewal.</p></div></div>
       <div class="ec13-stress-grid">${[[cur.rate,c.total,'Your scenario'],[f(cur.rate)+1,plus1.total,'Rate +1 percentage point'],[f(cur.rate)+2,plus2.total,'Rate +2 percentage points']].map(([rate,v,label])=>`<div class="ec13-stress-item"><span>${E(label)}</span><b>${cad(v)}/mo</b><small>${f(rate).toFixed(2)}% annual mortgage rate</small></div>`).join('')}</div>
      </div><div class="ec13-disclaimer">${E(c.caution)} You must confirm mortgage eligibility and current mortgage-insurance rules, taxes and fees with qualified providers.</div>
    </section>`;
  }
  async function search(force=false) {
    tab='discover'; const url=query(); const token=++requestId;
    if (f(st.homes.maxPrice) && f(st.homes.minPrice)>f(st.homes.maxPrice)) { error='The minimum price is higher than the maximum.'; fetching=false; rerenderResults(); return; }
    if (!force && list && list.q === url && Date.now()-list.loaded<120000) { render(); return; }
    error=''; fetching=true; list=null; render();
    try { const r=await fetch(url,{cache:'no-store'}); const j=await r.json(); if (token!==requestId) return;
      if (!r.ok) throw Error(j.error||'Unable to load listings');
      list={...j,q:url,loaded:Date.now()}; status=j.enabled; error='';
    } catch(e) { if (token!==requestId) return; error=String(e.message||'Unable to load listings'); }
    finally { if (token===requestId) { fetching=false; if (cur==='homes') { render(); if(mapOpen) setTimeout(buildMap,50); } } }
  }
  const rerenderResults=()=>{ const el=document.getElementById('ec13-results'); if(el) el.innerHTML=resultHtml(); };
  function lazyLeaflet() {
    if (window.L) return Promise.resolve();
    if (window.__ecLeafletPromise) return window.__ecLeafletPromise;
    const css=document.createElement('link'); css.rel='stylesheet'; css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyo45KjG4I3P4RJg='; css.crossOrigin='anonymous'; document.head.appendChild(css);
    window.__ecLeafletPromise = new Promise((res,rej)=>{const s=document.createElement('script'); s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='; s.crossOrigin='anonymous'; s.onload=res; s.onerror=rej; document.head.appendChild(s);});
    return window.__ecLeafletPromise;
  }
  async function buildMap() {
    if (cur!=='homes'||!mapOpen||!list?.enabled) return;
    const div=document.getElementById('ec13-map'); if(!div) return;
    const points=list.items.map((x,i)=>({...x,i})).filter(x=>x.lat!==null&&x.lng!==null&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lng));
    if (!points.length) { div.innerHTML='<p class="ec13-map-msg">This set of listings does not include permitted map coordinates.</p>'; return; }
    div.innerHTML='<p class="ec13-map-msg">Loading map…</p>';
    try { await lazyLeaflet(); if (document.getElementById('ec13-map')!==div || !mapOpen) return;
      map?.remove(); map=null; div.innerHTML='';
      map=L.map(div,{scrollWheelZoom:false,zoomControl:true});
      // Small-scale demo tile use only. Use a production map tile provider before substantial traffic.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
      markers=L.featureGroup().addTo(map);
      points.forEach(x=>{ const pin=L.marker([x.lat,x.lng]).addTo(markers); pin.bindPopup(`${E(x.address||'Property')}<br><b>${cad(x.price)}</b>`); pin.on('click',()=>{const cards=document.querySelectorAll('.ec13-property'); cards[x.i]?.scrollIntoView({behavior:'smooth',block:'center'});}); });
      map.fitBounds(markers.getBounds().pad(0.18),{maxZoom:13});
    } catch(_) {div.innerHTML='<p class="ec13-map-msg">Map unavailable. Listing cards are still accessible.</p>';}
  }
  function nextAction() {
    const goal=S.profile.goal;
    return goal==='buy'||goal==='rent'?['Discover what you can afford','Explore local homes and review an ownership-cost estimate.',"EC13.tab('lab')"]:
      goal==='own'?['See your options before the next big purchase','Use the Decision Lab to compare a payment at higher rates.',"EC13.tab('lab')"]:
      ['Take a small step toward your goals','Review your monthly plan or try a financial-learning module.',"go('budget')"];
  }
  function weekKey() { const d=new Date(), day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function weekTasks() {
    const id=weekKey(); if(st.week!==id) {st.week=id; st.weekDone=[]; store();}
    const things=[['plan','Check my monthly spending plan',"go('budget')"],['homes','Explore a home-buying scenario',"EC13.tab('lab')"],['learn','Learn one new money concept',"go('learn')"]];
    const done=new Set(st.weekDone), count=things.filter(x=>done.has(x[0])).length;
    return `<div class="card ec13-week"><div class="ec13-section-heading"><div><div class="ec13-eyebrow">THIS WEEK</div><h2>Three small moves, real financial confidence</h2></div><span class="ec13-counter">${count}/3 checked</span></div>
      <div class="ec13-progress"><i style="width:${count/3*100}%"></i></div>
      <div class="ec13-week-list">${things.map(([id,title,link])=>`<div class="ec13-task"><button class="ec13-task-check ${done.has(id)?'done':''}" onclick="EC13.toggleTask('${id}')" aria-label="${done.has(id)?'Unmark':'Mark'} ${E(title)} as complete">${done.has(id)?ic('check'):''}</button><span>${E(title)}</span><button class="ec13-task-arrow" onclick="${link}" aria-label="Open ${E(title)}">↗</button></div>`).join('')}</div>
      <p class="ec13-smallprint">Check these off yourself when completed. This is an optional reflection, not proof of financial improvement.</p></div>`;
  }
  const origHome=V.home;
  V.home=function(){ const h=origHome.apply(this,arguments); const [title,subtitle,action]=nextAction();
    const segment=`<div class="ec13-home-start"><section class="ec13-home-lead"><div><div class="ec13-eyebrow">YOUR NEXT SMART MOVE</div><h2>${E(title)}</h2><p>${E(subtitle)}</p></div>
      <div class="ec13-home-actions"><button class="btn" onclick="${action}">Start here →</button><button class="btn ghost" onclick="go('homes')">${ic('house')} Explore Homes</button></div></section>
      <div class="ec13-home-cards"><div class="card"><span class="ec13-eyebrow">LEARN</span><h2>Understand the why</h2><p class="small mute">Build a new money skill and apply it.</p><button class="ec13-link" onclick="go('learn')">Continue learning →</button></div>
      <div class="card"><span class="ec13-eyebrow">DECIDE</span><h2>Test a financial scenario</h2><p class="small mute">Explore different interest rates and purchase costs.</p><button class="ec13-link" onclick="EC13.tab('lab')">Open Decision Lab →</button></div></div>
    ${weekTasks()}</div>`;
    const pos=h.indexOf('</p>');
    if(pos>=0) return h.slice(0,pos+4)+segment+h.slice(pos+4);
    const headingEnd=h.indexOf('</h1>');
    return headingEnd>=0?h.slice(0,headingEnd+5)+segment+h.slice(headingEnd+5):segment+h;
  };
  const origLearn=V.learn;
  if(typeof origLearn==='function') V.learn=function(){const h=origLearn.apply(this,arguments); if (h.includes('ec13-learn-route')) return h;
    return `<div class="ec13-learn-route"><div><span class="ec13-eyebrow">LEARN → APPLY</span><strong>Every lesson can lead to a smarter decision.</strong><p>Finished the basics? Explore daily lessons, ask a new question, or practice a scenario from the Decision Lab.</p></div><button class="btn ghost sm" onclick="EC13.tab('lab')">Practice a decision</button></div>`+h;
  };
  V.homes=homesLayout;
  const nav=window.EC_NAV;
  if (nav) {
    if (!nav.MAIN.some(v=>v[0]==='homes')) nav.MAIN.splice(5,0,['homes','Homes','house']);
    // Homes is already on the main sidebar; avoid showing it twice in the More menu.
    const i=nav.MOBILE.findIndex(x=>x[0]==='wealth');
    if (i!==-1) nav.MOBILE[i]=['homes','Homes','house'];
  }
  window.EC13={
    tab(k) { if(!['discover','saved','lab'].includes(k)) return; tab=k; go('homes'); if(k==='discover'&&!list) search(); },
    filter(k,v){ const h=st.homes;if(!['city','type','property','minPrice','maxPrice','beds','baths'].includes(k)) return;
      h[k]=k==='city'?String(v).trim().slice(0,60):v; h.page=1; store(); list=null; error=''; },
    useCity(){ st.homes.city=S.profile.city||'Calgary'; st.homes.page=1; list=null;store();render(); },
    search(){st.homes.page=1;store();search(true);},
    page(d){st.homes.page=Math.max(1,Math.min(f(list?.pages,1),f(st.homes.page,1)+d));store();search(true);},
    async mapToggle(){mapOpen=!mapOpen; if(map&&!mapOpen){map.remove();map=null;}rerenderResults();if(mapOpen) await buildMap();},
    openExternal(which){ const urls={realtor:'https://www.realtor.ca/',zolo:'https://www.zolo.ca/'}; window.open(urls[which]||urls.realtor,'_blank','noopener,noreferrer');},
    addManual(ev) { ev.preventDefault(); const d=new FormData(ev.currentTarget), url=String(d.get('url')||'').trim(), price=f(d.get('price'));
      if(price<=0||price>20000000) {alert('Enter a valid property price.');return;}
      if(url && !safeUrl(url)) {alert('The source link must start with https://');return;}
      const item={id:'manual-'+Date.now(),manual:true,address:String(d.get('address')||'').trim().slice(0,150), city:String(d.get('city')||'').trim().slice(0,60),
        area:'',price,beds:d.get('beds')===''?null:f(d.get('beds')),type:String(d.get('type')||'Home').slice(0,60),sourceUrl:safeUrl(url)};
      if(!item.address||!item.city) return;
      st.homes.saved.unshift(item);st.homes.saved=st.homes.saved.slice(0,30);store();render();
    },
    remove(i){if(!confirm('Remove this saved property?'))return; const items=st.homes.saved.filter(x=>x.manual);const target=items[i];st.homes.saved=st.homes.saved.filter(x=>x!==target);store();render();},
    remember(i){const x=list?.items?.[i];if(!x)return; if(st.homes.saved.some(a=>a.providerId===x.id))return;
      st.homes.saved.unshift({id:x.id,providerId:x.id,city:x.city,manual:false});st.homes.saved=st.homes.saved.slice(0,30);store();render();},
    forget(id){st.homes.saved=st.homes.saved.filter(x=>x.providerId!==id);store();render();},
    analyze(mode,i) { const item=mode==='saved'?st.homes.saved.filter(x=>x.manual)[i]:list?.items?.[i]; if(!item)return;
      if(item.rent || (mode==='live'&&st.homes.type==='lease')) {alert('This is a rental listing. Home-purchase financing does not apply. You can compare rent against a purchase scenario in the Buying Planner.');return;}
      st.calc.price=item.price;st.calc.down=Math.min(f(st.calc.down),item.price);store();tab='lab';go('homes');},
    calcField(k,v){if(!(k in st.calc))return;st.calc[k]=(k==='fixed'||k==='eligible30')?v==='true':Math.max(0,f(v));store();const active=document.activeElement?.id; render(); if(active)document.getElementById(active)?.focus();},
    toggleTask(id){if(!['plan','homes','learn'].includes(id))return;weekTasks();const a=st.weekDone;st.weekDone=a.includes(id)?a.filter(x=>x!==id):[...a,id];store();render();},
  };
  const render0=window.render;
  window.render=function(){const result=render0.apply(this,arguments);if(cur==='homes' && tab==='discover' && !list&&!fetching&&!error){ setTimeout(()=>{if(cur==='homes'&&tab==='discover'&&!list&&!fetching)search();},0); }
    if(cur==='homes'&&mapOpen&&list?.enabled)setTimeout(buildMap,40);
    return result;};
  if (S.profile.onboarded && location.hash==='#homes') { go('homes'); }
  else if (cur==='home' && S.profile.onboarded) render();
})();
