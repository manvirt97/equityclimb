// POST /api/ai  { mode: 'chat' | 'brief' | 'areas', ... }
// Uses Cloudflare Workers AI (binding "AI"). Free daily allowance; no API key needed.
// v7: always given today's date + current Canadian rules (auto-updating), returns follow-up suggestions,
//     answers common general questions from a saved copy to save the free allowance.
import { getRules, factSheet } from '../_shared/rules.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
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

export async function onRequestPost({ request, env }) {
  if (!env.AI) return reply({ error: 'AI is not connected yet. In Cloudflare: your project → Settings → Bindings → Add → Workers AI, name it AI, then redeploy.' }, 503);
  let b; try { b = await request.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  let facts = '';
  try { facts = factSheet(await getRules(new Date().getFullYear())); } catch {}
  const ctx = b.context ? `\nThe user's own numbers (shared by the user): ${JSON.stringify(b.context).slice(0, 3000)}` : '';
  try {
    if (b.mode === 'chat') {
      const msgs = (b.messages || []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
      const first = msgs.length === 1 && !b.context;
      const key = first ? `https://equityclimb.internal/ai/v7/${encodeURIComponent(msgs[0].content.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200))}` : null;
      if (key) { const hit = await cacheGet(key); if (hit) return reply({ ...hit, cached: true }); }
      const r = await env.AI.run(MODEL, { messages: [{ role: 'system', content: `${GUARD}\n\nCURRENT FACTS:\n${facts}${ctx}` }, ...msgs], max_tokens: 900, temperature: 0.4 });
      const parsed = splitFollowups(r.response || '');
      if (key && parsed.text) await cachePut(key, parsed, 7 * 86400);
      return reply(parsed);
    }
    if (b.mode === 'brief') {
      const heads = (b.headlines || []).slice(0, 18).map(h => `- ${h.title} (${h.source})`).join('\n');
      const prompt = `Area: ${b.area}. User goal: ${b.goal}. Live rates: ${JSON.stringify(b.rates)}.
Recent headlines:\n${heads}\n
Write a market brief using ONLY these inputs. Return JSON with keys:
"summary" (2-3 plain-language sentences), "signals" (array of 3-5 objects {"label","direction":"up"|"down"|"steady","note"}),
"outlook" (object {"rates","prices","rents"} each 1 sentence, phrased as a cautious view, not a guarantee),
"actions" (array of 3 short practical steps for this user's goal), "learn" (one sentence teaching a concept from today's news).`;
      return reply(await askJson(env, prompt, facts));
    }
    if (b.mode === 'areas') {
      const prompt = `City: ${b.area}. The user cares about: ${b.priorities || 'balanced'}. Budget note: ${b.budget || 'not given'}.
List 8 well-known neighbourhoods in this city. Return JSON {"neighbourhoods":[{"name","quadrant","vibe","bestFor","housing","priceTier":"$"|"$$"|"$$$"|"$$$$","pros":[2 items],"cons":[2 items],"scores":{"family","commute","walkability","value","nightlife"} each 1-5}],"note"}.
Only include neighbourhoods you are confident exist. Price tier is relative within the city. "note" reminds the user to verify with local listings.`;
      return reply(await askJson(env, prompt, facts));
    }
    return reply({ error: 'Unknown mode' }, 400);
  } catch (e) {
    const s = String(e), limit = /neuron|quota|limit|429|capacity/i.test(s);
    const reset = new Date(); reset.setUTCHours(24, 0, 0, 0);
    return reply({ error: limit ? 'The free AI allowance for today has been used up.' : 'The AI service is busy right now. Please try again in a minute.', code: limit ? 'limit' : 'busy', resetAt: reset.toISOString(), detail: s.slice(0, 200) }, 502);
  }
}

function splitFollowups(raw) {
  const s = String(raw).trim(), m = s.match(/\n?\s*\**FOLLOW-?UPS?\**\s*:\s*(.+)\s*$/i);
  if (!m) return { text: s, followups: [] };
  const followups = m[1].split('|').map(x => x.replace(/^[\s\-*\d.)"]+|["\s]+$/g, '').trim()).filter(x => x.length > 3 && x.length < 120).slice(0, 3);
  return { text: s.slice(0, m.index).trim(), followups };
}
async function askJson(env, prompt, facts) {
  const r = await env.AI.run(MODEL, { messages: [{ role: 'system', content: `${GUARD.split('After your answer')[0]}\nCURRENT FACTS:\n${facts}\nRespond with a single valid JSON object only. No markdown.` }, { role: 'user', content: prompt }], max_tokens: 1800, temperature: 0.2, response_format: { type: 'json_object' } });
  const raw = r.response;
  if (raw && typeof raw === 'object') return raw;
  const s = String(raw || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
  try { return JSON.parse(s.slice(i, j + 1)); } catch { return { error: 'The AI returned an unreadable answer. Please tap Refresh.' }; }
}
async function cacheGet(k) { try { const r = await caches.default.match(k); return r ? await r.json() : null; } catch { return null; } }
async function cachePut(k, d, ttl) { try { await caches.default.put(k, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` } })); } catch {} }
const reply = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
