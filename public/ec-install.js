/* Equity Climb: optional, non-destructive home-screen installation help. */
(function(){
 'use strict';
 if(window.__ecInstall || typeof V==='undefined' || typeof V.settings!=='function')return;
 window.__ecInstall=true;
 var deferred=null,ua=navigator.userAgent||'';
 var ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
 var android=/Android/i.test(ua);
 var installed=function(){return !!(navigator.standalone||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches));};
 function instructions(){
  if(installed())return 'Already installed. Open Equity Climb from your Home Screen.';
  if(ios)return 'In Safari, tap Share, select Add to Home Screen, then Add. If offered, enable Open as Web App.';
  if(android)return 'In Chrome, tap the three-dot menu and choose Install app or Add to Home screen.';
  return 'In Chrome or Edge, choose Install from the browser menu or address-bar install icon.';
 }
 function update(){
  var hint=document.getElementById('ec-install-hint'),btn=document.getElementById('ec-install-button');
  if(hint)hint.textContent=instructions();
  if(btn)btn.hidden=!deferred||installed();
 }
 var previous=V.settings;
 V.settings=function(){
  var html=previous.apply(this,arguments);
  setTimeout(update,0);
  return html+'<section class="card ec-install-card" aria-labelledby="ec-install-title">'+
   '<h2 id="ec-install-title">Install Equity Climb for free</h2>'+
   '<p class="small mute">Keep Equity Climb on your iPhone or Android Home Screen, without either app store.</p>'+
   '<p id="ec-install-hint" class="small" role="status">'+instructions()+'</p>'+
   '<div class="row"><button id="ec-install-button" class="btn" type="button" onclick="ECInstall.start()" hidden>Install app</button>'+
   '<a class="btn ghost" href="/install.html">Step-by-step installation guide</a></div>'+
   '<p class="small mute">Using guest mode? Export a backup first. On iPhone, Safari and a Home Screen app may use separate storage.</p>'+
   '</section>';
 };
 window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;update();});
 window.addEventListener('appinstalled',function(){deferred=null;update();});
 window.addEventListener('pageshow',update);
 window.ECInstall={start:async function(){
   if(!deferred||installed()){update();return;}
   var p=deferred;deferred=null;
   try{await p.prompt();await p.userChoice;}catch(_){}
   update();
 },instructions:instructions,update:update};
})();
