// Sign-in sessions and encryption for phone <-> laptop sync (v7.1: Firebase sign-in - Google, email link, phone).
// Needs (Cloudflare): DB (D1 binding), SYNC_SECRET (secret), FIREBASE_PROJECT_ID + FIREBASE_API_KEY (+ FIREBASE_APP_ID) variables.
const enc = new TextEncoder(), dec = new TextDecoder();
export const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

export const ready = env => !!(env.DB && env.SYNC_SECRET && env.FIREBASE_PROJECT_ID && env.FIREBASE_API_KEY);

async function hmacKey(secret) { return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }

export async function makeSession(env, user) {
  const body = b64u(enc.encode(JSON.stringify({ uid: user.uid, email: user.email, name: user.name || '', exp: Date.now() + 60 * 864e5 })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hmacKey(env.SYNC_SECRET), enc.encode(body)));
  return `${body}.${sig}`;
}
export async function readSession(env, request) {
  const h = request.headers.get('authorization') || '', t = h.replace(/^Bearer\s+/i, '');
  const [body, sig] = t.split('.');
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SYNC_SECRET), unb64u(sig), enc.encode(body));
  if (!ok) return null;
  const s = JSON.parse(dec.decode(unb64u(body)));
  return s.exp > Date.now() ? s : null;
}
async function dataKey(env, uid) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`${env.SYNC_SECRET}::${uid}`));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
export async function seal(env, uid, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await dataKey(env, uid), enc.encode(text));
  return { iv: b64u(iv), data: b64u(ct) };
}
export async function open(env, uid, iv, data) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv) }, await dataKey(env, uid), unb64u(data));
  return dec.decode(pt);
}
export async function ensureTable(env) {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS user_data (uid TEXT PRIMARY KEY, iv TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL)').run();
}

// Checks a Firebase sign-in token with Google's public keys (no secret needed).
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
async function googleKeys(force) {
  const key = 'https://equityclimb.internal/firebase-jwk';
  if (!force) { try { const hit = await caches.default.match(key); if (hit) return await hit.json(); } catch {} }
  const r = await fetch(JWK_URL);
  if (!r.ok) throw Error('Could not reach Google to check sign-in');
  const j = await r.json();
  try { await caches.default.put(key, new Response(JSON.stringify(j), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } })); } catch {}
  return j;
}
export async function verifyFirebaseToken(env, token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw Error('Bad sign-in token');
  const header = JSON.parse(dec.decode(unb64u(parts[0]))), claims = JSON.parse(dec.decode(unb64u(parts[1])));
  if (header.alg !== 'RS256' || !header.kid) throw Error('Bad sign-in token');
  let keys = await googleKeys(false), jwk = (keys.keys || []).find(k => k.kid === header.kid);
  if (!jwk) { keys = await googleKeys(true); jwk = (keys.keys || []).find(k => k.kid === header.kid); }
  if (!jwk) throw Error('Unknown signing key');
  const pub = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pub, unb64u(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
  if (!ok) throw Error('Sign-in signature is not valid');
  const now = Math.floor(Date.now() / 1000), pid = env.FIREBASE_PROJECT_ID;
  if (claims.aud !== pid || claims.iss !== 'https://securetoken.google.com/' + pid) throw Error('Sign-in is for a different app');
  if (!(claims.exp > now) || claims.iat > now + 300 || !claims.sub) throw Error('Sign-in has expired. Please try again.');
  return claims;
}
export const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
