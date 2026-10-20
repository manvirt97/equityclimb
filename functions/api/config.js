// GET /api/config -> public settings the app needs (no secrets; Firebase web keys are designed to be public).
// SIGNIN_PROVIDERS (optional): comma list of extra sign-in buttons, e.g. "microsoft,yahoo,facebook,github,apple,twitter".
// Only list a provider AFTER switching it on in Firebase -> Authentication -> Sign-in method.
import { ready } from '../_shared/session.js';
const ALLOWED = ['microsoft', 'yahoo', 'facebook', 'github', 'apple', 'twitter'];
export async function onRequestGet({ env }) {
  const fb = env.FIREBASE_PROJECT_ID ? { apiKey: env.FIREBASE_API_KEY || '', authDomain: env.FIREBASE_AUTH_DOMAIN || `${env.FIREBASE_PROJECT_ID}.firebaseapp.com`, projectId: env.FIREBASE_PROJECT_ID, appId: env.FIREBASE_APP_ID || '' } : null;
  const providers = String(env.SIGNIN_PROVIDERS || '').toLowerCase().split(',').map(s => s.trim()).filter(p => ALLOWED.includes(p));
  return new Response(JSON.stringify({ googleClientId: '', syncReady: ready(env), firebase: fb, phoneEnabled: String(env.PHONE_SIGNIN || '').toLowerCase() === 'on', providers }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
