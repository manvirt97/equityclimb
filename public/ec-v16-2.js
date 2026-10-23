/* EquityClimb v16.2: transparent math, honest deep refresh, theme-aware mobile chrome. */
(()=>{
'use strict';
if(window.__ec162||typeof S==='undefined'||typeof V==='undefined')return;
window.__ec162=true;
const label=String;
let refreshing=false;
const subjects=['all','realestate','corpdev','capital','opportunities','finance','government'];
const geos=['local','province','national','global'];
function paint(message,progress,phase){
  const status=document.getElementById('ec162-refresh-status');
  if(status){status.textContent=message;status.dataset.phase=phase||'work';status.setAttribute('role','status');}
  const old=document.getElementById('ec162-refresh-progress');
  if(old){old.textContent=message;old.dataset.phase=phase||'work';old.style.setProperty('--progress',`${progress}%`);}
  document.querySelectorAll('button[onclick*="EC162.refreshAll"]').forEach(button=>{
    button.disabled=refreshing;button.classList.toggle('ec162-refresh-busy',refreshing);
    button.textContent=refreshing?'⟳ Refreshing…':phase==='done'?'✓ Refresh all live data':'⟳ Refresh all live data';
    button.setAttribute('aria-busy',String(refreshing));
  });
}
function notice(){
 let box=document.getElementById('ec162-refresh-progress');if(box)return box;
 box=document.createElement('aside');box.id='ec162-refresh-progress';box.className='ec162-refresh-progress';
 box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.style.setProperty('--progress','0%');
 document.body.append(box);return box;
}
async function getJSON(path){
 const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
 const j=await r.json();if(j.error)throw Error(label(j.error).slice(0,100));return j;
}
function appArea(){return [S.profile?.city,S.profile?.region].filter(Boolean).join(', ')||'Canada';}
function put(key,value){try{cache.set(key,value);}catch(e){throw Error('Browser storage unavailable');}}
function prefetchTasks(){
 const city=S.profile?.city||'Calgary',region=S.profile?.region||'Alberta',country=S.profile?.country||'CA',area=appArea();
 const opts=S.ec7?.market||{scope:'local',cat:'all'};
 const tasks=[];
 tasks.push({title:'Canadian rules',fn:async()=>{const j=await getJSON('/api/rules?year='+new Date().getFullYear());if(j.year){put('rules7_'+j.year,j);}return j;}});
 tasks.push({title:'Mortgage rates',fn:async()=>{const j=await getJSON('/api/rates');if(!j.prime)throw Error('Rates unavailable');put('rates',j);RATES=j;applyRates();}});
 // Prepare each geography tab and each topic tab, without making AI queries or overwriting user data.
 const pairs=new Map();const add=(scope,category)=>pairs.set(scope+'_'+category,[scope,category]);
 geos.forEach(s=>add(s,'all'));
 subjects.forEach(c=>add(opts.scope||'local',c));
 add(opts.scope||'local',opts.cat||'all');
 for(const [scope,category] of pairs.values()){
  tasks.push({title:`${scope} · ${category}`,fn:async()=>{
   const q=new URLSearchParams({scope,category,city,region,country});
   const j=await getJSON('/api/news?'+q);
   if(!Array.isArray(j.items))throw Error('Missing stories');
   put(`m8_${scope}_${category}_${area}`,{items:j.items,message:j.message||''});
   if(category==='all'&&['local','national','global'].includes(scope)){
     put('news_'+scope+area,j.items);if(typeof NEWS!=='undefined')NEWS[scope]=j.items;
   }
  }});
 }
 tasks.push({title:'Deal tracker',fn:async()=>{const j=await getJSON('/api/news?'+new URLSearchParams({mode:'deals',region}));if(!Array.isArray(j.deals))throw Error('Deal data unavailable');put('deals8_'+region,j.deals);}});
 // Lessons, offline calculators and navigation are already bundled as local files.
 return tasks;
}
async function refreshAll(){
 if(refreshing)return;
 refreshing=true;notice();paint('Connecting to rates and news…',2,'work');
 const tasks=prefetchTasks();let done=0;const failures=[];
 // Small bounded concurrency avoids overflowing the news provider; count each completed request.
 let index=0;
 async function worker(){while(index<tasks.length){const job=tasks[index++];
   try{await job.fn();}catch(e){failures.push(job.title);}
   done++;
   paint(`Preparing ${done} of ${tasks.length}: ${job.title}${failures.length?' · some sources unavailable':''}`,Math.round(done/tasks.length*100),'work');
 }}
 await Promise.all(Array.from({length:Math.min(3,tasks.length)},()=>worker()));
 refreshing=false;
 const succeeded=tasks.length-failures.length;
 const msg=failures.length?`${succeeded}/${tasks.length} sources prepared. ${failures.length} unavailable; existing saved results remain. AI insights load when opened.`:
  `Ready: ${succeeded} sources prepared, including market topics and Canadian rules. AI insights load when opened.`;
 paint(msg,100,failures.length?'partial':'done');
 // Do not navigate the user away from Settings, nor claim a successful refresh if any source failed.
 if(!failures.length&&typeof render==='function'&&typeof cur!=='undefined'&&cur==='settings')render();
 // Keep the result readable; dismiss manually with click or the next refresh rather than a brief toast.
 const panel=document.getElementById('ec162-refresh-progress');
 if(panel){panel.dataset.phase=failures.length?'partial':'done';panel.tabIndex=0;panel.title='Tap to dismiss';panel.addEventListener('click',()=>panel.remove(),{once:true});}
}
function syncChrome(){
 const dark=document.documentElement.dataset.theme==='dark';
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#0E141D':'#F6F7F7');
 const apple=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
 if(apple)apple.setAttribute('content',dark?'black-translucent':'default');
}
new MutationObserver(syncChrome).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
syncChrome();
// Settings can be rebuilt on any render; restore the last completed notification when needed.
const oldRender=window.render;
window.render=function(){const value=oldRender.apply(this,arguments);syncChrome();return value;};
window.EC162={refreshAll};
})();
