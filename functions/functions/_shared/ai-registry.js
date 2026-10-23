/* EquityClimb v15 model registry. No paid provider is used without explicit opt-in.
   'tiers' describe capability, not a claim that three specific products are free. */
const truthy = x => String(x || '').toLowerCase() === 'on';
export const FREE_MODELS = Object.freeze({
  'free:fast': '@cf/meta/llama-3.1-8b-instruct',
  'free:balanced': '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  'free:deep': '@cf/openai/gpt-oss-120b'
});
export const TIERS = Object.freeze(['fast','balanced','advanced']);
export const selectedModel = (env, provider, tier) => {
  if (provider === 'free') {
    const name = tier === 'advanced' ? 'DEEP' : tier.toUpperCase();
    return (env[`CF_AI_MODEL_${name}`] || FREE_MODELS[`free:${tier === 'advanced' ? 'deep' : tier}`] || '').trim();
  }
  return String(env[`${provider === 'openai' ? 'OPENAI' : 'ANTHROPIC'}_MODEL_${tier.toUpperCase()}`] || '').trim();
};
export const paidEnabled = (env, provider) => truthy(env.ENABLE_PAID_AI) &&
  Boolean(provider === 'openai' ? env.OPENAI_API_KEY : provider === 'anthropic' ? env.ANTHROPIC_API_KEY : false);
export const readCatalogue = env => {
  const free = Boolean(env.AI);
  const slots = [
    {id:'auto', label:'Auto · free models', provider:'EquityClimb', tier:'auto', available:free, paid:false},
    {id:'free:fast',label:'Quick · Cloudflare',provider:'Cloudflare Workers AI',tier:'fast',available:free,paid:false},
    {id:'free:balanced',label:'Balanced · Cloudflare',provider:'Cloudflare Workers AI',tier:'balanced',available:free,paid:false},
    {id:'free:deep',label:'Detailed · Cloudflare',provider:'Cloudflare Workers AI',tier:'advanced',available:free,paid:false}
  ];
  for (const [key,provider,label] of [['openai','openai','OpenAI API'],['claude','anthropic','Anthropic Claude API']]) {
    for (const tier of TIERS) {
      const modelId=selectedModel(env, provider, tier);
      slots.push({ id:`${key}:${tier}`,label:`${label} · ${tier}`,provider:label,tier,
        available:paidEnabled(env,provider) && !!modelId,paid:true,
        reason: paidEnabled(env,provider) && modelId ? null : 'Requires owner-configured API key, model and paid-provider opt-in' });
    }
  }
  return { default:'auto',paidProvidersEnabled:truthy(env.ENABLE_PAID_AI),
    slots, notes:'Provider APIs may incur costs. Consumer subscriptions do not supply API access. Microsoft Copilot consumer model choices are not exposed as a general public API. Model upgrades require validation.' };
};
export const classify = text => {
  const t=String(text||'').toLowerCase();
  if (/\b(what is|define|meaning of|simple explanation|hello|hi|thanks|explain briefly)\b/.test(t) && t.length<200) return 'free:fast';
  if (/\b(compare|mortgage|tax|fhsa|rrsp|tfsa|closing|legal|contract|risk|invest|retirement|buy|offer|inspection|loan|amortiz|insurance)\b/.test(t) || t.length>600) return 'free:deep';
  return 'free:balanced';
};
export const selectSlot = (env, requested, lastQuestion) => {
  const desired=String(requested||'auto').slice(0,40);
  const key=desired==='auto' ? classify(lastQuestion) : desired;
  const row=readCatalogue(env).slots.find(x=>x.id===key);
  if (!row || !row.available) return {error:'This model is not configured or available. Choose Auto (free) or ask the app owner to enable the provider.'};
  const [keyProvider,keyTier]=key.split(':');
  return {key, provider: keyProvider==='claude'?'anthropic':keyProvider, tier:keyTier,
    model:selectedModel(env,keyProvider==='claude'?'anthropic':keyProvider,keyTier)};
};
