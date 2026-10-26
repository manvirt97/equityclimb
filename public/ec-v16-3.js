/* EquityClimb 16.3 — theme consistency, navigational return, preferred mobile defaults. */
(()=>{
 'use strict';
 if(window.__ec163||typeof S==='undefined'||typeof V==='undefined')return;
 window.__ec163=true;
 const DEFAULT_PINS=['budget','homes','advisor','market'];
 const OLD_DEFAULT=['budget','homes','advisor','goals'];
 const state=S.ec16||{};
 // Upgrade only a known, previously shipped default. User-selected tab layouts remain untouched.
 if(!Array.isArray(state.pins)||state.pins.length!==4||state.pins.every((v,i)=>v===OLD_DEFAULT[i])){
   state.pins=[...DEFAULT_PINS];
   try{save();}catch(_){}
 }
 const routeLabels={home:'Home',budget:'Budget',debt:'Mortgage',wealth:'Investing',goals:'Goals',homes:'Real Estate',journey:'Buying guide',learn:'Learn',advisor:'AI Copilot',areas:'Neighbourhoods',market:'Markets',readiness:'Home readiness',canada:'Canadian toolkit',report:'Financial report',profile:'Profile',settings:'Settings',more:'More',plan:'Financial planning'};
 const stack=[];
 const originalGo=window.go;
 const originalRender=window.render;
 if(typeof originalGo!=='function'||typeof originalRender!=='function')return;
 function activeRoute(){return typeof cur==='string'?cur:'home';}
 function navLabel(id){return routeLabels[id]||'previous page';}
 function addBackButton(){
   const page=document.getElementById('view');if(!page||!S.profile?.onboarded||page.querySelector('.ec163-backbar'))return;
   const now=activeRoute();if(now==='home')return;
   // At a direct deep link, return to Home. Otherwise restore the actual prior in-app page.
   const previous=stack.length?stack[stack.length-1].route:'home';
   const container=document.createElement('div');container.className='ec163-backbar';
   const button=document.createElement('button');button.type='button';button.className='ec163-back';
   button.setAttribute('aria-label',`Go back to ${navLabel(previous)}`);
   button.innerHTML='<span aria-hidden="true">←</span><span>Back</span>';
   button.onclick=()=>back();
   const where=document.createElement('span');where.className='ec163-back-context';where.textContent=navLabel(previous);
   container.append(button,where);page.prepend(container);
 }
 function back(){
   const destination=stack.pop()||{route:'home',tab:null};
   originalGo.call(window,destination.route,destination.tab||undefined);
   addBackButton();
 }
 window.go=function(route,tab){
   const from=activeRoute();
   if(route!==from && routeLabels[route]){
      stack.push({route:from,tab:(typeof pTab!=='undefined'?pTab:null)});
      if(stack.length>25)stack.shift();
   }
   const result=originalGo.apply(this,arguments);
   addBackButton();
   return result;
 };
 const oldSettings=V.settings;
 V.settings=function(){
   const template=document.createElement('template');template.innerHTML=oldSettings.apply(this,arguments);
   const preferences=template.content.querySelector('.ec16-preferences');
   if(preferences){
     const row=document.createElement('div');row.className='ec163-default-nav';
     row.innerHTML='<div><strong>Suggested phone tabs</strong><small>Home · Budget · Real Estate · AI Copilot · Markets · More. You can still pick your own shortcuts above.</small></div><button type="button" class="ec16-soft-button" onclick="EC163.resetNav()">Use these tabs</button>';
     preferences.append(row);
   }
   const wrap=document.createElement('div');wrap.append(template.content);return wrap.innerHTML;
 };
 window.render=function(){
   const value=originalRender.apply(this,arguments);
   addBackButton();
   return value;
 };
 const viewNode=document.getElementById('view');
 // Older screens sometimes schedule a repaint through a captured legacy render reference.
 // Keep the Back control present after those repaints without changing screen content.
 if(viewNode)new MutationObserver(()=>{if(!viewNode.querySelector('.ec163-backbar'))addBackButton();}).observe(viewNode,{childList:true});
 window.EC163={back,resetNav(){state.pins=[...DEFAULT_PINS];state.landing='home';try{save();}catch(_){}render();}};
 // Repaint Settings once so the new shortcut-reset control appears on upgrade.
 try{render();}catch(err){console.warn('EquityClimb navigation enhancement unavailable',err);}
})();
