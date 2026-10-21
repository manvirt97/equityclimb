// POST /api/ai-chat { messages, context, model }  ->  { text, followups, model, fallback }
// Same behaviour as the chat mode of /api/ai, plus a choice of free Workers AI models.
// If a chosen model is unavailable or returns nothing, it automatically falls back to the default model.
import { getRules, factSheet } from '../_shared/rules.js';

const MODELS = {
  balanced: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  fast: '@cf/meta/llama-3.1-8b-instruct',
  gemma: '@cf/google/gemma-4-26b-a4b-it',
  mistral: '@cf/mistralai/mistral-small-3.1-24b-instruct',
  gptoss: '@cf/openai/gpt-oss-120b',
  reason: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
};
const BIG = { gptoss: 1800, reason: 1800 };
const GUARD = `You are EquityClimb's money guide. Your purpose: make every person financially smarter, including people who have never studied finance.
How to answer:
- Plain language a 15-year-old understands. Explain any jargon the first time you use it.
- Short: a direct answer first (1-2 sentences), then up to 4 short bullets or a tiny worked example with simple numbers.
- End with ONE practical next step the person can do this week.
- Use the CURRENT FACTS below for any rate, limit or rule. Never use older numbers from memory. If something isn't in the facts or the user's numbers, say you don't know it rather than guessing.
- If the user shared their numbers, use those exact numbers; do not recalculate them differently.
- General education only, not personal advice. For tax, legal or big borrowing decisions, suggest confirming with a licensed professional (CPA, fee-only planner, mortgage broker or lawyer).
- Default to Canadian rules unless the user says otherwise.
After your answer, on the very last line, write exactly: FOLLOWUPS: <question 1> | <question 2> | <question 3>
The follow-ups are short questions (max 9 words) the user would naturally ask next, written in the user's voice.`;

function extractText(r) {
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (typeof r.response === 'string' && r.response) return r.response;
  const c = r.choices && r.choices[0];
  if (c) { const t = (c.message && c.message.content) ?? c.text; if (typeof t === 'string' && t) return t; if (Array.isArray(t)) return t.map(x => (x && x.text) || '').join(''); }
  if (Array.isArray(r.output)) {
    const parts = [];
    for (const o of r.output) {
      if (o && o.type === 'message' && Array.isArray(o.content)) o.content.forEach(x => { if (x && x.text) parts.push(x.text); });
      else if (o && o.type === 'message' && typeof o.content === 'string') parts.push(o.content);
    }
    if (parts.length) return parts.join('');
  }
  if (typeof r.result === 'string') return r.result;
  if (r.result && typeof r.result.response === 'string') return r.result.response;
  return '';
}
const stripThink = t => { let s = String(t || ''); if (s.includes('</think>')) s = s.split('</think>').pop(); return s.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(); };
function splitFollowups(raw) {
  const s = String(raw).trim(), m = s.match(/\n?\s*\**FOLLOW-?UPS?\**\s*:\s*(.+)\s*$/i);
  if (!m) return { text: s, followups: [] };
  const followups = m[1].split('|').map(x => x.replace(/^[\s\-*\d.)"]+|["\s]+$/g, '').trim()).filter(x => x.length > 3 && x.length < 120).slice(0, 3);
  return { text: s.slice(0, m.index).trim(), followups };
}
const reply = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function cacheGet(k) { try { const r = await caches.default.match(k); return r ? await r.json() : null; } catch (_) { return null; } }
async function cachePut(k, d, ttl) { try { await caches.default.put(k, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + ttl } })); } catch (_) { /* optional */ } }

async function run(env, key, system, msgs) {
  const r = await env.AI.run(MODELS[key], { messages: [{ role: 'system', content: system }, ...msgs], max_tokens: BIG[key] || 900, temperature: 0.4 });
  return stripThink(extractText(r));
}

export async function onRequestPost({ request, env }) {
  if (!env.AI) return reply({ error: 'AI is not connected yet. In Cloudflare: your project \u2192 Settings \u2192 Bindings \u2192 Add \u2192 Workers AI, name it AI, then redeploy.' }, 503);
  let b; try { b = await request.json(); } catch (_) { return reply({ error: 'Bad request' }, 400); }
  const key = MODELS[b.model] ? b.model : 'balanced';
  let facts = ''; try { facts = factSheet(await getRules(new Date().getFullYear())); } catch (_) { /* optional */ }
  const ctx = b.context ? `\nThe user's own numbers (shared by the user): ${JSON.stringify(b.context).slice(0, 3000)}` : '';
  const msgs = (b.messages || []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
  if (!msgs.length) return reply({ error: 'Bad request' }, 400);
  const system = `${GUARD}\n\nCURRENT FACTS:\n${facts}${ctx}`;
  const first = msgs.length === 1 && !b.context;
  const ck = first ? `https://equityclimb.internal/ai-chat/v1/${key}/${encodeURIComponent(msgs[0].content.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200))}` : null;
  if (ck) { const hit = await cacheGet(ck); if (hit) return reply(hit); }
  let used = key, fallback = false, text = '', lastErr = null;
  try { text = await run(env, key, system, msgs); } catch (e) { lastErr = e; }
  if (!text && key !== 'balanced') {
    try { text = await run(env, 'balanced', system, msgs); used = 'balanced'; fallback = true; lastErr = null; } catch (e) { lastErr = e; }
  }
  if (!text) {
    const s = String(lastErr || ''), limit = /neuron|quota|limit|429|capacity/i.test(s), reset = new Date(); reset.setUTCHours(24, 0, 0, 0);
    return reply({ error: limit ? 'The free AI allowance for today has been used up.' : 'The AI service is busy right now. Please try again in a minute.', code: limit ? 'limit' : 'busy', resetAt: reset.toISOString(), detail: s.slice(0, 200) }, 502);
  }
  const out = { ...splitFollowups(text), model: used, fallback };
  if (ck && out.text && !fallback) await cachePut(ck, out, 7 * 86400);
  return reply(out);
}
