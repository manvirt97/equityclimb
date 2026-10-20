/* EquityClimb v7.2 - sign in with Google, email link, phone number, and optional Microsoft, Yahoo,
   Facebook, GitHub, Apple or X (Firebase Authentication). Loads after ec-v7.js. Fills the sign-in box on
   Settings (and the welcome screen) and hands the signed-in account to the encrypted phone <-> laptop sync. */
(function () {
  'use strict';
  if (window.__ecAuth) return; window.__ecAuth = true;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const LINK_EMAIL = 'ec_email_for_link';
  const A = { cfg: null, auth: null, state: 'idle', mode: 'menu', msg: '', err: '', email: localStorage.getItem(LINK_EMAIL) || '', phone: '', confirm: null, verifier: null, busy: false, inputs: null };
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const signedIn = () => { try { return !!JSON.parse(localStorage.getItem('ec_session') || 'null'); } catch { return false; } };
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(Error('load')); document.head.appendChild(s); });

  // Extra sign-in buttons (each one is switched on by the app owner in Firebase + the SIGNIN_PROVIDERS setting).
  const PROV = {
    microsoft: { label: 'Microsoft (Outlook, Hotmail)', icon: '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>', make: () => { const p = new firebase.auth.OAuthProvider('microsoft.com'); p.setCustomParameters({ prompt: 'select_account' }); p.addScope('email'); return p; } },
    yahoo: { label: 'Yahoo', icon: '<span class="ec-a-ic" style="color:#7B1FA2;font-weight:800">Y!</span>', make: () => { const p = new firebase.auth.OAuthProvider('yahoo.com'); p.addScope('email'); return p; } },
    facebook: { label: 'Facebook', icon: '<span class="ec-a-ic" style="color:#1877F2;font-weight:800">f</span>', make: () => { const p = new firebase.auth.FacebookAuthProvider(); p.addScope('email'); return p; } },
    github: { label: 'GitHub', icon: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.7-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .5z"/></svg>', make: () => { const p = new firebase.auth.GithubAuthProvider(); p.addScope('user:email'); return p; } },
    apple: { label: 'Apple', icon: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8A4.7 4.7 0 004.1 9.5c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a10 10 0 001.4-2.8c-.1 0-2.7-1-2.7-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z"/></svg>', make: () => { const p = new firebase.auth.OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p; } },
    twitter: { label: 'X (Twitter)', icon: '<span class="ec-a-ic" style="font-weight:800;color:var(--ink)">X</span>', make: () => new firebase.auth.TwitterAuthProvider() }
  };

  async function start() {
    try { A.cfg = await (await fetch('/api/config', { cache: 'no-store' })).json(); } catch { A.cfg = null; }
    if (!A.cfg?.syncReady || !A.cfg.firebase) { paint(); return; }
    if (/[?&](oobCode|apiKey)=/.test(location.href)) await boot();
    paint();
  }
  async function boot() {
    if (A.auth || A.state === 'loading') return;
    A.state = 'loading'; paint();
    try {
      if (!window.firebase?.auth) { await loadScript(SDK + 'firebase-app-compat.js'); await loadScript(SDK + 'firebase-auth-compat.js'); }
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(A.cfg.firebase);
      A.auth = app.auth(); A.auth.useDeviceLanguage();
      await A.auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(() => {});
      A.state = 'ready';
      if (A.auth.isSignInWithEmailLink(location.href)) await finishLink(location.href, true);
    } catch (err) { A.state = 'failed'; A.err = 'Sign-in couldn\u2019t load. Check your connection (or ad-blocker) and tap Try again.'; }
    paint();
  }

  // Firebase account -> EquityClimb sync session
  async function exchange(user) {
    const tok = await user.getIdToken();
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firebaseToken: tok }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(j.error || 'Sign-in failed');
    localStorage.setItem('ec_session', JSON.stringify({ token: j.token, email: j.email, name: j.name }));
    localStorage.removeItem(LINK_EMAIL);
    try { await A.auth.signOut(); } catch {}
    A.mode = 'menu'; A.msg = ''; A.err = ''; A.confirm = null;
    if (window.EC7?.toast) EC7.toast('Signed in. Syncing your numbers\u2026');
    if (window.EC7?.syncNow) await EC7.syncNow(); else location.reload();
  }
  const friendly = err => {
    const c = err?.code || '';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' || c === 'auth/user-cancelled') return '';
    if (c === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site, or use the email option.';
    if (c === 'auth/unauthorized-domain') return 'This web address isn\u2019t approved yet. The app owner must add it in Firebase \u2192 Authentication \u2192 Settings \u2192 Authorized domains.';
    if (c === 'auth/operation-not-allowed') return 'This sign-in method isn\u2019t switched on yet. Please choose another option.';
    if (c === 'auth/account-exists-with-different-credential') return 'You already signed in with this email using a different option (for example Google). Please use that option.';
    if (c === 'auth/invalid-email') return 'That email address doesn\u2019t look right.';
    if (c === 'auth/invalid-action-code' || c === 'auth/expired-action-code') return 'That sign-in link has expired or was already used. Send a new one.';
    if (c === 'auth/invalid-phone-number') return 'Enter your phone number with area code, e.g. 403 555 1234.';
    if (c === 'auth/invalid-verification-code') return 'That code isn\u2019t right. Check the text message and try again.';
    if (c === 'auth/too-many-requests' || c === 'auth/quota-exceeded') return 'Too many attempts. Please wait a few minutes and try again.';
    if (c === 'auth/billing-not-enabled') return 'Phone sign-in isn\u2019t available yet. Please use another option.';
    if (c === 'auth/network-request-failed') return 'No connection. Check your internet and try again.';
    return err?.message || 'Something went wrong. Please try again.';
  };
  const val = id => (A.inputs?.[id] ?? document.getElementById(id)?.value ?? '');
  async function run(fn) {
    if (A.busy) return;
    A.inputs = {}; document.querySelectorAll('.ec-a input').forEach(i => { if (i.value) A.inputs[i.id] = i.value; });
    A.busy = true; A.err = ''; paint();
    try { await fn(); } catch (err) { A.err = friendly(err); }
    A.busy = false; A.inputs = null; paint();
  }

  /* ---------- sign-in actions ---------- */
  const W = window.ECAuth = {};
  W.retry = () => { A.state = 'idle'; A.err = ''; boot(); };
  W.mode = m => { A.mode = m; A.err = ''; A.msg = ''; paint(); };
  W.google = () => run(async () => {
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    const res = await A.auth.signInWithPopup(p); await exchange(res.user);
  });
  W.provider = key => run(async () => { const res = await A.auth.signInWithPopup(PROV[key].make()); await exchange(res.user); });
  W.sendLink = () => run(async () => {
    const em = val('ec-a-email').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) throw { code: 'auth/invalid-email' };
    await A.auth.sendSignInLinkToEmail(em, { url: location.origin + '/?signin=email', handleCodeInApp: true });
    A.email = em; localStorage.setItem(LINK_EMAIL, em); A.mode = 'emailSent';
  });
  async function finishLink(link, fromUrl) {
    let em = A.email || localStorage.getItem(LINK_EMAIL);
    if (!em) em = (prompt('To finish signing in, type the email address the link was sent to:') || '').trim().toLowerCase();
    if (!em) return;
    try {
      const res = await A.auth.signInWithEmailLink(em, link);
      if (fromUrl) history.replaceState(null, '', location.pathname + '#settings');
      await exchange(res.user);
    } catch (err) { A.err = friendly(err); if (fromUrl) history.replaceState(null, '', location.pathname + '#settings'); }
  }
  W.pasteLink = () => run(async () => {
    const link = val('ec-a-link').trim();
    if (!A.auth.isSignInWithEmailLink(link)) throw Error('That doesn\u2019t look like the sign-in link. In the email, press and hold the button, choose Copy Link, then paste it here.');
    await finishLink(link, false);
  });
  W.sendCode = () => run(async () => {
    let d = val('ec-a-phone').trim().replace(/[^\d+]/g, '');
    if (!d.startsWith('+')) d = d.length === 10 ? '+1' + d : d.length === 11 && d.startsWith('1') ? '+' + d : d;
    if (!/^\+\d{8,15}$/.test(d)) throw { code: 'auth/invalid-phone-number' };
    let host = document.getElementById('ec-recaptcha');
    if (!host) { host = document.createElement('div'); host.id = 'ec-recaptcha'; document.body.appendChild(host); }
    if (!A.verifier) A.verifier = new firebase.auth.RecaptchaVerifier('ec-recaptcha', { size: 'invisible' });
    try { A.confirm = await A.auth.signInWithPhoneNumber(d, A.verifier); }
    catch (err) { try { A.verifier.clear(); } catch {} A.verifier = null; host.innerHTML = ''; throw err; }
    A.phone = d; A.mode = 'phoneCode';
  });
  W.verifyCode = () => run(async () => {
    const code = val('ec-a-code').replace(/\D/g, '');
    if (code.length !== 6) throw { code: 'auth/invalid-verification-code' };
    const res = await A.confirm.confirm(code); await exchange(res.user);
  });

  /* ---------- the sign-in box ---------- */
  const G = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>';
  function box() {
    if (A.state === 'failed') return `<div class="small warn">${e(A.err)} <a href="#" onclick="ECAuth.retry();return false">Try again</a></div>`;
    if (A.state !== 'ready') return `<div class="small mute">Loading sign-in options\u2026</div>`;
    const err = A.err ? `<div class="small warn ec-a-err">${e(A.err)}</div>` : '', dis = A.busy ? 'disabled' : '';
    if (A.mode === 'emailSent') return `<div class="ec-a">
      <div class="note"><b>Check your email.</b> We sent a sign-in link to <b>${e(A.email)}</b>. Open it on <b>this device</b> and tap the link. Check your spam folder if it isn\u2019t there in a minute.</div>
      <div class="small mute" style="margin-top:10px">Using the home-screen app on iPhone? The link may open in Safari instead. In the email, press and hold the link, choose <b>Copy Link</b>, then paste it here:</div>
      <div class="ec-a-row"><input id="ec-a-link" type="url" placeholder="Paste the sign-in link"><button class="btn sm" ${dis} onclick="ECAuth.pasteLink()">Sign in</button></div>${err}
      <a href="#" class="small" onclick="ECAuth.mode('email');return false">Use a different email or resend</a></div>`;
    if (A.mode === 'email') return `<div class="ec-a"><label>Your email address</label>
      <div class="ec-a-row"><input id="ec-a-email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${e(A.email)}" onkeydown="if(event.key==='Enter')ECAuth.sendLink()"><button class="btn sm" ${dis} onclick="ECAuth.sendLink()">${A.busy ? 'Sending\u2026' : 'Email me a link'}</button></div>
      <div class="small mute">No password needed. We\u2019ll email you a link that signs you in. Works with any email (Gmail, Outlook, Yahoo, work email and more).</div>${err}
      <a href="#" class="small" onclick="ECAuth.mode('menu');return false">\u2190 Other options</a></div>`;
    if (A.mode === 'phone') return `<div class="ec-a"><label>Your mobile number</label>
      <div class="ec-a-row"><input id="ec-a-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="403 555 1234" value="${e(A.phone)}" onkeydown="if(event.key==='Enter')ECAuth.sendCode()"><button class="btn sm" ${dis} onclick="ECAuth.sendCode()">${A.busy ? 'Sending\u2026' : 'Text me a code'}</button></div>
      <div class="small mute">We\u2019ll text you a 6-digit code. Standard message rates may apply. Outside Canada/US, start with + and your country code.</div>${err}
      <a href="#" class="small" onclick="ECAuth.mode('menu');return false">\u2190 Other options</a></div>`;
    if (A.mode === 'phoneCode') return `<div class="ec-a"><label>Enter the 6-digit code sent to ${e(A.phone)}</label>
      <div class="ec-a-row"><input id="ec-a-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" onkeydown="if(event.key==='Enter')ECAuth.verifyCode()"><button class="btn sm" ${dis} onclick="ECAuth.verifyCode()">${A.busy ? 'Checking\u2026' : 'Sign in'}</button></div>${err}
      <a href="#" class="small" onclick="ECAuth.mode('phone');return false">Didn\u2019t get it? Send again</a></div>`;
    const extra = (A.cfg.providers || []).filter(k => PROV[k]).map(k => `<button class="ec-a-btn" ${dis} onclick="ECAuth.provider('${k}')">${PROV[k].icon}<span>Continue with ${e(PROV[k].label)}</span></button>`).join('');
    return `<div class="ec-a">
      <button class="ec-a-btn" ${dis} onclick="ECAuth.google()">${G}<span>Continue with Google</span></button>
      <button class="ec-a-btn" ${dis} onclick="ECAuth.mode('email')"><span class="ec-a-ic">\u2709</span><span>Continue with email</span></button>
      ${A.cfg.phoneEnabled ? `<button class="ec-a-btn" ${dis} onclick="ECAuth.mode('phone')"><span class="ec-a-ic">\u260E</span><span>Continue with phone number</span></button>` : ''}
      ${extra}${err}</div>`;
  }
  function paint() {
    const slots = document.querySelectorAll('.ec-gsi');
    if (!slots.length || signedIn()) return;
    if (A.cfg?.syncReady && A.cfg.firebase && A.state === 'idle') { boot(); return; }
    const html = box();
    slots.forEach(el => { if (el.dataset.ecA !== html) { el.innerHTML = html; el.dataset.ecA = html; el.dataset.done = 1; } });
  }

  const r0 = window.render;
  window.render = function () { r0.apply(this, arguments); try { paint(); } catch (err) { console.error(err); } };
  const css = document.createElement('style');
  css.textContent = `.ec-a{display:flex;flex-direction:column;gap:10px;max-width:380px}
.ec-a-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px 16px;border-radius:999px;border:1px solid var(--line2);background:var(--bg);color:var(--ink);font-weight:600;font-size:14.5px;cursor:pointer}
.ec-a-btn:hover:not([disabled]){border-color:var(--accent)}.ec-a-btn[disabled]{opacity:.6;cursor:default}
.ec-a-ic{font-size:17px;line-height:1;color:var(--accent);min-width:17px;text-align:center}
.ec-a-row{display:flex;gap:8px}.ec-a-row input{flex:1;min-width:0}
.ec-a label{margin:0}.ec-a-err{margin-top:2px}`;
  document.head.appendChild(css);
  start();
})();
