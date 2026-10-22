/* EquityClimb v15 — premium Homebuying Guide, transparent AI routing, gradual enhancement.
   No live MLS content is invented. No model is claimed active without owner configuration. */
(() => {
  'use strict';
  if (window.__ec15 || typeof V === 'undefined' || typeof S === 'undefined' || !window.EC14) return;
  window.__ec15 = true;
  const esc15=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groupNames=['Get financially ready','Discover and evaluate','Research and protect yourself','Prepare for an offer','Conditions and due diligence','Closing and moving'];
  const tasks=[
    [
      ['budget','Review take-home income, debts, monthly spending and cash reserves','budget'],
      ['approval','Compare mortgage options and understand pre-approval limitations','debt'],
      ['cash','Estimate down payment, closing costs and emergency fund after buying','lab']
    ],[
      ['search','Save a search with price, location and property requirements','homes'],
      ['shortlist','Save promising homes and compare the full monthly carrying cost','homes'],
      ['neighbours','Research local services, commuting and municipal information','areas']
    ],[
      ['condition','Ask about property age, condition, permits and potential defects','advisor'],
      ['title','Learn about title, liens, easements and property restrictions','advisor'],
      ['disclosures','Understand documents and disclosures provided by the seller','advisor']
    ],[
      ['representation','Decide whether to use a representative or act for yourself','advisor'],
      ['terms','Discuss offer conditions, possession dates and deposits with a qualified professional','advisor'],
      ['documents','Have required agreements and local legal obligations reviewed','advisor']
    ],[
      ['inspection','Arrange any inspection and review the findings','advisor'],
      ['financing','Confirm lender approval and appraisal requirements in writing','debt'],
      ['insurance','Confirm property insurance and condition deadlines','advisor']
    ],[
      ['lawyer','Arrange the lawyer or notary and title/closing process applicable locally','advisor'],
      ['funds','Confirm closing funds, adjustments, taxes and payment instructions securely','lab'],
      ['move','Update budget, utilities, insurance and maintenance plan','budget']
    ]
  ];
  const linkByProvince={
    AB:['Real Estate Council of Alberta (consumer guidance)','https://www.reca.ca/consumers/'],
    BC:['BC Financial Services Authority — real estate','https://www.bcfsa.ca/public-resources/real-estate'],
    ON:['Real Estate Council of Ontario (consumer resources)','https://www.reco.on.ca/'],
    QC:['OACIQ — Quebec real estate self-protection','https://www.oaciq.com/']
  };
  const provinceList=[['AB','Alberta'],['BC','British Columbia'],['SK','Saskatchewan'],['MB','Manitoba'],['ON','Ontario'],['QC','Quebec'],['NB','New Brunswick'],['NS','Nova Scotia'],['PE','Prince Edward Island'],['NL','Newfoundland and Labrador'],['YT','Yukon'],['NT','Northwest Territories'],['NU','Nunavut']];
  const state=()=>{
    if(!S.ec15 || typeof S.ec15!=='object')S.ec15={};
    const x=S.ec15;
    if(!x.done||typeof x.done!=='object')x.done={};
    if(!x.stage || x.stage<0 || x.stage>5)x.stage=0;
    if(!provinceList.some(p=>p[0]===x.province)) { const r=String(S.fp?.province||S.profile?.region||'AB').toLowerCase();x.province=(provinceList.find(p=>p[0].toLowerCase()===r||p[1].toLowerCase()===r)||['AB'])[0]; }
    if(!x.aiModel)x.aiModel='auto';
    return x;
  };
  const st=state();
  const saveState=()=>{try{save();}catch(_){}};
  const doneCount=()=>tasks.flat().filter(item=>!!st.done[item[0]]).length;
  const taskCount=tasks.reduce((n,x)=>n+x.length,0);
  const counts=tasks.map((group)=>group.filter(([id])=>!!st.done[id]).length);
  const viewStage=()=>Math.max(0,Math.min(5,+st.stage||0));
  const resource=()=>linkByProvince[st.province] || ['Financial Consumer Agency of Canada — buying a home','https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html'];
  const svg=(icon)=>typeof ic==='function'?ic(icon):'';
  const questionMap={
    approval:'Explain Canadian mortgage pre-approval, key conditions and risks in simple language.',
    condition:'What property-condition and permit questions should a Canadian homebuyer ask?',
    title:'Explain title searches, liens, easements and why a lawyer matters when buying a home.',
    disclosures:'What property disclosures and documents should I ask about in my province?',
    representation:'What are the risks and responsibilities when buying a home without a real estate agent in Canada?',
    terms:'Explain common offer conditions and deposits without writing a binding contract.',
    documents:'What should a real estate lawyer review before I sign a property purchase agreement?',
    inspection:'How do I read a home inspection report and prioritize significant problems?',
    insurance:'What insurance should I review before I remove purchase conditions?',
    lawyer:'Explain the lawyer or notary’s role in closing a home purchase in my province.'
  };
  function taskHtml(item){
    const [id,label,destination]=item,marked=!!st.done[id];
    const goTo=destination==='lab' ? "EC13.tab('lab')" : `go('${destination}')`;
    return `<div class="ec15-task${marked?' complete':''}">
      <label class="ec15-task-check"><input type="checkbox" ${marked?'checked':''} onchange="EC15.toggle('${id}',this.checked)" aria-label="Mark task completed: ${esc15(label)}"><span>${esc15(label)}</span></label>
      <button type="button" class="ec15-mini" onclick="${questionMap[id]?`EC15.ask('${id}')`:goTo}" aria-label="Open related guidance for ${esc15(label)}">${questionMap[id]?'Ask AI':'Open'} ↗</button>
    </div>`;
  }
  V.journey=()=>{
    const phase=viewStage(),completed=doneCount(),r=resource();
    return `${head('HOME BUYING JOURNEY','Buy with more confidence.','A practical guide to preparing, choosing, checking and closing on a home in Canada.')}
    <div class="ec15-guide">
      <section class="ec15-journey-hero">
        <div><div class="ec15-eyebrow">YOUR HOMEOWNERSHIP PLAN</div><h2>From browsing to moving day.</h2><p>Keep your research and actions organized. Take control of the process while knowing when a licensed professional is needed.</p></div>
        <div class="ec15-progress-card"><strong>${completed}<small>/${taskCount}</small></strong><span>Steps checked off</span><div class="ec15-track"><i style="width:${(completed/taskCount*100).toFixed(0)}%"></i></div></div>
      </section>
      <section class="ec15-context card"><label for="ec15-province"><b>Where are you buying?</b><span>Province / territory affects rules and professional requirements.</span></label>
      <select id="ec15-province" onchange="EC15.province(this.value)">${provinceList.map(([code,name])=>`<option value="${code}" ${st.province===code?'selected':''}>${esc15(name)}</option>`).join('')}</select>
      <p>Local guidance: <a href="${r[1]}" target="_blank" rel="noopener noreferrer">${esc15(r[0])} ↗</a></p>
      </section>
      <div class="ec15-guide-layout">
        <nav class="ec15-stages" aria-label="Homebuying stages">${groupNames.map((n,i)=>`<button type="button" class="ec15-stage${i===phase?' active':''}" onclick="EC15.stage(${i})" aria-current="${i===phase?'step':'false'}"><span class="ec15-stage-number">${i+1}</span><span><b>${esc15(n)}</b><small>${counts[i]}/3 complete</small></span></button>`).join('')}</nav>
        <div class="ec15-stage-panel card"><div class="ec15-eyebrow">STAGE ${phase+1} OF 6</div><h2>${esc15(groupNames[phase])}</h2><p class="ec15-intro">${['Start with what fits your life and budget, not just the maximum mortgage amount.','Discover properties and evaluate the whole monthly and upfront cost.','Investigate details before deciding whether a home is right for you.','Understand the commitments, alternatives and risks before signing.','Follow deadlines and obtain reliable reports and written confirmations.','Prepare funds and documents and transition into sustainable homeownership.'][phase]}</p>
        <div class="ec15-task-list">${tasks[phase].map(taskHtml).join('')}</div>
        <div class="ec15-stage-actions"><button class="btn ghost" ${phase===0?'disabled':''} onclick="EC15.stage(${phase-1})">← Back</button><button class="btn" onclick="EC15.stage(${Math.min(phase+1,5)})">${phase===5?'Review final stage':'Next stage →'}</button></div></div>
      </div>
      <section class="ec15-guide-bottom card"><div><div class="ec15-eyebrow">FINANCIAL INTELLIGENCE</div><h2>Make the numbers part of every decision.</h2><p>Find a home and estimate the payment, insurance, taxes and cash needed at closing before you commit.</p></div><div class="ec15-quick-actions"><button class="btn" onclick="go('homes')">Explore Homes</button><button class="btn ghost" onclick="EC13.tab('lab')">Decision Lab</button></div></section>
      <p class="ec15-legal">Self-checked steps are your personal progress, not legal clearance or completed due diligence. EquityClimb is not a brokerage, lawyer, mortgage lender or notary. Requirements vary by province and transaction. Verify important details with the appropriate regulator, lawyer, lender and other professionals.</p>
    </div>`;
  };
  // Add a homebuying entry point without changing any existing financial data or charts.
  if(typeof V.home==='function'){
    const oldHome=V.home;
    V.home=function(){const h=oldHome.apply(this,arguments);if(!S.profile?.onboarded)return h;
      const banner=`<section class="ec15-home-path"><div><div class="ec15-eyebrow">HOMEOWNERSHIP PATH</div><h2>Make your next home decision with confidence.</h2><p>${doneCount()} of ${taskCount} guide tasks completed. From mortgage readiness to closing day, keep your next steps in one place.</p></div><button class="btn" onclick="go('journey')">Open Homebuying Guide →</button></section>`;
      return h.replace(/(<p class="lede">[\s\S]*?<\/p>)/, '$1'+banner);
    };
  }
  // Replace the v10 model selector while keeping v10 chat history and compose controls.
  let catalog=null,catalogRequested=false;
  const basicSlots=[{id:'auto',label:'Auto — select a free model by question',available:true,paid:false},
    {id:'free:fast',label:'Free · Quick',available:true,paid:false},
    {id:'free:balanced',label:'Free · Balanced',available:true,paid:false},
    {id:'free:deep',label:'Free · Detailed',available:true,paid:false}];
  function choices(){return catalog?.slots||basicSlots;}
  function modelSelect(){const models=choices(),selected=models.some(x=>x.id===st.aiModel&&x.available)?st.aiModel:'auto';
    return `<div class="ec15-model-picker"><label for="ec15-model">AI engine</label><select id="ec15-model" onchange="EC15.model(this.value)">${models.map(x=>`<option value="${esc15(x.id)}" ${selected===x.id?'selected':''} ${!x.available?'disabled':''}>${esc15(x.label)}${x.available?'':' — not connected'}</option>`).join('')}</select>
    <div class="ec15-model-note" id="ec15-model-note">${selected==='auto'?'Auto routes by question type using connected Cloudflare models; accuracy is not guaranteed.':'Your choice is shown clearly; paid providers require explicit setup.'}</div>
    <div class="ec15-model-help">Free requests have daily limits. OpenAI and Claude API access is separately billed if the owner opts in. Microsoft consumer Copilot is not a selectable third-party API model.</div></div>`;
  }
  if(typeof V.advisor==='function'){
    const oldAdvisor=V.advisor;
    V.advisor=function(){const h=oldAdvisor.apply(this,arguments),t=document.createElement('template');t.innerHTML=h;
      const p=t.content.querySelector('.ec10-bar .ec10-model');if(p)p.outerHTML=modelSelect();
      const wrap=document.createElement('div');wrap.append(t.content);return wrap.innerHTML;
    };
  }
  async function getModels(){if(catalogRequested)return;catalogRequested=true;
    try{const r=await fetch('/api/ai-catalog',{cache:'no-store'});if(r.ok){catalog=await r.json();const row=choices().find(x=>x.id===st.aiModel);if(row && !row.available){st.aiModel='auto';saveState();}if(typeof cur!=='undefined' && cur==='advisor')render();}}
    catch(_) { /* existing free options remain usable, backend will validate */ }
  }
  // Override only chat requests; all non-chat requests still use the app's original fetch wrapper.
  const priorFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{const u=new URL(typeof input==='string'?input:input.url,location.href);
      if(u.origin===location.origin&&u.pathname==='/api/ai'&&String(init?.method||'').toUpperCase()==='POST'&&typeof init.body==='string'){
        const b=JSON.parse(init.body);
        if(b.mode==='chat'){
          delete b.mode;b.model=st.aiModel||'auto';
          return priorFetch('/api/ai-router',{...init,body:JSON.stringify(b)});
        }
      }
    }catch(_){}
    return priorFetch(input,init);
  };
  window.EC15={
    toggle(id,value){if(!tasks.flat().some(t=>t[0]===id))return;st.done[id]=!!value;saveState();render();},
    stage(n){st.stage=Math.max(0,Math.min(5,Number(n)||0));saveState();render();},
    province(code){if(!provinceList.some(p=>p[0]===code))return;st.province=code;saveState();render();},
    model(m){const row=choices().find(x=>x.id===m);if(!row||!row.available)return;
      st.aiModel=m;saveState();const msg=document.getElementById('ec15-model-note');if(msg)msg.textContent=m==='auto'?'Auto routes by question type using connected Cloudflare models; accuracy is not guaranteed.':`Chosen: ${row.label}${row.paid?' (may incur provider charges)':''}.`;
    },
    ask(id){const q=questionMap[id];if(!q)return;go('advisor');if(window.EC7?.prefill)window.EC7.prefill(q+' My province/territory is '+st.province+'.');}
  };
  getModels();
  if(S.profile?.onboarded){try{render();}catch(_) {}}
})();
