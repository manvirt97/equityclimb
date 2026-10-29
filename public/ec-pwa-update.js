/* EquityClimb 16.8 — safe iPhone Home Screen update detection.
 * Does not modify financial data, account sync, routes, or view layouts. */
(()=>{
 'use strict';
 const BUILD='16.8.0', META='/release.json', SW='./sw.js';
 let lastCheck=0, checking=null, announced='', activationSeen=false, reg=null;
 const navSW=navigator.serviceWorker;
 const hadController=!!navSW?.controller;
 const editable=()=>!!document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]');
 const canUpdate=()=>navigator.onLine!==false;
 const output=(message)=>{
   let node=document.getElementById('ec-update-notice');
   if(!node){
     node=document.createElement('aside');
     node.id='ec-update-notice';node.className='ec-update-notice';
     node.setAttribute('role','status');
     node.setAttribute('aria-live','polite');
     (document.body||document.documentElement).append(node);
   }
   node.textContent='';
   const p=document.createElement('p');p.textContent=message;node.append(p);
   const btn=document.createElement('button');btn.type='button';btn.textContent='Reload updated app';
   btn.addEventListener('click',()=>refreshNow(announced||BUILD));
   node.append(btn);
   const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='ec-update-dismiss';
   dismiss.textContent='Later';dismiss.setAttribute('aria-label','Dismiss update notice');
   dismiss.addEventListener('click',()=>node.remove());node.append(dismiss);
 };
 const versionParts=s=>String(s).split('.').map(x=>Number(x)||0);
 const newer=(a,b)=>{const A=versionParts(a),B=versionParts(b);for(let i=0;i<Math.max(A.length,B.length);i++){if((A[i]||0)!==(B[i]||0))return (A[i]||0)>(B[i]||0);}return false;};
 function refreshNow(version){
   if(!canUpdate()){output('Connect to the internet to update EquityClimb. Your saved data is unchanged.');return;}
   const url=new URL(location.href);
   // Cache-bust the installed app's *navigation*, not user storage.
   url.searchParams.set('ec_build',String(version||BUILD));
   if(url.href===location.href){url.searchParams.set('ec_refresh',String(Date.now()));}
   try{sessionStorage.setItem('ec_update_requested',String(version||BUILD));}catch(_){}
   location.replace(url.href);
 }
 async function check(force=false){
   if(!canUpdate())return null;
   if(checking)return checking;
   if(!force&&Date.now()-lastCheck<60*1000)return null;
   lastCheck=Date.now();
   checking=(async()=>{
     try{
       // HTTP response and SW/browser caches must both be bypassed.
       const res=await fetch(META+'?t='+Date.now(),{cache:'no-store'});
       if(!res.ok)throw Error('metadata unavailable');
       const latest=await res.json();
       if(typeof latest.version==='string'&&newer(latest.version,BUILD)){
         announced=latest.version;
         // The user decides when to restart; edits in progress are never discarded.
         output('A newer EquityClimb version is available. Update without deleting your app or saved financial information.');
       }
     }catch(_){/* Offline or blocked requests do not interrupt the financial app. */}
     try{
       reg=reg||await navSW?.getRegistration?.();
       await reg?.update?.();
     }catch(_){/* Installed app can continue if SW update is unavailable. */}
   })();
   try{return await checking;}finally{checking=null;}
 }
 if(navSW){
   navSW.addEventListener('controllerchange',()=>{
     if(!hadController||activationSeen)return;
     activationSeen=true;
     // Avoid automatic reloads while users are entering or reviewing financial information.
     if(!editable())output('EquityClimb has downloaded an update. Reload to use the latest rates and fixes.');
     else output('An EquityClimb update is ready. Save your current entry, then reload.');
   });
   navSW.addEventListener('message',e=>{
     if(hadController&&e.data?.type==='EQUITYCLIMB_UPDATED'){
       output('A new EquityClimb version is ready. Reload to see the latest verified rates.');
     }
   });
   // Register promptly. A late geolocation/API response must not postpone SW updates.
   navSW.register(SW,{updateViaCache:'none'}).then(r=>{reg=r;check(true);}).catch(()=>check(true));
 }else check(true);
 window.addEventListener('pageshow',()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(true);});
 window.addEventListener('focus',()=>check());
 window.addEventListener('online',()=>check(true));
 window.setInterval(()=>{if(!document.hidden)check();},5*60*1000);
 window.ECPWA={check:()=>check(true),getVersion:()=>BUILD,refresh:()=>refreshNow(announced||BUILD)};
})();
