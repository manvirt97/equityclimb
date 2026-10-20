// POST /api/auth { credential } -> checks the Google sign-in with Google, then gives the app a 60-day session.
// We only keep a private ID for the account (never the Google password; Google never shares it).
import { ready, makeSession, json } from '../_shared/session.js';
export async function onRequestPost({ request, env }) {
  if (!ready(env)) return json({ error: 'Sync is not set up yet.' }, 503);
  // Installed phone apps use Google's "redirect" sign-in, which posts a form here instead of JSON.
  const isForm = /application\/x-www-form-urlencoded/i.test(request.headers.get('content-type') || '');
  let b;
  if (isForm) {
    const f = await request.formData(), cookie = (request.headers.get('cookie') || '').match(/g_csrf_token=([^;]+)/)?.[1];
    if (!cookie || cookie !== f.get('g_csrf_token')) return Response.redirect(new URL('/#signin-error', request.url).toString(), 303);
    b = { credential: f.get('credential') };
  } else { try { b = await request.json(); } catch { return json({ error: 'Bad request' }, 400); } }
  if (!b.credential) return json({ error: 'Missing sign-in' }, 400);
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(b.credential));
  if (!r.ok) return isForm ? Response.redirect(new URL('/#signin-error', request.url).toString(), 303) : json({ error: 'Google could not confirm this sign-in. Please try again.' }, 401);
  const t = await r.json();
  if (t.aud !== env.GOOGLE_CLIENT_ID || !/accounts\.google\.com$/.test(t.iss || '') || +t.exp * 1000 < Date.now() || String(t.email_verified) !== 'true')
    return isForm ? Response.redirect(new URL('/#signin-error', request.url).toString(), 303) : json({ error: 'This sign-in is not valid for EquityClimb.' }, 401);
  const user = { uid: 'g:' + t.sub, email: t.email, name: t.given_name || t.name || '' };
  const token = await makeSession(env, user);
  if (isForm) return Response.redirect(new URL('/#signin=' + encodeURIComponent(token) + '&email=' + encodeURIComponent(user.email), request.url).toString(), 303);
  return json({ token, email: user.email, name: user.name });
}
