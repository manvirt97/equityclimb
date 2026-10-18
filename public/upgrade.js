/* EquityClimb v4 market intelligence + refresh controller */
(() => {
  'use strict';
  const CATS = {
    realestate:{label:'Real Estate',why:'Potential impact on housing demand, supply, pricing, rents or development activity.'},
    corpdev:{label:'Corp Dev',why:'Relevant to transactions, partnerships, capital allocation or strategic growth.'},
    capital:{label:'Capital Markets',why:'Relevant to earnings, financing, investor expectations or cost of capital.'},
    opportunities:{label:'Opportunities',why:'May signal a project, procurement, investment or development opportunity.'},
    finance:{label:'Finance & Rates',why:'May affect borrowing costs, affordability, investment returns or market sentiment.'},
    government:{label:'Government',why:'May change policy, tax, regulation, incentives, zoning or housing economics.'}
  };
  const SCOPES={local:'Local',province:'Province',national:'Canada',global:'Global'};
  let intelCat='realestate', intelScope='local', refreshing=false, statusTimer;
  const mem={};
  const key=()=>`intel_${intelCat}_${intelScope}_${area()}`;
  const read=()=>{try{return JSON.parse(localStorage.getItem('ec_'+key())||'null')}catch{return null}};
  const write=v=>localStorage.setItem('ec_'+key(),JSON.stringify({t:Date.now(),...v}));
  const fmtTime=d=>new Date(d).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const age=d=>ago(d);
  const why=(item)=>item.why||CATS[item.category||intelCat]?.why||'Relevant to the selected market-intelligence category.';

  function storyList(items){
    if(!items?.length)return `<div class="feed-state">No relevant stories found in this check. Try another category or geography.</div>`;
    return items.map(n=>`<article class="story fade-in">
      <div class="story-top"><span class="story-cat">${esc(CATS[n.category]?.label||CATS[intelCat].label)}</span><span class="story-source">${esc(n.source)}</span><span class="story-age">${age(n.date)}</span></div>
      <a class="story-title" href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>
      <div class="story-why"><b>Why it matters:</b> ${esc(why(n))}</div>
    </article>`).join('');
  }
  function setStatus(text,cls=''){
    const el=document.getElementById('intel-status');if(!el)return;el.className='refresh-status '+cls;el.textContent=text;
  }
  function setButton(mode){
    const b=document.getElementById('intel-refresh');if(!b)return;
    b.classList.toggle('refreshing',mode==='loading');b.classList.toggle('success',mode==='success');b.disabled=mode==='loading';
    b.innerHTML=`${ic(mode==='success'?'refresh':'refresh')}<span>${mode==='loading'?'Checking…':mode==='success'?'Updated':'Refresh'}</span>`;
  }
  function renderCached(){
    const c=read(),box=document.getElementById('intel-news');if(!box)return null;
    if(c?.items?.length){box.innerHTML=storyList(c.items);setStatus(`Last checked ${fmtTime(c.fetched||c.t)}`);}
    return c;
  }
  async function requestIntel(force=false){
    if(refreshing)return;refreshing=true;
    if(force){setButton('loading');setStatus('Checking live sources…');}
    const q=new URLSearchParams({scope:intelScope,category:intelCat,city:S.profile.city,region:S.profile.region,country:S.profile.country});
    if(force)q.set('refresh',String(Date.now()));
    let result;
    try{
      result=await api('/api/news?'+q.toString(),force?{cache:'no-store'}:undefined);
      if(result.error&&!result.items?.length)throw new Error(result.error);
      const previous=read()?.items||[];
      const oldLinks=new Set(previous.map(x=>x.link));
      const fresh=result.items||[]; const newCount=fresh.filter(x=>!oldLinks.has(x.link)).length;
      mem[key()]=result;write({items:fresh,fetched:result.fetched||new Date().toISOString(),sourceStatus:result.sourceStatus||[]});
      const box=document.getElementById('intel-news');if(box)box.innerHTML=storyList(fresh);
      setStatus(`Checked just now · ${newCount} new ${newCount===1?'story':'stories'}`,'ok');setButton('success');
      clearTimeout(statusTimer);statusTimer=setTimeout(()=>{setButton('idle');setStatus(`Last checked ${fmtTime(Date.now())}`)},2600);
      refreshBrief(fresh,force);
    }catch(e){setButton('idle');setStatus('Could not refresh · showing last update','fail');}
    refreshing=false;
  }
  async function refreshBrief(items,force){
    const el=document.getElementById('intel-brief');if(!el)return;
    try{
      const rates=RATES?Object.fromEntries(['prime','policy','bond5','fiveYearPosted'].filter(k=>RATES[k]).map(k=>[k,RATES[k].value+'%'])):{};
      const b=await api('/api/ai',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'brief',area:area(),goal:GOALS[S.profile.goal].t,rates,headlines:(items||[]).slice(0,12)})});
      if(!b.error)el.innerHTML=briefHtml(b,false);
    }catch{}
  }

  window.intelSelectCat=(c)=>{intelCat=c;render()};
  window.intelSelectScope=(s)=>{intelScope=s;render()};
  window.intelRefresh=()=>requestIntel(true);

  V.market=()=>{
    setTimeout(()=>{
      const cached=renderCached();
      if(!cached)document.getElementById('intel-news').innerHTML=loading(5);
      if(!cached||Date.now()-(cached.t||0)>5*60*1000)requestIntel(false);
      else refreshBrief(cached.items,false);
    },0);
    const daily=`${CATS[intelCat].label} intelligence for ${intelScope==='local'?(S.profile.city||'your city'):intelScope==='province'?(S.profile.region||'your province'):SCOPES[intelScope]}.`;
    return `${head('Market Intelligence','Signals that matter',`Real estate, transactions, capital markets, business opportunities and policy—translated into practical implications.`)}
      <section class="card intel-hero"><div class="intel-kicker"><span class="dot"></span>Daily brief</div><div class="intel-title">${esc(daily)} Live sources are ranked by relevance, importance and recency.</div>
      <div class="signal-row"><span class="signal-pill">Prime ${prime()?pct(prime(),2):'—'}</span><span class="signal-pill">Your rate ${pct(S.rate,2)}</span><span class="signal-pill">${esc(area())}</span></div></section>
      <div class="intel-toolbar"><div class="geo-tabs">${Object.entries(SCOPES).map(([k,l])=>`<button class="geo-tab ${intelScope===k?'on':''}" onclick="intelSelectScope('${k}')">${l}</button>`).join('')}</div>
      <div class="refresh-wrap"><span id="intel-status" class="refresh-status">Ready</span><button id="intel-refresh" class="btn ghost sm refresh-btn" onclick="intelRefresh()">${ic('refresh')}<span>Refresh</span></button></div></div>
      <div class="intel-tabs">${Object.entries(CATS).map(([k,v])=>`<button class="intel-tab ${intelCat===k?'on':''}" onclick="intelSelectCat('${k}')">${v.label}</button>`).join('')}</div><div class="sp"></div>
      <div class="intel-layout"><section class="card news"><div class="head"><div><h2>${CATS[intelCat].label}</h2><div class="small mute">Published time and last-checked time are shown separately.</div></div></div><div id="intel-news">${loading(5)}</div></section>
      <aside><section class="card"><h2>What it means</h2><div class="small mute" style="margin-bottom:12px">Grounded in the retrieved headlines and current rates</div><div id="intel-brief">${loading(4)}</div></section><div class="sp"></div>
      <section class="card"><h2>Your position</h2><div class="mini-metric"><div class="label">Mortgage rate</div><div class="value">${pct(S.rate,2)} · ${esc(S.rtype)}</div></div><div class="mini-metric"><div class="label">Trigger headroom</div><div class="value">${(S.trigger-S.rate).toFixed(2)} percentage points</div></div><div class="mini-metric"><div class="label">Market location</div><div class="value">${esc(area())}</div></div></section></aside></div>
      <div class="sp"></div>${homeScenarios()}
      <p class="foot">Sources may include Google News, CBC, Global News and official public-sector feeds. AI interpretation is general information, not a forecast or recommendation. Open the original source before making a decision.</p>`;
  };
  setTimeout(()=>{if(S.profile?.onboarded&&cur==='market')render()},0);
})();
