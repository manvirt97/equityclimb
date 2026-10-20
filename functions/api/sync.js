// /api/sync  GET -> your saved data | PUT { data, updated } -> save | DELETE -> erase your cloud copy.
// Data is encrypted (AES-256-GCM) before it is stored, with a key unique to each account.
import { ready, readSession, seal, open, ensureTable, json } from '../_shared/session.js';
const MAX = 900000; // ~0.9 MB per person

export async function onRequest({ request, env }) {
  if (!ready(env)) return json({ error: 'Sync is not set up yet.' }, 503);
  const s = await readSession(env, request).catch(() => null);
  if (!s) return json({ error: 'Please sign in again.', code: 'auth' }, 401);
  await ensureTable(env);
  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT iv, data, updated FROM user_data WHERE uid = ?').bind(s.uid).first();
    if (!row) return json({ data: null, updated: 0 });
    try { return json({ data: JSON.parse(await open(env, s.uid, row.iv, row.data)), updated: row.updated }); }
    catch { return json({ error: 'Saved data could not be read.' }, 500); }
  }
  if (request.method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX) return json({ error: 'Your data is too large to sync. Try clearing old Copilot chats.' }, 413);
    let b; try { b = JSON.parse(text); } catch { return json({ error: 'Bad request' }, 400); }
    if (!b.data || typeof b.data !== 'object') return json({ error: 'Nothing to save' }, 400);
    const updated = Math.min(+b.updated || Date.now(), Date.now() + 60000);
    const box = await seal(env, s.uid, JSON.stringify(b.data));
    await env.DB.prepare('INSERT INTO user_data (uid, iv, data, updated) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(uid) DO UPDATE SET iv = ?2, data = ?3, updated = ?4').bind(s.uid, box.iv, box.data, updated).run();
    return json({ ok: true, updated });
  }
  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM user_data WHERE uid = ?').bind(s.uid).run();
    return json({ ok: true });
  }
  return json({ error: 'Method not allowed' }, 405);
}
