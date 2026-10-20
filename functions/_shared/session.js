// Sign-in sessions and encryption for phone <-> laptop sync.
// Needs (Cloudflare settings): DB (D1 database binding), SYNC_SECRET (secret text), GOOGLE_CLIENT_ID (variable).
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));

export const ready = env => !!(env.DB && env.SYNC_SECRET && env.GOOGLE_CLIENT_ID);

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
export const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
