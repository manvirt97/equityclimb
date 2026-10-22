/* Owner-only model lifecycle audit. This endpoint NEVER auto-switches production models.
   Set AI_ADMIN_AUDIT_TOKEN as a Cloudflare Secret before using it.
   Optional API provider secrets remain server-side. */
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function scan(url,headers){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),6500);
  try {const r=await fetch(url,{headers,signal:c.signal});
    if(!r.ok)return {ok:false,reason:'Model catalog returned HTTP '+r.status};
    const data=await r.json();return {ok:true,models:(data.data||[]).slice(0,100).map(x=>({id:x.id,display_name:x.display_name||x.id,lifecycle:x.lifecycle?.status||null,shutdown_date:x.shutdown_date||null}))};
  }catch{return {ok:false,reason:'Could not retrieve catalog.'};}finally{clearTimeout(t);}
}
export async function onRequestGet({request,env}){
  if(!env.AI_ADMIN_AUDIT_TOKEN)return json({error:'Model audits are not enabled.'},404);
  const h=request.headers.get('authorization')||'';
  if(h!==`Bearer ${env.AI_ADMIN_AUDIT_TOKEN}`)return json({error:'Unauthorized.'},401);
  const out={checkedAt:new Date().toISOString(),automaticUpgrade:false,notes:'This audit only reports model catalog information. Pin, benchmark and approve any production replacement.'};
  if(env.OPENAI_API_KEY)out.openai=await scan('https://api.openai.com/v1/models',{Authorization:'Bearer '+env.OPENAI_API_KEY});
  if(env.ANTHROPIC_API_KEY)out.anthropic=await scan('https://api.anthropic.com/v1/models?limit=100',{'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'});
  return json(out);
}
