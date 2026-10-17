// POST /api/ai  { mode: 'chat' | 'brief' | 'areas', ... }
// Uses Cloudflare Workers AI (binding "AI"). Free daily allowance; no API key needed.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const GUARD = `You are EquityClimb's guide: a calm, plain-language assistant for home owners, buyers and investors.
Rules: be practical and specific; use short paragraphs or bullets; explain jargon; never invent statistics, prices or rates you weren't given -
say "check local listings / your lender" instead; for tax, legal or big borrowing decisions, recommend confirming with a licensed professional (CPA, fee-only planner, mortgage broker or lawyer).
You give general education, not personalized financial advice. Default to Canadian rules unless the user's country says otherwise.`;

export async function onRequestPost({ request, env }) {
  if (!env.AI) return reply({ error: 'AI is not connected yet. In Cloudflare: your project → Settings → Bindings → Add → Workers AI, name it AI, then redeploy.' }, 503);
  let b; try { b = await request.json(); } catch { return reply({ error: 'Bad request' }, 400); }
  const ctx = b.context ? `\nUser context (shared by the user): ${JSON.stringify(b.context).slice(0, 2500)}` : '';
  try {
    if (b.mode === 'chat') {
      const msgs = (b.messages || []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 4000) }));
      const r = await env.AI.run(MODEL, { messages: [{ role: 'system', content: GUARD + ctx }, ...msgs], max_tokens: 900, temperature: 0.4 });
      return reply({ text: r.response || '' });
    }
    if (b.mode === 'brief') {
      const heads = (b.headlines || []).slice(0, 18).map(h => `- ${h.title} (${h.source})`).join('\n');
      const prompt = `Area: ${b.area}. User goal: ${b.goal}. Live rates: ${JSON.stringify(b.rates)}.
Recent headlines:\n${heads}\n
Write a market brief using ONLY these inputs. Return JSON with keys:
"summary" (2-3 sentences), "signals" (array of 3-5 objects {"label","direction":"up"|"down"|"steady","note"}),
"outlook" (object {"rates","prices","rents"} each 1 sentence, phrased as a cautious view, not a guarantee),
"actions" (array of 3 short practical steps for this user's goal).`;
      return reply(await askJson(env, prompt));
    }
    if (b.mode === 'areas') {
      const prompt = `City: ${b.area}. The user cares about: ${b.priorities || 'balanced'}. Budget note: ${b.budget || 'not given'}.
List 8 well-known neighbourhoods in this city. Return JSON {"neighbourhoods":[{"name","quadrant","vibe","bestFor","housing","priceTier":"$"|"$$"|"$$$"|"$$$$","pros":[2 items],"cons":[2 items],"scores":{"family","commute","walkability","value","nightlife"} each 1-5}],"note"}.
Only include neighbourhoods you are confident exist. Price tier is relative within the city. "note" reminds the user to verify with local listings.`;
      return reply(await askJson(env, prompt));
    }
    return reply({ error: 'Unknown mode' }, 400);
  } catch (e) { return reply({ error: 'The AI service is busy or the daily free limit was reached. Try again later.', detail: String(e) }, 502); }
}
async function askJson(env, prompt) {
  const r = await env.AI.run(MODEL, { messages: [{ role: 'system', content: GUARD + '\nRespond with a single valid JSON object only. No markdown.' }, { role: 'user', content: prompt }], max_tokens: 1800, temperature: 0.2, response_format: { type: 'json_object' } });
  const raw = r.response;
  if (raw && typeof raw === 'object') return raw;
  const s = String(raw || ''), i = s.indexOf('{'), j = s.lastIndexOf('}');
  try { return JSON.parse(s.slice(i, j + 1)); } catch { return { error: 'The AI returned an unreadable answer. Please tap Refresh.' }; }
}
const reply = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
