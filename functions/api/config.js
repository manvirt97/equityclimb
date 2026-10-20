// GET /api/config -> public settings the app needs (no secrets; Firebase web keys are designed to be public).
import { ready } from '../_shared/session.js';
export async function onRequestGet({ env }) {
  const fb = env.FIREBASE_PROJECT_ID ? { apiKey: env.FIREBASE_API_KEY || '', authDomain: env.FIREBASE_AUTH_DOMAIN || `${env.FIREBASE_PROJECT_ID}.firebaseapp.com`, projectId: env.FIREBASE_PROJECT_ID, appId: env.FIREBASE_APP_ID || '' } : null;
  return new Response(JSON.stringify({ googleClientId: '', syncReady: ready(env), firebase: fb, phoneEnabled: String(env.PHONE_SIGNIN || '').toLowerCase() === 'on' }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
