// GET /api/config -> public settings the app needs (no secrets).
import { ready } from '../_shared/session.js';
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ googleClientId: env.GOOGLE_CLIENT_ID || '', syncReady: ready(env) }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
