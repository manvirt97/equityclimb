// POST /api/auth { firebaseToken } -> checks the Firebase sign-in (Google, email link or phone) and gives the app a 60-day session.
// We never see passwords. We keep only a private account ID; your numbers are encrypted.
import { ready, makeSession, verifyFirebaseToken, json } from '../_shared/session.js';
export async function onRequestPost({ request, env }) {
  if (!ready(env)) return json({ error: 'Sync is not set up yet.' }, 503);
  let b; try { b = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  try {
    const c = await verifyFirebaseToken(env, b.firebaseToken);
    const user = { uid: 'f:' + c.sub, email: c.email || c.phone_number || '', name: c.name || '' };
    return json({ token: await makeSession(env, user), email: user.email, name: user.name });
  } catch (e) { return json({ error: e.message || 'Sign-in failed' }, 401); }
}
